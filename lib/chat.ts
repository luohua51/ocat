'use client';

export type Conversation = {
  id: number;
  member_user_id: number;
  member_name: string;
  player_user_id: number;
  player_name: string;
  last_message: string | null;
  last_message_at: string | null;
  created_at: string;
  // 可选：未读数
  unreadCount?: number;
};

export type Message = {
  id: number;
  conversation_id: number;
  sender_id: number;
  sender_role: 'member' | 'player' | 'system';
  sender_name: string;
  type: 'text' | 'image' | 'order_card' | 'system';
  content: string | null;
  order_id: number | null;
  is_read: boolean;
  created_at: string;
};

// ============================================================
// 获取或创建会话
// ============================================================
export async function getOrCreateConversation(params: {
  otherUserId?: number;
  orderId?: number;
}): Promise<{ ok: boolean; conversation?: Conversation; error?: string }> {
  const res = await fetch('/api/chat/conversations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  return data.ok
    ? { ok: true, conversation: data.conversation }
    : { ok: false, error: data.error };
}

// ============================================================
// 会话列表
// ============================================================
export async function fetchConversations(): Promise<Conversation[]> {
  const res = await fetch('/api/chat/conversations', { cache: 'no-store' });
  const data = await res.json();
  if (!data.ok) return [];
  return data.conversations as Conversation[];
}

// ============================================================
// 会话详情 + 消息列表
// ============================================================
export async function fetchConversation(
  id: number
): Promise<{ conversation: Conversation | null; messages: Message[] }> {
  const res = await fetch('/api/chat/conversations/' + id, { cache: 'no-store' });
  const data = await res.json();
  if (!data.ok) return { conversation: null, messages: [] };
  return {
    conversation: data.conversation,
    messages: data.messages || [],
  };
}

// ============================================================
// 发消息
// ============================================================
export async function sendMessage(params: {
  conversationId: number;
  content: string;
  type?: 'text' | 'order_card';
  orderId?: number;
}): Promise<{ ok: boolean; message?: Message; error?: string }> {
  const res = await fetch(`/api/chat/conversations/${params.conversationId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: params.content,
      type: params.type || 'text',
      orderId: params.orderId,
    }),
  });
  const data = await res.json();
  return data.ok ? { ok: true, message: data.message } : { ok: false, error: data.error };
}