import { supabaseAdmin } from '@/lib/supabase-admin';
import { getSessionUser } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  if (!supabaseAdmin) {
    return Response.json({ ok: false, error: '服务器未配置' }, { status: 500 });
  }

  const me = await getSessionUser();
  if (!me) return Response.json({ ok: false, error: '未登录' }, { status: 401 });

  const id = Number(params.id);
  if (!id) return Response.json({ ok: false, error: '参数错误' }, { status: 400 });

  const { data: conv } = await supabaseAdmin
    .from('conversations')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (!conv) {
    return Response.json({ ok: false, error: '会话不存在' }, { status: 404 });
  }

  const isMember = me.role === 'member' && conv.member_user_id === me.id;
  const isPlayer = me.role === 'player' && conv.player_user_id === me.id;
  if (!isMember && !isPlayer) {
    return Response.json({ ok: false, error: '无权查看' }, { status: 403 });
  }

  const { data: messagesDesc } = await supabaseAdmin
    .from('messages')
    .select('*')
    .eq('conversation_id', id)
    .order('created_at', { ascending: false })
    .limit(100);

  const messages = (messagesDesc || []).reverse();

  await supabaseAdmin
    .from('messages')
    .update({ is_read: true })
    .eq('conversation_id', id)
    .eq('is_read', false)
    .neq('sender_id', me.id);

  // 检查是否还能发消息
  let canSend = true;
  if (me.role === 'player') {
    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('status, player_id')
      .eq('id', conv.order_id)
      .maybeSingle();

    if (order && order.player_id && order.player_id !== me.playerId) {
      canSend = false;
    }
  }

  return Response.json({ ok: true, conversation: conv, messages, canSend });
}