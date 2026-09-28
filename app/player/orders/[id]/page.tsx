'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  fetchOrder,
  startOrder,
  finishOrder,
  fetchOrderReviews,
  ORDER_STATUS_TEXT,
  type Order,
  type Review,
} from '@/lib/order';
import { getOrCreateConversation } from '@/lib/chat';
import ReviewModal from '@/components/ReviewModal';

export default function PlayerOrderDetailPage() {
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

  async function handleChat() {
    if (!order) return;
    setChatLoading(true);
    const r = await getOrCreateConversation({ orderId: order.id });
    setChatLoading(false);

    if (!r.ok || !r.conversation) {
      alert(r.error || '无法打开会话');
      return;
    }

    window.location.href = '/player/chat/' + r.conversation.id;
  }

  if (loading) return <div className="player-empty">加载中…</div>;

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

  const canReview = order.status === 'completed' && !myReview;

  return (
    <>
      <div className="player-header">
        <Link href="/player/orders" className="player-more">
          ← 返回
        </Link>
        <h1 className="player-title" style={{ marginTop: '0.5rem' }}>
          订单详情
        </h1>
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
            <span className="player-detail-val">
              {order.boss_rank || '未填'}
            </span>
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
                style={{
                  color: '#059669',
                  fontSize: '1.3rem',
                  fontWeight: 800,
                }}
              >
                ¥{order.player_income.toFixed(2)}
              </span>
            </div>
          )}
        </div>
      </div>

      {myReview && (
        <div className="player-detail-card">
          <div
            className="player-section-title"
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

      <div className="player-detail-actions">
        <button
          className="player-btn-ghost"
          onClick={handleChat}
          disabled={chatLoading}
        >
          {chatLoading ? '打开中…' : '💬 联系老板'}
        </button>

        {order.status === 'locked' && (
          <button
            className="player-btn-primary"
            onClick={handleStart}
            disabled={working}
          >
            {working ? '处理中…' : '▶ 开始服务'}
          </button>
        )}

        {order.status === 'in_service' && (
          <button
            className="player-btn-primary"
            onClick={handleFinish}
            disabled={working}
          >
            {working ? '处理中…' : '✅ 完成服务'}
          </button>
        )}

        {order.status === 'finished' && (
          <button className="player-btn-primary disabled" disabled>
            等待老板确认
          </button>
        )}

        {canReview && (
          <button
            className="player-btn-primary"
            onClick={() => setShowReview(true)}
          >
            ⭐ 评价老板
          </button>
        )}
      </div>

      {showReview && (
        <ReviewModal
          orderId={order.id}
          toName={order.member_name}
          toRole="member"
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