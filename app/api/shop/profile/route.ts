import { supabaseAdmin } from '@/lib/supabase-admin';
import { getSessionUser } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

// GET 当前店长的店铺资料
export async function GET() {
  if (!supabaseAdmin) {
    return Response.json({ ok: false, error: '服务器未配置' }, { status: 500 });
  }

  const me = await getSessionUser();
  if (!me) return Response.json({ ok: false, error: '未登录' }, { status: 401 });
  if (me.role !== 'shop_admin' || !me.shopId) {
    return Response.json({ ok: false, error: '仅店长可访问' }, { status: 403 });
  }

  const { data: shop } = await supabaseAdmin
    .from('shops')
    .select('*')
    .eq('id', me.shopId)
    .maybeSingle();

  if (!shop) {
    return Response.json({ ok: false, error: '店铺不存在' }, { status: 404 });
  }

  return Response.json({ ok: true, shop });
}

// PUT 更新店铺资料
export async function PUT(req: Request) {
  if (!supabaseAdmin) {
    return Response.json({ ok: false, error: '服务器未配置' }, { status: 500 });
  }

  const me = await getSessionUser();
  if (!me) return Response.json({ ok: false, error: '未登录' }, { status: 401 });
  if (me.role !== 'shop_admin' || !me.shopId) {
    return Response.json({ ok: false, error: '仅店长可操作' }, { status: 403 });
  }

  const body = await req.json();
  const updates: any = {};

  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (!name) return Response.json({ ok: false, error: '名称不能为空' }, { status: 400 });
    updates.name = name;
  }
  if (body.description !== undefined) updates.description = String(body.description || '');
  if (body.businessHours !== undefined) updates.business_hours = String(body.businessHours || '');
  if (body.contactWechat !== undefined) updates.contact_wechat = String(body.contactWechat || '');
  if (body.logo !== undefined) updates.logo = String(body.logo || '');

  if (Object.keys(updates).length === 0) {
    return Response.json({ ok: true });
  }

  updates.updated_at = new Date().toISOString();

  const { error } = await supabaseAdmin
    .from('shops')
    .update(updates)
    .eq('id', me.shopId);

  if (error) {
    console.error('[shop profile PUT]', error);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}