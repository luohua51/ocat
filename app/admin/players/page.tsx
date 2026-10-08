'use client';

import { useEffect, useState } from 'react';
import { fetchUsers, createUser, resetPasswordByAdmin, deleteUser, type User } from '@/lib/auth';
import { MOCK_SHOPS } from '@/lib/mock';

export default function AdminPlayersPage() {
  const [list, setList] = useState<User[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [newName, setNewName] = useState('');
  const [newAccount, setNewAccount] = useState('');
  const [newShopId, setNewShopId] = useState<string>('');
  const [error, setError] = useState('');

  useEffect(() => {
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
      shopId: newShopId ? Number(newShopId) : undefined,
    });
    setSubmitting(false);

    if (!r.ok) return setError(r.error || '创建失败');

    alert(`创建成功！\n账号：${newAccount}\n初始密码：123456\n首次登录需修改`);
    setNewName('');
    setNewAccount('');
    setNewShopId('');
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
    if (
      !confirm(
        `⚠️ 确定从平台彻底删除「${u.nickname}」？\n\n` +
          `此操作会删除：\n` +
          `· 账号\n` +
          `· 陪玩资料\n` +
          `· 头像 / 音频\n` +
          `· 钱包和流水\n` +
          `· 聊天的会话\n\n` +
          `订单历史会保留，但不再关联该陪玩。\n\n` +
          `删除后不可恢复！`
      )
    ) {
      return;
    }

    setSubmitting(true);
    try {
      const r = await deleteUser(u.id);
      setSubmitting(false);

      if (!r.ok) {
        alert(r.error || '删除失败');
        return;
      }

      alert('已从平台彻底删除');
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      setSubmitting(false);
      alert(err?.message || '网络错误');
    }
  }

  return (
    <>
      <div className="admin-header">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <div>
            <h1 className="admin-title">陪玩管理</h1>
            <p className="admin-subtitle">共 {list.length} 位陪玩</p>
          </div>
          <button
            className="admin-btn-primary"
            onClick={() => setShowCreate(!showCreate)}
          >
            {showCreate ? '取消' : '➕ 新增陪玩'}
          </button>
        </div>
      </div>

      {showCreate && (
        <div className="admin-create-card">
          <h3 className="admin-create-title">新增陪玩账号</h3>
          <div className="admin-form-grid">
            <div className="admin-form-field">
              <label>陪玩昵称</label>
              <input
                type="text"
                placeholder="如：鸽子"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="admin-form-field">
              <label>登录账号</label>
              <input
                type="text"
                placeholder="如：gezi"
                value={newAccount}
                onChange={(e) => setNewAccount(e.target.value)}
              />
            </div>
            <div className="admin-form-field">
              <label>所属店铺（可选）</label>
              <select
                value={newShopId}
                onChange={(e) => setNewShopId(e.target.value)}
              >
                <option value="">散陪（不归属任何店铺）</option>
                {MOCK_SHOPS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {error && <div className="admin-form-error">{error}</div>}
          <div className="admin-form-actions">
            <button
              className="admin-btn-primary"
              onClick={handleCreate}
              disabled={submitting}
            >
              {submitting ? '创建中…' : '确认创建'}
            </button>
          </div>
          <div className="admin-note" style={{ marginTop: '0.8rem' }}>
            初始密码统一为 <b>123456</b>，首次登录必须修改。
          </div>
        </div>
      )}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>账号</th>
              <th>昵称</th>
              <th>归属店铺</th>
              <th>首次改密</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    textAlign: 'center',
                    padding: '2rem',
                    color: 'rgba(255,255,255,0.4)',
                  }}
                >
                  暂无陪玩
                </td>
              </tr>
            ) : (
              list.map((u) => {
                const shop = MOCK_SHOPS.find((s) => s.id === u.shopId);
                return (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td style={{ fontWeight: 700 }}>{u.username}</td>
                    <td>{u.nickname}</td>
                    <td>
                      {shop ? (
                        <span className="admin-badge admin-badge-orange">
                          {shop.name}
                        </span>
                      ) : (
                        <span className="admin-badge">散陪</span>
                      )}
                    </td>
                    <td>
                      {u.mustChangePassword ? (
                        <span className="admin-badge admin-badge-red">
                          待修改
                        </span>
                      ) : (
                        <span className="admin-badge admin-badge-green">
                          已修改
                        </span>
                      )}
                    </td>
                    <td>
                      <button
                        className="admin-btn-sm"
                        onClick={() => handleReset(u)}
                      >
                        重置密码
                      </button>
                      <button
                        className="admin-btn-sm admin-btn-danger"
                        onClick={() => handleDelete(u)}
                        disabled={submitting}
                      >
                        彻底删除
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="admin-note" style={{ marginTop: '1.5rem' }}>
        💡 说明：
        <br />
        · 「彻底删除」会删除账号 + 陪玩资料 + 头像音频 + 钱包流水 + 聊天会话
        <br />
        · 订单历史会保留，但不再关联该陪玩
        <br />
        · 如需仅"移出店铺"保留账号，请到店铺端操作
      </div>
    </>
  );
}