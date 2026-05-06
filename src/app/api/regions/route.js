import prisma from '@/lib/prisma'
import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { checkRole } from '@/lib/middleware/rbac.middleware'
import { getPaginationParams } from '@/lib/utils/helpers'
import { sanitizeInput } from '@/lib/utils/validators'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'

export function OPTIONS() {
  return handleOptions()
}

export async function GET(request) {
  try {
    const user = await verifyAuth(request)
    checkRole(user, 'super_admin', 'regional_manager')

    const { searchParams } = new URL(request.url)
    const { skip, take, page, limit } = getPaginationParams(
      searchParams.get('page'),
      searchParams.get('limit')
    )

    const where = {}
    if (user.role === 'regional_manager') {
      where.managerId = user.id
    }

    const [regions, total] = await Promise.all([
      prisma.region.findMany({ where, skip, take, orderBy: { name: 'asc' } }),
      prisma.region.count({ where }),
    ])

    return successResponse({
      regions,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (err) {
    console.error('[Regions GET]', err.message)
    if (err.message.includes('Access denied') || err.message.includes('token')) {
      return errorResponse(err.message, 'AUTH_ERROR', 403)
    }
    return errorResponse('Failed to fetch regions', 'SERVER_ERROR', 500)
  }
}

export async function POST(request) {
  try {
    const user = await verifyAuth(request)
    checkRole(user, 'super_admin')

    const body = await request.json()

    if (!body.name) {
      return errorResponse('Region name is required', 'VALIDATION_ERROR', 400)
    }

    const region = await prisma.region.create({
      data: {
        name: sanitizeInput(body.name),
        states: body.states || [],
        cities: body.cities || [],
        managerId: body.managerId || null,
      },
    })

    return successResponse(region, 'Region created', 201)
  } catch (err) {
    console.error('[Regions POST]', err.message)
    if (err.message.includes('Access denied') || err.message.includes('token')) {
      return errorResponse(err.message, 'AUTH_ERROR', 403)
    }
    return errorResponse('Failed to create region', 'SERVER_ERROR', 500)
  }
}