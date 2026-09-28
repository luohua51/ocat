'use client';

export const ORDER_STATUS_TEXT: Record<string, string> = {
  pending: '待付款',
  paid: '已付款',
  pending_player: '待陪玩响应',
  pooling: '抢单中',
  locked: '已锁单',
  in_service: '服务中',
  finished: '待确认',
  completed: '已完成',
  reviewed: '已评价',
  cancelled: '已取消',
  disputed: '争议中',
  expired: '已超时',
};

export const ORDER_STATUS_COLOR: Record<string, string> = {
  pending: '#9ca3af',
  paid: '#FF7A00',
  pending_player: '#FF7A00',
  pooling: '#FF7A00',
  locked: '#6366f1',
  in_service: '#3b82f6',
  finished: '#8b5cf6',
  completed: '#059669',
  reviewed: '#059669',
  cancelled: '#6b7280',
  disputed: '#dc2626',
  expired: '#6b7280',
};

export type Order = {
  id: number;
  order_no: string;
  member_id: number;
  member_name: string;
  player_id: number | null;
  player_name: string | null;
  shop_id: number | null;
  identity_type: 'freelance' | 'shop';
  game_id: number;
  game_name: string;
  tier: string;
  boss_rank: string | null;
  duration_hours: number;
  unit_price: number;
  base_amount: number;
  final_amount: number;
  platform_fee: number;
  shop_fee: number;
  player_income: number;
  status: string;
  is_designated: boolean;
  remark: string | null;
  created_at: string;
};

export async function fetchOrders(): Promise<Order[]> {
  const res = await fetch('/api/orders', { cache: 'no-store' });
  const data = await res.json();
  if (!data.ok) return [];
  return data.orders as Order[];
}

export async function fetchOrder(id: number): Promise<Order | null> {
  const res = await fetch('/api/orders/' + id, { cache: 'no-store' });
  const data = await res.json();
  if (!data.ok) return null;
  return data.order as Order;
}

export async function createOrder(payload: {
  playerId: number;
  gameId: number;
  tier: string;
  bossRank: string;
  durationHours: number;
  identityType?: 'freelance' | 'shop';
  remark?: string;
}): Promise<{ ok: boolean; order?: Order; error?: string }> {
  const res = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  return data.ok ? { ok: true, order: data.order } : { ok: false, error: data.error };
}

export async function fetchHallOrders(): Promise<Order[]> {
  const res = await fetch('/api/orders/hall', { cache: 'no-store' });
  const data = await res.json();
  if (!data.ok) return [];
  return data.orders as Order[];
}

export async function acceptOrder(
  orderId: number
): Promise<{ ok: boolean; order?: Order; error?: string }> {
  const res = await fetch(`/api/orders/${orderId}/accept`, {
    method: 'POST',
  });
  const data = await res.json();
  return data.ok ? { ok: true, order: data.order } : { ok: false, error: data.error };
}

export async function cancelOrder(
  orderId: number
): Promise<{ ok: boolean; order?: Order; error?: string }> {
  const res = await fetch(`/api/orders/${orderId}/cancel`, { method: 'POST' });
  const data = await res.json();
  return data.ok ? { ok: true, order: data.order } : { ok: false, error: data.error };
}

// ============================================================
// 陪玩散陪价
// ============================================================
export type PlayerPrice = {
  id: number;
  game_id: number;
  tier: string;
  boss_rank: string | null;
  price_per_hour: number;
  is_active: boolean;
};

export async function fetchMyPrices(): Promise<PlayerPrice[]> {
  const res = await fetch('/api/player/prices', { cache: 'no-store' });
  const data = await res.json();
  if (!data.ok) return [];
  return data.prices as PlayerPrice[];
}

export async function upsertPrice(payload: {
  gameId: number;
  tier: string;
  pricePerHour: number;
}): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch('/api/player/prices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  return data.ok ? { ok: true } : { ok: false, error: data.error };
}

