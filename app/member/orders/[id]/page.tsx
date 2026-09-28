'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  fetchOrder,
  cancelOrder,
  confirmOrder,
  fetchOrderReviews,
  ORDER_STATUS_TEXT,
  ORDER_STATUS_COLOR,
  type Order,
  type Review,
} from '@/lib/order';
import { getOrCreateConversation } from '@/lib/chat';
import ReviewModal from '@/components/ReviewModal';

export default function MemberOrderDetailPage() {
  const params = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [myReview, setMyReview] = useState<Review | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  async function load() {
    const [o, r] = await Promise.all([
      fetchOrder(Number(params.id)),
      fetchOrderReviews(Number(params.id)),
    ]);
    setOrder(o);
    setMyReview(r.myReview);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [params.id]);

  async function handleCancel() {
    if (!order) return;
    if (!confirm('确定撤销这笔订单？撤销后不可恢复。')) return;
    setWorking(true);
    const r = await cancelOrder(order.id);
    setWorking(false);
    if (!r.ok) return alert(r.error || '撤销失败');
    alert('订单已撤销');
    load();
  }

  async function handleConfirm() {
    if (!order) return;
    if (!confirm('确认订单已完成？确认后平台将结算给陪玩。')) return;
    setWorking(true);
    const r = await confirmOrder(order.id);
    setWorking(false);
    if (!r.ok) return alert(r.error || '操作失败');
    alert('已确认完成');
    load();
  }

  async function handleChat() {
    if (!order) return;
    setChatLoading(true);
    const r = await getOrCreateConversation({ orderId: order.id });
    setChatLoading(false);

    if (!r.ok || !r.conversation) {
      alert(r.error || '无法打开会话');
      return;
    }

    window.location.href = '/member/chat/' + r.conversation.id;
  }

  if (loading) return <div className="member-empty">加载中…</div>;

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

  const isPendingPrice = order.final_amount === 0;
  const canCancel = ['pending_player', 'pooling'].includes(order.status);
  const canConfirm = order.status === 'finished';
  const canReview = order.status === 'completed' && !myReview;

  return (
    <>
      <div className="member-header">
        <Link href="/member/orders" className="member-more">
          ← 返回
        </Link>
        <h1 className="member-title" style={{ marginTop: '0.5rem' }}>
          订单详情
        </h1>
        <p className="member-subtitle">订单号 {order.order_no}</p>
      </div>

      <div className="member-detail-card">
        <div className="member-detail-status">
          <span
            className="member-order-tag"
            style={{
              fontSize: '0.85rem',
              padding: '0.3rem 0.9rem',
              background:
                (ORDER_STATUS_COLOR[order.status] || '#6b7280') + '22',
              color: ORDER_STATUS_COLOR[order.status] || '#6b7280',
            }}
          >
            {ORDER_STATUS_TEXT[order.status] || order.status}
          </span>
        </div>

        <div className="member-detail-rows">
          <div className="member-detail-row">
            <span className="member-detail-key">陪玩</span>
            <span className="member-detail-val">
              {order.player_name || '🎯 不指定（抢单池中）'}
            </span>
          </div>
          <div className="member-detail-row">
            <span className="member-detail-key">身份</span>
            <span className="member-detail-val">
              {order.identity_type === 'freelance' ? '散陪' : '店铺'}
            </span>
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
          {!isPendingPrice && (
            <div className="member-detail-row">
              <span className="member-detail-key">单价</span>
              <span className="member-detail-val">
                ¥{order.unit_price.toFixed(2)}/时
              </span>
            </div>
          )}
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
              style={{
                color: isPendingPrice ? '#818cf8' : '#FF7A00',
                fontSize: isPendingPrice ? '1rem' : '1.3rem',
                fontWeight: 800,
              }}
            >
              {isPendingPrice
                ? '待接单后确定'
                : `¥${order.final_amount.toFixed(2)}`}
            </span>
          </div>
        </div>
      </div>

      {myReview && (
        <div className="member-detail-card">
          <div
            className="member-section-title"
            style={{ marginBottom: '0.8rem' }}
          >
            我的评价
          </div>
          <div className="review-display">
            <div className="review-display-stars">
              {[1, 2, 3, 4, 5].map((n) => (
                <span key={n} className={n <= myReview.rating ? 'active' : ''}>
                  ★
                </span>
              ))}
            </div>
            {myReview.tags && myReview.tags.length > 0 && (
              <div
                className="review-tags"
                style={{ marginTop: '0.6rem', marginBottom: '0.6rem' }}
              >
                {myReview.tags.map((t) => (
                  <span
                    key={t}
                    className="review-tag active"
                    style={{ cursor: 'default' }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
            {myReview.content && (
              <div
                style={{
                  fontSize: '0.9rem',
                  color: 'rgba(255,255,255,0.8)',
                  lineHeight: 1.7,
                }}
              >
                {myReview.content}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="member-detail-actions">
        {order.player_id ? (
          <button
            className="member-btn-ghost"
            onClick={handleChat}
            disabled={chatLoading}
          >
            {chatLoading ? '打开中…' : '💬 联系陪玩'}
          </button>
        ) : (
          <button className="member-btn-ghost" disabled>
            ⏳ 等待陪玩接单
          </button>
        )}

        {canCancel && (
          <button
            className="member-btn-ghost"
            style={{
              borderColor: 'rgba(220,38,38,0.4)',
              color: '#f87171',
            }}
            onClick={handleCancel}
            disabled={working}
          >
            {working ? '处理中…' : '撤销订单'}
          </button>
        )}

        {canConfirm && (
          <button
            className="member-btn-primary"
            onClick={handleConfirm}
            disabled={working}
          >
            {working ? '处理中…' : '✅ 确认完成'}
          </button>
        )}

        {canReview && (
          <button
            className="member-btn-primary"
            onClick={() => setShowReview(true)}
          >
            ⭐ 评价陪玩
          </button>
        )}
      </div>

      {showReview && order.player_name && (
        <ReviewModal
          orderId={order.id}
          toName={order.player_name}
          toRole="player"
          onClose={() => setShowReview(false)}
          onSuccess={() => {
            setShowReview(false);
            alert('评价成功！');
            load();
          }}
        />
      )}
    </>
  );
}