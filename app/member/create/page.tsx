'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createOrder, calcOrderPrice } from '@/lib/order';
import { fetchCurrentUser, type User } from '@/lib/auth';

const ALL_TIERS = ['娱乐', '技术', '金牌', '魔王', '明星'];
const TIER_RANK: Record<string, number> = { 娱乐: 4, 技术: 3, 金牌: 2, 魔王: 1, 明星: 0 };
const FREELANCE_TIERS = ['娱乐', '技术'];

type Player = {
  id: number;
  name: string;
  avatar: string;
  tier: string;
  acceptFreelance: boolean;
  capabilities: { gameId: number; tier: string }[];
  shopGameTiers: { gameId: number; tier: string; shopId: number }[];
};

type Game = { id: number; name: string; ranks: string[] };

function CreateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const playerIdFromUrl = searchParams.get('playerId');

  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [players, setPlayers] = useState<Player[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  const [playerId, setPlayerId] = useState<number>(playerIdFromUrl ? Number(playerIdFromUrl) : 0);
  const [gameId, setGameId] = useState<number>(0);
  const [tier, setTier] = useState<string>('娱乐');
  const [bossRank, setBossRank] = useState('');
  const [hours, setHours] = useState(1);
  const [remark, setRemark] = useState('');

  const [timing, setTiming] = useState<'instant' | 'scheduled'>('instant');
  const [scheduledAt, setScheduledAt] = useState('');

  // 实时价格
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [priceLoading, setPriceLoading] = useState(false);

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCurrentUser().then((u) => {
      if (!u || u.role !== 'member') {
        const redirectPath = playerIdFromUrl
          ? `/member/create?playerId=${playerIdFromUrl}`
          : '/member/create';
        router.replace(`/login?redirect=${encodeURIComponent(redirectPath)}`);
        return;
      }
      setUser(u);
      setChecking(false);
    });
  }, [router, playerIdFromUrl]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/public/order-options', { cache: 'no-store' });
        const data = await res.json();
        if (!data.ok) {
          setError(data.error || '加载失败');
          setLoading(false);
          return;
        }
        setPlayers(data.players || []);
        setGames(data.games || []);
        setLoading(false);
      } catch (err: any) {
        setError(err?.message || '网络错误');
        setLoading(false);
      }
    }
    load();
  }, []);

  // 指定陪玩 + 选定游戏档位后，查单价
  useEffect(() => {
    if (!playerId || !gameId || !tier) {
      setUnitPrice(0);
      return;
    }
    setPriceLoading(true);
    fetch(`/api/public/price?playerId=${playerId}&gameId=${gameId}&tier=${encodeURIComponent(tier)}`, {
      cache: 'no-store',
    })
      .then((r) => r.json())
      .then((data) => {
        setUnitPrice(data.ok ? Number(data.unitPrice) : 0);
      })
      .catch(() => setUnitPrice(0))
      .finally(() => setPriceLoading(false));
  }, [playerId, gameId, tier]);

  const player = players.find((p) => p.id === playerId);
  const selectedGame = games.find((g) => g.id === gameId);
  const isDesignated = playerId > 0;

  const availableGames = useMemo(() => {
    if (!isDesignated) return games;
    if (!player) return [];
    const gameIds = [...new Set(player.capabilities.map((c) => c.gameId))];
    return games.filter((g) => gameIds.includes(g.id));
  }, [isDesignated, player, games]);

  const availableTiers = useMemo(() => {
    if (!isDesignated) return ALL_TIERS;
    if (!player || !gameId) return [];
    const shopTierForGame = player.shopGameTiers.find((sgt) => sgt.gameId === gameId);
    if (shopTierForGame) {
      const playerRank = TIER_RANK[shopTierForGame.tier] ?? 4;
      return ALL_TIERS.filter((t) => (TIER_RANK[t] ?? 4) >= playerRank);
    }
    if (player.acceptFreelance) {
      const hasCapability = player.capabilities.some((c) => c.gameId === gameId);
      if (hasCapability) return FREELANCE_TIERS;
    }
    return [];
  }, [isDesignated, player, gameId]);

  const availableRanks = useMemo(() => {
    if (!selectedGame) return [];
    return selectedGame.ranks || [];
  }, [selectedGame]);

  useEffect(() => {
    if (!isDesignated) {
      setGameId(0);
      setTier('娱乐');
      setBossRank('');
      return;
    }
    if (availableGames.length > 0) setGameId(availableGames[0].id);
    else setGameId(0);
    setBossRank('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerId, isDesignated]);

  useEffect(() => {
    if (availableTiers.length > 0 && !availableTiers.includes(tier)) {
      setTier(availableTiers[0]);
    }
    setBossRank('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId]);

  // 前端展示用折后价（后端会重算，以服务器时间为准）
  const preview = useMemo(() => {
    if (!isDesignated || unitPrice <= 0 || hours <= 0) return null;
    const original = unitPrice * hours;
    return calcOrderPrice(original, true);
  }, [isDesignated, unitPrice, hours]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!gameId) return setError('请选择游戏');
    if (!availableTiers.includes(tier)) return setError('档位不可用');
    if (!bossRank) return setError('请选择你的段位');
    if (hours <= 0) return setError('时长必须大于 0');
    if (timing === 'scheduled' && !scheduledAt) return setError('请选择预约时间');

    setSubmitting(true);
    const result = await createOrder({
      playerId: isDesignated ? playerId : 0,
      gameId,
      tier,
      bossRank,
      durationHours: hours,
      identityType: 'freelance',
      remark,
      scheduledTime: timing === 'scheduled' ? new Date(scheduledAt).toISOString() : null,
    });
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error || '下单失败');
      return;
    }
    router.push('/member/orders/' + result.order!.id);
  }

  if (checking) return <div className="member-empty">加载中…</div>;
  if (!user) return null;
  if (loading) return <div className="member-empty">加载中…</div>;

  const noCapability = isDesignated && availableGames.length === 0;
  const noTier = isDesignated && gameId > 0 && availableTiers.length === 0;

  return (
    <>
      <div className="member-header">
        <h1 className="member-title">下单</h1>
        <p className="member-subtitle">选择指定陪玩，或发单让陪玩来抢</p>
      </div>

      <div className="member-discount-banner">
        <span>🎉 会员专享</span>
        <span>
          平时 <b>95折</b> · 周末 <b>85折</b>
        </span>
      </div>

      <form onSubmit={handleSubmit} className="member-create-form">
        {/* 下单类型 */}
        <div className="member-form-block">
          <div className="member-form-label">下单类型</div>
          <div className="member-radio-row">
            <button
              type="button"
              className={'member-radio' + (timing === 'instant' ? ' active' : '')}
              onClick={() => {
                setTiming('instant');
                setScheduledAt('');
              }}
            >
              🚀 立即开始
            </button>
            <button
              type="button"
              className={'member-radio' + (timing === 'scheduled' ? ' active' : '')}
              onClick={() => setTiming('scheduled')}
            >
              📅 预约
            </button>
          </div>
          {timing === 'scheduled' && (
            <input
              type="datetime-local"
              className="member-input"
              style={{ marginTop: '0.6rem' }}
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
          )}
        </div>

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
        </div>

        {noCapability && (
          <div className="member-create-error" style={{ marginBottom: '1rem' }}>
            该陪玩还没开放接单能力，暂时无法预约
          </div>
        )}

        {!noCapability && (
          <div className="member-form-block">
            <div className="member-form-label">选择游戏</div>
            <div className="member-radio-row">
              {games.map((g) => {
                const enabled = availableGames.some((ag) => ag.id === g.id);
                return (
                  <button
                    key={g.id}
                    type="button"
                    disabled={!enabled}
                    className={'member-radio' + (gameId === g.id ? ' active' : '')}
                    style={!enabled ? { opacity: 0.3, cursor: 'not-allowed' } : undefined}
                    onClick={() => enabled && setGameId(g.id)}
                  >
                    {g.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {noTier && (
          <div className="member-create-error" style={{ marginBottom: '1rem' }}>
            该陪玩在「{selectedGame?.name}」暂无可接单的档位
          </div>
        )}

        {!noCapability && !noTier && gameId > 0 && (
          <div className="member-form-block">
            <div className="member-form-label">选择档位</div>
            <div className="member-radio-row">
              {ALL_TIERS.map((t) => {
                const enabled = availableTiers.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    disabled={!enabled}
                    className={'member-radio' + (tier === t ? ' active' : '')}
                    style={!enabled ? { opacity: 0.3, cursor: 'not-allowed' } : undefined}
                    onClick={() => enabled && setTier(t)}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {!noCapability && !noTier && gameId > 0 && (
          <div className="member-form-block">
            <div className="member-form-label">
              你的段位{selectedGame ? `（${selectedGame.name}）` : ''}
            </div>
            {availableRanks.length === 0 ? (
              <div className="member-empty" style={{ padding: '0.8rem', fontSize: '0.85rem' }}>
                该游戏没有段位
              </div>
            ) : (
              <div className="member-radio-row">
                {availableRanks.map((r) => (
                  <button
                    key={r}
                    type="button"
                    className={'member-radio' + (bossRank === r ? ' active' : '')}
                    onClick={() => setBossRank(r)}
                  >
                    {r}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

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

        {/* 价格预览 */}
        {isDesignated && (
          <div
            style={{
              marginTop: '1rem',
              padding: '1rem 1.1rem',
              borderRadius: 12,
              background: 'rgba(255,122,0,0.08)',
              border: '1px solid rgba(255,122,0,0.3)',
            }}
          >
            {priceLoading ? (
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>
                正在计算价格…
              </div>
            ) : preview ? (
              <>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.85rem',
                    color: 'rgba(255,255,255,0.6)',
                    marginBottom: '0.4rem',
                  }}
                >
                  <span>原价</span>
                  <span>¥{preview.originalPrice.toFixed(2)}</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.85rem',
                    color: '#34d399',
                    marginBottom: '0.4rem',
                  }}
                >
                  <span>{preview.discountLabel}</span>
                  <span>-¥{preview.discountAmount.toFixed(2)}</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '1.05rem',
                    fontWeight: 800,
                    color: '#FF7A00',
                    paddingTop: '0.4rem',
                    borderTop: '1px dashed rgba(255,122,0,0.3)',
                  }}
                >
                  <span>实付</span>
                  <span>¥{preview.finalPrice.toFixed(2)}</span>
                </div>
              </>
            ) : (
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>
                该档位暂无价格，请更换档位
              </div>
            )}
          </div>
        )}

        {!isDesignated && (
          <div
            style={{
              marginTop: '1rem',
              padding: '0.85rem 1rem',
              borderRadius: 10,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              fontSize: '0.85rem',
              color: 'rgba(255,255,255,0.6)',
            }}
          >
            🎯 抢单池订单会在陪玩接单时按该陪玩报价计算，会员同样享受 <b style={{ color: '#FF7A00' }}>95折 / 周末85折</b>。
          </div>
        )}

        {error && <div className="member-create-error">{error}</div>}

        <button
          type="submit"
          className="member-submit-btn"
          disabled={submitting || noCapability || noTier}
        >
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