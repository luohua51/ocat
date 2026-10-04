import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET() {
  if (!supabaseAdmin) {
    return Response.json({ ok: false, error: '服务器未配置' }, { status: 500 });
  }

  try {
    // 1. 所有陪玩
    const { data: players } = await supabaseAdmin
      .from('players')
      .select('id, name, avatar, tier, accept_freelance')
      .order('id', { ascending: true })
      .limit(100);

    // 2. 所有游戏
    const { data: games } = await supabaseAdmin
      .from('games')
      .select('id, name, ranks')
      .eq('status', 'active')
      .order('sort_order', { ascending: true })
      .order('id', { ascending: true });

    const playerIds = (players || []).map((p) => p.id);

    // 3. 能力声明
    const { data: capabilities } = await supabaseAdmin
      .from('player_capabilities')
      .select('player_id, game_id, tier')
      .in('player_id', playerIds.length > 0 ? playerIds : [-1])
      .eq('is_active', true);

    // 4. 陪玩 user
    const { data: playerUsers } = await supabaseAdmin
      .from('users')
      .select('id, player_id, shop_id')
      .in('player_id', playerIds.length > 0 ? playerIds : [-1])
      .eq('role', 'player');

    const userMap = new Map((playerUsers || []).map((u: any) => [u.player_id, u]));

    // 5. 店铺认证（按游戏）
    const playerUserIds = (playerUsers || []).map((u: any) => u.id);

    const { data: certs } = await supabaseAdmin
      .from('player_shops')
      .select('player_user_id, shop_id, game_id, tier')
      .in(
        'player_user_id',
        playerUserIds.length > 0 ? playerUserIds : [-1]
      )
      .eq('is_active', true);

    const playersWithCaps = (players || []).map((p) => {
      const userInfo = userMap.get(p.id);
      const caps = (capabilities || [])
        .filter((c: any) => c.player_id === p.id)
        .map((c: any) => ({ gameId: c.game_id, tier: c.tier }));

      // 该陪玩被本店授予的每游戏档位
      const shopGameTiers: { gameId: number; tier: string; shopId: number }[] = [];
      if (userInfo) {
        (certs || []).forEach((c: any) => {
          if (c.player_user_id === userInfo.id) {
            shopGameTiers.push({
              gameId: c.game_id,
              tier: c.tier,
              shopId: c.shop_id,
            });
          }
        });
      }

      return {
        id: p.id,
        name: p.name,
        avatar: p.avatar || '',
        tier: p.tier,
        acceptFreelance: !!p.accept_freelance,
        capabilities: caps,
        shopGameTiers,
      };
    });

    return Response.json(
      {
        ok: true,
        players: playersWithCaps,
        games: games || [],
      },
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