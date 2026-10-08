'use client';

import { useEffect, useState } from 'react';
import { fetchMyWallet, type WalletInfo } from '@/lib/order';

export default function MemberWalletPage() {
  const [wallet, setWallet] = useState<WalletInfo>({
    balance: 0,
    totalIncome: 0,
    totalWithdrawn: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showService, setShowService] = useState(false);

  useEffect(() => {
    fetchMyWallet().then((w) => {
      setWallet(w);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="member-empty">加载中…</div>;

  return (
    <>
      <div className="member-header">
        <h1 className="member-title">我的钱包</h1>
        <p className="member-subtitle">会员充值、提现请联系管理员</p>
      </div>

      <div className="member-stats">
        <div className="member-stat-card">
          <div className="member-stat-label">余额</div>
          <div className="member-stat-value" style={{ color: '#FF7A00' }}>
            ¥{wallet.balance.toFixed(2)}
          </div>
        </div>
        <div className="member-stat-card">
          <div className="member-stat-label">累计充值</div>
          <div className="member-stat-value">¥{wallet.totalIncome.toFixed(2)}</div>
        </div>
        <div className="member-stat-card">
          <div className="member-stat-label">累计提现</div>
          <div className="member-stat-value">¥{wallet.totalWithdrawn.toFixed(2)}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
        <button className="member-submit-btn" onClick={() => setShowService(true)}>
          联系客服充值
        </button>
        <button className="member-submit-btn" onClick={() => setShowService(true)}>
          联系管理员
        </button>
      </div>

      {showService && (
        <div className="modal-overlay" onClick={() => setShowService(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>联系管理员</h3>
            <p>会员充值、陪玩提现请直接联系管理员</p>
            <img
              src="/kefu.jpg"
              alt="客服二维码"
              style={{ width: 220, margin: '12px auto', display: 'block', borderRadius: 8 }}
            />
            <button onClick={() => setShowService(false)}>关闭</button>
          </div>
        </div>
      )}
    </>
  );
}