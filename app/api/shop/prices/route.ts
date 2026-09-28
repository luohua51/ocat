import { supabaseAdmin } from '@/lib/supabase-admin';
import { getSessionUser } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

// ============================================================
// GET 本店所有价格
// ============================================================
export async function GET() {
  if (!supabaseAdmin) {
    return Response.json({ ok: false, error: '服务器未配置' }, { status: 500 });
  }

  const me = await getSessionUser();
  if (!me) return Response.json({ ok: false, error: '未登录' }, { status: 401 });
  if (me.role !== 'shop_admin') {
    return Response.json({ ok: false, error: '仅店长可查看' }, { status: 403 });
  }
  if (!me.shopId) {
    return Response.json({ ok: false, error: '未绑定店铺' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('shop_prices')
    .select('*')
    .eq('shop_id', me.shopId)
    .eq('is_active', true)
    .order('game_id', { ascending: true })
    .order('id', { ascending: true });

  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });

  return Response.json({ ok: true, prices: data || [] });
}

// ============================================================
// POST 新增/更新一条价格
// 参数：{ gameId, tier, bossRank, pricePerHour }
// ============================================================
export async function POST(req: Request) {
  if (!supabaseAdmin) {
    return Response.json({ ok: false, error: '服务器未配置' }, { status: 500 });
  }

  const me = await getSessionUser();
  if (!me) return Response.json({ ok: false, error: '未登录' }, { status: 401 });
  if (me.role !== 'shop_admin') {
    return Response.json({ ok: false, error: '仅店长可操作' }, { status: 403 });
  }
  if (!me.shopId) {
    return Response.json({ ok: false, error: '未绑定店铺' }, { status: 400 });
  }

  const body = await req.json();
  const gameId = Number(body.gameId);
  const tier = String(body.tier || '').trim();
  let bossRank = body.bossRank ? String(body.bossRank).trim() : null;
  const pricePerHour = Number(body.pricePerHour);

  if (!gameId) return Response.json({ ok: false, error: '请选择游戏' }, { status: 400 });
  if (!['娱乐', '技术', '金牌', '魔王', '明星'].includes(tier)) {
    return Response.json({ ok: false, error: '无效档位' }, { status: 400 });
  }
  if (!pricePerHour || pricePerHour <= 0) {
    return Response.json({ ok: false, error: '价格必须大于 0' }, { status: 400 });
  }

  // 娱乐、技术必须填段位；金魔星统一"任意"
  if (tier === '娱乐' || tier === '技术') {
    if (!bossRank) {
      return Response.json({ ok: false, error: '娱乐/技术需要填老板段位' }, { status: 400 });
    }
  } else {
    bossRank = '任意';
  }

  // 查重
  let q = supabaseAdmin
    .from('shop_prices')
    .select('id')
    .eq('shop_id', me.shopId)
    .eq('game_id', gameId)
    .eq('tier', tier);

  if (bossRank) {
    q = q.eq('boss_rank', bossRank);
  } else {
    q = q.is('boss_rank', null);
  }

  const { data: existing } = await q.maybeSingle();

  if (existing) {
    const { error } = await supabaseAdmin
      .from('shop_prices')
      .update({
        price_per_hour: pricePerHour,
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);
    if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
  } else {
    const { error } = await supabaseAdmin.from('shop_prices').insert({
      shop_id: me.shopId,
      game_id: gameId,
      tier,
      boss_rank: bossRank,
      price_per_hour: pricePerHour,
      is_active: true,
    });
    if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}