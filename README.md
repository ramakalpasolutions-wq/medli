# 🏥 MEDLI Healthcare Platform

A full-stack healthcare booking platform built with Next.js 14, Prisma, MongoDB, and Redis.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 App Router, Tailwind CSS, Framer Motion |
| Backend | Next.js API Routes, Prisma ORM |
| Database | MongoDB Atlas |
| Cache | Redis (Upstash) |
| Queue | BullMQ |
| Storage | Cloudflare R2 |
| Payments | HDFC CCAvenue |
| SMS | MSG91 |
| Email | SendGrid SMTP |
| Push | Firebase Admin |
| Auth | JWT (No OAuth) |

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Setup environment
cp .env.example .env.local
# Fill in all values

# 3. Setup database
npx prisma generate
npx prisma db push

# 4. Run development
npm run dev

# 5. Run worker (separate terminal)
npm run worker