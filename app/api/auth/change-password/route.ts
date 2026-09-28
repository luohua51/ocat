import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getSessionUser } from '@/lib/auth-server';

export async function POST(req: Request) {
  if (!supabaseAdmin) {
    return Response.json({ ok: false, error: '服务器未配置数据库' }, { status: 500 });
  }

  const me = await getSessionUser();
  if (!me) return Response.json({ ok: false, error: '未登录' }, { status: 401 });

  const body = await req.json();
  const oldPassword = String(body.oldPassword || '');
  const newPassword = String(body.newPassword || '');

  if (newPassword.length < 6) {
    return Response.json({ ok: false, error: '新密码至少 6 位' }, { status: 400 });
  }

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('password_hash')
    .eq('id', me.id)
    .single();

  if (!user) return Response.json({ ok: false, error: '账号不存在' }, { status: 404 });

  if (!bcrypt.compareSync(oldPassword, user.password_hash)) {
    return Response.json({ ok: false, error: '原密码错误' }, { status: 400 });
  }

  const newHash = bcrypt.hashSync(newPassword, 10);

  const { error } = await supabaseAdmin
    .from('users')
    .update({ password_hash: newHash, must_change_password: false })
    .eq('id', me.id);

  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });

  return Response.json({ ok: true });
}