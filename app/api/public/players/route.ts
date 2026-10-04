import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET() {
  if (!supabaseAdmin) {
    return Response.json({ ok: false, error: '服务器未配置' }, { status: 500 });
  }

  try {
    const { data: players } = await supabaseAdmin
      .from('players')
      .select('id, name, avatar, tier, weekly_orders, rating, status, accept_freelance')
      .order('id', { ascending: true })
      .limit(100);

    if (!players || players.length === 0) {
      return Response.json(
        { ok: true, players: [] },
        { headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const ids = players.map((p) => p.id);

    // 资料
    const { data: profiles } = await supabaseAdmin
      .from('player_profiles')
      .select('player_id, signature')
      .in('player_id', ids);

    // 能力
    const { data: capabilities } = await supabaseAdmin
      .from('player_capabilities')
      .select('player_id, game_id, tier')
      .in('player_id', ids)
      .eq('is_active', true);

    const gameIds = [...new Set((capabilities || []).map((c: any) => c.game_id))];

    const { data: gamesData } = await supabaseAdmin
      .from('games')
      .select('id, name')
      .in('id', gameIds.length > 0 ? gameIds : [-1]);

    const gameMap = new Map((gamesData || []).map((g: any) => [g.id, g.name]));

    // 散陪价
    const { data: prices } = await supabaseAdmin
      .from('player_prices')
      .select('player_id, price_per_hour, tier')
      .in('player_id', ids)
      .eq('is_active', true);

    // 店铺
    const { data: shops } = await supabaseAdmin
      .from('shops')
      .select('id, name')
      .eq('status', 'active');

    const shopMap = new Map((shops || []).map((s: any) => [s.id, s.name]));

    // 陪玩 user
    const { data: playerUsers } = await supabaseAdmin
      .from('users')
      .select('id, player_id, shop_id')
      .in('player_id', ids)
      .eq('role', 'player');

    const userMap = new Map((playerUsers || []).map((u: any) => [u.id, u.player_id]));

    // 认证（按游戏）
    const playerUserIds = (playerUsers || []).map((u: any) => u.id);

    const { data: certs } = await supabaseAdmin
      .from('player_shops')
      .select('player_user_id, shop_id, game_id, tier')
      .in(
        'player_user_id',
        playerUserIds.length > 0 ? playerUserIds : [-1]
      )
      .eq('is_active', true);

    // 按 player_id 分组认证
    const certsByPlayer = new Map<
      number,
      { shopId: number; gameId: number; tier: string }[]
    >();

    (certs || []).forEach((c: any) => {
      const pid = userMap.get(c.player_user_id);
      if (!pid) return;
      if (!certsByPlayer.has(pid)) certsByPlayer.set(pid, []);
      certsByPlayer.get(pid)!.push({
        shopId: c.shop_id,
        gameId: c.game_id,
        tier: c.tier,
      });
    });

    // 店铺价
    const shopPricesIds = [
      ...new Set((playerUsers || []).map((u: any) => u.shop_id).filter(Boolean)),
    ];

    const { data: shopPrices } = await supabaseAdmin
      .from('shop_prices')
      .select('shop_id, game_id, price_per_hour')
      .in('shop_id', shopPricesIds.length > 0 ? shopPricesIds : [-1])
      .eq('is_active', true);

    const result = players.map((p) => {
      const prof = (profiles || []).find((x: any) => x.player_id === p.id);

      const playerGames = (capabilities || [])
        .filter((c: any) => c.player_id === p.id)
        .map((c: any) => gameMap.get(c.game_id))
        .filter((x): x is string => !!x);
      const uniqueGames = [...new Set(playerGames)];

      const playerGameIds = (capabilities || [])
        .filter((c: any) => c.player_id === p.id)
        .map((c: any) => c.game_id);

      const freelancePrices = (prices || [])
        .filter((x: any) => x.player_id === p.id)
        .map((x: any) => Number(x.price_per_hour));

      const userInfo = (playerUsers || []).find((u: any) => u.player_id === p.id);

      // ============ 身份 ============
      const identities: any[] = [];

      const myCerts = certsByPlayer.get(p.id) || [];

      myCerts.forEach((c) => {
        const shopName = shopMap.get(c.shopId);
        const gameName = gameMap.get(c.gameId);
        if (shopName && gameName) {
          identities.push({
            type: 'shop',
            shopId: c.shopId,           // ← 关键：给前端跳转用
            shopName,
            gameName,
            tier: c.tier,
            label: `${shopName}·${gameName}·${c.tier}`,
          });
        }
      });

      // 散陪身份
      const hasFreelance =
        p.accept_freelance &&
        (prices || []).some((x: any) => x.player_id === p.id);

      if (hasFreelance) {
        const freelanceTier =
          (prices || []).find((x: any) => x.player_id === p.id)?.tier || '娱乐';
        identities.push({
          type: 'freelance',
          shopName: '散陪',
          tier: freelanceTier,
          label: `散陪·${freelanceTier}`,
        });
      }

      // ============ 价格 ============
      const shopPricesList: number[] = [];
      if (userInfo?.shop_id) {
        (shopPrices || []).forEach((sp: any) => {
          if (
            sp.shop_id === userInfo.shop_id &&
            playerGameIds.includes(sp.game_id)
          ) {
            shopPricesList.push(Number(sp.price_per_hour));
          }
        });
      }

      const allPrices = [
        ...(p.accept_freelance ? freelancePrices : []),
        ...shopPricesList,
      ];
      const displayPrice = allPrices.length > 0 ? Math.min(...allPrices) : 0;

      // 主档位：取该玩家所有认证里最高的
      const TIER_RANK: Record<string, number> = {
        明星: 0,
        魔王: 1,
        金牌: 2,
        技术: 3,
        娱乐: 4,
      };
      let mainTier = p.tier;
      if (myCerts.length > 0) {
        const sortedCerts = [...myCerts].sort(
          (a, b) => (TIER_RANK[a.tier] ?? 4) - (TIER_RANK[b.tier] ?? 4)
        );
        mainTier = sortedCerts[0].tier;
      }

      return {
        id: p.id,
        name: p.name,
        avatar: p.avatar || '',
        tier: mainTier,
        games: uniqueGames,
        price: displayPrice,
        signature: prof?.signature || '',
        weeklyOrders: p.weekly_orders || 0,
        rating: p.rating || 100,
        shopName: identities[0]?.shopName || '',
        status: p.status || 'offline',
        identities,
      };
    });

    return Response.json(
      { ok: true, players: result },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (err: any) {
    return Response.json(
      { ok: false, error: err?.message || '服务器错误' },
      { status: 500 }
    );
  }
}