import { prisma }      from '@/lib/prisma'
import { verifyAuth }  from '@/lib/middleware/auth.middleware'
import { encrypt, maskSensitive } from '@/lib/utils/encryption'
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

function maskAccount(account) {
  if (!account) return account
  return {
    ...account,
    accountNumber: account.accountNumber
      ? maskSensitive(account.accountNumber)
      : null,
    panNumber: account.panNumber
      ? maskSensitive(account.panNumber)
      : null,
  }
}

export async function GET(request) {
  return verifyAuth(request, async (req, user) => {
    try {
      const { searchParams } = new URL(request.url)
      const entityType = searchParams.get('entityType') || ''
      const entityId   = searchParams.get('entityId')   || ''

      const { page, limit, skip, take } = getPaginationParams(
        searchParams.get('page'),
        searchParams.get('limit'),
      )

      const where = {}

      if (user.role === 'super_admin') {
        if (entityType) where.entityType = entityType
        if (entityId)   where.entityId   = entityId
      } else {
        where.entityId   = user.userId
        where.entityType = 'user'
      }

      const [accounts, total] = await Promise.all([
        prisma.bankAccount.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.bankAccount.count({ where }),
      ])

      return paginatedResponse(
        accounts.map(maskAccount),
        buildPaginationMeta(total, page, limit),
        'accounts',
      )

    } catch (error) {
      console.error('[GET /api/bank-accounts]', error)
      return errorResponse('Internal server error', 500)
    }
  })
}

export async function POST(request) {
  return verifyAuth(request, async (req, user) => {
    try {
      const body = await request.json()

      if (!body.entityType || !body.entityId) {
        return errorResponse('entityType and entityId are required', 400)
      }

      if (user.role !== 'super_admin' && user.userId !== body.entityId) {
        return errorResponse('Access denied', 403)
      }

      const account = await prisma.bankAccount.create({
        data: {
          entityType:        body.entityType,
          entityId:          body.entityId,
          accountHolderName: body.accountHolderName || null,
          accountNumber:     body.accountNumber ? encrypt(body.accountNumber) : null,
          ifscCode:          body.ifscCode    || null,
          bankName:          body.bankName    || null,
          branchName:        body.branchName  || null,
          accountType:       body.accountType || null,
          upiId:             body.upiId       || null,
          panNumber:         body.panNumber   ? encrypt(body.panNumber) : null,
          gstin:             body.gstin       || null,
          isVerified:        false,
          isActive:          true,
          isPrimary:         body.isPrimary ?? true,
        },
      })

      return successResponse(maskAccount(account), 'Bank account created', 201)

    } catch (error) {
      console.error('[POST /api/bank-accounts]', error)
      return errorResponse('Internal server error', 500)
    }
  })
}