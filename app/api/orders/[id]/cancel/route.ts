import { supabaseAdmin } from '@/lib/supabase-admin';
import { getSessionUser } from '@/lib/auth-server';

export async function POST(
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

  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (!order) return Response.json({ ok: false, error: '订单不存在' }, { status: 404 });

  // 只有会员本人可以撤销
  if (me.role !== 'member' || order.member_id !== me.id) {
    return Response.json({ ok: false, error: '无权撤销' }, { status: 403 });
  }

  // 只有未锁单的状态可以撤销
  if (!['pending_player', 'pooling'].includes(order.status)) {
    return Response.json(
      { ok: false, error: '订单已锁单或已完成，无法撤销' },
      { status: 400 }
    );
  }

  // ============================================================
  // 退款给会员（如果已付款）
  // ============================================================
  const refundAmount = Number(order.final_amount) || 0;
  if (refundAmount > 0) {
    const { data: wallet } = await supabaseAdmin
      .from('wallets')
      .select('balance')
      .eq('user_id', order.member_id)
      .maybeSingle();

    const currentBalance = wallet ? Number(wallet.balance) : 0;
    const newBalance = currentBalance + refundAmount;

    if (!wallet) {
      await supabaseAdmin
        .from('wallets')
        .insert({ user_id: order.member_id, balance: refundAmount });
    } else {
      await supabaseAdmin
        .from('wallets')
        .update({ balance: newBalance, updated_at: new Date().toISOString() })
        .eq('user_id', order.member_id);
    }

    await supabaseAdmin.from('wallet_transactions').insert({
      user_id: order.member_id,
      type: 'refund',
      amount: refundAmount,
      balance_after: newBalance,
      order_id: id,
      description: `订单 ${order.order_no} 撤销退款`,
    });
  }

  // ============================================================
  // 更新订单状态
  // ============================================================
  const { data: updated, error } = await supabaseAdmin
    .from('orders')
    .update({
      status: 'cancelled',
      cancel_reason: '会员主动撤销',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .maybeSingle();

  if (error || !updated) {
    return Response.json({ ok: false, error: error?.message || '撤销失败' }, { status: 500 });
  }

  return Response.json({ ok: true, order: updated });
}

  // 如果已经接了单，撤销后陪玩释放回 online
  if (order.player_id) {
    await supabaseAdmin
      .from('players')
      .update({ status: 'online', last_active_at: new Date().toISOString() })
      .eq('id', order.player_id);
  }