'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MOCK_ORDERS } from '@/lib/mock';
import { ORDER_STATUS_TEXT } from '@/lib/utils';
import { fetchCurrentUser, type User } from '@/lib/auth';

const TABS = [
  { key: 'all', label: '全部' },
  { key: 'in_service', label: '进行中' },
  { key: 'completed', label: '已完成' },
];

export default function PlayerOrdersPage() {
  const [user, setUser] = useState<User | null>(null);
  const [tab, setTab] = useState('all');

  useEffect(() => {
    fetchCurrentUser().then(setUser);
  }, []);

  if (!user) {
    return <div style={{ color: '#fff', padding: '2rem', textAlign: 'center' }}>加载中…</div>;
  }

  const myOrders = MOCK_ORDERS.filter((o) => o.playerId === (user.playerId || 1));
  const list = myOrders.filter((o) => {
    if (tab === 'all') return true;
    return o.status === tab;
  });

  return (
    <>
      <div className="player-header">
        <h1 className="player-title">我的订单</h1>
        <p className="player-subtitle">共 {list.length} 条</p>
      </div>

      <div className="player-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={'player-tab' + (tab === t.key ? ' active' : '')}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="player-empty">暂无订单</div>
      ) : (
        <div className="player-order-list">
          {list.map((o) => (
            <Link key={o.id} href={'/player/orders/' + o.id} className="player-order-item">
              <div>
                <div className="player-order-title">{o.game} · {o.memberName}</div>
                <div className="player-order-meta">{o.tier} · {o.hours}h · {o.createdAt}</div>
                <div style={{ marginTop: '0.4rem' }}>
                  <span className="player-order-tag">{ORDER_STATUS_TEXT[o.status] || o.status}</span>
                </div>
              </div>
              <div className="player-order-right">
                <div className="player-order-amount">¥{(o.totalAmount * 0.98).toFixed(2)}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}