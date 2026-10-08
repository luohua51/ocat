import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  if (!supabaseAdmin) {
    return Response.json({ ok: false, error: '服务器未配置' }, { status: 500 });
  }

  const url = new URL(req.url);
  const playerId = Number(url.searchParams.get('playerId'));
  if (!playerId) {
    return Response.json({ ok: false, error: '缺少 playerId' }, { status: 400 });
  }

  const { data } = await supabaseAdmin
    .from('player_tags')
    .select('category, tag_name, sort_order')
    .eq('player_id', playerId)
    .order('sort_order', { ascending: true });

  const voice: string[] = [];
  const style: string[] = [];

  (data || []).forEach((t: any) => {
    if (t.category === 'voice') voice.push(t.tag_name);
    if (t.category === 'style') style.push(t.tag_name);
  });

  return Response.json({ ok: true, voice, style });
}