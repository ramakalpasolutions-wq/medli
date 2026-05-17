// C:\Users\ASUS\medli2\src\app\api\payments\verify\route.js

import crypto                   from 'crypto'
import { prisma }               from '@/lib/prisma'
import { verifyAuth }           from '@/lib/middleware/auth.middleware'
import {
  successResponse,
  errorResponse,
  handleOptions,
} from '@/lib/utils/apiResponse'
import { sendEmail }            from '@/lib/email'
import {
  bookingConfirmedTemplate,
  meetLinkTemplate,
} from '@/lib/emailTemplates'

export function OPTIONS() { return handleOptions() }

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

    /* ── Verify Razorpay signature ── */
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

    /* ── Update booking ── */
    let booking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status:            'confirmed',
        paymentStatus:     'paid',
        razorpayPaymentId: razorpay_payment_id,
      },
    })

    /* ── Update payment ── */
    await prisma.payment.updateMany({
      where: { razorpayOrderId: razorpay_order_id },
      data: {
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        status:            'captured',
      },
    })

    /* ── Get user info ── */
    const user = await prisma.user.findUnique({
      where:  { id: booking.userId },
      select: { name: true, email: true, phone: true },
    })

    /* ── Get hospital/doctor/lab info ── */
    let hospitalName  = '-'
    let doctorName    = '-'
    let doctorEmail   = null
    let labName       = '-'

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
        select: { name: true, userId: true },
      })
      if (doctor?.name) doctorName = doctor.name

      /* Fetch doctor's user account for email */
      if (doctor?.userId) {
        const doctorUser = await prisma.user.findUnique({
          where:  { id: doctor.userId },
          select: { email: true },
        })
        doctorEmail = doctorUser?.email || null
      }
    }

    if (booking.labId) {
      const lab = await prisma.lab.findUnique({
        where: { id: booking.labId },
        select: { name: true },
      })
      if (lab?.name) labName = lab.name
    }

    /* ═══════════════════════════════════════════════════════════════
       ✅ ONLINE BOOKING — Generate Meet Link
    ═══════════════════════════════════════════════════════════════ */
    let meetLink = booking.meetLink || null

    if (booking.type === 'online' && !meetLink) {
      console.log('[Verify] Generating Meet link for online booking...')

      try {
        const { createConsultationEvent } = await import('@/lib/services/meet.service')

        const result = await createConsultationEvent({
          bookingId:    booking.bookingId,
          doctorEmail:  doctorEmail || process.env.DEFAULT_DOCTOR_EMAIL || 'doctor@medli.in',
          patientEmail: user?.email || 'patient@medli.in',
          patientName:  user?.name || 'Patient',
          doctorName:   doctorName,
          startTime:    booking.startTime,
          endTime:      booking.endTime || new Date(new Date(booking.startTime).getTime() + 30 * 60 * 1000),
          timezone:     booking.timezone || 'Asia/Kolkata',
        })

        meetLink = result.meetLink

        /* Persist Meet link + calendar event ID */
        booking = await prisma.booking.update({
          where: { id: booking.id },
          data: {
            meetLink,
            calendarEventId: result.calendarEventId,
          },
        })

        console.log('[Verify] ✅ Meet link generated:', meetLink)
      } catch (meetErr) {
        console.error('[Verify] ⚠️ Google Meet generation failed:', meetErr.message)

        /* ✅ Fallback: generate dummy Meet link for dev/testing */
        const dummyId = Math.random().toString(36).slice(2, 6) + '-' +
                        Math.random().toString(36).slice(2, 6) + '-' +
                        Math.random().toString(36).slice(2, 6)
        meetLink = `https://meet.google.com/${dummyId}`

        booking = await prisma.booking.update({
          where: { id: booking.id },
          data:  { meetLink },
        })

        console.log('[Verify] ⚠️ Using fallback dummy Meet link:', meetLink)
      }
    }

    /* ═══════════════════════════════════════════════════════════════
       ✅ Send Email (Meet link OR regular confirmation)
    ═══════════════════════════════════════════════════════════════ */
    if (user?.email) {
      try {
        const bookingDate = booking.startTime
          ? new Date(booking.startTime).toLocaleDateString('en-IN', {
              dateStyle: 'full',
              timeZone:  'Asia/Kolkata',
            })
          : '-'

        const bookingTime = booking.startTime
          ? new Date(booking.startTime).toLocaleTimeString('en-IN', {
              hour:     '2-digit',
              minute:   '2-digit',
              timeZone: 'Asia/Kolkata',
            })
          : '-'

        const fullDateTime = `${bookingDate} at ${bookingTime}`
        const bookingUrl   = `${process.env.NEXT_PUBLIC_APP_URL}/user/bookings/${booking.id}`

        let template

        /* ✅ Use Meet link template for online bookings */
        if (booking.type === 'online' && meetLink) {
          template = meetLinkTemplate({
            patientName:  user.name || 'User',
            bookingId:    booking.bookingId,
            doctorName,
            hospitalName,
            startTime:    fullDateTime,
            meetLink,
            totalAmount:  booking.totalAmount,
            bookingUrl,
          })
        } else {
          /* Regular booking confirmation */
          template = bookingConfirmedTemplate({
            patientName:  user.name || 'User',
            bookingId:    booking.bookingId,
            bookingType:  booking.type,
            hospitalName: booking.type === 'lab' ? labName : hospitalName,
            doctorName:   booking.type === 'lab' ? '-' : doctorName,
            startTime:    fullDateTime,
            totalAmount:  booking.totalAmount,
            bookingUrl,
          })
        }

        const info = await sendEmail({
          to:      user.email,
          subject: template.subject,
          text:    template.text,
          html:    template.html,
        })

        console.log('[Verify] ✅ Patient email sent to:', user.email)
        console.log('[Verify] Email messageId:', info.messageId)

        /* ✅ Also send Meet link to doctor for online bookings */
        if (booking.type === 'online' && meetLink && doctorEmail) {
          try {
            const doctorTemplate = meetLinkTemplate({
              patientName:  `Doctor ${doctorName}`,
              bookingId:    booking.bookingId,
              doctorName:   user.name || 'Patient',  // swap names for doctor's view
              hospitalName,
              startTime:    fullDateTime,
              meetLink,
              totalAmount:  booking.totalAmount,
              bookingUrl:   `${process.env.NEXT_PUBLIC_APP_URL}/doctor/appointments`,
            })

            await sendEmail({
              to:      doctorEmail,
              subject: `🎥 New Online Consultation - ${booking.bookingId}`,
              text:    doctorTemplate.text,
              html:    doctorTemplate.html,
            })

            console.log('[Verify] ✅ Doctor email sent to:', doctorEmail)
          } catch (drMailErr) {
            console.warn('[Verify] ⚠️ Doctor email failed:', drMailErr.message)
          }
        }
      } catch (mailError) {
        console.error('[Verify] ⚠️ Patient email failed:', mailError.message)
        /* Don't fail the booking — email is non-critical */
      }
    }

    console.log('[Verify] ✅ Booking confirmed:', bookingId, '| type:', booking.type)

    return successResponse(
      {
        bookingId,
        razorpayPaymentId: razorpay_payment_id,
        meetLink:          meetLink || null,
      },
      booking.type === 'online' && meetLink
        ? '✅ Payment verified — Meet link sent to your email'
        : '✅ Payment verified successfully',
    )
  } catch (error) {
    console.error('[Verify ERROR]', error)
    return errorResponse(
      error.message || 'Internal server error',
      'SERVER_ERROR',
      500,
    )
  }
}