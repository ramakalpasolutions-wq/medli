// src/app/api/invoices/by-booking/[bookingId]/route.js
// ── Redirect helper: find invoice by bookingId, return invoice id ──────────
import prisma from '@/lib/prisma'
import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'

export function OPTIONS() { return handleOptions() }

export async function GET(request, { params }) {
  try {
    const user          = await verifyAuth(request)
    const { bookingId } = await params

    const invoice = await prisma.invoice.findFirst({
      where: { bookingId },
      select: {
        id:            true,
        invoiceNumber: true,
        userId:        true,
        totalAmount:   true,
        type:          true,
        createdAt:     true,
      },
    })

    if (!invoice) return errorResponse('Invoice not found', 'NOT_FOUND', 404)

    // Access check
    if (
      user.role === 'user' &&
      invoice.userId !== user.id
    ) {
      return errorResponse('Access denied', 'FORBIDDEN', 403)
    }

    return successResponse(invoice)
  } catch (err) {
    console.error('[Invoice by-booking GET]', err.message)
    if (err.message?.includes('token') || err.message?.includes('Unauthorized'))
      return errorResponse(err.message, 'AUTH_ERROR', 401)
    return errorResponse('Failed to fetch invoice', 'SERVER_ERROR', 500)
  }
}