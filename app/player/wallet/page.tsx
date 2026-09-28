'use client';

import { useEffect, useState } from 'react';
import {
  fetchMyWallet,
  fetchMyTransactions,
  type WalletInfo,
  type WalletTransaction,
} from '@/lib/order';

const TYPE_TEXT: Record<string, string> = {
  recharge: '充值',
  consume: '消费',
  income: '收入',
  withdraw: '提现',
  refund: '退款',
};

export default function PlayerWalletPage() {
  const [wallet, setWallet] = useState<WalletInfo>({ balance: 0, totalIncome: 0, totalWithdrawn: 0 });
  const [txs, setTxs] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [w, t] = await Promise.all([fetchMyWallet(), fetchMyTransactions()]);
      setWallet(w);
      setTxs(t.filter((x) => x.type === 'income' || x.type === 'withdraw'));
      setLoading(false);
    }
    load();
  }, []);

  return (
    <>
      <div className="player-header">
        <h1 className="player-title">收入与提现</h1>
        <p className="player-subtitle">订单完成后自动到账</p>
      </div>

      <div className="player-wallet-card">
        <div className="player-wallet-label">可提现余额</div>
        <div className="player-wallet-amount">¥{wallet.balance.toFixed(2)}</div>
        <div className="player-wallet-stats">
          <div>
            <div className="player-wallet-stat-label">累计收入</div>
            <div className="player-wallet-stat-value">¥{wallet.totalIncome.toFixed(2)}</div>
          </div>
          <div>
            <div className="player-wallet-stat-label">累计提现</div>
            <div className="player-wallet-stat-value">¥{wallet.totalWithdrawn.toFixed(2)}</div>
          </div>
        </div>
        <button className="player-wallet-btn" onClick={() => alert('提现功能开发中')}>
          申请提现
        </button>
      </div>

      <div className="player-section">
        <h2 className="player-section-title">收入明细</h2>
        {loading ? (
          <div className="player-empty">加载中…</div>
        ) : txs.length === 0 ? (
          <div className="player-empty">暂无收入记录</div>
        ) : (
          <div className="player-order-list">
            {txs.map((t) => (
              <div key={t.id} className="player-order-item">
                <div>
                  <div className="player-order-title">
                    {TYPE_TEXT[t.type] || t.type}
                  </div>
                  <div className="player-order-meta">{t.description || '-'}</div>
                  <div className="player-order-meta">
                    {new Date(t.created_at).toLocaleString('zh-CN')}
                  </div>
                </div>
                <div className="player-order-right">
                  <div className="player-order-amount">
                    +¥{Number(t.amount).toFixed(2)}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>
                    余额 ¥{Number(t.balance_after).toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}