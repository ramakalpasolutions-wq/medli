// src/app/api/payments/create-order/route.js

import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/middleware/auth.middleware'

import {
  getCashfreeBaseUrl,
  getCashfreeApiVersion,
  generateCashfreeOrderId,
  normalizeCashfreePhone,
  generateCashfreeRequestId,
} from '@/lib/utils/cashfree'


// ============================================================
// POST /api/payments/create-order
// ============================================================

export async function POST(request) {
  try {
    // ========================================================
    // AUTHENTICATION
    // ========================================================

    const user = await verifyAuth(request)

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
        },
        {
          status: 401,
        }
      )
    }


    // ========================================================
    // ENVIRONMENT VALIDATION
    // ========================================================

    const appId =
      process.env.CASHFREE_APP_ID?.trim()

    const secretKey =
      process.env.CASHFREE_SECRET_KEY?.trim()


    if (!appId || !secretKey) {
      console.error(
        '[Cashfree create-order] Missing Cashfree credentials'
      )

      return NextResponse.json(
        {
          success: false,
          error:
            'Payment gateway is not configured',
        },
        {
          status: 500,
        }
      )
    }


    // ========================================================
    // CASHFREE CALLBACK URL
    // ========================================================

    /*
     * IMPORTANT:
     *
     * NEXT_PUBLIC_APP_URL can remain:
     *
     * http://localhost:3000
     *
     * while developing locally.
     *
     * Cashfree callback URLs must use your public HTTPS
     * deployment:
     *
     * CASHFREE_CALLBACK_BASE_URL=https://medli....vercel.app
     */

    const callbackBaseUrl = (
      process.env.CASHFREE_CALLBACK_BASE_URL ||
      ''
    )
      .trim()
      .replace(/\/$/, '')


    if (!callbackBaseUrl) {
      console.error(
        '[Cashfree create-order] CASHFREE_CALLBACK_BASE_URL missing'
      )

      return NextResponse.json(
        {
          success: false,
          error:
            'Cashfree callback URL is not configured',
        },
        {
          status: 500,
        }
      )
    }


    if (
      !callbackBaseUrl.startsWith(
        'https://'
      )
    ) {
      console.error(
        '[Cashfree create-order] Invalid callback URL:',
        callbackBaseUrl
      )

      return NextResponse.json(
        {
          success: false,
          error:
            'Cashfree callback URL must use HTTPS',
        },
        {
          status: 500,
        }
      )
    }


    // ========================================================
    // REQUEST BODY
    // ========================================================

    let body

    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request body',
        },
        {
          status: 400,
        }
      )
    }


    const bookingId =
      body?.bookingId


    if (!bookingId) {
      return NextResponse.json(
        {
          success: false,
          error: 'bookingId is required',
        },
        {
          status: 400,
        }
      )
    }


    // ========================================================
    // FETCH BOOKING
    // ========================================================

    const booking =
      await prisma.booking.findUnique({
        where: {
          id: bookingId,
        },
      })


    if (!booking) {
      return NextResponse.json(
        {
          success: false,
          error: 'Booking not found',
        },
        {
          status: 404,
        }
      )
    }


    // ========================================================
    // AUTH USER ID
    // ========================================================

    const authUserId =
      user.userId ||
      user.id


    if (!authUserId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid authenticated user',
        },
        {
          status: 401,
        }
      )
    }


    // ========================================================
    // OWNERSHIP
    // ========================================================

    const isOwner =
      String(booking.userId) ===
      String(authUserId)

    const isSuperAdmin =
      user.role === 'super_admin'


    if (
      !isOwner &&
      !isSuperAdmin
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'You are not authorized to pay for this booking',
        },
        {
          status: 403,
        }
      )
    }


    // ========================================================
    // BOOKING STATUS VALIDATION
    // ========================================================

    if (
      booking.paymentStatus === 'paid' ||
      booking.status === 'confirmed'
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'This booking has already been paid',
        },
        {
          status: 400,
        }
      )
    }


    if (
      booking.status === 'cancelled' ||
      booking.status === 'refunded'
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Payment cannot be made for this booking',
        },
        {
          status: 400,
        }
      )
    }


    // ========================================================
    // AMOUNT
    // ========================================================

    const amount =
      Number(
        booking.totalAmount
      )


    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      console.error(
        '[Cashfree create-order] Invalid booking amount:',
        {
          bookingId:
            booking.id,

          bookingRef:
            booking.bookingId,

          totalAmount:
            booking.totalAmount,
        }
      )

      return NextResponse.json(
        {
          success: false,
          error:
            'Invalid booking amount',
        },
        {
          status: 400,
        }
      )
    }


    const finalAmount =
      Number(
        amount.toFixed(2)
      )


    // ========================================================
    // CUSTOMER
    // ========================================================

    const customer =
      await prisma.user.findUnique({
        where: {
          id:
            booking.userId,
        },

        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      })


    if (!customer) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Customer not found',
        },
        {
          status: 404,
        }
      )
    }


    // ========================================================
    // PHONE
    // ========================================================

    const phone =
      normalizeCashfreePhone(
        customer.phone
      )


    if (
      !phone ||
      phone.length !== 10
    ) {
      console.error(
        '[Cashfree create-order] Invalid customer phone:',
        {
          userId:
            customer.id,

          phoneExists:
            Boolean(
              customer.phone
            ),
        }
      )

      return NextResponse.json(
        {
          success: false,
          error:
            'A valid 10-digit mobile number is required for payment',
        },
        {
          status: 400,
        }
      )
    }


    // ========================================================
    // FIND EXISTING PAYMENT
    // ========================================================

    const existingPayment =
      await prisma.payment.findFirst({
        where: {
          bookingId:
            booking.id,

          status: {
            in: [
              'created',
              'pending',
            ],
          },
        },

        orderBy: {
          createdAt:
            'desc',
        },
      })


    // ========================================================
    // CASHFREE ORDER ID
    // ========================================================

    const cashfreeOrderId =
      generateCashfreeOrderId(
        booking.bookingId
      )


    const requestId =
      generateCashfreeRequestId(
        `order-${booking.bookingId}`
      )


    console.log(
      '[Cashfree create-order] Creating order:',
      {
        bookingId:
          booking.id,

        bookingRef:
          booking.bookingId,

        cashfreeOrderId,

        amount:
          finalAmount,

        environment:
          process.env.CASHFREE_ENV,

        callbackBaseUrl,
      }
    )


    // ========================================================
    // CASHFREE CUSTOMER DETAILS
    // ========================================================

    const customerDetails = {
      customer_id:
        String(
          customer.id
        ),

      customer_name:
        customer.name ||
        'MEDLI User',

      customer_phone:
        phone,
    }


    if (
      customer.email &&
      String(
        customer.email
      ).trim()
    ) {
      customerDetails.customer_email =
        String(
          customer.email
        ).trim()
    }


    // ========================================================
    // CASHFREE PAYLOAD
    // ========================================================

    const cashfreePayload = {
      order_id:
        cashfreeOrderId,

      order_amount:
        finalAmount,

      order_currency:
        'INR',

      customer_details:
        customerDetails,

      order_meta: {
        return_url:
          `${callbackBaseUrl}/user/bookings/${booking.id}?order_id={order_id}`,

        notify_url:
          `${callbackBaseUrl}/api/payments/cashfree-webhook`,
      },

      order_note:
        `MEDLI booking ${booking.bookingId}`,

      order_tags: {
        booking_id:
          String(
            booking.id
          ),

        booking_reference:
          String(
            booking.bookingId
          ),

        booking_type:
          String(
            booking.type
          ),
      },
    }


    // ========================================================
    // CASHFREE API
    // ========================================================

    const cashfreeUrl =
      `${getCashfreeBaseUrl()}/orders`


    console.log(
      '[Cashfree create-order] Sending request:',
      {
        url:
          cashfreeUrl,

        orderId:
          cashfreeOrderId,

        amount:
          finalAmount,

        callbackBaseUrl,
      }
    )


    const cashfreeResponse =
      await fetch(
        cashfreeUrl,
        {
          method:
            'POST',

          headers: {
            'Content-Type':
              'application/json',

            Accept:
              'application/json',

            'x-client-id':
              appId,

            'x-client-secret':
              secretKey,

            'x-api-version':
              getCashfreeApiVersion(),

            'x-request-id':
              requestId,
          },

          body:
            JSON.stringify(
              cashfreePayload
            ),

          cache:
            'no-store',
        }
      )


    // ========================================================
    // READ CASHFREE RESPONSE
    // ========================================================

    let cashfreeData = null


  //  let cashfreeData = null

