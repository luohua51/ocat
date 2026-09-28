'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchOrders, ORDER_STATUS_TEXT, ORDER_STATUS_COLOR, type Order } from '@/lib/order';

const TABS = [
  { key: 'all', label: '全部' },
  { key: 'pooling', label: '抢单中' },
  { key: 'locked', label: '已锁单' },
  { key: 'in_service', label: '服务中' },
  { key: 'finished', label: '待确认' },
  { key: 'completed', label: '已完成' },
  { key: 'cancelled', label: '已取消' },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');

  useEffect(() => {
    fetchOrders().then((data) => {
      setOrders(data);
      setLoading(false);
    });
  }, []);

  const list = tab === 'all' ? orders : orders.filter((o) => o.status === tab);

  return (
    <>
      <div className="admin-header">
        <h1 className="admin-title">全局订单</h1>
        <p className="admin-subtitle">
          {loading ? '加载中…' : `共 ${list.length} 条订单`}
        </p>
      </div>

      <div className="admin-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={'admin-tab' + (tab === t.key ? ' active' : '')}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>订单号</th>
              <th>会员</th>
              <th>陪玩</th>
              <th>游戏</th>
              <th>档位</th>
              <th>时长</th>
              <th>金额</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.4)' }}>
                  加载中…
                </td>
              </tr>
            ) : list.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.4)' }}>
                  暂无订单
                </td>
              </tr>
            ) : (
              list.map((o) => (
                <tr key={o.id}>
                  <td style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)' }}>{o.order_no}</td>
                  <td>{o.member_name}</td>
                  <td>{o.player_name || '待分配'}</td>
                  <td>{o.game_name}</td>
                  <td>{o.tier}</td>
                  <td>{o.duration_hours}h</td>
                  <td style={{ color: o.final_amount > 0 ? '#34d399' : '#9ca3af', fontWeight: 700 }}>
                    {o.final_amount > 0 ? `¥${o.final_amount.toFixed(2)}` : '待定'}
                  </td>
                  <td>
                    <span
                      className="admin-badge"
                      style={{
                        background: (ORDER_STATUS_COLOR[o.status] || '#6b7280') + '22',
                        color: ORDER_STATUS_COLOR[o.status] || '#6b7280',
                      }}
                    >
                      {ORDER_STATUS_TEXT[o.status] || o.status}
                    </span>
                  </td>
                  <td>
                    <Link href={`/admin/orders/${o.id}`} className="admin-btn-sm">
                      详情
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}