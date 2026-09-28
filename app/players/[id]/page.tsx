import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MOCK_PLAYERS, TIER_COLORS } from '@/lib/mock';

export default function PlayerDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const player = MOCK_PLAYERS.find((p) => p.id === Number(params.id));
  if (!player) notFound();

  return (
    <>
      <nav className="navbar">
        <div className="brand">🐱 陪玩平台</div>
        <div className="nav-links">
          <Link href="/">首页</Link>
          <Link href="/players">全部陪玩</Link>
        </div>
      </nav>

      <main className="main">
        <div className="detail-card">
          <div className="detail-avatar">
            {player.avatar ? <img src={player.avatar} alt={player.name} /> : player.name.charAt(0)}
          </div>

          <div className="detail-name">
            {player.name}
            <span
              style={{
                marginLeft: '0.5rem',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: '#fff',
                padding: '0.2rem 0.7rem',
                borderRadius: '999px',
                background: TIER_COLORS[player.tier],
                verticalAlign: 'middle',
              }}
            >
              {player.tier}
            </span>
          </div>

          <div className="detail-sub">
            {player.shopName ? `${player.shopName}.${player.tier}` : '散陪'}
          </div>

          <div className="stat-grid">
            <div className="stat-box" style={{ background: '#FFF3E6' }}>
              <div className="stat-num" style={{ color: '#F97316' }}>
                {player.weeklyOrders}
              </div>
              <div className="stat-label">上周接单</div>
            </div>
            <div className="stat-box" style={{ background: '#ECFDF5' }}>
              <div className="stat-num" style={{ color: '#059669' }}>
                {player.rating}%
              </div>
              <div className="stat-label">好评率</div>
            </div>
            <div className="stat-box" style={{ background: '#FFFBEB' }}>
              <div className="stat-num" style={{ color: '#D97706' }}>
                ¥{player.price}
              </div>
              <div className="stat-label">最低/时</div>
            </div>
          </div>

          <div className="section">
            <div className="section-title">可接游戏</div>
            <div className="tag-row">
              {player.games.map((g) => (
                <span key={g} className="tag">
                  {g}
                </span>
              ))}
            </div>
          </div>

          <div className="section">
            <div className="section-title">接单时间</div>
            <div style={{ color: '#F97316', fontWeight: 600 }}>
              ⏰ {player.availableTime}
            </div>
          </div>

          <div className="section">
            <div className="section-title">个性签名</div>
            <div className="detail-text">{player.signature}</div>
          </div>

          <div className="section">
            <div className="section-title">个人介绍</div>
            <div className="detail-text">{player.description}</div>
          </div>

          <Link href={`/login?redirect=/member/create?playerId=${player.id}`} className="book-btn">
            🔥 立即预约
          </Link>
        </div>
      </main>
    </>
  );
}