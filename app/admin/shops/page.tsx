'use client';

import { useEffect, useState } from 'react';

type Shop = {
  id: number;
  name: string;
  description: string | null;
  status: string;
  playerCount: number;
  admin: { id: number; username: string; nickname: string } | null;
};

export default function AdminShopsPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminAccount, setAdminAccount] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch('/api/shops', { cache: 'no-store' });

        // 关键：如果状态码不是 200，直接报错，不跳转
        if (!res.ok) {
          if (!cancelled) {
            setError(`加载失败：${res.status}`);
            setLoading(false);
          }
          return;
        }

        const data = await res.json();
        if (!cancelled) {
          setShops(data.ok ? data.shops : []);
          setLoading(false);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || '网络错误');
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  async function handleCreate() {
    setFormError('');
    if (!name.trim()) return setFormError('请输入店铺名');
    if (!adminName.trim()) return setFormError('请输入店长昵称');
    if (!adminAccount.trim()) return setFormError('请输入店长账号');

    setSubmitting(true);
    try {
      const res = await fetch('/api/shops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, adminName, adminAccount }),
      });
      const data = await res.json();
      setSubmitting(false);

      if (!data.ok) return setFormError(data.error || '创建失败');

      alert(`店铺创建成功！\n店长账号：${adminAccount}\n初始密码：123456`);
      setName('');
      setDescription('');
      setAdminName('');
      setAdminAccount('');
      setShowCreate(false);
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      setSubmitting(false);
      setFormError(err?.message || '网络错误');
    }
  }

  async function handleResetPwd(userId: number, nickname: string) {
    if (!confirm(`重置「${nickname}」密码为 123456？`)) return;
    try {
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      alert(data.ok ? '已重置' : data.error || '失败');
    } catch (err: any) {
      alert(err?.message || '网络错误');
    }
  }

  return (
    <>
      <div className="admin-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="admin-title">店铺管理</h1>
            <p className="admin-subtitle">
              {loading ? '加载中…' : `共 ${shops.length} 家入驻店铺`}
            </p>
          </div>
          <button className="admin-btn-primary" onClick={() => setShowCreate(!showCreate)}>
            {showCreate ? '取消' : '➕ 新增店铺'}
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            background: 'rgba(220,38,38,0.1)',
            border: '1px solid rgba(220,38,38,0.4)',
            color: '#f87171',
            padding: '1rem',
            borderRadius: '0.7rem',
            marginBottom: '1rem',
          }}
        >
          查询错误：{error}
        </div>
      )}

      {showCreate && (
        <div className="admin-create-card">
          <h3 className="admin-create-title">新增店铺</h3>
          <div className="admin-form-grid">
            <div className="admin-form-field">
              <label>店铺名称</label>
              <input type="text" placeholder="如：星辰电竞" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="admin-form-field">
              <label>店铺简介</label>
              <input type="text" placeholder="如：国服打手云集" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="admin-form-field">
              <label>店长昵称</label>
              <input type="text" placeholder="如：星辰店长" value={adminName} onChange={(e) => setAdminName(e.target.value)} />
            </div>
            <div className="admin-form-field">
              <label>店长登录账号</label>
              <input type="text" placeholder="如：cmmxingchen" value={adminAccount} onChange={(e) => setAdminAccount(e.target.value)} />
            </div>
          </div>
          {formError && <div className="admin-form-error">{formError}</div>}
          <div className="admin-form-actions">
            <button className="admin-btn-primary" onClick={handleCreate} disabled={submitting}>
              {submitting ? '创建中…' : '确认创建'}
            </button>
          </div>
        </div>
      )}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>店铺名</th>
              <th>简介</th>
              <th>陪玩数</th>
              <th>店长</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.4)' }}>
                  加载中…
                </td>
              </tr>
            ) : shops.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.4)' }}>
                  暂无店铺
                </td>
              </tr>
            ) : (
              shops.map((s) => (
                <tr key={s.id}>
                  <td>{s.id}</td>
                  <td style={{ fontWeight: 700 }}>{s.name}</td>
                  <td style={{ color: 'rgba(255,255,255,0.6)' }}>{s.description || '-'}</td>
                  <td>{s.playerCount}</td>
                  <td>
                    {s.admin ? (
                      <>
                        <div style={{ fontWeight: 700 }}>{s.admin.nickname}</div>
                        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                          {s.admin.username}
                        </div>
                      </>
                    ) : (
                      <span style={{ color: 'rgba(255,255,255,0.4)' }}>未指定</span>
                    )}
                  </td>
                  <td>
                    {s.status === 'active' ? (
                      <span className="admin-badge admin-badge-green">正常</span>
                    ) : (
                      <span className="admin-badge admin-badge-red">停用</span>
                    )}
                  </td>
                  <td>
                    {s.admin && (
                      <button
                        className="admin-btn-sm"
                        onClick={() => handleResetPwd(s.admin!.id, s.admin!.nickname)}
                      >
                        重置店长密码
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}