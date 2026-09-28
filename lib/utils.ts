import type { Tier } from './mock';

export function formatPrice(amount: number): string {
  return `¥${amount.toFixed(2)}`;
}

export function formatDate(dateStr: string): string {
  return dateStr;
}

export const TIER_RANK: Record<string, number> = {
  明星: 0,
  魔王: 1,
  金牌: 2,
  技术: 3,
  娱乐: 4,
};

export function sortPlayers<T extends Record<string, any>>(players: T[]): T[] {
  return [...players].sort((a, b) => {
    const tierA = TIER_RANK[a.tier] ?? 99;
    const tierB = TIER_RANK[b.tier] ?? 99;
    if (tierA !== tierB) return tierA - tierB;

    const scoreA = (a.weeklyOrders || 0) * ((a.rating || 0) / 100);
    const scoreB = (b.weeklyOrders || 0) * ((b.rating || 0) / 100);
    return scoreB - scoreA;
  });
}

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