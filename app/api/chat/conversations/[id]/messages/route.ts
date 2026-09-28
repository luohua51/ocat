import { supabaseAdmin } from '@/lib/supabase-admin';
import { getSessionUser } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

// ============================================================
// GET 拉新消息（轮询用）
// 参数：?since=<message_id>
// ============================================================
export async function GET(
  req: Request,
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

  if (!conv) return Response.json({ ok: false, error: '会话不存在' }, { status: 404 });

  const isMember = me.role === 'member' && conv.member_user_id === me.id;
  const isPlayer = me.role === 'player' && conv.player_user_id === me.id;
  if (!isMember && !isPlayer) {
    return Response.json({ ok: false, error: '无权查看' }, { status: 403 });
  }

  const url = new URL(req.url);
  const since = Number(url.searchParams.get('since') || 0);

  let q = supabaseAdmin
    .from('messages')
    .select('*')
    .eq('conversation_id', id)
    .order('created_at', { ascending: true })
    .limit(50);

  if (since > 0) {
    q = q.gt('id', since);
  }

  const { data } = await q;

  // 标记已读
  await supabaseAdmin
    .from('messages')
    .update({ is_read: true })
    .eq('conversation_id', id)
    .eq('is_read', false)
    .neq('sender_id', me.id);

  return Response.json({ ok: true, messages: data || [] });
}

// ============================================================
// POST 发消息
// ============================================================
export async function POST(
  req: Request,
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

  if (!conv) return Response.json({ ok: false, error: '会话不存在' }, { status: 404 });

  const isMember = me.role === 'member' && conv.member_user_id === me.id;
  const isPlayer = me.role === 'player' && conv.player_user_id === me.id;
  if (!isMember && !isPlayer) {
    return Response.json({ ok: false, error: '无权操作' }, { status: 403 });
  }

  const body = await req.json();
  const content = String(body.content || '').trim();
  const type = String(body.type || 'text');
  const orderId = body.orderId ? Number(body.orderId) : null;

  if (type === 'text' && !content) {
    return Response.json({ ok: false, error: '消息不能为空' }, { status: 400 });
  }

  const { data: created, error } = await supabaseAdmin
    .from('messages')
    .insert({
      conversation_id: id,
      sender_id: me.id,
      sender_role: me.role,
      sender_name: me.nickname,
      type,
      content: content || null,
      order_id: orderId,
      is_read: false,
    })
    .select('*')
    .single();

  if (error || !created) {
    return Response.json({ ok: false, error: error?.message || '发送失败' }, { status: 500 });
  }

  // 更新会话的最后消息
  const preview = type === 'order_card' ? '[订单卡片]' : (content.slice(0, 50) || '');

  await supabaseAdmin
    .from('conversations')
    .update({
      last_message: preview,
      last_message_at: new Date().toISOString(),
    })
    .eq('id', id);

  return Response.json({ ok: true, message: created });
}