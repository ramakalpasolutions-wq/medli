// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  // ── Node.js-only packages — never bundle for browser/edge ──────────────────
  serverExternalPackages: [
    'bullmq',
    'ioredis',
    '@prisma/client',
    'prisma',
    'pdfkit',
    'nodemailer',
    'firebase-admin',
    'googleapis',
    'crypto',
    'fs',
    'path',
  ],

  // ── Images ──────────────────────────────────────────────────────────────────
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.medli.in',
        port:     '',
        pathname: '/**',
      },
    ],
  },

  // ── CORS Headers ────────────────────────────────────────────────────────────
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

  // ── TypeScript — ignore build errors ────────────────────────────────────────
  // eslint is NO longer configured here in Next.js 15+
  typescript: {
    ignoreBuildErrors: true,
  },
}

export default nextConfig