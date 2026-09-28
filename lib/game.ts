'use client';

export type Game = {
  id: number;
  name: string;
  logo: string | null;
  cover: string | null;
  description: string | null;
  ranks: string[];
  has_rank: boolean;
  sort_order: number;
  status: 'active' | 'disabled';
  created_at: string;
};

export async function fetchGames(): Promise<Game[]> {
  const res = await fetch('/api/games', { cache: 'no-store' });
  const data = await res.json();
  if (!data.ok) return [];
  return data.games as Game[];
}

export async function createGame(payload: {
  name: string;
  description?: string;
  ranks?: string[];
  hasRank?: boolean;
  sortOrder?: number;
}): Promise<{ ok: boolean; game?: Game; error?: string }> {
  const res = await fetch('/api/games', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  return data.ok ? { ok: true, game: data.game } : { ok: false, error: data.error };
}

export async function updateGame(
  id: number,
  payload: Partial<Game>
): Promise<{ ok: boolean; game?: Game; error?: string }> {
  const res = await fetch('/api/games/' + id, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  return data.ok ? { ok: true, game: data.game } : { ok: false, error: data.error };
}

export async function deleteGame(id: number): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch('/api/games/' + id, { method: 'DELETE' });
  const data = await res.json();
  return data.ok ? { ok: true } : { ok: false, error: data.error };
}