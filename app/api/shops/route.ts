import { supabaseAdmin } from '@/lib/supabase-admin';
import { getSessionUser } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

// GET /api/shops  列表
export async function GET() {
  if (!supabaseAdmin) {
    return Response.json({ ok: false, error: '服务器未配置' }, { status: 500 });
  }

  const me = await getSessionUser();
  if (!me) return Response.json({ ok: false, error: '未登录' }, { status: 401 });

  let q = supabaseAdmin.from('shops').select('*').order('id', { ascending: true });

  if (me.role === 'shop_admin') {
    q = q.eq('id', me.shopId);
  } else if (me.role !== 'super_admin') {
    return Response.json({ ok: false, error: '无权查看' }, { status: 403 });
  }

  const { data, error } = await q;
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });

  const shops = data || [];

  const enriched = await Promise.all(
    shops.map(async (s) => {
      const { count: playerCount } = await supabaseAdmin!
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'player')
        .eq('shop_id', s.id);

      // 改成取一条（避免多条时 maybeSingle 报错）
      const { data: admins } = await supabaseAdmin!
        .from('users')
        .select('id, username, nickname')
        .eq('role', 'shop_admin')
        .eq('shop_id', s.id)
        .order('id', { ascending: true })
        .limit(1);

      const admin = admins && admins.length > 0 ? admins[0] : null;

      return { ...s, playerCount: playerCount || 0, admin };
    })
  );

  return Response.json({ ok: true, shops: enriched });
}

// POST /api/shops  创建店铺（仅超管）
export async function POST(req: Request) {
  if (!supabaseAdmin) {
    return Response.json({ ok: false, error: '服务器未配置' }, { status: 500 });
  }

  const me = await getSessionUser();
  if (!me) return Response.json({ ok: false, error: '未登录' }, { status: 401 });
  if (me.role !== 'super_admin') {
    return Response.json({ ok: false, error: '仅超管可创建店铺' }, { status: 403 });
  }

  const body = await req.json();
  const name = String(body.name || '').trim();
  const description = String(body.description || '').trim();
  const adminName = String(body.adminName || '').trim();
  const adminAccount = String(body.adminAccount || '').trim();

  if (!name) return Response.json({ ok: false, error: '请输入店铺名' }, { status: 400 });
  if (!adminAccount) return Response.json({ ok: false, error: '请输入店长账号' }, { status: 400 });

  const { data: existingShop } = await supabaseAdmin
    .from('shops')
    .select('id')
    .eq('name', name)
    .maybeSingle();
  if (existingShop) {
    return Response.json({ ok: false, error: '店铺名已存在' }, { status: 400 });
  }

  const { data: existingUser } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('username', adminAccount)
    .maybeSingle();
  if (existingUser) {
    return Response.json({ ok: false, error: '店长账号已被使用' }, { status: 400 });
  }

  const { data: shop, error: shopErr } = await supabaseAdmin
    .from('shops')
    .insert({ name, description, status: 'active' })
    .select('*')
    .single();

  if (shopErr || !shop) {
    return Response.json({ ok: false, error: shopErr?.message || '创建店铺失败' }, { status: 500 });
  }

  const bcrypt = require('bcryptjs');
  const hash = bcrypt.hashSync('123456', 10);

  const { error: userErr } = await supabaseAdmin.from('users').insert({
    username: adminAccount,
    password_hash: hash,
    role: 'shop_admin',
    nickname: adminName || name + '店长',
    shop_id: shop.id,
    must_change_password: true,
    status: 'active',
  });

  if (userErr) {
    await supabaseAdmin.from('shops').delete().eq('id', shop.id);
    return Response.json({ ok: false, error: userErr.message }, { status: 500 });
  }

  return Response.json({ ok: true, shop });
}