import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'

export function OPTIONS() {
  return handleOptions()
}

export async function GET(request, { params }) {
  try {
    const user = await verifyAuth(request)
    const { bookingId } = await params

    const invoice = await prisma.invoice.findFirst({
  where: { bookingId: params.bookingId },
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

if (!invoice) {
  return NextResponse.json(
    { success: false, error: 'Invoice not found' },
    { status: 404 }
  )
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