// src/lib/middleware/audit.middleware.js
// ⚠️ SAVE THIS FILE — then restart: rm -rf .next && npm run dev
import prisma from '@/lib/prisma'

export async function logAdminAction({
  actorId    = null,
  actorRole  = null,
  action     = 'unknown',
  targetType = null,
  targetId   = null,
  details    = null,
  request    = null,
}) {
  try {
    let ipAddress = null
    if (request?.headers) {
      ipAddress =
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        request.headers.get('x-real-ip') ||
        null
    }
    await prisma.auditLog.create({
      data: {
        actorId:    actorId    || null,
        actorRole:  actorRole  || null,
        action:     String(action),
        targetType: targetType || null,
        targetId:   targetId   || null,
        details:    details    || null,
        ipAddress:  ipAddress  || null,
      },
    })
  } catch (err) {
    console.warn('[AuditLog silent fail]', err.message)
  }
}

export default logAdminAction