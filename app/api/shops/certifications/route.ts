import { supabaseAdmin } from '@/lib/supabase-admin';
import { getSessionUser } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

// ============================================================
// GET 本店陪玩 + 所有游戏的授权情况
// ============================================================
export async function GET() {
  if (!supabaseAdmin) {
    return Response.json({ ok: false, error: '服务器未配置' }, { status: 500 });
  }

  const me = await getSessionUser();
  if (!me) return Response.json({ ok: false, error: '未登录' }, { status: 401 });
  if (me.role !== 'shop_admin' && me.role !== 'super_admin') {
    return Response.json({ ok: false, error: '无权查看' }, { status: 403 });
  }

  const shopId = me.role === 'shop_admin' ? me.shopId : null;
  if (!shopId) {
    return Response.json({ ok: false, error: '未绑定店铺' }, { status: 400 });
  }

  // 1. 所有游戏
  const { data: games } = await supabaseAdmin
    .from('games')
    .select('id, name')
    .eq('status', 'active')
    .order('sort_order', { ascending: true })
    .order('id', { ascending: true });

  // 2. 本店陪玩
  const { data: players } = await supabaseAdmin
    .from('users')
    .select('id, username, nickname, player_id')
    .eq('role', 'player')
    .eq('shop_id', shopId)
    .order('id', { ascending: true });

  const playerUserIds = (players || []).map((p) => p.id);

  // 3. 授权记录
  const { data: certs } = await supabaseAdmin
    .from('player_shops')
    .select('player_user_id, game_id, tier')
    .in('player_user_id', playerUserIds.length > 0 ? playerUserIds : [-1])
    .eq('shop_id', shopId)
    .eq('is_active', true);

  // 4. 组装
  const enriched = (players || []).map((p) => {
    const gameTiers: Record<number, string> = {};
    (certs || []).forEach((c: any) => {
      if (c.player_user_id === p.id) {
        gameTiers[c.game_id] = c.tier;
      }
    });

    return {
      user_id: p.id,
      username: p.username,
      nickname: p.nickname,
      player_id: p.player_id,
      game_tiers: (games || []).map((g) => ({
        game_id: g.id,
        game_name: g.name,
        tier: gameTiers[g.id] || null,
      })),
    };
  });

  return Response.json({
    ok: true,
    games: games || [],
    players: enriched,
  });
}

// ============================================================
// POST 授予 / 取消授权
// 参数：{ playerUserId, gameId, tier }  tier 为 null 表示取消
// ============================================================
export async function POST(req: Request) {
  if (!supabaseAdmin) {
    return Response.json({ ok: false, error: '服务器未配置' }, { status: 500 });
  }

  const me = await getSessionUser();
  if (!me) return Response.json({ ok: false, error: '未登录' }, { status: 401 });
  if (me.role !== 'shop_admin' || !me.shopId) {
    return Response.json({ ok: false, error: '仅店长可操作' }, { status: 403 });
  }

  const body = await req.json();
  const playerUserId = Number(body.playerUserId);
  const gameId = Number(body.gameId);
  const tier = body.tier || null;

  if (!playerUserId || !gameId) {
    return Response.json({ ok: false, error: '缺少参数' }, { status: 400 });
  }

  // 确认是本店陪玩
  const { data: player } = await supabaseAdmin
    .from('users')
    .select('id, player_id, shop_id')
    .eq('id', playerUserId)
    .maybeSingle();

  if (!player || player.shop_id !== me.shopId) {
    return Response.json({ ok: false, error: '不是本店陪玩' }, { status: 403 });
  }

  // 取消授权
  if (!tier) {
    await supabaseAdmin
      .from('player_shops')
      .delete()
      .eq('player_user_id', playerUserId)
      .eq('shop_id', me.shopId)
      .eq('game_id', gameId);

    return Response.json({ ok: true });
  }

  // 档位校验
  const allowed = ['娱乐', '技术', '金牌', '魔王', '明星'];
  if (!allowed.includes(tier)) {
    return Response.json({ ok: false, error: '无效档位' }, { status: 400 });
  }

  // upsert
  const { data: existing } = await supabaseAdmin
    .from('player_shops')
    .select('id')
    .eq('player_user_id', playerUserId)
    .eq('shop_id', me.shopId)
    .eq('game_id', gameId)
    .maybeSingle();

  if (existing) {
    await supabaseAdmin
      .from('player_shops')
      .update({
        tier,
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);
  } else {
    await supabaseAdmin.from('player_shops').insert({
      player_user_id: playerUserId,
      shop_id: me.shopId,
      game_id: gameId,
      tier,
      is_active: true,
    });
  }

  return Response.json({ ok: true });
}