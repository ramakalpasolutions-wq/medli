import { verifyAuth } from '@/lib/middleware/auth.middleware'
import {
  successResponse,
  errorResponse,
  handleOptions,
} from '@/lib/utils/apiResponse'

import { prisma } from '@/lib/prisma'
import { Cashfree } from '@/lib/utils/cashfree'

import { sendEmail } from '@/lib/email'
import {
  bookingConfirmedTemplate,
  meetLinkTemplate,
} from '@/lib/emailTemplates'

import { createBookingInvoice } from '@/lib/services/invoice.service'

export function OPTIONS() {
  return handleOptions()
}

/**
 * Converts Cashfree payment response into MEDLI's internal data.
 */
function getPaymentDetails(payment = {}) {
  return {
    paymentId: payment.cf_payment_id
      ? String(payment.cf_payment_id)
      : null,

    status: payment.payment_status || null,

    method:
      payment.payment_group ||
      payment.payment_method ||
      null,

    bankReference:
      payment.bank_reference || null,

    failureReason:
      payment.payment_message ||
      payment.error_details?.error_description ||
      null,
  }
}

/**
 * Get the successful Cashfree payment from the order's payment list.
 */
async function getSuccessfulPayment(orderId) {
  const response = await Cashfree.PGOrderFetchPayments(orderId)

  const payments = Array.isArray(response?.data)
    ? response.data
    : []

  const successPayment = payments.find(
    (payment) =>
      String(payment?.payment_status || '').toUpperCase() === 'SUCCESS'
  )

  return {
    payments,
    successPayment: successPayment || null,
  }
}

