'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchHallOrders, acceptOrder, type Order } from '@/lib/order';
import { getOrCreateConversation } from '@/lib/chat';

export default function PlayerHallPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<number | null>(null);
  const [chatting, setChatting] = useState<number | null>(null);

  async function load() {
    const list = await fetchHallOrders();
    setOrders(list);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAccept(order: Order) {
    if (!confirm(`确认接单？\n${order.game_name} · ${order.tier} · ${order.duration_hours}h`)) return;
    setAccepting(order.id);
    const result = await acceptOrder(order.id);
    setAccepting(null);
    if (!result.ok) {
      alert(result.error || '接单失败');
      load();
      return;
    }
    alert('接单成功！');
    router.push('/player/orders/' + order.id);
  }

  async function handleChat(order: Order) {
    setChatting(order.id);
    const result = await getOrCreateConversation({ orderId: order.id });
    setChatting(null);

    if (!result.ok || !result.conversation) {
      alert(result.error || '无法打开会话');
      return;
    }
    router.push('/player/chat/' + result.conversation.id);
  }

  return (
    <>
      <div className="player-header">
        <h1 className="player-title">🔥 抢单大厅</h1>
        <p className="player-subtitle">
          {loading ? '加载中…' : `共 ${orders.length} 条订单等你接`}
        </p>
      </div>

      {loading ? (
        <div className="player-empty">加载中…</div>
      ) : orders.length === 0 ? (
        <div className="player-empty">当前没有可接的订单，稍后刷新看看</div>
      ) : (
        <div className="player-hall-list">
          {orders.map((o) => (
            <div key={o.id} className="player-hall-item">
              <div className="player-hall-top">
                <div className="player-hall-order">
                  <span className="player-hall-game">{o.game_name}</span>
                  <span className="player-hall-tier">{o.tier}</span>
                </div>
                <div className="player-hall-amount" style={{ color: '#818cf8', fontSize: '0.95rem' }}>
                  价格待定
                </div>
              </div>

              <div className="player-hall-info">
                <div>老板：{o.member_name}</div>
                <div>段位：{o.boss_rank || '未填'}</div>
                <div>时长：{o.duration_hours} 小时</div>
                <div>身份：{o.identity_type === 'freelance' ? '散陪单' : '店铺单'}</div>
              </div>

              {o.remark && (
                <div
                  style={{
                    fontSize: '0.82rem',
                    color: 'rgba(255,255,255,0.5)',
                    marginBottom: '0.8rem',
                    padding: '0.5rem 0.8rem',
                    background: 'rgba(255,255,255,0.04)',
                    borderRadius: '0.5rem',
                  }}
                >
                  📝 {o.remark}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                <Link
                  href={`/player/orders/${o.id}`}
                  className="player-btn-ghost"
                  style={{ textAlign: 'center', textDecoration: 'none', padding: '0.7rem' }}
                >
                  查看详情
                </Link>
                <button
                  className="player-btn-ghost"
                  onClick={() => handleChat(o)}
                  disabled={chatting === o.id}
                  style={{ padding: '0.7rem', borderColor: 'rgba(99,102,241,0.4)', color: '#818cf8' }}
                >
                  {chatting === o.id ? '打开中…' : '💬 联系老板'}
                </button>
                <button
                  className="player-btn-primary"
                  onClick={() => handleAccept(o)}
                  disabled={accepting === o.id}
                  style={{ padding: '0.7rem' }}
                >
                  {accepting === o.id ? '接单中…' : '🔥 接单'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="player-note" style={{ marginTop: '1.5rem' }}>
        💡 抢单池中，所有陪玩都能联系老板。一旦有人接单，其他陪玩无法继续发消息。
      </div>
    </>
  );
}