import { clearSessionCookie } from '@/lib/auth-server';

export async function POST() {
  clearSessionCookie();
  return Response.json({ ok: true });
}