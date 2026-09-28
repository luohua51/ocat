// ============================================================
// 类型定义
// ============================================================

export type Tier = '娱乐' | '技术' | '金牌' | '魔王' | '明星';

export type Player = {
  id: number;
  name: string;
  avatar: string;
  tier: Tier;
  games: string[];
  price: number;           // 最低价，用于列表显示
  signature: string;
  description: string;
  availableTime: string;
  weeklyOrders: number;
  rating: number;
  shopName: string;        // 空字符串 = 散陪
};

export type Order = {
  id: number;
  orderNo: string;
  memberName: string;
  playerId: number;
  playerName: string;
  shopName: string;
  game: string;
  tier: Tier;
  bossRank: string;
  hours: number;
  totalAmount: number;
  status: 'pending' | 'paid' | 'pooling' | 'locked' | 'in_service' | 'finished' | 'completed' | 'cancelled';
  createdAt: string;
};

export type Shop = {
  id: number;
  name: string;
  logo: string;
  description: string;
  playerCount: number;
  status: 'active' | 'suspended';
};

// ============================================================
// 字典
// ============================================================

export const GAMES = ['永劫无间', '无畏契约', '三角洲行动'];

export const TIERS: Tier[] = ['娱乐', '技术', '金牌', '魔王', '明星'];

export const TIER_COLORS: Record<Tier, string> = {
  明星: 'linear-gradient(135deg,#FF69B4,#FFD700)',
  魔王: 'linear-gradient(135deg,#8B0000,#FF4500)',
  金牌: 'linear-gradient(135deg,#FFB300,#FF7A00)',
  技术: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
  娱乐: '#6b7280',
};

// ============================================================
// 假数据：陪玩
// ============================================================

export const MOCK_PLAYERS: Player[] = [
  {
    id: 1,
    name: '鸽子',
    avatar: '',
    tier: '技术',
    games: ['永劫无间', '无畏契约'],
    price: 30,
    signature: '泥真的要点一单客服嘛',
    description: '主玩永劫无间三排天选模式，擅长长剑+阔刀，团队意识拉满。语音成熟稳重，心态好不压力，带你稳定吃鸡。',
    availableTime: '每日 18:00 - 02:00',
    weeklyOrders: 45,
    rating: 98,
    shopName: '橙猫猫电竞',
  },
  {
    id: 2,
    name: '雨眠',
    avatar: '',
    tier: '娱乐',
    games: ['永劫无间'],
    price: 25,
    signature: '甜萌萝莉音，双区娱乐全程陪',
    description: '永劫无间主玩玉玲珑/殷紫萍，声音软萌，会撒娇会鼓励，陪玩体验拉满，情绪稳定，温柔的情绪树洞。',
    availableTime: '每日 21:00 - 06:00',
    weeklyOrders: 38,
    rating: 99,
    shopName: '',
  },
  {
    id: 3,
    name: '巴掌印',
    avatar: '',
    tier: '娱乐',
    games: ['无畏契约', '三角洲行动'],
    price: 35,
    signature: '三区全能御姐，瓦洲机密向导',
    description: '心态好脾气好不矫情，无敌尬聊王，偶尔小c。瓦除一突所有位置可补，洲主玩支援/信息，对枪打得过保护你，打不过保佑你。',
    availableTime: '全天可约',
    weeklyOrders: 52,
    rating: 99,
    shopName: '橙猫猫电竞',
  },
  {
    id: 4,
    name: '小憋',
    avatar: '',
    tier: '魔王',
    games: ['永劫无间'],
    price: 90,
    signature: '想不想看看火男玩家们在干什么',
    description: '永劫无间单排天人前百，你的三排v2狂战火老公。',
    availableTime: '每日 21:00 - 06:00',
    weeklyOrders: 48,
    rating: 99,
    shopName: '橙猫猫电竞',
  },
  {
    id: 5,
    name: '莫遮',
    avatar: '',
    tier: '娱乐',
    games: ['永劫无间', '三角洲行动'],
    price: 30,
    signature: '双区娱乐+机密，节奏稳心态好',
    description: '永劫主玩岳山，给队友配合。三角洲主玩信息位，熟悉机密各地图打法思路。心态好，爆点沟通积极。',
    availableTime: '每日 16:00 - 00:00',
    weeklyOrders: 30,
    rating: 95,
    shopName: '',
  },
  {
    id: 6,
    name: '丸子',
    avatar: '',
    tier: '娱乐',
    games: ['无畏契约', '三角洲行动'],
    price: 40,
    signature: '瓦洲双修，元气少女',
    description: '无畏契约主玩烟位、哨位，三角洲主玩蜂医、麦晓雯（喜欢跑刀的囤囤鼠一枚呀），元气少女音，活泼嘴甜有分寸。',
    availableTime: '每日 15:00 - 01:00',
    weeklyOrders: 56,
    rating: 100,
    shopName: '橙猫猫电竞',
  },
  {
    id: 7,
    name: '临沐',
    avatar: '',
    tier: '金牌',
    games: ['无畏契约', '三角洲行动'],
    price: 60,
    signature: '三角洲全能补位，瓦区哨位精通',
    description: '无畏契约主玩哨位，残局兜底的神。三角洲主玩一号位，先打懦夫后打药。',
    availableTime: '每日 20:00 - 03:00',
    weeklyOrders: 41,
    rating: 99,
    shopName: '橙猫猫电竞',
  },
  {
    id: 8,
    name: '小运',
    avatar: '',
    tier: '技术',
    games: ['永劫无间'],
    price: 55,
    signature: '国服沙男，单排导师精通蓝白博弈',
    description: '永劫无间国服前100，精通双截棍，长棍，太刀，会抖枪术一些技巧。适合想冲段位、学英雄的玩家。',
    availableTime: '每日 20:00 - 02:00',
    weeklyOrders: 37,
    rating: 99,
    shopName: '',
  },
];

