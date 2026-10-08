import { supabaseAdmin } from '@/lib/supabase-admin';
import { getSessionUser } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET
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

// PUT
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
  const signature =
    body.signature !== undefined ? String(body.signature || '') : undefined;
  const description =
    body.description !== undefined ? String(body.description || '') : undefined;
  const availableTime =
    body.availableTime !== undefined
      ? String(body.availableTime || '')
      : undefined;
  const games = Array.isArray(body.games) ? body.games : undefined;

  console.log('[profile PUT] body:', body);

  // 1. players.name
  if (name) {
    const { error } = await supabaseAdmin
      .from('players')
      .update({ name })
      .eq('id', me.playerId);
    if (error) {
      console.error('[profile PUT] name update error:', error);
      return Response.json(
        { ok: false, error: '更新昵称失败：' + error.message },
        { status: 500 }
      );
    }
  }

  // 2. player_profiles
  const { data: existingProfile, error: queryErr } = await supabaseAdmin
    .from('player_profiles')
    .select('id')
    .eq('player_id', me.playerId)
    .maybeSingle();

  if (queryErr) {
    console.error('[profile PUT] profile query error:', queryErr);
  }

  const patch: any = { player_id: me.playerId };
  if (signature !== undefined) patch.signature = signature;
  if (description !== undefined) patch.description = description;
  if (availableTime !== undefined) patch.available_time = availableTime;

  console.log('[profile PUT] patch:', patch, 'hasExisting:', !!existingProfile);

  if (existingProfile) {
    const { error } = await supabaseAdmin
      .from('player_profiles')
      .update(patch)
      .eq('id', existingProfile.id);
    if (error) {
      console.error('[profile PUT] profile update error:', error);
      return Response.json(
        { ok: false, error: '更新资料失败：' + error.message },
        { status: 500 }
      );
    }
  } else {
    const { error } = await supabaseAdmin
      .from('player_profiles')
      .insert(patch);
    if (error) {
      console.error('[profile PUT] profile insert error:', error);
      return Response.json(
        { ok: false, error: '创建资料失败：' + error.message },
        { status: 500 }
      );
    }
  }

  // 3. 能力
  if (games !== undefined) {
    const { data: gameRows, error: gamesErr } = await supabaseAdmin
      .from('games')
      .select('id, name')
      .eq('status', 'active');

    if (gamesErr) {
      console.error('[profile PUT] games query error:', gamesErr);
      return Response.json(
        { ok: false, error: '查询游戏失败：' + gamesErr.message },
        { status: 500 }
      );
    }

    const gameMap = new Map((gameRows || []).map((g) => [g.name, g.id]));
    const matchedGameIds = games
      .map((g: string) => gameMap.get(g))
      .filter((x): x is number => typeof x === 'number');

    console.log('[profile PUT] games:', games, '→ ids:', matchedGameIds);

    const { error: delErr } = await supabaseAdmin
      .from('player_capabilities')
      .delete()
      .eq('player_id', me.playerId);

    if (delErr) {
      console.error('[profile PUT] caps delete error:', delErr);
      return Response.json(
        { ok: false, error: '清理旧能力失败：' + delErr.message },
        { status: 500 }
      );
    }

    if (matchedGameIds.length > 0) {
      const inserts = matchedGameIds.map((gameId) => ({
        player_id: me.playerId!,
        game_id: gameId,
        tier: '娱乐',
        is_active: true,
      }));

      const { error: insErr } = await supabaseAdmin
        .from('player_capabilities')
        .insert(inserts);

      if (insErr) {
        console.error('[profile PUT] caps insert error:', insErr);
        return Response.json(
          { ok: false, error: '保存能力失败：' + insErr.message },
          { status: 500 }
        );
      }
    }
  }

  return Response.json({ ok: true });
}