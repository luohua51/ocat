'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { fetchCurrentUser, logout, type User } from '@/lib/auth';

const MENU = [
  { href: '/admin', label: '仪表盘', icon: '📊' },
  { href: '/admin/shops', label: '店铺管理', icon: '🏪' },
  { href: '/admin/players', label: '陪玩管理', icon: '👤' },
  { href: '/admin/members', label: '会员管理', icon: '👥' },
  { href: '/admin/games', label: '游戏管理', icon: '🎮' },
  { href: '/admin/orders', label: '全局订单', icon: '📋' },
  { href: '/admin/transactions', label: '全局流水', icon: '💰' },
  { href: '/admin/disputes', label: '投诉仲裁', icon: '⚖️' },
  { href: '/admin/settings', label: '平台设置', icon: '⚙️' },
];

const CACHE_KEY = 'ocat_user_admin';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    // 1. 先用缓存渲染
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const u = JSON.parse(cached) as User;
        if (u.role === 'super_admin' || u.role === 'admin') {
          setUser(u);
          setLoading(false);
        }
      }
    } catch {}

    // 2. 再请求真实用户（异步校验）
    async function verify() {
      const u = await fetchCurrentUser();
      if (cancelled) return;

      if (!u) {
        // 只有明确未登录时才跳
        sessionStorage.removeItem(CACHE_KEY);
        router.replace('/login?redirect=' + pathname);
        return;
      }

      if (u.role !== 'super_admin' && u.role !== 'admin') {
        router.replace('/login');
        return;
      }

      sessionStorage.setItem(CACHE_KEY, JSON.stringify(u));
      setUser(u);
      setLoading(false);
    }

    verify();
    return () => {
      cancelled = true;
    };
    // 只在首次挂载时校验，切页面不再重复校验
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLogout() {
    sessionStorage.removeItem(CACHE_KEY);
    await logout();
    router.push('/');
  }

  if (loading || !user) {
    return <div style={{ color: '#fff', padding: '2rem', textAlign: 'center' }}>加载中…</div>;
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-logo">🐱 平台管理</div>
        <nav className="admin-nav">
          {MENU.map((item) => {
            const active =
              item.href === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={'admin-nav-item' + (active ? ' active' : '')}
              >
                <span className="admin-nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="admin-user">
          <div className="admin-user-name">{user.nickname}</div>
          <button className="admin-logout" onClick={handleLogout}>
            退出登录
          </button>
        </div>
      </aside>
      <div className="admin-main">{children}</div>
    </div>
  );
}