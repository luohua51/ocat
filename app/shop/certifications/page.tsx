'use client';

import { useEffect, useState } from 'react';

type PlayerRow = {
  user_id: number;
  username: string;
  nickname: string;
  player_id: number | null;
  tier: string | null;
};

const TIERS = ['娱乐', '技术', '金牌', '魔王', '明星'];

export default function ShopCertificationsPage() {
  const [list, setList] = useState<PlayerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/shops/certifications', { cache: 'no-store' });
      const data = await res.json();
      setList(data.ok ? data.players : []);
      setLoading(false);
    }
    load();
  }, [refreshKey]);

  async function setTier(playerUserId: number, tier: string | null) {
    setWorking(true);
    const res = await fetch('/api/shops/certifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerUserId, tier }),
    });
    const data = await res.json();
    setWorking(false);

    if (!data.ok) return alert(data.error || '操作失败');
    alert(tier ? `已授予「${tier}」` : '已取消认证');
    setEditingUserId(null);
    setRefreshKey((k) => k + 1);
  }

  return (
    <>
      <div className="shop-header">
        <h1 className="shop-title">限定认证</h1>
        <p className="shop-subtitle">
          {loading ? '加载中…' : `共 ${list.length} 位本店陪玩`}
        </p>
      </div>

      <div className="shop-note" style={{ marginBottom: '1.5rem' }}>
        💡 平台不做认证，金牌 / 魔王 / 明星只能由店铺授予。
        <br />
        授予后会同步到陪玩资料，展示为「店铺名 · 档位」。
      </div>

      <div className="shop-table-wrap">
        <table className="shop-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>昵称</th>
              <th>当前档位</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.4)' }}>
                  加载中…
                </td>
              </tr>
            ) : list.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.4)' }}>
                  本店暂无陪玩
                </td>
              </tr>
            ) : (
              list.map((p) => {
                const isCertified =
                  p.tier === '金牌' || p.tier === '魔王' || p.tier === '明星';

                return (
                  <tr key={p.user_id}>
                    <td>{p.user_id}</td>
                    <td style={{ fontWeight: 700 }}>{p.nickname}</td>
                    <td>
                      {p.tier ? (
                        <span className={'shop-badge ' + (isCertified ? 'shop-badge-orange' : '')}>
                          {p.tier}
                        </span>
                      ) : (
                        <span className="shop-badge shop-badge-gray">未认证</span>
                      )}
                    </td>
                    <td>
                      {editingUserId === p.user_id ? (
                        <div className="shop-certify-row">
                          {TIERS.map((t) => (
                            <button
                              key={t}
                              className="shop-btn-sm"
                              onClick={() => setTier(p.user_id, t)}
                              disabled={working}
                            >
                              {t}
                            </button>
                          ))}
                          <button
                            className="shop-btn-sm shop-btn-danger"
                            onClick={() => setTier(p.user_id, null)}
                            disabled={working}
                          >
                            取消认证
                          </button>
                          <button
                            className="shop-btn-sm"
                            onClick={() => setEditingUserId(null)}
                          >
                            返回
                          </button>
                        </div>
                      ) : (
                        <button
                          className="shop-btn-sm"
                          onClick={() => setEditingUserId(p.user_id)}
                        >
                          设置档位
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}