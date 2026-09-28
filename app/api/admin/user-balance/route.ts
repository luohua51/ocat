import { supabaseAdmin } from '@/lib/supabase-admin';
import { getSessionUser } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  if (!supabaseAdmin) {
    return Response.json({ ok: false, error: '服务器未配置' }, { status: 500 });
  }

  const me = await getSessionUser();
  if (!me) return Response.json({ ok: false, error: '未登录' }, { status: 401 });
  if (me.role !== 'super_admin' && me.role !== 'shop_admin') {
    return Response.json({ ok: false, error: '无权查看' }, { status: 403 });
  }

  const url = new URL(req.url);
  const userId = Number(url.searchParams.get('userId'));
  if (!userId) return Response.json({ ok: false, error: '缺少 userId' }, { status: 400 });

  const { data: wallet } = await supabaseAdmin
    .from('wallets')
    .select('balance')
    .eq('user_id', userId)
    .maybeSingle();

  return Response.json({ ok: true, balance: wallet ? Number(wallet.balance) : 0 });
}