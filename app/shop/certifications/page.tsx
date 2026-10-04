'use client';

import { useEffect, useState } from 'react';

const TIERS = ['娱乐', '技术', '金牌', '魔王', '明星'];

type GameTier = {
  game_id: number;
  game_name: string;
  tier: string | null;
};

type PlayerRow = {
  user_id: number;
  username: string;
  nickname: string;
  player_id: number | null;
  game_tiers: GameTier[];
};

export default function ShopCertificationsPage() {
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [working, setWorking] = useState(false);

  // 正在编辑的 { userId, gameId }
  const [editing, setEditing] = useState<{ userId: number; gameId: number } | null>(
    null
  );

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/shops/certifications', {
          cache: 'no-store',
        });
        const data = await res.json();
        if (data.ok) {
          setPlayers(data.players || []);
        }
      } catch (err) {
        console.error('加载失败:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [refreshKey]);

  async function setTier(playerUserId: number, gameId: number, tier: string | null) {
    setWorking(true);
    try {
      const res = await fetch('/api/shops/certifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerUserId, gameId, tier }),
      });
      const data = await res.json();
      setWorking(false);

      if (!data.ok) {
        alert(data.error || '操作失败');
        return;
      }

      setEditing(null);
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      setWorking(false);
      alert(err?.message || '网络错误');
    }
  }

  if (loading) {
    return (
      <>
        <div className="shop-header">
          <h1 className="shop-title">限定认证</h1>
        </div>
        <div className="shop-empty">加载中…</div>
      </>
    );
  }

  return (
    <>
      <div className="shop-header">
        <h1 className="shop-title">限定认证</h1>
        <p className="shop-subtitle">共 {players.length} 位本店陪玩</p>
      </div>

      <div className="shop-note" style={{ marginBottom: '1.5rem' }}>
        💡 每个游戏可以独立授予一个档位。
        <br />
        比如：阿鹤可以「三角洲·金牌」+「永劫·技术」+「瓦·娱乐」。
        <br />
        老板下单时，该档位向下兼容（金牌可接娱乐、技术、金牌）。
      </div>

      {players.length === 0 ? (
        <div className="shop-empty">本店暂无陪玩</div>
      ) : (
        <div className="cert-list">
          {players.map((p) => (
            <div key={p.user_id} className="cert-card">
              <div className="cert-card-header">
                <div className="cert-card-avatar">{p.nickname.charAt(0)}</div>
                <div>
                  <div className="cert-card-name">{p.nickname}</div>
                  <div className="cert-card-sub">{p.username}</div>
                </div>
              </div>

              <div className="cert-games">
                {p.game_tiers.map((gt) => {
                  const isEditing =
                    editing?.userId === p.user_id &&
                    editing?.gameId === gt.game_id;

                  return (
                    <div key={gt.game_id} className="cert-game-row">
                      <div className="cert-game-name">{gt.game_name}</div>

                      {isEditing ? (
                        <div className="cert-tier-picker">
                          {TIERS.map((t) => (
                            <button
                              key={t}
                              className="shop-btn-sm"
                              onClick={() => setTier(p.user_id, gt.game_id, t)}
                              disabled={working}
                            >
                              {t}
                            </button>
                          ))}
                          <button
                            className="shop-btn-sm shop-btn-danger"
                            onClick={() => setTier(p.user_id, gt.game_id, null)}
                            disabled={working}
                          >
                            取消
                          </button>
                          <button
                            className="shop-btn-sm"
                            onClick={() => setEditing(null)}
                            disabled={working}
                          >
                            返回
                          </button>
                        </div>
                      ) : (
                        <div className="cert-game-actions">
                          {gt.tier ? (
                            <>
                              <span
                                className={
                                  'shop-badge ' +
                                  (gt.tier === '金牌' ||
                                  gt.tier === '魔王' ||
                                  gt.tier === '明星'
                                    ? 'shop-badge-orange'
                                    : '')
                                }
                              >
                                {gt.tier}
                              </span>
                              <button
                                className="shop-btn-sm"
                                onClick={() =>
                                  setEditing({
                                    userId: p.user_id,
                                    gameId: gt.game_id,
                                  })
                                }
                              >
                                修改
                              </button>
                              <button
                                className="shop-btn-sm shop-btn-danger"
                                onClick={() => {
                                  if (
                                    confirm(
                                      `取消「${p.nickname}」的 ${gt.game_name} 认证？`
                                    )
                                  ) {
                                    setTier(p.user_id, gt.game_id, null);
                                  }
                                }}
                              >
                                取消
                              </button>
                            </>
                          ) : (
                            <>
                              <span className="shop-badge shop-badge-gray">
                                未认证
                              </span>
                              <button
                                className="shop-btn-sm"
                                onClick={() =>
                                  setEditing({
                                    userId: p.user_id,
                                    gameId: gt.game_id,
                                  })
                                }
                              >
                                授予
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}