import { prisma }     from '@/lib/prisma'
import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { encrypt, maskSensitive } from '@/lib/utils/encryption'
import {
  successResponse,
  errorResponse,
  handleOptions,
} from '@/lib/utils/apiResponse'

export function OPTIONS() { return handleOptions() }

export async function GET(request, { params }) {
  return verifyAuth(request, async (req, user) => {
    try {
      const { id } = await params

      if (user.userId !== id && user.role !== 'super_admin') {
        return errorResponse('Access denied', 403)
      }

      const dbUser = await prisma.user.findUnique({
        where:  { id },
        select: { bankAccount: true },
      })

      if (!dbUser) return errorResponse('User not found', 404)

      const ba = dbUser.bankAccount
      if (!ba) return successResponse(null)

      return successResponse({
        ...ba,
        accountNumber: ba.accountNumber ? maskSensitive(ba.accountNumber) : null,
      })
    } catch (error) {
      console.error('[GET /api/users/[id]/bank-account]', error)
      return errorResponse('Internal server error', 500)
    }
  })
}

export async function PUT(request, { params }) {
  return verifyAuth(request, async (req, user) => {
    try {
      const { id } = await params

      // ✅ user.userId
      if (user.userId !== id && user.role !== 'super_admin') {
        return errorResponse('Access denied', 403)
      }

      const body = await request.json()

      const updated = await prisma.user.update({
        where: { id },
        data:  {
          bankAccount: {
            accountHolderName: body.accountHolderName || null,
            accountNumber:     body.accountNumber ? encrypt(body.accountNumber) : null,
            ifscCode:          body.ifscCode  || null,
            bankName:          body.bankName  || null,
            upiId:             body.upiId    || null,
            isVerified:        false,
          },
        },
        select: { id: true, bankAccount: true },
      })

      return successResponse(updated, 'Bank account updated')
    } catch (error) {
      console.error('[PUT /api/users/[id]/bank-account]', error)
      return errorResponse('Internal server error', 500)
    }
  })
}