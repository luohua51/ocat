'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  fetchMyPrices,
  upsertPrice,
  deletePrice,
  type PlayerPrice,
} from '@/lib/order';

export default function PlayerPricesPage() {
  const [prices, setPrices] = useState<PlayerPrice[]>([]);
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [saving, setSaving] = useState(false);

  const [newGameId, setNewGameId] = useState<number>(0);
  const [newTier, setNewTier] = useState<string>('娱乐');
  const [newPrice, setNewPrice] = useState<string>('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      if (!supabase) return;
      const [p, g] = await Promise.all([
        fetchMyPrices(),
        supabase.from('games').select('id, name').eq('status', 'active'),
      ]);
      setPrices(p);
      setGames(g.data || []);
      setLoading(false);
    }
    load();
  }, [refreshKey]);

  async function handleAdd() {
    setError('');
    if (!newGameId) return setError('请选择游戏');
    const priceNum = parseFloat(newPrice);
    if (!priceNum || priceNum < 9.9) return setError('最低 9.9 元/时');

    setSaving(true);
    const r = await upsertPrice({
      gameId: newGameId,
      tier: newTier,
      pricePerHour: priceNum,
    });
    setSaving(false);

    if (!r.ok) return setError(r.error || '保存失败');

    setNewPrice('');
    setNewGameId(0);
    setRefreshKey((k) => k + 1);
  }

  async function handleDelete(id: number) {
    if (!confirm('确定删除这条价格？')) return;
    const r = await deletePrice(id);
    if (!r.ok) return alert(r.error || '删除失败');
    setRefreshKey((k) => k + 1);
  }

  function gameName(id: number) {
    return games.find((g) => g.id === id)?.name || '未知游戏';
  }

  return (
    <>
      <div className="player-header">
        <h1 className="player-title">散陪定价</h1>
        <p className="player-subtitle">设了价格才能接抢单池的订单</p>
      </div>

      <div className="player-section">
        <h2 className="player-section-title">我的散陪价</h2>
        {loading ? (
          <div className="player-empty">加载中…</div>
        ) : prices.length === 0 ? (
          <div className="player-empty">还没设置价格，在下方新增</div>
        ) : (
          <div className="player-price-list">
            {prices.map((p) => (
              <div key={p.id} className="player-price-item">
                <div className="player-price-info">
                  <div className="player-price-game">{gameName(p.game_id)}</div>
                  <div className="player-price-tier">{p.tier}</div>
                </div>
                <div className="player-price-right">
                  <span className="player-price-value">
                    ¥{Number(p.price_per_hour).toFixed(2)}/时
                  </span>
                  <button
                    className="player-btn-sm player-btn-danger"
                    onClick={() => handleDelete(p.id)}
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>

          <select
            className="player-select"
            value={newTier}
            onChange={(e) => setNewTier(e.target.value)}
          >
            <option value="娱乐">娱乐</option>
            <option value="技术">技术</option>
          </select>

          <input
            className="player-input"
            type="number"
            step="0.5"
            placeholder="时薪（最低 9.9）"
            value={newPrice}
            onChange={(e) => setNewPrice(e.target.value)}
          />

          <button
            className="player-btn-primary"
            onClick={handleAdd}
            disabled={saving}
          >
            {saving ? '保存中…' : '新增'}
          </button>
        </div>

        {error && (
          <div style={{ color: '#f87171', fontSize: '0.85rem', marginTop: '0.6rem' }}>
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