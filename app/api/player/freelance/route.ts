import { supabaseAdmin } from '@/lib/supabase-admin';
import { getSessionUser } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

// GET 查询当前开关
export async function GET() {
  if (!supabaseAdmin) {
    return Response.json({ ok: false, error: '服务器未配置' }, { status: 500 });
  }

  const me = await getSessionUser();
  if (!me) return Response.json({ ok: false, error: '未登录' }, { status: 401 });
  if (me.role !== 'player' || !me.playerId) {
    return Response.json({ ok: false, error: '仅陪玩可操作' }, { status: 403 });
  }

  const { data } = await supabaseAdmin
    .from('players')
    .select('accept_freelance')
    .eq('id', me.playerId)
    .maybeSingle();

  return Response.json({
    ok: true,
    acceptFreelance: !!data?.accept_freelance,
  });
}

// POST 切换开关
// 参数：{ accept: boolean }
export async function POST(req: Request) {
  if (!supabaseAdmin) {
    return Response.json({ ok: false, error: '服务器未配置' }, { status: 500 });
  }

  const me = await getSessionUser();
  if (!me) return Response.json({ ok: false, error: '未登录' }, { status: 401 });
  if (me.role !== 'player' || !me.playerId) {
    return Response.json({ ok: false, error: '仅陪玩可操作' }, { status: 403 });
  }

  const body = await req.json();
  const accept = !!body.accept;

  const { error } = await supabaseAdmin
    .from('players')
    .update({ accept_freelance: accept, updated_at: new Date().toISOString() })
    .eq('id', me.playerId);

  if (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true, acceptFreelance: accept });
}