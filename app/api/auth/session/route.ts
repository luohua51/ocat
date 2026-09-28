import { getSessionUser } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false });
  return Response.json({ ok: true, user });
}