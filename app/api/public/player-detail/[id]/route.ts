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

  const playerId = Number(params.id);
  if (!playerId) {
    return Response.json({ ok: false, error: '参数错误' }, { status: 400 });
  }

  try {
    // 1. 基础
    const { data: player } = await supabaseAdmin
      .from('players')
      .select(
        'id, name, avatar, audio, tier, weekly_orders, rating, status, accept_freelance'
      )
      .eq('id', playerId)
      .maybeSingle();

    if (!player) {
      return Response.json({ ok: false, error: '陪玩不存在' }, { status: 404 });
    }

    // 2. 资料
    const { data: profile } = await supabaseAdmin
      .from('player_profiles')
      .select('signature, description, rank_text, available_time')
      .eq('player_id', playerId)
      .maybeSingle();

    // 3. 能力
    const { data: capabilities } = await supabaseAdmin
      .from('player_capabilities')
      .select('game_id, tier')
      .eq('player_id', playerId)
      .eq('is_active', true);

    const gameIds = [...new Set((capabilities || []).map((c: any) => c.game_id))];

    const { data: gamesData } = await supabaseAdmin
      .from('games')
      .select('id, name')
      .in('id', gameIds.length > 0 ? gameIds : [-1]);

    const gameNames = (capabilities || [])
      .map((c: any) => (gamesData || []).find((g: any) => g.id === c.game_id)?.name)
      .filter(Boolean);
    const uniqueGames: string[] = [...new Set(gameNames)] as string[];

    // 4. 散陪价
    const { data: prices } = await supabaseAdmin
      .from('player_prices')
      .select('price_per_hour')
      .eq('player_id', playerId)
      .eq('is_active', true);

    const priceList = (prices || []).map((p: any) => Number(p.price_per_hour));
    const minPrice = priceList.length > 0 ? Math.min(...priceList) : 0;
    const hasFreelance =
      (prices || []).length > 0 && !!player.accept_freelance;

    // 5. 店铺认证
    const { data: playerUser } = await supabaseAdmin
      .from('users')
      .select('id, shop_id')
      .eq('player_id', playerId)
      .maybeSingle();

    const certList: {
      shopName: string;
      gameName: string;
      tier: string;
    }[] = [];

    if (playerUser) {
      const { data: certs } = await supabaseAdmin
        .from('player_shops')
        .select('shop_id, game_id, tier')
        .eq('player_user_id', playerUser.id)
        .eq('is_active', true);

      const shopIds = [...new Set((certs || []).map((c: any) => c.shop_id))];
      const certGameIds = [...new Set((certs || []).map((c: any) => c.game_id))];

      const { data: shops } = await supabaseAdmin
        .from('shops')
        .select('id, name')
        .in('id', shopIds.length > 0 ? shopIds : [-1]);

      const { data: certGames } = await supabaseAdmin
        .from('games')
        .select('id, name')
        .in('id', certGameIds.length > 0 ? certGameIds : [-1]);

      (certs || []).forEach((c: any) => {
        const shop = (shops || []).find((s: any) => s.id === c.shop_id);
        const game = (certGames || []).find((g: any) => g.id === c.game_id);
        if (shop && game) {
          certList.push({
            shopName: shop.name,
            gameName: game.name,
            tier: c.tier,
          });
        }
      });
    }

    // 6. 主档位
    const TIER_RANK: Record<string, number> = {
      明星: 0,
      魔王: 1,
      金牌: 2,
      技术: 3,
      娱乐: 4,
    };
    let mainTier = player.tier;
    if (certList.length > 0) {
      const sorted = [...certList].sort(
        (a, b) => (TIER_RANK[a.tier] ?? 4) - (TIER_RANK[b.tier] ?? 4)
      );
      mainTier = sorted[0].tier;
    }

    // 7. 标签
    const { data: tagRows } = await supabaseAdmin
      .from('player_tags')
      .select('category, tag_name, sort_order')
      .eq('player_id', playerId)
      .order('sort_order', { ascending: true });

    const voiceTags: string[] = [];
    const styleTags: string[] = [];

    (tagRows || []).forEach((t: any) => {
      if (t.category === 'voice') voiceTags.push(t.tag_name);
      if (t.category === 'style') styleTags.push(t.tag_name);
    });

    return Response.json(
      {
        ok: true,
        player: { ...player, mainTier },
        profile: profile || null,
        games: uniqueGames,
        minPrice,
        hasFreelance,
        certList,
        voiceTags,
        styleTags,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (err: any) {
    console.error('player-detail API 错误:', err);
    return Response.json(
      { ok: false, error: err?.message || '服务器错误' },
      { status: 500 }
    );
  }
}