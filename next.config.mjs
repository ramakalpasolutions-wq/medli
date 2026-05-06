// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: [
    '@prisma/client',
    'prisma',
    'bullmq',
    'ioredis',
    'pdfkit',
    'nodemailer',
    'firebase-admin',
    'googleapis',
    'jsonwebtoken',
    'bcryptjs',
  ],

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.r2.dev' },
      { protocol: 'https', hostname: '**.cloudflare.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '**.githubusercontent.com' },
      { protocol: 'https', hostname: 'cdn.medli.in' },
    ],
  },

  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin',  value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, PATCH, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, X-Requested-With' },
          { key: 'Access-Control-Max-Age',       value: '86400' },
          { key: 'ngrok-skip-browser-warning',   value: 'true' },
        ],
      },
    ]
  },

  typescript: {
    ignoreBuildErrors: true,
  },

  // ── Add this — shows more build output ──────────────────────────────────────
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
}

export default nextConfig