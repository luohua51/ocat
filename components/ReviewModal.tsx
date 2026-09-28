'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  fetchOrder,
  acceptOrder,
  startOrder,
  finishOrder,
  ORDER_STATUS_TEXT,
  type Order,
} from '@/lib/order';

type Props = {
  orderId: number;
  role: 'member' | 'player';
  onOrderUpdate?: (order: Order) => void;
};

export default function ChatOrderCard({ orderId, role, onOrderUpdate }: Props) {
  const [order, setOrder] = useState<Order | null>(null);
  const [working, setWorking] = useState(false);

  async function load() {
    const o = await fetchOrder(orderId);
    setOrder(o);
    onOrderUpdate?.(o);
  }

  useEffect(() => {
    load();
    // 每 5 秒刷新订单状态
    const timer = setInterval(load, 5000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  async function handleAccept() {
    if (!order) return;
    if (!confirm('确认接单？')) return;
    setWorking(true);
    const r = await acceptOrder(order.id);
    setWorking(false);
    if (!r.ok) return alert(r.error || '接单失败');
    alert('接单成功！');
    load();
  }

  async function handleStart() {
    if (!order) return;
    if (!confirm('确认开始服务？')) return;
    setWorking(true);
    const r = await startOrder(order.id);
    setWorking(false);
    if (!r.ok) return alert(r.error || '操作失败');
    load();
  }

  async function handleFinish() {
    if (!order) return;
    if (!confirm('确认完成服务？')) return;
    setWorking(true);
    const r = await finishOrder(order.id);
    setWorking(false);
    if (!r.ok) return alert(r.error || '操作失败');
    load();
  }

  if (!order) return null;

  const isPooling = order.status === 'pooling';
  const isLocked = order.status === 'locked';
  const isInService = order.status === 'in_service';
  const isFinished = order.status === 'finished';
  const isDone = order.status === 'completed' || order.status === 'reviewed';
  const isMyOrder = role === 'player' && order.player_id;

  return (
    <div className="chat-order-card">
      <div className="chat-order-card-top">
        <div>
          <div className="chat-order-card-title">
            {order.game_name} · {order.tier}
          </div>
          <div className="chat-order-card-sub">
            {role === 'member' ? `陪玩：${order.player_name || '待分配'}` : `老板：${order.member_name}`}
            {' · '}
            {order.duration_hours}h
            {order.boss_rank ? ` · 段位：${order.boss_rank}` : ''}
          </div>
        </div>
        <span
          className="chat-order-card-status"
          style={{
            background:
              order.status === 'pooling'
                ? 'rgba(99,102,241,0.2)'
                : isDone
                ? 'rgba(5,150,105,0.2)'
                : 'rgba(255,122,0,0.2)',
            color:
              order.status === 'pooling'
                ? '#818cf8'
                : isDone
                ? '#34d399'
                : '#FF7A00',
          }}
        >
          {ORDER_STATUS_TEXT[order.status] || order.status}
        </span>
      </div>

      {order.remark && (
        <div className="chat-order-card-remark">📝 {order.remark}</div>
      )}

      <div className="chat-order-card-bottom">
        <div className="chat-order-card-amount">
          {order.final_amount > 0 ? `¥${order.final_amount.toFixed(2)}` : '价格待定'}
        </div>

        <div className="chat-order-card-actions">
          <Link
            href={`/${role === 'member' ? 'member' : 'player'}/orders/${order.id}`}
            className="chat-order-card-btn ghost"
          >
            查看订单
          </Link>

          {role === 'player' && isPooling && (
            <button
              className="chat-order-card-btn primary"
              onClick={handleAccept}
              disabled={working}
            >
              {working ? '处理中…' : '🔥 接单'}
            </button>
          )}

          {role === 'player' && isMyOrder && isLocked && (
            <button
              className="chat-order-card-btn primary"
              onClick={handleStart}
              disabled={working}
            >
              {working ? '处理中…' : '▶ 开始服务'}
            </button>
          )}

          {role === 'player' && isMyOrder && isInService && (
            <button
              className="chat-order-card-btn primary"
              onClick={handleFinish}
              disabled={working}
            >
              {working ? '处理中…' : '✅ 完成服务'}
            </button>
          )}

          {role === 'player' && isMyOrder && isFinished && (
            <span className="chat-order-card-tip">等待老板确认</span>
          )}

          {role === 'player' && !isMyOrder && !isPooling && (
            <span className="chat-order-card-tip" style={{ color: '#f87171' }}>
              已被他人接走
            </span>
          )}

          {role === 'member' && isPooling && (
            <span className="chat-order-card-tip">等待陪玩接单</span>
          )}
        </div>
      </div>
    </div>
  );
}