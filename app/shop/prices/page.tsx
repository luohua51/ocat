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

  const selectedGame = games.find((g) => g.id === newGameId);
  const availableRanks: string[] = (selectedGame?.ranks || []) as string[];
  const needsRank = newTier === '娱乐' || newTier === '技术';

  // 游戏或档位变了，清空段位
  useEffect(() => {
    setNewBossRank('');
  }, [newGameId, newTier]);

  async function handleAdd() {
    setError('');
    if (!newGameId) return setError('请选择游戏');
    const priceNum = parseFloat(newPrice);
    if (!priceNum || priceNum <= 0) return setError('请输入有效价格');
    if (needsRank && !newBossRank) {
      return setError('请选择老板段位');
    }

    setWorking(true);
    const r = await upsertShopPrice({
      gameId: newGameId,
      tier: newTier,
      bossRank: needsRank ? newBossRank : null, // 金/魔/星后端自动设"任意"
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

      {/* 新增价格 */}
      <div className="shop-section">
        <h2 className="shop-section-title">新增价格</h2>

        <div style={{ marginBottom: '1rem' }}>
          <div className="shop-price-group-title" style={{ marginBottom: '0.6rem' }}>
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
          <div className="shop-price-group-title" style={{ marginBottom: '0.6rem' }}>
            2. 选择档位
          </div>
          <div className="member-radio-row">
            {SHOP_TIERS.map((t) => (
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

        {/* 段位 */}
        {needsRank && (
          <div style={{ marginBottom: '1rem' }}>
            <div className="shop-price-group-title" style={{ marginBottom: '0.6rem' }}>
              3. 选择老板段位（{gameName(newGameId)}）
            </div>
            {!newGameId ? (
              <div className="shop-empty" style={{ padding: '0.8rem', fontSize: '0.85rem' }}>
                请先选择游戏
              </div>
            ) : availableRanks.length === 0 ? (
              <div className="shop-empty" style={{ padding: '0.8rem', fontSize: '0.85rem' }}>
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
        )}

        {!needsRank && newTier && (
          <div style={{ marginBottom: '1rem' }}>
            <div className="shop-price-group-title" style={{ marginBottom: '0.6rem' }}>
              3. 段位
            </div>
            <div
              style={{
                padding: '0.7rem 1rem',
                background: 'rgba(255,122,0,0.06)',
                border: '1px dashed rgba(255,122,0,0.3)',
                borderRadius: '0.6rem',
                color: '#FF7A00',
                fontSize: '0.88rem',
                fontWeight: 600,
              }}
            >
              任意段位（金牌/魔王/明星统一价）
            </div>
          </div>
        )}

        <div style={{ marginBottom: '1.2rem' }}>
          <div className="shop-price-group-title" style={{ marginBottom: '0.6rem' }}>
            {needsRank ? '4' : '4'}. 每小时价格
          </div>
          <input
            className="shop-input"
            type="number"
            step="1"
            placeholder="时薪（元/小时）"
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
          className="shop-btn-primary"
          onClick={handleAdd}
          disabled={working}
        >
          {working ? '保存中…' : '确认新增'}
        </button>

        <div className="shop-note" style={{ marginTop: '1rem' }}>
          💡 说明：
          <br />
          · 「娱乐」「技术」需要按老板段位分别定价（如娱乐·蚀月、娱乐·修罗）
          <br />
          · 「金牌」「魔王」「明星」是店铺授予的认证档位，任意段位一口价
        </div>
      </div>
    </>
  );
}