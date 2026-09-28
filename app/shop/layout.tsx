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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const u = await fetchCurrentUser();
        if (cancelled) return;

        if (!u) {
          router.replace('/login?redirect=' + pathname);
          return;
        }

        // 放宽：shop_admin 和 super_admin 都能进
        if (u.role !== 'shop_admin' && u.role !== 'super_admin') {
          router.replace('/login');
          return;
        }

        setUser(u);
        setLoading(false);
      } catch (err) {
        console.error('[shop layout] 加载用户失败', err);
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [router, pathname]);

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
          <button
            className="shop-logout"
            onClick={async () => {
              await logout();
              router.push('/');
            }}
          >
            退出登录
          </button>
        </div>
      </aside>
      <div className="shop-main">{children}</div>
    </div>
  );
}