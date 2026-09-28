'use client';

import { useState } from 'react';
import { GAMES, TIERS } from '@/lib/mock';
import { MOCK_SHOP_PRICES, type ShopPrice } from '@/lib/mock';

const SHOP_TIERS = ['娱乐', '技术', '金牌', '魔王', '明星'] as const;

export default function ShopPricesPage() {
  const [prices, setPrices] = useState<ShopPrice[]>(MOCK_SHOP_PRICES);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  function startEdit(p: ShopPrice) {
    setEditingId(p.id);
    setEditValue(p.pricePerHour.toString());
  }

  function saveEdit(id: number) {
    const val = parseFloat(editValue);
    if (isNaN(val) || val <= 0) {
      alert('请输入有效价格');
      return;
    }
    setPrices(prices.map((p) => (p.id === id ? { ...p, pricePerHour: val } : p)));
    setEditingId(null);
  }

  function handleDelete(id: number) {
    if (!confirm('确定删除这条价格？')) return;
    setPrices(prices.filter((p) => p.id !== id));
  }

  return (
    <>
      <div className="shop-header">
        <h1 className="shop-title">价格管理</h1>
        <p className="shop-subtitle">设置本店按游戏、档位、老板段位的价格</p>
      </div>

      <div className="shop-section">
        <h2 className="shop-section-title">当前价格表</h2>

        {prices.length === 0 ? (
          <div className="shop-empty">暂无价格，请在下方新增</div>
        ) : (
          <div className="shop-price-list">
            {prices.map((p) => (
              <div key={p.id} className="shop-price-item">
                <div className="shop-price-info">
                  <div className="shop-price-game">{p.game}</div>
                  <span className="shop-badge">{p.tier}</span>
                  <span className="shop-price-rank">{p.bossRank}</span>
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
                        onClick={() => saveEdit(p.id)}
                      >
                        保存
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="shop-price-value">
                        ¥{p.pricePerHour}/时
                      </span>
                      <button
                        className="shop-btn-sm"
                        onClick={() => startEdit(p)}
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
        )}
      </div>

      <div className="shop-section">
        <h2 className="shop-section-title">新增价格</h2>
        <div className="shop-add-form">
          <select className="shop-select">
            <option>选择游戏</option>
            {GAMES.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>

          <select className="shop-select">
            <option>选择档位</option>
            {SHOP_TIERS.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>

          <input
            className="shop-input"
            type="text"
            placeholder="老板段位（如：修罗 / 任意）"
          />

          <input
            className="shop-input"
            type="number"
            step="1"
            placeholder="时薪"
          />

          <button
            className="shop-btn-primary"
            onClick={() => alert('新增价格（demo）')}
          >
            新增
          </button>
        </div>

        <div className="shop-note" style={{ marginTop: '1rem' }}>
          💡 说明：<br />
          · 「娱乐」「技术」需要按老板段位分别定价<br />
          · 「金牌」「魔王」「明星」段位填「任意」，一口价
        </div>
      </div>
    </>
  );
}