import { supabaseAdmin } from '@/lib/supabase-admin';
import { getSessionUser } from '@/lib/auth-server';

// ============================================================
// PATCH 修改价格
// ============================================================
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  if (!supabaseAdmin) {
    return Response.json({ ok: false, error: '服务器未配置' }, { status: 500 });
  }

  const me = await getSessionUser();
  if (!me) return Response.json({ ok: false, error: '未登录' }, { status: 401 });
  if (me.role !== 'shop_admin' || !me.shopId) {
    return Response.json({ ok: false, error: '无权操作' }, { status: 403 });
  }

  const id = Number(params.id);
  if (!id) return Response.json({ ok: false, error: '参数错误' }, { status: 400 });

  const body = await req.json();
  const pricePerHour = Number(body.pricePerHour);
  if (!pricePerHour || pricePerHour <= 0) {
    return Response.json({ ok: false, error: '价格必须大于 0' }, { status: 400 });
  }

  // 校验属于本店
  const { data: price } = await supabaseAdmin
    .from('shop_prices')
    .select('id, shop_id')
    .eq('id', id)
    .maybeSingle();

  if (!price || price.shop_id !== me.shopId) {
    return Response.json({ ok: false, error: '无权修改' }, { status: 403 });
  }

  const { error } = await supabaseAdmin
    .from('shop_prices')
    .update({ price_per_hour: pricePerHour, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });

  return Response.json({ ok: true });
}

// ============================================================
// DELETE 删除（软删除）
// ============================================================
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  if (!supabaseAdmin) {
    return Response.json({ ok: false, error: '服务器未配置' }, { status: 500 });
  }

  const me = await getSessionUser();
  if (!me) return Response.json({ ok: false, error: '未登录' }, { status: 401 });
  if (me.role !== 'shop_admin' || !me.shopId) {
    return Response.json({ ok: false, error: '无权操作' }, { status: 403 });
  }

  const id = Number(params.id);
  if (!id) return Response.json({ ok: false, error: '参数错误' }, { status: 400 });

  const { data: price } = await supabaseAdmin
    .from('shop_prices')
    .select('id, shop_id')
    .eq('id', id)
    .maybeSingle();

  if (!price || price.shop_id !== me.shopId) {
    return Response.json({ ok: false, error: '无权删除' }, { status: 403 });
  }

  const { error } = await supabaseAdmin
    .from('shop_prices')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });

  return Response.json({ ok: true });
}