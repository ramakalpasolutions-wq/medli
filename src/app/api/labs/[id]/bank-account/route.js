import { prisma } from '@/lib/prisma'
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

    const lab = await prisma.lab.findUnique({ where: { id } })
    if (!lab) {
      return errorResponse('Lab not found', 'NOT_FOUND', 404)
    }

    if (user.role === 'lab_admin' && lab.adminUserId !== user.id) {
      return errorResponse('Access denied', 'FORBIDDEN', 403)
    }
    if (!['lab_admin', 'super_admin'].includes(user.role)) {
      return errorResponse('Access denied', 'FORBIDDEN', 403)
    }

    const body = await request.json()

    const bankData = {
      entityType: 'lab',
      entityId: id,
      accountHolderName: body.accountHolderName || null,
      accountNumber: body.accountNumber ? encrypt(body.accountNumber) : null,
      ifscCode: body.ifscCode || null,
      bankName: body.bankName || null,
      branchName: body.branchName || null,
      accountType: body.accountType || null,
      upiId: body.upiId || null,
      panNumber: body.panNumber ? encrypt(body.panNumber) : null,
      gstin: body.gstin || null,
      isPrimary: true,
      isActive: true,
    }

    const existing = await prisma.bankAccount.findFirst({
      where: { entityType: 'lab', entityId: id, isPrimary: true },
    })

    let bankAccount
    if (existing) {
      bankAccount = await prisma.bankAccount.update({
        where: { id: existing.id },
        data: bankData,
      })
    } else {
      bankAccount = await prisma.bankAccount.create({ data: bankData })
      await prisma.lab.update({
        where: { id },
        data: { bankAccountId: bankAccount.id },
      })
    }

    return successResponse(bankAccount, 'Bank account updated')
  } catch (err) {
    console.error('[Lab BankAccount]', err.message)
    if (err.message.includes('Access denied') || err.message.includes('token')) {
      return errorResponse(err.message, 'AUTH_ERROR', 403)
    }
    return errorResponse('Failed to update bank account', 'SERVER_ERROR', 500)
  }
}