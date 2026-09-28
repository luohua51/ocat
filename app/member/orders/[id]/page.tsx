'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { MOCK_ORDERS } from '@/lib/mock';
import { ORDER_STATUS_TEXT } from '@/lib/utils';

export default function MemberOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const order = MOCK_ORDERS.find((o) => o.id === Number(params.id));

  if (!order) {
    return (
      <>
        <div className="member-header">
          <h1 className="member-title">订单不存在</h1>
        </div>
        <Link href="/member/orders" className="member-more">
          ← 返回订单列表
        </Link>
      </>
    );
  }

  const statusText = ORDER_STATUS_TEXT[order.status] || order.status;

  return (
    <>
      <div className="member-header">
        <Link href="/member/orders" className="member-more">
          ← 返回
        </Link>
        <h1 className="member-title" style={{ marginTop: '0.5rem' }}>
          订单详情
        </h1>
        <p className="member-subtitle">订单号 {order.orderNo}</p>
      </div>

      <div className="member-detail-card">
        <div className="member-detail-status">
          <span className="member-order-tag" style={{ fontSize: '0.85rem', padding: '0.3rem 0.9rem' }}>
            {statusText}
          </span>
        </div>

        <div className="member-detail-rows">
          <div className="member-detail-row">
            <span className="member-detail-key">陪玩</span>
            <span className="member-detail-val">{order.playerName}</span>
          </div>
          <div className="member-detail-row">
            <span className="member-detail-key">店铺</span>
            <span className="member-detail-val">{order.shopName || '散陪'}</span>
          </div>
          <div className="member-detail-row">
            <span className="member-detail-key">游戏</span>
            <span className="member-detail-val">{order.game}</span>
          </div>
          <div className="member-detail-row">
            <span className="member-detail-key">档位</span>
            <span className="member-detail-val">{order.tier}</span>
          </div>
          <div className="member-detail-row">
            <span className="member-detail-key">段位</span>
            <span className="member-detail-val">{order.bossRank}</span>
          </div>
          <div className="member-detail-row">
            <span className="member-detail-key">时长</span>
            <span className="member-detail-val">{order.hours} 小时</span>
          </div>
          <div className="member-detail-row">
            <span className="member-detail-key">下单时间</span>
            <span className="member-detail-val">{order.createdAt}</span>
          </div>
          <div className="member-detail-row member-detail-row-total">
            <span className="member-detail-key">订单金额</span>
            <span className="member-detail-val" style={{ color: '#FF7A00', fontSize: '1.3rem', fontWeight: 800 }}>
              ¥{order.totalAmount.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <div className="member-detail-actions">
        <button
          className="member-btn-ghost"
          onClick={() => router.push('/member/chat')}
        >
          💬 联系陪玩
        </button>
        {order.status === 'in_service' && (
          <button className="member-btn-primary" onClick={() => alert('确认完成（demo）')}>
            ✅ 确认完成
          </button>
        )}
      </div>
    </>
  );
}