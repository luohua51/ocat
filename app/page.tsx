'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchPlayers, type PlayerDisplay } from '@/lib/db';
import { GAMES, TIERS, TIER_COLORS, type Tier } from '@/lib/mock';
import { sortPlayers } from '@/lib/utils';
import { proxyImage } from '@/lib/image';

export default function HomePage() {
  const [game, setGame] = useState('全部');
  const [tier, setTier] = useState<'全部' | Tier>('全部');
  const [allPlayers, setAllPlayers] = useState<PlayerDisplay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlayers().then((data) => {
      setAllPlayers(data);
      setLoading(false);
    });
  }, []);

  const filtered = allPlayers.filter((p) => {
    if (game !== '全部' && !p.games.includes(game)) return false;
    if (tier !== '全部' && p.tier !== tier) return false;
    return true;
  });

  const list = sortPlayers(filtered);

  return (
    <>
      <nav className="navbar">
        <div className="brand">🐱 陪玩平台</div>
        <div className="nav-links">
          <Link href="/login">登录</Link>
          <Link href="/login?tab=register">注册</Link>
        </div>
      </nav>

      <main className="main">
        <div className="hero">
          <h1>挑选陪玩</h1>
          <p>{loading ? '加载中…' : `共 ${list.length} 位陪玩可预约`}</p>
        </div>

        <div className="filter-group">
          <div className="filter-label">游戏</div>
          <div className="filter-chips">
            {['全部', ...GAMES].map((g) => (
              <button
                key={g}
                className={`filter-chip ${game === g ? 'active' : ''}`}
                onClick={() => setGame(g)}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <div className="filter-label">类型</div>
          <div className="filter-chips">
            {['全部', ...TIERS].map((t) => (
              <button
                key={t}
                className={`filter-chip ${tier === t ? 'active' : ''}`}
                onClick={() => setTier(t as '全部' | Tier)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="cards">
          {loading ? (
            <div className="empty">加载中…</div>
          ) : list.length === 0 ? (
            <div className="empty">暂无符合条件的陪玩</div>
          ) : (
            list.map((p) => (
              <Link key={p.id} href={`/players/${p.id}`} className="card">
                <div className="avatar">
                  {p.avatar ? (
                    <img src={proxyImage(p.avatar)} alt={p.name} loading="lazy" />
                  ) : (
                    p.name.charAt(0)
                  )}
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

                {p.identities.length > 0 && (
                  <div className="card-identities">
                    {p.identities.map((idn, i) => (
                      <span
                        key={i}
                        className={
                          'identity-tag ' + (idn.type === 'shop' ? 'shop' : 'freelance')
                        }
                        style={{ fontSize: '0.68rem', padding: '0.15rem 0.5rem' }}
                      >
                        {idn.label}
                      </span>
                    ))}
                  </div>
                )}

                {p.identities.length === 0 && (
                  <div className="card-identities">
                    <span
                      className="identity-tag pending"
                      style={{ fontSize: '0.68rem', padding: '0.15rem 0.5rem' }}
                    >
                      暂未开放接单
                    </span>
                  </div>
                )}

                <div className="meta" style={{ marginTop: '0.4rem' }}>
                  {p.games.length > 0 ? p.games.join(' · ') : '暂无游戏'}
                </div>

                <div className="price">
                  {p.price > 0 ? `¥${p.price}/时起` : '—'}
                </div>

                <span className="btn">查看详情</span>
              </Link>
            ))
          )}
        </div>
      </main>
    </>
  );
}