'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  fetchConversation,
  sendMessage,
  fetchNewMessages,
  type Conversation,
  type Message,
} from '@/lib/chat';
import { fetchCurrentUser } from '@/lib/auth';
import ChatOrderCard from '@/components/ChatOrderCard';

export default function PlayerChatRoomPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = Number(params.id);

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [canSend, setCanSend] = useState(true);
  const [myUserId, setMyUserId] = useState<number | null>(null);

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

      const unique = Array.from(
        new Map(data.messages.map((m) => [m.id, m])).values()
      );
      setMessages(unique);
      setCanSend(data.canSend);
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
      setCanSend(data.canSend);
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
    return <div className="player-empty">加载中…</div>;
  }

  if (!conversation) {
    return (
      <>
        <div className="player-header">
          <h1 className="player-title">会话不存在</h1>
        </div>
        <Link href="/player/chat" className="player-more">
          ← 返回会话列表
        </Link>
      </>
    );
  }

  return (
    <div className="chat-room">
      <div className="chat-room-header">
        <Link href="/player/chat" className="chat-room-back">
          ←
        </Link>
        <div className="chat-room-peer">
          <div className="chat-room-peer-avatar">
            {conversation.member_name.charAt(0)}
          </div>
          <div>
            <div className="chat-room-peer-name">
              {conversation.member_name}
            </div>
            <div className="chat-room-peer-sub">
              订单 #{conversation.order_id}
            </div>
          </div>
        </div>
      </div>

      <ChatOrderCard
        orderId={conversation.order_id}
        role="player"
        onOrderUpdate={(o) => {
          // 订单被接走时，切换会话可发送状态
          if (o.player_id && o.player_id !== myUserId) {
            setCanSend(false);
          }
        }}
      />

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

      {!canSend && (
        <div className="chat-room-locked">
          🔒 该订单已被其他陪玩接走，无法继续发送消息
        </div>
      )}

      <div className="chat-room-input">
        <textarea
          className="chat-room-textarea"
          placeholder={canSend ? '输入消息，回车发送' : '无法发送'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={!canSend || sending}
          rows={1}
        />
        <button
          className="chat-room-send"
          onClick={handleSend}
          disabled={!canSend || sending || !input.trim()}
        >
          {sending ? '发送中' : '发送'}
        </button>
      </div>
    </div>
  );
}