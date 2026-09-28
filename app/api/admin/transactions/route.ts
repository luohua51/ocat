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

  // 流水列表
  const { data: txs, error } = await supabaseAdmin
    .from('wallet_transactions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });

  // 拿用户昵称
  const userIds = [...new Set((txs || []).map((t) => t.user_id))];
  const { data: users } = await supabaseAdmin
    .from('users')
    .select('id, username, nickname, role')
    .in('id', userIds.length > 0 ? userIds : [-1]);

  const userMap = new Map((users || []).map((u) => [u.id, u]));

  const enriched = (txs || []).map((t) => ({
    ...t,
    user: userMap.get(t.user_id) || null,
  }));

  // 汇总
  const totalRecharge = (txs || [])
    .filter((t) => t.type === 'recharge')
    .reduce((s, t) => s + Number(t.amount), 0);
  const totalConsume = (txs || [])
    .filter((t) => t.type === 'consume')
    .reduce((s, t) => s + Number(t.amount), 0);
  const totalIncome = (txs || [])
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + Number(t.amount), 0);
  const totalRefund = (txs || [])
    .filter((t) => t.type === 'refund')
    .reduce((s, t) => s + Number(t.amount), 0);

  return Response.json({
    ok: true,
    transactions: enriched,
    summary: {
      totalRecharge,
      totalConsume,
      totalIncome,
      totalRefund,
    },
  });
}