'use client';

import { useEffect, useState } from 'react';
import {
  getAllAccounts,
  resetPasswordByAdmin,
  deleteAccount,
  type User,
} from '@/lib/auth';

export default function AdminMembersPage() {
  const [list, setList] = useState<User[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setList(getAllAccounts().filter((u) => u.role === 'member'));
  }, [refreshKey]);

  function handleReset(u: User) {
    if (!confirm(`重置「${u.nickname}」密码为 123456？`)) return;
    resetPasswordByAdmin(u.id);
    alert('已重置为 123456，下次登录需修改');
    setRefreshKey((k) => k + 1);
  }

  function handleDelete(u: User) {
    if (!confirm(`删除会员「${u.nickname}」？不可恢复。`)) return;
    deleteAccount(u.id);
    setRefreshKey((k) => k + 1);
  }

  return (
    <>
      <div className="admin-header">
        <h1 className="admin-title">会员管理</h1>
        <p className="admin-subtitle">共 {list.length} 位会员</p>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>账号</th>
              <th>昵称</th>
              <th>角色</th>
              <th>注册时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.4)' }}>
                  暂无会员
                </td>
              </tr>
            ) : (
              list.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td style={{ fontWeight: 700 }}>{u.username}</td>
                  <td>{u.nickname}</td>
                  <td>
                    <span className="admin-badge admin-badge-orange">会员</span>
                  </td>
                  <td style={{ color: 'rgba(255,255,255,0.5)' }}>{u.createdAt}</td>
                  <td>
                    <button className="admin-btn-sm" onClick={() => handleReset(u)}>
                      重置密码
                    </button>
                    <button
                      className="admin-btn-sm admin-btn-danger"
                      onClick={() => handleDelete(u)}
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="admin-note" style={{ marginTop: '1.5rem' }}>
        💡 会员是自助注册的，管理员只能重置密码和删除。
        <br />
        会员充值由管理员在「全局流水」页面手动操作。
      </div>
    </>
  );
}