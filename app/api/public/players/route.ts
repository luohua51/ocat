import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!supabaseAdmin) {
    return Response.json({ ok: false, error: '服务器未配置' }, { status: 500 });
  }

  try {
    // 1. 陪玩基础信息
    const { data: players } = await supabaseAdmin
      .from('players')
      .select('id, name, avatar, tier, weekly_orders, rating, status, accept_freelance')
      .order('id', { ascending: true })
      .limit(100);

    if (!players || players.length === 0) {
      return Response.json({ ok: true, players: [] });
    }

    const ids = players.map((p) => p.id);

    // 2. 资料
    const { data: profiles } = await supabaseAdmin
      .from('player_profiles')
      .select('player_id, signature')
      .in('player_id', ids);

    // 3. 能力
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

    // 4. 散陪价
    const { data: prices } = await supabaseAdmin
      .from('player_prices')
      .select('player_id, price_per_hour, tier')
      .in('player_id', ids)
      .eq('is_active', true);

    // 5. 店铺
    const { data: shops } = await supabaseAdmin
      .from('shops')
      .select('id, name')
      .eq('status', 'active');

    const shopMap = new Map((shops || []).map((s) => [s.id, s.name]));

    // 6. 用户-陪玩关联
    const { data: playerUsers } = await supabaseAdmin
      .from('users')
      .select('id, player_id, shop_id')
      .in('player_id', ids)
      .eq('role', 'player');

    // 7. 认证
    const { data: playerShops } = await supabaseAdmin
      .from('player_shops')
      .select('player_user_id, shop_id, tier')
      .eq('is_active', true);

    // 8. 所有店铺价（用于计算店陪最低价）
    const shopIds = [
      ...new Set(
        (playerUsers || [])
          .map((u: any) => u.shop_id)
          .filter((x: any) => !!x)
      ),
    ];

    const { data: shopPrices } = await supabaseAdmin
      .from('shop_prices')
      .select('shop_id, game_id, price_per_hour')
      .in('shop_id', shopIds.length > 0 ? shopIds : [-1])
      .eq('is_active', true);

    // 9. 组装
    const result = players.map((p) => {
      const prof = (profiles || []).find((x: any) => x.player_id === p.id);

      // 游戏名列表
      const playerGames = (capabilities || [])
        .filter((c: any) => c.player_id === p.id)
        .map((c: any) => (gamesData || []).find((g: any) => g.id === c.game_id)?.name)
        .filter(Boolean);
      const uniqueGames = [...new Set(playerGames)];

      // 该陪玩能接的游戏 id 列表
      const playerGameIds = (capabilities || [])
        .filter((c: any) => c.player_id === p.id)
        .map((c: any) => c.game_id);

      // 散陪价列表
      const freelancePrices = (prices || [])
        .filter((x: any) => x.player_id === p.id)
        .map((x: any) => Number(x.price_per_hour));

      const userInfo = (playerUsers || []).find((u: any) => u.player_id === p.id);

      // 店铺价列表（该陪玩能接游戏的店铺价）
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

      // ========== 身份 ==========
      const identities: any[] = [];

      if (userInfo) {
        const certs = (playerShops || []).filter(
          (ps: any) => ps.player_user_id === userInfo.id
        );

        if (certs.length > 0) {
          certs.forEach((c: any) => {
            const shopName = shopMap.get(c.shop_id);
            if (shopName) {
              identities.push({
                type: 'shop',
                shopName,
                tier: c.tier,
                label: `${shopName}.${c.tier}`,
              });
            }
          });
        } else if (userInfo.shop_id) {
          const shopName = shopMap.get(userInfo.shop_id);
          if (shopName) {
            identities.push({
              type: 'shop',
              shopName,
              tier: p.tier,
              label: `${shopName}.${p.tier}`,
            });
          }
        }
      }

      const hasFreelance =
        p.accept_freelance &&
        (prices || []).some((x: any) => x.player_id === p.id);

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

      // ========== 最低展示价 ==========
      const allPrices = [
        ...(p.accept_freelance ? freelancePrices : []),
        ...shopPricesList,
      ];
      const displayPrice = allPrices.length > 0 ? Math.min(...allPrices) : 0;

      const mainIdentity = identities[0];

      return {
        id: p.id,
        name: p.name,
        avatar: p.avatar || '',
        tier: mainIdentity?.tier || p.tier,
        games: uniqueGames,
        price: displayPrice,
        signature: prof?.signature || '',
        weeklyOrders: p.weekly_orders || 0,
        rating: p.rating || 100,
        shopName: mainIdentity?.shopName || '',
        status: p.status || 'offline',
        identities,
      };
    });

    return Response.json({ ok: true, players: result });
  } catch (err: any) {
    return Response.json(
      { ok: false, error: err?.message || '服务器错误' },
      { status: 500 }
    );
  }
}