export async function deletePrice(
  id: number
): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch('/api/player/prices/' + id, { method: 'DELETE' });
  const data = await res.json();
  return data.ok ? { ok: true } : { ok: false, error: data.error };
}

async function postAction(orderId: number, action: string) {
  const res = await fetch(`/api/orders/${orderId}/${action}`, { method: 'POST' });
  const data = await res.json();
  return data.ok ? { ok: true, order: data.order } : { ok: false, error: data.error };
}

export async function startOrder(orderId: number) {
  return postAction(orderId, 'start');
}

export async function finishOrder(orderId: number) {
  return postAction(orderId, 'finish');
}

export async function confirmOrder(orderId: number) {
  return postAction(orderId, 'confirm');
}

// ============================================================
// 钱包
// ============================================================
export type WalletInfo = {
  balance: number;
  totalIncome: number;
  totalWithdrawn: number;
};

export type WalletTransaction = {
  id: number;
  type: string;
  amount: number;
  balance_after: number;
  order_id: number | null;
  description: string | null;
  created_at: string;
};

export async function fetchMyWallet(): Promise<WalletInfo> {
  const res = await fetch('/api/wallet', { cache: 'no-store' });
  const data = await res.json();
  if (!data.ok) return { balance: 0, totalIncome: 0, totalWithdrawn: 0 };
  return {
    balance: data.balance,
    totalIncome: data.totalIncome,
    totalWithdrawn: data.totalWithdrawn,
  };
}

export async function fetchMyTransactions(): Promise<WalletTransaction[]> {
  const res = await fetch('/api/wallet/transactions', { cache: 'no-store' });
  const data = await res.json();
  if (!data.ok) return [];
  return data.transactions;
}

// ============================================================
// 评价
// ============================================================
export type Review = {
  id: number;
  order_id: number;
  from_user_id: number;
  from_role: string;
  from_name: string;
  to_user_id: number;
  to_role: string;
  to_name: string;
  rating: number;
  tags: string[];
  content: string | null;
  is_anonymous: boolean;
  created_at: string;
};

export async function submitReview(payload: {
  orderId: number;
  rating: number;
  content?: string;
  tags?: string[];
  isAnonymous?: boolean;
}): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch('/api/reviews', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  return data.ok ? { ok: true } : { ok: false, error: data.error };
}

export async function fetchOrderReviews(
  orderId: number
): Promise<{ reviews: Review[]; myReview: Review | null }> {
  const res = await fetch(`/api/reviews/order/${orderId}`, { cache: 'no-store' });
  const data = await res.json();
  if (!data.ok) return { reviews: [], myReview: null };
  return { reviews: data.reviews || [], myReview: data.myReview || null };
}

export async function fetchPlayerReviews(
  userId: number
): Promise<{ reviews: Review[]; total: number; average: number }> {
  const res = await fetch(`/api/reviews/player/${userId}`, { cache: 'no-store' });
  const data = await res.json();
  if (!data.ok) return { reviews: [], total: 0, average: 0 };
  return {
    reviews: data.reviews || [],
    total: data.total || 0,
    average: data.average || 0,
  };
}

// ============================================================
// 在线状态
// ============================================================
export type PlayerStatus = 'online' | 'offline' | 'busy';

export async function fetchMyStatus(): Promise<PlayerStatus> {
  const res = await fetch('/api/player/status', { cache: 'no-store' });
  const data = await res.json();
  if (!data.ok) return 'offline';
  return data.status as PlayerStatus;
}

export async function toggleMyStatus(): Promise<{
  ok: boolean;
  status?: PlayerStatus;
  error?: string;
}> {
  const res = await fetch('/api/player/status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'toggle' }),
  });
  const data = await res.json();
  return data.ok
    ? { ok: true, status: data.status }
    : { ok: false, error: data.error };
}

export async function sendHeartbeat(): Promise<void> {
  try {
    await fetch('/api/player/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'heartbeat' }),
    });
  } catch {
    // 静默失败
  }
}