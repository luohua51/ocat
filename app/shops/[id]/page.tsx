'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { TIER_COLORS } from '@/lib/mock';
import { proxyImage } from '@/lib/image';

type PriceItem = {
  tier: string;
  bossRank: string;
  pricePerHour: number;
};

type PlayerItem = {
  id: number;
  name: string;
  avatar: string;
  tier: string;
  certTier: string;
};

type GameSection = {
  gameId: number;
  gameName: string;
  gameLogo: string;
  benefit: string;
  prices: PriceItem[];
  players: PlayerItem[];
};

type ShopData = {
  id: number;
  name: string;
  logo: string;
  description: string;
  businessHours: string;
  contactWechat: string;
};

export default function ShopPage() {
  const params = useParams();
  const shopId = Number(params?.id);

  const [shop, setShop] = useState<ShopData | null>(null);
  const [sections, setSections] = useState<GameSection[]>([]);
  const [activeGame, setActiveGame] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!shopId) return;

    let cancelled = false;

    async function load() {
      try {
        const res = await fetch('/api/public/shop/' + shopId, {
          cache: 'no-store',
        });
        const d = await res.json();
        if (cancelled) return;

        if (!d.ok) {
          setError(d.error || '加载失败');
          setLoading(false);
          return;
        }

        setShop(d.shop);
        setSections(d.sections || []);
        if (d.sections && d.sections.length > 0) {
          setActiveGame(d.sections[0].gameId);
        }
        setLoading(false);
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || '网络错误');
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [shopId]);

  if (loading) {
    return (
      <Shell>
        <div className="empty">加载中…</div>
      </Shell>
    );
  }

  if (error || !shop) {
    return (
      <Shell>
        <div className="empty">{error || '店铺不存在'}</div>
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <Link href="/" className="member-more">
            ← 返回首页
          </Link>
        </div>
      </Shell>
    );
  }

  const current = sections.find((s) => s.gameId === activeGame);

  return (
    <Shell>
      {/* 店铺信息 */}
      <div className="shop-hero">
        <div className="shop-hero-logo">
          {shop.logo ? (
            <img src={proxyImage(shop.logo)} alt={shop.name} />
          ) : (
            shop.name.charAt(0)
          )}
        </div>
        <div className="shop-hero-info">
          <h1 className="shop-hero-name">{shop.name}</h1>
          <p className="shop-hero-desc">{shop.description || '专业陪玩团队'}</p>
          <div className="shop-hero-meta">
            {shop.businessHours && <span>⏰ {shop.businessHours}</span>}
            {shop.contactWechat && <span>💬 微信：{shop.contactWechat}</span>}
          </div>
        </div>
      </div>

      {sections.length === 0 ? (
        <div className="empty" style={{ marginTop: '2rem' }}>
          该店铺暂无可用服务
        </div>
      ) : (
        <>
          {/* 游戏分区切换 */}
          <div className="shop-tabs">
            {sections.map((s) => (
              <button
                key={s.gameId}
                className={
                  'shop-tab' + (activeGame === s.gameId ? ' active' : '')
                }
                onClick={() => setActiveGame(s.gameId)}
              >
                {s.gameLogo && (
                  <img
                    src={proxyImage(s.gameLogo)}
                    alt={s.gameName}
                    className="shop-tab-logo"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
                <span>{s.gameName}</span>
              </button>
            ))}
          </div>

          {current && (
            <div className="shop-content">
              {/* 老板权益 */}
              {current.benefit && (
                <div className="shop-section">
                  <div className="shop-section-title">
                    🎁 老板权益
                  </div>
                  <div className="shop-benefit">
                    {current.benefit.split('\n').map((line, i) => (
                      <div key={i} className="shop-benefit-line">
                        {line}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 价格表 */}
              {current.prices.length > 0 && (
                <div className="shop-section">
                  <div className="shop-section-title">
                    💰 {current.gameName}·价格表
                  </div>
                  <div className="shop-price-table">
                    {current.prices.map((p, i) => (
                      <div key={i} className="shop-price-row">
                        <div className="shop-price-left">
                          <span className="shop-price-tier">{p.tier}</span>
                          {p.bossRank && p.bossRank !== '通用' && (
                            <span className="shop-price-rank">
                              {p.bossRank}
                            </span>
                          )}
                        </div>
                        <div className="shop-price-right">
                          ¥{p.pricePerHour}
                          <span className="shop-price-unit">/时</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 该游戏陪玩 */}
              {current.players.length > 0 && (
                <div className="shop-section">
                  <div className="shop-section-title">
                    👥 {current.gameName}·本店陪玩
                  </div>
                  <div className="shop-player-grid">
                    {current.players.map((p) => (
                      <Link
                        key={p.id}
                        href={`/players/${p.id}`}
                        className="shop-player-card"
                      >
                        <div className="shop-player-avatar">
                          {p.avatar ? (
                            <img src={proxyImage(p.avatar)} alt={p.name} />
                          ) : (
                            p.name.charAt(0)
                          )}
                        </div>
                        <div className="shop-player-name">{p.name}</div>
                        <span
                          className="shop-player-tier"
                          style={{
                            background:
                              TIER_COLORS[
                                p.certTier as keyof typeof TIER_COLORS
                              ] || '#6b7280',
                          }}
                        >
                          {p.certTier}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {current.prices.length === 0 &&
                current.players.length === 0 &&
                !current.benefit && (
                  <div className="empty">该游戏暂无内容</div>
                )}
            </div>
          )}
        </>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <nav className="navbar">
        <div className="brand">🐱 陪玩平台</div>
        <div className="nav-links">
          <Link href="/">全部陪玩</Link>
          <Link href="/login">登录</Link>
        </div>
      </nav>
      <main className="main">{children}</main>
    </>
  );
}