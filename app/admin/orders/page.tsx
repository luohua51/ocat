'use client';

import { MOCK_ORDERS } from '@/lib/mock';
import { ORDER_STATUS_TEXT } from '@/lib/utils';

export default function AdminOrdersPage() {
  return (
    <>
      <div className="admin-header">
        <h1 className="admin-title">全局订单</h1>
        <p className="admin-subtitle">共 {MOCK_ORDERS.length} 条订单</p>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>订单号</th>
              <th>会员</th>
              <th>陪玩</th>
              <th>店铺</th>
              <th>游戏</th>
              <th>档位</th>
              <th>时长</th>
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
                <td>{o.shopName || '散陪'}</td>
                <td>{o.game}</td>
                <td>{o.tier}</td>
                <td>{o.hours}h</td>
                <td style={{ color: '#059669', fontWeight: 700 }}>
                  ¥{o.totalAmount.toFixed(2)}
                </td>
                <td>
                  <span className="admin-badge">
                    {ORDER_STATUS_TEXT[o.status] || o.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}