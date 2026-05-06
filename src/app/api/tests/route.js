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
    const { searchParams } = new URL(request.url)
    const { skip, take, page, limit } = getPaginationParams(
      searchParams.get('page'),
      searchParams.get('limit')
    )

    const labId = searchParams.get('labId')
    const category = searchParams.get('category')
    const search = searchParams.get('search')

    const where = { isActive: true }

    if (labId) where.labId = labId
    if (category) where.category = category
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [tests, total] = await Promise.all([
      prisma.test.findMany({ where, skip, take, orderBy: { name: 'asc' } }),
      prisma.test.count({ where }),
    ])

    return successResponse({
      tests,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (err) {
    console.error('[Tests GET]', err.message)
    return errorResponse('Failed to fetch tests', 'SERVER_ERROR', 500)
  }
}

export async function POST(request) {
  try {
    const user = await verifyAuth(request)
    checkRole(user, 'super_admin', 'lab_admin')

    const body = await request.json()

    if (!body.name || !body.labId || body.price === undefined) {
      return errorResponse('name, labId, and price are required', 'VALIDATION_ERROR', 400)
    }

    // lab_admin can only create for their lab
    if (user.role === 'lab_admin') {
      const lab = await prisma.lab.findUnique({ where: { id: body.labId } })
      if (!lab || lab.adminUserId !== user.id) {
        return errorResponse('Access denied', 'FORBIDDEN', 403)
      }
    }

    const test = await prisma.test.create({
      data: {
        labId: body.labId,
        name: sanitizeInput(body.name),
        code: body.code || null,
        category: body.category || null,
        parameters: body.parameters || [],
        price: parseFloat(body.price),
        discountedPrice: body.discountedPrice ? parseFloat(body.discountedPrice) : null,
        turnaroundTime: body.turnaroundTime || null,
        sampleType: body.sampleType || null,
        preparationInstructions: body.preparationInstructions || null,
      },
    })

    return successResponse(test, 'Test created', 201)
  } catch (err) {
    console.error('[Tests POST]', err.message)
    if (err.message.includes('Access denied') || err.message.includes('token')) {
      return errorResponse(err.message, 'AUTH_ERROR', 403)
    }
    return errorResponse('Failed to create test', 'SERVER_ERROR', 500)
  }
}