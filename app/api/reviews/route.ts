import { supabaseAdmin } from '@/lib/supabase-admin';
import { getSessionUser } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

// ============================================================
// POST /api/reviews  提交评价
// ============================================================
export async function POST(req: Request) {
  if (!supabaseAdmin) {
    return Response.json({ ok: false, error: '服务器未配置' }, { status: 500 });
  }

  const me = await getSessionUser();
  if (!me) return Response.json({ ok: false, error: '未登录' }, { status: 401 });
  if (me.role !== 'member' && me.role !== 'player') {
    return Response.json({ ok: false, error: '只有会员和陪玩可评价' }, { status: 403 });
  }

  const body = await req.json();
  const orderId = Number(body.orderId);
  const rating = Number(body.rating);
  const content = String(body.content || '').trim();
  const tags = Array.isArray(body.tags) ? body.tags : [];
  const isAnonymous = !!body.isAnonymous;

  if (!orderId) return Response.json({ ok: false, error: '缺少订单' }, { status: 400 });
  if (!rating || rating < 1 || rating > 5) {
    return Response.json({ ok: false, error: '评分 1-5' }, { status: 400 });
  }

  // 查订单
  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .maybeSingle();

  if (!order) return Response.json({ ok: false, error: '订单不存在' }, { status: 404 });
  if (order.status !== 'completed' && order.status !== 'reviewed') {
    return Response.json({ ok: false, error: '订单未完成，不能评价' }, { status: 400 });
  }

  // 判断评价方向
  let toUserId: number;
  let toRole: string;
  let toName: string;

  if (me.role === 'member') {
    if (order.member_id !== me.id) {
      return Response.json({ ok: false, error: '不是你的订单' }, { status: 403 });
    }
    // 会员评陪玩：找陪玩的 user_id
    const { data: playerUser } = await supabaseAdmin
      .from('users')
      .select('id, nickname')
      .eq('player_id', order.player_id)
      .maybeSingle();

    if (!playerUser) {
      return Response.json({ ok: false, error: '陪玩账号不存在' }, { status: 404 });
    }
    toUserId = playerUser.id;
    toRole = 'player';
    toName = order.player_name || playerUser.nickname;
  } else {
    // 陪玩评会员
    if (order.player_id !== me.playerId) {
      return Response.json({ ok: false, error: '不是你的订单' }, { status: 403 });
    }
    toUserId = order.member_id;
    toRole = 'member';
    toName = order.member_name;
  }

  // 检查是否已评过
  const { data: existing } = await supabaseAdmin
    .from('reviews')
    .select('id')
    .eq('order_id', orderId)
    .eq('from_user_id', me.id)
    .maybeSingle();

  if (existing) {
    return Response.json({ ok: false, error: '你已经评价过了' }, { status: 400 });
  }

  // 插入评价
  const { data: created, error } = await supabaseAdmin
    .from('reviews')
    .insert({
      order_id: orderId,
      from_user_id: me.id,
      from_role: me.role,
      from_name: me.nickname,
      to_user_id: toUserId,
      to_role: toRole,
      to_name: toName,
      rating,
      tags,
      content,
      is_anonymous: isAnonymous,
    })
    .select('*')
    .single();

  if (error || !created) {
    return Response.json({ ok: false, error: error?.message || '评价失败' }, { status: 500 });
  }

  // 检查双方是否都评过了
  const { count } = await supabaseAdmin
    .from('reviews')
    .select('*', { count: 'exact', head: true })
    .eq('order_id', orderId);

  if ((count || 0) >= 2) {
    await supabaseAdmin
      .from('orders')
      .update({ status: 'reviewed' })
      .eq('id', orderId);
  }

  // 更新陪玩的平均分（如果是评价陪玩）
  if (toRole === 'player' && order.player_id) {
    const { data: allRatings } = await supabaseAdmin
      .from('reviews')
      .select('rating')
      .eq('to_user_id', toUserId)
      .eq('to_role', 'player');

    if (allRatings && allRatings.length > 0) {
      const avg = allRatings.reduce((s, r) => s + r.rating, 0) / allRatings.length;
      const avgPercent = Math.round(avg * 20); // 1-5 转 20-100
      await supabaseAdmin
        .from('players')
        .update({ rating: avgPercent })
        .eq('id', order.player_id);
    }
  }

  return Response.json({ ok: true, review: created });
}