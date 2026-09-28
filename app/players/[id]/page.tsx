import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { TIER_COLORS } from '@/lib/mock';

export const dynamic = 'force-dynamic';

type Props = {
  params: { id: string };
};

export default async function PlayerDetailPage({ params }: Props) {
  const playerId = Number(params.id);
  if (!playerId) notFound();

  if (!supabase) {
    return (
      <>
        <nav className="navbar">
          <div className="brand">🐱 陪玩平台</div>
          <div className="nav-links">
            <Link href="/">全部陪玩</Link>
            <Link href="/login">登录</Link>
          </div>
        </nav>
        <main className="main">
          <div className="empty">数据库未配置</div>
        </main>
      </>
    );
  }

  // 1. 基础信息
  const { data: player } = await supabase
    .from('players')
    .select('id, name, avatar, audio, tier, weekly_orders, rating, status')
    .eq('id', playerId)
    .maybeSingle();

  if (!player) notFound();

  // 2. 资料
  const { data: profile } = await supabase
    .from('player_profiles')
    .select('signature, description, rank_text, available_time')
    .eq('player_id', playerId)
    .maybeSingle();

  // 3. 能力
  const { data: capabilities } = await supabase
    .from('player_capabilities')
    .select('game_id, tier')
    .eq('player_id', playerId)
    .eq('is_active', true);

  const gameIds = [...new Set((capabilities || []).map((c: any) => c.game_id))];

  const { data: gamesData } = await supabase
    .from('games')
    .select('id, name')
    .in('id', gameIds.length > 0 ? gameIds : [-1]);

  const gameNames = (capabilities || [])
    .map((c: any) => (gamesData || []).find((g: any) => g.id === c.game_id)?.name)
    .filter(Boolean);
  const uniqueGames = [...new Set(gameNames)] as string[];

  // 4. 散陪价
  const { data: prices } = await supabase
    .from('player_prices')
    .select('price_per_hour, tier')
    .eq('player_id', playerId)
    .eq('is_active', true);

  const priceList = (prices || []).map((p: any) => Number(p.price_per_hour));
  const minPrice = priceList.length > 0 ? Math.min(...priceList) : 0;
  const hasFreelance = (prices || []).length > 0;

  // 5. 店铺认证（可能有多家）
  const { data: playerUser } = await supabase
    .from('users')
    .select('id, shop_id')
    .eq('player_id', playerId)
    .maybeSingle();

  const certList: { shopName: string; tier: string; price: number }[] = [];

  if (playerUser) {
    const { data: certs } = await supabase
      .from('player_shops')
      .select('shop_id, tier')
      .eq('player_user_id', playerUser.id)
      .eq('is_active', true);

    const shopIds = [...new Set((certs || []).map((c: any) => c.shop_id))];

    const { data: shops } = await supabase
      .from('shops')
      .select('id, name')
      .in('id', shopIds.length > 0 ? shopIds : [-1]);

    (certs || []).forEach((c: any) => {
      const shop = (shops || []).find((s: any) => s.id === c.shop_id);
      if (shop) {
        certList.push({
          shopName: shop.name,
          tier: c.tier,
          price: 0,
        });
      }
    });
  }

  const statusText =
    player.status === 'online'
      ? '🟢 在线'
      : player.status === 'busy'
      ? '🟠 忙碌'
      : '⚪ 离线';

  // 主档位（用于显示名字旁边的大标签）
  const mainTier = certList.length > 0 ? certList[0].tier : player.tier;

  return (
    <>
      <nav className="navbar">
        <div className="brand">🐱 陪玩平台</div>
        <div className="nav-links">
          <Link href="/">全部陪玩</Link>
          <Link href="/login">登录</Link>
        </div>
      </nav>

      <main className="main">
        <div className="detail-card">
          <div className="detail-avatar">
            {player.avatar ? (
              <img src={player.avatar} alt={player.name} />
            ) : (
              player.name.charAt(0)
            )}
          </div>

          <div className="detail-name">
            {player.name}
            <span
              style={{
                marginLeft: '0.5rem',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: '#fff',
                padding: '0.2rem 0.7rem',
                borderRadius: '999px',
                background:
                  TIER_COLORS[mainTier as keyof typeof TIER_COLORS] || '#6b7280',
                verticalAlign: 'middle',
              }}
            >
              {mainTier}
            </span>
          </div>

          {/* 身份标签：店陪 / 散陪 */}
          <div className="detail-identities">
            {certList.length > 0 &&
              certList.map((c) => (
                <span key={c.shopName + c.tier} className="identity-tag shop">
                  {c.shopName}.{c.tier}
                </span>
              ))}

            {hasFreelance && (
              <span className="identity-tag freelance">
                散陪.{player.tier}
              </span>
            )}

            {certList.length === 0 && !hasFreelance && (
              <span className="identity-tag pending">暂未开放接单</span>
            )}
          </div>

          <div className="detail-sub" style={{ marginTop: '0.6rem' }}>
            {statusText}
          </div>

          <div className="stat-grid">
            <div className="stat-box" style={{ background: '#FFF3E6' }}>
              <div className="stat-num" style={{ color: '#F97316' }}>
                {player.weekly_orders || 0}
              </div>
              <div className="stat-label">上周接单</div>
            </div>
            <div className="stat-box" style={{ background: '#ECFDF5' }}>
              <div className="stat-num" style={{ color: '#059669' }}>
                {player.rating || 100}%
              </div>
              <div className="stat-label">好评率</div>
            </div>
            <div className="stat-box" style={{ background: '#FFFBEB' }}>
              <div className="stat-num" style={{ color: '#D97706' }}>
                {minPrice > 0 ? `¥${minPrice}` : '--'}
              </div>
              <div className="stat-label">最低/时</div>
            </div>
          </div>

          {uniqueGames.length > 0 && (
            <div className="section">
              <div className="section-title">可接游戏</div>
              <div className="tag-row">
                {uniqueGames.map((g) => (
                  <span key={g} className="tag">
                    {g}
                  </span>
                ))}
              </div>
            </div>
          )}

          {profile?.available_time && (
            <div className="section">
              <div className="section-title">接单时间</div>
              <div style={{ color: '#F97316', fontWeight: 600 }}>
                ⏰ {profile.available_time}
              </div>
            </div>
          )}

          {profile?.rank_text && (
            <div className="section">
              <div className="section-title">段位</div>
              <div className="detail-text">{profile.rank_text}</div>
            </div>
          )}

          {profile?.signature && (
            <div className="section">
              <div className="section-title">个性签名</div>
              <div className="detail-text">{profile.signature}</div>
            </div>
          )}

          {profile?.description && (
            <div className="section">
              <div className="section-title">个人介绍</div>
              <div className="detail-text">{profile.description}</div>
            </div>
          )}

          {player.audio && (
            <div className="section">
              <div className="section-title">语音试听</div>
              <audio
                controls
                src={player.audio}
                style={{ width: '100%', marginTop: '0.5rem' }}
              />
            </div>
          )}

          <Link
            href={`/login?redirect=/member/create?playerId=${player.id}`}
            className="book-btn"
          >
            🔥 立即预约
          </Link>
        </div>
      </main>
    </>
  );
}