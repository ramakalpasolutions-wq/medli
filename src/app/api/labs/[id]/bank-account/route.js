// C:\Users\ASUS\medli2\src\app\api\labs\[id]\bank-account\route.js

import { prisma }     from '@/lib/prisma'
import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { encrypt }    from '@/lib/utils/encryption'
import {
  successResponse,
  errorResponse,
  handleOptions,
} from '@/lib/utils/apiResponse'

export function OPTIONS() {
  return handleOptions()
}

export async function PUT(request, { params }) {
  return verifyAuth(request, async (req, user) => {
    try {
      const { id } = await params

      console.log(`[lab-bank] Update by ${user.role} (${user.userId}) for lab ${id}`)

      const lab = await prisma.lab.findUnique({ where: { id } })
      if (!lab) {
        return errorResponse('Lab not found', 404)
      }

      /* ✅ Use user.userId — same fix as hospital route */
      if (user.role === 'lab_admin') {
        if (lab.adminUserId !== user.userId) {
          console.warn(
            `[lab-bank] ❌ Access denied — admin ${user.userId} != lab admin ${lab.adminUserId}`
          )
          return errorResponse('You can only update your own lab\'s bank account', 403)
        }
      } else if (user.role !== 'super_admin') {
        return errorResponse('Access denied', 403)
      }

      const body = await request.json()

      /* ── Validate required fields ── */
      if (!body.accountNumber || !String(body.accountNumber).trim()) {
        return errorResponse('Account number is required', 400)
      }
      if (!body.ifscCode || !String(body.ifscCode).trim()) {
        return errorResponse('IFSC code is required', 400)
      }
      if (!body.accountHolderName || !String(body.accountHolderName).trim()) {
        return errorResponse('Account holder name is required', 400)
      }

      /* ── Validate IFSC format ── */
      const ifsc = String(body.ifscCode).trim().toUpperCase()
      if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) {
        return errorResponse('Invalid IFSC code format (e.g., SBIN0001234)', 400)
      }

      /* ── Validate account number ── */
      const accNum = String(body.accountNumber).replace(/\s/g, '')
      if (!/^\d{9,18}$/.test(accNum)) {
        return errorResponse('Account number must be 9-18 digits', 400)
      }

      const bankData = {
        entityType:        'lab',
        entityId:          id,
        accountHolderName: String(body.accountHolderName).trim(),
        accountNumber:     encrypt(accNum),
        ifscCode:          ifsc,
        bankName:          body.bankName?.trim() || null,
        branchName:        body.branchName?.trim() || null,
        accountType:       body.accountType || null,
        upiId:             body.upiId?.trim() || null,
        panNumber:         body.panNumber
                            ? encrypt(String(body.panNumber).trim().toUpperCase())
                            : null,
        gstin:             body.gstin?.trim() || null,
        isPrimary:         true,
        isActive:          true,
      }

      const existing = await prisma.bankAccount.findFirst({
        where: { entityType: 'lab', entityId: id, isPrimary: true },
      })

      let bankAccount
      if (existing) {
        console.log(`[lab-bank] Updating existing account: ${existing.id}`)

        /* ✅ Reset verification when bank details change */
        bankAccount = await prisma.bankAccount.update({
          where: { id: existing.id },
          data: {
            ...bankData,
            isVerified:             false,
            verificationMethod:     null,
            verifiedAt:             null,
            verifiedBy:             null,
            pennyDropTransactionId: null,
          },
        })
      } else {
        console.log(`[lab-bank] Creating new account for lab ${id}`)
        bankAccount = await prisma.bankAccount.create({ data: bankData })
        await prisma.lab.update({
          where: { id },
          data:  { bankAccountId: bankAccount.id },
        })
      }

      console.log(`[lab-bank] ✅ Saved: ${bankAccount.id}`)

      return successResponse(
        {
          id:                bankAccount.id,
          accountHolderName: bankAccount.accountHolderName,
          ifscCode:          bankAccount.ifscCode,
          bankName:          bankAccount.bankName,
          isVerified:        bankAccount.isVerified,
          isPrimary:         bankAccount.isPrimary,
        },
        existing
          ? 'Bank account updated. Re-verification required.'
          : 'Bank account added successfully.'
      )

    } catch (err) {
      console.error('[Lab BankAccount] FATAL:', err)

      if (err.message?.includes('Access denied') || err.message?.includes('token')) {
        return errorResponse(err.message, 403)
      }

      return errorResponse(
        `Failed to update bank account: ${err.message || 'Unknown error'}`,
        500
      )
    }
  })
}