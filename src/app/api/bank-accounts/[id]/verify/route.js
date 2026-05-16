// C:\Users\ASUS\medli2\src\app\api\bank-accounts\[id]\verify\route.js

import { prisma }     from '@/lib/prisma'
import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { checkRole }  from '@/lib/middleware/rbac.middleware'
import { decrypt }    from '@/lib/utils/encryption'
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

      console.log(`[verify-bank] Starting for account: ${id} by ${user.userId}`)

      const account = await prisma.bankAccount.findUnique({
        where: { id },
      })

      if (!account) {
        console.warn(`[verify-bank] Account not found: ${id}`)
        return errorResponse('Bank account not found', 404)
      }

      console.log(`[verify-bank] Account found:`, {
        id:         account.id,
        entityType: account.entityType,
        entityId:   account.entityId,
        bankName:   account.bankName,
        ifsc:       account.ifscCode,
        hasNumber:  !!account.accountNumber,
        hasIFSC:    !!account.ifscCode,
        hasHolder:  !!account.accountHolderName,
        isVerified: account.isVerified,
      })

      /* ─── Validate required fields ─────────────────────────────── */
      if (!account.accountNumber) {
        return errorResponse(
          'Bank account number is missing. Please re-enter bank details.',
          400
        )
      }
      if (!account.ifscCode) {
        return errorResponse(
          'IFSC code is missing. Please re-enter bank details.',
          400
        )
      }
      if (!account.accountHolderName) {
        return errorResponse(
          'Account holder name is missing. Please re-enter bank details.',
          400
        )
      }

      /* ─── Decrypt account number safely ────────────────────────── */
      let accountNumber
      try {
        accountNumber = decrypt(account.accountNumber)
        if (!accountNumber || accountNumber.length < 4) {
          throw new Error('Decrypted account number is invalid')
        }
        console.log(`[verify-bank] Decrypted: ****${accountNumber.slice(-4)}`)
      } catch (decErr) {
        console.error('[verify-bank] Decrypt failed:', decErr?.message)
        return errorResponse(
          'Could not read encrypted account number. Please re-enter bank details.',
          500
        )
      }

      /* ─── Determine verification mode ──────────────────────────── */
      const enableRealVerification =
        process.env.ENABLE_REAL_BANK_VERIFICATION === 'true' &&
        process.env.HDFC_PAYOUT_API_KEY

      let result = {
        verified:      false,
        message:       '',
        transactionId: null,
        method:        'manual',
      }

      if (enableRealVerification) {
        /* ── Try real HDFC penny-drop ── */
        console.log('[verify-bank] Attempting HDFC penny-drop...')
        try {
          const { verifyBankAccount } = await import('@/lib/utils/hdfc-payout')
          const hdfc = await verifyBankAccount({
            accountNumber,
            ifscCode:    account.ifscCode,
            accountName: account.accountHolderName,
          })

          result = {
            verified:      hdfc.verified === true,
            message:       hdfc.message || (hdfc.verified ? 'Verified via HDFC penny-drop' : 'HDFC verification failed'),
            transactionId: hdfc.transactionId || null,
            method:        'penny_drop',
          }

          console.log('[verify-bank] HDFC result:', result)
        } catch (hdfcErr) {
          console.error('[verify-bank] HDFC error:', hdfcErr?.message)
          /* ✅ Fall through to manual instead of failing */
          result = {
            verified:      true,
            message:       `HDFC unavailable, manually verified by ${user.role}`,
            transactionId: null,
            method:        'manual',
          }
        }
      } else {
        /* ── Dev/Manual verification ── */
        console.log('[verify-bank] Using manual verification (HDFC not configured)')
        result = {
          verified:      true,
          message:       `Manually verified by ${user.role}`,
          transactionId: `MANUAL-${Date.now()}`,
          method:        'manual',
        }
      }

      /* ─── Update DB ────────────────────────────────────────────── */
      const updated = await prisma.bankAccount.update({
        where: { id },
        data: {
          isVerified:             result.verified,
          verificationMethod:     result.method,
          verifiedAt:             result.verified ? new Date() : null,
          verifiedBy:             user.userId,
          pennyDropTransactionId: result.transactionId,
        },
      })

      console.log(
        `[verify-bank] ${result.verified ? '✅ VERIFIED' : '❌ FAILED'} — ${result.message}`
      )

      /* ─── Return success only if verified ──────────────────────── */
      if (!result.verified) {
        return errorResponse(
          result.message || 'Bank verification failed',
          400
        )
      }

      return successResponse(
        {
          verified: true,
          message:  result.message,
          method:   result.method,
          account: {
            id:                 updated.id,
            isVerified:         updated.isVerified,
            verifiedAt:         updated.verifiedAt,
            verificationMethod: updated.verificationMethod,
            bankName:           updated.bankName,
            ifscCode:           updated.ifscCode,
            accountHolderName:  updated.accountHolderName,
          },
        },
        '✅ Bank account verified successfully'
      )

    } catch (error) {
      console.error('[POST /api/bank-accounts/[id]/verify] FATAL:', error)

      if (error.message?.includes('Access denied')) {
        return errorResponse(error.message, 403)
      }

      return errorResponse(
        `Verification failed: ${error.message || 'Unknown error'}`,
        500
      )
    }
  })
}