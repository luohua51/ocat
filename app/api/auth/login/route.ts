import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { setSessionCookie } from '@/lib/auth-server';

export async function POST(req: Request) {
  if (!supabaseAdmin) {
    return Response.json({ ok: false, error: '服务器未配置数据库' }, { status: 500 });
  }

  const body = await req.json();
  const username = String(body.username || '').trim();
  const password = String(body.password || '');

  if (!username || !password) {
    return Response.json({ ok: false, error: '请输入账号和密码' }, { status: 400 });
  }

  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('id, username, password_hash, role, nickname, player_id, shop_id, must_change_password, status')
    .eq('username', username)
    .maybeSingle();

  if (error || !user) {
    return Response.json({ ok: false, error: '账号或密码错误' }, { status: 401 });
  }

  if (user.status !== 'active') {
    return Response.json({ ok: false, error: '账号已被封禁' }, { status: 403 });
  }

  if (!bcrypt.compareSync(password, user.password_hash)) {
    return Response.json({ ok: false, error: '账号或密码错误' }, { status: 401 });
  }

  setSessionCookie(user.id);

  const roleHome: Record<string, string> = {
    super_admin: '/admin',
    shop_admin: '/shop',
    player: '/player',
    member: '/member',
  };

  return Response.json({
    ok: true,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      nickname: user.nickname,
      playerId: user.player_id ?? undefined,
      shopId: user.shop_id ?? undefined,
      mustChangePassword: user.must_change_password,
    },
    redirect: roleHome[user.role] || '/',
  });
}