try {
  cashfreeData = await cashfreeResponse.json()
} catch (parseError) {
  console.error(
    '[Cashfree create-order] Failed to parse Cashfree response:',
    parseError
  )

  cashfreeData = null
}

// ========================================================
// CASHFREE RESPONSE DEBUG
// ========================================================

// IMPORTANT:
// Never log the complete payment_session_id.

console.log(
  '[Cashfree create-order] Cashfree response:',
  {
    httpStatus: cashfreeResponse.status,

    ok: cashfreeResponse.ok,

    orderId:
      cashfreeData?.order_id || null,

    cfOrderId:
      cashfreeData?.cf_order_id != null
        ? String(cashfreeData.cf_order_id)
        : null,

    orderStatus:
      cashfreeData?.order_status || null,

    orderAmount:
      cashfreeData?.order_amount ?? null,

    orderCurrency:
      cashfreeData?.order_currency || null,

    hasPaymentSessionId:
      Boolean(
        cashfreeData?.payment_session_id
      ),

    paymentSessionPrefix:
      cashfreeData?.payment_session_id
        ? String(
            cashfreeData.payment_session_id
          ).slice(0, 25)
        : null,

    paymentSessionLength:
      cashfreeData?.payment_session_id
        ? String(
            cashfreeData.payment_session_id
          ).length
        : 0,

    environment:
      process.env.CASHFREE_ENV,

    apiBaseUrl:
      getCashfreeBaseUrl(),

    apiVersion:
      getCashfreeApiVersion(),
  }
)

    // ========================================================
    // CASHFREE ERROR
    // ========================================================

    if (
      !cashfreeResponse.ok
    ) {
      console.error(
        '[Cashfree create-order] API ERROR:',
        {
          status:
            cashfreeResponse.status,

          statusText:
            cashfreeResponse.statusText,

          response:
            cashfreeData,
        }
      )


      return NextResponse.json(
        {
          success: false,

          error:
            cashfreeData?.message ||
            cashfreeData?.type ||
            'Cashfree order creation failed',

          cashfreeError:
            cashfreeData,
        },
        {
          status:
            cashfreeResponse.status >= 400 &&
            cashfreeResponse.status < 500
              ? 400
              : 500,
        }
      )
    }


    // ========================================================
    // PAYMENT SESSION
    // ========================================================

    const paymentSessionId =
      cashfreeData
        ?.payment_session_id


    if (!paymentSessionId) {
      console.error(
        '[Cashfree create-order] Missing payment_session_id:',
        cashfreeData
      )

      return NextResponse.json(
        {
          success: false,
          error:
            'Cashfree did not return a payment session',
        },
        {
          status: 500,
        }
      )
    }


    // ========================================================
    // CASHFREE RESPONSE VALUES
    // ========================================================

    const cfOrderId =
      cashfreeData
        ?.cf_order_id != null
        ? String(
            cashfreeData
              .cf_order_id
          )
        : null


    const cashfreeOrderStatus =
      cashfreeData
        ?.order_status ||
      'ACTIVE'


    // ========================================================
    // SAVE PAYMENT
    // ========================================================

    let payment


    if (existingPayment) {
      payment =
        await prisma.payment.update({
          where: {
            id:
              existingPayment.id,
          },

          data: {
            cashfreeOrderId:
              cashfreeOrderId,

            cashfreeCfOrderId:
              cfOrderId,

            cashfreePaymentSessionId:
              paymentSessionId,

            cashfreeOrderStatus:
              cashfreeOrderStatus,

            amount:
              finalAmount,

            currency:
              'INR',

            status:
              'created',
          },
        })
    } else {
      payment =
        await prisma.payment.create({
          data: {
            bookingId:
              booking.id,

            userId:
              booking.userId,

            cashfreeOrderId:
              cashfreeOrderId,

            cashfreeCfOrderId:
              cfOrderId,

            cashfreePaymentSessionId:
              paymentSessionId,

            cashfreeOrderStatus:
              cashfreeOrderStatus,

            amount:
              finalAmount,

            currency:
              'INR',

            status:
              'created',
          },
        })
    }


    // ========================================================
    // UPDATE BOOKING
    // ========================================================

    await prisma.booking.update({
      where: {
        id:
          booking.id,
      },

      data: {
        cashfreeOrderId:
          cashfreeOrderId,

        cashfreeCfOrderId:
          cfOrderId,

        cashfreePaymentSessionId:
          paymentSessionId,

        paymentStatus:
          'pending',

        status:
          'pending_payment',
      },
    })


    // ========================================================
    // SUCCESS LOG
    // ========================================================

   console.log(
  '[Cashfree create-order] Order created:',
  {
    bookingId:
      booking.id,

    bookingRef:
      booking.bookingId,

    cashfreeOrderId,

    cfOrderId,

    orderStatus:
      cashfreeOrderStatus,

    paymentId:
      payment.id,

    amount:
      finalAmount,

    hasPaymentSessionId:
      Boolean(paymentSessionId),

    paymentSessionPrefix:
      paymentSessionId
        ? String(paymentSessionId).slice(
            0,
            25
          )
        : null,

    paymentSessionLength:
      paymentSessionId
        ? String(paymentSessionId).length
        : 0,

    environment:
      process.env.CASHFREE_ENV,
  }
)

    // ========================================================
    // RESPONSE
    // ========================================================

    return NextResponse.json(
      {
        success: true,

        data: {
          orderId:
            cashfreeOrderId,

          cashfreeOrderId:
            cashfreeOrderId,

          cfOrderId:
            cfOrderId,

          paymentSessionId:
            paymentSessionId,

          amount:
            finalAmount,

          currency:
            'INR',

          orderStatus:
            cashfreeOrderStatus,

          bookingId:
            booking.id,

          bookingRef:
            booking.bookingId,
        },
      },
      {
        status: 200,
      }
    )
  } catch (error) {
    console.error(
      '[Cashfree create-order] ERROR:',
      {
        name:
          error?.name,

        message:
          error?.message,

        code:
          error?.code,

        stack:
          error?.stack,
      }
    )


    return NextResponse.json(
      {
        success: false,

        error:
          error?.message ||
          'Failed to create Cashfree payment order',
      },
      {
        status: 500,
      }
    )
  }
}