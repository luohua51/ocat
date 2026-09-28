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
  const nickname = String(body.nickname || '').trim() || username;

  if (!username) return Response.json({ ok: false, error: '请输入账号' }, { status: 400 });
  if (password.length < 6) return Response.json({ ok: false, error: '密码至少 6 位' }, { status: 400 });

  const { data: existing } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('username', username)
    .maybeSingle();

  if (existing) {
    return Response.json({ ok: false, error: '该账号已被使用' }, { status: 400 });
  }

  const hash = bcrypt.hashSync(password, 10);

  const { data: created, error } = await supabaseAdmin
    .from('users')
    .insert({
      username,
      password_hash: hash,
      role: 'member',
      nickname,
      must_change_password: false,
      status: 'active',
    })
    .select('id, username, role, nickname')
    .single();

  if (error || !created) {
    return Response.json({ ok: false, error: error?.message || '注册失败' }, { status: 500 });
  }

  setSessionCookie(created.id);

  return Response.json({
    ok: true,
    user: {
      id: created.id,
      username: created.username,
      role: created.role,
      nickname: created.nickname,
      mustChangePassword: false,
    },
    redirect: '/member',
  });
}