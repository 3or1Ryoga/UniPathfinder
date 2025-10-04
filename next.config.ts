import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 本番環境でのパフォーマンス最適化
  compress: true,
  poweredByHeader: false,
  
  // セキュリティヘッダーの設定
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // XSS保護
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // MIME type sniffing 防止
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Referrer ポリシー
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // XSS保護（レガシーブラウザ用）
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // Permissions Policy（機能制御）
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },

  // 本番環境でのイメージ最適化
  images: {
    formats: ['image/webp', 'image/avif'],
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // SWC minification is enabled by default in Next.js 15
  
  // 実験的機能（必要に応じて）
  experimental: {
    optimizePackageImports: ['@supabase/supabase-js'],
  },
};

export default nextConfig;
