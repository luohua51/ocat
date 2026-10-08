import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

// ============================================================
// GET /api/public/price?playerId=1&gameId=2&tier=娱乐
// 查询指定陪玩指定档位的单价，用于前端展示折后价
// ============================================================
export async function GET(req: Request) {
  if (!supabaseAdmin) {
    return Response.json({ ok: false, error: '服务器未配置' }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const playerId = Number(searchParams.get('playerId'));
  const gameId = Number(searchParams.get('gameId'));
  const tier = searchParams.get('tier') || '';

  if (!playerId || !gameId || !tier) {
    return Response.json({ ok: false, error: '参数不完整' }, { status: 400 });
  }

  const { data: price } = await supabaseAdmin
    .from('player_prices')
    .select('price_per_hour')
    .eq('player_id', playerId)
    .eq('game_id', gameId)
    .eq('tier', tier)
    .eq('is_active', true)
    .maybeSingle();

  if (!price) {
    return Response.json({ ok: false, error: '该陪玩未设置此档位价格' }, { status: 404 });
  }

  return Response.json({ ok: true, unitPrice: Number(price.price_per_hour) });
}