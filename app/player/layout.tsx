'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { fetchCurrentUser, logout, type User } from '@/lib/auth';
import { fetchConversations } from '@/lib/chat';
import {
  fetchMyStatus,
  toggleMyStatus,
  sendHeartbeat,
  type PlayerStatus,
} from '@/lib/player';

const MENU = [
  { href: '/player', label: '工作台', icon: '🏠' },
  { href: '/player/hall', label: '抢单大厅', icon: '🔥' },
  { href: '/player/orders', label: '我的订单', icon: '📋' },
  { href: '/player/chat', label: '消息', icon: '💬' },
  { href: '/player/prices', label: '散陪定价', icon: '💰' },
  { href: '/player/wallet', label: '收入提现', icon: '💳' },
  { href: '/player/profile', label: '个人资料', icon: '👤' },
];

const STATUS_TEXT: Record<PlayerStatus, string> = {
  online: '🟢 接单中',
  offline: '⚪ 已离线',
  busy: '🟠 服务中',
};

export default function PlayerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [unread, setUnread] = useState(0);
  const [status, setStatus] = useState<PlayerStatus>('offline');
  const [toggling, setToggling] = useState(false);

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

  // 未读消息轮询
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

  // 状态：进入自动上线 + 心跳保活
  useEffect(() => {
    if (!user) return;

    async function init() {
      const s = await fetchMyStatus();
      setStatus(s);

      // 进入陪玩端时，如果当前是 offline，自动上线（busy 不动）
      if (s === 'offline') {
        const r = await toggleMyStatus();
        if (r.ok && r.status) {
          setStatus(r.status);
        }
      }
    }

    init();

    // 心跳：每 60 秒一次；同时刷新一下状态
    const timer = setInterval(async () => {
      await sendHeartbeat();
      const s = await fetchMyStatus();
      setStatus(s);
    }, 60 * 1000);

    // 离开页面时（切 tab / 关页面）发送一次心跳，让状态保留
    function handleVisibility() {
      if (document.visibilityState === 'visible') {
        // 回到页面：立刻心跳一下
        sendHeartbeat();
      }
    }

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [user]);

  async function handleToggle() {
    if (toggling) return;
    setToggling(true);
    const r = await toggleMyStatus();
    setToggling(false);
    if (r.ok && r.status) {
      setStatus(r.status);
    } else if (r.error) {
      alert(r.error);
    }
  }

  if (loading || !user) {
    return <div style={{ color: '#fff', padding: '2rem', textAlign: 'center' }}>加载中…</div>;
  }

  return (
    <div className="player-layout">
      <aside className="player-sidebar">
        <div className="player-logo">🐱 陪玩工作台</div>
        <nav className="player-nav">
          {MENU.map((item) => {
            const active =
              item.href === '/player'
                ? pathname === '/player'
                : pathname.startsWith(item.href);
            const isChat = item.href === '/player/chat';
            return (
              <Link
                key={item.href}
                href={item.href}
                className={'player-nav-item' + (active ? ' active' : '')}
              >
                <span className="player-nav-icon">{item.icon}</span>
                <span className="player-nav-label">{item.label}</span>
                {isChat && unread > 0 && (
                  <span className="player-nav-badge">
                    {unread > 99 ? '99+' : unread}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="player-user">
          <div className="player-user-name">{user.nickname}</div>

          <button
            className={'player-status-toggle status-' + status}
            onClick={handleToggle}
            disabled={toggling || status === 'busy'}
          >
            {toggling ? '切换中…' : STATUS_TEXT[status]}
          </button>

          {status !== 'busy' && (
            <div className="player-status-hint">
              点击切换在线 / 离线
            </div>
          )}
          {status === 'busy' && (
            <div className="player-status-hint">有进行中的订单</div>
          )}

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