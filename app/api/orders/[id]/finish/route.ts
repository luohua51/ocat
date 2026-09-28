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
  if (me.role !== 'player') {
    return Response.json({ ok: false, error: '仅陪玩可操作' }, { status: 403 });
  }

  const id = Number(params.id);
  if (!id) return Response.json({ ok: false, error: '参数错误' }, { status: 400 });

  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (!order) return Response.json({ ok: false, error: '订单不存在' }, { status: 404 });
  if (order.player_id !== me.playerId) {
    return Response.json({ ok: false, error: '不是你的订单' }, { status: 403 });
  }
  if (order.status !== 'in_service') {
    return Response.json({ ok: false, error: '订单状态不对' }, { status: 400 });
  }

  const { data: updated, error } = await supabaseAdmin
    .from('orders')
    .update({
      status: 'finished',
      finished_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .maybeSingle();

  if (error || !updated) {
    return Response.json({ ok: false, error: error?.message || '操作失败' }, { status: 500 });
  }

  return Response.json({ ok: true, order: updated });
}