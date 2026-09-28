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
  if (me.role !== 'player') {
    return Response.json({ ok: false, error: '仅陪玩可接单' }, { status: 403 });
  }

  const orderId = Number(params.id);
  if (!orderId) return Response.json({ ok: false, error: '参数错误' }, { status: 400 });

  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .maybeSingle();

  if (!order) return Response.json({ ok: false, error: '订单不存在' }, { status: 404 });
  if (order.status !== 'pooling') {
    return Response.json({ ok: false, error: '该订单已被接走或已取消' }, { status: 400 });
  }
  if (order.player_id) {
    return Response.json({ ok: false, error: '该订单已被接走' }, { status: 400 });
  }

  const { data: price } = await supabaseAdmin
    .from('player_prices')
    .select('price_per_hour')
    .eq('player_id', me.playerId)
    .eq('game_id', order.game_id)
    .eq('tier', order.tier)
    .eq('is_active', true)
    .maybeSingle();

  if (!price) {
    return Response.json(
      { ok: false, error: '你没有设置此游戏档位的散陪价，无法接单' },
      { status: 400 }
    );
  }

  const unitPrice = Number(price.price_per_hour);
  const baseAmount = unitPrice * Number(order.duration_hours);
  const platformFee = baseAmount * 0.02;
  const playerIncome = baseAmount - platformFee;

  const { data: wallet } = await supabaseAdmin
    .from('wallets')
    .select('balance')
    .eq('user_id', order.member_id)
    .maybeSingle();

  const currentBalance = wallet ? Number(wallet.balance) : 0;
  if (currentBalance < baseAmount) {
    return Response.json(
      { ok: false, error: `老板余额不足（当前 ¥${currentBalance.toFixed(2)}，需 ¥${baseAmount.toFixed(2)}）` },
      { status: 400 }
    );
  }

  const newBalance = currentBalance - baseAmount;

  const { data: updated, error } = await supabaseAdmin
    .from('orders')
    .update({
      player_id: me.playerId,
      player_name: me.nickname,
      unit_price: unitPrice,
      base_amount: baseAmount,
      final_amount: baseAmount,
      platform_fee: platformFee,
      player_income: playerIncome,
      status: 'locked',
      locked_at: new Date().toISOString(),
      paid_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .eq('status', 'pooling')
    .is('player_id', null)
    .select('*')
    .maybeSingle();

  if (error || !updated) {
    return Response.json(
      { ok: false, error: '手慢了，订单已被其他陪玩接走' },
      { status: 409 }
    );
  }

  // 扣款 + 记流水
  await supabaseAdmin
    .from('wallets')
    .update({ balance: newBalance, updated_at: new Date().toISOString() })
    .eq('user_id', order.member_id);

  await supabaseAdmin.from('wallet_transactions').insert({
    user_id: order.member_id,
    type: 'consume',
    amount: baseAmount,
    balance_after: newBalance,
    order_id: orderId,
    description: `订单 ${order.order_no} 已接单扣款`,
  });

  // 陪玩状态 → busy
  await supabaseAdmin
    .from('players')
    .update({ status: 'busy', last_active_at: new Date().toISOString() })
    .eq('id', me.playerId);

  return Response.json({ ok: true, order: updated });
}