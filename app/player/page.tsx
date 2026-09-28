'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { fetchCurrentUser, type User } from '@/lib/auth';
import {
  fetchOrders,
  fetchHallOrders,
  fetchMyWallet,
  ORDER_STATUS_TEXT,
  type Order,
  type WalletInfo,
} from '@/lib/order';

export default function PlayerHomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [hallCount, setHallCount] = useState(0);
  const [wallet, setWallet] = useState<WalletInfo>({
    balance: 0,
    totalIncome: 0,
    totalWithdrawn: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [u, o, h, w] = await Promise.all([
        fetchCurrentUser(),
        fetchOrders(),
        fetchHallOrders(),
        fetchMyWallet(),
      ]);
      setUser(u);
      setOrders(o);
      setHallCount(h.length);
      setWallet(w);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return <div className="player-empty">加载中…</div>;
  }

  if (!user) return null;

  // 进行中的订单：locked / in_service / finished
  const activeOrders = orders.filter((o) =>
    ['locked', 'in_service', 'finished'].includes(o.status)
  );
  const todayIncome = orders
    .filter((o) => o.status === 'completed' || o.status === 'reviewed')
    .reduce((sum, o) => sum + (o.player_income || 0), 0);

  return (
    <>
      <div className="player-header">
        <h1 className="player-title">你好，{user.nickname} 👋</h1>
        <p className="player-subtitle">
          {hallCount > 0
            ? `今天有 ${hallCount} 条新单等你接`
            : '暂无新单，稍后再来看看'}
        </p>
      </div>

      <div className="player-stats">
        <div className="player-stat-card">
          <div className="player-stat-label">进行中订单</div>
          <div className="player-stat-value">{activeOrders.length}</div>
        </div>
        <div className="player-stat-card">
          <div className="player-stat-label">累计收入</div>
          <div className="player-stat-value" style={{ color: '#059669' }}>
            ¥{todayIncome.toFixed(2)}
          </div>
        </div>
        <div className="player-stat-card">
          <div className="player-stat-label">钱包余额</div>
          <div className="player-stat-value" style={{ color: '#FF7A00' }}>
            ¥{wallet.balance.toFixed(2)}
          </div>
        </div>
        <div className="player-stat-card">
          <div className="player-stat-label">历史总收入</div>
          <div className="player-stat-value">¥{wallet.totalIncome.toFixed(2)}</div>
        </div>
      </div>

      <div className="player-quick-actions">
        <Link href="/player/hall" className="player-action-card">
          <div className="player-action-icon">🔥</div>
          <div className="player-action-label">
            去抢单{hallCount > 0 ? ` (${hallCount})` : ''}
          </div>
        </Link>
        <Link href="/player/orders" className="player-action-card">
          <div className="player-action-icon">📋</div>
          <div className="player-action-label">我的订单</div>
        </Link>
        <Link href="/player/prices" className="player-action-card">
          <div className="player-action-icon">💰</div>
          <div className="player-action-label">设置价格</div>
        </Link>
        <Link href="/player/wallet" className="player-action-card">
          <div className="player-action-icon">💳</div>
          <div className="player-action-label">提现</div>
        </Link>
      </div>

      <div className="player-section">
        <div className="player-section-head">
          <h2 className="player-section-title">进行中订单</h2>
          <Link href="/player/orders" className="player-more">
            查看全部 →
          </Link>
        </div>
        {activeOrders.length === 0 ? (
          <div className="player-empty">暂无进行中订单，去抢单大厅看看</div>
        ) : (
          <div className="player-order-list">
            {activeOrders.slice(0, 3).map((o) => (
              <Link
                key={o.id}
                href={'/player/orders/' + o.id}
                className="player-order-item"
              >
                <div>
                  <div className="player-order-title">
                    {o.game_name} · {o.member_name}
                  </div>
                  <div className="player-order-meta">
                    {o.tier} · {o.duration_hours}h · {o.order_no}
                  </div>
                  <div style={{ marginTop: '0.4rem' }}>
                    <span className="player-order-tag">
                      {ORDER_STATUS_TEXT[o.status] || o.status}
                    </span>
                  </div>
                </div>
                <div className="player-order-right">
                  <div className="player-order-amount">
                    {o.player_income > 0 ? `¥${o.player_income.toFixed(2)}` : '待定'}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}