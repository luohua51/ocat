import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!supabase) {
    return Response.json({
      ok: false,
      stage: 'init',
      error: '环境变量没读到',
      url: process.env.NEXT_PUBLIC_SUPABASE_URL || null,
    });
  }

  const { data, error, count } = await supabase
    .from('players')
    .select('*', { count: 'exact' })
    .limit(3);

  return Response.json({
    ok: !error,
    stage: 'query',
    count,
    error: error ? { message: error.message, code: error.code } : null,
    sample: data?.slice(0, 2) || null,
  });
}