import { supabaseAdmin } from '@/lib/supabase-admin';
import { getSessionUser } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!supabaseAdmin) {
    return Response.json({ ok: false, error: '服务器未配置' }, { status: 500 });
  }

  const me = await getSessionUser();
  if (!me) return Response.json({ ok: false, error: '未登录' }, { status: 401 });
  if (me.role !== 'super_admin') {
    return Response.json({ ok: false, error: '无权查看' }, { status: 403 });
  }

  // 今日 0 点
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // 并行查询
  const [
    ordersRes,
    playersRes,
    shopsRes,
    txRes,
    recentOrdersRes,
  ] = await Promise.all([
    supabaseAdmin
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayStart.toISOString()),
    supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'player'),
    supabaseAdmin
      .from('shops')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active'),
    supabaseAdmin
      .from('wallet_transactions')
      .select('amount, type')
      .gte('created_at', todayStart.toISOString()),
    supabaseAdmin
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  // 今日流水：consume + income 的金额和
  const todayIncome = (txRes.data || [])
    .filter((t) => t.type === 'consume')
    .reduce((s, t) => s + Number(t.amount), 0);

  // 待处理：抢单池 + 待陪玩响应
  const { count: pendingCount } = await supabaseAdmin
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .in('status', ['pooling', 'pending_player']);

  return Response.json({
    ok: true,
    stats: {
      todayOrders: ordersRes.count || 0,
      todayIncome,
      totalPlayers: playersRes.count || 0,
      totalShops: shopsRes.count || 0,
      pendingOrders: pendingCount || 0,
    },
    recentOrders: recentOrdersRes.data || [],
  });
}