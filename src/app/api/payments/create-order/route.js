import { verifyAuth }                                    from '@/lib/middleware/auth.middleware'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'
import { prisma }                                        from '@/lib/prisma'
import Razorpay                                          from 'razorpay'

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
})

export async function OPTIONS() {
  return handleOptions()
}

export async function POST(request) {
  try {
    const user = await verifyAuth(request)
    const body = await request.json()
    const { bookingId } = body

    if (!bookingId) {
      return errorResponse('bookingId is required', 'MISSING_BOOKING_ID', 400)
    }

    console.log('[create-order] bookingId:', bookingId, 'userId:', user.id)

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } })

    if (!booking) {
      return errorResponse('Booking not found', 'BOOKING_NOT_FOUND', 404)
    }

    if (booking.paymentStatus === 'paid') {
      return errorResponse('Booking is already paid', 'ALREADY_PAID', 409)
    }

    const amountInPaise = Math.round(booking.totalAmount * 100)

    // Create order on Razorpay
    const order = await razorpay.orders.create({
      amount:   amountInPaise,
      currency: 'INR',
      receipt:  booking.bookingId,
      notes: {
        bookingId: booking.id,
        userId:    user.id,
      },
    })

    console.log('[create-order] Razorpay order created:', order.id)

    // Save razorpayOrderId + set status pending_payment
    await prisma.payment.create({
  data: {
    bookingId: booking.id,
    userId: booking.userId,
    razorpayOrderId: order.id,
    amount: booking.totalAmount,
    currency: 'INR',
    status: 'created',
  },
})

    // Create Payment record
    await prisma.payment.create({
      data: {
        bookingId:       booking.id,
        userId:          booking.userId,
        razorpayOrderId: order.id,
        amount:          booking.totalAmount,
        currency:        'INR',
        status:          'created',
      },
    })

    return successResponse(
      {
        razorpayOrderId: order.id,
        amount:          amountInPaise,
        currency:        'INR',
        keyId:           process.env.RAZORPAY_KEY_ID,
        bookingId:       booking.id,
        bookingRef:      booking.bookingId,
      },
      'Payment order created',
    )

  } catch (err) {
    console.error('[create-order] Error:', err.message)
    const statusMap = {
      'Booking is already paid': 409,
      'Booking not found':       404,
    }
    return errorResponse(err.message, 'PAYMENT_ERROR', statusMap[err.message] || 400)
  }
}