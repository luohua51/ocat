'use client';

import { useEffect, useState } from 'react';
import { fetchGames, type Game } from '@/lib/game';

// ============================================================
// 类型
// ============================================================
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

  // 新增表单
  const [newGameId, setNewGameId] = useState<number>(0);
  const [newTier, setNewTier] = useState<string>('娱乐');
  const [newPrice, setNewPrice] = useState('');
  const [error, setError] = useState('');

  // 编辑
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  // ============================================================
  // 加载数据
  // ============================================================
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [gamesData, pricesRes] = await Promise.all([
          fetchGames(),
          fetch('/api/player/prices', { cache: 'no-store' }).then((r) => r.json()),
        ]);

        if (cancelled) return;

        setGames(gamesData);

        if (pricesRes.ok) {
          setPrices(pricesRes.prices || []);
        } else {
          console.error('加载价格失败:', pricesRes.error);
        }
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

  // ============================================================
  // 工具
  // ============================================================
  function gameName(gameId: number) {
    const g = games.find((x) => x.id === gameId);
    return g?.name || `未知游戏(${gameId})`;
  }

  // ============================================================
  // 新增价格
  // ============================================================
  async function handleAdd() {
    setError('');
    if (!newGameId) return setError('请选择游戏');
    const priceNum = parseFloat(newPrice);
    if (!priceNum || priceNum < 9.9) {
      return setError('最低 9.9 元/时');
    }

    setWorking(true);
    try {
      const res = await fetch('/api/player/prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: newGameId,
          tier: newTier,
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
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      setWorking(false);
      setError(err?.message || '网络错误');
    }
  }

  // ============================================================
  // 修改价格
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
  // 删除价格
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

      console.log('delete result:', res.status, data);

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

  // ============================================================
  // 按游戏分组
  // ============================================================
  const grouped: Record<number, PlayerPrice[]> = {};
  prices.forEach((p) => {
    if (!grouped[p.game_id]) grouped[p.game_id] = [];
    grouped[p.game_id].push(p);
  });

  // ============================================================
  // 渲染
  // ============================================================
  return (
    <>
      <div className="player-header">
        <h1 className="player-title">散陪定价</h1>
        <p className="player-subtitle">设置价格后才能在抢单池接单</p>
      </div>

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

      {/* 新增价格 */}
      <div className="player-section">
        <h2 className="player-section-title">新增价格</h2>
        <div className="player-add-form">
          <select
            className="player-select"
            value={newGameId}
            onChange={(e) => setNewGameId(Number(e.target.value))}
          >
            <option value={0}>选择游戏</option>
            {games.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>

          <select
            className="player-select"
            value={newTier}
            onChange={(e) => setNewTier(e.target.value)}
          >
            {TIERS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <input
            className="player-input"
            type="number"
            step="0.5"
            min="9.9"
            placeholder="时薪（最低 9.9）"
            value={newPrice}
            onChange={(e) => setNewPrice(e.target.value)}
          />

          <button
            className="player-btn-primary"
            onClick={handleAdd}
            disabled={working}
          >
            {working ? '保存中…' : '新增'}
          </button>
        </div>

        {error && (
          <div
            style={{
              color: '#f87171',
              fontSize: '0.85rem',
              marginTop: '0.6rem',
            }}
          >
            {error}
          </div>
        )}

        <div className="player-note" style={{ marginTop: '1rem' }}>
          💡 散陪只有「娱乐」「技术」两个档位。
          <br />
          平台抽成 2%，你拿 98%。
        </div>
      </div>
    </>
  );
}