import { supabaseAdmin } from '@/lib/supabase-admin';
import { getSessionUser } from '@/lib/auth-server';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  if (!supabaseAdmin) {
    return Response.json({ ok: false, error: '服务器未配置' }, { status: 500 });
  }

  const me = await getSessionUser();
  if (!me) return Response.json({ ok: false, error: '未登录' }, { status: 401 });

  const id = Number(params.id);
  if (!id) return Response.json({ ok: false, error: '参数错误' }, { status: 400 });

  // 超管可改任意，店长只能改自己的
  if (me.role === 'super_admin') {
    // OK
  } else if (me.role === 'shop_admin' && me.shopId === id) {
    // OK
  } else {
    return Response.json({ ok: false, error: '无权操作' }, { status: 403 });
  }

  const body = await req.json();
  const updates: any = {};
  if (body.name) updates.name = String(body.name).trim();
  if (body.description !== undefined) updates.description = String(body.description).trim();
  if (body.logo !== undefined) updates.logo = body.logo;
  if (body.status && me.role === 'super_admin') updates.status = body.status;
  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from('shops')
    .update(updates)
    .eq('id', id)
    .select('*')
    .maybeSingle();

  if (error || !data) {
    return Response.json({ ok: false, error: error?.message || '更新失败' }, { status: 500 });
  }

  return Response.json({ ok: true, shop: data });
}