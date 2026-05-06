import prisma from '@/lib/prisma'
import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { getPaginationParams } from '@/lib/utils/helpers'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'

export function OPTIONS() { return handleOptions() }

export async function GET(request, { params }) {
  try {
    const user = await verifyAuth(request)
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const { skip, take, page, limit } = getPaginationParams(
      searchParams.get('page'), searchParams.get('limit')
    )

    if (!['super_admin', 'hospital_admin', 'lab_admin'].includes(user.role))
      return errorResponse('Access denied', 'FORBIDDEN', 403)

    const [usages, total] = await Promise.all([
      prisma.couponUsage.findMany({
        where: { couponId: id },
        skip, take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.couponUsage.count({ where: { couponId: id } }),
    ])

    return successResponse({
      usages,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (err) {
    return errorResponse('Failed to fetch usage', 'SERVER_ERROR', 500)
  }
}