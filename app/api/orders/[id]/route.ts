import { supabaseAdmin } from '@/lib/supabase-admin';
import { getSessionUser } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  if (!supabaseAdmin) {
    return Response.json({ ok: false, error: '服务器未配置' }, { status: 500 });
  }

  const me = await getSessionUser();
  if (!me) return Response.json({ ok: false, error: '未登录' }, { status: 401 });

  const id = Number(params.id);
  if (!id) return Response.json({ ok: false, error: '参数错误' }, { status: 400 });

  const { data: order, error } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
  if (!order) return Response.json({ ok: false, error: '订单不存在' }, { status: 404 });

  // 权限校验
  const isMember = me.role === 'member' && order.member_id === me.id;
  const isMyOrder = me.role === 'player' && order.player_id === me.playerId;
  // 陪玩能看抢单池的订单（未指定、还在 pooling）
  const canSeePool =
    me.role === 'player' && order.status === 'pooling' && !order.player_id;
  const isShop = me.role === 'shop_admin' && order.shop_id === me.shopId;
  const isAdmin = me.role === 'super_admin';

  if (!isMember && !isMyOrder && !canSeePool && !isShop && !isAdmin) {
    return Response.json({ ok: false, error: '无权查看' }, { status: 403 });
  }

  return Response.json({ ok: true, order });
}