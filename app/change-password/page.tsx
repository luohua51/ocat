'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, changePassword, getRoleHome, logout } from '@/lib/auth';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPassword2, setNewPassword2] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.replace('/login');
    }
  }, [router]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const user = getCurrentUser();
    if (!user) {
      router.replace('/login');
      return;
    }

    if (newPassword.length < 6) {
      setError('新密码至少 6 位');
      return;
    }
    if (newPassword !== newPassword2) {
      setError('两次密码不一致');
      return;
    }

    setLoading(true);
    const result = changePassword(user.id, oldPassword, newPassword);

    if (!result.ok) {
      setError(result.error || '修改失败');
      setLoading(false);
      return;
    }

    // 改密成功，跳对应首页
    router.push(getRoleHome(user.role));
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-brand">🔒 修改初始密码</div>
        <div className="auth-sub">首次登录必须修改密码</div>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>当前密码（默认 123456）</label>
            <input
              type="password"
              placeholder="请输入当前密码"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label>新密码（至少 6 位）</label>
            <input
              type="password"
              placeholder="请输入新密码"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label>确认新密码</label>
            <input
              type="password"
              placeholder="请再次输入新密码"
              value={newPassword2}
              onChange={(e) => setNewPassword2(e.target.value)}
              required
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? '提交中…' : '确认修改'}
          </button>
        </form>

        <div className="auth-back">
          <button
            onClick={() => {
              logout();
              router.push('/login');
            }}
            style={{
              color: 'rgba(255,255,255,0.4)',
              fontSize: '0.85rem',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            退出登录
          </button>
        </div>
      </div>
    </div>
  );
}