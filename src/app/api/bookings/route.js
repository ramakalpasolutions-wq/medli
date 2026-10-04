export async function POST(request) {
  return verifyAuth(request, async (req, user) => {
    try {
      const body = await request.json()

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

      const { createBooking } =
        await import(
          '@/lib/services/booking.service'
        )

      const booking = await createBooking({
        userId:
          user.userId || user.id,

        type:
          body.type,

        hospitalId:
          body.hospitalId || null,

        doctorId:
          body.doctorId || null,

        labId:
          body.labId || null,

        testIds:
          Array.isArray(body.testIds)
            ? body.testIds
            : [],

        collectionType:
          body.collectionType || null,

        collectionAddress:
          body.collectionAddress || null,

        startTime:
          body.startTime,

        endTime:
          body.endTime || null,

        timezone:
          body.timezone || 'Asia/Kolkata',

        couponCode:
          body.couponCode || null,
      })

      return successResponse(
        booking,
        'Booking created successfully',
        201
      )
    } catch (error) {
      console.error(
        '[POST /api/bookings]',
        error
      )

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
      ]

      const isValidationError =
        validationMessages.some((text) =>
          String(error.message || '')
            .toLowerCase()
            .includes(text)
        )

      return errorResponse(
        error.message ||
          'Failed to create booking',

        isValidationError
          ? 'VALIDATION_ERROR'
          : 'SERVER_ERROR',

        isValidationError
          ? 400
          : 500
      )
    }
  })
}