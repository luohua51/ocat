'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchConversations, type Conversation } from '@/lib/chat';

export default function PlayerChatPage() {
  const [list, setList] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const data = await fetchConversations();
    setList(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
    const timer = setInterval(load, 5000);
    return () => clearInterval(timer);
  }, []);

  function formatTime(t: string | null) {
    if (!t) return '';
    const d = new Date(t);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60 * 1000) return '刚刚';
    if (diff < 60 * 60 * 1000) return Math.floor(diff / 60000) + ' 分钟前';
    if (diff < 24 * 60 * 60 * 1000)
      return Math.floor(diff / 3600000) + ' 小时前';
    return d.toLocaleDateString('zh-CN');
  }

  return (
    <>
      <div className="player-header">
        <h1 className="player-title">消息</h1>
        <p className="player-subtitle">
          {loading ? '加载中…' : `共 ${list.length} 个会话`}
        </p>
      </div>

      {loading ? (
        <div className="player-empty">加载中…</div>
      ) : list.length === 0 ? (
        <div className="player-empty">暂无会话，去抢单大厅看看</div>
      ) : (
        <div className="player-chat-list">
          {list.map((c) => (
            <Link
              key={c.id}
              href={`/player/chat/${c.id}`}
              className="player-chat-item"
            >
              <div className="player-chat-avatar">
                {c.member_name.charAt(0)}
              </div>
              <div className="player-chat-body">
                <div className="player-chat-name">
                  {c.member_name}
                  {c.order_id ? (
                    <span
                      style={{
                        marginLeft: '0.5rem',
                        fontSize: '0.68rem',
                        color: '#FF7A00',
                        background: 'rgba(255,122,0,0.15)',
                        padding: '0.1rem 0.4rem',
                        borderRadius: '0.3rem',
                        fontWeight: 700,
                      }}
                    >
                      订单
                    </span>
                  ) : (
                    <span
                      style={{
                        marginLeft: '0.5rem',
                        fontSize: '0.68rem',
                        color: '#818cf8',
                        background: 'rgba(99,102,241,0.15)',
                        padding: '0.1rem 0.4rem',
                        borderRadius: '0.3rem',
                        fontWeight: 700,
                      }}
                    >
                      咨询
                    </span>
                  )}
                </div>
                <div className="player-chat-msg">
                  {c.last_message || '（还没消息）'}
                </div>
              </div>
              <div className="player-chat-right">
                <div className="player-chat-time">
                  {formatTime(c.last_message_at)}
                </div>
                {c.unreadCount !== undefined && c.unreadCount > 0 && (
                  <div className="player-chat-badge">
                    {c.unreadCount > 99 ? '99+' : c.unreadCount}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}