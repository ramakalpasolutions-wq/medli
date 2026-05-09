import { prisma }     from '@/lib/prisma'
import { verifyAuth } from '@/lib/middleware/auth.middleware'
import {
  getPaginationParams,
  buildPaginationMeta,
  generateInvoiceNumber,
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
      const { searchParams } = new URL(request.url)
      const type = searchParams.get('type') || ''

      const { page, limit, skip, take } = getPaginationParams(
        searchParams.get('page'),
        searchParams.get('limit'),
      )

      const where = {}

      // Role-based access
      if (user.role === 'user') {
        where.userId = user.userId
      } else if (user.role === 'hospital_admin') {
        const hospital = await prisma.hospital.findFirst({
          where:  { adminUserId: user.userId },
          select: { id: true },
        })
        if (hospital) {
          where.entityType = 'hospital'
          where.entityId   = hospital.id
        }
      } else if (user.role === 'lab_admin') {
        const lab = await prisma.lab.findFirst({
          where:  { adminUserId: user.userId },
          select: { id: true },
        })
        if (lab) {
          where.entityType = 'lab'
          where.entityId   = lab.id
        }
      }

      if (type) where.type = type

      const [invoices, total] = await Promise.all([
        prisma.invoice.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.invoice.count({ where }),
      ])

      return paginatedResponse(
        invoices,
        buildPaginationMeta(total, page, limit),
        'invoices',
      )

    } catch (error) {
      console.error('[GET /api/invoices]', error)
      return errorResponse('Internal server error', 500)
    }
  })
}