// ============================================================
// 假数据：订单
// ============================================================

export const MOCK_ORDERS: Order[] = [
  {
    id: 1,
    orderNo: 'OC20260928001',
    memberName: '老板A',
    playerId: 1,
    playerName: '鸽子',
    shopName: '橙猫猫电竞',
    game: '永劫无间',
    tier: '技术',
    bossRank: '修罗',
    hours: 2,
    totalAmount: 120,
    status: 'completed',
    createdAt: '2026-09-28 10:23',
  },
  {
    id: 2,
    orderNo: 'OC20260928002',
    memberName: '老板B',
    playerId: 2,
    playerName: '雨眠',
    shopName: '',
    game: '永劫无间',
    tier: '娱乐',
    bossRank: '蚀月',
    hours: 1.5,
    totalAmount: 37.5,
    status: 'in_service',
    createdAt: '2026-09-28 11:05',
  },
  {
    id: 3,
    orderNo: 'OC20260928003',
    memberName: '老板C',
    playerId: 4,
    playerName: '小憋',
    shopName: '橙猫猫电竞',
    game: '永劫无间',
    tier: '魔王',
    bossRank: '龙王',
    hours: 1,
    totalAmount: 90,
    status: 'pooling',
    createdAt: '2026-09-28 11:30',
  },
];

// ============================================================
// 假数据：店铺
// ============================================================

export const MOCK_SHOPS: Shop[] = [
  {
    id: 1,
    name: '橙猫猫电竞',
    logo: '',
    description: '平台自营店铺，专业陪玩团队',
    playerCount: 5,
    status: 'active',
  },
  {
    id: 2,
    name: '星辰电竞',
    logo: '',
    description: '老牌陪玩店铺，国服打手云集',
    playerCount: 12,
    status: 'active',
  },
];

// ============================================================
// 假数据：超级管理员账号
// ============================================================

export const SUPER_ADMIN = {
  username: 'cmmluohua',
  password: 'heqq0501',
  role: 'super_admin',
  nickname: '超级管理员',
};

