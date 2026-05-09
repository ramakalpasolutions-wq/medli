import { prisma } from '@/lib/prisma'

/**
 * AuditLog schema fields:
 *   actorId, actorRole, action, targetType, targetId,
 *   details (Json), ipAddress, createdAt
 */
export async function createAuditLog({
  actorId    = null,
  actorRole  = null,
  action,
  targetType = null,
  targetId   = null,
  ipAddress  = 'unknown',
  userAgent  = '',
  details    = null,
  oldValues  = null,
  newValues  = null,
}) {
  try {
    const detailsPayload = {
      ...(details   || {}),
      ...(oldValues ? { oldValues } : {}),
      ...(newValues ? { newValues } : {}),
      ...(userAgent ? { userAgent } : {}),
    }

    await prisma.auditLog.create({
      data: {
        actorId:    actorId    || undefined,
        actorRole:  actorRole  || undefined,
        action,
        targetType: targetType || undefined,
        targetId:   targetId   || undefined,
        ipAddress,
        details:    Object.keys(detailsPayload).length > 0
                      ? detailsPayload
                      : undefined,
      },
    })
  } catch (error) {
    // Never crash the main request
    console.error('[AuditLog] Failed:', error?.message)
  }
}

/**
 * logAdminAction — convenient alias used by admin routes.
 *
 * Usage:
 *   await logAdminAction(request, user, 'CANCEL_SETTLEMENT', 'Settlement', id, {
 *     reason: 'duplicate'
 *   })
 */
export async function logAdminAction(
  request,
  user,
  action,
  targetType,
  targetId,
  details = {},
) {
  const ip = request?.headers?.get('x-forwarded-for') ||
             request?.headers?.get('x-real-ip') ||
             'unknown'
  const ua = request?.headers?.get('user-agent') || ''

  return createAuditLog({
    actorId:    user?.userId || user?.id || null,
    actorRole:  user?.role   || null,
    action,
    targetType: targetType   || null,
    targetId:   targetId     || null,
    ipAddress:  ip,
    userAgent:  ua,
    details,
  })
}

/**
 * withAuditLog — wraps a handler and logs after success.
 */
export async function withAuditLog(request, logParams, handler) {
  const response = await handler(request)
  if (response?.status >= 200 && response?.status < 300) {
    const ip = request.headers.get('x-forwarded-for') ||
               request.headers.get('x-real-ip') || 'unknown'
    await createAuditLog({ ipAddress: ip, ...logParams })
  }
  return response
}

export default { createAuditLog, logAdminAction, withAuditLog }