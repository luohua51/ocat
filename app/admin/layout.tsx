'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
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

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const verifiedRef = useRef(false);

  useEffect(() => {
    if (verifiedRef.current) return;
    verifiedRef.current = true;

    let cancelled = false;

    async function init() {
      const u = await fetchCurrentUser();
      if (cancelled) return;

      if (!u) {
        router.replace('/login');
        return;
      }
      if (u.role !== 'super_admin' && u.role !== 'admin') {
        router.replace('/login');
        return;
      }

      setUser(u);
      setLoading(false);
    }

    init();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLogout() {
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