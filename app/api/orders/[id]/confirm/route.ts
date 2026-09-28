import { supabaseAdmin } from '@/lib/supabase-admin';
import { getSessionUser } from '@/lib/auth-server';

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  if (!supabaseAdmin) {
    return Response.json({ ok: false, error: '服务器未配置' }, { status: 500 });
  }

  const me = await getSessionUser();
  if (!me) return Response.json({ ok: false, error: '未登录' }, { status: 401 });
  if (me.role !== 'member') {
    return Response.json({ ok: false, error: '仅会员可确认' }, { status: 403 });
  }

  const id = Number(params.id);
  if (!id) return Response.json({ ok: false, error: '参数错误' }, { status: 400 });

  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (!order) return Response.json({ ok: false, error: '订单不存在' }, { status: 404 });
  if (order.member_id !== me.id) {
    return Response.json({ ok: false, error: '不是你的订单' }, { status: 403 });
  }
  if (order.status !== 'finished') {
    return Response.json({ ok: false, error: '订单状态不对' }, { status: 400 });
  }

  const playerIncome = Number(order.player_income) || 0;
  if (playerIncome > 0 && order.player_id) {
    const { data: playerUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('player_id', order.player_id)
      .maybeSingle();

    if (playerUser) {
      const { data: playerWallet } = await supabaseAdmin
        .from('wallets')
        .select('balance, total_income')
        .eq('user_id', playerUser.id)
        .maybeSingle();

      const currentBalance = playerWallet ? Number(playerWallet.balance) : 0;
      const currentIncome = playerWallet ? Number(playerWallet.total_income) : 0;
      const newBalance = currentBalance + playerIncome;
      const newIncome = currentIncome + playerIncome;

      if (!playerWallet) {
        await supabaseAdmin.from('wallets').insert({
          user_id: playerUser.id,
          balance: playerIncome,
          total_income: playerIncome,
        });
      } else {
        await supabaseAdmin
          .from('wallets')
          .update({
            balance: newBalance,
            total_income: newIncome,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', playerUser.id);
      }

      await supabaseAdmin.from('wallet_transactions').insert({
        user_id: playerUser.id,
        type: 'income',
        amount: playerIncome,
        balance_after: newBalance,
        order_id: id,
        description: `订单 ${order.order_no} 完成，收入 ¥${playerIncome.toFixed(2)}`,
      });
    }
  }

  const { data: updated, error } = await supabaseAdmin
    .from('orders')
    .update({ status: 'completed' })
    .eq('id', id)
    .select('*')
    .maybeSingle();

  if (error || !updated) {
    return Response.json({ ok: false, error: error?.message || '操作失败' }, { status: 500 });
  }

  // 陪玩变回 online
  if (order.player_id) {
    await supabaseAdmin
      .from('players')
      .update({ status: 'online', last_active_at: new Date().toISOString() })
      .eq('id', order.player_id);
  }

  return Response.json({ ok: true, order: updated });
}