import prisma from '@/lib/prisma'
import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { getPaginationParams } from '@/lib/utils/helpers'
import { sanitizeInput } from '@/lib/utils/validators'
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

    // Role-scoped
    if (user.role === 'hospital_admin') {
      where.couponType = 'hospital'
      where.createdBy = { is: { userId: user.id } }
    } else if (user.role === 'lab_admin') {
      where.couponType = 'lab'
      where.createdBy = { is: { userId: user.id } }
    } else if (!['super_admin', 'regional_manager'].includes(user.role)) {
      return errorResponse('Access denied', 'FORBIDDEN', 403)
    }

    const [coupons, total] = await Promise.all([
      prisma.coupon.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      prisma.coupon.count({ where }),
    ])

    return successResponse({
      coupons,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (err) {
    console.error('[Coupons GET]', err.message)
    if (err.message.includes('token') || err.message.includes('auth'))
      return errorResponse(err.message, 'AUTH_ERROR', 401)
    return errorResponse('Failed to fetch coupons', 'SERVER_ERROR', 500)
  }
}

export async function POST(request) {
  try {
    const user = await verifyAuth(request)

    if (!['super_admin', 'hospital_admin', 'lab_admin'].includes(user.role))
      return errorResponse('Access denied', 'FORBIDDEN', 403)

    const body = await request.json()

    if (!body.code || !body.couponType || !body.discountType || body.discountValue === undefined)
      return errorResponse('code, couponType, discountType, discountValue required', 'VALIDATION_ERROR', 400)

    // Force type by role
    let forcedType = body.couponType
    if (user.role === 'hospital_admin') forcedType = 'hospital'
    if (user.role === 'lab_admin') forcedType = 'lab'

    const existing = await prisma.coupon.findUnique({ where: { code: body.code } })
    if (existing) return errorResponse('Coupon code already exists', 'DUPLICATE', 409)

    const coupon = await prisma.coupon.create({
      data: {
        code: sanitizeInput(body.code).toUpperCase(),
        name: body.name || null,
        description: body.description || null,
        createdBy: {
          role: user.role,
          userId: user.id,
          entityId: body.entityId || null,
          entityName: body.entityName || null,
        },
        couponType: forcedType,
        discountType: body.discountType,
        discountValue: parseFloat(body.discountValue),
        maxDiscountAmount: body.maxDiscountAmount ? parseFloat(body.maxDiscountAmount) : null,
        minOrderAmount: parseFloat(body.minOrderAmount || 0),
        validFrom: body.validFrom ? new Date(body.validFrom) : null,
        validUntil: body.validUntil ? new Date(body.validUntil) : null,
        totalUsageLimit: body.totalUsageLimit ? parseInt(body.totalUsageLimit) : null,
        perUserLimit: parseInt(body.perUserLimit || 1),
        applicableFor: body.applicableFor || 'all',
        hospitalIds: body.hospitalIds || [],
        labIds: body.labIds || [],
        testIds: body.testIds || [],
        applicableBookingTypes: body.applicableBookingTypes || [],
      },
    })

    return successResponse(coupon, 'Coupon created', 201)
  } catch (err) {
    console.error('[Coupons POST]', err.message)
    if (err.message.includes('token') || err.message.includes('auth'))
      return errorResponse(err.message, 'AUTH_ERROR', 401)
    return errorResponse('Failed to create coupon', 'SERVER_ERROR', 500)
  }
}