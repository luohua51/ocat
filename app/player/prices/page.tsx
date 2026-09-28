'use client';

import { useState } from 'react';
import { GAMES } from '@/lib/mock';
import { MOCK_PLAYER_PRICES, type PlayerPrice } from '@/lib/mock';

export default function PlayerPricesPage() {
  const [enabled, setEnabled] = useState(true);
  const [prices, setPrices] = useState<PlayerPrice[]>(MOCK_PLAYER_PRICES);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  function startEdit(p: PlayerPrice) {
    setEditingId(p.id);
    setEditValue(p.pricePerHour.toString());
  }

  function saveEdit(id: number) {
    const val = parseFloat(editValue);
    if (isNaN(val) || val < 9.9) {
      alert('散陪最低 9.9 元/时');
      return;
    }
    setPrices(prices.map((p) => (p.id === id ? { ...p, pricePerHour: val } : p)));
    setEditingId(null);
  }

  return (
    <>
      <div className="player-header">
        <h1 className="player-title">散陪定价</h1>
        <p className="player-subtitle">开启散陪后，可按自己的价格接单</p>
      </div>

      <div className="player-toggle-card">
        <div>
          <div className="player-toggle-title">开通散陪接单</div>
          <div className="player-toggle-desc">
            开启后，玩家可以在展示页直接预约你，按散陪价结算
          </div>
        </div>
        <button
          className={'player-toggle ' + (enabled ? 'on' : 'off')}
          onClick={() => setEnabled(!enabled)}
        >
          <span className="player-toggle-dot" />
        </button>
      </div>

      {enabled && (
        <>
          <div className="player-section">
            <h2 className="player-section-title">我的散陪价</h2>
            <div className="player-price-list">
              {prices.map((p) => (
                <div key={p.id} className="player-price-item">
                  <div className="player-price-info">
                    <div className="player-price-game">{p.game}</div>
                    <div className="player-price-tier">{p.tier}</div>
                  </div>

                  <div className="player-price-right">
                    {editingId === p.id ? (
                      <>
                        <span style={{ color: 'rgba(255,255,255,0.5)' }}>¥</span>
                        <input
                          className="player-price-input"
                          type="number"
                          step="0.5"
                          min="9.9"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          autoFocus
                        />
                        <button
                          className="player-btn-sm"
                          onClick={() => saveEdit(p.id)}
                        >
                          保存
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="player-price-value">
                          ¥{p.pricePerHour.toFixed(2)}/时
                        </span>
                        <button
                          className="player-btn-sm"
                          onClick={() => startEdit(p)}
                        >
                          修改
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="player-section">
            <h2 className="player-section-title">新增价格</h2>
            <div className="player-add-form">
              <select className="player-select">
                <option>选择游戏</option>
                {GAMES.map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
              <select className="player-select">
                <option>选择档位</option>
                <option>娱乐</option>
                <option>技术</option>
              </select>
              <input
                className="player-input"
                type="number"
                step="0.5"
                placeholder="时薪（最低 9.9）"
              />
              <button className="player-btn-primary" onClick={() => alert('新增价格（demo）')}>
                新增
              </button>
            </div>
          </div>

          <div className="player-note">
            💡 说明：散陪只有「娱乐」「技术」两个档位，金牌/魔王/明星需加入店铺后由店铺授予。
          </div>
        </>
      )}

      {!enabled && (
        <div className="player-empty">
          已关闭散陪接单，你只能通过店铺身份接单
        </div>
      )}
    </>
  );
}