import { supabaseAdmin } from '@/lib/supabase-admin';
import { getSessionUser } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

// ============================================================
// GET 本店陪玩 + 认证状态
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

  const shopId = me.role === 'shop_admin' ? me.shopId : Number(new URL(name, 'http://x').search);
  // 简化：店长固定看自己的店

  const { data: players, error } = await supabaseAdmin
    .from('users')
    .select('id, username, nickname, player_id, shop_id, status')
    .eq('role', 'player')
    .eq('shop_id', me.shopId || 0);

  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });

  // 查认证关系
  const playerIds = (players || []).map((p) => p.id);

  const { data: certs } = await supabaseAdmin
    .from('player_shops')
    .select('*')
    .in('player_user_id', playerIds.length > 0 ? playerIds : [-1]);

  const certMap = new Map((certs || []).map((c) => [c.player_user_id, c]));

  const enriched = (players || []).map((p) => ({
    user_id: p.id,
    username: p.username,
    nickname: p.nickname,
    player_id: p.player_id,
    tier: certMap.get(p.id)?.tier || null,
  }));

  return Response.json({ ok: true, players: enriched });
}

// ============================================================
// POST 授予/取消档位
// 参数：{ playerUserId, tier }  tier 为 null 表示取消认证
// ============================================================
export async function POST(req: Request) {
  if (!supabaseAdmin) {
    return Response.json({ ok: false, error: '服务器未配置' }, { status: 500 });
  }

  const me = await getSessionUser();
  if (!me) return Response.json({ ok: false, error: '未登录' }, { status: 401 });
  if (me.role !== 'shop_admin') {
    return Response.json({ ok: false, error: '仅店长可操作' }, { status: 403 });
  }

  const body = await req.json();
  const playerUserId = Number(body.playerUserId);
  const tier = body.tier;

  if (!playerUserId) {
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

  // 取消认证
  if (!tier) {
    await supabaseAdmin
      .from('player_shops')
      .delete()
      .eq('player_user_id', playerUserId)
      .eq('shop_id', me.shopId);

    // 同步 players 表 tier
    if (player.player_id) {
      await supabaseAdmin
        .from('players')
        .update({ tier: '娱乐' })
        .eq('id', player.player_id);
    }

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
    .maybeSingle();

  if (existing) {
    await supabaseAdmin
      .from('player_shops')
      .update({ tier, is_active: true, updated_at: new Date().toISOString() })
      .eq('id', existing.id);
  } else {
    await supabaseAdmin.from('player_shops').insert({
      player_user_id: playerUserId,
      shop_id: me.shopId,
      tier,
      is_active: true,
    });
  }

  // 同步 players.tier
  if (player.player_id) {
    await supabaseAdmin
      .from('players')
      .update({ tier })
      .eq('id', player.player_id);
  }

  return Response.json({ ok: true });
}