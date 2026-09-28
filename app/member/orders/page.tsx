'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MOCK_ORDERS } from '@/lib/mock';
import { ORDER_STATUS_TEXT } from '@/lib/utils';

const TABS = [
  { key: 'all', label: '全部' },
  { key: 'in_service', label: '进行中' },
  { key: 'completed', label: '已完成' },
];

export default function MemberOrdersPage() {
  const [tab, setTab] = useState('all');

  const list = MOCK_ORDERS.filter((o) => {
    if (tab === 'all') return true;
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

      {list.length === 0 ? (
        <div className="member-empty">暂无订单</div>
      ) : (
        <div className="member-order-list">
          {list.map((o) => (
            <Link
              key={o.id}
              href={'/member/orders/' + o.id}
              className="member-order-item"
            >
              <div>
                <div className="member-order-title">
                  {o.game} · {o.playerName}
                </div>
                <div className="member-order-meta">
                  {o.tier} · {o.hours}h · {o.createdAt}
                </div>
                <div style={{ marginTop: '0.4rem' }}>
                  <span className="member-order-tag">
                    {ORDER_STATUS_TEXT[o.status] || o.status}
                  </span>
                </div>
              </div>
              <div className="member-order-right">
                <div className="member-order-amount">¥{o.totalAmount.toFixed(2)}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}