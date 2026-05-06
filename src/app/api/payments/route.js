// src/app/api/payments/route.js

import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { checkRole } from '@/lib/middleware/rbac.middleware'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'
import { getPaginationParams } from '@/lib/utils/helpers'
import prisma from '@/lib/prisma'

export async function OPTIONS() {
  return handleOptions()
}

export async function GET(request) {
  try {
    const user = await verifyAuth(request)
    checkRole(user, 'super_admin')

    const { searchParams } = new URL(request.url)
    const { skip, take, page, limit } = getPaginationParams(
      searchParams.get('page'),
      searchParams.get('limit')
    )

    const status   = searchParams.get('status')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo   = searchParams.get('dateTo')

    const where = {}
    if (status) where.status = status
    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) where.createdAt.gte = new Date(dateFrom)
      if (dateTo)   where.createdAt.lte = new Date(dateTo)
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.payment.count({ where })
    ])

    return successResponse({
      payments,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    })
  } catch (err) {
    return errorResponse(err.message, 'PAYMENTS_ERROR', 500)
  }
}