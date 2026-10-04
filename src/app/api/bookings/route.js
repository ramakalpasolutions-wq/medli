import { verifyAuth } from '@/lib/middleware/auth.middleware'

import {
  successResponse,
  errorResponse,
} from '@/lib/utils/apiResponse'

export async function POST(request) {
  return verifyAuth(
    request,
    async (req, user) => {
      try {
        const body =
          await req.json()

        if (!body.type) {
          return errorResponse(
            'Booking type is required',
            'VALIDATION_ERROR',
            400
          )
        }

        if (!body.startTime) {
          return errorResponse(
            'Start time is required',
            'VALIDATION_ERROR',
            400
          )
        }

        console.log(
          '[POST /api/bookings] Request received:',
          {
            userId:
              user.userId ||
              user.id,

            type:
              body.type,

            hospitalId:
              body.hospitalId ||
              null,

            doctorId:
              body.doctorId ||
              null,

            labId:
              body.labId ||
              null,

            testIds:
              Array.isArray(
                body.testIds
              )
                ? body.testIds
                : [],

            collectionType:
              body.collectionType ||
              null,

            startTime:
              body.startTime,

            endTime:
              body.endTime ||
              null,

            timezone:
              body.timezone ||
              'Asia/Kolkata',

            couponCode:
              body.couponCode ||
              null,
          }
        )

        const {
          createBooking,
        } = await import(
          '@/lib/services/booking.service'
        )

        const booking =
          await createBooking({
            userId:
              user.userId ||
              user.id,

            type:
              body.type,

            hospitalId:
              body.hospitalId ||
              null,

            doctorId:
              body.doctorId ||
              null,

            labId:
              body.labId ||
              null,

            testIds:
              Array.isArray(
                body.testIds
              )
                ? body.testIds
                : [],

            collectionType:
              body.collectionType ||
              null,

            collectionAddress:
              body.collectionAddress ||
              null,

            startTime:
              body.startTime,

            endTime:
              body.endTime ||
              null,

            timezone:
              body.timezone ||
              'Asia/Kolkata',

            couponCode:
              body.couponCode ||
              null,
          })


        if (!booking) {
          throw new Error(
            'Booking creation failed'
          )
        }


        const amount =
          Number(
            booking.totalAmount
          )


        if (
          !Number.isFinite(
            amount
          ) ||
          amount <= 0
        ) {
          console.error(
            '[POST /api/bookings] Invalid booking amount:',
            {
              bookingId:
                booking.id,

              baseFee:
                booking.baseFee,

              discountedFee:
                booking.discountedFee,

              platformFee:
                booking.platformFee,

              gst:
                booking.gst,

              subtotal:
                booking.subtotal,

              totalAmount:
                booking.totalAmount,
            }
          )

          return errorResponse(
            'Invalid booking amount calculated',
            'VALIDATION_ERROR',
            400
          )
        }


        console.log(
          '[POST /api/bookings] Success:',
          {
            id:
              booking.id,

            bookingId:
              booking.bookingId,

            type:
              booking.type,

            amount:
              booking.totalAmount,
          }
        )


        return successResponse(
          booking,
          'Booking created successfully',
          201
        )
      } catch (error) {
        console.error(
          '[POST /api/bookings] ERROR:',
          {
            name:
              error?.name,

            message:
              error?.message,

            code:
              error?.code,

            meta:
              error?.meta,

            cause:
              error?.cause,

            stack:
              error?.stack,
          }
        )


        const message =
          error?.message ||
          'Failed to create booking'


        const validationMessages = [
          'required',
          'invalid',
          'inactive',
          'not found',
          'not available',
          'does not belong',
          'already booked',
          'must be',
          'future',
          'not configured',
          'amount',
          'collection',
          'test',
          'slot',
        ]


        const isValidationError =
          validationMessages.some(
            (text) =>
              String(message)
                .toLowerCase()
                .includes(text)
          )


        return errorResponse(
          message,

          isValidationError
            ? 'VALIDATION_ERROR'
            : 'SERVER_ERROR',

          isValidationError
            ? 400
            : 500
        )
      }
    }
  )
}