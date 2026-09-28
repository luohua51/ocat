import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

/**
 * 公开接口：返回所有"player_id → shop + tier"的关联
 * 用 service_role 查询，绕过 RLS
 */
export async function GET() {
  if (!supabaseAdmin) {
    return Response.json({ ok: false, error: '服务器未配置' }, { status: 500 });
  }

  // 查所有陪玩账号的 shop_id
  const { data: users } = await supabaseAdmin
    .from('users')
    .select('id, player_id, shop_id')
    .eq('role', 'player')
    .not('player_id', 'is', null);

  // 查所有认证
  const { data: certs } = await supabaseAdmin
    .from('player_shops')
    .select('player_user_id, shop_id, tier')
    .eq('is_active', true);

  const relations: { playerId: number; shopId: number; tier: string }[] = [];

  // 优先用 player_shops 认证的档位
  (users || []).forEach((u: any) => {
    const userCerts = (certs || []).filter((c: any) => c.player_user_id === u.id);

    if (userCerts.length > 0) {
      userCerts.forEach((c: any) => {
        relations.push({
          playerId: u.player_id,
          shopId: c.shop_id,
          tier: c.tier,
        });
      });
    } else if (u.shop_id) {
      // 没认证记录，但有归属店铺：用 players.tier 兜底
      relations.push({
        playerId: u.player_id,
        shopId: u.shop_id,
        tier: '娱乐',
      });
    }
  });

  // 用 players.tier 覆盖兜底记录的档位（只有认证记录优先用认证档位）
  const { data: allPlayers } = await supabaseAdmin
    .from('players')
    .select('id, tier');

  const tierMap = new Map((allPlayers || []).map((p) => [p.id, p.tier]));

  const finalRelations = relations.map((r) => {
    // 如果这条是兜底来的（不在 player_shops 里的），用 players.tier
    const isCertified = (certs || []).some(
      (c: any) =>
        c.shop_id === r.shopId &&
        (users || []).find((u: any) => u.id === c.player_user_id)?.player_id === r.playerId
    );

    return {
      playerId: r.playerId,
      shopId: r.shopId,
      tier: isCertified ? r.tier : tierMap.get(r.playerId) || r.tier,
    };
  });

  return Response.json({ ok: true, relations: finalRelations });
}