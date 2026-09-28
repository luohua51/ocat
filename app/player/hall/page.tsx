'use client';

import { useState } from 'react';
import { MOCK_ORDERS, GAMES } from '@/lib/mock';

export default function PlayerHallPage() {
  const [game, setGame] = useState('全部');
  const [acceptedIds, setAcceptedIds] = useState<number[]>([]);

  // 陪玩视角：抢单大厅展示所有 pooling / paid 状态的订单
  const allAvailable = MOCK_ORDERS.filter(
    (o) => o.status === 'pooling' || o.status === 'paid'
  );

  const list = allAvailable.filter((o) => {
    if (game !== '全部' && o.game !== game) return false;
    return true;
  });

  function handleAccept(id: number) {
    if (acceptedIds.includes(id)) return;
    if (!confirm('确认接单？')) return;
    setAcceptedIds([...acceptedIds, id]);
    alert('接单成功（demo）');
  }

  return (
    <>
      <div className="player-header">
        <h1 className="player-title">🔥 抢单大厅</h1>
        <p className="player-subtitle">共 {list.length} 条订单等你接</p>
      </div>

      <div className="player-filter-group">
        <div className="player-filter-label">游戏</div>
        <div className="player-filter-chips">
          {['全部', ...GAMES].map((g) => (
            <button
              key={g}
              className={'player-filter-chip' + (game === g ? ' active' : '')}
              onClick={() => setGame(g)}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <div className="player-empty">当前没有可接的订单</div>
      ) : (
        <div className="player-hall-list">
          {list.map((o) => {
            const accepted = acceptedIds.includes(o.id);
            return (
              <div key={o.id} className="player-hall-item">
                <div className="player-hall-top">
                  <div className="player-hall-order">
                    <span className="player-hall-game">{o.game}</span>
                    <span className="player-hall-tier">{o.tier}</span>
                  </div>
                  <div className="player-hall-amount">
                    ¥{o.totalAmount.toFixed(2)}
                  </div>
                </div>

                <div className="player-hall-info">
                  <div>老板：{o.memberName}</div>
                  <div>段位：{o.bossRank}</div>
                  <div>时长：{o.hours} 小时</div>
                  <div>身份：{o.shopName || '散陪'}</div>
                </div>

                <div className="player-hall-actions">
                  <button className="player-btn-ghost">💬 聊聊</button>
                  <button
                    className={'player-btn-primary' + (accepted ? ' disabled' : '')}
                    onClick={() => handleAccept(o.id)}
                    disabled={accepted}
                  >
                    {accepted ? '✅ 已接' : '接单'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}