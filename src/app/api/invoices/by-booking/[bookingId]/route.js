import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'

export function OPTIONS() {
  return handleOptions()
}

export async function GET(request, { params }) {
  try {
    const user = await verifyAuth(request)

    // ✅ Fix 1: await params before destructuring (Next.js 15)
    const { bookingId } = await params

    // ✅ Fix 2: use destructured bookingId, not params.bookingId
    const invoice = await prisma.invoice.findFirst({
      where: { bookingId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        invoiceNumber: true,
        userId: true,
        totalAmount: true,
        type: true,
        createdAt: true,
      },
    })

    // ✅ Fix 3: use errorResponse instead of NextResponse (not imported)
    if (!invoice) {
      return errorResponse('Invoice not found', 404)
    }

    if (user.role === 'user' && invoice.userId !== user.userId) {
      return errorResponse('Access denied', 403)
    }

    return successResponse(invoice)
  } catch (err) {
    console.error('[Invoice by-booking GET]', err)
    return errorResponse('Failed to fetch invoice', 500)
  }
}