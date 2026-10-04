import { supabaseAdmin } from '@/lib/supabase-admin';
import { getSessionUser } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

// GET 所有游戏的权益和须知
export async function GET() {
  if (!supabaseAdmin) {
    return Response.json({ ok: false, error: '服务器未配置' }, { status: 500 });
  }

  const me = await getSessionUser();
  if (!me) return Response.json({ ok: false, error: '未登录' }, { status: 401 });
  if (me.role !== 'shop_admin' || !me.shopId) {
    return Response.json({ ok: false, error: '仅店长可访问' }, { status: 403 });
  }

  const { data: games } = await supabaseAdmin
    .from('games')
    .select('id, name, logo')
    .eq('status', 'active')
    .order('sort_order', { ascending: true })
    .order('id', { ascending: true });

  const { data: shop } = await supabaseAdmin
    .from('shops')
    .select('game_benefits, game_notices')
    .eq('id', me.shopId)
    .maybeSingle();

  const benefits = (shop?.game_benefits as Record<string, string>) || {};
  const notices = (shop?.game_notices as Record<string, string>) || {};

  const result = (games || []).map((g) => ({
    gameId: g.id,
    gameName: g.name,
    gameLogo: g.logo || '',
    benefit: benefits[String(g.id)] || '',
    notice: notices[String(g.id)] || '',
  }));

  return Response.json({ ok: true, games: result });
}

// PUT 更新某个游戏的权益和须知
// Body: { gameId, benefit, notice }
export async function PUT(req: Request) {
  if (!supabaseAdmin) {
    return Response.json({ ok: false, error: '服务器未配置' }, { status: 500 });
  }

  const me = await getSessionUser();
  if (!me) return Response.json({ ok: false, error: '未登录' }, { status: 401 });
  if (me.role !== 'shop_admin' || !me.shopId) {
    return Response.json({ ok: false, error: '仅店长可操作' }, { status: 403 });
  }

  const body = await req.json();
  const gameId = Number(body.gameId);
  if (!gameId) return Response.json({ ok: false, error: '缺少 gameId' }, { status: 400 });

  const benefit = String(body.benefit || '');
  const notice = String(body.notice || '');

  // 读现有
  const { data: shop } = await supabaseAdmin
    .from('shops')
    .select('game_benefits, game_notices')
    .eq('id', me.shopId)
    .maybeSingle();

  const benefits = { ...((shop?.game_benefits as object) || {}) } as Record<string, string>;
  const notices = { ...((shop?.game_notices as object) || {}) } as Record<string, string>;

  benefits[String(gameId)] = benefit;
  notices[String(gameId)] = notice;

  const { error } = await supabaseAdmin
    .from('shops')
    .update({
      game_benefits: benefits,
      game_notices: notices,
      updated_at: new Date().toISOString(),
    })
    .eq('id', me.shopId);

  if (error) {
    console.error('[shop benefits PUT]', error);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}