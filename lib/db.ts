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
  status: string;
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

    // 5. 店铺
    const { data: shops } = await supabase
      .from('shops')
      .select('id, name')
      .eq('status', 'active');

    const shopMap = new Map((shops || []).map((s) => [s.id, s.name]));

    // 6. 陪玩 user 关联
    const { data: playerUsers } = await supabase
      .from('users')
      .select('id, player_id, shop_id')
      .in('player_id', ids)
      .eq('role', 'player');

    const userIdMap = new Map((playerUsers || []).map((u: any) => [u.id, u.player_id]));
    const userShopMap = new Map((playerUsers || []).map((u: any) => [u.player_id, u.shop_id]));

    // 7. 店铺认证
    const { data: playerShops } = await supabase
      .from('player_shops')
      .select('player_user_id, shop_id, tier')
      .eq('is_active', true);

    const certMap = new Map<number, { shopId: number; tier: string }>();
    (playerShops || []).forEach((ps: any) => {
      const pid = userIdMap.get(ps.player_user_id);
      if (pid) certMap.set(pid, { shopId: ps.shop_id, tier: ps.tier });
    });

    // 8. 组装
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

      let shopName = '';
      const cert = certMap.get(p.id);
      if (cert) {
        shopName = shopMap.get(cert.shopId) || '';
      } else {
        const shopId = userShopMap.get(p.id);
        if (shopId) shopName = shopMap.get(shopId) || '';
      }

      return {
        id: p.id,
        name: p.name,
        avatar: p.avatar || '',
        tier: cert?.tier || p.tier,
        games: uniqueGames as string[],
        price: minPrice,
        signature: prof?.signature || '',
        weeklyOrders: p.weekly_orders || 0,
        rating: p.rating || 100,
        shopName,
        status: p.status || 'offline',
      };
    });
  } catch (err) {
    console.error('fetchPlayers 异常:', err);
    return [];
  }
}