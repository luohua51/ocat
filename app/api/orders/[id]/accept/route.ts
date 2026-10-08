import { supabaseAdmin } from '@/lib/supabase-admin';
import { getSessionUser } from '@/lib/auth-server';

// ============================================================
// 后端权威折扣计算
// ============================================================
function calcDiscount(baseAmount: number, date = new Date()) {
  const day = date.getDay();
  const isWeekend = day === 0 || day === 6;
  const rate = isWeekend ? 0.85 : 0.95;
  const finalAmount = Number((baseAmount * rate).toFixed(2));
  const discountAmount = Number((baseAmount - finalAmount).toFixed(2));
  return { rate, finalAmount, discountAmount };
}

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  if (!supabaseAdmin) {
    return Response.json({ ok: false, error: '服务器未配置' }, { status: 500 });
  }

  const me = await getSessionUser();
  if (!me) return Response.json({ ok: false, error: '未登录' }, { status: 401 });
  if (me.role !== 'player' || !me.playerId) {
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

  const bossRank = order.boss_rank || null;

  // 1. 查散陪价
  let q = supabaseAdmin
    .from('player_prices')
    .select('price_per_hour')
    .eq('player_id', me.playerId)
    .eq('game_id', order.game_id)
    .eq('tier', order.tier)
    .eq('is_active', true);

  if (bossRank) {
    q = q.eq('boss_rank', bossRank);
  }

  const { data: freelancePrice } = await q.maybeSingle();

  let unitPrice = 0;
  let identityType: 'freelance' | 'shop' = 'freelance';
  let shopId: number | null = null;
  let shopFeeRate = 0;
  let platformFeeRate = 0.02;

  if (freelancePrice) {
    unitPrice = Number(freelancePrice.price_per_hour);
    identityType = 'freelance';
    platformFeeRate = 0.02;
  } else {
    const { data: userInfo } = await supabaseAdmin
      .from('users')
      .select('shop_id')
      .eq('id', me.id)
      .maybeSingle();

    if (!userInfo?.shop_id) {
      return Response.json(
        { ok: false, error: '你没设置该游戏档位的价格，且不属于任何店铺，无法接单' },
        { status: 400 }
      );
    }

    let spq = supabaseAdmin
      .from('shop_prices')
      .select('price_per_hour')
      .eq('shop_id', userInfo.shop_id)
      .eq('game_id', order.game_id)
      .eq('tier', order.tier)
      .eq('is_active', true);

    if (bossRank) {
      spq = spq.eq('boss_rank', bossRank);
    }

    let { data: shopPrice } = await spq.maybeSingle();

    if (!shopPrice) {
      const { data: fallback } = await supabaseAdmin
        .from('shop_prices')
        .select('price_per_hour')
        .eq('shop_id', userInfo.shop_id)
        .eq('game_id', order.game_id)
        .eq('tier', order.tier)
        .eq('boss_rank', '任意')
        .eq('is_active', true)
        .maybeSingle();
      shopPrice = fallback;
    }

    if (!shopPrice) {
      return Response.json(
        {
          ok: false,
          error: `店铺没设置「${order.game_name}·${order.tier}·${bossRank || '通用'}」的价格，无法接单`,
        },
        { status: 400 }
      );
    }

    unitPrice = Number(shopPrice.price_per_hour);
    identityType = 'shop';
    shopId = userInfo.shop_id;
    platformFeeRate = 0.01;

    const { data: commission } = await supabaseAdmin
      .from('shop_commissions')
      .select('rate')
      .eq('shop_id', userInfo.shop_id)
      .eq('tier', order.tier)
      .maybeSingle();

    shopFeeRate = commission ? Number(commission.rate) : 0.15;
  }

  const baseAmount = unitPrice * Number(order.duration_hours);

  // 折扣（后端权威，按接单时间算）
  const d = calcDiscount(baseAmount);
  const finalAmount = d.finalAmount;

  const platformFee = baseAmount * platformFeeRate;
  const shopFee = baseAmount * shopFeeRate;
  const playerIncome = baseAmount - platformFee - shopFee;

  const { data: wallet } = await supabaseAdmin
    .from('wallets')
    .select('balance')
    .eq('user_id', order.member_id)
    .maybeSingle();

  const currentBalance = wallet ? Number(wallet.balance) : 0;
  if (currentBalance < finalAmount) {
    return Response.json(
      {
        ok: false,
        error: `老板余额不足（当前 ¥${currentBalance.toFixed(2)}，需 ¥${finalAmount.toFixed(2)}）`,
      },
      { status: 400 }
    );
  }

  const newBalance = currentBalance - finalAmount;

  const { data: updated, error } = await supabaseAdmin
    .from('orders')
    .update({
      player_id: me.playerId,
      player_name: me.nickname,
      shop_id: shopId,
      identity_type: identityType,
      unit_price: unitPrice,
      base_amount: baseAmount,
      final_amount: finalAmount,
      platform_fee: platformFee,
      shop_fee: shopFee,
      player_income: playerIncome,
      status: 'locked',
      locked_at: new Date().toISOString(),
      paid_at: new Date().toISOString(),
      discount_rate: d.rate,
      discount_amount: d.discountAmount,
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

  await supabaseAdmin
    .from('wallets')
    .update({ balance: newBalance, updated_at: new Date().toISOString() })
    .eq('user_id', order.member_id);

  await supabaseAdmin.from('wallet_transactions').insert({
    user_id: order.member_id,
    type: 'consume',
    amount: finalAmount,
    balance_after: newBalance,
    order_id: orderId,
    description: `订单 ${order.order_no} 已接单扣款${d.discountAmount > 0 ? `（折扣 -¥${d.discountAmount}）` : ''}`,
  });

  await supabaseAdmin
    .from('players')
    .update({ status: 'busy', last_active_at: new Date().toISOString() })
    .eq('id', me.playerId);

  return Response.json({ ok: true, order: updated });
}