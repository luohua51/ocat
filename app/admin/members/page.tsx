'use client';

import { useEffect, useState } from 'react';
import { fetchUsers, resetPasswordByAdmin, deleteUser, type User } from '@/lib/auth';

export default function AdminMembersPage() {
  const [list, setList] = useState<User[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchUsers({ role: 'member' }).then(setList);
  }, [refreshKey]);

  async function handleReset(u: User) {
    if (!confirm(`重置「${u.nickname}」密码为 123456？`)) return;
    const r = await resetPasswordByAdmin(u.id);
    alert(r.ok ? '已重置为 123456' : r.error || '重置失败');
    setRefreshKey((k) => k + 1);
  }

  async function handleDelete(u: User) {
    if (!confirm(`删除会员「${u.nickname}」？不可恢复。`)) return;
    const r = await deleteUser(u.id);
    alert(r.ok ? '已删除' : r.error || '删除失败');
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
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.4)' }}>
                  暂无会员
                </td>
              </tr>
            ) : (
              list.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td style={{ fontWeight: 700 }}>{u.username}</td>
                  <td>{u.nickname}</td>
                  <td><span className="admin-badge admin-badge-orange">会员</span></td>
                  <td>
                    <button className="admin-btn-sm" onClick={() => handleReset(u)}>重置密码</button>
                    <button className="admin-btn-sm admin-btn-danger" onClick={() => handleDelete(u)}>删除</button>
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