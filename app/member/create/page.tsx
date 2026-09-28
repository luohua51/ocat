'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { MOCK_PLAYERS, GAMES, TIERS, TIER_COLORS, type Tier } from '@/lib/mock';

function CreateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const playerIdFromUrl = searchParams.get('playerId');
  const initialPlayer = playerIdFromUrl
    ? MOCK_PLAYERS.find((p) => p.id === Number(playerIdFromUrl))
    : null;

  const [playerId, setPlayerId] = useState<number>(initialPlayer?.id || 0);
  const [game, setGame] = useState(initialPlayer?.games[0] || GAMES[0]);
  const [tier, setTier] = useState<Tier>('娱乐');
  const [hours, setHours] = useState(1);
  const [bossRank, setBossRank] = useState('');
  const [identity, setIdentity] = useState<'freelance' | 'shop'>('freelance');

  const player = MOCK_PLAYERS.find((p) => p.id === playerId);
  const unitPrice = player?.price || 0;
  const total = unitPrice * hours;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!player) {
      alert('请选择陪玩');
      return;
    }
    if (!bossRank) {
      alert('请填写你的段位');
      return;
    }
    alert(
      `订单已生成（demo）\n\n陪玩：${player.name}\n游戏：${game}\n档位：${tier}\n段位：${bossRank}\n时长：${hours} 小时\n总价：¥${total.toFixed(2)}`
    );
    router.push('/member/orders');
  }

  return (
    <>
      <div className="member-header">
        <h1 className="member-title">下单</h1>
        <p className="member-subtitle">填写需求，系统自动算价</p>
      </div>

      <form onSubmit={handleSubmit} className="member-create-form">
        <div className="member-form-block">
          <div className="member-form-label">选择陪玩</div>
          <select
            className="member-select"
            value={playerId}
            onChange={(e) => setPlayerId(Number(e.target.value))}
          >
            <option value={0}>请选择陪玩</option>
            {MOCK_PLAYERS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}（{p.tier} · ¥{p.price}/时起）
              </option>
            ))}
          </select>

          {player && (
            <div className="member-player-preview">
              <div className="member-player-preview-avatar">
                {player.avatar ? <img src={player.avatar} alt="" /> : player.name.charAt(0)}
              </div>
              <div>
                <div style={{ fontWeight: 700, color: '#fff' }}>
                  {player.name}
                  <span
                    style={{
                      marginLeft: '0.5rem',
                      fontSize: '0.7rem',
                      color: '#fff',
                      padding: '0.1rem 0.5rem',
                      borderRadius: '999px',
                      background: TIER_COLORS[player.tier],
                    }}
                  >
                    {player.tier}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
                  {player.shopName ? `${player.shopName}认证` : '散陪'}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="member-form-block">
          <div className="member-form-label">选择身份</div>
          <div className="member-radio-row">
            <button
              type="button"
              className={'member-radio' + (identity === 'freelance' ? ' active' : '')}
              onClick={() => setIdentity('freelance')}
            >
              散陪
            </button>
            <button
              type="button"
              className={'member-radio' + (identity === 'shop' ? ' active' : '')}
              onClick={() => setIdentity('shop')}
            >
              店铺
            </button>
          </div>
        </div>

        <div className="member-form-block">
          <div className="member-form-label">选择游戏</div>
          <div className="member-radio-row">
            {GAMES.map((g) => (
              <button
                key={g}
                type="button"
                className={'member-radio' + (game === g ? ' active' : '')}
                onClick={() => setGame(g)}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div className="member-form-block">
          <div className="member-form-label">选择档位</div>
          <div className="member-radio-row">
            {TIERS.map((t) => (
              <button
                key={t}
                type="button"
                className={'member-radio' + (tier === t ? ' active' : '')}
                onClick={() => setTier(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="member-form-block">
          <div className="member-form-label">你的段位</div>
          <input
            className="member-input"
            type="text"
            placeholder="如：永劫修罗、瓦钻石"
            value={bossRank}
            onChange={(e) => setBossRank(e.target.value)}
          />
        </div>

        <div className="member-form-block">
          <div className="member-form-label">时长（小时）</div>
          <div className="member-radio-row">
            {[0.5, 1, 1.5, 2, 3, 4].map((h) => (
              <button
                key={h}
                type="button"
                className={'member-radio' + (hours === h ? ' active' : '')}
                onClick={() => setHours(h)}
              >
                {h}h
              </button>
            ))}
          </div>
        </div>

        <div className="member-create-summary">
          <div>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>单价</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>
              ¥{unitPrice.toFixed(2)}/时
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>总价</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#FF7A00' }}>
              ¥{total.toFixed(2)}
            </div>
          </div>
        </div>

        <button type="submit" className="member-submit-btn">
          提交订单
        </button>
      </form>
    </>
  );
}

export default function MemberCreatePage() {
  return (
    <Suspense fallback={<div style={{ color: '#fff', padding: '2rem' }}>加载中…</div>}>
      <CreateContent />
    </Suspense>
  );
}