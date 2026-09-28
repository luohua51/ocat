'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  fetchConversation,
  sendMessage,
  fetchNewMessages,
  toggleMemberMute,
  type Conversation,
  type Message,
} from '@/lib/chat';
import { fetchCurrentUser } from '@/lib/auth';
import ChatOrderCard from '@/components/ChatOrderCard';

export default function MemberChatRoomPage() {
  const params = useParams();
  const conversationId = Number(params.id);

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [memberMuted, setMemberMuted] = useState(false);
  const [myUserId, setMyUserId] = useState<number | null>(null);
  const [muting, setMuting] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastIdRef = useRef<number>(0);

  useEffect(() => {
    fetchCurrentUser().then((u) => {
      if (u) setMyUserId(u.id);
    });
  }, []);

  useEffect(() => {
    async function load() {
      const data = await fetchConversation(conversationId);
      if (!data.conversation) {
        setLoading(false);
        return;
      }
      setConversation(data.conversation);
      setMemberMuted(!!data.conversation.member_muted);

      const unique = Array.from(
        new Map(data.messages.map((m) => [m.id, m])).values()
      );
      setMessages(unique);
      lastIdRef.current =
        unique.length > 0 ? unique[unique.length - 1].id : 0;
      setLoading(false);
    }
    load();
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId) return;
    const timer = setInterval(async () => {
      const data = await fetchNewMessages(conversationId, lastIdRef.current);
      if (data.messages.length > 0) {
        setMessages((prev) => {
          const existing = new Set(prev.map((m) => m.id));
          const fresh = data.messages.filter((m) => !existing.has(m.id));
          return [...prev, ...fresh];
        });
        lastIdRef.current = data.messages[data.messages.length - 1].id;
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || sending) return;
    setSending(true);
    const content = input.trim();
    setInput('');

    const r = await sendMessage({ conversationId, content });
    setSending(false);

    if (!r.ok) {
      alert(r.error || '发送失败');
      setInput(content);
      return;
    }

    if (r.message) {
      setMessages((prev) => {
        if (prev.some((m) => m.id === r.message!.id)) return prev;
        return [...prev, r.message!];
      });
      lastIdRef.current = r.message.id;
    }
  }

  async function handleToggleMute() {
    if (muting) return;
    const next = !memberMuted;

    if (next) {
      if (!confirm('确定拒收此陪玩的消息？\n拒收后对方将无法给你发消息。')) return;
    }

    setMuting(true);
    const r = await toggleMemberMute(conversationId, next);
    setMuting(false);

    if (!r.ok) {
      alert(r.error || '操作失败');
      return;
    }

    setMemberMuted(next);
    alert(next ? '已拒收该陪玩消息' : '已恢复接收消息');
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function formatTime(t: string) {
    const d = new Date(t);
    return d.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  if (loading || myUserId === null) {
    return <div className="member-empty">加载中…</div>;
  }

  if (!conversation) {
    return (
      <>
        <div className="member-header">
          <h1 className="member-title">会话不存在</h1>
        </div>
        <Link href="/member/chat" className="member-more">
          ← 返回会话列表
        </Link>
      </>
    );
  }

  return (
    <div className="chat-room">
      <div className="chat-room-header">
        <Link href="/member/chat" className="chat-room-back">
          ←
        </Link>
        <div className="chat-room-peer">
          <div className="chat-room-peer-avatar">
            {conversation.player_name.charAt(0)}
          </div>
          <div>
            <div className="chat-room-peer-name">{conversation.player_name}</div>
            <div className="chat-room-peer-sub">订单 #{conversation.order_id}</div>
          </div>
        </div>

        <button
          className={'chat-mute-btn' + (memberMuted ? ' muted' : '')}
          onClick={handleToggleMute}
          disabled={muting}
          title={memberMuted ? '点击恢复接收消息' : '点击拒收此陪玩消息'}
        >
          {muting ? '处理中' : memberMuted ? '🔇 已拒收' : '🔊 已接收'}
        </button>
      </div>

      <ChatOrderCard orderId={conversation.order_id} role="member" />

      <div className="chat-room-messages">
        {messages.length === 0 ? (
          <div className="chat-room-empty">还没有消息，打个招呼吧 👋</div>
        ) : (
          messages.map((m) => {
            const isMine = m.sender_id === myUserId;
            return (
              <div
                key={m.id}
                className={'chat-msg ' + (isMine ? 'mine' : 'theirs')}
              >
                {!isMine && (
                  <div className="chat-msg-avatar">
                    {m.sender_name.charAt(0)}
                  </div>
                )}
                <div className="chat-msg-bubble-wrap">
                  <div className="chat-msg-bubble">{m.content}</div>
                  <div className="chat-msg-time">{formatTime(m.created_at)}</div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {memberMuted && (
        <div className="chat-room-locked" style={{ background: 'rgba(255,122,0,0.1)', borderTopColor: 'rgba(255,122,0,0.3)', color: '#FF7A00' }}>
          🔇 你已拒收此陪玩的消息。他可以查看历史消息，但无法再发送新消息。
        </div>
      )}

      <div className="chat-room-input">
        <textarea
          className="chat-room-textarea"
          placeholder="输入消息，回车发送"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={sending}
          rows={1}
        />
        <button
          className="chat-room-send"
          onClick={handleSend}
          disabled={sending || !input.trim()}
        >
          {sending ? '发送中' : '发送'}
        </button>
      </div>
    </div>
  );
}