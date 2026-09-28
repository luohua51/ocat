import { supabaseAdmin } from '@/lib/supabase-admin';
import { getSessionUser } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

// ============================================================
// GET 当前陪玩资料
// ============================================================
export async function GET() {
  if (!supabaseAdmin) {
    return Response.json({ ok: false, error: '服务器未配置' }, { status: 500 });
  }

  const me = await getSessionUser();
  if (!me) return Response.json({ ok: false, error: '未登录' }, { status: 401 });
  if (me.role !== 'player' || !me.playerId) {
    return Response.json({ ok: false, error: '非陪玩账号' }, { status: 403 });
  }

  const [playerRes, profileRes, capsRes] = await Promise.all([
    supabaseAdmin
      .from('players')
      .select('id, name, avatar, audio, tier, weekly_orders, rating')
      .eq('id', me.playerId)
      .maybeSingle(),
    supabaseAdmin
      .from('player_profiles')
      .select('*')
      .eq('player_id', me.playerId)
      .maybeSingle(),
    supabaseAdmin
      .from('player_capabilities')
      .select('game_id, tier')
      .eq('player_id', me.playerId)
      .eq('is_active', true),
  ]);

  return Response.json({
    ok: true,
    player: playerRes.data || null,
    profile: profileRes.data || null,
    capabilities: capsRes.data || [],
  });
}

// ============================================================
// PUT 更新资料
// ============================================================
export async function PUT(req: Request) {
  if (!supabaseAdmin) {
    return Response.json({ ok: false, error: '服务器未配置' }, { status: 500 });
  }

  const me = await getSessionUser();
  if (!me) return Response.json({ ok: false, error: '未登录' }, { status: 401 });
  if (me.role !== 'player' || !me.playerId) {
    return Response.json({ ok: false, error: '非陪玩账号' }, { status: 403 });
  }

  const body = await req.json();
  const name = body.name ? String(body.name).trim() : null;
  const signature = body.signature !== undefined ? String(body.signature || '') : undefined;
  const description = body.description !== undefined ? String(body.description || '') : undefined;
  const rankText = body.rankText !== undefined ? String(body.rankText || '') : undefined;
  const availableTime = body.availableTime !== undefined ? String(body.availableTime || '') : undefined;
  const games = Array.isArray(body.games) ? body.games : undefined;

  // 更新 players 表
  if (name) {
    await supabaseAdmin
      .from('players')
      .update({ name, updated_at: new Date().toISOString() })
      .eq('id', me.playerId);
  }

  // upsert player_profiles
  const { data: existing } = await supabaseAdmin
    .from('player_profiles')
    .select('id')
    .eq('player_id', me.playerId)
    .maybeSingle();

  const patch: any = { player_id: me.playerId, updated_at: new Date().toISOString() };
  if (signature !== undefined) patch.signature = signature;
  if (description !== undefined) patch.description = description;
  if (rankText !== undefined) patch.rank_text = rankText;
  if (availableTime !== undefined) patch.available_time = availableTime;

  if (existing) {
    await supabaseAdmin.from('player_profiles').update(patch).eq('id', existing.id);
  } else {
    await supabaseAdmin.from('player_profiles').insert(patch);
  }

  // 更新能力（游戏）
  if (games !== undefined) {
    // 先查出游戏 id
    const { data: gameRows } = await supabaseAdmin
      .from('games')
      .select('id, name')
      .eq('status', 'active');

    const gameMap = new Map((gameRows || []).map((g) => [g.name, g.id]));

    // 删除现有能力
    await supabaseAdmin
      .from('player_capabilities')
      .delete()
      .eq('player_id', me.playerId);

    // 重新插入
    const inserts = games
      .map((g: string) => gameMap.get(g))
      .filter(Boolean)
      .map((gameId: number) => ({
        player_id: me.playerId!,
        game_id: gameId,
        tier: '娱乐', // 默认娱乐，认证通过店铺授予
        is_active: true,
      }));

    if (inserts.length > 0) {
      await supabaseAdmin.from('player_capabilities').insert(inserts);
    }
  }

  return Response.json({ ok: true });
}