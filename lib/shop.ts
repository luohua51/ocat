'use client';

export type ShopPrice = {
  id: number;
  shop_id: number;
  game_id: number;
  tier: string;
  boss_rank: string | null;
  price_per_hour: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export async function fetchShopPrices(): Promise<ShopPrice[]> {
  const res = await fetch('/api/shop/prices', { cache: 'no-store' });
  const data = await res.json();
  if (!data.ok) return [];
  return data.prices as ShopPrice[];
}

export async function upsertShopPrice(payload: {
  gameId: number;
  tier: string;
  bossRank: string | null;
  pricePerHour: number;
}): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch('/api/shop/prices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  return data.ok ? { ok: true } : { ok: false, error: data.error };
}

export async function updateShopPrice(
  id: number,
  pricePerHour: number
): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch('/api/shop/prices/' + id, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pricePerHour }),
  });
  const data = await res.json();
  return data.ok ? { ok: true } : { ok: false, error: data.error };
}

export async function deleteShopPrice(
  id: number
): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch('/api/shop/prices/' + id, { method: 'DELETE' });
  const data = await res.json();
  return data.ok ? { ok: true } : { ok: false, error: data.error };
}