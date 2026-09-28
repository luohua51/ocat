import { supabaseAdmin } from '@/lib/supabase-admin';
import { getSessionUser } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: { orderId: string } }
) {
  if (!supabaseAdmin) {
    return Response.json({ ok: false, error: '服务器未配置' }, { status: 500 });
  }

  const me = await getSessionUser();
  if (!me) return Response.json({ ok: false, error: '未登录' }, { status: 401 });

  const orderId = Number(params.orderId);
  if (!orderId) return Response.json({ ok: false, error: '参数错误' }, { status: 400 });

  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .maybeSingle();

  if (!order) return Response.json({ ok: false, error: '订单不存在' }, { status: 404 });

  // 权限
  const isMember = me.role === 'member' && order.member_id === me.id;
  const isPlayer = me.role === 'player' && order.player_id === me.playerId;
  const isAdmin = me.role === 'super_admin';

  if (!isMember && !isPlayer && !isAdmin) {
    return Response.json({ ok: false, error: '无权查看' }, { status: 403 });
  }

  const { data, error } = await supabaseAdmin
    .from('reviews')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true });

  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });

  // 判断当前用户是否已评过
  const myReview = (data || []).find((r: any) => r.from_user_id === me.id);

  return Response.json({
    ok: true,
    reviews: data || [],
    myReview: myReview || null,
  });
}