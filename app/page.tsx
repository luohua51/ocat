import Link from 'next/link';
import { fetchPlayers } from '@/lib/db';
import { TIER_COLORS } from '@/lib/mock';
import { sortPlayers } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const players = await fetchPlayers();
  const sorted = sortPlayers(players).slice(0, 4);

  return (
    <>
      <nav className="navbar">
        <div className="brand">🐱 陪玩平台</div>
        <div className="nav-links">
          <Link href="/players">全部陪玩</Link>
          <Link href="/login">登录</Link>
          <Link href="/login?tab=register">注册</Link>
        </div>
      </nav>

      <main className="main">
        <div className="hero">
          <h1>优质陪玩展示</h1>
          <p>专业陪玩 · 快乐上分 · 陪你赢到天明</p>
        </div>

        {players.length === 0 && (
          <div className="empty">暂无陪玩数据</div>
        )}

        <div className="cards">
          {sorted.map((p) => (
            <Link key={p.id} href={`/players/${p.id}`} className="card">
              <div className="avatar">
                {p.avatar ? <img src={p.avatar} alt={p.name} /> : p.name.charAt(0)}
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.4rem',
                }}
              >
                <div className="name">{p.name}</div>
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    color: '#fff',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '999px',
                    background:
                      TIER_COLORS[p.tier as keyof typeof TIER_COLORS] || '#6b7280',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {p.tier}
                </span>
              </div>

              <div className="meta">
                {p.games.length > 0 ? p.games.join(' · ') : '暂无游戏'}
                <br />
                {p.shopName}
              </div>

              <div className="price">
                {p.price > 0 ? `¥${p.price}/时起` : '价格待定'}
              </div>

              <span className="btn">查看详情</span>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}