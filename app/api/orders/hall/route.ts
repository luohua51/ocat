import { supabaseAdmin } from '@/lib/supabase-admin';
import { getSessionUser } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!supabaseAdmin) {
    return Response.json({ ok: false, error: '服务器未配置' }, { status: 500 });
  }

  const me = await getSessionUser();
  if (!me) return Response.json({ ok: false, error: '未登录' }, { status: 401 });
  if (me.role !== 'player') {
    return Response.json({ ok: false, error: '仅陪玩可看抢单池' }, { status: 403 });
  }

  const { data, error } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('status', 'pooling')
    .is('player_id', null)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });

  return Response.json({ ok: true, orders: data || [] });
}