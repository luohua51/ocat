import { supabase } from './supabase';

export type PlayerIdentity = {
  type: 'shop' | 'freelance';
  shopName: string;
  tier: string;
  label: string;
};

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
  status: string;
  identities: PlayerIdentity[];
};

export async function fetchPlayers(): Promise<PlayerDisplay[]> {
  if (!supabase) return [];

  try {
    // 1. 陪玩基础信息
    const { data: players, error: pErr } = await supabase
      .from('players')
      .select('id, name, avatar, tier, weekly_orders, rating, status')
      .order('id', { ascending: true })
      .limit(100);

    if (pErr || !players || players.length === 0) {
      console.error('players 查询失败:', pErr);
      return [];
    }

    const ids = players.map((p) => p.id);

    // 2. 资料
    const { data: profiles } = await supabase
      .from('player_profiles')
      .select('player_id, signature')
      .in('player_id', ids);

    // 3. 能力
    const { data: capabilities } = await supabase
      .from('player_capabilities')
      .select('player_id, game_id, tier')
      .in('player_id', ids)
      .eq('is_active', true);

    const gameIds = [...new Set((capabilities || []).map((c: any) => c.game_id))];

    const { data: gamesData } = await supabase
      .from('games')
      .select('id, name')
      .in('id', gameIds.length > 0 ? gameIds : [-1]);

    // 4. 散陪价
    const { data: prices } = await supabase
      .from('player_prices')
      .select('player_id, price_per_hour, tier')
      .in('player_id', ids)
      .eq('is_active', true);

    // 5. 店铺列表
    const { data: shops } = await supabase
      .from('shops')
      .select('id, name')
      .eq('status', 'active');

    const shopMap = new Map((shops || []).map((s) => [s.id, s.name]));

    // 6. 通过后端 API 拿到 player 和 shop 的关联（避免直连 users 表）
    //    这里改用 player_shops 直接查询：需要把 player_id 映射到 player_user_id
    //    简化方案：调一个轻量 API
    let playerShopRelations: { playerId: number; shopId: number; tier: string }[] = [];

    try {
      const res = await fetch('/api/public/player-identities', { cache: 'no-store' });
      const data = await res.json();
      if (data.ok) {
        playerShopRelations = data.relations || [];
      }
    } catch {
      // 忽略
    }

    // 7. 组装
    return players.map((p) => {
      const prof = (profiles || []).find((x: any) => x.player_id === p.id);

      const playerGames = (capabilities || [])
        .filter((c: any) => c.player_id === p.id)
        .map((c: any) => (gamesData || []).find((g: any) => g.id === c.game_id)?.name)
        .filter(Boolean);
      const uniqueGames = [...new Set(playerGames)];

      const playerPrices = (prices || [])
        .filter((x: any) => x.player_id === p.id)
        .map((x: any) => Number(x.price_per_hour));
      const minPrice = playerPrices.length > 0 ? Math.min(...playerPrices) : 0;

      const identities: PlayerIdentity[] = [];

      // 店铺身份（从后端 API 拿到的 relations）
      const myCerts = playerShopRelations.filter((r) => r.playerId === p.id);
      myCerts.forEach((c) => {
        const shopName = shopMap.get(c.shopId);
        if (shopName) {
          identities.push({
            type: 'shop',
            shopName,
            tier: c.tier,
            label: `${shopName}.${c.tier}`,
          });
        }
      });

      // 散陪身份
      const hasFreelance = (prices || []).some((x: any) => x.player_id === p.id);
      if (hasFreelance) {
        const freelanceTier =
          (prices || []).find((x: any) => x.player_id === p.id)?.tier || p.tier;
        identities.push({
          type: 'freelance',
          shopName: '散陪',
          tier: freelanceTier,
          label: `散陪.${freelanceTier}`,
        });
      }

      const mainIdentity = identities[0];
      const mainTier = mainIdentity?.tier || p.tier;
      const mainShopName = mainIdentity?.shopName || '';

      return {
        id: p.id,
        name: p.name,
        avatar: p.avatar || '',
        tier: mainTier,
        games: uniqueGames as string[],
        price: minPrice,
        signature: prof?.signature || '',
        weeklyOrders: p.weekly_orders || 0,
        rating: p.rating || 100,
        shopName: mainShopName,
        status: p.status || 'offline',
        identities,
      };
    });
  } catch (err) {
    console.error('fetchPlayers 异常:', err);
    return [];
  }
}