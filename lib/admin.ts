'use client';

import type { Order } from './order';

// ============================================================
// 仪表盘
// ============================================================
export type DashboardStats = {
  todayOrders: number;
  todayIncome: number;
  totalPlayers: number;
  totalShops: number;
  pendingOrders: number;
};

export async function fetchDashboard(): Promise<{
  stats: DashboardStats;
  recentOrders: Order[];
}> {
  const res = await fetch('/api/admin/dashboard', { cache: 'no-store' });
  const data = await res.json();
  if (!data.ok) {
    return {
      stats: {
        todayOrders: 0,
        todayIncome: 0,
        totalPlayers: 0,
        totalShops: 0,
        pendingOrders: 0,
      },
      recentOrders: [],
    };
  }
  return { stats: data.stats, recentOrders: data.recentOrders || [] };
}

// ============================================================
// 全局流水
// ============================================================
export type AdminTx = {
  id: number;
  user_id: number;
  type: string;
  amount: number;
  balance_after: number;
  order_id: number | null;
  description: string | null;
  created_at: string;
  user: { id: number; username: string; nickname: string; role: string } | null;
};

export type TxSummary = {
  totalRecharge: number;
  totalConsume: number;
  totalIncome: number;
  totalRefund: number;
};

export async function fetchAllTransactions(): Promise<{
  transactions: AdminTx[];
  summary: TxSummary;
}> {
  const res = await fetch('/api/admin/transactions', { cache: 'no-store' });
  const data = await res.json();
  if (!data.ok) {
    return {
      transactions: [],
      summary: { totalRecharge: 0, totalConsume: 0, totalIncome: 0, totalRefund: 0 },
    };
  }
  return {
    transactions: data.transactions || [],
    summary: data.summary,
  };
}