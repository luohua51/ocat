'use client';

import { useEffect, useState } from 'react';
import { fetchUsers, resetPasswordByAdmin, deleteUser, type User } from '@/lib/auth';

export default function AdminMembersPage() {
  const [list, setList] = useState<User[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [balances, setBalances] = useState<Record<number, number>>({});

  // 充值弹窗
  const [rechargeUser, setRechargeUser] = useState<User | null>(null);
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [rechargeNote, setRechargeNote] = useState('');
  const [recharging, setRecharging] = useState(false);
  const [rechargeError, setRechargeError] = useState('');

  useEffect(() => {
    fetchUsers({ role: 'member' }).then(setList);
  }, [refreshKey]);

  // 拉每个会员的余额
  useEffect(() => {
    async function loadBalances() {
      const map: Record<number, number> = {};
      for (const u of list) {
        try {
          const res = await fetch(`/api/admin/user-balance?userId=${u.id}`, {
            cache: 'no-store',
          });
          const data = await res.json();
          if (data.ok) map[u.id] = data.balance;
        } catch {
          map[u.id] = 0;
        }
      }
      setBalances(map);
    }
    if (list.length > 0) loadBalances();
  }, [list]);

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

  function openRecharge(u: User) {
    setRechargeUser(u);
    setRechargeAmount('');
    setRechargeNote('人工充值');
    setRechargeError('');
  }

  async function handleRecharge() {
    if (!rechargeUser) return;
    const amount = parseFloat(rechargeAmount);
    if (!amount || amount <= 0) {
      setRechargeError('请输入有效金额');
      return;
    }

    setRecharging(true);
    const res = await fetch('/api/admin/recharge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: rechargeUser.id,
        amount,
        description: rechargeNote || '人工充值',
      }),
    });
    const data = await res.json();
    setRecharging(false);

    if (!data.ok) {
      setRechargeError(data.error || '充值失败');
      return;
    }

    alert(`充值成功！新余额：¥${data.newBalance.toFixed(2)}`);
    setRechargeUser(null);
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
              <th>余额</th>
              <th>角色</th>
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
                  <td style={{ color: '#34d399', fontWeight: 700 }}>
                    ¥{(balances[u.id] ?? 0).toFixed(2)}
                  </td>
                  <td>
                    <span className="admin-badge admin-badge-orange">会员</span>
                  </td>
                  <td>
                    <button
                      className="admin-btn-sm"
                      style={{ background: 'rgba(52, 211, 153, 0.15)', borderColor: 'rgba(52, 211, 153, 0.4)', color: '#34d399' }}
                      onClick={() => openRecharge(u)}
                    >
                      💰 充值
                    </button>
                    <button className="admin-btn-sm" onClick={() => handleReset(u)}>
                      重置密码
                    </button>
                    <button className="admin-btn-sm admin-btn-danger" onClick={() => handleDelete(u)}>
                      删除
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 充值弹窗 */}
      {rechargeUser && (
        <div className="admin-modal-overlay" onClick={() => setRechargeUser(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="admin-modal-title">💰 给 {rechargeUser.nickname} 充值</h3>

            <div className="admin-form-field">
              <label>账号</label>
              <input type="text" value={rechargeUser.username} disabled />
            </div>

            <div className="admin-form-field">
              <label>当前余额</label>
              <input
                type="text"
                value={'¥' + (balances[rechargeUser.id] ?? 0).toFixed(2)}
                disabled
              />
            </div>

            <div className="admin-form-field">
              <label>充值金额</label>
              <input
                type="number"
                step="1"
                min="1"
                placeholder="请输入充值金额"
                value={rechargeAmount}
                onChange={(e) => setRechargeAmount(e.target.value)}
                autoFocus
              />
            </div>

            <div className="admin-form-field">
              <label>备注</label>
              <input
                type="text"
                placeholder="如：微信转账"
                value={rechargeNote}
                onChange={(e) => setRechargeNote(e.target.value)}
              />
            </div>

            {rechargeError && <div className="admin-form-error">{rechargeError}</div>}

            <div className="admin-modal-actions">
              <button className="admin-btn-ghost" onClick={() => setRechargeUser(null)}>
                取消
              </button>
              <button
                className="admin-btn-primary"
                onClick={handleRecharge}
                disabled={recharging}
              >
                {recharging ? '充值中…' : '确认充值'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}