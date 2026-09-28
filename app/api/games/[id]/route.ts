import { supabaseAdmin } from '@/lib/supabase-admin';
import { getSessionUser } from '@/lib/auth-server';

// ============================================================
// PATCH 更新
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
  if (me.role !== 'super_admin') {
    return Response.json({ ok: false, error: '仅超管可操作' }, { status: 403 });
  }

  const id = Number(params.id);
  if (!id) return Response.json({ ok: false, error: '参数错误' }, { status: 400 });

  const body = await req.json();
  const updates: any = { updated_at: new Date().toISOString() };

  if (body.name) updates.name = String(body.name).trim();
  if (body.description !== undefined) updates.description = body.description;
  if (body.logo !== undefined) updates.logo = body.logo;
  if (body.cover !== undefined) updates.cover = body.cover;
  if (Array.isArray(body.ranks)) updates.ranks = body.ranks;
  if (body.hasRank !== undefined) updates.has_rank = body.hasRank;
  if (body.sortOrder !== undefined) updates.sort_order = body.sortOrder;
  if (body.status) updates.status = body.status;

  const { data, error } = await supabaseAdmin
    .from('games')
    .update(updates)
    .eq('id', id)
    .select('*')
    .maybeSingle();

  if (error || !data) {
    return Response.json({ ok: false, error: error?.message || '更新失败' }, { status: 500 });
  }

  return Response.json({ ok: true, game: data });
}

// ============================================================
// DELETE 删除（软删除：改 status）
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
  if (me.role !== 'super_admin') {
    return Response.json({ ok: false, error: '仅超管可操作' }, { status: 403 });
  }

  const id = Number(params.id);
  if (!id) return Response.json({ ok: false, error: '参数错误' }, { status: 400 });

  const { error } = await supabaseAdmin
    .from('games')
    .update({ status: 'disabled', updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });

  return Response.json({ ok: true });
}