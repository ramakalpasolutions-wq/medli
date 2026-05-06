import prisma from '@/lib/prisma'
import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { getPaginationParams } from '@/lib/utils/helpers'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'

export function OPTIONS() { return handleOptions() }

export async function GET(request, { params }) {
  try {
    const user = await verifyAuth(request)
    const { entityType, entityId } = await params

    if (user.role !== 'super_admin' && user.id !== entityId)
      return errorResponse('Access denied', 'FORBIDDEN', 403)

    const { searchParams } = new URL(request.url)
    const { skip, take, page, limit } = getPaginationParams(
      searchParams.get('page'), searchParams.get('limit')
    )

    const category = searchParams.get('category')
    const type = searchParams.get('type')
    const where = { entityType, entityId }
    if (category) where.category = category
    if (type) where.type = type

    const [entries, total] = await Promise.all([
      prisma.ledger.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      prisma.ledger.count({ where }),
    ])

    return successResponse({
      entries,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (err) {
    console.error('[Ledger GET]', err.message)
    return errorResponse('Failed to fetch ledger', 'SERVER_ERROR', 500)
  }
}