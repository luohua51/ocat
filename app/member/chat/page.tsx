'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchCurrentUser, type User } from '@/lib/auth';

export default function MemberChatPage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetchCurrentUser().then(setUser);
  }, []);

  if (!user) {
    return <div style={{ color: '#fff', padding: '2rem', textAlign: 'center' }}>加载中…</div>;
  }

  return (
    <>
      <div className="member-header">
        <h1 className="member-title">消息</h1>
        <p className="member-subtitle">共 0 个会话</p>
      </div>

      <div className="member-empty">暂无会话</div>

      <div
        style={{
          marginTop: '1.5rem',
          background: 'rgba(255,255,255,0.04)',
          border: '1px dashed rgba(255,122,0,0.3)',
          borderRadius: '0.9rem',
          padding: '1rem 1.2rem',
          color: 'rgba(255,255,255,0.5)',
          fontSize: '0.85rem',
          textAlign: 'center',
        }}
      >
        💬 聊天功能开发中，下单后可与陪玩沟通
      </div>
    </>
  );
}