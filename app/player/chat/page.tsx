'use client';

import { MOCK_PLAYERS } from '@/lib/mock';

const MOCK_CONVERSATIONS = [
  {
    id: 1,
    memberName: '老板A',
    lastMessage: '老板，几点开始？',
    lastTime: '10:32',
    unread: 2,
  },
  {
    id: 2,
    memberName: '老板B',
    lastMessage: '好的～等你哦',
    lastTime: '昨天',
    unread: 0,
  },
  {
    id: 3,
    memberName: '老板C',
    lastMessage: '麻烦了',
    lastTime: '3 天前',
    unread: 0,
  },
];

export default function PlayerChatPage() {
  return (
    <>
      <div className="player-header">
        <h1 className="player-title">消息</h1>
        <p className="player-subtitle">共 {MOCK_CONVERSATIONS.length} 个会话</p>
      </div>

      <div className="player-chat-list">
        {MOCK_CONVERSATIONS.map((c) => (
          <div key={c.id} className="player-chat-item">
            <div className="player-chat-avatar">{c.memberName.charAt(0)}</div>
            <div className="player-chat-body">
              <div className="player-chat-name">{c.memberName}</div>
              <div className="player-chat-msg">{c.lastMessage}</div>
            </div>
            <div className="player-chat-right">
              <div className="player-chat-time">{c.lastTime}</div>
              {c.unread > 0 && <div className="player-chat-badge">{c.unread}</div>}
            </div>
          </div>
        ))}
      </div>

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
        💬 聊天功能开发中，接入实时消息后可用
      </div>
    </>
  );
}