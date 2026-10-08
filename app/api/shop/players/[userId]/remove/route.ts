import { supabaseAdmin } from '@/lib/supabase-admin';
import { getSessionUser } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function POST(
  _req: Request,
  { params }: { params: { userId: string } }
) {
  if (!supabaseAdmin) {
    return Response.json({ ok: false, error: '服务器未配置' }, { status: 500 });
  }

  const me = await getSessionUser();
  if (!me) return Response.json({ ok: false, error: '未登录' }, { status: 401 });
  if (me.role !== 'shop_admin' || !me.shopId) {
    return Response.json({ ok: false, error: '仅店长可操作' }, { status: 403 });
  }

  const userId = Number(params.userId);
  if (!userId) {
    return Response.json({ ok: false, error: '参数错误' }, { status: 400 });
  }

  // 校验该用户是本店的陪玩
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id, player_id, shop_id, role')
    .eq('id', userId)
    .maybeSingle();

  if (!user) {
    return Response.json({ ok: false, error: '账号不存在' }, { status: 404 });
  }
  if (user.role !== 'player') {
    return Response.json({ ok: false, error: '不是陪玩账号' }, { status: 400 });
  }
  if (user.shop_id !== me.shopId) {
    return Response.json({ ok: false, error: '不是本店陪玩' }, { status: 403 });
  }

  // 1. 清空 users.shop_id（变散陪）
  const { error: userErr } = await supabaseAdmin
    .from('users')
    .update({ shop_id: null })
    .eq('id', userId);

  if (userErr) {
    console.error('[shop remove] users update error:', userErr);
    return Response.json({ ok: false, error: userErr.message }, { status: 500 });
  }

  // 2. 删除本店对该陪玩的认证
  const { error: certErr } = await supabaseAdmin
    .from('player_shops')
    .delete()
    .eq('player_user_id', userId)
    .eq('shop_id', me.shopId);

  if (certErr) {
    console.error('[shop remove] cert delete error:', certErr);
    return Response.json({ ok: false, error: certErr.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}