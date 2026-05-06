import prisma from '@/lib/prisma'
import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { getPaginationParams } from '@/lib/utils/helpers'
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

    if (user.role === 'user') {
      where.userId = user.id
    } else if (user.role === 'hospital_admin') {
      const hospital = await prisma.hospital.findFirst({ where: { adminUserId: user.id } })
      if (hospital) { where.entityType = 'hospital'; where.entityId = hospital.id }
    } else if (user.role === 'lab_admin') {
      const lab = await prisma.lab.findFirst({ where: { adminUserId: user.id } })
      if (lab) { where.entityType = 'lab'; where.entityId = lab.id }
    } else if (!['super_admin', 'regional_manager'].includes(user.role)) {
      return errorResponse('Access denied', 'FORBIDDEN', 403)
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      prisma.invoice.count({ where }),
    ])

    return successResponse({
      invoices,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (err) {
    console.error('[Invoices GET]', err.message)
    if (err.message.includes('token') || err.message.includes('auth'))
      return errorResponse(err.message, 'AUTH_ERROR', 401)
    return errorResponse('Failed to fetch invoices', 'SERVER_ERROR', 500)
  }
}