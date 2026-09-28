'use client';

import { useState } from 'react';
import { MOCK_SHOP_PLAYERS, type ShopPlayer } from '@/lib/mock';

const CERTIFY_TIERS = ['娱乐', '技术', '金牌', '魔王', '明星'] as const;

export default function ShopCertificationsPage() {
  const [list, setList] = useState<ShopPlayer[]>(MOCK_SHOP_PLAYERS);
  const [editingId, setEditingId] = useState<number | null>(null);

  function setTier(id: number, tier: ShopPlayer['tier']) {
    setList(list.map((p) => (p.id === id ? { ...p, tier } : p)));
    setEditingId(null);
  }

  function cancelCertify(id: number) {
    if (!confirm('取消认证后该陪玩将降回「技术」档位，确定？')) return;
    setList(
      list.map((p) =>
        p.id === id ? { ...p, tier: p.tier === '娱乐' ? '娱乐' : '技术' } : p
      )
    );
  }

  return (
    <>
      <div className="shop-header">
        <h1 className="shop-title">限定认证</h1>
        <p className="shop-subtitle">授予或取消金牌 / 魔王 / 明星档位</p>
      </div>

      <div className="shop-note" style={{ marginBottom: '1.5rem' }}>
        💡 平台不做认证，金牌/魔王/明星只能由店铺授予。
        <br />
        一个陪玩可以在多家店铺分别认证，展示时显示「店铺名.档位」。
      </div>

      <div className="shop-table-wrap">
        <table className="shop-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>陪玩名</th>
              <th>当前档位</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {list.map((p) => {
              const isCertified =
                p.tier === '金牌' || p.tier === '魔王' || p.tier === '明星';

              return (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td style={{ fontWeight: 700 }}>{p.playerName}</td>
                  <td>
                    <span
                      className={
                        'shop-badge ' +
                        (isCertified ? 'shop-badge-orange' : '')
                      }
                    >
                      {p.tier}
                    </span>
                  </td>
                  <td>
                    {editingId === p.id ? (
                      <div className="shop-certify-row">
                        {CERTIFY_TIERS.map((t) => (
                          <button
                            key={t}
                            className="shop-btn-sm"
                            onClick={() => setTier(p.id, t)}
                          >
                            {t}
                          </button>
                        ))}
                        <button
                          className="shop-btn-sm"
                          onClick={() => setEditingId(null)}
                        >
                          取消
                        </button>
                      </div>
                    ) : (
                      <div className="shop-certify-row">
                        <button
                          className="shop-btn-sm"
                          onClick={() => setEditingId(p.id)}
                        >
                          设置档位
                        </button>
                        {isCertified && (
                          <button
                            className="shop-btn-sm shop-btn-danger"
                            onClick={() => cancelCertify(p.id)}
                          >
                            取消认证
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}