export async function POST(request) {
  try {
    // --------------------------------------------------
    // AUTH
    // --------------------------------------------------

    const authUser = await verifyAuth(request)

    const authUserId = authUser.userId || authUser.id

    // --------------------------------------------------
    // REQUEST
    // --------------------------------------------------

    const body = await request.json()

    const orderId =
      body.orderId ||
      body.order_id ||
      body.cashfreeOrderId

    const requestedBookingId =
      body.bookingId ||
      body.booking_id ||
      null

    if (!orderId) {
      return errorResponse(
        'Cashfree orderId is required',
        'MISSING_ORDER_ID',
        400
      )
    }

    // --------------------------------------------------
    // FIND PAYMENT
    // --------------------------------------------------

    const payment = await prisma.payment.findFirst({
      where: {
        cashfreeOrderId: orderId,
      },

      orderBy: {
        createdAt: 'desc',
      },
    })

    if (!payment) {
      return errorResponse(
        'Payment order not found',
        'PAYMENT_NOT_FOUND',
        404
      )
    }

    // --------------------------------------------------
    // FIND BOOKING
    // --------------------------------------------------

    let booking = await prisma.booking.findUnique({
      where: {
        id: payment.bookingId,
      },
    })

    if (!booking) {
      return errorResponse(
        'Booking not found',
        'BOOKING_NOT_FOUND',
        404
      )
    }

    // User must own booking.
    if (booking.userId !== authUserId) {
      return errorResponse(
        'Access denied',
        'FORBIDDEN',
        403
      )
    }

    if (
      requestedBookingId &&
      requestedBookingId !== booking.id
    ) {
      return errorResponse(
        'Booking does not match payment order',
        'BOOKING_MISMATCH',
        400
      )
    }

    // --------------------------------------------------
    // ALREADY PAID
    // --------------------------------------------------

    if (
      booking.paymentStatus === 'paid' &&
      payment.status === 'success'
    ) {
      return successResponse(
        {
          bookingId: booking.id,
          bookingRef: booking.bookingId,
          orderId,
          paymentId:
            payment.cashfreePaymentId || null,
          paymentStatus: 'paid',
          bookingStatus: booking.status,
          meetLink: booking.meetLink || null,
        },
        'Payment already verified'
      )
    }

    // --------------------------------------------------
    // ASK CASHFREE FOR ORDER
    // --------------------------------------------------

    console.log(
      '[Cashfree Verify] Fetching order:',
      orderId
    )

    const orderResponse =
      await Cashfree.PGFetchOrder(orderId)

    const cashfreeOrder = orderResponse?.data

    if (!cashfreeOrder) {
      throw new Error(
        'Unable to retrieve order from Cashfree'
      )
    }

    const orderStatus = String(
      cashfreeOrder.order_status || ''
    ).toUpperCase()

    console.log(
      '[Cashfree Verify] Order status:',
      orderStatus
    )

    // --------------------------------------------------
    // FETCH PAYMENT DETAILS
    // --------------------------------------------------

    let payments = []
    let successfulPayment = null

    try {
      const result =
        await getSuccessfulPayment(orderId)

      payments = result.payments
      successfulPayment =
        result.successPayment
    } catch (paymentError) {
      console.error(
        '[Cashfree Verify] Payment fetch failed:',
        paymentError?.response?.data ||
          paymentError.message
      )
    }

    // --------------------------------------------------
    // NOT PAID
    // --------------------------------------------------

    if (orderStatus !== 'PAID') {
      const latestPayment =
        payments.length > 0
          ? payments[payments.length - 1]
          : null

      const latest =
        getPaymentDetails(latestPayment || {})

      const isFailed =
        latest.status &&
        ['FAILED', 'USER_DROPPED'].includes(
          String(latest.status).toUpperCase()
        )

      await prisma.payment.update({
        where: {
          id: payment.id,
        },

        data: {
          status:
            isFailed
              ? 'failed'
              : 'pending',

          cashfreeOrderStatus:
            orderStatus || null,

          cashfreePaymentStatus:
            latest.status || null,

          cashfreePaymentId:
            latest.paymentId || null,

          cashfreePaymentMethod:
            latest.method || null,

          cashfreeBankReference:
            latest.bankReference || null,

          cashfreeFailureReason:
            latest.failureReason || null,

          callbackData:
            cashfreeOrder,
        },
      })

      /*
       * Do NOT cancel the MEDLI booking simply because
       * Cashfree is currently ACTIVE.
       *
       * The patient may still retry payment.
       */

      await prisma.booking.update({
        where: {
          id: booking.id,
        },

        data: {
          paymentStatus:
            isFailed
              ? 'failed'
              : 'pending',

          status:
            'pending_payment',
        },
      })

      return errorResponse(
        isFailed
          ? latest.failureReason ||
              'Payment failed'
          : 'Payment has not been completed yet',
        isFailed
          ? 'PAYMENT_FAILED'
          : 'PAYMENT_PENDING',
        400
      )
    }

    // --------------------------------------------------
    // ORDER PAID BUT PAYMENT ENTRY NOT FOUND
    // --------------------------------------------------

    if (!successfulPayment) {
      console.error(
        '[Cashfree Verify] Order PAID but successful payment not found:',
        orderId
      )

      return errorResponse(
        'Payment is marked paid but payment details are not available yet. Please retry verification.',
        'PAYMENT_DETAILS_PENDING',
        409
      )
    }

    const paymentDetails =
      getPaymentDetails(successfulPayment)

    // --------------------------------------------------
    // AMOUNT VALIDATION
    // --------------------------------------------------

    const cashfreeAmount =
      Number(cashfreeOrder.order_amount)

    const bookingAmount =
      Number(booking.totalAmount)

    if (
      !Number.isFinite(cashfreeAmount) ||
      !Number.isFinite(bookingAmount) ||
      Math.abs(
        cashfreeAmount - bookingAmount
      ) > 0.01
    ) {
      console.error(
        '[Cashfree Verify] Amount mismatch',
        {
          bookingAmount,
          cashfreeAmount,
          orderId,
        }
      )

      return errorResponse(
        'Payment amount verification failed',
        'AMOUNT_MISMATCH',
        400
      )
    }

    // --------------------------------------------------
    // UPDATE PAYMENT
    // --------------------------------------------------

    await prisma.payment.update({
      where: {
        id: payment.id,
      },

      data: {
        status:
          'success',

        cashfreeOrderStatus:
          orderStatus,

        cashfreePaymentStatus:
          paymentDetails.status,

        cashfreePaymentId:
          paymentDetails.paymentId,

        cashfreePaymentMethod:
          paymentDetails.method,

        cashfreeBankReference:
          paymentDetails.bankReference,

        cashfreeFailureReason:
          null,

        callbackData:
          successfulPayment,

        paidAt:
          new Date(),
      },
    })

    // --------------------------------------------------
    // CONFIRM BOOKING
    // --------------------------------------------------

    booking = await prisma.booking.update({
      where: {
        id: booking.id,
      },

      data: {
        status:
          'confirmed',

        paymentStatus:
          'paid',

        cashfreePaymentId:
          paymentDetails.paymentId,

        cashfreeCfOrderId:
          cashfreeOrder.cf_order_id
            ? String(
                cashfreeOrder.cf_order_id
              )
            : booking.cashfreeCfOrderId,
      },
    })

    console.log(
      '[Cashfree Verify] Payment verified:',
      {
        bookingId: booking.bookingId,
        orderId,
        paymentId:
          paymentDetails.paymentId,
      }
    )

    // --------------------------------------------------
    // CREATE INVOICE
    // --------------------------------------------------

    try {
      await createBookingInvoice(
        booking,
        paymentDetails.paymentId
      )

      console.log(
        '[Cashfree Verify] Invoice created'
      )
    } catch (invoiceError) {
      console.error(
        '[Cashfree Verify] Invoice creation failed:',
        invoiceError.message
      )
    }

    // --------------------------------------------------
    // GET USER
    // --------------------------------------------------

    const user = await prisma.user.findUnique({
      where: {
        id: booking.userId,
      },

      select: {
        name: true,
        email: true,
        phone: true,
      },
    })

    // --------------------------------------------------
    // HOSPITAL / DOCTOR / LAB
    // --------------------------------------------------

    let hospitalName = '-'
    let doctorName = '-'
    let doctorEmail = null
    let labName = '-'

    if (booking.hospitalId) {
      const hospital =
        await prisma.hospital.findUnique({
          where: {
            id: booking.hospitalId,
          },

          select: {
            name: true,
          },
        })

      if (hospital?.name) {
        hospitalName = hospital.name
      }
    }

    if (booking.doctorId) {
      const doctor =
        await prisma.doctor.findUnique({
          where: {
            id: booking.doctorId,
          },

          select: {
            name: true,
            userId: true,
          },
        })

      if (doctor?.name) {
        doctorName = doctor.name
      }

      if (doctor?.userId) {
        const doctorUser =
          await prisma.user.findUnique({
            where: {
              id: doctor.userId,
            },

            select: {
              email: true,
            },
          })

        doctorEmail =
          doctorUser?.email || null
      }
    }

    if (booking.labId) {
      const lab =
        await prisma.lab.findUnique({
          where: {
            id: booking.labId,
          },

          select: {
            name: true,
          },
        })

      if (lab?.name) {
        labName = lab.name
      }
    }

    // --------------------------------------------------
    // ONLINE BOOKING → GOOGLE MEET
    // --------------------------------------------------

    let meetLink =
      booking.meetLink || null

    if (
      booking.type === 'online' &&
      !meetLink
    ) {
      console.log(
        '[Cashfree Verify] Creating Google Meet...'
      )

      try {
        const {
          createConsultationEvent,
        } = await import(
          '@/lib/services/meet.service'
        )

        const result =
          await createConsultationEvent({
            bookingId:
              booking.bookingId,

            doctorEmail:
              doctorEmail ||
              process.env.DEFAULT_DOCTOR_EMAIL ||
              'doctor@medli.in',

            patientEmail:
              user?.email ||
              'patient@medli.in',

            patientName:
              user?.name ||
              'Patient',

            doctorName,

            startTime:
              booking.startTime,

            endTime:
              booking.endTime ||
              new Date(
                new Date(
                  booking.startTime
                ).getTime() +
                  30 * 60 * 1000
              ),

            timezone:
              booking.timezone ||
              'Asia/Kolkata',
          })

        meetLink =
          result.meetLink

        booking =
          await prisma.booking.update({
            where: {
              id: booking.id,
            },

            data: {
              meetLink,

              calendarEventId:
                result.calendarEventId,
            },
          })

        console.log(
          '[Cashfree Verify] Meet created:',
          meetLink
        )
      } catch (meetError) {
        /*
         * Do NOT create fake Google Meet URLs.
         *
         * Your previous implementation generated a
         * random meet.google.com URL when Google failed.
         * That URL isn't a real meeting.
         */

        console.error(
          '[Cashfree Verify] Google Meet creation failed:',
          meetError.message
        )
      }
    }

    // --------------------------------------------------
    // EMAIL
    // --------------------------------------------------

    if (user?.email) {
      try {
        const bookingDate =
          booking.startTime
            ? new Date(
                booking.startTime
              ).toLocaleDateString(
                'en-IN',
                {
                  dateStyle:
                    'full',

                  timeZone:
                    'Asia/Kolkata',
                }
              )
            : '-'

        const bookingTime =
          booking.startTime
            ? new Date(
                booking.startTime
              ).toLocaleTimeString(
                'en-IN',
                {
                  hour:
                    '2-digit',

                  minute:
                    '2-digit',

                  timeZone:
                    'Asia/Kolkata',
                }
              )
            : '-'

        const fullDateTime =
          `${bookingDate} at ${bookingTime}`

        const bookingUrl =
          `${process.env.NEXT_PUBLIC_APP_URL}` +
          `/user/bookings/${booking.id}`

        let template

        if (
          booking.type === 'online' &&
          meetLink
        ) {
          template =
            meetLinkTemplate({
              patientName:
                user.name ||
                'User',

              bookingId:
                booking.bookingId,

              doctorName,

              hospitalName,

              startTime:
                fullDateTime,

              meetLink,

              totalAmount:
                booking.totalAmount,

              bookingUrl,
            })
        } else {
          template =
            bookingConfirmedTemplate({
              patientName:
                user.name ||
                'User',

              bookingId:
                booking.bookingId,

              bookingType:
                booking.type,

              hospitalName:
                booking.type === 'lab'
                  ? labName
                  : hospitalName,

              doctorName:
                booking.type === 'lab'
                  ? '-'
                  : doctorName,

              startTime:
                fullDateTime,

              totalAmount:
                booking.totalAmount,

              bookingUrl,
            })
        }

        await sendEmail({
          to:
            user.email,

          subject:
            template.subject,

          text:
            template.text,

          html:
            template.html,
        })

        console.log(
          '[Cashfree Verify] Patient email sent:',
          user.email
        )

        // ----------------------------------------------
        // DOCTOR EMAIL
        // ----------------------------------------------

        if (
          booking.type === 'online' &&
          meetLink &&
          doctorEmail
        ) {
          try {
            const doctorTemplate =
              meetLinkTemplate({
                patientName:
                  `Doctor ${doctorName}`,

                bookingId:
                  booking.bookingId,

                doctorName:
                  user.name ||
                  'Patient',

                hospitalName,

                startTime:
                  fullDateTime,

                meetLink,

                totalAmount:
                  booking.totalAmount,

                bookingUrl:
                  `${process.env.NEXT_PUBLIC_APP_URL}` +
                  '/doctor/appointments',
              })

            await sendEmail({
              to:
                doctorEmail,

              subject:
                `New Online Consultation - ${booking.bookingId}`,

              text:
                doctorTemplate.text,

              html:
                doctorTemplate.html,
            })

            console.log(
              '[Cashfree Verify] Doctor email sent:',
              doctorEmail
            )
          } catch (doctorEmailError) {
            console.error(
              '[Cashfree Verify] Doctor email failed:',
              doctorEmailError.message
            )
          }
        }
      } catch (emailError) {
        console.error(
          '[Cashfree Verify] Patient email failed:',
          emailError.message
        )
      }
    }

    // --------------------------------------------------
    // SUCCESS
    // --------------------------------------------------

    return successResponse(
      {
        bookingId:
          booking.id,

        bookingRef:
          booking.bookingId,

        orderId,

        paymentId:
          paymentDetails.paymentId,

        paymentStatus:
          'paid',

        bookingStatus:
          'confirmed',

        meetLink:
          meetLink || null,
      },

      booking.type === 'online' &&
        meetLink
        ? 'Payment verified — Meet link sent to your email'
        : 'Payment verified successfully'
    )
  } catch (error) {
    console.error(
      '[Cashfree Verify] ERROR:',
      error?.response?.data ||
        error?.message ||
        error
    )

    return errorResponse(
      error?.response?.data?.message ||
        error?.message ||
        'Payment verification failed',

      'CASHFREE_VERIFY_ERROR',

      500
    )
  }
}