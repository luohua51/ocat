'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { MOCK_ORDERS, MOCK_PLAYERS, TIER_COLORS } from '@/lib/mock';
import { sortPlayers } from '@/lib/utils';
import { fetchCurrentUser, type User } from '@/lib/auth';

export default function MemberHomePage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetchCurrentUser().then(setUser);
  }, []);

  if (!user) {
    return <div style={{ color: '#fff', padding: '2rem', textAlign: 'center' }}>加载中…</div>;
  }

  const myOrders = MOCK_ORDERS.slice(0, 3);
  const recommended = sortPlayers(MOCK_PLAYERS).slice(0, 4);

  return (
    <>
      <div className="member-header">
        <h1 className="member-title">你好，{user.nickname} 👋</h1>
        <p className="member-subtitle">今天想找谁陪你上分？</p>
      </div>

      <div className="member-quick-actions">
        <Link href="/member/create" className="member-action-card">
          <div className="member-action-icon">➕</div>
          <div className="member-action-label">立即下单</div>
        </Link>
        <Link href="/players" className="member-action-card">
          <div className="member-action-icon">🔍</div>
          <div className="member-action-label">逛陪玩</div>
        </Link>
        <Link href="/member/orders" className="member-action-card">
          <div className="member-action-icon">📋</div>
          <div className="member-action-label">我的订单</div>
        </Link>
        <Link href="/member/wallet" className="member-action-card">
          <div className="member-action-icon">💰</div>
          <div className="member-action-label">钱包</div>
        </Link>
      </div>

      <div className="member-section">
        <div className="member-section-head">
          <h2 className="member-section-title">最近订单</h2>
          <Link href="/member/orders" className="member-more">查看全部 →</Link>
        </div>
        {myOrders.length === 0 ? (
          <div className="member-empty">暂无订单</div>
        ) : (
          <div className="member-order-list">
            {myOrders.map((o) => (
              <Link key={o.id} href={`/member/orders/${o.id}`} className="member-order-item">
                <div>
                  <div className="member-order-title">{o.game} · {o.playerName}</div>
                  <div className="member-order-meta">{o.tier} · {o.hours}h · {o.createdAt}</div>
                </div>
                <div className="member-order-right">
                  <div className="member-order-amount">¥{o.totalAmount.toFixed(2)}</div>
                  <div className="member-order-status">{o.status}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="member-section">
        <div className="member-section-head">
          <h2 className="member-section-title">推荐陪玩</h2>
          <Link href="/players" className="member-more">更多 →</Link>
        </div>
        <div className="member-player-grid">
          {recommended.map((p) => (
            <Link key={p.id} href={`/players/${p.id}`} className="member-player-card">
              <div className="member-player-avatar">
                {p.avatar ? <img src={p.avatar} alt={p.name} /> : p.name.charAt(0)}
              </div>
              <div className="member-player-name">{p.name}</div>
              <div className="member-player-tier" style={{ background: TIER_COLORS[p.tier] }}>{p.tier}</div>
              <div className="member-player-price">¥{p.price}/时起</div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}