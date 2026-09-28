import { supabase } from './supabase';

export type PlayerDisplay = {
  id: number;
  name: string;
  avatar: string;
  tier: string;
  games: string[];
  price: number;
  signature: string;
  weeklyOrders: number;
  rating: number;
  shopName: string;
};

/**
 * 拉取所有公开陪玩（不依赖外键，全部单独查询后 JS 合并）
 */
export async function fetchPlayers(): Promise<PlayerDisplay[]> {
  if (!supabase) return [];

  // 1. 基础信息
  const { data: players, error: pErr } = await supabase
    .from('players')
    .select('id, name, avatar, tier, weekly_orders, rating')
    .eq('status', 'active')
    .order('id', { ascending: true })
    .limit(50);

  if (pErr || !players || players.length === 0) {
    console.error('players 查询失败:', pErr);
    return [];
  }

  const ids = players.map((p) => p.id);

  // 2. 签名
  const { data: profiles } = await supabase
    .from('player_profiles')
    .select('player_id, signature')
    .in('player_id', ids);

  // 3. 能力（游戏 + 档位）
  const { data: capabilities } = await supabase
    .from('player_capabilities')
    .select('player_id, game_id, tier')
    .in('player_id', ids)
    .eq('is_active', true);

  const gameIds = [
    ...new Set((capabilities || []).map((c: any) => c.game_id)),
  ];

  const { data: gamesData } = await supabase
    .from('games')
    .select('id, name')
    .in('id', gameIds.length > 0 ? gameIds : [-1]);

  // 4. 价格
  const { data: prices } = await supabase
    .from('player_prices')
    .select('player_id, price_per_hour')
    .in('player_id', ids)
    .eq('is_active', true);

  // 5. 组装
  return players.map((p) => {
    const prof = (profiles || []).find((x: any) => x.player_id === p.id);

    const playerGames = (capabilities || [])
      .filter((c: any) => c.player_id === p.id)
      .map((c: any) => (gamesData || []).find((g: any) => g.id === c.game_id)?.name)
      .filter(Boolean);
    const uniqueGames = [...new Set(playerGames)];

    const playerPrices = (prices || [])
      .filter((x: any) => x.player_id === p.id)
      .map((x: any) => x.price_per_hour);
    const minPrice = playerPrices.length > 0 ? Math.min(...playerPrices) : 0;

    return {
      id: p.id,
      name: p.name,
      avatar: p.avatar || '',
      tier: p.tier,
      games: uniqueGames as string[],
      price: minPrice,
      signature: prof?.signature || '',
      weeklyOrders: p.weekly_orders || 0,
      rating: p.rating || 100,
      shopName: '散陪',
    };
  });
}