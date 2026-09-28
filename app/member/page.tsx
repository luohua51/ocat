'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { fetchCurrentUser, type User } from '@/lib/auth';
import { fetchOrders, ORDER_STATUS_TEXT, type Order } from '@/lib/order';
import { fetchPlayers, type PlayerDisplay } from '@/lib/db';
import { TIER_COLORS } from '@/lib/mock';
import { sortPlayers } from '@/lib/utils';

export default function MemberHomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [recommended, setRecommended] = useState<PlayerDisplay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [u, o, p] = await Promise.all([
        fetchCurrentUser(),
        fetchOrders(),
        fetchPlayers(),
      ]);
      setUser(u);
      setOrders(o.slice(0, 3));
      setRecommended(sortPlayers(p).slice(0, 4));
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return <div style={{ color: '#fff', padding: '2rem', textAlign: 'center' }}>加载中…</div>;
  }

  if (!user) return null;

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
        {orders.length === 0 ? (
          <div className="member-empty">还没有订单，去下单试试吧～</div>
        ) : (
          <div className="member-order-list">
            {orders.map((o) => (
              <Link key={o.id} href={`/member/orders/${o.id}`} className="member-order-item">
                <div>
                  <div className="member-order-title">{o.game_name} · {o.player_name || '待分配'}</div>
                  <div className="member-order-meta">
                    {o.tier} · {o.duration_hours}h · {o.order_no}
                  </div>
                  <div style={{ marginTop: '0.4rem' }}>
                    <span className="member-order-tag">
                      {ORDER_STATUS_TEXT[o.status] || o.status}
                    </span>
                  </div>
                </div>
                <div className="member-order-right">
                  <div className="member-order-amount">¥{o.final_amount.toFixed(2)}</div>
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
        {recommended.length === 0 ? (
          <div className="member-empty">暂无陪玩</div>
        ) : (
          <div className="member-player-grid">
            {recommended.map((p) => (
              <Link key={p.id} href={`/players/${p.id}`} className="member-player-card">
                <div className="member-player-avatar">
                  {p.avatar ? <img src={p.avatar} alt={p.name} /> : p.name.charAt(0)}
                </div>
                <div className="member-player-name">{p.name}</div>
                <div
                  className="member-player-tier"
                  style={{ background: TIER_COLORS[p.tier as keyof typeof TIER_COLORS] || '#6b7280' }}
                >
                  {p.tier}
                </div>
                <div className="member-player-price">
                  {p.price > 0 ? `¥${p.price}/时起` : '价格待定'}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}