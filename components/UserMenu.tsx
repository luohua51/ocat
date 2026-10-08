'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchCurrentUser, logout, type User } from '@/lib/auth';
import { proxyImage } from '@/lib/image';

const AVATAR_KEY = 'orangecat_avatar_';

export default function UserMenu() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [avatar, setAvatar] = useState('');

  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCurrentUser().then((u) => {
      setUser(u);
      if (u) {
        try {
          const saved = localStorage.getItem(AVATAR_KEY + u.id);
          if (saved) setAvatar(saved);
        } catch {}
      }
      setLoading(false);
    });
  }, []);

  // 点外部关闭
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  function getRoleHome(role: string) {
    if (role === 'super_admin' || role === 'admin') return '/admin';
    if (role === 'shop_admin') return '/shop';
    if (role === 'player') return '/player';
    return '/member';
  }

  function getRoleLabel(role: string) {
    if (role === 'super_admin') return '超级管理员';
    if (role === 'admin') return '管理员';
    if (role === 'shop_admin') return '店铺管理员';
    if (role === 'player') return '陪玩';
    return '会员';
  }

  async function handleLogout() {
    setOpen(false);
    await logout();
    setUser(null);
    setAvatar('');
    router.refresh();
    // 强制刷新页面，清掉缓存
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  }

  if (loading) {
    return (
      <div className="nav-links">
        <span style={{ opacity: 0.4, fontSize: '0.88rem' }}>…</span>
      </div>
    );
  }

  // 未登录
  if (!user) {
    return (
      <div className="nav-links">
        <Link href="/login">登录</Link>
        <Link href="/login?tab=register">注册</Link>
      </div>
    );
  }

  // 已登录
  return (
    <div className="user-menu-wrap" ref={wrapRef}>
      <button
        className="user-menu-trigger"
        onClick={() => setOpen(!open)}
        type="button"
      >
        <div className="user-menu-avatar">
          {avatar ? (
            <img src={proxyImage(avatar)} alt={user.nickname} />
          ) : (
            user.nickname.charAt(0)
          )}
        </div>
        <span className="user-menu-name">{user.nickname}</span>
        <span className="user-menu-caret">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="user-menu-dropdown">
          <div className="user-menu-header">
            <div className="user-menu-header-name">{user.nickname}</div>
            <div className="user-menu-header-role">
              {getRoleLabel(user.role)}
            </div>
          </div>

          <Link
            href={getRoleHome(user.role)}
            className="user-menu-item"
            onClick={() => setOpen(false)}
          >
            <span>👤</span>
            <span>进入{getRoleLabel(user.role)}中心</span>
          </Link>

          <button
            className="user-menu-item user-menu-item-danger"
            onClick={handleLogout}
            type="button"
          >
            <span>🚪</span>
            <span>退出登录</span>
          </button>
        </div>
      )}
    </div>
  );
}