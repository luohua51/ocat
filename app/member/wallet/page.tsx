'use client';

import { useEffect, useState } from 'react';
import { fetchCurrentUser, type User } from '@/lib/auth';

export default function MemberWalletPage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetchCurrentUser().then(setUser);
  }, []);

  if (!user) {
    return <div style={{ color: '#fff', padding: '2rem', textAlign: 'center' }}>加载中…</div>;
  }

  const balance = 0;

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
        <div className="member-empty">暂无流水</div>
      </div>
    </>
  );
}