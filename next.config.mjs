/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,

  // Tell Next.js/Turbopack these Node.js-only packages
  // should never be bundled for the browser or edge runtime
  serverExternalPackages: [
    'bullmq',
    'ioredis',
    '@prisma/client',
    'prisma',
    'pdfkit',
    'nodemailer',
    'firebase-admin',
    'googleapis',
  ],

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

  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin',  value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, PATCH, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, X-Requested-With' },
          { key: 'Access-Control-Max-Age',       value: '86400' },
        ],
      },
    ]
  },
}

export default nextConfig