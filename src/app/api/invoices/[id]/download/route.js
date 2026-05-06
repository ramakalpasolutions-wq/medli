import prisma from '@/lib/prisma'
import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { generateInvoicePDF } from '@/lib/services/pdf.service'
import { errorResponse, handleOptions } from '@/lib/utils/apiResponse'

export function OPTIONS() { return handleOptions() }

export async function GET(request, { params }) {
  try {
    const user = await verifyAuth(request)
    const { id } = await params

    const invoice = await prisma.invoice.findUnique({ where: { id } })
    if (!invoice) return errorResponse('Invoice not found', 'NOT_FOUND', 404)

    if (user.role === 'user' && invoice.userId !== user.id)
      return errorResponse('Access denied', 'FORBIDDEN', 403)

    // Fetch user and entity details
    const [userDetails, booking] = await Promise.all([
      prisma.user.findUnique({
        where: { id: invoice.userId },
        select: { name: true, email: true, phone: true },
      }),
      prisma.booking.findUnique({
        where: { id: invoice.bookingId },
        select: { bookingId: true, type: true },
      }),
    ])

    let entityDetails = null
    if (invoice.entityType === 'hospital' && invoice.entityId) {
      const hospital = await prisma.hospital.findUnique({
        where: { id: invoice.entityId },
        select: { name: true, address: true, contactEmail: true },
      })
      entityDetails = hospital
    } else if (invoice.entityType === 'lab' && invoice.entityId) {
      const lab = await prisma.lab.findUnique({
        where: { id: invoice.entityId },
        select: { name: true, address: true, contactEmail: true },
      })
      entityDetails = lab
    }

    const pdfBuffer = await generateInvoicePDF({
      ...invoice,
      bookingId: booking?.bookingId || invoice.bookingId,
      type: booking?.type,
      userDetails,
      entityDetails,
    })

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=MEDLI-${invoice.invoiceNumber}.pdf`,
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('[Invoice Download]', err.message)
    return errorResponse('Failed to generate PDF', 'SERVER_ERROR', 500)
  }
}