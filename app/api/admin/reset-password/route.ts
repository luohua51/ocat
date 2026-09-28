import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getSessionUser } from '@/lib/auth-server';

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
  const userId = Number(body.userId);
  if (!userId) return Response.json({ ok: false, error: '缺少 userId' }, { status: 400 });

  if (me.role === 'shop_admin') {
    const { data: target } = await supabaseAdmin
      .from('users')
      .select('role, shop_id')
      .eq('id', userId)
      .maybeSingle();

    if (!target || target.role !== 'player' || target.shop_id !== me.shopId) {
      return Response.json({ ok: false, error: '只能重置本店陪玩密码' }, { status: 403 });
    }
  }

  const hash = bcrypt.hashSync('123456', 10);

  const { error } = await supabaseAdmin
    .from('users')
    .update({ password_hash: hash, must_change_password: true })
    .eq('id', userId);

  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });

  return Response.json({ ok: true });
}