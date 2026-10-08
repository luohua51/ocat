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

  if (loading) {
    return (
      <div style={{ color: '#fff', padding: '2rem', textAlign: 'center' }}>加载中…</div>
    );
  }

  const stats = [
    { label: '余额', value: `¥${wallet.balance.toFixed(2)}`, color: '#FF7A00' },
    { label: '累计充值', value: `¥${wallet.totalIncome.toFixed(2)}`, color: '#34d399' },
  ];

  return (
    <div style={{ padding: '1rem 1.25rem', maxWidth: 720, margin: '0 auto' }}>
      {/* 头部 */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', margin: 0 }}>
          我的钱包
        </h1>
        <p style={{ margin: '0.4rem 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>
          会员充值请联系管理员
        </p>
      </div>

      {/* 统计卡片 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '0.8rem',
        }}
      >
        {stats.map((s) => (
          <div
            key={s.label}
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12,
              padding: '1rem 1.1rem',
            }}
          >
            <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem' }}>
              {s.label}
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: s.color }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* 操作按钮 */}
      <div style={{ display: 'flex', gap: 12, marginTop: '1.5rem' }}>
        <button
          onClick={() => setShowService(true)}
          style={{
            flex: 1,
            padding: '0.85rem 1rem',
            borderRadius: 10,
            border: 'none',
            background: '#FF7A00',
            color: '#fff',
            fontSize: '0.95rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          联系客服充值
        </button>
        <button
          onClick={() => setShowService(true)}
          style={{
            flex: 1,
            padding: '0.85rem 1rem',
            borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.2)',
            background: 'transparent',
            color: '#fff',
            fontSize: '0.95rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          联系管理员
        </button>
      </div>

      {/* 客服弹窗 */}
      {showService && (
        <div
          onClick={() => setShowService(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
            padding: '1rem',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#1e1e2e',
              borderRadius: 14,
              padding: '1.5rem 1.25rem',
              width: '100%',
              maxWidth: 320,
              textAlign: 'center',
              color: '#fff',
              boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
            }}
          >
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.05rem' }}>联系管理员</h3>
            <p style={{ margin: '0 0 0.8rem', fontSize: '0.82rem', color: 'rgba(255,255,255,0.6)' }}>
              会员充值请直接联系管理员
            </p>
            <img
              src="/kefu.jpg"
              alt="客服二维码"
              style={{
                width: 220,
                maxWidth: '100%',
                display: 'block',
                margin: '0 auto',
                borderRadius: 10,
              }}
            />
            <button
              onClick={() => setShowService(false)}
              style={{
                marginTop: '1rem',
                padding: '0.6rem 2rem',
                borderRadius: 8,
                border: 'none',
                background: '#FF7A00',
                color: '#fff',
                fontSize: '0.9rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
}