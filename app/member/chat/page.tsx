'use client';

import Link from 'next/link';
import { MOCK_PLAYERS } from '@/lib/mock';

const MOCK_CONVERSATIONS = [
  {
    id: 1,
    playerId: 1,
    lastMessage: '老板，几点开始？',
    lastTime: '10:32',
    unread: 2,
  },
  {
    id: 2,
    playerId: 2,
    lastMessage: '好的～等你哦',
    lastTime: '昨天',
    unread: 0,
  },
];

export default function MemberChatPage() {
  return (
    <>
      <div className="member-header">
        <h1 className="member-title">消息</h1>
        <p className="member-subtitle">共 {MOCK_CONVERSATIONS.length} 个会话</p>
      </div>

      <div className="member-chat-list">
        {MOCK_CONVERSATIONS.map((c) => {
          const player = MOCK_PLAYERS.find((p) => p.id === c.playerId);
          if (!player) return null;
          return (
            <div key={c.id} className="member-chat-item">
              <div className="member-chat-avatar">
                {player.avatar ? <img src={player.avatar} alt="" /> : player.name.charAt(0)}
              </div>
              <div className="member-chat-body">
                <div className="member-chat-name">{player.name}</div>
                <div className="member-chat-msg">{c.lastMessage}</div>
              </div>
              <div className="member-chat-right">
                <div className="member-chat-time">{c.lastTime}</div>
                {c.unread > 0 && <div className="member-chat-badge">{c.unread}</div>}
              </div>
            </div>
          );
        })}
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