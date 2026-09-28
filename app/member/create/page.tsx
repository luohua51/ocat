'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { createOrder } from '@/lib/order';

function CreateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const playerIdFromUrl = searchParams.get('playerId');

  const [players, setPlayers] = useState<any[]>([]);
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [playerId, setPlayerId] = useState<number>(playerIdFromUrl ? Number(playerIdFromUrl) : 0);
  const [gameId, setGameId] = useState<number>(0);
  const [tier, setTier] = useState<string>('娱乐');
  const [bossRank, setBossRank] = useState('');
  const [hours, setHours] = useState(1);
  const [remark, setRemark] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      if (!supabase) return;
      const [p, g] = await Promise.all([
        supabase.from('players').select('id, name, tier').eq('status', 'active'),
        supabase.from('games').select('id, name').eq('status', 'active'),
      ]);
      setPlayers(p.data || []);
      setGames(g.data || []);
      setLoading(false);
    }
    load();
  }, []);

  const player = players.find((p) => p.id === playerId);
  const isDesignated = playerId > 0;

  const unitPrice = 30;
  const total = isDesignated ? unitPrice * hours : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!gameId) return setError('请选择游戏');
    if (!bossRank.trim()) return setError('请填写你的段位');
    if (hours <= 0) return setError('时长必须大于 0');

    setSubmitting(true);
    const result = await createOrder({
      playerId: isDesignated ? playerId : 0,
      gameId,
      tier,
      bossRank,
      durationHours: hours,
      identityType: 'freelance',
      remark,
    });

    if (!result.ok) {
      setError(result.error || '下单失败');
      setSubmitting(false);
      return;
    }

    router.push('/member/orders/' + result.order!.id);
  }

  if (loading) {
    return <div className="member-empty">加载中…</div>;
  }

  return (
    <>
      <div className="member-header">
        <h1 className="member-title">下单</h1>
        <p className="member-subtitle">选择指定陪玩，或发单让陪玩来抢</p>
      </div>

      <form onSubmit={handleSubmit} className="member-create-form">
        <div className="member-form-block">
          <div className="member-form-label">选择陪玩</div>
          <select
            className="member-select"
            value={playerId}
            onChange={(e) => setPlayerId(Number(e.target.value))}
          >
            <option value={0}>🎯 不指定（发到抢单池，陪玩来抢）</option>
            {players.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}（{p.tier}）
              </option>
            ))}
          </select>

          {player && (
            <div className="member-player-preview">
              <div className="member-player-preview-avatar">{player.name.charAt(0)}</div>
              <div>
                <div style={{ fontWeight: 700, color: '#fff' }}>{player.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>散陪</div>
              </div>
            </div>
          )}

          {!isDesignated && (
            <div
              style={{
                marginTop: '0.8rem',
                padding: '0.8rem 1rem',
                background: 'rgba(99, 102, 241, 0.08)',
                border: '1px dashed rgba(99, 102, 241, 0.4)',
                borderRadius: '0.7rem',
                fontSize: '0.82rem',
                color: 'rgba(255,255,255,0.7)',
                lineHeight: 1.7,
              }}
            >
              📢 不指定陪玩，订单会进入<strong style={{ color: '#818cf8' }}>抢单池</strong>，
              所有陪玩都能看到并抢单。
              <br />
              价格由接单的陪玩确定，接单后你可以确认或换人。
            </div>
          )}
        </div>

        <div className="member-form-block">
          <div className="member-form-label">选择游戏</div>
          <div className="member-radio-row">
            {games.map((g) => (
              <button
                key={g.id}
                type="button"
                className={'member-radio' + (gameId === g.id ? ' active' : '')}
                onClick={() => setGameId(g.id)}
              >
                {g.name}
              </button>
            ))}
          </div>
        </div>

        <div className="member-form-block">
          <div className="member-form-label">选择档位</div>
          <div className="member-radio-row">
            {['娱乐', '技术'].map((t) => (
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

        <div className="member-form-block">
          <div className="member-form-label">备注（可选）</div>
          <input
            className="member-input"
            type="text"
            placeholder="想说的其他需求"
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
          />
        </div>

        <div className="member-create-summary">
          <div>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>单价</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>
              {isDesignated ? `¥${unitPrice.toFixed(2)}/时` : '待定'}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>总价</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#FF7A00' }}>
              {isDesignated ? `¥${total.toFixed(2)}` : '待接单后确定'}
            </div>
          </div>
        </div>

        {error && <div className="member-create-error">{error}</div>}

        <button type="submit" className="member-submit-btn" disabled={submitting}>
          {submitting ? '提交中…' : isDesignated ? '提交订单' : '发布到抢单池'}
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