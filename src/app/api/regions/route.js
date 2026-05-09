import { prisma }     from '@/lib/prisma'
import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { checkRole }  from '@/lib/middleware/rbac.middleware'
import {
  getPaginationParams,
  buildPaginationMeta,
} from '@/lib/utils/helpers'
import { sanitizeInput } from '@/lib/utils/validators'
import {
  successResponse,
  errorResponse,
  handleOptions,
  paginatedResponse,
} from '@/lib/utils/apiResponse'

export function OPTIONS() { return handleOptions() }

export async function GET(request) {
  return verifyAuth(request, async (req, user) => {
    try {
      checkRole(user, 'super_admin', 'regional_manager')

      const { page, limit, skip, take } = getPaginationParams(
        new URL(request.url).searchParams.get('page'),
        new URL(request.url).searchParams.get('limit'),
      )

      const [regions, total] = await Promise.all([
        prisma.region.findMany({
          skip,
          take,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.region.count(),
      ])

      return paginatedResponse(
        regions,
        buildPaginationMeta(total, page, limit),
        'regions',
      )

    } catch (error) {
      if (error.message?.includes('Access denied')) {
        return errorResponse(error.message, 403)
      }
      console.error('[GET /api/regions]', error)
      return errorResponse('Internal server error', 500)
    }
  })
}

export async function POST(request) {
  return verifyAuth(request, async (req, user) => {
    try {
      checkRole(user, 'super_admin')

      const body = await request.json()
      if (!body.name) return errorResponse('Name is required', 400)

      const region = await prisma.region.create({
        data: {
          name:      sanitizeInput(body.name),
          states:    body.states || [],
          cities:    body.cities || [],
          managerId: body.managerId || undefined,
          isActive:  true,
        },
      })

      return successResponse(region, 'Region created', 201)

    } catch (error) {
      if (error.message?.includes('Access denied')) {
        return errorResponse(error.message, 403)
      }
      console.error('[POST /api/regions]', error)
      return errorResponse('Internal server error', 500)
    }
  })
}