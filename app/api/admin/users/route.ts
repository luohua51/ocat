import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getSessionUser } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  if (!supabaseAdmin) {
    return Response.json({ ok: false, error: '服务器未配置' }, { status: 500 });
  }

  const me = await getSessionUser();
  if (!me) return Response.json({ ok: false, error: '未登录' }, { status: 401 });

  const url = new URL(req.url);
  const role = url.searchParams.get('role');
  const shopIdParam = url.searchParams.get('shopId');

  let q = supabaseAdmin
    .from('users')
    .select('id, username, role, nickname, player_id, shop_id, must_change_password, status, created_at')
    .order('id', { ascending: true });

  if (role) q = q.eq('role', role);

  // 店长只能看本店
  if (me.role === 'shop_admin') {
    q = q.eq('shop_id', me.shopId);
  } else if (shopIdParam) {
    q = q.eq('shop_id', Number(shopIdParam));
  }

  const { data, error } = await q;
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });

  return Response.json({ ok: true, users: data || [] });
}

export async function POST(req: Request) {
  if (!supabaseAdmin) {
    return Response.json({ ok: false, error: '服务器未配置' }, { status: 500 });
  }

  const me = await getSessionUser();
  if (!me) return Response.json({ ok: false, error: '未登录' }, { status: 401 });
  if (me.role !== 'super_admin' && me.role !== 'shop_admin') {
    return Response.json({ ok: false, error: '无权操作' }, { status: 403 });
  }

  const body = await req.json();
  const username = String(body.username || '').trim();
  const nickname = String(body.nickname || '').trim();
  const role = String(body.role || 'player');
  const playerId = body.playerId ? Number(body.playerId) : null;

  if (!username) return Response.json({ ok: false, error: '请输入账号' }, { status: 400 });
  if (!nickname) return Response.json({ ok: false, error: '请输入昵称' }, { status: 400 });

  // 店长只能创建陪玩，且固定绑到自己店铺
  let shopId: number | null = null;
  if (me.role === 'shop_admin') {
    if (role !== 'player') {
      return Response.json({ ok: false, error: '店长只能创建陪玩' }, { status: 403 });
    }
    shopId = me.shopId || null;
  } else {
    shopId = body.shopId ? Number(body.shopId) : null;
  }

  // 检查账号
  const { data: existing } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('username', username)
    .maybeSingle();
  if (existing) {
    return Response.json({ ok: false, error: '该账号已被使用' }, { status: 400 });
  }

  const hash = bcrypt.hashSync('123456', 10);

  const { data: created, error } = await supabaseAdmin
    .from('users')
    .insert({
      username,
      password_hash: hash,
      role,
      nickname,
      player_id: playerId,
      shop_id: shopId,
      must_change_password: true,
      status: 'active',
    })
    .select('id, username, role, nickname, shop_id')
    .single();

  if (error || !created) {
    return Response.json({ ok: false, error: error?.message || '创建失败' }, { status: 500 });
  }

  return Response.json({ ok: true, user: created });
}