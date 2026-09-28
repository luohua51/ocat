import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: { userId: string } }
) {
  if (!supabaseAdmin) {
    return Response.json({ ok: false, error: '服务器未配置' }, { status: 500 });
  }

  const userId = Number(params.userId);
  if (!userId) return Response.json({ ok: false, error: '参数错误' }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('reviews')
    .select('*')
    .eq('to_user_id', userId)
    .eq('to_role', 'player')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });

  // 计算平均分
  const total = (data || []).length;
  const avg = total > 0
    ? (data || []).reduce((s: number, r: any) => s + r.rating, 0) / total
    : 0;

  return Response.json({
    ok: true,
    reviews: data || [],
    total,
    average: Math.round(avg * 10) / 10,
  });
}