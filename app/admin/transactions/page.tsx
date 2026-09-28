'use client';

import { MOCK_TRANSACTIONS } from '@/lib/mock';

export default function AdminTransactionsPage() {
  const totalIn = MOCK_TRANSACTIONS
    .filter((t) => t.type === 'recharge')
    .reduce((s, t) => s + t.amount, 0);

  const totalOut = MOCK_TRANSACTIONS
    .filter((t) => t.type === 'consume')
    .reduce((s, t) => s + t.amount, 0);

  return (
    <>
      <div className="admin-header">
        <h1 className="admin-title">全局流水</h1>
        <p className="admin-subtitle">共 {MOCK_TRANSACTIONS.length} 条记录</p>
      </div>

      <div className="admin-stats" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
        <div className="admin-stat-card">
          <div className="admin-stat-label">累计充值</div>
          <div className="admin-stat-value" style={{ color: '#059669' }}>
            +¥{totalIn.toFixed(2)}
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">累计消费</div>
          <div className="admin-stat-value" style={{ color: '#dc2626' }}>
            -¥{totalOut.toFixed(2)}
          </div>
        </div>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>时间</th>
              <th>类型</th>
              <th>会员</th>
              <th>金额</th>
              <th>余额</th>
              <th>操作人</th>
              <th>说明</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_TRANSACTIONS.map((t) => (
              <tr key={t.id}>
                <td style={{ color: 'rgba(255,255,255,0.5)' }}>{t.createdAt}</td>
                <td>
                  {t.type === 'recharge' ? (
                    <span className="admin-badge admin-badge-green">充值</span>
                  ) : (
                    <span className="admin-badge admin-badge-red">消费</span>
                  )}
                </td>
                <td>{t.memberName}</td>
                <td style={{ fontWeight: 700, color: t.type === 'recharge' ? '#059669' : '#dc2626' }}>
                  {t.type === 'recharge' ? '+' : '-'}¥{t.amount.toFixed(2)}
                </td>
                <td style={{ color: 'rgba(255,255,255,0.6)' }}>
                  ¥{t.balanceAfter.toFixed(2)}
                </td>
                <td>{t.operator}</td>
                <td style={{ color: 'rgba(255,255,255,0.6)' }}>{t.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}