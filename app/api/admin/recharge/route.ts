import { supabaseAdmin } from '@/lib/supabase-admin';
import { getSessionUser } from '@/lib/auth-server';

export async function POST(req: Request) {
  if (!supabaseAdmin) {
    return Response.json({ ok: false, error: '服务器未配置' }, { status: 500 });
  }

  const me = await getSessionUser();
  if (!me) return Response.json({ ok: false, error: '未登录' }, { status: 401 });
  if (me.role !== 'super_admin' && me.role !== 'shop_admin') {
    return Response.json({ ok: false, error: '无权操作' }, { status: 403 });
  }

  const body = await req.json();
  const userId = Number(body.userId);
  const amount = Number(body.amount);
  const description = String(body.description || '人工充值');

  if (!userId) return Response.json({ ok: false, error: '缺少 userId' }, { status: 400 });
  if (!amount || amount <= 0) {
    return Response.json({ ok: false, error: '金额必须大于 0' }, { status: 400 });
  }

  // 确保钱包存在
  const { data: wallet } = await supabaseAdmin
    .from('wallets')
    .select('id, balance')
    .eq('user_id', userId)
    .maybeSingle();

  let newBalance: number;

  if (!wallet) {
    await supabaseAdmin.from('wallets').insert({ user_id: userId, balance: amount });
    newBalance = amount;
  } else {
    newBalance = Number(wallet.balance) + amount;
    const { error } = await supabaseAdmin
      .from('wallets')
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq('user_id', userId);
    if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
  }

  // 记流水
  await supabaseAdmin.from('wallet_transactions').insert({
    user_id: userId,
    type: 'recharge',
    amount,
    balance_after: newBalance,
    description,
  });

  return Response.json({ ok: true, newBalance });
}