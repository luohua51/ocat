'use client';

import { MOCK_SHOP_PLAYERS, MOCK_SHOP_COMMISSIONS, MOCK_ORDERS } from '@/lib/mock';
import Link from 'next/link';

export default function ShopDashboardPage() {
  const totalPlayers = MOCK_SHOP_PLAYERS.length;
  const activePlayers = MOCK_SHOP_PLAYERS.filter((p) => p.isActive).length;
  const certified = MOCK_SHOP_PLAYERS.filter(
    (p) => p.tier === '金牌' || p.tier === '魔王' || p.tier === '明星'
  ).length;

  const shopOrders = MOCK_ORDERS.filter((o) => o.shopName === '橙猫猫电竞');
  const totalIncome = shopOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const shopEarning = shopOrders.reduce((sum, o) => {
    const comm = MOCK_SHOP_COMMISSIONS.find((c) => c.tier === o.tier);
    const rate = comm?.rate || 0;
    return sum + o.totalAmount * rate;
  }, 0);

  return (
    <>
      <div className="shop-header">
        <h1 className="shop-title">店铺仪表盘</h1>
        <p className="shop-subtitle">橙猫猫电竞 · 数据概览</p>
      </div>

      <div className="shop-stats">
        <div className="shop-stat-card">
          <div className="shop-stat-label">本店陪玩</div>
          <div className="shop-stat-value">{totalPlayers}</div>
        </div>
        <div className="shop-stat-card">
          <div className="shop-stat-label">在线陪玩</div>
          <div className="shop-stat-value" style={{ color: '#34d399' }}>{activePlayers}</div>
        </div>
        <div className="shop-stat-card">
          <div className="shop-stat-label">认证陪玩</div>
          <div className="shop-stat-value" style={{ color: '#FF7A00' }}>{certified}</div>
        </div>
        <div className="shop-stat-card">
          <div className="shop-stat-label">本店订单流水</div>
          <div className="shop-stat-value" style={{ color: '#059669' }}>¥{totalIncome.toFixed(2)}</div>
        </div>
      </div>

      <div className="shop-section">
        <h2 className="shop-section-title">店铺分成（预估）</h2>
        <div className="shop-earning-card">
          <div>
            <div className="shop-earning-label">本店抽成收入</div>
            <div className="shop-earning-value">¥{shopEarning.toFixed(2)}</div>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>按档位抽成比例计算</div>
        </div>
      </div>

      <div className="shop-section">
        <div className="shop-section-head">
          <h2 className="shop-section-title">我的陪玩</h2>
          <Link href="/shop/players" className="shop-more">管理 →</Link>
        </div>
        <div className="shop-player-grid">
          {MOCK_SHOP_PLAYERS.slice(0, 4).map((p) => (
            <div key={p.id} className="shop-player-card">
              <div className="shop-player-avatar">{p.playerName.charAt(0)}</div>
              <div className="shop-player-name">{p.playerName}</div>
              <div className="shop-player-tier">{p.tier}</div>
              <div className="shop-player-status">{p.isActive ? '🟢 在线' : '⚪ 离线'}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="shop-section">
        <h2 className="shop-section-title">抽成比例设置</h2>
        <div className="shop-commission-list">
          {MOCK_SHOP_COMMISSIONS.map((c) => (
            <div key={c.tier} className="shop-commission-item">
              <div className="shop-commission-tier">{c.tier}</div>
              <div className="shop-commission-rate">{(c.rate * 100).toFixed(0)}%</div>
            </div>
          ))}
        </div>
        <div className="shop-note">💡 抽成比例可调整，平台固定抽 1%。</div>
      </div>
    </>
  );
}