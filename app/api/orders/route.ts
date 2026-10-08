import { supabaseAdmin } from '@/lib/supabase-admin';
import { getSessionUser } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

// ============================================================
// 后端权威折扣计算（不能信前端）
// ============================================================
function calcDiscount(baseAmount: number, date = new Date()) {
  const day = date.getDay();
  const isWeekend = day === 0 || day === 6;
  const rate = isWeekend ? 0.85 : 0.95;
  const finalAmount = Number((baseAmount * rate).toFixed(2));
  const discountAmount = Number((baseAmount - finalAmount).toFixed(2));
  return { rate, finalAmount, discountAmount };
}

// ============================================================
// GET /api/orders  列表
// ============================================================
export async function GET() {
  if (!supabaseAdmin) {
    return Response.json({ ok: false, error: '服务器未配置' }, { status: 500 });
  }

  const me = await getSessionUser();
  if (!me) return Response.json({ ok: false, error: '未登录' }, { status: 401 });

  let q = supabaseAdmin.from('orders').select('*').order('created_at', { ascending: false });

  if (me.role === 'member') {
    q = q.eq('member_id', me.id);
  } else if (me.role === 'player') {
    q = q.eq('player_id', me.playerId);
  } else if (me.role === 'shop_admin') {
    q = q.eq('shop_id', me.shopId);
  }

  const { data, error } = await q.limit(200);
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });

  return Response.json({ ok: true, orders: data || [] });
}

// ============================================================
// POST /api/orders  创建订单
// ============================================================
export async function POST(req: Request) {
  if (!supabaseAdmin) {
    return Response.json({ ok: false, error: '服务器未配置' }, { status: 500 });
  }

  const me = await getSessionUser();
  if (!me) return Response.json({ ok: false, error: '请先登录' }, { status: 401 });
  if (me.role !== 'member') {
    return Response.json({ ok: false, error: '仅会员可下单' }, { status: 403 });
  }

  const body = await req.json();
  const playerId = body.playerId ? Number(body.playerId) : null;
  const gameId = Number(body.gameId);
  const tier = String(body.tier || '');
  const bossRank = String(body.bossRank || '');
  const durationHours = Number(body.durationHours);
  const identityType = String(body.identityType || 'freelance');
  const remark = String(body.remark || '');
  const scheduledTime: string | null = body.scheduledTime || null;

  if (!gameId) return Response.json({ ok: false, error: '请选择游戏' }, { status: 400 });
  if (!tier) return Response.json({ ok: false, error: '请选择档位' }, { status: 400 });
  if (!durationHours || durationHours <= 0) {
    return Response.json({ ok: false, error: '请填写时长' }, { status: 400 });
  }

  const isDesignated = !!playerId;
  const orderType: 'instant' | 'scheduled' = scheduledTime ? 'scheduled' : 'instant';

  // 查陪玩（指定单才查）
  let player: any = null;
  if (isDesignated) {
    const { data } = await supabaseAdmin
      .from('players')
      .select('id, name, avatar, tier')
      .eq('id', playerId)
      .maybeSingle();
    player = data;
    if (!player) {
      return Response.json({ ok: false, error: '陪玩不存在' }, { status: 404 });
    }
  }

  // 查游戏名
  const { data: game } = await supabaseAdmin
    .from('games')
    .select('id, name')
    .eq('id', gameId)
    .maybeSingle();
  if (!game) return Response.json({ ok: false, error: '游戏不存在' }, { status: 404 });

  // 价格计算
  let unitPrice = 0;
  let shopId: number | null = null;
  let shopFee = 0;
  let baseAmount = 0;
  let platformFee = 0;
  let finalAmount = 0;
  let playerIncome = 0;
  let discountRate = 1;
  let discountAmount = 0;

  if (isDesignated) {
    const { data: price } = await supabaseAdmin
      .from('player_prices')
      .select('price_per_hour')
      .eq('player_id', playerId!)
      .eq('game_id', gameId)
      .eq('tier', tier)
      .eq('is_active', true)
      .maybeSingle();

    if (!price) {
      return Response.json({ ok: false, error: '该陪玩未设置此档位价格' }, { status: 400 });
    }
    unitPrice = Number(price.price_per_hour);
    baseAmount = unitPrice * durationHours;

    // 折扣（后端权威）
    const d = calcDiscount(baseAmount);
    discountRate = d.rate;
    discountAmount = d.discountAmount;
    finalAmount = d.finalAmount;

    // 平台抽成按折后价算，陪玩收入 = 折后价 - 平台抽成
    platformFee = finalAmount * 0.02;
    playerIncome = finalAmount - platformFee;
  } else {
    // 抢单池：陪玩接单时才计算价格，这里先占位
    unitPrice = 0;
    baseAmount = 0;
    platformFee = 0;
    finalAmount = 0;
    playerIncome = 0;
    discountRate = 1;
    discountAmount = 0;
  }

  // 指定单：扣会员余额（按折后价扣）
  if (isDesignated && finalAmount > 0) {
    const { data: wallet } = await supabaseAdmin
      .from('wallets')
      .select('balance')
      .eq('user_id', me.id)
      .maybeSingle();

    const currentBalance = wallet ? Number(wallet.balance) : 0;
    if (currentBalance < finalAmount) {
      return Response.json(
        {
          ok: false,
          error: `余额不足（当前 ¥${currentBalance.toFixed(2)}，需 ¥${finalAmount.toFixed(2)}）`,
        },
        { status: 400 }
      );
    }

    const newBalance = currentBalance - finalAmount;
    await supabaseAdmin
      .from('wallets')
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq('user_id', me.id);

    await supabaseAdmin.from('wallet_transactions').insert({
      user_id: me.id,
      type: 'consume',
      amount: finalAmount,
      balance_after: newBalance,
      description: `下单 - ${game.name} · ${tier}${discountAmount > 0 ? `（折扣 -¥${discountAmount}）` : ''}`,
    });
  }

  const orderNo = 'OC' + Date.now();
  const status = isDesignated ? 'pending_player' : 'pooling';

  const { data: created, error } = await supabaseAdmin
    .from('orders')
    .insert({
      order_no: orderNo,
      member_id: me.id,
      member_name: me.nickname,
      player_id: player?.id || null,
      player_name: player?.name || null,
      shop_id: shopId,
      identity_type: identityType,
      game_id: gameId,
      game_name: game.name,
      tier,
      boss_rank: bossRank,
      duration_hours: durationHours,
      unit_price: unitPrice,
      base_amount: baseAmount,
      final_amount: finalAmount,
      platform_fee: platformFee,
      shop_fee: shopFee,
      player_income: playerIncome,
      status,
      is_designated: isDesignated,
      paid_at: isDesignated ? new Date().toISOString() : null,
      remark,
      // 新增
      discount_rate: discountRate,
      discount_amount: discountAmount,
      order_type: orderType,
      scheduled_at: scheduledTime,
    })
    .select('*')
    .single();

  if (error || !created) {
    return Response.json({ ok: false, error: error?.message || '下单失败' }, { status: 500 });
  }

  return Response.json({ ok: true, order: created });
}