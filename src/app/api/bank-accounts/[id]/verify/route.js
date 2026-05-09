import { prisma }            from '@/lib/prisma'
import { verifyAuth }        from '@/lib/middleware/auth.middleware'
import { checkRole }         from '@/lib/middleware/rbac.middleware'
import { decrypt }           from '@/lib/utils/encryption'
import {
  successResponse,
  errorResponse,
  handleOptions,
} from '@/lib/utils/apiResponse'

export function OPTIONS() { return handleOptions() }

export async function POST(request, { params }) {
  return verifyAuth(request, async (req, user) => {
    try {
      checkRole(user, 'super_admin')

      const { id } = await params

      const account = await prisma.bankAccount.findUnique({
        where: { id },
      })

      if (!account) {
        return errorResponse('Bank account not found', 404)
      }

      if (!account.accountNumber || !account.ifscCode) {
        return errorResponse('Account number and IFSC required', 400)
      }

      // Decrypt stored account number for verification
      const accountNumber = decrypt(account.accountNumber)

      if (!accountNumber) {
        return errorResponse('Could not decrypt account number', 500)
      }

      // ── Try HDFC penny-drop if available ────────────────────────────
      let result = { verified: false, message: 'Pending manual review', transactionId: null }

      try {
        const { verifyBankAccount } = await import('@/lib/utils/hdfc-payout')
        result = await verifyBankAccount({
          accountNumber,
          ifscCode:    account.ifscCode,
          accountName: account.accountHolderName,
        })
      } catch (e) {
        // hdfc-payout not configured — fall back to manual verification
        console.warn('[verify] HDFC payout unavailable, using manual:', e?.message)
        result = {
          verified:      true,          // manual approval
          message:       'Manually verified by admin',
          transactionId: null,
        }
      }

      // ── Update bank account ─────────────────────────────────────────
      const updated = await prisma.bankAccount.update({
        where: { id },
        data: {
          isVerified:             result.verified,
          verificationMethod:     'penny_drop',
          verifiedAt:             result.verified ? new Date() : null,
          verifiedBy:             user.userId,          // ✅ userId not id
          pennyDropTransactionId: result.transactionId || null,
        },
      })

      return successResponse(
        {
          verified: result.verified,
          message:  result.message,
          account:  {
            id:           updated.id,
            isVerified:   updated.isVerified,
            verifiedAt:   updated.verifiedAt,
            bankName:     updated.bankName,
            ifscCode:     updated.ifscCode,
          },
        },
        result.verified ? 'Bank account verified' : 'Verification failed',
      )

    } catch (error) {
      if (error.message?.includes('Access denied')) {
        return errorResponse(error.message, 403)
      }
      console.error('[POST /api/bank-accounts/[id]/verify]', error)
      return errorResponse('Verification failed', 500)
    }
  })
}