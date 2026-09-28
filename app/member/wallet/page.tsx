'use client';

import { useState } from 'react';
import { MOCK_TRANSACTIONS } from '@/lib/mock';

export default function MemberWalletPage() {
  const [balance] = useState(200);

  return (
    <>
      <div className="member-header">
        <h1 className="member-title">我的钱包</h1>
        <p className="member-subtitle">充值请联系客服，订单完成自动扣款</p>
      </div>

      <div className="member-wallet-card">
        <div className="member-wallet-label">当前余额</div>
        <div className="member-wallet-amount">¥{balance.toFixed(2)}</div>
        <button className="member-wallet-btn">联系客服充值</button>
      </div>

      <div className="member-section">
        <h2 className="member-section-title">流水记录</h2>

        <div className="member-tx-list">
          {MOCK_TRANSACTIONS.map((t) => (
            <div key={t.id} className="member-tx-item">
              <div className="member-tx-left">
                <div className={'member-tx-type ' + t.type}>
                  {t.type === 'recharge' ? '充值' : '消费'}
                </div>
                <div className="member-tx-desc">{t.description}</div>
                <div className="member-tx-time">{t.createdAt}</div>
              </div>
              <div className="member-tx-right">
                <div className={'member-tx-amount ' + t.type}>
                  {t.type === 'recharge' ? '+' : '-'}¥{t.amount.toFixed(2)}
                </div>
                <div className="member-tx-balance">余额 ¥{t.balanceAfter.toFixed(2)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}