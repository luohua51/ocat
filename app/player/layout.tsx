'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { fetchCurrentUser, logout, type User } from '@/lib/auth';

const MENU = [
  { href: '/player', label: '工作台', icon: '🏠' },
  { href: '/player/hall', label: '抢单大厅', icon: '🔥' },
  { href: '/player/orders', label: '我的订单', icon: '📋' },
  { href: '/player/chat', label: '消息', icon: '💬' },
  { href: '/player/prices', label: '散陪定价', icon: '💰' },
  { href: '/player/wallet', label: '收入提现', icon: '💳' },
  { href: '/player/profile', label: '个人资料', icon: '👤' },
];

export default function PlayerLayout({ children }: { children: React.ReactNode }) {
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
      if (u.role !== 'player') {
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
    <div className="player-layout">
      <aside className="player-sidebar">
        <div className="player-logo">🐱 陪玩工作台</div>
        <nav className="player-nav">
          {MENU.map((item) => {
            const active = item.href === '/player' ? pathname === '/player' : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} className={'player-nav-item' + (active ? ' active' : '')}>
                <span className="player-nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="player-user">
          <div className="player-user-name">{user.nickname}</div>
          <div className="player-user-status">🟢 在线接单中</div>
          <button
            className="player-logout"
            onClick={async () => {
              await logout();
              router.push('/');
            }}
          >
            退出登录
          </button>
        </div>
      </aside>
      <div className="player-main">{children}</div>
    </div>
  );
}