import { supabaseAdmin } from '@/lib/supabase-admin';
import { getSessionUser } from '@/lib/auth-server';

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  if (!supabaseAdmin) {
    return Response.json({ ok: false, error: '服务器未配置' }, { status: 500 });
  }

  const me = await getSessionUser();
  if (!me) return Response.json({ ok: false, error: '未登录' }, { status: 401 });
  if (me.role !== 'super_admin' && me.role !== 'shop_admin') {
    return Response.json({ ok: false, error: '无权操作' }, { status: 403 });
  }

  const userId = Number(params.id);
  if (!userId) return Response.json({ ok: false, error: '缺少 id' }, { status: 400 });

  // 不能删自己
  if (userId === me.id) {
    return Response.json({ ok: false, error: '不能删除自己' }, { status: 400 });
  }

  // 店长只能删本店陪玩
  if (me.role === 'shop_admin') {
    const { data: target } = await supabaseAdmin
      .from('users')
      .select('role, shop_id')
      .eq('id', userId)
      .maybeSingle();

    if (!target || target.role !== 'player' || target.shop_id !== me.shopId) {
      return Response.json({ ok: false, error: '只能删除本店陪玩' }, { status: 403 });
    }
  }

  const { error } = await supabaseAdmin.from('users').delete().eq('id', userId);
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });

  return Response.json({ ok: true });
}