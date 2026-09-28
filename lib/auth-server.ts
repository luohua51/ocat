import { cookies } from 'next/headers';
import { supabaseAdmin } from './supabase-admin';

export type SessionUser = {
  id: number;
  username: string;
  role: 'super_admin' | 'shop_admin' | 'player' | 'member';
  nickname: string;
  playerId?: number;
  shopId?: number;
  mustChangePassword: boolean;
};

const COOKIE_NAME = 'ocat_session';

/**
 * 设置 session cookie
 */
export function setSessionCookie(userId: number) {
  const c = cookies();
  c.set(COOKIE_NAME, String(userId), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 天
  });
}

/**
 * 清除 session cookie
 */
export function clearSessionCookie() {
  const c = cookies();
  c.delete(COOKIE_NAME);
}

/**
 * 读取当前登录用户
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const c = cookies();
  const raw = c.get(COOKIE_NAME)?.value;
  if (!raw) return null;

  const userId = Number(raw);
  if (!userId) return null;
  if (!supabaseAdmin) return null;

  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id, username, role, nickname, player_id, shop_id, must_change_password, status')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) return null;
  if (data.status !== 'active') return null;

  return {
    id: data.id,
    username: data.username,
    role: data.role,
    nickname: data.nickname,
    playerId: data.player_id ?? undefined,
    shopId: data.shop_id ?? undefined,
    mustChangePassword: data.must_change_password,
  };
}