'use client';

import { useEffect, useState } from 'react';
import { MOCK_SHOPS } from '@/lib/mock';
import { fetchUsers, createUser, resetPasswordByAdmin, type User } from '@/lib/auth';

export default function AdminShopsPage() {
  const [shopAdmins, setShopAdmins] = useState<User[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showCreate, setShowCreate] = useState(false);

  const [newShopName, setNewShopName] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminAccount, setNewAdminAccount] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers({ role: 'shop_admin' }).then(setShopAdmins);
  }, [refreshKey]);

  async function handleCreate() {
    setError('');
    if (!newShopName.trim()) return setError('请输入店铺名');
    if (!newAdminName.trim()) return setError('请输入店长昵称');
    if (!newAdminAccount.trim()) return setError('请输入店长账号');

    const r = await createUser({
      username: newAdminAccount.trim(),
      nickname: newAdminName.trim(),
      role: 'shop_admin',
      shopId: MOCK_SHOPS.length + 1,
    });

    if (!r.ok) return setError(r.error || '创建失败');

    alert(`店铺创建成功！\n店铺名：${newShopName}\n店长账号：${newAdminAccount}\n初始密码：123456`);
    setNewShopName('');
    setNewAdminName('');
    setNewAdminAccount('');
    setShowCreate(false);
    setRefreshKey((k) => k + 1);
  }

  async function handleReset(u: User) {
    if (!confirm(`重置「${u.nickname}」密码为 123456？`)) return;
    const r = await resetPasswordByAdmin(u.id);
    alert(r.ok ? '已重置' : r.error || '失败');
    setRefreshKey((k) => k + 1);
  }

  return (
    <>
      <div className="admin-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="admin-title">店铺管理</h1>
            <p className="admin-subtitle">共 {MOCK_SHOPS.length} 家入驻店铺</p>
          </div>
          <button className="admin-btn-primary" onClick={() => setShowCreate(!showCreate)}>
            {showCreate ? '取消' : '➕ 新增店铺'}
          </button>
        </div>
      </div>

      {showCreate && (
        <div className="admin-create-card">
          <h3 className="admin-create-title">新增店铺</h3>
          <div className="admin-form-grid">
            <div className="admin-form-field">
              <label>店铺名称</label>
              <input type="text" placeholder="如：星辰电竞" value={newShopName} onChange={(e) => setNewShopName(e.target.value)} />
            </div>
            <div className="admin-form-field">
              <label>店长昵称</label>
              <input type="text" placeholder="如：星辰店长" value={newAdminName} onChange={(e) => setNewAdminName(e.target.value)} />
            </div>
            <div className="admin-form-field">
              <label>店长登录账号</label>
              <input type="text" placeholder="如：cmmxingchen" value={newAdminAccount} onChange={(e) => setNewAdminAccount(e.target.value)} />
            </div>
          </div>
          {error && <div className="admin-form-error">{error}</div>}
          <div className="admin-form-actions">
            <button className="admin-btn-primary" onClick={handleCreate}>确认创建</button>
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
              <th>店长账号</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_SHOPS.map((s) => {
              const admin = shopAdmins.find((a) => a.shopId === s.id);
              return (
                <tr key={s.id}>
                  <td>{s.id}</td>
                  <td style={{ fontWeight: 700 }}>{s.name}</td>
                  <td style={{ color: 'rgba(255,255,255,0.6)' }}>{s.description}</td>
                  <td>
                    {admin ? (
                      <>
                        <div style={{ fontWeight: 700 }}>{admin.nickname}</div>
                        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>{admin.username}</div>
                      </>
                    ) : (
                      <span style={{ color: 'rgba(255,255,255,0.4)' }}>未指定</span>
                    )}
                  </td>
                  <td><span className="admin-badge admin-badge-green">正常</span></td>
                  <td>
                    {admin && <button className="admin-btn-sm" onClick={() => handleReset(admin)}>重置店长密码</button>}
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