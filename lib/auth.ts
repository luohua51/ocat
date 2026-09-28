'use client';

// ============================================================
// 类型
// ============================================================
export type Role = 'super_admin' | 'shop_admin' | 'player' | 'member';

export type User = {
  id: number;
  username: string;
  role: Role;
  nickname: string;
  playerId?: number;
  shopId?: number;
  mustChangePassword: boolean;
};

// ============================================================
// 登录
// ============================================================
export async function login(
  username: string,
  password: string
): Promise<{
  ok: boolean;
  user?: User;
  redirect?: string;
  error?: string;
  mustChangePassword?: boolean;
}> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();

  if (!data.ok) return { ok: false, error: data.error || '登录失败' };

  return {
    ok: true,
    user: data.user,
    redirect: data.redirect,
    mustChangePassword: data.user?.mustChangePassword,
  };
}

// ============================================================
// 会员注册
// ============================================================
export async function register(
  username: string,
  password: string,
  nickname: string
): Promise<{ ok: boolean; user?: User; redirect?: string; error?: string }> {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, nickname }),
  });
  const data = await res.json();

  if (!data.ok) return { ok: false, error: data.error || '注册失败' };
  return { ok: true, user: data.user, redirect: data.redirect };
}

// ============================================================
// 登出
// ============================================================
export async function logout() {
  await fetch('/api/auth/logout', { method: 'POST' });
}

// ============================================================
// 获取当前用户
// ============================================================
export async function fetchCurrentUser(): Promise<User | null> {
  try {
    const res = await fetch('/api/auth/session', { cache: 'no-store' });
    const data = await res.json();
    if (!data.ok) return null;
    return data.user as User;
  } catch {
    return null;
  }
}

// ============================================================
// 修改密码
// ============================================================
export async function changePassword(
  oldPassword: string,
  newPassword: string
): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch('/api/auth/change-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ oldPassword, newPassword }),
  });
  const data = await res.json();
  return data.ok ? { ok: true } : { ok: false, error: data.error || '修改失败' };
}

// ============================================================
// 管理端：查询用户列表
// ============================================================
export async function fetchUsers(params?: {
  role?: Role;
  shopId?: number;
}): Promise<User[]> {
  const qs = new URLSearchParams();
  if (params?.role) qs.set('role', params.role);
  if (params?.shopId) qs.set('shopId', String(params.shopId));

  const res = await fetch('/api/admin/users?' + qs.toString(), { cache: 'no-store' });
  const data = await res.json();
  if (!data.ok) return [];

  return (data.users || []).map((u: any) => ({
    id: u.id,
    username: u.username,
    role: u.role,
    nickname: u.nickname,
    playerId: u.player_id ?? undefined,
    shopId: u.shop_id ?? undefined,
    mustChangePassword: u.must_change_password,
  }));
}

// ============================================================
// 管理端：创建账号
// ============================================================
export async function createUser(params: {
  username: string;
  nickname: string;
  role: Role;
  playerId?: number;
  shopId?: number;
}): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch('/api/admin/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  return data.ok ? { ok: true } : { ok: false, error: data.error || '创建失败' };
}

// ============================================================
// 管理端：删除账号
// ============================================================
export async function deleteUser(
  userId: number
): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch('/api/admin/users/' + userId, { method: 'DELETE' });
  const data = await res.json();
  return data.ok ? { ok: true } : { ok: false, error: data.error || '删除失败' };
}

// ============================================================
// 管理端：重置密码
// ============================================================
export async function resetPasswordByAdmin(
  userId: number
): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch('/api/admin/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  const data = await res.json();
  return data.ok ? { ok: true } : { ok: false, error: data.error || '重置失败' };
}

// ============================================================
// 角色辅助
// ============================================================
export function getRoleHome(role: Role): string {
  switch (role) {
    case 'super_admin':
      return '/admin';
    case 'shop_admin':
      return '/shop';
    case 'player':
      return '/player';
    case 'member':
    default:
      return '/member';
  }
}

export function getRoleLabel(role: Role): string {
  const map: Record<Role, string> = {
    super_admin: '超级管理员',
    shop_admin: '店铺管理员',
    player: '陪玩',
    member: '会员',
  };
  return map[role] || role;
}