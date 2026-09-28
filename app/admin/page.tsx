'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchDashboard, type DashboardStats } from '@/lib/admin';
import { ORDER_STATUS_TEXT, type Order } from '@/lib/order';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    todayOrders: 0,
    todayIncome: 0,
    totalPlayers: 0,
    totalShops: 0,
    pendingOrders: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard().then((data) => {
      setStats(data.stats);
      setRecentOrders(data.recentOrders);
      setLoading(false);
    });
  }, []);

  return (
    <>
      <div className="admin-header">
        <h1 className="admin-title">仪表盘</h1>
        <p className="admin-subtitle">平台整体运营数据概览</p>
      </div>

      <div className="admin-stats">
        <div className="admin-stat-card">
          <div className="admin-stat-label">今日订单</div>
          <div className="admin-stat-value">{stats.todayOrders}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">今日流水</div>
          <div className="admin-stat-value" style={{ color: '#059669' }}>
            ¥{stats.todayIncome.toFixed(2)}
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">陪玩总数</div>
          <div className="admin-stat-value">{stats.totalPlayers}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">入驻店铺</div>
          <div className="admin-stat-value">{stats.totalShops}</div>
        </div>
      </div>

      <div className="admin-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
          <h2 className="admin-section-title" style={{ marginBottom: 0 }}>最近订单</h2>
          <Link href="/admin/orders" className="admin-btn-sm">查看全部 →</Link>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>订单号</th>
                <th>会员</th>
                <th>陪玩</th>
                <th>游戏</th>
                <th>金额</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.4)' }}>
                    加载中…
                  </td>
                </tr>
              ) : recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.4)' }}>
                    暂无订单
                  </td>
                </tr>
              ) : (
                recentOrders.map((o) => (
                  <tr key={o.id}>
                    <td style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>{o.order_no}</td>
                    <td>{o.member_name}</td>
                    <td>{o.player_name || '待分配'}</td>
                    <td>{o.game_name}</td>
                    <td style={{ color: o.final_amount > 0 ? '#34d399' : '#9ca3af', fontWeight: 700 }}>
                      {o.final_amount > 0 ? `¥${o.final_amount.toFixed(2)}` : '待定'}
                    </td>
                    <td>
                      <span className="admin-badge">
                        {ORDER_STATUS_TEXT[o.status] || o.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="admin-section">
        <h2 className="admin-section-title">待处理</h2>
        <div className="admin-stat-card" style={{ maxWidth: '20rem' }}>
          <div className="admin-stat-label">待接单 / 抢单中</div>
          <div className="admin-stat-value" style={{ color: '#F97316' }}>
            {stats.pendingOrders}
          </div>
        </div>
      </div>
    </>
  );
}