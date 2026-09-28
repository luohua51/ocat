import { supabaseAdmin } from '@/lib/supabase-admin';
import { getSessionUser } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

// ============================================================
// GET 会话列表
// ============================================================
export async function GET() {
  if (!supabaseAdmin) {
    return Response.json({ ok: false, error: '服务器未配置' }, { status: 500 });
  }

  const me = await getSessionUser();
  if (!me) return Response.json({ ok: false, error: '未登录' }, { status: 401 });
  if (me.role !== 'member' && me.role !== 'player') {
    return Response.json({ ok: false, error: '无权查看' }, { status: 403 });
  }

  const field = me.role === 'member' ? 'member_user_id' : 'player_user_id';

  const { data: conversations, error } = await supabaseAdmin
    .from('conversations')
    .select('*')
    .eq(field, me.id)
    .order('last_message_at', { ascending: false, nullsFirst: false });

  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });

  const withUnread = await Promise.all(
    (conversations || []).map(async (c) => {
      const { count } = await supabaseAdmin!
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', c.id)
        .eq('is_read', false)
        .neq('sender_id', me.id);
      return { ...c, unreadCount: count || 0 };
    })
  );

  return Response.json({ ok: true, conversations: withUnread });
}

// ============================================================
// POST 获取或创建会话（必须传 orderId）
// ============================================================
export async function POST(req: Request) {
  if (!supabaseAdmin) {
    return Response.json({ ok: false, error: '服务器未配置' }, { status: 500 });
  }

  const me = await getSessionUser();
  if (!me) return Response.json({ ok: false, error: '未登录' }, { status: 401 });
  if (me.role !== 'member' && me.role !== 'player') {
    return Response.json({ ok: false, error: '仅会员和陪玩可用' }, { status: 403 });
  }

  const body = await req.json();
  const orderId = Number(body.orderId);
  if (!orderId) {
    return Response.json({ ok: false, error: '缺少订单 ID' }, { status: 400 });
  }

  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .maybeSingle();

  if (!order) {
    return Response.json({ ok: false, error: '订单不存在' }, { status: 404 });
  }

  let memberUserId: number;
  let memberName: string;
  let playerUserId: number;
  let playerName: string;

  if (me.role === 'member') {
    // 会员发起：订单必须是自己的
    if (order.member_id !== me.id) {
      return Response.json({ ok: false, error: '不是你的订单' }, { status: 403 });
    }
    // 必须有陪玩接了（或指定）
    if (!order.player_id) {
      return Response.json(
        { ok: false, error: '订单还没接单，暂无陪玩' },
        { status: 400 }
      );
    }
    const { data: playerUser } = await supabaseAdmin
      .from('users')
      .select('id, nickname')
      .eq('player_id', order.player_id)
      .maybeSingle();
    if (!playerUser) {
      return Response.json({ ok: false, error: '陪玩账号不存在' }, { status: 404 });
    }
    memberUserId = order.member_id;
    memberName = order.member_name;
    playerUserId = playerUser.id;
    playerName = playerUser.nickname;
  } else {
    // 陪玩发起
    // 1. 如果订单已锁单，只有接单陪玩能聊
    if (order.player_id && order.player_id !== me.playerId) {
      return Response.json(
        { ok: false, error: '该订单已被其他陪玩接走，无法联系' },
        { status: 403 }
      );
    }
    // 2. 订单必须是 pooling 或 已被自己接
    if (
      order.status !== 'pooling' &&
      order.player_id !== me.playerId
    ) {
      return Response.json(
        { ok: false, error: '该订单当前不可联系' },
        { status: 400 }
      );
    }
    memberUserId = order.member_id;
    memberName = order.member_name;
    playerUserId = me.id;
    playerName = me.nickname;
  }

  // 查找已有会话
  const { data: existing } = await supabaseAdmin
    .from('conversations')
    .select('*')
    .eq('order_id', orderId)
    .eq('member_user_id', memberUserId)
    .eq('player_user_id', playerUserId)
    .maybeSingle();

  if (existing) {
    return Response.json({ ok: true, conversation: existing });
  }

  // 创建新会话
  const { data: created, error } = await supabaseAdmin
    .from('conversations')
    .insert({
      order_id: orderId,
      member_user_id: memberUserId,
      member_name: memberName,
      player_user_id: playerUserId,
      player_name: playerName,
    })
    .select('*')
    .single();

  if (error || !created) {
    return Response.json(
      { ok: false, error: error?.message || '创建会话失败' },
      { status: 500 }
    );
  }

  return Response.json({ ok: true, conversation: created });
}