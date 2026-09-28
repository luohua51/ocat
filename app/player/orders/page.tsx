'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchOrders, ORDER_STATUS_TEXT, type Order } from '@/lib/order';

const TABS = [
  { key: 'all', label: '全部' },
  { key: 'locked', label: '待开始' },
  { key: 'in_service', label: '服务中' },
  { key: 'completed', label: '已完成' },
];

export default function PlayerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');

  useEffect(() => {
    fetchOrders().then((list) => {
      setOrders(list);
      setLoading(false);
    });
  }, []);

  const list = orders.filter((o) => {
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

      {loading ? (
        <div className="player-empty">加载中…</div>
      ) : list.length === 0 ? (
        <div className="player-empty">暂无订单</div>
      ) : (
        <div className="player-order-list">
          {list.map((o) => (
            <Link key={o.id} href={'/player/orders/' + o.id} className="player-order-item">
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
    </>
  );
}