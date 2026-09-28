'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { fetchCurrentUser, logout, type User } from '@/lib/auth';

const MENU = [
  { href: '/member', label: '首页', icon: '🏠' },
  { href: '/member/create', label: '下单', icon: '➕' },
  { href: '/member/orders', label: '我的订单', icon: '📋' },
  { href: '/member/chat', label: '消息', icon: '💬' },
  { href: '/member/wallet', label: '钱包', icon: '💰' },
  { href: '/member/profile', label: '个人资料', icon: '👤' },
];

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCurrentUser().then((u) => {
      if (!u) {
        router.replace('/login?redirect=' + pathname);
        return;
      }
      if (u.role !== 'member') {
        router.replace('/login');
        return;
      }
      setUser(u);
      setLoading(false);
    });
  }, [router, pathname]);

  if (loading || !user) {
    return <div style={{ color: '#fff', padding: '2rem', textAlign: 'center' }}>加载中…</div>;
  }

  return (
    <div className="member-layout">
      <aside className="member-sidebar">
        <div className="member-logo">🐱 会员中心</div>
        <nav className="member-nav">
          {MENU.map((item) => {
            const active = item.href === '/member' ? pathname === '/member' : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} className={'member-nav-item' + (active ? ' active' : '')}>
                <span className="member-nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="member-user">
          <div className="member-user-name">{user.nickname}</div>
          <button
            className="member-logout"
            onClick={async () => {
              await logout();
              router.push('/');
            }}
          >
            退出登录
          </button>
        </div>
      </aside>
      <div className="member-main">{children}</div>
    </div>
  );
}