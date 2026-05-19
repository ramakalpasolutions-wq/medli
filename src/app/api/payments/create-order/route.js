import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'
import { prisma } from '@/lib/prisma'
import Razorpay from 'razorpay'

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
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

    const authUserId = user.userId || user.id

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    })

    if (!booking) {
      return errorResponse('Booking not found', 'BOOKING_NOT_FOUND', 404)
    }

    if (booking.userId !== authUserId) {
      return errorResponse('Access denied', 'FORBIDDEN', 403)
    }

    if (booking.paymentStatus === 'paid') {
      return errorResponse('Booking is already paid', 'ALREADY_PAID', 409)
    }

    const existingOpenPayment = await prisma.payment.findFirst({
      where: {
        bookingId: booking.id,
        status: 'created',
      },
      orderBy: { createdAt: 'desc' },
    })

    if (existingOpenPayment?.razorpayOrderId) {
      return successResponse(
        {
          razorpayOrderId: existingOpenPayment.razorpayOrderId,
          amount: Math.round((booking.totalAmount || 0) * 100),
          currency: existingOpenPayment.currency || 'INR',
          keyId: process.env.RAZORPAY_KEY_ID,
          bookingId: booking.id,
          bookingRef: booking.bookingId,
        },
        'Existing payment order fetched'
      )
    }

    const amountInPaise = Math.round((booking.totalAmount || 0) * 100)

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: booking.bookingId,
      notes: {
        bookingId: booking.id,
        userId: booking.userId,
      },
    })

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

    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: 'pending_payment',
        razorpayOrderId: order.id,
      },
    })

    return successResponse(
      {
        razorpayOrderId: order.id,
        amount: amountInPaise,
        currency: 'INR',
        keyId: process.env.RAZORPAY_KEY_ID,
        bookingId: booking.id,
        bookingRef: booking.bookingId,
      },
      'Payment order created'
    )
  } catch (err) {
    console.error('[create-order] Error:', err.message)

    const statusMap = {
      'Booking not found': 404,
      'Booking is already paid': 409,
      'Access denied': 403,
    }

    return errorResponse(
      err.message || 'Failed to create payment order',
      'PAYMENT_ERROR',
      statusMap[err.message] || 400
    )
  }
}