import { supabaseAdmin } from '@/lib/supabase-admin';
import { getSessionUser } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

// GET 查当前陪玩的散陪价
export async function GET() {
  if (!supabaseAdmin) {
    return Response.json({ ok: false, error: '服务器未配置' }, { status: 500 });
  }

  const me = await getSessionUser();
  if (!me) return Response.json({ ok: false, error: '未登录' }, { status: 401 });
  if (me.role !== 'player') {
    return Response.json({ ok: false, error: '仅陪玩可查看' }, { status: 403 });
  }

  const { data, error } = await supabaseAdmin
    .from('player_prices')
    .select('id, game_id, tier, boss_rank, price_per_hour, is_active')
    .eq('player_id', me.playerId)
    .eq('is_active', true)
    .order('id', { ascending: true });

  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });

  return Response.json({ ok: true, prices: data || [] });
}

// POST upsert 一条价格
export async function POST(req: Request) {
  if (!supabaseAdmin) {
    return Response.json({ ok: false, error: '服务器未配置' }, { status: 500 });
  }

  const me = await getSessionUser();
  if (!me) return Response.json({ ok: false, error: '未登录' }, { status: 401 });
  if (me.role !== 'player') {
    return Response.json({ ok: false, error: '仅陪玩可设置' }, { status: 403 });
  }

  const body = await req.json();
  const gameId = Number(body.gameId);
  const tier = String(body.tier || '');
  const pricePerHour = Number(body.pricePerHour);

  if (!gameId) return Response.json({ ok: false, error: '请选择游戏' }, { status: 400 });
  if (!['娱乐', '技术'].includes(tier)) {
    return Response.json({ ok: false, error: '散陪只有娱乐/技术' }, { status: 400 });
  }
  if (!pricePerHour || pricePerHour < 9.9) {
    return Response.json({ ok: false, error: '最低 9.9 元/时' }, { status: 400 });
  }

  // 用 upsert 处理重复
  const { data: existing } = await supabaseAdmin
    .from('player_prices')
    .select('id')
    .eq('player_id', me.playerId)
    .eq('game_id', gameId)
    .eq('tier', tier)
    .eq('is_active', true)
    .maybeSingle();

  if (existing) {
    const { error } = await supabaseAdmin
      .from('player_prices')
      .update({ price_per_hour: pricePerHour })
      .eq('id', existing.id);
    if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
  } else {
    const { error } = await supabaseAdmin.from('player_prices').insert({
      player_id: me.playerId,
      game_id: gameId,
      tier,
      boss_rank: null,
      price_per_hour: pricePerHour,
      is_active: true,
    });
    if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}