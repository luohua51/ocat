'use client';

import { useEffect, useState } from 'react';
import {
  fetchShopPrices,
  upsertShopPrice,
  updateShopPrice,
  deleteShopPrice,
  type ShopPrice,
} from '@/lib/shop';
import { fetchGames, type Game } from '@/lib/game';

const SHOP_TIERS = ['娱乐', '技术', '金牌', '魔王', '明星'];

export default function ShopPricesPage() {
  const [prices, setPrices] = useState<ShopPrice[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [working, setWorking] = useState(false);

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
    async function load() {
      const [p, g] = await Promise.all([fetchShopPrices(), fetchGames()]);
      setPrices(p);
      setGames(g);
      setLoading(false);
    }
    load();
  }, [refreshKey]);

  function gameName(id: number) {
    return games.find((g) => g.id === id)?.name || '未知';
  }

  // 娱乐/技术需要段位，金/魔/星不需要
  const needsRank = newTier === '娱乐' || newTier === '技术';

  async function handleAdd() {
    setError('');
    if (!newGameId) return setError('请选择游戏');
    const priceNum = parseFloat(newPrice);
    if (!priceNum || priceNum <= 0) return setError('请输入有效价格');
    if (needsRank && !newBossRank.trim()) {
      return setError('娱乐/技术需要填老板段位');
    }

    setWorking(true);
    const r = await upsertShopPrice({
      gameId: newGameId,
      tier: newTier,
      bossRank: needsRank ? newBossRank.trim() : null,
      pricePerHour: priceNum,
    });
    setWorking(false);

    if (!r.ok) return setError(r.error || '保存失败');

    setNewPrice('');
    setNewBossRank('');
    setNewGameId(0);
    setRefreshKey((k) => k + 1);
  }

  async function handleSaveEdit(id: number) {
    const priceNum = parseFloat(editValue);
    if (!priceNum || priceNum <= 0) return alert('请输入有效价格');

    setWorking(true);
    const r = await updateShopPrice(id, priceNum);
    setWorking(false);

    if (!r.ok) return alert(r.error || '修改失败');
    setEditingId(null);
    setRefreshKey((k) => k + 1);
  }

  async function handleDelete(id: number) {
    if (!confirm('确定删除这条价格？')) return;
    const r = await deleteShopPrice(id);
    if (!r.ok) return alert(r.error || '删除失败');
    setRefreshKey((k) => k + 1);
  }

  // 按游戏分组
  const grouped: Record<number, ShopPrice[]> = {};
  prices.forEach((p) => {
    if (!grouped[p.game_id]) grouped[p.game_id] = [];
    grouped[p.game_id].push(p);
  });

  return (
    <>
      <div className="shop-header">
        <h1 className="shop-title">价格管理</h1>
        <p className="shop-subtitle">
          {loading ? '加载中…' : `共 ${prices.length} 条价格`}
        </p>
      </div>

      <div className="shop-section">
        <h2 className="shop-section-title">当前价格表</h2>
        {loading ? (
          <div className="shop-empty">加载中…</div>
        ) : prices.length === 0 ? (
          <div className="shop-empty">还没有设置价格，在下方新增</div>
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
                              step="1"
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

      <div className="shop-section">
        <h2 className="shop-section-title">新增价格</h2>
        <div className="shop-add-form">
          <select
            className="shop-select"
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
            className="shop-select"
            value={newTier}
            onChange={(e) => setNewTier(e.target.value)}
          >
            {SHOP_TIERS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <input
            className="shop-input"
            type="text"
            placeholder={needsRank ? '老板段位（如：修罗）' : '无需填段位'}
            value={needsRank ? newBossRank : '任意'}
            onChange={(e) => setNewBossRank(e.target.value)}
            disabled={!needsRank}
          />

          <input
            className="shop-input"
            type="number"
            step="1"
            placeholder="时薪"
            value={newPrice}
            onChange={(e) => setNewPrice(e.target.value)}
          />

          <button
            className="shop-btn-primary"
            onClick={handleAdd}
            disabled={working}
          >
            {working ? '保存中…' : '新增'}
          </button>
        </div>

        {error && (
          <div style={{ color: '#f87171', fontSize: '0.85rem', marginTop: '0.6rem' }}>
            {error}
          </div>
        )}

        <div className="shop-note" style={{ marginTop: '1rem' }}>
          💡 说明：<br />
          · 「娱乐」「技术」需要按老板段位分别定价<br />
          · 「金牌」「魔王」「明星」是店铺授予的认证档位，一口价
        </div>
      </div>
    </>
  );
}