import { supabaseAdmin } from '@/lib/supabase-admin';
import { getSessionUser } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

// ============================================================
// GET 游戏列表
// ============================================================
export async function GET() {
  if (!supabaseAdmin) {
    return Response.json({ ok: false, error: '服务器未配置' }, { status: 500 });
  }

  const { data, error } = await supabaseAdmin
    .from('games')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('id', { ascending: true });

  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });

  return Response.json({ ok: true, games: data || [] });
}

// ============================================================
// POST 新建游戏（仅超管）
// ============================================================
export async function POST(req: Request) {
  if (!supabaseAdmin) {
    return Response.json({ ok: false, error: '服务器未配置' }, { status: 500 });
  }

  const me = await getSessionUser();
  if (!me) return Response.json({ ok: false, error: '未登录' }, { status: 401 });
  if (me.role !== 'super_admin') {
    return Response.json({ ok: false, error: '仅超管可操作' }, { status: 403 });
  }

  const body = await req.json();
  const name = String(body.name || '').trim();
  if (!name) return Response.json({ ok: false, error: '请输入游戏名' }, { status: 400 });

  const { data: existing } = await supabaseAdmin
    .from('games')
    .select('id')
    .eq('name', name)
    .maybeSingle();
  if (existing) {
    return Response.json({ ok: false, error: '该游戏已存在' }, { status: 400 });
  }

  const { data: created, error } = await supabaseAdmin
    .from('games')
    .insert({
      name,
      logo: body.logo || null,
      cover: body.cover || null,
      description: body.description || null,
      ranks: Array.isArray(body.ranks) ? body.ranks : [],
      has_rank: body.hasRank !== false,
      sort_order: body.sortOrder || 0,
      status: 'active',
    })
    .select('*')
    .single();

  if (error || !created) {
    return Response.json({ ok: false, error: error?.message || '创建失败' }, { status: 500 });
  }

  return Response.json({ ok: true, game: created });
}