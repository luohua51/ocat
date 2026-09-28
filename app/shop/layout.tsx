'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { fetchCurrentUser, logout, type User } from '@/lib/auth';

const MENU = [
  { href: '/shop', label: '仪表盘', icon: '📊' },
  { href: '/shop/players', label: '陪玩管理', icon: '👥' },
  { href: '/shop/prices', label: '价格管理', icon: '💰' },
  { href: '/shop/certifications', label: '限定认证', icon: '🏆' },
];

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

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
    <div className="shop-layout">
      <aside className="shop-sidebar">
        <div className="shop-logo">🏪 店铺管理</div>
        <nav className="shop-nav">
          {MENU.map((item) => {
            const active =
              item.href === '/shop'
                ? pathname === '/shop'
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={'shop-nav-item' + (active ? ' active' : '')}
              >
                <span className="shop-nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="shop-user">
          <div className="shop-user-name">{user?.nickname || '未登录'}</div>
          <div className="shop-user-sub">店铺 ID：{user?.shopId ?? '-'}</div>
          <button className="shop-logout" onClick={handleLogout}>
            退出登录
          </button>
        </div>
      </aside>
      <div className="shop-main">{children}</div>
    </div>
  );
}