import { supabaseAdmin } from '@/lib/supabase-admin';
import { getSessionUser } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!supabaseAdmin) {
    return Response.json({ ok: false, error: '服务器未配置' }, { status: 500 });
  }

  const me = await getSessionUser();
  if (!me) return Response.json({ ok: false, error: '未登录' }, { status: 401 });

  const { data: wallet } = await supabaseAdmin
    .from('wallets')
    .select('balance, total_income, total_withdrawn')
    .eq('user_id', me.id)
    .maybeSingle();

  if (!wallet) {
    // 自动创建
    await supabaseAdmin.from('wallets').insert({ user_id: me.id, balance: 0 });
    return Response.json({ ok: true, balance: 0, totalIncome: 0, totalWithdrawn: 0 });
  }

  return Response.json({
    ok: true,
    balance: Number(wallet.balance),
    totalIncome: Number(wallet.total_income),
    totalWithdrawn: Number(wallet.total_withdrawn),
  });
}