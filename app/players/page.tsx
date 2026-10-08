'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchPlayers, type PlayerDisplay } from '@/lib/db';
import { TIER_COLORS } from '@/lib/mock';
import { sortPlayers } from '@/lib/utils';

export default function PlayersListPage() {
  const [players, setPlayers] = useState<PlayerDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    fetchPlayers().then((list) => {
      setPlayers(sortPlayers(list));
      setLoading(false);
    });
  }, []);

  const filtered = keyword
    ? players.filter(
        (p) =>
          p.name.includes(keyword) ||
          (p.shopName || '').includes(keyword) ||
          (p.games || []).some((g) => g.includes(keyword))
      )
    : players;

  return (
    <div style={{ padding: '1rem 1.25rem', maxWidth: 1080, margin: '0 auto' }}>
      <div style={{ marginBottom: '1.2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', margin: 0 }}>
          逛陪玩
        </h1>
        <p style={{ margin: '0.4rem 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>
          共 {players.length} 位陪玩在线接单
        </p>
      </div>

      <input
        type="text"
        placeholder="搜索陪玩名字 / 店铺 / 游戏"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        style={{
          width: '100%',
          padding: '0.7rem 1rem',
          borderRadius: 10,
          border: '1px solid rgba(255,255,255,0.12)',
          background: 'rgba(255,255,255,0.04)',
          color: '#fff',
          fontSize: '0.9rem',
          marginBottom: '1.2rem',
          outline: 'none',
        }}
      />

      {loading ? (
        <div style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', padding: '2rem' }}>
          加载中…
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', padding: '2rem' }}>
          暂无陪玩
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '0.9rem',
          }}
        >
          {filtered.map((p) => (
            <Link
              key={p.id}
              href={`/players/${p.id}`}
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12,
                padding: '1rem',
                textDecoration: 'none',
                color: '#fff',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  background: '#333',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.4rem',
                  fontWeight: 700,
                }}
              >
                {p.avatar ? (
                  <img
                    src={p.avatar}
                    alt={p.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  p.name.charAt(0)
                )}
              </div>
              <div style={{ fontWeight: 700, fontSize: '1rem' }}>{p.name}</div>
              <div
                style={{
                  fontSize: '0.72rem',
                  padding: '0.15rem 0.6rem',
                  borderRadius: 999,
                  background: (TIER_COLORS as any)[p.tier] || '#6b7280',
                  color: '#fff',
                }}
              >
                {p.tier}
              </div>
              {p.shopName && (
                <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)' }}>
                  {p.shopName}
                </div>
              )}
              <div style={{ fontSize: '0.85rem', color: '#FF7A00', fontWeight: 700 }}>
                {p.price > 0 ? `¥${p.price}/时起` : '价格待定'}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>
                ⭐ {p.rating?.toFixed(1) || '暂无'} · 周单 {p.weeklyOrders || 0}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}