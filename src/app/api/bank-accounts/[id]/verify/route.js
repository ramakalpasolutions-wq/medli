import prisma from '@/lib/prisma'
import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { checkRole } from '@/lib/middleware/rbac.middleware'
import { decrypt } from '@/lib/utils/encryption'
import { verifyBankAccount } from '@/lib/utils/hdfc-payout'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'

export function OPTIONS() { return handleOptions() }

export async function POST(request, { params }) {
  try {
    const user = await verifyAuth(request)
    checkRole(user, 'super_admin')
    const { id } = await params

    const account = await prisma.bankAccount.findUnique({ where: { id } })
    if (!account) return errorResponse('Bank account not found', 'NOT_FOUND', 404)
    if (!account.accountNumber || !account.ifscCode)
      return errorResponse('Account number and IFSC required', 'VALIDATION_ERROR', 400)

    const accountNumber = decrypt(account.accountNumber)

    const result = await verifyBankAccount({
      accountNumber,
      ifscCode: account.ifscCode,
      accountName: account.accountHolderName,
    })

    const updated = await prisma.bankAccount.update({
      where: { id },
      data: {
        isVerified: result.verified,
        verificationMethod: 'penny_drop',
        verifiedAt: result.verified ? new Date() : null,
        verifiedBy: user.id,
        pennyDropTransactionId: result.transactionId,
      },
    })

    return successResponse({
      verified: result.verified,
      message: result.message,
      account: updated,
    }, result.verified ? 'Bank account verified' : 'Verification failed')
  } catch (err) {
    console.error('[BankAccount Verify]', err.message)
    return errorResponse('Verification failed', 'SERVER_ERROR', 500)
  }
}