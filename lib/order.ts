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