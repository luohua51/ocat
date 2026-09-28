'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { login, getRoleHome } from '@/lib/auth';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(username, password);

      if (!result.ok || !result.user) {
        setError(result.error || '登录失败');
        setLoading(false);
        return;
      }

      // 首次登录必须改密
      if (result.mustChangePassword) {
        router.push('/change-password');
        return;
      }

      const target = redirect || result.redirect || getRoleHome(result.user.role);
      router.push(target);
    } catch (err) {
      console.error('登录异常:', err);
      setError('网络错误，请重试');
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-brand">🐱 陪玩平台</div>
        <div className="auth-sub">登录</div>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>账号</label>
            <input
              type="text"
              placeholder="请输入账号"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label>密码</label>
            <input
              type="password"
              placeholder="请输入密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? '登录中…' : '登 录'}
          </button>
        </form>

        <div className="auth-hint">
          还没有账号？
          <Link href="/register">注册会员</Link>
        </div>

        <div className="auth-demo">
          <div className="demo-title">🔑 Demo 账号</div>
          <div>店铺管理员：cmmgezi / 123456（首次需改密）</div>
          <div>陪玩：gezi / 123456（首次需改密）</div>
        </div>

        <div className="auth-back">
          <Link href="/">← 返回首页</Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ color: '#fff', padding: '2rem' }}>加载中…</div>}>
      <LoginContent />
    </Suspense>
  );
}