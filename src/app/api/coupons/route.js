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
      const { searchParams } = new URL(request.url)
      const couponType = searchParams.get('couponType') || ''
      const isActive   = searchParams.get('isActive')

      const { page, limit, skip, take } = getPaginationParams(
        searchParams.get('page'),
        searchParams.get('limit'),
      )

      const where = {}
      if (couponType) where.couponType = couponType
      if (isActive !== null && isActive !== '' && isActive !== undefined) {
        where.isActive = isActive === 'true'
      }

      // hospital_admin / lab_admin — only their coupons
      if (user.role === 'hospital_admin') {
        const hospital = await prisma.hospital.findFirst({
          where:  { adminUserId: user.userId },
          select: { id: true },
        })
        if (hospital) {
          where.couponType  = 'hospital'
          where.hospitalIds = { has: hospital.id }
        }
      } else if (user.role === 'lab_admin') {
        const lab = await prisma.lab.findFirst({
          where:  { adminUserId: user.userId },
          select: { id: true },
        })
        if (lab) {
          where.couponType = 'lab'
          where.labIds     = { has: lab.id }
        }
      } else {
        checkRole(user, 'super_admin', 'regional_manager', 'hospital_admin', 'lab_admin')
      }

      const [coupons, total] = await Promise.all([
        prisma.coupon.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.coupon.count({ where }),
      ])

      return paginatedResponse(
        coupons,
        buildPaginationMeta(total, page, limit),
        'coupons',
      )

    } catch (error) {
      if (error.message?.includes('Access denied')) {
        return errorResponse(error.message, 403)
      }
      console.error('[GET /api/coupons]', error)
      return errorResponse('Internal server error', 500)
    }
  })
}

export async function POST(request) {
  return verifyAuth(request, async (req, user) => {
    try {
      checkRole(user, 'super_admin', 'hospital_admin', 'lab_admin')

      const body = await request.json()

      if (!body.code)          return errorResponse('Code is required', 400)
      if (!body.couponType)    return errorResponse('Coupon type is required', 400)
      if (!body.discountType)  return errorResponse('Discount type is required', 400)
      if (!body.discountValue) return errorResponse('Discount value is required', 400)

      const existing = await prisma.coupon.findUnique({
        where: { code: body.code.toUpperCase() },
      })
      if (existing) return errorResponse('Coupon code already exists', 409)

      const coupon = await prisma.coupon.create({
        data: {
          code:              body.code.toUpperCase(),
          name:              body.name              || undefined,
          description:       body.description       || undefined,
          couponType:        body.couponType,
          discountType:      body.discountType,
          discountValue:     Number(body.discountValue),
          maxDiscountAmount: body.maxDiscountAmount ? Number(body.maxDiscountAmount) : undefined,
          minOrderAmount:    Number(body.minOrderAmount)    || 0,
          totalUsageLimit:   body.totalUsageLimit ? Number(body.totalUsageLimit) : undefined,
          perUserLimit:      Number(body.perUserLimit)      || 1,
          validFrom:         body.validFrom  ? new Date(body.validFrom)  : undefined,
          validUntil:        body.validUntil ? new Date(body.validUntil) : undefined,
          hospitalIds:       body.hospitalIds || [],
          labIds:            body.labIds      || [],
          isActive:          true,
          createdBy: {
            role:       user.role,
            userId:     user.userId,
            entityId:   body.entityId   || undefined,
            entityName: body.entityName || undefined,
          },
        },
      })

      return successResponse(coupon, 'Coupon created', 201)

    } catch (error) {
      if (error.message?.includes('Access denied')) {
        return errorResponse(error.message, 403)
      }
      console.error('[POST /api/coupons]', error)
      return errorResponse('Internal server error', 500)
    }
  })
}