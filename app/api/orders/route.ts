import { supabaseAdmin } from '@/lib/supabase-admin';
import { getSessionUser } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

// ============================================================
// GET /api/orders  列表（会员看自己的，陪玩看自己接的）
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
  // super_admin 看全部

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
  const playerId = Number(body.playerId);
  const gameId = Number(body.gameId);
  const tier = String(body.tier || '');
  const bossRank = String(body.bossRank || '');
  const durationHours = Number(body.durationHours);
  const identityType = String(body.identityType || 'freelance');
  const remark = String(body.remark || '');

  if (!playerId) return Response.json({ ok: false, error: '请选择陪玩' }, { status: 400 });
  if (!gameId) return Response.json({ ok: false, error: '请选择游戏' }, { status: 400 });
  if (!tier) return Response.json({ ok: false, error: '请选择档位' }, { status: 400 });
  if (!durationHours || durationHours <= 0) {
    return Response.json({ ok: false, error: '请填写时长' }, { status: 400 });
  }

  // 查陪玩信息
  const { data: player } = await supabaseAdmin
    .from('players')
    .select('id, name, avatar, tier')
    .eq('id', playerId)
    .maybeSingle();

  if (!player) return Response.json({ ok: false, error: '陪玩不存在' }, { status: 404 });

  // 查游戏名
  const { data: game } = await supabaseAdmin
    .from('games')
    .select('id, name')
    .eq('id', gameId)
    .maybeSingle();

  if (!game) return Response.json({ ok: false, error: '游戏不存在' }, { status: 404 });

  // 查价格
  let unitPrice = 0;
  let shopId: number | null = null;
  let shopFee = 0;

  if (identityType === 'freelance') {
    const { data: price } = await supabaseAdmin
      .from('player_prices')
      .select('price_per_hour')
      .eq('player_id', playerId)
      .eq('game_id', gameId)
      .eq('tier', tier)
      .eq('is_active', true)
      .maybeSingle();

    if (!price) {
      return Response.json({ ok: false, error: '该陪玩未设置此档位价格' }, { status: 400 });
    }
    unitPrice = Number(price.price_per_hour);
  } else {
    // 店铺单：暂时从玩家的店铺关联里取，本批先不做完整支持
    return Response.json({ ok: false, error: '店铺单暂未开放' }, { status: 400 });
  }

  const baseAmount = unitPrice * durationHours;
  // 平台抽成：散陪 2%，店铺 1%
  const platformFee = identityType === 'freelance' ? baseAmount * 0.02 : baseAmount * 0.01;
  const finalAmount = baseAmount;
  const playerIncome = baseAmount - platformFee - shopFee;

  // 生成订单号
  const orderNo = 'OC' + Date.now();

  const { data: created, error } = await supabaseAdmin
    .from('orders')
    .insert({
      order_no: orderNo,
      member_id: me.id,
      member_name: me.nickname,
      player_id: playerId,
      player_name: player.name,
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
      status: 'pending_player',   // 直接进入待陪玩响应
      is_designated: true,
      paid_at: new Date().toISOString(),
      remark,
    })
    .select('*')
    .single();

  if (error || !created) {
    return Response.json({ ok: false, error: error?.message || '下单失败' }, { status: 500 });
  }

  return Response.json({ ok: true, order: created });
}