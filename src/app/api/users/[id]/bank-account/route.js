import prisma from '@/lib/prisma'
import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { encrypt } from '@/lib/utils/encryption'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'

export function OPTIONS() {
  return handleOptions()
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params
    const user = await verifyAuth(request)

    if (user.id !== id) {
      return errorResponse('Access denied', 'FORBIDDEN', 403)
    }

    const body = await request.json()

    const updated = await prisma.user.update({
      where: { id },
      data: {
        bankAccount: {
          accountHolderName: body.accountHolderName || null,
          accountNumber: body.accountNumber ? encrypt(body.accountNumber) : null,
          ifscCode: body.ifscCode || null,
          bankName: body.bankName || null,
          upiId: body.upiId || null,
          isVerified: false,
        },
      },
      select: {
        id: true,
        bankAccount: true,
      },
    })

    return successResponse(updated, 'Bank account updated')
  } catch (err) {
    console.error('[User BankAccount]', err.message)
    if (err.message.includes('Access denied') || err.message.includes('token')) {
      return errorResponse(err.message, 'AUTH_ERROR', 403)
    }
    return errorResponse('Failed to update bank account', 'SERVER_ERROR', 500)
  }
}