/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,  // ← ADD THIS LINE

  serverExternalPackages: [
    'bullmq', 'ioredis', '@prisma/client', 'prisma',
    'pdfkit', 'nodemailer', 'firebase-admin',
    'googleapis', 'crypto', 'fs', 'path',
  ],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.medli.in', port: '', pathname: '/**' },
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
  eslint:     { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
}

export default nextConfig