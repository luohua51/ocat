'use client';

import { useEffect, useState } from 'react';
import { proxyImage } from '@/lib/image';

type GameRow = {
  gameId: number;
  gameName: string;
  gameLogo: string;
  benefit: string;
  notice: string;
};

export default function ShopBenefitsPage() {
  const [games, setGames] = useState<GameRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [activeGame, setActiveGame] = useState<number | null>(null);

  async function load() {
    try {
      const res = await fetch('/api/shop/benefits', { cache: 'no-store' });
      const data = await res.json();
      if (data.ok) {
        setGames(data.games || []);
        if (data.games && data.games.length > 0) {
          setActiveGame(data.games[0].gameId);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateField(gameId: number, field: 'benefit' | 'notice', value: string) {
    setGames((prev) =>
      prev.map((g) => (g.gameId === gameId ? { ...g, [field]: value } : g))
    );
  }

  async function handleSave(gameId: number) {
    const g = games.find((x) => x.gameId === gameId);
    if (!g) return;

    setSavingId(gameId);
    try {
      const res = await fetch('/api/shop/benefits', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId,
          benefit: g.benefit,
          notice: g.notice,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        alert(data.error || '保存失败');
        return;
      }
      alert('已保存');
    } finally {
      setSavingId(null);
    }
  }

  if (loading) return <div className="shop-empty">加载中…</div>;

  const current = games.find((g) => g.gameId === activeGame);

  return (
    <>
      <div className="shop-header">
        <h1 className="shop-title">老板权益 / 须知</h1>
        <p className="shop-subtitle">
          每个游戏独立设置，会展示在店铺主页对应分区
        </p>
      </div>

      <div className="shop-tabs">
        {games.map((g) => (
          <button
            key={g.gameId}
            className={'shop-tab' + (activeGame === g.gameId ? ' active' : '')}
            onClick={() => setActiveGame(g.gameId)}
          >
            {g.gameLogo && (
              <img
                src={proxyImage(g.gameLogo)}
                alt={g.gameName}
                className="shop-tab-logo"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
            <span>{g.gameName}</span>
          </button>
        ))}
      </div>

      {current && (
        <>
          <div className="player-profile-card" style={{ marginBottom: '1.2rem' }}>
            <div className="player-form-block">
              <div className="player-form-label">
                🎁 {current.gameName} · 老板权益
              </div>
              <textarea
                className="player-textarea"
                rows={6}
                placeholder={`每行一条，例如：\n• 每小时保底击杀 5 人\n• 段位保证不低于老板当前段位\n• 不满意可免费换人一次`}
                value={current.benefit}
                onChange={(e) =>
                  updateField(current.gameId, 'benefit', e.target.value)
                }
              />
              <div className="player-form-hint">每行一条，会按行展示</div>
            </div>
          </div>

          <div className="player-profile-card" style={{ marginBottom: '1.2rem' }}>
            <div className="player-form-block">
              <div className="player-form-label">
                📢 {current.gameName} · 老板须知
              </div>
              <textarea
                className="player-textarea"
                rows={6}
                placeholder={`每行一条，例如：\n• 下单后 10 分钟未开始服务可全额退款\n• 陪玩迟到 15 分钟以上可要求换人\n• 服务期间请勿提出不当要求`}
                value={current.notice}
                onChange={(e) =>
                  updateField(current.gameId, 'notice', e.target.value)
                }
              />
              <div className="player-form-hint">每行一条，会按行展示</div>
            </div>
          </div>

          <button
            className="player-submit-btn"
            onClick={() => handleSave(current.gameId)}
            disabled={savingId === current.gameId}
          >
            {savingId === current.gameId
              ? '保存中…'
              : `保存 ${current.gameName} 的权益和须知`}
          </button>
        </>
      )}
    </>
  );
}