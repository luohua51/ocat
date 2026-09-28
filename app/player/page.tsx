'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { MOCK_ORDERS, MOCK_PLAYER_WALLET } from '@/lib/mock';
import { ORDER_STATUS_TEXT } from '@/lib/utils';
import { fetchCurrentUser, type User } from '@/lib/auth';

export default function PlayerHomePage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetchCurrentUser().then(setUser);
  }, []);

  if (!user) {
    return <div style={{ color: '#fff', padding: '2rem', textAlign: 'center' }}>加载中…</div>;
  }

  const myOrders = MOCK_ORDERS.filter((o) => o.playerId === (user.playerId || 1));
  const todayOrders = myOrders.length;
  const todayIncome = myOrders
    .filter((o) => o.status === 'completed' || o.status === 'in_service')
    .reduce((sum, o) => sum + o.totalAmount * 0.98, 0);

  const pendingOrders = MOCK_ORDERS.filter(
    (o) => o.status === 'pooling' || o.status === 'paid'
  );

  return (
    <>
      <div className="player-header">
        <h1 className="player-title">你好，{user.nickname} 👋</h1>
        <p className="player-subtitle">今天有 {pendingOrders.length} 条新单等你接</p>
      </div>

      <div className="player-stats">
        <div className="player-stat-card">
          <div className="player-stat-label">今日订单</div>
          <div className="player-stat-value">{todayOrders}</div>
        </div>
        <div className="player-stat-card">
          <div className="player-stat-label">今日收入</div>
          <div className="player-stat-value" style={{ color: '#059669' }}>¥{todayIncome.toFixed(2)}</div>
        </div>
        <div className="player-stat-card">
          <div className="player-stat-label">钱包余额</div>
          <div className="player-stat-value" style={{ color: '#FF7A00' }}>¥{MOCK_PLAYER_WALLET.balance.toFixed(2)}</div>
        </div>
        <div className="player-stat-card">
          <div className="player-stat-label">累计收入</div>
          <div className="player-stat-value">¥{MOCK_PLAYER_WALLET.totalIncome.toFixed(2)}</div>
        </div>
      </div>

      <div className="player-quick-actions">
        <Link href="/player/hall" className="player-action-card">
          <div className="player-action-icon">🔥</div>
          <div className="player-action-label">去抢单</div>
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
          <h2 className="player-section-title">我的进行中订单</h2>
          <Link href="/player/orders" className="player-more">查看全部 →</Link>
        </div>
        {myOrders.length === 0 ? (
          <div className="player-empty">暂无订单</div>
        ) : (
          <div className="player-order-list">
            {myOrders.slice(0, 3).map((o) => (
              <Link key={o.id} href={'/player/orders/' + o.id} className="player-order-item">
                <div>
                  <div className="player-order-title">{o.game} · {o.memberName}</div>
                  <div className="player-order-meta">{o.tier} · {o.hours}h · {o.createdAt}</div>
                </div>
                <div className="player-order-right">
                  <div className="player-order-amount">¥{(o.totalAmount * 0.98).toFixed(2)}</div>
                  <div className="player-order-status">{ORDER_STATUS_TEXT[o.status] || o.status}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}