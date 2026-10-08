'use client';

// ============================================================
// 字典（前端硬编码，改这里就能加标签）
// ============================================================
export const VOICE_TAGS = [
  '萝莉音',
  '少女音',
  '御姐音',
  '妈音',
  '奶音',
  '青叔音',
  '青年音',
  '少年音',
  '屌丝音',
  '破碎音',
  '温柔音',
  '战斗音',
  '沙雕音',
  '反差萌',
  '清冷',
];

export const STYLE_TAGS = [
  '指挥型',
  '教学型',
  '带飞',
  'carry',
  '残局神',
  '上分',
  '娱乐局',
  '不压力',
  '话痨',
  '整活',
  '陪聊',
  '深夜档',
  '耐心',
  '温柔',
  '活泼',
  '高冷',
];

export const MAX_VOICE = 2;
export const MAX_STYLE = 3;
export const MAX_CUSTOM_LENGTH = 10;

export type PlayerTag = {
  id: number;
  player_id: number;
  category: 'voice' | 'style';
  tag_name: string;
  is_custom: boolean;
  sort_order: number;
};

// ============================================================
// 拉取某陪玩的标签
// ============================================================
export async function fetchPlayerTags(playerId: number): Promise<{
  voice: string[];
  style: string[];
}> {
  const res = await fetch(
    '/api/public/player-tags?playerId=' + playerId,
    { cache: 'no-store' }
  );
  const data = await res.json();
  if (!data.ok) return { voice: [], style: [] };
  return {
    voice: data.voice || [],
    style: data.style || [],
  };
}

// ============================================================
// 保存自己的标签
// ============================================================
export async function saveMyTags(payload: {
  voice: string[];
  style: string[];
}): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch('/api/player/tags', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  return data.ok ? { ok: true } : { ok: false, error: data.error };
}