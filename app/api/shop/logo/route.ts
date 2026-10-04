import { supabaseAdmin } from '@/lib/supabase-admin';
import { getSessionUser } from '@/lib/auth-server';

export async function POST(req: Request) {
  if (!supabaseAdmin) {
    return Response.json({ ok: false, error: '服务器未配置' }, { status: 500 });
  }

  const me = await getSessionUser();
  if (!me) return Response.json({ ok: false, error: '未登录' }, { status: 401 });
  if (me.role !== 'shop_admin' || !me.shopId) {
    return Response.json({ ok: false, error: '仅店长可操作' }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  if (!file) return Response.json({ ok: false, error: '未收到图片' }, { status: 400 });

  if (!file.type.startsWith('image/')) {
    return Response.json({ ok: false, error: '只支持图片' }, { status: 400 });
  }
  if (file.size > 2 * 1024 * 1024) {
    return Response.json({ ok: false, error: '图片不能超过 2MB' }, { status: 400 });
  }

  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${me.shopId}/logo_${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadErr } = await supabaseAdmin.storage
    .from('shop-logos')
    .upload(path, buffer, { contentType: file.type, upsert: true });

  if (uploadErr) {
    return Response.json({ ok: false, error: uploadErr.message }, { status: 500 });
  }

  const { data: urlData } = supabaseAdmin.storage
    .from('shop-logos')
    .getPublicUrl(path);

  const logo = urlData.publicUrl;

  const { error: updateErr } = await supabaseAdmin
    .from('shops')
    .update({ logo, updated_at: new Date().toISOString() })
    .eq('id', me.shopId);

  if (updateErr) {
    return Response.json({ ok: false, error: updateErr.message }, { status: 500 });
  }

  return Response.json({ ok: true, logo });
}