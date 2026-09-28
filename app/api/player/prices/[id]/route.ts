import { supabaseAdmin } from '@/lib/supabase-admin';
import { getSessionUser } from '@/lib/auth-server';

// ============================================================
// DELETE 删除散陪价
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
  if (me.role !== 'player' || !me.playerId) {
    return Response.json({ ok: false, error: '仅陪玩可操作' }, { status: 403 });
  }

  const id = Number(params.id);
  if (!id) return Response.json({ ok: false, error: '参数错误' }, { status: 400 });

  // 只能删自己的价格
  const { data: price } = await supabaseAdmin
    .from('player_prices')
    .select('id, player_id')
    .eq('id', id)
    .maybeSingle();

  if (!price) {
    return Response.json({ ok: false, error: '价格不存在' }, { status: 404 });
  }

  if (price.player_id !== me.playerId) {
    return Response.json({ ok: false, error: '无权删除他人价格' }, { status: 403 });
  }

  const { error } = await supabaseAdmin
    .from('player_prices')
    .delete()
    .eq('id', id);

  if (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}