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
  try {
    const { searchParams } = new URL(request.url)
    const search = sanitizeInput(searchParams.get('search') || '')
    const labId  = searchParams.get('labId') || ''

    const { page, limit, skip, take } = getPaginationParams(
      searchParams.get('page'),
      searchParams.get('limit'),
    )

    const where = { isActive: true }
    if (labId)  where.labId = labId
    if (search) {
      where.OR = [
        { name:     { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
        { code:     { contains: search, mode: 'insensitive' } },
      ]
    }

    const [tests, total] = await Promise.all([
      prisma.test.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.test.count({ where }),
    ])

    return paginatedResponse(
      tests,
      buildPaginationMeta(total, page, limit),
      'tests',
    )

  } catch (error) {
    console.error('[GET /api/tests]', error)
    return errorResponse('Internal server error', 500)
  }
}

export async function POST(request) {
  return verifyAuth(request, async (req, user) => {
    try {
      checkRole(user, 'super_admin', 'lab_admin')

      const body = await request.json()
      if (!body.name)  return errorResponse('Name is required', 400)
      if (!body.labId) return errorResponse('Lab ID is required', 400)
      if (!body.price) return errorResponse('Price is required', 400)

      const test = await prisma.test.create({
        data: {
          labId:                   body.labId,
          name:                    sanitizeInput(body.name),
          code:                    body.code        || undefined,
          category:                body.category    || undefined,
          parameters:              body.parameters  || [],
          price:                   Number(body.price),
          discountedPrice:         body.discountedPrice ? Number(body.discountedPrice) : undefined,
          turnaroundTime:          body.turnaroundTime  || undefined,
          sampleType:              body.sampleType      || undefined,
          preparationInstructions: body.preparationInstructions || undefined,
          isActive:                true,
        },
      })

      return successResponse(test, 'Test created', 201)

    } catch (error) {
      if (error.message?.includes('Access denied')) {
        return errorResponse(error.message, 403)
      }
      console.error('[POST /api/tests]', error)
      return errorResponse('Internal server error', 500)
    }
  })
}