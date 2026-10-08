import { supabaseAdmin } from '@/lib/supabase-admin';
import { getSessionUser } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  if (!supabaseAdmin) {
    return Response.json({ ok: false, error: '服务器未配置' }, { status: 500 });
  }

  const me = await getSessionUser();
  if (!me) return Response.json({ ok: false, error: '未登录' }, { status: 401 });
  if (me.role !== 'super_admin') {
    return Response.json({ ok: false, error: '仅超管可删除' }, { status: 403 });
  }

  const userId = Number(params.id);
  if (!userId) return Response.json({ ok: false, error: '缺少 id' }, { status: 400 });

  if (userId === me.id) {
    return Response.json({ ok: false, error: '不能删除自己' }, { status: 400 });
  }

  // 1. 查该账号
  const { data: target } = await supabaseAdmin
    .from('users')
    .select('id, player_id, role, username')
    .eq('id', userId)
    .maybeSingle();

  if (!target) {
    return Response.json({ ok: false, error: '账号不存在' }, { status: 404 });
  }

  const playerId = target.player_id;

  try {
    // 2. 如果是陪玩，清理所有关联
    if (target.role === 'player' && playerId) {
      // 订单：保留历史，清空引用
      await supabaseAdmin
        .from('orders')
        .update({ player_id: null, player_name: null })
        .eq('player_id', playerId);

      // 派单记录
      await supabaseAdmin
        .from('order_dispatches')
        .update({ status: 'expired' })
        .eq('player_id', playerId);

      // 会话和消息
      const { data: convs } = await supabaseAdmin
        .from('conversations')
        .select('id')
        .eq('player_user_id', userId);

      const convIds = (convs || []).map((c: any) => c.id);
      if (convIds.length > 0) {
        await supabaseAdmin.from('messages').delete().in('conversation_id', convIds);
        await supabaseAdmin.from('conversations').delete().in('id', convIds);
      }

      // 陪玩相关数据
      await supabaseAdmin.from('player_tags').delete().eq('player_id', playerId);
      await supabaseAdmin.from('player_prices').delete().eq('player_id', playerId);
      await supabaseAdmin.from('player_capabilities').delete().eq('player_id', playerId);
      await supabaseAdmin.from('player_profiles').delete().eq('player_id', playerId);
      await supabaseAdmin.from('player_shops').delete().eq('player_user_id', userId);

      // 钱包
      await supabaseAdmin.from('wallet_transactions').delete().eq('user_id', userId);
      await supabaseAdmin.from('wallets').delete().eq('user_id', userId);
      await supabaseAdmin.from('withdrawals').delete().eq('player_id', playerId);
    }

    // 3. 删 users 记录
    const { error: userErr } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userId);

    if (userErr) {
      console.error('[admin delete] users delete error:', userErr);
      return Response.json({ ok: false, error: userErr.message }, { status: 500 });
    }

    // 4. 如果是陪玩，删 players 记录
    if (target.role === 'player' && playerId) {
      const { error: playerErr } = await supabaseAdmin
        .from('players')
        .delete()
        .eq('id', playerId);

      if (playerErr) {
        console.error('[admin delete] players delete error:', playerErr);
        // 不阻断，只记录日志
      }
    }

    return Response.json({ ok: true });
  } catch (err: any) {
    console.error('[admin delete] 异常:', err);
    return Response.json(
      { ok: false, error: err?.message || '删除失败' },
      { status: 500 }
    );
  }
}