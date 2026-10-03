'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { TIER_COLORS } from '@/lib/mock';

type PlayerDetail = {
  player: any;
  profile: any;
  games: string[];
  minPrice: number;
  hasFreelance: boolean;
  certList: { shopName: string; tier: string }[];
};

export default function PlayerDetailPage() {
  const params = useParams();
  const playerId = Number(params.id);

  const [data, setData] = useState<PlayerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/public/player-detail/' + playerId, {
          cache: 'no-store',
        });
        const d = await res.json();
        if (!d.ok) {
          setError(d.error || '加载失败');
          setLoading(false);
          return;
        }
        setData(d);
      } catch (err: any) {
        setError(err?.message || '网络错误');
      } finally {
        setLoading(false);
      }
    }
    if (playerId) load();
  }, [playerId]);

  if (loading) {
    return (
      <>
        <nav className="navbar">
          <div className="brand">🐱 陪玩平台</div>
          <div className="nav-links">
            <Link href="/">全部陪玩</Link>
            <Link href="/login">登录</Link>
          </div>
        </nav>
        <main className="main">
          <div className="empty">加载中…</div>
        </main>
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        <nav className="navbar">
          <div className="brand">🐱 陪玩平台</div>
          <div className="nav-links">
            <Link href="/">全部陪玩</Link>
            <Link href="/login">登录</Link>
          </div>
        </nav>
        <main className="main">
          <div className="empty">{error || '陪玩不存在'}</div>
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <Link href="/" className="member-more">
              ← 返回陪玩列表
            </Link>
          </div>
        </main>
      </>
    );
  }

  const { player, profile, games, minPrice, hasFreelance, certList } = data;

  const mainTier = certList.length > 0 ? certList[0].tier : player.tier;

  return (
    <>
      <nav className="navbar">
        <div className="brand">🐱 陪玩平台</div>
        <div className="nav-links">
          <Link href="/">全部陪玩</Link>
          <Link href="/login">登录</Link>
        </div>
      </nav>

      <main className="main">
        <div className="detail-card">
          <div className="detail-avatar">
            {player.avatar ? (
              <img src={player.avatar} alt={player.name} />
            ) : (
              player.name.charAt(0)
            )}
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
                background:
                  TIER_COLORS[mainTier as keyof typeof TIER_COLORS] || '#6b7280',
                verticalAlign: 'middle',
              }}
            >
              {mainTier}
            </span>
          </div>

          <div className="detail-identities">
            {certList.map((c) => (
              <span key={c.shopName + c.tier} className="identity-tag shop">
                {c.shopName}.{c.tier}
              </span>
            ))}

            {hasFreelance && (
              <span className="identity-tag freelance">散陪.{player.tier}</span>
            )}

            {certList.length === 0 && !hasFreelance && (
              <span className="identity-tag pending">暂未开放接单</span>
            )}
          </div>

          <div className="stat-grid" style={{ marginTop: '1.2rem' }}>
            <div className="stat-box" style={{ background: '#FFF3E6' }}>
              <div className="stat-num" style={{ color: '#F97316' }}>
                {player.weekly_orders || 0}
              </div>
              <div className="stat-label">上周接单</div>
            </div>
            <div className="stat-box" style={{ background: '#ECFDF5' }}>
              <div className="stat-num" style={{ color: '#059669' }}>
                {player.rating || 100}%
              </div>
              <div className="stat-label">好评率</div>
            </div>
            <div className="stat-box" style={{ background: '#FFFBEB' }}>
              <div className="stat-num" style={{ color: '#D97706' }}>
                {hasFreelance && minPrice > 0 ? `¥${minPrice}` : '—'}
              </div>
              <div className="stat-label">散陪起价</div>
            </div>
          </div>

          {games.length > 0 && (
            <div className="section">
              <div className="section-title">可接游戏</div>
              <div className="tag-row">
                {games.map((g) => (
                  <span key={g} className="tag">
                    {g}
                  </span>
                ))}
              </div>
            </div>
          )}

          {profile?.available_time && (
            <div className="section">
              <div className="section-title">接单时间</div>
              <div style={{ color: '#F97316', fontWeight: 600 }}>
                ⏰ {profile.available_time}
              </div>
            </div>
          )}

          {profile?.rank_text && (
            <div className="section">
              <div className="section-title">段位</div>
              <div className="detail-text">{profile.rank_text}</div>
            </div>
          )}

          {profile?.signature && (
            <div className="section">
              <div className="section-title">个性签名</div>
              <div className="detail-text">{profile.signature}</div>
            </div>
          )}

          {profile?.description && (
            <div className="section">
              <div className="section-title">个人介绍</div>
              <div className="detail-text">{profile.description}</div>
            </div>
          )}

          {player.audio && (
            <div className="section">
              <div className="section-title">语音试听</div>
              <audio
                controls
                src={player.audio}
                style={{ width: '100%', marginTop: '0.5rem' }}
              />
            </div>
          )}

          <Link
            href={`/login?redirect=/member/create?playerId=${player.id}`}
            className="book-btn"
          >
            🔥 立即预约
          </Link>
        </div>
      </main>
    </>
  );
}