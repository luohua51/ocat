'use client';

import { useEffect, useState } from 'react';
import { fetchUsers, createUser, resetPasswordByAdmin, deleteUser, type User } from '@/lib/auth';

export default function ShopPlayersPage() {
  const [list, setList] = useState<User[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showCreate, setShowCreate] = useState(false);

  const [newName, setNewName] = useState('');
  const [newAccount, setNewAccount] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // 店长的 fetchUsers 在后端会自动按 shopId 过滤
    fetchUsers({ role: 'player' }).then(setList);
  }, [refreshKey]);

  async function handleCreate() {
    setError('');
    if (!newName.trim()) return setError('请输入陪玩昵称');
    if (!newAccount.trim()) return setError('请输入登录账号');

    setSubmitting(true);
    const r = await createUser({
      username: newAccount.trim(),
      nickname: newName.trim(),
      role: 'player',
    });
    setSubmitting(false);

    if (!r.ok) return setError(r.error || '创建失败');

    alert(`创建成功！\n账号：${newAccount}\n初始密码：123456`);
    setNewName('');
    setNewAccount('');
    setShowCreate(false);
    setRefreshKey((k) => k + 1);
  }

  async function handleReset(u: User) {
    if (!confirm(`重置「${u.nickname}」密码为 123456？`)) return;
    const r = await resetPasswordByAdmin(u.id);
    alert(r.ok ? '已重置' : r.error || '失败');
    setRefreshKey((k) => k + 1);
  }

  async function handleDelete(u: User) {
    if (!confirm(`将「${u.nickname}」移出本店？`)) return;
    const r = await deleteUser(u.id);
    alert(r.ok ? '已移出' : r.error || '失败');
    setRefreshKey((k) => k + 1);
  }

  return (
    <>
      <div className="shop-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="shop-title">陪玩管理</h1>
            <p className="shop-subtitle">共 {list.length} 位本店陪玩</p>
          </div>
          <button className="shop-btn-primary" onClick={() => setShowCreate(!showCreate)}>
            {showCreate ? '取消' : '➕ 新增陪玩'}
          </button>
        </div>
      </div>

      {showCreate && (
        <div className="admin-create-card">
          <h3 className="admin-create-title">新增本店陪玩</h3>
          <div className="admin-form-grid">
            <div className="admin-form-field">
              <label>陪玩昵称</label>
              <input type="text" placeholder="如：鸽子" value={newName} onChange={(e) => setNewName(e.target.value)} />
            </div>
            <div className="admin-form-field">
              <label>登录账号</label>
              <input type="text" placeholder="如：cmmgezi" value={newAccount} onChange={(e) => setNewAccount(e.target.value)} />
            </div>
          </div>
          {error && <div className="admin-form-error">{error}</div>}
          <div className="admin-form-actions">
            <button className="shop-btn-primary" onClick={handleCreate} disabled={submitting}>
              {submitting ? '创建中…' : '确认创建'}
            </button>
          </div>
          <div className="admin-note" style={{ marginTop: '0.8rem' }}>
            初始密码 <b>123456</b>，首次登录必须修改。
          </div>
        </div>
      )}

      <div className="shop-table-wrap">
        <table className="shop-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>账号</th>
              <th>昵称</th>
              <th>首次改密</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.4)' }}>
                  暂无陪玩
                </td>
              </tr>
            ) : (
              list.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td style={{ fontWeight: 700 }}>{u.username}</td>
                  <td>{u.nickname}</td>
                  <td>
                    {u.mustChangePassword ? (
                      <span className="shop-badge shop-badge-orange">待修改</span>
                    ) : (
                      <span className="shop-badge shop-badge-green">已修改</span>
                    )}
                  </td>
                  <td>
                    <button className="shop-btn-sm" onClick={() => handleReset(u)}>重置密码</button>
                    <button className="shop-btn-sm shop-btn-danger" onClick={() => handleDelete(u)}>移出</button>
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