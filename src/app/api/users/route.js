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

      const { searchParams } = new URL(request.url)
      const search    = sanitizeInput(searchParams.get('search') || '')
      const role      = searchParams.get('role')      || ''
      const isBlocked = searchParams.get('isBlocked')

      const { page, limit, skip, take } = getPaginationParams(
        searchParams.get('page'),
        searchParams.get('limit'),
      )

      const where = {}

      if (search) {
        where.OR = [
          { name:  { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } },
          { email: { contains: search, mode: 'insensitive' } },
        ]
      }
      if (role)      where.role      = role
      if (isBlocked !== null && isBlocked !== '' && isBlocked !== undefined) {
        where.isBlocked = isBlocked === 'true'
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
          select: {
            id:            true,
            name:          true,
            phone:         true,
            email:         true,
            role:          true,
            isVerified:    true,
            isBlocked:     true,
            avatar:        true,
            wallet:        true,
            familyMembers: true,
            createdAt:     true,
            updatedAt:     true,
          },
        }),
        prisma.user.count({ where }),
      ])

      return paginatedResponse(
        users,
        buildPaginationMeta(total, page, limit),
        'users',
      )

    } catch (error) {
      if (error.message?.includes('Access denied')) {
        return errorResponse(error.message, 403)
      }
      console.error('[GET /api/users]', error)
      return errorResponse('Internal server error', 500)
    }
  })
}