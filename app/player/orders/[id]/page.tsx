'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  fetchOrder,
  startOrder,
  finishOrder,
  ORDER_STATUS_TEXT,
  type Order,
} from '@/lib/order';

export default function PlayerOrderDetailPage() {
  const params = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  async function load() {
    const o = await fetchOrder(Number(params.id));
    setOrder(o);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [params.id]);

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
    if (!confirm('确认完成服务？完成后等待老板确认。')) return;
    setWorking(true);
    const r = await finishOrder(order.id);
    setWorking(false);
    if (!r.ok) return alert(r.error || '操作失败');
    load();
  }

  if (loading) return <div className="player-empty">加载中…</div>;

  if (!order) {
    return (
      <>
        <div className="player-header">
          <h1 className="player-title">订单不存在</h1>
        </div>
        <Link href="/player/orders" className="player-more">← 返回订单列表</Link>
      </>
    );
  }

  return (
    <>
      <div className="player-header">
        <Link href="/player/orders" className="player-more">← 返回</Link>
        <h1 className="player-title" style={{ marginTop: '0.5rem' }}>订单详情</h1>
        <p className="player-subtitle">订单号 {order.order_no}</p>
      </div>

      <div className="player-detail-card">
        <div className="player-detail-status">
          <span
            className="player-order-tag"
            style={{ fontSize: '0.85rem', padding: '0.3rem 0.9rem' }}
          >
            {ORDER_STATUS_TEXT[order.status] || order.status}
          </span>
        </div>

        <div className="player-detail-rows">
          <div className="player-detail-row">
            <span className="player-detail-key">老板</span>
            <span className="player-detail-val">{order.member_name}</span>
          </div>
          <div className="player-detail-row">
            <span className="player-detail-key">游戏</span>
            <span className="player-detail-val">{order.game_name}</span>
          </div>
          <div className="player-detail-row">
            <span className="player-detail-key">档位</span>
            <span className="player-detail-val">{order.tier}</span>
          </div>
          <div className="player-detail-row">
            <span className="player-detail-key">老板段位</span>
            <span className="player-detail-val">{order.boss_rank || '未填'}</span>
          </div>
          <div className="player-detail-row">
            <span className="player-detail-key">时长</span>
            <span className="player-detail-val">{order.duration_hours} 小时</span>
          </div>
          {order.remark && (
            <div className="player-detail-row">
              <span className="player-detail-key">备注</span>
              <span className="player-detail-val">{order.remark}</span>
            </div>
          )}
          {order.player_income > 0 && (
            <div className="player-detail-row player-detail-row-total">
              <span className="player-detail-key">预计收入</span>
              <span
                className="player-detail-val"
                style={{ color: '#059669', fontSize: '1.3rem', fontWeight: 800 }}
              >
                ¥{order.player_income.toFixed(2)}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="player-detail-actions">
        <button className="player-btn-ghost" onClick={() => alert('聊天功能开发中')}>
          💬 联系老板
        </button>

        {order.status === 'locked' && (
          <button className="player-btn-primary" onClick={handleStart} disabled={working}>
            {working ? '处理中…' : '▶ 开始服务'}
          </button>
        )}

        {order.status === 'in_service' && (
          <button className="player-btn-primary" onClick={handleFinish} disabled={working}>
            {working ? '处理中…' : '✅ 完成服务'}
          </button>
        )}

        {order.status === 'finished' && (
          <button className="player-btn-primary disabled" disabled>
            等待老板确认
          </button>
        )}

        {order.status === 'completed' && (
          <button className="player-btn-primary disabled" disabled>
            订单已完成
          </button>
        )}
      </div>
    </>
  );
}