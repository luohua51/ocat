'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { fetchCurrentUser, logout, type User } from '@/lib/auth';
import { fetchConversations } from '@/lib/chat';

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
  const [unread, setUnread] = useState(0);

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

  // 轮询未读消息数
  useEffect(() => {
    if (!user) return;

    async function loadUnread() {
      const list = await fetchConversations();
      const total = list.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
      setUnread(total);
    }

    loadUnread();
    const timer = setInterval(loadUnread, 5000);
    return () => clearInterval(timer);
  }, [user]);

  if (loading || !user) {
    return <div style={{ color: '#fff', padding: '2rem', textAlign: 'center' }}>加载中…</div>;
  }

  return (
    <div className="member-layout">
      <aside className="member-sidebar">
        <div className="member-logo">🐱 会员中心</div>

        <nav className="member-nav">
          {MENU.map((item) => {
            const active =
              item.href === '/member'
                ? pathname === '/member'
                : pathname.startsWith(item.href);
            const isChat = item.href === '/member/chat';
            return (
              <Link
                key={item.href}
                href={item.href}
                className={'member-nav-item' + (active ? ' active' : '')}
              >
                <span className="member-nav-icon">{item.icon}</span>
                <span className="member-nav-label">{item.label}</span>
                {isChat && unread > 0 && (
                  <span className="member-nav-badge">
                    {unread > 99 ? '99+' : unread}
                  </span>
                )}
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