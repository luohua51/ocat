'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchConversations, type Conversation } from '@/lib/chat';

export default function MemberChatPage() {
  const [list, setList] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations().then((data) => {
      setList(data);
      setLoading(false);
    });
  }, []);

  function formatTime(t: string | null) {
    if (!t) return '';
    const d = new Date(t);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60 * 1000) return '刚刚';
    if (diff < 60 * 60 * 1000) return Math.floor(diff / 60000) + ' 分钟前';
    if (diff < 24 * 60 * 60 * 1000) return Math.floor(diff / 3600000) + ' 小时前';
    return d.toLocaleDateString('zh-CN');
  }

  return (
    <>
      <div className="member-header">
        <h1 className="member-title">消息</h1>
        <p className="member-subtitle">
          {loading ? '加载中…' : `共 ${list.length} 个会话`}
        </p>
      </div>

      {loading ? (
        <div className="member-empty">加载中…</div>
      ) : list.length === 0 ? (
        <div className="member-empty">暂无会话，去下单或联系陪玩试试</div>
      ) : (
        <div className="member-chat-list">
          {list.map((c) => (
            <Link
              key={c.id}
              href={`/member/chat/${c.id}`}
              className="member-chat-item"
            >
              <div className="member-chat-avatar">
                {c.player_name.charAt(0)}
              </div>
              <div className="member-chat-body">
                <div className="member-chat-name">{c.player_name}</div>
                <div className="member-chat-msg">
                  {c.last_message || '（还没消息）'}
                </div>
              </div>
              <div className="member-chat-right">
                <div className="member-chat-time">
                  {formatTime(c.last_message_at)}
                </div>
                {c.unreadCount && c.unreadCount > 0 ? (
                  <div className="member-chat-badge">{c.unreadCount}</div>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}