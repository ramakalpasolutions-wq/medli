import { prisma }     from '@/lib/prisma'
import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { checkRole }  from '@/lib/middleware/rbac.middleware'
import {
  getPaginationParams,
  buildPaginationMeta,
} from '@/lib/utils/helpers'
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
      checkRole(user,
        'super_admin', 'regional_manager',
        'hospital_admin', 'lab_admin',
      )

      const { searchParams } = new URL(request.url)
      const status     = searchParams.get('status')     || ''
      const entityType = searchParams.get('entityType') || ''
      const entityId   = searchParams.get('entityId')   || ''

      const { page, limit, skip, take } = getPaginationParams(
        searchParams.get('page'),
        searchParams.get('limit'),
      )

      const where = {}

      // ✅ Support status as array e.g. status=pending,processing
      if (status) {
        const statuses = status.split(',').map((s) => s.trim()).filter(Boolean)
        where.status   = statuses.length === 1
          ? statuses[0]
          : { in: statuses }
      }

      if (entityType) where.entityType = entityType

      // ── Role-based filtering ────────────────────────────────────────
      if (user.role === 'hospital_admin') {
        const hospital = await prisma.hospital.findFirst({
          where:  { adminUserId: user.userId },
          select: { id: true, name: true },
        })
        if (hospital) {
          where.entityType = 'hospital'
          where.entityId   = hospital.id
        }
      } else if (user.role === 'lab_admin') {
        const lab = await prisma.lab.findFirst({
          where:  { adminUserId: user.userId },
          select: { id: true, name: true },
        })
        if (lab) {
          where.entityType = 'lab'
          where.entityId   = lab.id
        }
      } else if (entityId) {
        // super_admin / regional_manager — optional filter
        where.entityId = entityId
      }

      const [settlements, total] = await Promise.all([
        prisma.settlement.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.settlement.count({ where }),
      ])

      return paginatedResponse(
        settlements,
        buildPaginationMeta(total, page, limit),
        'settlements',
      )

    } catch (error) {
      if (error.message?.includes('Access denied')) {
        return errorResponse(error.message, 403)
      }
      console.error('[GET /api/settlements]', error)
      return errorResponse('Internal server error', 500)
    }
  })
}

export async function POST(request) {
  return verifyAuth(request, async (req, user) => {
    try {
      checkRole(user, 'super_admin')

      const body = await request.json()

      if (!body.entityType) return errorResponse('entityType is required', 400)
      if (!body.entityId)   return errorResponse('entityId is required', 400)

      const { generateSettlementNumber } = await import('@/lib/utils/helpers')

      const settlement = await prisma.settlement.create({
        data: {
          settlementNumber:    generateSettlementNumber(),
          entityType:          body.entityType,
          entityId:            body.entityId,
          entityName:          body.entityName          || undefined,
          periodFrom:          body.periodFrom ? new Date(body.periodFrom) : undefined,
          periodTo:            body.periodTo   ? new Date(body.periodTo)   : undefined,
          totalBookings:       Number(body.totalBookings)       || 0,
          grossAmount:         Number(body.grossAmount)         || 0,
          platformFee:         Number(body.platformFee)         || 0,
          gst:                 Number(body.gst)                 || 0,
          couponAbsorbed:      Number(body.couponAbsorbed)      || 0,
          refundsDeducted:     Number(body.refundsDeducted)     || 0,
          netSettlementAmount: Number(body.netSettlementAmount) || 0,
          bankAccountId:       body.bankAccountId               || undefined,
          beneficiaryName:     body.beneficiaryName             || undefined,
          beneficiaryAccount:  body.beneficiaryAccount          || undefined,
          beneficiaryIFSC:     body.beneficiaryIFSC             || undefined,
          bankName:            body.bankName                    || undefined,
          transferMode:        body.transferMode                || undefined,
          bookingIds:          body.bookingIds                  || [],
          notes:               body.notes                       || undefined,
          status:              'pending',
          initiatedBy:         user.userId,
        },
      })

      return successResponse(settlement, 'Settlement created', 201)

    } catch (error) {
      if (error.message?.includes('Access denied')) {
        return errorResponse(error.message, 403)
      }
      console.error('[POST /api/settlements]', error)
      return errorResponse('Internal server error', 500)
    }
  })
}