'use client';

import { useEffect, useState } from 'react';
import { fetchMyWallet, fetchMyTransactions, type WalletInfo, type WalletTransaction } from '@/lib/order';

const TYPE_TEXT: Record<string, string> = {
  recharge: '充值',
  consume: '消费',
  income: '收入',
  withdraw: '提现',
  refund: '退款',
};

export default function MemberWalletPage() {
  const [wallet, setWallet] = useState<WalletInfo>({ balance: 0, totalIncome: 0, totalWithdrawn: 0 });
  const [txs, setTxs] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [w, t] = await Promise.all([fetchMyWallet(), fetchMyTransactions()]);
      setWallet(w);
      setTxs(t);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <>
      <div className="member-header">
        <h1 className="member-title">我的钱包</h1>
        <p className="member-subtitle">充值请联系客服</p>
      </div>

      <div className="member-wallet-card">
        <div className="member-wallet-label">当前余额</div>
        <div className="member-wallet-amount">¥{wallet.balance.toFixed(2)}</div>
        <button className="member-wallet-btn">联系客服充值</button>
      </div>

      <div className="member-section">
        <h2 className="member-section-title">流水记录</h2>
        {loading ? (
          <div className="member-empty">加载中…</div>
        ) : txs.length === 0 ? (
          <div className="member-empty">暂无流水</div>
        ) : (
          <div className="member-tx-list">
            {txs.map((t) => {
              const isIncome = ['recharge', 'income', 'refund'].includes(t.type);
              return (
                <div key={t.id} className="member-tx-item">
                  <div className="member-tx-left">
                    <div className={'member-tx-type ' + (isIncome ? 'recharge' : 'consume')}>
                      {TYPE_TEXT[t.type] || t.type}
                    </div>
                    <div className="member-tx-desc">{t.description || '-'}</div>
                    <div className="member-tx-time">
                      {new Date(t.created_at).toLocaleString('zh-CN')}
                    </div>
                  </div>
                  <div className="member-tx-right">
                    <div className={'member-tx-amount ' + (isIncome ? 'recharge' : 'consume')}>
                      {isIncome ? '+' : '-'}¥{Number(t.amount).toFixed(2)}
                    </div>
                    <div className="member-tx-balance">
                      余额 ¥{Number(t.balance_after).toFixed(2)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}