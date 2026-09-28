'use client';

import { MOCK_DISPUTES } from '@/lib/mock';

export default function AdminDisputesPage() {
  const statusText: Record<string, string> = {
    pending: '待处理',
    resolved: '已解决',
    rejected: '已驳回',
  };

  return (
    <>
      <div className="admin-header">
        <h1 className="admin-title">投诉仲裁</h1>
        <p className="admin-subtitle">共 {MOCK_DISPUTES.length} 条投诉</p>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>订单号</th>
              <th>会员</th>
              <th>陪玩</th>
              <th>投诉原因</th>
              <th>提交时间</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_DISPUTES.map((d) => (
              <tr key={d.id}>
                <td>{d.id}</td>
                <td>{d.orderNo}</td>
                <td>{d.memberName}</td>
                <td>{d.playerName}</td>
                <td style={{ color: 'rgba(255,255,255,0.7)' }}>{d.reason}</td>
                <td style={{ color: 'rgba(255,255,255,0.5)' }}>{d.createdAt}</td>
                <td>
                  <span
                    className={
                      'admin-badge ' +
                      (d.status === 'pending'
                        ? 'admin-badge-orange'
                        : d.status === 'resolved'
                        ? 'admin-badge-green'
                        : 'admin-badge-red')
                    }
                  >
                    {statusText[d.status]}
                  </span>
                </td>
                <td>
                  {d.status === 'pending' && (
                    <button className="admin-btn-sm">处理</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}