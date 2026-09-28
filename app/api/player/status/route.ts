import { supabaseAdmin } from '@/lib/supabase-admin';
import { getSessionUser } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

// 心跳阈值：3 分钟
const HEARTBEAT_TIMEOUT_MS = 3 * 60 * 1000;

// ============================================================
// GET 拉当前状态
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

  const { data: player } = await supabaseAdmin
    .from('players')
    .select('status, last_active_at')
    .eq('id', me.playerId)
    .maybeSingle();

  if (!player) {
    return Response.json({ ok: false, error: '陪玩不存在' }, { status: 404 });
  }

  // 判断是否算离线（心跳超时）
  let effectiveStatus = player.status;
  if (player.status !== 'offline' && player.last_active_at) {
    const diff = Date.now() - new Date(player.last_active_at).getTime();
    if (diff > HEARTBEAT_TIMEOUT_MS) {
      effectiveStatus = 'offline';
      // 顺便写回数据库
      await supabaseAdmin
        .from('players')
        .update({ status: 'offline' })
        .eq('id', me.playerId);
    }
  }

  return Response.json({
    ok: true,
    status: effectiveStatus,
    lastActiveAt: player.last_active_at,
  });
}

// ============================================================
// POST 切换状态或心跳
// 参数：{ action: 'toggle' | 'heartbeat', status?: 'online' | 'offline' }
// ============================================================
export async function POST(req: Request) {
  if (!supabaseAdmin) {
    return Response.json({ ok: false, error: '服务器未配置' }, { status: 500 });
  }

  const me = await getSessionUser();
  if (!me) return Response.json({ ok: false, error: '未登录' }, { status: 401 });
  if (me.role !== 'player' || !me.playerId) {
    return Response.json({ ok: false, error: '非陪玩账号' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const action = body.action || 'heartbeat';

  // 查当前状态
  const { data: player } = await supabaseAdmin
    .from('players')
    .select('status')
    .eq('id', me.playerId)
    .maybeSingle();

  if (!player) {
    return Response.json({ ok: false, error: '陪玩不存在' }, { status: 404 });
  }

  if (action === 'toggle') {
    // 手动切换 online <-> offline（busy 不能手动切）
    if (player.status === 'busy') {
      return Response.json(
        { ok: false, error: '服务中无法切换状态' },
        { status: 400 }
      );
    }
    const newStatus = player.status === 'online' ? 'offline' : 'online';

    await supabaseAdmin
      .from('players')
      .update({
        status: newStatus,
        last_active_at: new Date().toISOString(),
      })
      .eq('id', me.playerId);

    return Response.json({ ok: true, status: newStatus });
  }

  // 默认心跳：只更新 last_active_at，不改 status
  // 但如果当前 offline，心跳不会自动上线（需要手动切换）
  if (player.status === 'online' || player.status === 'busy') {
    await supabaseAdmin
      .from('players')
      .update({ last_active_at: new Date().toISOString() })
      .eq('id', me.playerId);
  }

  return Response.json({ ok: true, status: player.status });
}