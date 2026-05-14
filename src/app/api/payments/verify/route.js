import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'
import { sendEmail } from '@/lib/email'
import { bookingConfirmedTemplate } from '@/lib/emailTemplates'

export function OPTIONS() {
  return handleOptions()
}

export async function POST(request) {
  try {
    await verifyAuth(request)

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingId,
    } = await request.json()

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !bookingId) {
      return errorResponse('Missing required fields', 'MISSING_FIELDS', 400)
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex')

    const isValid = crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(razorpay_signature),
    )

    if (!isValid) {
      console.error('[Verify] Invalid signature for order:', razorpay_order_id)
      return errorResponse('Payment signature verification failed', 'INVALID_SIGNATURE', 400)
    }

    const booking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'confirmed',
        paymentStatus: 'paid',
        razorpayPaymentId: razorpay_payment_id,
      },
    })

    await prisma.payment.updateMany({
      where: { razorpayOrderId: razorpay_order_id },
      data: {
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        status: 'captured',
      },
    })

    const user = await prisma.user.findUnique({
      where: { id: booking.userId },
      select: {
        name: true,
        email: true,
      },
    })

    let hospitalName = '-'
    let doctorName = '-'
    let labName = '-'

    if (booking.hospitalId) {
      const hospital = await prisma.hospital.findUnique({
        where: { id: booking.hospitalId },
        select: { name: true },
      })
      if (hospital?.name) hospitalName = hospital.name
    }

    if (booking.doctorId) {
      const doctor = await prisma.doctor.findUnique({
        where: { id: booking.doctorId },
        select: { name: true },
      })
      if (doctor?.name) doctorName = doctor.name
    }

    if (booking.labId) {
      const lab = await prisma.lab.findUnique({
        where: { id: booking.labId },
        select: { name: true },
      })
      if (lab?.name) labName = lab.name
    }

    if (user?.email) {
      try {
        const bookingDate = booking.startTime
          ? new Date(booking.startTime).toLocaleDateString('en-IN', {
              dateStyle: 'full',
              timeZone: 'Asia/Kolkata',
            })
          : '-'

        const bookingTime = booking.startTime
          ? new Date(booking.startTime).toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
              timeZone: 'Asia/Kolkata',
            })
          : '-'

        const template = bookingConfirmedTemplate({
          patientName: user.name || 'User',
          bookingId: booking.bookingId,
          bookingType: booking.type,
          hospitalName: booking.type === 'lab' ? labName : hospitalName,
          doctorName: booking.type === 'lab' ? '-' : doctorName,
          startTime: `${bookingDate} at ${bookingTime}`,
          totalAmount: booking.totalAmount,
          bookingUrl: `${process.env.NEXT_PUBLIC_APP_URL}/user/bookings/${booking.id}`,
        })

        const info = await sendEmail({
          to: user.email,
          subject: template.subject,
          text: template.text,
          html: template.html,
        })

        console.log('[Verify] Booking confirmation email sent to:', user.email)
        console.log('[Verify] Email messageId:', info.messageId)
        console.log('[Verify] Email accepted:', info.accepted)
        console.log('[Verify] Email rejected:', info.rejected)
      } catch (mailError) {
        console.error('[Verify] Email sending failed:', mailError)
      }
    }

    console.log('[Verify] Booking confirmed:', bookingId)

    return successResponse(
      { bookingId, razorpayPaymentId: razorpay_payment_id },
      'Payment verified successfully',
    )
  } catch (error) {
    console.error('[Verify ERROR]', error)
    return errorResponse(error.message || 'Internal server error', 'SERVER_ERROR', 500)
  }
}