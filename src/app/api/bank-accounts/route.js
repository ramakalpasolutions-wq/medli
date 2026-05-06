import prisma from '@/lib/prisma'
import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { checkRole } from '@/lib/middleware/rbac.middleware'
import { encrypt } from '@/lib/utils/encryption'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'

function maskAccount(account) {
  if (!account) return account
  return {
    ...account,
    accountNumber: account.accountNumber ? `****${account.accountNumber.slice(-4)}` : null,
    panNumber: account.panNumber ? `****${account.panNumber.slice(-4)}` : null,
  }
}

export function OPTIONS() { return handleOptions() }

export async function GET(request) {
  try {
    const user = await verifyAuth(request)
    const { searchParams } = new URL(request.url)
    const entityType = searchParams.get('entityType')
    const entityId = searchParams.get('entityId')

    const where = {}
    if (entityType) where.entityType = entityType
    if (entityId) where.entityId = entityId

    // Non-admin can only see their own
    if (user.role !== 'super_admin') {
      where.entityId = user.id
      where.entityType = 'user'
    }

    const accounts = await prisma.bankAccount.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return successResponse(accounts.map(maskAccount))
  } catch (err) {
    console.error('[BankAccounts GET]', err.message)
    return errorResponse('Failed to fetch bank accounts', 'SERVER_ERROR', 500)
  }
}

export async function POST(request) {
  try {
    const user = await verifyAuth(request)
    const body = await request.json()

    if (!body.entityType || !body.entityId)
      return errorResponse('entityType and entityId required', 'VALIDATION_ERROR', 400)

    if (user.role !== 'super_admin' && user.id !== body.entityId)
      return errorResponse('Access denied', 'FORBIDDEN', 403)

    const account = await prisma.bankAccount.create({
      data: {
        entityType: body.entityType,
        entityId: body.entityId,
        accountHolderName: body.accountHolderName || null,
        accountNumber: body.accountNumber ? encrypt(body.accountNumber) : null,
        ifscCode: body.ifscCode || null,
        bankName: body.bankName || null,
        branchName: body.branchName || null,
        accountType: body.accountType || null,
        upiId: body.upiId || null,
        panNumber: body.panNumber ? encrypt(body.panNumber) : null,
        gstin: body.gstin || null,
        isPrimary: body.isPrimary ?? true,
      },
    })

    return successResponse(maskAccount(account), 'Bank account created', 201)
  } catch (err) {
    console.error('[BankAccount POST]', err.message)
    return errorResponse('Failed to create bank account', 'SERVER_ERROR', 500)
  }
}