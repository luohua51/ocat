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

    // 8. 组装
    const result = players.map((p) => {
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

      const identities: {
        type: 'shop' | 'freelance';
        shopName: string;
        tier: string;
        label: string;
      }[] = [];

      const userInfo = (playerUsers || []).find((u: any) => u.player_id === p.id);

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

      // 散陪身份：开关开启且有价格
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

      const mainIdentity = identities[0];
      const displayPrice = p.accept_freelance ? minPrice : 0;

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
    return Response.json({ ok: false, error: err?.message || '服务器错误' }, { status: 500 });
  }
}