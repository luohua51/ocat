'use client';

export type PlayerFull = {
  id: number;
  name: string;
  avatar: string | null;
  audio: string | null;
  tier: string;
  weekly_orders: number;
  rating: number;
};

export type PlayerProfile = {
  id?: number;
  player_id: number;
  signature: string | null;
  description: string | null;
  rank_text: string | null;
  available_time: string | null;
  screenshots: string[];
};

export async function fetchMyPlayerProfile(): Promise<{
  player: PlayerFull | null;
  profile: PlayerProfile | null;
  capabilities: { game_id: number; tier: string }[];
}> {
  const res = await fetch('/api/player/profile', { cache: 'no-store' });
  const data = await res.json();
  if (!data.ok) return { player: null, profile: null, capabilities: [] };
  return {
    player: data.player,
    profile: data.profile,
    capabilities: data.capabilities || [],
  };
}

export async function updateMyPlayerProfile(payload: {
  name?: string;
  signature?: string;
  description?: string;
  rankText?: string;
  availableTime?: string;
  games?: string[];
}): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch('/api/player/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  return data.ok ? { ok: true } : { ok: false, error: data.error };
}

export async function uploadAvatar(file: File): Promise<{
  ok: boolean;
  avatar?: string;
  error?: string;
}> {
  const fd = new FormData();
  fd.append('file', file);

  const res = await fetch('/api/player/avatar', {
    method: 'POST',
    body: fd,
  });
  const data = await res.json();
  return data.ok
    ? { ok: true, avatar: data.avatar }
    : { ok: false, error: data.error };
}