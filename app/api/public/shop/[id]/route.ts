import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  if (!supabaseAdmin) {
    return Response.json({ ok: false, error: '服务器未配置' }, { status: 500 });
  }

  const shopId = Number(params.id);
  if (!shopId) {
    return Response.json({ ok: false, error: '参数错误' }, { status: 400 });
  }

  try {
    // 1. 店铺信息
    const { data: shop } = await supabaseAdmin
      .from('shops')
      .select('*')
      .eq('id', shopId)
      .eq('status', 'active')
      .maybeSingle();

    if (!shop) {
      return Response.json({ ok: false, error: '店铺不存在' }, { status: 404 });
    }

    // 2. 所有游戏
    const { data: games } = await supabaseAdmin
      .from('games')
      .select('id, name, logo, ranks')
      .eq('status', 'active')
      .order('sort_order', { ascending: true })
      .order('id', { ascending: true });

    // 3. 店铺价格
    const { data: prices } = await supabaseAdmin
      .from('shop_prices')
      .select('*')
      .eq('shop_id', shopId)
      .eq('is_active', true)
      .order('tier', { ascending: true })
      .order('id', { ascending: true });

    // 4. 该店陪玩
    const { data: playerUsers } = await supabaseAdmin
      .from('users')
      .select('id, nickname, player_id')
      .eq('role', 'player')
      .eq('shop_id', shopId);

    const playerIds = (playerUsers || [])
      .map((u: any) => u.player_id)
      .filter(Boolean);

    const { data: players } = await supabaseAdmin
      .from('players')
      .select('id, name, avatar, tier')
      .in('id', playerIds.length > 0 ? playerIds : [-1]);

    // 5. 该店认证（按游戏）
    const userIds = (playerUsers || []).map((u: any) => u.id);

    const { data: certs } = await supabaseAdmin
      .from('player_shops')
      .select('player_user_id, game_id, tier')
      .eq('shop_id', shopId)
      .eq('is_active', true)
      .in('player_user_id', userIds.length > 0 ? userIds : [-1]);

    const userMap = new Map((playerUsers || []).map((u: any) => [u.id, u.player_id]));

    // 按游戏分组陪玩
    const playersByGame: Record<
      number,
      { id: number; name: string; avatar: string; tier: string; certTier: string }[]
    > = {};

    (games || []).forEach((g: any) => {
      playersByGame[g.id] = [];
    });

    (players || []).forEach((p: any) => {
      // 该玩家所有认证
      const playerCerts: { gameId: number; tier: string }[] = [];
      (certs || []).forEach((c: any) => {
        const pid = userMap.get(c.player_user_id);
        if (pid === p.id) {
          playerCerts.push({ gameId: c.game_id, tier: c.tier });
        }
      });

      // 加入每个游戏
      playerCerts.forEach((pc) => {
        if (playersByGame[pc.gameId]) {
          playersByGame[pc.gameId].push({
            id: p.id,
            name: p.name,
            avatar: p.avatar || '',
            tier: p.tier,
            certTier: pc.tier,
          });
        }
      });
    });

    // 6. 组装游戏分区
    const gameSections = (games || []).map((g: any) => {
      const gamePrices = (prices || [])
        .filter((p: any) => p.game_id === g.id)
        .map((p: any) => ({
          tier: p.tier,
          bossRank: p.boss_rank || '通用',
          pricePerHour: Number(p.price_per_hour),
        }));

      return {
        gameId: g.id,
        gameName: g.name,
        gameLogo: g.logo || '',
        benefit: shop.game_benefits?.[String(g.id)] || '',
        prices: gamePrices,
        players: playersByGame[g.id] || [],
      };
    });

    // 过滤掉没有任何内容的分区
    const activeSections = gameSections.filter(
      (s) => s.prices.length > 0 || s.players.length > 0 || s.benefit
    );

    return Response.json(
      {
        ok: true,
        shop: {
          id: shop.id,
          name: shop.name,
          logo: shop.logo || '',
          description: shop.description || '',
          businessHours: shop.business_hours || '',
          contactWechat: shop.contact_wechat || '',
        },
        sections: activeSections,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (err: any) {
    console.error('shop API 错误:', err);
    return Response.json(
      { ok: false, error: err?.message || '服务器错误' },
      { status: 500 }
    );
  }
}   