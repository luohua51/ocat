'use client';

import { MOCK_ORDERS, MOCK_PLAYERS, MOCK_SHOPS } from '@/lib/mock';

export default function AdminDashboardPage() {
  const totalOrders = MOCK_ORDERS.length;
  const totalPlayers = MOCK_PLAYERS.length;
  const totalShops = MOCK_SHOPS.length;

  const todayIncome = MOCK_ORDERS
    .filter((o) => o.status === 'completed' || o.status === 'in_service')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const pendingOrders = MOCK_ORDERS.filter(
    (o) => o.status === 'paid' || o.status === 'pooling'
  ).length;

  return (
    <>
      <div className="admin-header">
        <h1 className="admin-title">仪表盘</h1>
        <p className="admin-subtitle">平台整体运营数据概览</p>
      </div>

      <div className="admin-stats">
        <div className="admin-stat-card">
          <div className="admin-stat-label">今日订单</div>
          <div className="admin-stat-value">{totalOrders}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">今日流水</div>
          <div className="admin-stat-value" style={{ color: '#059669' }}>
            ¥{todayIncome.toFixed(2)}
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">陪玩总数</div>
          <div className="admin-stat-value">{totalPlayers}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">入驻店铺</div>
          <div className="admin-stat-value">{totalShops}</div>
        </div>
      </div>

      <div className="admin-section">
        <h2 className="admin-section-title">最近订单</h2>
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
              {MOCK_ORDERS.map((o) => (
                <tr key={o.id}>
                  <td>{o.orderNo}</td>
                  <td>{o.memberName}</td>
                  <td>{o.playerName}</td>
                  <td>{o.game}</td>
                  <td>¥{o.totalAmount.toFixed(2)}</td>
                  <td>{o.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="admin-section">
        <h2 className="admin-section-title">待处理</h2>
        <div className="admin-stat-card" style={{ maxWidth: '20rem' }}>
          <div className="admin-stat-label">待接单 / 抢单中</div>
          <div className="admin-stat-value" style={{ color: '#F97316' }}>
            {pendingOrders}
          </div>
        </div>
      </div>
    </>
  );
}