// ============================================================
// 假数据：游戏管理
// ============================================================
export type Game = {
  id: number;
  name: string;
  logo: string;
  ranks: string[];
  sortOrder: number;
  status: 'active' | 'disabled';
};

export const MOCK_GAMES: Game[] = [
  {
    id: 1,
    name: '永劫无间',
    logo: '',
    ranks: ['蚀月', '坠日', '修罗', '龙王'],
    sortOrder: 1,
    status: 'active',
  },
  {
    id: 2,
    name: '无畏契约',
    logo: '',
    ranks: ['匹配', '下四', '铂金', '钻石', '超凡', '神话', '赋能'],
    sortOrder: 2,
    status: 'active',
  },
  {
    id: 3,
    name: '三角洲行动',
    logo: '',
    ranks: ['机密', '绝密'],
    sortOrder: 3,
    status: 'active',
  },
];

// ============================================================
// 假数据：会员管理
// ============================================================
export type Member = {
  id: string;
  username: string;
  nickname: string;
  balance: number;
  role: 'member' | 'operator';
  createdAt: string;
};

export const MOCK_MEMBERS: Member[] = [
  {
    id: 'm001',
    username: 'boss01',
    nickname: '老板A',
    balance: 200,
    role: 'member',
    createdAt: '2026-09-01 10:00',
  },
  {
    id: 'm002',
    username: 'boss02',
    nickname: '老板B',
    balance: 88.5,
    role: 'member',
    createdAt: '2026-09-05 15:30',
  },
  {
    id: 'm003',
    username: 'boss03',
    nickname: '老板C',
    balance: 350,
    role: 'member',
    createdAt: '2026-09-10 09:20',
  },
  {
    id: 'm004',
    username: 'operator01',
    nickname: '客服小张',
    balance: 0,
    role: 'operator',
    createdAt: '2026-09-15 14:00',
  },
];

// ============================================================
// 假数据：全局流水
// ============================================================
export type Transaction = {
  id: number;
  type: 'recharge' | 'consume';
  memberName: string;
  amount: number;
  balanceAfter: number;
  operator: string;
  description: string;
  createdAt: string;
};

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 1,
    type: 'recharge',
    memberName: '老板A',
    amount: 100,
    balanceAfter: 200,
    operator: 'cmmluohua',
    description: '人工充值',
    createdAt: '2026-09-28 10:00',
  },
  {
    id: 2,
    type: 'consume',
    memberName: '老板A',
    amount: 120,
    balanceAfter: 80,
    operator: 'cmmluohua',
    description: '永劫无间·鸽子·2小时',
    createdAt: '2026-09-28 10:30',
  },
  {
    id: 3,
    type: 'recharge',
    memberName: '老板B',
    amount: 50,
    balanceAfter: 88.5,
    operator: '客服小张',
    description: '人工充值',
    createdAt: '2026-09-28 11:00',
  },
  {
    id: 4,
    type: 'consume',
    memberName: '老板B',
    amount: 37.5,
    balanceAfter: 51,
    operator: '客服小张',
    description: '永劫无间·雨眠·1.5小时',
    createdAt: '2026-09-28 11:10',
  },
];

// ============================================================
// 假数据：投诉仲裁
// ============================================================
export type Dispute = {
  id: number;
  orderNo: string;
  memberName: string;
  playerName: string;
  reason: string;
  status: 'pending' | 'resolved' | 'rejected';
  createdAt: string;
};

export const MOCK_DISPUTES: Dispute[] = [
  {
    id: 1,
    orderNo: 'OC20260928001',
    memberName: '老板A',
    playerName: '鸽子',
    reason: '陪玩中途掉线，未完成服务',
    status: 'pending',
    createdAt: '2026-09-28 11:30',
  },
  {
    id: 2,
    orderNo: 'OC20260927002',
    memberName: '老板B',
    playerName: '雨眠',
    reason: '服务态度不佳',
    status: 'resolved',
    createdAt: '2026-09-27 20:00',
  },
];



