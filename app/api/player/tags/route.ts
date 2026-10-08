import { supabaseAdmin } from '@/lib/supabase-admin';
import { getSessionUser } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

// GET 拉自己的标签
export async function GET() {
  if (!supabaseAdmin) {
    return Response.json({ ok: false, error: '服务器未配置' }, { status: 500 });
  }

  const me = await getSessionUser();
  if (!me) return Response.json({ ok: false, error: '未登录' }, { status: 401 });
  if (me.role !== 'player' || !me.playerId) {
    return Response.json({ ok: false, error: '仅陪玩可访问' }, { status: 403 });
  }

  const { data } = await supabaseAdmin
    .from('player_tags')
    .select('category, tag_name, sort_order')
    .eq('player_id', me.playerId)
    .order('sort_order', { ascending: true });

  const voice: string[] = [];
  const style: string[] = [];

  (data || []).forEach((t: any) => {
    if (t.category === 'voice') voice.push(t.tag_name);
    if (t.category === 'style') style.push(t.tag_name);
  });

  return Response.json({ ok: true, voice, style });
}

// PUT 保存自己的标签
export async function PUT(req: Request) {
  if (!supabaseAdmin) {
    return Response.json({ ok: false, error: '服务器未配置' }, { status: 500 });
  }

  const me = await getSessionUser();
  if (!me) return Response.json({ ok: false, error: '未登录' }, { status: 401 });
  if (me.role !== 'player' || !me.playerId) {
    return Response.json({ ok: false, error: '仅陪玩可操作' }, { status: 403 });
  }

  const body = await req.json();
  const voice: string[] = Array.isArray(body.voice) ? body.voice : [];
  const style: string[] = Array.isArray(body.style) ? body.style : [];

  if (voice.length > 2) {
    return Response.json({ ok: false, error: '声音最多 2 个' }, { status: 400 });
  }
  if (style.length > 3) {
    return Response.json({ ok: false, error: '风格最多 3 个' }, { status: 400 });
  }

  // 每个标签最长 10 字
  const tooLong = [...voice, ...style].find((t) => String(t).length > 10);
  if (tooLong) {
    return Response.json(
      { ok: false, error: `标签「${tooLong}」超过 10 字` },
      { status: 400 }
    );
  }

  // 先删旧的
  const { error: delErr } = await supabaseAdmin
    .from('player_tags')
    .delete()
    .eq('player_id', me.playerId);

  if (delErr) {
    return Response.json({ ok: false, error: delErr.message }, { status: 500 });
  }

  // 再插新的
  const inserts: any[] = [];

  voice.forEach((tag, i) => {
    const clean = String(tag).trim();
    if (clean) {
      inserts.push({
        player_id: me.playerId,
        category: 'voice',
        tag_name: clean,
        is_custom: true,
        sort_order: i,
      });
    }
  });

  style.forEach((tag, i) => {
    const clean = String(tag).trim();
    if (clean) {
      inserts.push({
        player_id: me.playerId,
        category: 'style',
        tag_name: clean,
        is_custom: true,
        sort_order: i,
      });
    }
  });

  if (inserts.length > 0) {
    const { error } = await supabaseAdmin.from('player_tags').insert(inserts);
    if (error) {
      return Response.json({ ok: false, error: error.message }, { status: 500 });
    }
  }

  return Response.json({ ok: true });
}