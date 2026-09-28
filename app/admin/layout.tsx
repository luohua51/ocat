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

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  // 只拉一次用户信息，不跳转
  useEffect(() => {
    fetchCurrentUser().then((u) => {
      if (u) setUser(u);
    });
  }, []);

  async function handleLogout() {
    await logout();
    router.push('/');
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
          <div className="admin-user-name">{user?.nickname || '未登录'}</div>
          <button className="admin-logout" onClick={handleLogout}>
            退出登录
          </button>
        </div>
      </aside>
      <div className="admin-main">{children}</div>
    </div>
  );
}