// ============================================================
// 假数据：陪玩钱包
// ============================================================
export const MOCK_PLAYER_WALLET = {
  balance: 1250.5,
  totalIncome: 3480.0,
  totalWithdrawn: 2229.5,
};

export type Withdrawal = {
  id: number;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
};

export const MOCK_PLAYER_WITHDRAWALS: Withdrawal[] = [
  { id: 1, amount: 500, status: 'approved', createdAt: '2026-09-20 10:00' },
  { id: 2, amount: 300, status: 'pending', createdAt: '2026-09-27 15:30' },
];

// ============================================================
// 假数据：陪玩散陪价
// ============================================================
export type PlayerPrice = {
  id: number;
  game: string;
  tier: '娱乐' | '技术';
  pricePerHour: number;
};

export const MOCK_PLAYER_PRICES: PlayerPrice[] = [
  { id: 1, game: '永劫无间', tier: '娱乐', pricePerHour: 30 },
  { id: 2, game: '永劫无间', tier: '技术', pricePerHour: 50 },
  { id: 3, game: '无畏契约', tier: '娱乐', pricePerHour: 35 },
  { id: 4, game: '无畏契约', tier: '技术', pricePerHour: 60 },
];


// ============================================================
// 假数据：店铺陪玩关联
// ============================================================
export type ShopPlayer = {
  id: number;
  playerId: number;
  playerName: string;
  tier: '娱乐' | '技术' | '金牌' | '魔王' | '明星';
  isActive: boolean;
  joinedAt: string;
};

export const MOCK_SHOP_PLAYERS: ShopPlayer[] = [
  { id: 1, playerId: 1, playerName: '鸽子', tier: '技术', isActive: true, joinedAt: '2026-08-15' },
  { id: 2, playerId: 3, playerName: '巴掌印', tier: '娱乐', isActive: true, joinedAt: '2026-08-20' },
  { id: 3, playerId: 4, playerName: '小憋', tier: '魔王', isActive: true, joinedAt: '2026-08-10' },
  { id: 4, playerId: 6, playerName: '丸子', tier: '娱乐', isActive: true, joinedAt: '2026-09-01' },
  { id: 5, playerId: 7, playerName: '临沐', tier: '金牌', isActive: true, joinedAt: '2026-08-25' },
];

// ============================================================
// 假数据：店铺价格
// ============================================================
export type ShopPrice = {
  id: number;
  game: string;
  tier: '娱乐' | '技术' | '金牌' | '魔王' | '明星';
  bossRank: string;
  pricePerHour: number;
};

export const MOCK_SHOP_PRICES: ShopPrice[] = [
  { id: 1, game: '永劫无间', tier: '娱乐', bossRank: '蚀月', pricePerHour: 35 },
  { id: 2, game: '永劫无间', tier: '娱乐', bossRank: '修罗', pricePerHour: 45 },
  { id: 3, game: '永劫无间', tier: '技术', bossRank: '修罗', pricePerHour: 70 },
  { id: 4, game: '永劫无间', tier: '金牌', bossRank: '任意', pricePerHour: 90 },
  { id: 5, game: '永劫无间', tier: '魔王', bossRank: '任意', pricePerHour: 120 },
  { id: 6, game: '无畏契约', tier: '技术', bossRank: '钻石', pricePerHour: 80 },
];

// ============================================================
// 假数据：店铺抽成
// ============================================================
export type ShopCommission = {
  tier: '娱乐' | '技术' | '金牌' | '魔王' | '明星';
  rate: number; // 0.15 = 15%
};

export const MOCK_SHOP_COMMISSIONS: ShopCommission[] = [
  { tier: '娱乐', rate: 0.10 },
  { tier: '技术', rate: 0.15 },
  { tier: '金牌', rate: 0.20 },
  { tier: '魔王', rate: 0.25 },
  { tier: '明星', rate: 0.30 },
];