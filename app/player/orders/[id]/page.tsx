'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { MOCK_ORDERS } from '@/lib/mock';
import { ORDER_STATUS_TEXT } from '@/lib/utils';

export default function PlayerOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const order = MOCK_ORDERS.find((o) => o.id === Number(params.id));

  if (!order) {
    return (
      <>
        <div className="player-header">
          <h1 className="player-title">订单不存在</h1>
        </div>
        <Link href="/player/orders" className="player-more">
          ← 返回订单列表
        </Link>
      </>
    );
  }

  const statusText = ORDER_STATUS_TEXT[order.status] || order.status;

  return (
    <>
      <div className="player-header">
        <Link href="/player/orders" className="player-more">
          ← 返回
        </Link>
        <h1 className="player-title" style={{ marginTop: '0.5rem' }}>
          订单详情
        </h1>
        <p className="player-subtitle">订单号 {order.orderNo}</p>
      </div>

      <div className="player-detail-card">
        <div className="player-detail-status">
          <span className="player-order-tag" style={{ fontSize: '0.85rem', padding: '0.3rem 0.9rem' }}>
            {statusText}
          </span>
        </div>

        <div className="player-detail-rows">
          <div className="player-detail-row">
            <span className="player-detail-key">老板</span>
            <span className="player-detail-val">{order.memberName}</span>
          </div>
          <div className="player-detail-row">
            <span className="player-detail-key">游戏</span>
            <span className="player-detail-val">{order.game}</span>
          </div>
          <div className="player-detail-row">
            <span className="player-detail-key">档位</span>
            <span className="player-detail-val">{order.tier}</span>
          </div>
          <div className="player-detail-row">
            <span className="player-detail-key">老板段位</span>
            <span className="player-detail-val">{order.bossRank}</span>
          </div>
          <div className="player-detail-row">
            <span className="player-detail-key">时长</span>
            <span className="player-detail-val">{order.hours} 小时</span>
          </div>
          <div className="player-detail-row">
            <span className="player-detail-key">下单时间</span>
            <span className="player-detail-val">{order.createdAt}</span>
          </div>
          <div className="player-detail-row">
            <span className="player-detail-key">订单金额</span>
            <span className="player-detail-val">¥{order.totalAmount.toFixed(2)}</span>
          </div>
          <div className="player-detail-row player-detail-row-total">
            <span className="player-detail-key">预计收入（98%）</span>
            <span className="player-detail-val" style={{ color: '#059669', fontSize: '1.3rem', fontWeight: 800 }}>
              ¥{(order.totalAmount * 0.98).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <div className="player-detail-actions">
        <button className="player-btn-ghost" onClick={() => router.push('/player/chat')}>
          💬 联系老板
        </button>
        {order.status === 'in_service' && (
          <button className="player-btn-primary" onClick={() => alert('标记完成（demo）')}>
            ✅ 完成服务
          </button>
        )}
      </div>
    </>
  );
}