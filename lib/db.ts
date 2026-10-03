export type PlayerIdentity = {
  type: 'shop' | 'freelance';
  shopName: string;
  tier: string;
  label: string;
};

export type PlayerDisplay = {
  id: number;
  name: string;
  avatar: string;
  tier: string;
  games: string[];
  price: number;
  signature: string;
  weeklyOrders: number;
  rating: number;
  shopName: string;
  status: string;
  identities: PlayerIdentity[];
};

export async function fetchPlayers(): Promise<PlayerDisplay[]> {
  try {
    const res = await fetch('/api/public/players', { cache: 'no-store' });
    const data = await res.json();
    if (!data.ok) return [];
    return data.players || [];
  } catch (err) {
    console.error('fetchPlayers 异常:', err);
    return [];
  }
}