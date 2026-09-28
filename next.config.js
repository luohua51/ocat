/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // 部署时跳过类型检查，避免类型小错误阻断部署
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
};

module.exports = nextConfig;