'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { register, getRoleHome } from '@/lib/auth';

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password.length < 6) return setError('密码至少 6 位');
    if (password !== password2) return setError('两次密码不一致');

    setLoading(true);
    try {
      const result = await register(username, password, nickname);
      if (!result.ok || !result.user) {
        setError(result.error || '注册失败');
        setLoading(false);
        return;
      }
      const target = redirect || result.redirect || getRoleHome(result.user.role);
      router.push(target);
    } catch (err) {
      console.error(err);
      setError('网络错误');
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-brand">🐱 陪玩平台</div>
        <div className="auth-sub">会员注册</div>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>账号</label>
            <input type="text" placeholder="请输入账号" value={username} onChange={(e) => setUsername(e.target.value)} required />
          </div>
          <div className="field">
            <label>昵称</label>
            <input type="text" placeholder="请输入昵称" value={nickname} onChange={(e) => setNickname(e.target.value)} />
          </div>
          <div className="field">
            <label>密码（至少 6 位）</label>
            <input type="password" placeholder="请输入密码" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <div className="field">
            <label>确认密码</label>
            <input type="password" placeholder="请再次输入密码" value={password2} onChange={(e) => setPassword2(e.target.value)} required />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? '注册中…' : '注 册'}
          </button>
        </form>

        <div className="auth-hint">
          已有账号？<Link href="/login">立即登录</Link>
        </div>

        <div className="auth-back">
          <Link href="/">← 返回首页</Link>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div style={{ color: '#fff', padding: '2rem' }}>加载中…</div>}>
      <RegisterContent />
    </Suspense>
  );
}