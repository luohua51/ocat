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
  if (me.role !== 'player') {
    return Response.json({ ok: false, error: '无权操作' }, { status: 403 });
  }

  const id = Number(params.id);
  if (!id) return Response.json({ ok: false, error: '参数错误' }, { status: 400 });

  const { error } = await supabaseAdmin
    .from('player_prices')
    .delete()
    .eq('id', id)
    .eq('player_id', me.playerId);

  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });

  return Response.json({ ok: true });
}