import { supabaseAdmin } from '@/lib/supabase-admin';
import { getSessionUser } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

// ============================================================
// GET /api/wallet  查询当前用户钱包
// ============================================================
export async function GET() {
  if (!supabaseAdmin) {
    return Response.json({ ok: false, error: '服务器未配置' }, { status: 500 });
  }

  const me = await getSessionUser();
  if (!me) {
    return Response.json({ ok: false, error: '未登录' }, { status: 401 });
  }

  const { data: wallet, error } = await supabaseAdmin
    .from('wallets')
    .select('balance, total_income, total_withdrawn')
    .eq('user_id', me.id)
    .maybeSingle();

  if (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }

  // 没有钱包就自动创建一个
  if (!wallet) {
    const { error: insertError } = await supabaseAdmin
      .from('wallets')
      .insert({ user_id: me.id, balance: 0, total_income: 0, total_withdrawn: 0 });

    if (insertError) {
      return Response.json({ ok: false, error: insertError.message }, { status: 500 });
    }

    return Response.json({
      ok: true,
      balance: 0,
      totalIncome: 0,
      totalWithdrawn: 0,
    });
  }

  return Response.json({
    ok: true,
    balance: Number(wallet.balance || 0),
    totalIncome: Number(wallet.total_income || 0),
    totalWithdrawn: Number(wallet.total_withdrawn || 0),
  });
}