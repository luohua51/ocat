import { supabaseAdmin } from '@/lib/supabase-admin';
import { getSessionUser } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

// ============================================================
// GET /api/chat/conversations  会话列表
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

  // 统计每个会话的未读数
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
// POST /api/chat/conversations  获取或创建会话
// 参数：{ otherUserId } 或 { orderId }
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
  let otherUserId: number | null = null;
  let otherName: string | null = null;

  // 如果传了 orderId，从订单推导对方
  if (body.orderId) {
    const orderId = Number(body.orderId);
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
        return Response.json({ ok: false, error: '订单还没接单，暂无陪玩' }, { status: 400 });
      }
      // 找陪玩的 user_id
      const { data: playerUser } = await supabaseAdmin
        .from('users')
        .select('id, nickname')
        .eq('player_id', order.player_id)
        .maybeSingle();
      if (!playerUser) {
        return Response.json({ ok: false, error: '陪玩账号不存在' }, { status: 404 });
      }
      otherUserId = playerUser.id;
      otherName = playerUser.nickname;
    } else {
      // 陪玩
      if (order.player_id !== me.playerId) {
        return Response.json({ ok: false, error: '不是你的订单' }, { status: 403 });
      }
      otherUserId = order.member_id;
      otherName = order.member_name;
    }
  } else if (body.otherUserId) {
    // 直接指定对方 user id
    otherUserId = Number(body.otherUserId);
    const { data: otherUser } = await supabaseAdmin
      .from('users')
      .select('id, nickname, role')
      .eq('id', otherUserId)
      .maybeSingle();
    if (!otherUser) {
      return Response.json({ ok: false, error: '用户不存在' }, { status: 404 });
    }
    otherName = otherUser.nickname;
  } else {
    return Response.json({ ok: false, error: '缺少参数' }, { status: 400 });
  }

  if (!otherUserId || !otherName) {
    return Response.json({ ok: false, error: '无法确定对方' }, { status: 400 });
  }

  // 确定 member_user_id 和 player_user_id
  let memberUserId: number;
  let memberName: string;
  let playerUserId: number;
  let playerName: string;

  if (me.role === 'member') {
    memberUserId = me.id;
    memberName = me.nickname;
    playerUserId = otherUserId;
    playerName = otherName;
  } else {
    memberUserId = otherUserId;
    memberName = otherName;
    playerUserId = me.id;
    playerName = me.nickname;
  }

  // 查找已存在的会话
  const { data: existing } = await supabaseAdmin
    .from('conversations')
    .select('*')
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
      member_user_id: memberUserId,
      member_name: memberName,
      player_user_id: playerUserId,
      player_name: playerName,
    })
    .select('*')
    .single();

  if (error || !created) {
    return Response.json({ ok: false, error: error?.message || '创建会话失败' }, { status: 500 });
  }

  return Response.json({ ok: true, conversation: created });
}