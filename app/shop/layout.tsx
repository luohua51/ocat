'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
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
      if (u.role !== 'shop_admin' && u.role !== 'super_admin') {
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
          <div className="shop-user-name">{user.nickname}</div>
          <div className="shop-user-sub">店铺 ID：{user.shopId ?? '-'}</div>
          <button className="shop-logout" onClick={handleLogout}>
            退出登录
          </button>
        </div>
      </aside>
      <div className="shop-main">{children}</div>
    </div>
  );
}