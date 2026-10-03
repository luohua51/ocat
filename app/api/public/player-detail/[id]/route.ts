import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

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
    // 基础
    const { data: player } = await supabaseAdmin
      .from('players')
      .select('id, name, avatar, audio, tier, weekly_orders, rating, status, accept_freelance')
      .eq('id', playerId)
      .maybeSingle();

    if (!player) {
      return Response.json({ ok: false, error: '陪玩不存在' }, { status: 404 });
    }

    // 资料
    const { data: profile } = await supabaseAdmin
      .from('player_profiles')
      .select('signature, description, rank_text, available_time')
      .eq('player_id', playerId)
      .maybeSingle();

    // 能力
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
    const uniqueGames = [...new Set(gameNames)];

    // 散陪价
    const { data: prices } = await supabaseAdmin
      .from('player_prices')
      .select('price_per_hour')
      .eq('player_id', playerId)
      .eq('is_active', true);

    const priceList = (prices || []).map((p: any) => Number(p.price_per_hour));
    const minPrice = priceList.length > 0 ? Math.min(...priceList) : 0;
    const hasFreelance = (prices || []).length > 0;

    // 店铺认证
    const { data: playerUser } = await supabaseAdmin
      .from('users')
      .select('id, shop_id')
      .eq('player_id', playerId)
      .maybeSingle();

    const certList: { shopName: string; tier: string }[] = [];

    if (playerUser) {
      const { data: certs } = await supabaseAdmin
        .from('player_shops')
        .select('shop_id, tier')
        .eq('player_user_id', playerUser.id)
        .eq('is_active', true);

      const shopIds = [...new Set((certs || []).map((c: any) => c.shop_id))];

      const { data: shops } = await supabaseAdmin
        .from('shops')
        .select('id, name')
        .in('id', shopIds.length > 0 ? shopIds : [-1]);

      (certs || []).forEach((c: any) => {
        const shop = (shops || []).find((s: any) => s.id === c.shop_id);
        if (shop) {
          certList.push({ shopName: shop.name, tier: c.tier });
        }
      });

      if (certList.length === 0 && playerUser.shop_id) {
        const { data: shop } = await supabaseAdmin
          .from('shops')
          .select('name')
          .eq('id', playerUser.shop_id)
          .maybeSingle();
        if (shop) {
          certList.push({ shopName: shop.name, tier: player.tier });
        }
      }
    }

    return Response.json({
      ok: true,
      player,
      profile,
      games: uniqueGames,
      minPrice,
      hasFreelance: hasFreelance && player.accept_freelance,
      certList,
    });
  } catch (err: any) {
    return Response.json({ ok: false, error: err?.message || '服务器错误' }, { status: 500 });
  }
}