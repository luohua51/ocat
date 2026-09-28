'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { fetchCurrentUser, type User } from '@/lib/auth';

type ShopInfo = {
  id: number;
  name: string;
  description: string | null;
  playerCount: number;
};

export default function ShopDashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [shop, setShop] = useState<ShopInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const u = await fetchCurrentUser();
      setUser(u);

      if (!u || !u.shopId) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/shops', { cache: 'no-store' });
        const data = await res.json();
        if (data.ok && data.shops && data.shops.length > 0) {
          setShop(data.shops[0]);
        }
      } catch (err) {
        console.error('加载店铺信息失败', err);
      }

      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return <div className="shop-empty">加载中…</div>;
  }

  if (!user) {
    return <div className="shop-empty">未登录</div>;
  }

  if (!shop) {
    return (
      <>
        <div className="shop-header">
          <h1 className="shop-title">店铺管理</h1>
          <p className="shop-subtitle">未绑定店铺，请联系超级管理员</p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="shop-header">
        <h1 className="shop-title">{shop.name}</h1>
        <p className="shop-subtitle">{shop.description || '暂无简介'}</p>
      </div>

      <div className="shop-stats">
        <div className="shop-stat-card">
          <div className="shop-stat-label">本店陪玩</div>
          <div className="shop-stat-value">{shop.playerCount}</div>
        </div>
        <div className="shop-stat-card">
          <div className="shop-stat-label">店铺 ID</div>
          <div className="shop-stat-value">{shop.id}</div>
        </div>
        <div className="shop-stat-card">
          <div className="shop-stat-label">店长</div>
          <div className="shop-stat-value" style={{ fontSize: '1.1rem', paddingTop: '0.5rem' }}>
            {user.nickname}
          </div>
        </div>
        <div className="shop-stat-card">
          <div className="shop-stat-label">状态</div>
          <div className="shop-stat-value" style={{ color: '#34d399', fontSize: '1.1rem', paddingTop: '0.5rem' }}>
            正常营业
          </div>
        </div>
      </div>

      <div className="shop-section">
        <div className="shop-section-head">
          <h2 className="shop-section-title">快捷操作</h2>
        </div>
        <div className="shop-quick-actions">
          <Link href="/shop/players" className="shop-action-card">
            <div className="shop-action-icon">👥</div>
            <div className="shop-action-label">陪玩管理</div>
          </Link>
          <Link href="/shop/prices" className="shop-action-card">
            <div className="shop-action-icon">💰</div>
            <div className="shop-action-label">价格管理</div>
          </Link>
          <Link href="/shop/certifications" className="shop-action-card">
            <div className="shop-action-icon">🏆</div>
            <div className="shop-action-label">限定认证</div>
          </Link>
        </div>
      </div>

      <div className="shop-note">
        💡 数据与超级管理员实时同步。超管创建店铺 → 你可以直接登录管理。
      </div>
    </>
  );
}