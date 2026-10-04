'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { TIER_COLORS } from '@/lib/mock';
import { proxyImage } from '@/lib/image';

export default function PlayerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const playerId = Number(params?.id);

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    if (!playerId) return;

    let cancelled = false;

    async function load() {
      try {
        const res = await fetch('/api/public/player-detail/' + playerId, {
          cache: 'no-store',
        });
        const d = await res.json();

        if (cancelled) return;

        if (!d || !d.ok) {
          setError((d && d.error) || '加载失败');
          setLoading(false);
          return;
        }
        setData(d);
        setLoading(false);
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || '网络错误');
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [playerId]);

  async function handleBook() {
    if (booking) return;
    setBooking(true);

    const target = `/member/create?playerId=${playerId}`;

    try {
      const res = await fetch('/api/auth/session', { cache: 'no-store' });
      const s = await res.json();

      if (s.ok && s.user && s.user.role === 'member') {
        // 已登录会员 → 直接进下单页
        router.push(target);
      } else {
        // 未登录 → 跳登录页带 redirect
        router.push(`/login?redirect=${encodeURIComponent(target)}`);
      }
    } catch {
      router.push(`/login?redirect=${encodeURIComponent(target)}`);
    } finally {
      setBooking(false);
    }
  }

  if (loading) {
    return (
      <Shell>
        <div className="empty">加载中…</div>
      </Shell>
    );
  }

  if (error || !data || !data.player) {
    return (
      <Shell>
        <div className="empty">{error || '陪玩不存在'}</div>
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <Link href="/" className="member-more">
            ← 返回陪玩列表
          </Link>
        </div>
      </Shell>
    );
  }

  const player = data.player;
  const profile = data.profile || {};
  const games = Array.isArray(data.games) ? data.games : [];
  const certList = Array.isArray(data.certList) ? data.certList : [];
  const minPrice = Number(data.minPrice) || 0;
  const hasFreelance = !!data.hasFreelance;

  const mainTier =
    certList.length > 0 ? certList[0].tier : player.tier || '娱乐';
  const tierColor =
    TIER_COLORS[mainTier as keyof typeof TIER_COLORS] || '#6b7280';

  return (
    <Shell>
      <div className="detail-card">
        <div className="detail-avatar">
          {player.avatar ? (
            <img src={proxyImage(player.avatar)} alt={player.name} />
          ) : (
            String(player.name || '?').charAt(0)
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
              background: tierColor,
              verticalAlign: 'middle',
            }}
          >
            {mainTier}
          </span>
        </div>

        <div className="detail-identities">
          {certList.map((c: any) => (
            <span
              key={c.shopName + c.tier}
              className="identity-tag shop"
            >
              {c.shopName}.{c.tier}
            </span>
          ))}

          {hasFreelance && (
            <span className="identity-tag freelance">
              散陪.{player.tier}
            </span>
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
              {games.map((g: string) => (
                <span key={g} className="tag">
                  {g}
                </span>
              ))}
            </div>
          </div>
        )}

        {profile.available_time && (
          <div className="section">
            <div className="section-title">接单时间</div>
            <div style={{ color: '#F97316', fontWeight: 600 }}>
              ⏰ {profile.available_time}
            </div>
          </div>
        )}

        {profile.rank_text && (
          <div className="section">
            <div className="section-title">段位</div>
            <div className="detail-text">{profile.rank_text}</div>
          </div>
        )}

        {profile.signature && (
          <div className="section">
            <div className="section-title">个性签名</div>
            <div className="detail-text">{profile.signature}</div>
          </div>
        )}

        {profile.description && (
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
              src={proxyImage(player.audio)}
              style={{ width: '100%', marginTop: '0.5rem' }}
            />
          </div>
        )}

        <button
          onClick={handleBook}
          disabled={booking}
          className="book-btn"
          style={{
            border: 'none',
            cursor: booking ? 'wait' : 'pointer',
            fontFamily: 'inherit',
            width: '100%',
          }}
        >
          {booking ? '跳转中…' : '🔥 立即预约'}
        </button>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <nav className="navbar">
        <div className="brand">🐱 陪玩平台</div>
        <div className="nav-links">
          <Link href="/">全部陪玩</Link>
          <Link href="/login">登录</Link>
        </div>
      </nav>
      <main className="main">{children}</main>
    </>
  );
}