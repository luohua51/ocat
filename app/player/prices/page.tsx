'use client';

import { useEffect, useState } from 'react';
import { fetchGames, type Game } from '@/lib/game';

type PlayerPrice = {
  id: number;
  player_id: number;
  game_id: number;
  tier: string;
  boss_rank: string | null;
  price_per_hour: number;
  is_active: boolean;
};

const TIERS = ['娱乐', '技术'];

export default function PlayerPricesPage() {
  const [prices, setPrices] = useState<PlayerPrice[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [working, setWorking] = useState(false);

  // 散陪开关
  const [acceptFreelance, setAcceptFreelance] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false);

  // 新增表单
  const [newGameId, setNewGameId] = useState<number>(0);
  const [newTier, setNewTier] = useState<string>('娱乐');
  const [newBossRank, setNewBossRank] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [error, setError] = useState('');

  // 编辑
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [gamesData, pricesRes, freelanceRes] = await Promise.all([
          fetchGames(),
          fetch('/api/player/prices', { cache: 'no-store' }).then((r) => r.json()),
          fetch('/api/player/freelance', { cache: 'no-store' }).then((r) => r.json()),
        ]);

        if (cancelled) return;

        setGames(gamesData);
        if (pricesRes.ok) setPrices(pricesRes.prices || []);
        if (freelanceRes.ok) setAcceptFreelance(!!freelanceRes.acceptFreelance);
      } catch (err) {
        console.error('加载异常:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  function gameName(gameId: number) {
    const g = games.find((x) => x.id === gameId);
    return g?.name || `未知游戏(${gameId})`;
  }

  const selectedGame = games.find((g) => g.id === newGameId);
  const availableRanks: string[] = (selectedGame?.ranks || []) as string[];

  // 游戏变了清空段位
  useEffect(() => {
    setNewBossRank('');
  }, [newGameId]);

  // ============================================================
  // 开关
  // ============================================================
  async function handleToggleFreelance() {
    if (toggleLoading) return;
    const next = !acceptFreelance;
    setToggleLoading(true);

    try {
      const res = await fetch('/api/player/freelance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accept: next }),
      });
      const data = await res.json();

      if (!data.ok) {
        alert(data.error || '切换失败');
        return;
      }

      setAcceptFreelance(next);
      alert(next ? '已开启散陪接单' : '已关闭散陪接单');
    } catch (err: any) {
      alert(err?.message || '网络错误');
    } finally {
      setToggleLoading(false);
    }
  }

  // ============================================================
  // 新增
  // ============================================================
  async function handleAdd() {
    setError('');
    if (!newGameId) return setError('请选择游戏');
    if (!newBossRank) return setError('请选择老板段位');
    const priceNum = parseFloat(newPrice);
    if (!priceNum || priceNum < 9.9) return setError('最低 9.9 元/时');

    setWorking(true);
    try {
      const res = await fetch('/api/player/prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: newGameId,
          tier: newTier,
          bossRank: newBossRank,
          pricePerHour: priceNum,
        }),
      });
      const data = await res.json();
      setWorking(false);

      if (!data.ok) {
        setError(data.error || '保存失败');
        return;
      }

      setNewPrice('');
      setNewGameId(0);
      setNewBossRank('');
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      setWorking(false);
      setError(err?.message || '网络错误');
    }
  }

  // ============================================================
  // 修改
  // ============================================================
  async function handleSaveEdit(id: number) {
    const priceNum = parseFloat(editValue);
    if (!priceNum || priceNum < 9.9) {
      return alert('最低 9.9 元/时');
    }

    setWorking(true);
    try {
      const res = await fetch('/api/player/prices/' + id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pricePerHour: priceNum }),
      });
      const data = await res.json();
      setWorking(false);

      if (!data.ok) {
        alert(data.error || '修改失败');
        return;
      }

      setEditingId(null);
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      setWorking(false);
      alert(err?.message || '网络错误');
    }
  }

  // ============================================================
  // 删除
  // ============================================================
  async function handleDelete(id: number) {
    if (!confirm('确定删除这条价格？')) return;

    setWorking(true);
    try {
      const res = await fetch('/api/player/prices/' + id, {
        method: 'DELETE',
      });
      const data = await res.json();
      setWorking(false);

      if (!data.ok) {
        alert(data.error || `删除失败（${res.status}）`);
        return;
      }

      alert('已删除');
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      setWorking(false);
      alert(err?.message || '网络错误');
    }
  }

  // 按游戏分组
  const grouped: Record<number, PlayerPrice[]> = {};
  prices.forEach((p) => {
    if (!grouped[p.game_id]) grouped[p.game_id] = [];
    grouped[p.game_id].push(p);
  });

  return (
    <>
      <div className="player-header">
        <h1 className="player-title">散陪定价</h1>
        <p className="player-subtitle">开启散陪后，才能在抢单池接单</p>
      </div>

      {/* 开关 */}
      <div className="player-toggle-card">
        <div>
          <div className="player-toggle-title">开启散陪接单</div>
          <div className="player-toggle-desc">
            开启后可在抢单大厅接单，并设置散陪价格
          </div>
        </div>
        <button
          className={'player-toggle ' + (acceptFreelance ? 'on' : 'off')}
          onClick={handleToggleFreelance}
          disabled={toggleLoading}
        >
          <span className="player-toggle-dot" />
        </button>
      </div>

      {!acceptFreelance && (
        <div
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px dashed rgba(255,122,0,0.3)',
            borderRadius: '0.9rem',
            padding: '1.5rem 1.2rem',
            color: 'rgba(255,255,255,0.5)',
            fontSize: '0.9rem',
            textAlign: 'center',
            lineHeight: 1.8,
          }}
        >
          你当前没有开启散陪接单。
          <br />
          开启后可以：
          <br />
          · 在抢单大厅接单
          <br />
          · 自由设置时薪
          <br />
          · 展示页显示你的散陪价格
        </div>
      )}

      {acceptFreelance && (
        <>
          {/* 当前价格 */}
          <div className="player-section">
            <h2 className="player-section-title">我的散陪价</h2>

            {loading ? (
              <div className="player-empty">加载中…</div>
            ) : prices.length === 0 ? (
              <div className="player-empty">还没设置价格，在下方新增</div>
            ) : (
              <div className="shop-price-groups">
                {Object.entries(grouped).map(([gameId, list]) => (
                  <div key={gameId} className="shop-price-group">
                    <div className="shop-price-group-title">
                      🎮 {gameName(Number(gameId))}
                    </div>
                    <div className="shop-price-list">
                      {list.map((p) => (
                        <div key={p.id} className="shop-price-item">
                          <div className="shop-price-info">
                            <span className="shop-badge">{p.tier}</span>
                            <span className="shop-price-rank">
                              {p.boss_rank || '通用'}
                            </span>
                          </div>

                          <div className="shop-price-right">
                            {editingId === p.id ? (
                              <>
                                <span style={{ color: 'rgba(255,255,255,0.5)' }}>¥</span>
                                <input
                                  className="shop-price-input"
                                  type="number"
                                  step="0.5"
                                  min="9.9"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  autoFocus
                                />
                                <button
                                  className="shop-btn-sm"
                                  onClick={() => handleSaveEdit(p.id)}
                                  disabled={working}
                                >
                                  保存
                                </button>
                                <button
                                  className="shop-btn-sm"
                                  onClick={() => setEditingId(null)}
                                >
                                  取消
                                </button>
                              </>
                            ) : (
                              <>
                                <span className="shop-price-value">
                                  ¥{Number(p.price_per_hour).toFixed(2)}/时
                                </span>
                                <button
                                  className="shop-btn-sm"
                                  onClick={() => {
                                    setEditingId(p.id);
                                    setEditValue(String(p.price_per_hour));
                                  }}
                                >
                                  修改
                                </button>
                                <button
                                  className="shop-btn-sm shop-btn-danger"
                                  onClick={() => handleDelete(p.id)}
                                  disabled={working}
                                >
                                  删除
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 新增 */}
          <div className="player-section">
            <h2 className="player-section-title">新增价格</h2>

            <div style={{ marginBottom: '1rem' }}>
              <div
                className="shop-price-group-title"
                style={{ marginBottom: '0.6rem' }}
              >
                1. 选择游戏
              </div>
              <div className="member-radio-row">
                {games.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    className={'member-radio' + (newGameId === g.id ? ' active' : '')}
                    onClick={() => setNewGameId(g.id)}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <div
                className="shop-price-group-title"
                style={{ marginBottom: '0.6rem' }}
              >
                2. 选择档位
              </div>
              <div className="member-radio-row">
                {TIERS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={'member-radio' + (newTier === t ? ' active' : '')}
                    onClick={() => setNewTier(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <div
                className="shop-price-group-title"
                style={{ marginBottom: '0.6rem' }}
              >
                3. 选择老板段位{newGameId ? `（${gameName(newGameId)}）` : ''}
              </div>
              {!newGameId ? (
                <div
                  className="player-empty"
                  style={{ padding: '0.8rem', fontSize: '0.85rem' }}
                >
                  请先选择游戏
                </div>
              ) : availableRanks.length === 0 ? (
                <div
                  className="player-empty"
                  style={{ padding: '0.8rem', fontSize: '0.85rem' }}
                >
                  该游戏没有段位列表
                </div>
              ) : (
                <div className="member-radio-row">
                  {availableRanks.map((r) => (
                    <button
                      key={r}
                      type="button"
                      className={'member-radio' + (newBossRank === r ? ' active' : '')}
                      onClick={() => setNewBossRank(r)}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div style={{ marginBottom: '1.2rem' }}>
              <div
                className="shop-price-group-title"
                style={{ marginBottom: '0.6rem' }}
              >
                4. 每小时价格
              </div>
              <input
                className="player-input"
                type="number"
                step="0.5"
                min="9.9"
                placeholder="时薪（最低 9.9）"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                style={{ maxWidth: '16rem' }}
              />
            </div>

            {error && (
              <div
                style={{
                  color: '#f87171',
                  fontSize: '0.85rem',
                  marginBottom: '0.8rem',
                }}
              >
                {error}
              </div>
            )}

            <button
              className="player-btn-primary"
              onClick={handleAdd}
              disabled={working}
            >
              {working ? '保存中…' : '确认新增'}
            </button>

            <div className="player-note" style={{ marginTop: '1rem' }}>
              💡 散陪只有「娱乐」「技术」两个档位。
              <br />
              平台抽成 2%，你拿 98%。
            </div>
          </div>
        </>
      )}
    </>
  );
}