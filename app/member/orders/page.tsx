'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchOrders, ORDER_STATUS_TEXT, ORDER_STATUS_COLOR, type Order } from '@/lib/order';

const TABS = [
  { key: 'all', label: '全部' },
  { key: 'pending_player', label: '待接单' },
  { key: 'in_service', label: '进行中' },
  { key: 'completed', label: '已完成' },
];

export default function MemberOrdersPage() {
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
    if (tab === 'in_service') {
      return ['locked', 'in_service', 'finished'].includes(o.status);
    }
    return o.status === tab;
  });

  return (
    <>
      <div className="member-header">
        <h1 className="member-title">我的订单</h1>
        <p className="member-subtitle">共 {list.length} 条</p>
      </div>

      <div className="member-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={'member-tab' + (tab === t.key ? ' active' : '')}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="member-empty">加载中…</div>
      ) : list.length === 0 ? (
        <div className="member-empty">暂无订单</div>
      ) : (
        <div className="member-order-list">
          {list.map((o) => (
            <Link key={o.id} href={`/member/orders/${o.id}`} className="member-order-item">
              <div>
                <div className="member-order-title">
                  {o.game_name} · {o.player_name || '待分配'}
                </div>
                <div className="member-order-meta">
                  {o.tier} · {o.duration_hours}h · {o.order_no}
                </div>
                <div style={{ marginTop: '0.4rem' }}>
                  <span
                    className="member-order-tag"
                    style={{
                      background: (ORDER_STATUS_COLOR[o.status] || '#6b7280') + '22',
                      color: ORDER_STATUS_COLOR[o.status] || '#6b7280',
                    }}
                  >
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
    </>
  );
}