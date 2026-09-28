'use client';

import { useEffect, useState } from 'react';
import { fetchAllTransactions, type AdminTx, type TxSummary } from '@/lib/admin';

const TYPE_TEXT: Record<string, string> = {
  recharge: '充值',
  consume: '消费',
  income: '陪玩收入',
  withdraw: '提现',
  refund: '退款',
};

const ROLE_TEXT: Record<string, string> = {
  super_admin: '超管',
  shop_admin: '店长',
  player: '陪玩',
  member: '会员',
};

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<AdminTx[]>([]);
  const [summary, setSummary] = useState<TxSummary>({
    totalRecharge: 0,
    totalConsume: 0,
    totalIncome: 0,
    totalRefund: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllTransactions().then((data) => {
      setTransactions(data.transactions);
      setSummary(data.summary);
      setLoading(false);
    });
  }, []);

  return (
    <>
      <div className="admin-header">
        <h1 className="admin-title">全局流水</h1>
        <p className="admin-subtitle">
          {loading ? '加载中…' : `最近 ${transactions.length} 条记录`}
        </p>
      </div>

      <div className="admin-stats" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="admin-stat-card">
          <div className="admin-stat-label">累计充值</div>
          <div className="admin-stat-value" style={{ color: '#34d399' }}>
            +¥{summary.totalRecharge.toFixed(2)}
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">累计消费</div>
          <div className="admin-stat-value" style={{ color: '#f87171' }}>
            -¥{summary.totalConsume.toFixed(2)}
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">陪玩收入</div>
          <div className="admin-stat-value" style={{ color: '#FF7A00' }}>
            ¥{summary.totalIncome.toFixed(2)}
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">退款总额</div>
          <div className="admin-stat-value">¥{summary.totalRefund.toFixed(2)}</div>
        </div>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>时间</th>
              <th>类型</th>
              <th>用户</th>
              <th>角色</th>
              <th>金额</th>
              <th>余额</th>
              <th>说明</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.4)' }}>
                  加载中…
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.4)' }}>
                  暂无流水
                </td>
              </tr>
            ) : (
              transactions.map((t) => {
                const isIncome = ['recharge', 'income', 'refund'].includes(t.type);
                return (
                  <tr key={t.id}>
                    <td style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)' }}>
                      {new Date(t.created_at).toLocaleString('zh-CN')}
                    </td>
                    <td>
                      <span
                        className={
                          'admin-badge ' +
                          (isIncome ? 'admin-badge-green' : 'admin-badge-red')
                        }
                      >
                        {TYPE_TEXT[t.type] || t.type}
                      </span>
                    </td>
                    <td>{t.user?.nickname || '-'}</td>
                    <td style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)' }}>
                      {t.user ? ROLE_TEXT[t.user.role] || t.user.role : '-'}
                    </td>
                    <td
                      style={{
                        fontWeight: 700,
                        color: isIncome ? '#34d399' : '#f87171',
                      }}
                    >
                      {isIncome ? '+' : '-'}¥{Number(t.amount).toFixed(2)}
                    </td>
                    <td style={{ color: 'rgba(255,255,255,0.6)' }}>
                      ¥{Number(t.balance_after).toFixed(2)}
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.6)' }}>
                      {t.description || '-'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}