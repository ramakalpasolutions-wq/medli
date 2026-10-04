// ============================================================
// REQUIRED IMPORT
// Add this with your existing imports at the top of route.js
// ============================================================

import { verifyAuth } from '@/lib/middleware/auth.middleware'

// ============================================================
// POST /api/bookings
// ============================================================

export async function POST(request) {
  try {
    // ========================================================
    // AUTHENTICATION
    // ========================================================

    const user = await verifyAuth(request)

    const userId =
      user?.userId ||
      user?.id

    if (!userId) {
      return errorResponse(
        'Unauthorized',
        'UNAUTHORIZED',
        401
      )
    }

    // ========================================================
    // REQUEST BODY
    // ========================================================

    let body

    try {
      body = await request.json()
    } catch (error) {
      console.error(
        '[POST /api/bookings] Invalid JSON:',
        error
      )

      return errorResponse(
        'Invalid request body',
        'VALIDATION_ERROR',
        400
      )
    }

    console.log(
      '[POST /api/bookings] Request received:',
      {
        userId,

        type:
          body?.type || null,

        hospitalId:
          body?.hospitalId || null,

        doctorId:
          body?.doctorId || null,

        labId:
          body?.labId || null,

        testIds:
          Array.isArray(body?.testIds)
            ? body.testIds
            : [],

        collectionType:
          body?.collectionType || null,

        startTime:
          body?.startTime || null,

        endTime:
          body?.endTime || null,

        timezone:
          body?.timezone ||
          'Asia/Kolkata',

        couponCode:
          body?.couponCode || null,
      }
    )

    // ========================================================
    // BOOKING TYPE VALIDATION
    // ========================================================

    if (!body?.type) {
      return errorResponse(
        'Booking type is required',
        'VALIDATION_ERROR',
        400
      )
    }

    const allowedTypes = [
      'hospital',
      'online',
      'lab',
    ]

    if (
      !allowedTypes.includes(
        body.type
      )
    ) {
      return errorResponse(
        'Invalid booking type',
        'VALIDATION_ERROR',
        400
      )
    }

    // ========================================================
    // START TIME VALIDATION
    // ========================================================

    if (!body.startTime) {
      return errorResponse(
        'Start time is required',
        'VALIDATION_ERROR',
        400
      )
    }

    const startTime =
      new Date(body.startTime)

    if (
      Number.isNaN(
        startTime.getTime()
      )
    ) {
      return errorResponse(
        'Invalid start time',
        'VALIDATION_ERROR',
        400
      )
    }

    // ========================================================
    // END TIME VALIDATION
    // ========================================================

    if (body.endTime) {
      const endTime =
        new Date(body.endTime)

      if (
        Number.isNaN(
          endTime.getTime()
        )
      ) {
        return errorResponse(
          'Invalid end time',
          'VALIDATION_ERROR',
          400
        )
      }

      if (
        endTime <= startTime
      ) {
        return errorResponse(
          'End time must be after start time',
          'VALIDATION_ERROR',
          400
        )
      }
    }

    // ========================================================
    // HOSPITAL BOOKING VALIDATION
    // ========================================================

    if (
      body.type === 'hospital'
    ) {
      if (!body.doctorId) {
        return errorResponse(
          'Doctor is required',
          'VALIDATION_ERROR',
          400
        )
      }

      if (!body.hospitalId) {
        return errorResponse(
          'Hospital is required',
          'VALIDATION_ERROR',
          400
        )
      }
    }

    // ========================================================
    // ONLINE CONSULTATION VALIDATION
    // ========================================================

    if (
      body.type === 'online'
    ) {
      if (!body.doctorId) {
        return errorResponse(
          'Doctor is required',
          'VALIDATION_ERROR',
          400
        )
      }
    }

    // ========================================================
    // LAB BOOKING VALIDATION
    // ========================================================

    if (
      body.type === 'lab'
    ) {
      if (!body.labId) {
        return errorResponse(
          'Lab is required',
          'VALIDATION_ERROR',
          400
        )
      }

      if (
        !Array.isArray(
          body.testIds
        ) ||
        body.testIds.length === 0
      ) {
        return errorResponse(
          'At least one lab test is required',
          'VALIDATION_ERROR',
          400
        )
      }

      // Remove empty/duplicate test IDs

      body.testIds = [
        ...new Set(
          body.testIds.filter(
            Boolean
          )
        ),
      ]

      if (
        body.testIds.length === 0
      ) {
        return errorResponse(
          'At least one valid lab test is required',
          'VALIDATION_ERROR',
          400
        )
      }

      // ----------------------------------------
      // Collection type
      // ----------------------------------------

      if (body.collectionType) {
        const allowedCollectionTypes = [
          'walk_in',
          'home',
        ]

        if (
          !allowedCollectionTypes.includes(
            body.collectionType
          )
        ) {
          return errorResponse(
            'Invalid collection type',
            'VALIDATION_ERROR',
            400
          )
        }
      }

      // ----------------------------------------
      // Home collection address
      // ----------------------------------------

      if (
        body.collectionType ===
          'home' &&
        !body.collectionAddress
      ) {
        return errorResponse(
          'Collection address is required for home collection',
          'VALIDATION_ERROR',
          400
        )
      }
    }

    // ========================================================
    // LOAD BOOKING SERVICE
    // ========================================================

    const {
      createBooking,
    } = await import(
      '@/lib/services/booking.service'
    )

    if (
      typeof createBooking !==
      'function'
    ) {
      throw new Error(
        'Booking service is not configured correctly'
      )
    }

    // ========================================================
    // CREATE BOOKING
    // ========================================================
    //
    // IMPORTANT:
    //
    // Pricing is NOT accepted from frontend.
    //
    // Do not pass:
    //
    // baseFee
    // discountedFee
    // platformFee
    // GST
    // subtotal
    // totalAmount
    //
    // booking.service.js calculates them from MongoDB.
    //
    // ========================================================

    const booking =
      await createBooking({
        userId,

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
          body.type === 'lab'
            ? body.testIds
            : [],

        collectionType:
          body.type === 'lab'
            ? body.collectionType ||
              'walk_in'
            : null,

        collectionAddress:
          body.type === 'lab'
            ? body.collectionAddress ||
              null
            : null,

        startTime:
          body.startTime,

        // booking.service.js can calculate
        // endTime when frontend doesn't send it.
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

    // ========================================================
    // BOOKING CREATION SAFETY CHECK
    // ========================================================

    if (!booking) {
      throw new Error(
        'Booking service returned no booking'
      )
    }

    if (!booking.id) {
      throw new Error(
        'Booking was not created correctly'
      )
    }

    // ========================================================
    // SERVER PRICING LOG
    // ========================================================

    console.log(
      '[POST /api/bookings] Booking created:',
      {
        id:
          booking.id,

        bookingId:
          booking.bookingId ||
          booking.id,

        userId:
          booking.userId,

        type:
          booking.type,

        status:
          booking.status,

        paymentStatus:
          booking.paymentStatus,

        baseFee:
          booking.baseFee,

        couponDiscount:
          booking.couponDiscount,

        discountedFee:
          booking.discountedFee,

        platformFeePercent:
          booking.platformFeePercent,

        platformFee:
          booking.platformFee,

        gstPercent:
          booking.gstPercent,

        gst:
          booking.gst,

        subtotal:
          booking.subtotal,

        adminCouponDiscount:
          booking.adminCouponDiscount,

        totalAmount:
          booking.totalAmount,
      }
    )

    // ========================================================
    // PAYMENT AMOUNT VALIDATION
    // ========================================================

    const totalAmount =
      Number(
        booking.totalAmount
      )

    if (
      !Number.isFinite(
        totalAmount
      )
    ) {
      console.error(
        '[POST /api/bookings] Non-numeric amount:',
        booking.totalAmount
      )

      throw new Error(
        'Invalid booking amount calculated'
      )
    }

    if (
      totalAmount <= 0
    ) {
      console.error(
        '[POST /api/bookings] Zero/negative amount:',
        {
          bookingId:
            booking.id,

          type:
            booking.type,

          baseFee:
            booking.baseFee,

          couponDiscount:
            booking.couponDiscount,

          discountedFee:
            booking.discountedFee,

          platformFeePercent:
            booking.platformFeePercent,

          platformFee:
            booking.platformFee,

          gstPercent:
            booking.gstPercent,

          gst:
            booking.gst,

          subtotal:
            booking.subtotal,

          adminCouponDiscount:
            booking.adminCouponDiscount,

          totalAmount:
            booking.totalAmount,
        }
      )

      throw new Error(
        'Invalid booking amount calculated'
      )
    }

    // ========================================================
    // SUCCESS
    // ========================================================

    console.log(
      '[POST /api/bookings] Success:',
      {
        bookingId:
          booking.id,

        type:
          booking.type,

        amount:
          totalAmount,
      }
    )

    return successResponse(
      booking,
      'Booking created successfully',
      201
    )
  } catch (error) {
    // ========================================================
    // ERROR LOG
    // ========================================================

    console.error(
      '[POST /api/bookings] Error:',
      {
        message:
          error?.message,

        name:
          error?.name,

        stack:
          error?.stack,
      }
    )

    const message =
      error?.message ||
      'Failed to create booking'

    const lowerMessage =
      String(message)
        .toLowerCase()

    // ========================================================
    // AUTHENTICATION ERRORS
    // ========================================================

    const authMessages = [
      'unauthorized',
      'authentication',
      'invalid token',
      'token expired',
      'expired token',
      'no token',
      'missing token',
      'not authenticated',
    ]

    const isAuthError =
      authMessages.some(
        (text) =>
          lowerMessage.includes(
            text
          )
      )

    if (isAuthError) {
      return errorResponse(
        message,
        'UNAUTHORIZED',
        401
      )
    }

    // ========================================================
    // VALIDATION ERRORS
    // ========================================================

    const validationMessages = [
      'required',
      'invalid',
      'inactive',
      'not found',
      'not available',
      'does not belong',
      'already booked',
      'already exists',
      'must be',
      'future',
      'not configured',
      'amount',
      'test',
      'doctor',
      'hospital',
      'lab',
      'collection',
      'slot',
      'availability',
      'booking time',
      'consultation',
    ]

    const isValidationError =
      validationMessages.some(
        (text) =>
          lowerMessage.includes(
            text
          )
      )

    if (isValidationError) {
      return errorResponse(
        message,
        'VALIDATION_ERROR',
        400
      )
    }

    // ========================================================
    // PRISMA ERRORS
    // ========================================================

    if (
      error?.code === 'P2002'
    ) {
      return errorResponse(
        'A booking already exists for the selected slot',
        'BOOKING_CONFLICT',
        409
      )
    }

    if (
      error?.code === 'P2025'
    ) {
      return errorResponse(
        'Requested booking resource was not found',
        'NOT_FOUND',
        404
      )
    }

    // ========================================================
    // SERVER ERROR
    // ========================================================

    return errorResponse(
      'Failed to create booking',
      'SERVER_ERROR',
      500
    )
  }
}