import prisma from '@/lib/prisma'
import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { checkRole } from '@/lib/middleware/rbac.middleware'
import { getPaginationParams } from '@/lib/utils/helpers'
import { processRefund } from '@/lib/services/refund.service'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'

export function OPTIONS() { return handleOptions() }

export async function GET(request) {
  try {
    const user = await verifyAuth(request)
    const { searchParams } = new URL(request.url)
    const { skip, take, page, limit } = getPaginationParams(
      searchParams.get('page'), searchParams.get('limit')
    )

    const where = {}
    if (user.role === 'user') where.userId = user.id
    else if (!['super_admin', 'regional_manager'].includes(user.role))
      return errorResponse('Access denied', 'FORBIDDEN', 403)

    const status = searchParams.get('status')
    if (status) where.status = status

    const [refunds, total] = await Promise.all([
      prisma.refund.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      prisma.refund.count({ where }),
    ])

    return successResponse({
      refunds,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (err) {
    console.error('[Refunds GET]', err.message)
    if (err.message.includes('token') || err.message.includes('auth'))
      return errorResponse(err.message, 'AUTH_ERROR', 401)
    return errorResponse('Failed to fetch refunds', 'SERVER_ERROR', 500)
  }
}

export async function POST(request) {
  try {
    const user = await verifyAuth(request)
    checkRole(user, 'super_admin')

    const body = await request.json()
    if (!body.bookingId) return errorResponse('bookingId required', 'VALIDATION_ERROR', 400)

    const refund = await processRefund({
      bookingId: body.bookingId,
      initiatedBy: user.id,
      reason: body.reason,
    })

    return successResponse(refund, 'Refund initiated', 201)
  } catch (err) {
    console.error('[Refund POST]', err.message)
    if (err.message.includes('token') || err.message.includes('auth'))
      return errorResponse(err.message, 'AUTH_ERROR', 401)
    return errorResponse(err.message, 'REFUND_ERROR', 400)
  }
}