'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { fetchOrder, ORDER_STATUS_TEXT, ORDER_STATUS_COLOR, type Order } from '@/lib/order';

export default function MemberOrderDetailPage() {
  const params = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder(Number(params.id)).then((o) => {
      setOrder(o);
      setLoading(false);
    });
  }, [params.id]);

  if (loading) {
    return <div className="member-empty">加载中…</div>;
  }

  if (!order) {
    return (
      <>
        <div className="member-header">
          <h1 className="member-title">订单不存在</h1>
        </div>
        <Link href="/member/orders" className="member-more">← 返回订单列表</Link>
      </>
    );
  }

  return (
    <>
      <div className="member-header">
        <Link href="/member/orders" className="member-more">← 返回</Link>
        <h1 className="member-title" style={{ marginTop: '0.5rem' }}>订单详情</h1>
        <p className="member-subtitle">订单号 {order.order_no}</p>
      </div>

      <div className="member-detail-card">
        <div className="member-detail-status">
          <span
            className="member-order-tag"
            style={{
              fontSize: '0.85rem',
              padding: '0.3rem 0.9rem',
              background: (ORDER_STATUS_COLOR[order.status] || '#6b7280') + '22',
              color: ORDER_STATUS_COLOR[order.status] || '#6b7280',
            }}
          >
            {ORDER_STATUS_TEXT[order.status] || order.status}
          </span>
        </div>

        <div className="member-detail-rows">
          <div className="member-detail-row">
            <span className="member-detail-key">陪玩</span>
            <span className="member-detail-val">{order.player_name || '待分配'}</span>
          </div>
          <div className="member-detail-row">
            <span className="member-detail-key">身份</span>
            <span className="member-detail-val">{order.identity_type === 'freelance' ? '散陪' : '店铺'}</span>
          </div>
          <div className="member-detail-row">
            <span className="member-detail-key">游戏</span>
            <span className="member-detail-val">{order.game_name}</span>
          </div>
          <div className="member-detail-row">
            <span className="member-detail-key">档位</span>
            <span className="member-detail-val">{order.tier}</span>
          </div>
          <div className="member-detail-row">
            <span className="member-detail-key">你的段位</span>
            <span className="member-detail-val">{order.boss_rank || '-'}</span>
          </div>
          <div className="member-detail-row">
            <span className="member-detail-key">时长</span>
            <span className="member-detail-val">{order.duration_hours} 小时</span>
          </div>
          <div className="member-detail-row">
            <span className="member-detail-key">单价</span>
            <span className="member-detail-val">¥{order.unit_price.toFixed(2)}/时</span>
          </div>
          {order.remark && (
            <div className="member-detail-row">
              <span className="member-detail-key">备注</span>
              <span className="member-detail-val">{order.remark}</span>
            </div>
          )}
          <div className="member-detail-row member-detail-row-total">
            <span className="member-detail-key">订单金额</span>
            <span
              className="member-detail-val"
              style={{ color: '#FF7A00', fontSize: '1.3rem', fontWeight: 800 }}
            >
              ¥{order.final_amount.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <div className="member-detail-actions">
        <button className="member-btn-ghost" onClick={() => alert('聊天功能开发中')}>
          💬 联系陪玩
        </button>
      </div>
    </>
  );
}