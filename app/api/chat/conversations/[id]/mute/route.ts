import { supabaseAdmin } from '@/lib/supabase-admin';
import { getSessionUser } from '@/lib/auth-server';

// ============================================================
// POST 切换拒收开关（仅会员可操作）
// 参数：{ muted: boolean }
// ============================================================
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  if (!supabaseAdmin) {
    return Response.json({ ok: false, error: '服务器未配置' }, { status: 500 });
  }

  const me = await getSessionUser();
  if (!me) return Response.json({ ok: false, error: '未登录' }, { status: 401 });
  if (me.role !== 'member') {
    return Response.json({ ok: false, error: '仅会员可操作' }, { status: 403 });
  }

  const id = Number(params.id);
  if (!id) return Response.json({ ok: false, error: '参数错误' }, { status: 400 });

  const { data: conv } = await supabaseAdmin
    .from('conversations')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (!conv) return Response.json({ ok: false, error: '会话不存在' }, { status: 404 });
  if (conv.member_user_id !== me.id) {
    return Response.json({ ok: false, error: '无权操作' }, { status: 403 });
  }

  const body = await req.json();
  const muted = !!body.muted;

  const { error } = await supabaseAdmin
    .from('conversations')
    .update({ member_muted: muted })
    .eq('id', id);

  if (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true, memberMuted: muted });
}