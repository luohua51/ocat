'use client';

export type Conversation = {
  id: number;
  order_id: number;
  member_user_id: number;
  member_name: string;
  player_user_id: number;
  player_name: string;
  last_message: string | null;
  last_message_at: string | null;
  member_muted: boolean;
  created_at: string;
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

export async function getOrCreateConversation(params: {
  orderId: number;
}): Promise<{ ok: boolean; conversation?: Conversation; error?: string }> {
  const res = await fetch('/api/chat/conversations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId: params.orderId }),
  });
  const data = await res.json();
  return data.ok
    ? { ok: true, conversation: data.conversation }
    : { ok: false, error: data.error };
}

export async function fetchConversations(): Promise<Conversation[]> {
  const res = await fetch('/api/chat/conversations', { cache: 'no-store' });
  const data = await res.json();
  if (!data.ok) return [];
  return data.conversations as Conversation[];
}

export async function fetchConversation(
  id: number
): Promise<{
  conversation: Conversation | null;
  messages: Message[];
  canSend: boolean;
}> {
  const res = await fetch('/api/chat/conversations/' + id, { cache: 'no-store' });
  const data = await res.json();
  if (!data.ok) {
    return { conversation: null, messages: [], canSend: false };
  }
  return {
    conversation: data.conversation,
    messages: data.messages || [],
    canSend: data.canSend !== false,
  };
}

export async function sendMessage(params: {
  conversationId: number;
  content: string;
  type?: 'text' | 'order_card';
  orderId?: number;
}): Promise<{ ok: boolean; message?: Message; error?: string }> {
  const res = await fetch(
    `/api/chat/conversations/${params.conversationId}/messages`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: params.content,
        type: params.type || 'text',
        orderId: params.orderId,
      }),
    }
  );
  const data = await res.json();
  return data.ok
    ? { ok: true, message: data.message }
    : { ok: false, error: data.error };
}

export async function fetchNewMessages(
  conversationId: number,
  sinceId: number
): Promise<{ messages: Message[]; canSend: boolean }> {
  const res = await fetch(
    `/api/chat/conversations/${conversationId}/messages?since=${sinceId}`,
    { cache: 'no-store' }
  );
  const data = await res.json();
  if (!data.ok) return { messages: [], canSend: true };
  return {
    messages: data.messages || [],
    canSend: data.canSend !== false,
  };
}

// ============================================================
// 切换拒收开关（会员用）
// ============================================================
export async function toggleMemberMute(
  conversationId: number,
  muted: boolean
): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(`/api/chat/conversations/${conversationId}/mute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ muted }),
  });
  const data = await res.json();
  return data.ok ? { ok: true } : { ok: false, error: data.error };
}