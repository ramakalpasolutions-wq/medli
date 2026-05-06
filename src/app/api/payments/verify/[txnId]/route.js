// src/app/api/payments/verify/[txnId]/route.js

import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'
import { verifyTransaction } from '@/lib/services/payment.service'
import prisma from '@/lib/prisma'

export async function OPTIONS() {
  return handleOptions()
}

export async function GET(request, { params }) {
  try {
    await verifyAuth(request)

    const { txnId } = params

    if (!txnId) {
      return errorResponse('txnId is required', 'MISSING_TXN_ID', 400)
    }

    console.log('[API] Verify txnId:', txnId)

    const result = await verifyTransaction(txnId)

    return successResponse(result, 'Transaction status fetched')
  } catch (err) {
    console.error('[API] Verify error:', err.message)
    return errorResponse(err.message, 'VERIFY_ERROR', 500)
  }
}