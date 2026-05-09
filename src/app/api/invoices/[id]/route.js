import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'

export function OPTIONS() { return handleOptions() }

export async function GET(request, { params }) {
  try {
    const user = await verifyAuth(request)
    const { id } = await params

    const invoice = await prisma.invoice.findUnique({ where: { id } })
    if (!invoice) return errorResponse('Invoice not found', 'NOT_FOUND', 404)

    if (user.role === 'user' && invoice.userId !== user.id)
      return errorResponse('Access denied', 'FORBIDDEN', 403)

    return successResponse(invoice)
  } catch (err) {
    console.error('[Invoice GET]', err.message)
    return errorResponse('Failed to fetch invoice', 'SERVER_ERROR', 500)
  }
}