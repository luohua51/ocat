import { supabaseAdmin } from '@/lib/supabase-admin';
import { getSessionUser } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

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

  if (!gameId) return Response.json({ ok: false, error: '请选择游戏' }, { status: 400 });
  if (!tier) return Response.json({ ok: false, error: '请选择档位' }, { status: 400 });
  if (!durationHours || durationHours <= 0) {
    return Response.json({ ok: false, error: '请填写时长' }, { status: 400 });
  }

  const isDesignated = !!playerId;

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

  if (isDesignated) {
    // 指定单：从该陪玩的散陪价查
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
    platformFee = baseAmount * 0.02;
    finalAmount = baseAmount;
    playerIncome = baseAmount - platformFee;
  } else {
    // 不指定：价格待定，接单后由陪玩报价
    unitPrice = 0;
    baseAmount = 0;
    platformFee = 0;
    finalAmount = 0;
    playerIncome = 0;
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
    })
    .select('*')
    .single();

  if (error || !created) {
    return Response.json({ ok: false, error: error?.message || '下单失败' }, { status: 500 });
  }

  return Response.json({ ok: true, order: created });
}