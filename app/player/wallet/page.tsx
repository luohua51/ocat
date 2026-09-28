'use client';

import { useState } from 'react';
import { MOCK_PLAYER_WALLET, MOCK_PLAYER_WITHDRAWALS, MOCK_ORDERS } from '@/lib/mock';
import { ORDER_STATUS_TEXT } from '@/lib/utils';

const TABS = [
  { key: 'income', label: '收入明细' },
  { key: 'withdraw', label: '提现记录' },
];

export default function PlayerWalletPage() {
  const [tab, setTab] = useState('income');
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [amount, setAmount] = useState('');

  const completedOrders = MOCK_ORDERS.filter(
    (o) => o.status === 'completed' || o.status === 'in_service'
  );

  function handleWithdraw() {
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      alert('请输入有效金额');
      return;
    }
    if (val > MOCK_PLAYER_WALLET.balance) {
      alert('余额不足');
      return;
    }
    alert(`提现申请已提交（demo）\n金额：¥${val.toFixed(2)}`);
    setShowWithdraw(false);
    setAmount('');
  }

  return (
    <>
      <div className="player-header">
        <h1 className="player-title">收入与提现</h1>
        <p className="player-subtitle">余额满 100 可提现，人工审核</p>
      </div>

      <div className="player-wallet-card">
        <div className="player-wallet-label">可提现余额</div>
        <div className="player-wallet-amount">¥{MOCK_PLAYER_WALLET.balance.toFixed(2)}</div>
        <div className="player-wallet-stats">
          <div>
            <div className="player-wallet-stat-label">累计收入</div>
            <div className="player-wallet-stat-value">
              ¥{MOCK_PLAYER_WALLET.totalIncome.toFixed(2)}
            </div>
          </div>
          <div>
            <div className="player-wallet-stat-label">累计提现</div>
            <div className="player-wallet-stat-value">
              ¥{MOCK_PLAYER_WALLET.totalWithdrawn.toFixed(2)}
            </div>
          </div>
        </div>
        <button
          className="player-wallet-btn"
          onClick={() => setShowWithdraw(true)}
        >
          申请提现
        </button>
      </div>

      <div className="player-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={'player-tab' + (tab === t.key ? ' active' : '')}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'income' && (
        <div className="player-order-list">
          {completedOrders.length === 0 ? (
            <div className="player-empty">暂无收入记录</div>
          ) : (
            completedOrders.map((o) => (
              <div key={o.id} className="player-order-item">
                <div>
                  <div className="player-order-title">
                    {o.game} · {o.memberName}
                  </div>
                  <div className="player-order-meta">
                    {o.tier} · {o.hours}h · {o.createdAt}
                  </div>
                  <div style={{ marginTop: '0.4rem' }}>
                    <span className="player-order-tag">
                      {ORDER_STATUS_TEXT[o.status] || o.status}
                    </span>
                  </div>
                </div>
                <div className="player-order-right">
                  <div className="player-order-amount">
                    +¥{(o.totalAmount * 0.98).toFixed(2)}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>
                    抽成后
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'withdraw' && (
        <div className="player-order-list">
          {MOCK_PLAYER_WITHDRAWALS.map((w) => (
            <div key={w.id} className="player-order-item">
              <div>
                <div className="player-order-title">
                  提现申请 # {w.id}
                </div>
                <div className="player-order-meta">{w.createdAt}</div>
              </div>
              <div className="player-order-right">
                <div className="player-order-amount">
                  -¥{w.amount.toFixed(2)}
                </div>
                <div
                  style={{
                    fontSize: '0.72rem',
                    color:
                      w.status === 'approved'
                        ? '#34d399'
                        : w.status === 'pending'
                        ? '#FF7A00'
                        : '#f87171',
                  }}
                >
                  {w.status === 'approved'
                    ? '已到账'
                    : w.status === 'pending'
                    ? '审核中'
                    : '已驳回'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showWithdraw && (
        <div className="player-modal-overlay" onClick={() => setShowWithdraw(false)}>
          <div className="player-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="player-modal-title">申请提现</h3>
            <div className="player-form-block">
              <div className="player-form-label">提现金额</div>
              <input
                className="player-input"
                type="number"
                placeholder="请输入金额"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
              />
              <div className="player-form-hint">
                可提现余额：¥{MOCK_PLAYER_WALLET.balance.toFixed(2)}
              </div>
            </div>
            <div className="player-modal-actions">
              <button
                className="player-btn-ghost"
                onClick={() => setShowWithdraw(false)}
              >
                取消
              </button>
              <button className="player-btn-primary" onClick={handleWithdraw}>
                确认提现
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}