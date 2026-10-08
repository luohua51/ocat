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
// POST 获取或创建会话
// - body.orderId：订单会话
// - body.playerId：咨询会话（无订单）
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
  const orderId = body.orderId ? Number(body.orderId) : null;
  const playerIdParam = body.playerId ? Number(body.playerId) : null;

  let memberUserId: number;
  let memberName: string;
  let playerUserId: number;
  let playerName: string;
  let finalOrderId: number | null = null;

  // ========== 场景 A：有订单 ==========
  if (orderId) {
    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .maybeSingle();

    if (!order) {
      return Response.json({ ok: false, error: '订单不存在' }, { status: 404 });
    }

    if (me.role === 'member') {
      if (order.member_id !== me.id) {
        return Response.json({ ok: false, error: '不是你的订单' }, { status: 403 });
      }
      if (!order.player_id) {
        return Response.json({ ok: false, error: '订单还没接单' }, { status: 400 });
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
      if (order.player_id !== me.playerId) {
        return Response.json({ ok: false, error: '不是你的订单' }, { status: 403 });
      }
      memberUserId = order.member_id;
      memberName = order.member_name;
      playerUserId = me.id;
      playerName = me.nickname;
    }
    finalOrderId = orderId;
  }
  // ========== 场景 B：咨询会话 ==========
  else if (playerIdParam) {
    // 只允许会员发起咨询
    if (me.role !== 'member') {
      return Response.json({ ok: false, error: '只有会员可以发起咨询' }, { status: 403 });
    }

    const { data: player } = await supabaseAdmin
      .from('players')
      .select('id, name')
      .eq('id', playerIdParam)
      .maybeSingle();

    if (!player) {
      return Response.json({ ok: false, error: '陪玩不存在' }, { status: 404 });
    }

    const { data: playerUser } = await supabaseAdmin
      .from('users')
      .select('id, nickname')
      .eq('player_id', player.id)
      .maybeSingle();

    if (!playerUser) {
      return Response.json({ ok: false, error: '陪玩账号不存在' }, { status: 404 });
    }

    memberUserId = me.id;
    memberName = me.nickname;
    playerUserId = playerUser.id;
    playerName = playerUser.nickname;
    finalOrderId = null;
  } else {
    return Response.json({ ok: false, error: '缺少参数' }, { status: 400 });
  }

  // ========== 查找已存在的会话 ==========
  let q = supabaseAdmin
    .from('conversations')
    .select('*')
    .eq('member_user_id', memberUserId)
    .eq('player_user_id', playerUserId);

  if (finalOrderId) {
    q = q.eq('order_id', finalOrderId);
  } else {
    q = q.is('order_id', null);
  }

  const { data: existing } = await q.maybeSingle();

  if (existing) {
    return Response.json({ ok: true, conversation: existing });
  }

  // ========== 创建新会话 ==========
  const { data: created, error } = await supabaseAdmin
    .from('conversations')
    .insert({
      order_id: finalOrderId,
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