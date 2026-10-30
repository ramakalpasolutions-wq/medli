
import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/middleware/auth.middleware'
import {
  successResponse,
  errorResponse,
  handleOptions,
} from '@/lib/utils/apiResponse'

export const dynamic = 'force-dynamic'

export function OPTIONS() {
  return handleOptions()
}

// ==========================================================
// VALID BOOKING STATES
// ==========================================================

const BOOKING_STATUSES = new Set([
  'created',
  'pending_payment',
  'confirmed',
  'completed',
  'cancelled',
  'no_show',
  'refunded',
])

const LAB_STATUSES = new Set([
  'sample_collected',
  'processing',
  'report_ready',
])

const PAYMENT_STATUSES = new Set([
  'pending',
  'paid',
  'refunded',
  'partial_refund',
  'failed',
])

// Hospital Admin can update only appointment progress.
// Payment status must be managed by the payment workflow.
const HOSPITAL_TRANSITIONS = {
  created: ['confirmed'],
  pending_payment: ['confirmed'],
  confirmed: ['completed', 'no_show'],
  completed: [],
  no_show: [],
  cancelled: [],
  refunded: [],
}

const VALID_OBJECT_ID = /^[0-9a-fA-F]{24}$/

// ==========================================================
// PATCH /api/bookings/[id]/status
// ==========================================================

export async function PATCH(request, { params }) {
  try {
    // ------------------------------------------------------
    // 1. AUTHENTICATION
    // ------------------------------------------------------

    const user = await verifyAuth(request)

    if (!user) {
      return errorResponse(
        'Authentication required',
        'UNAUTHORIZED',
        401
      )
    }

    const userId = user.userId || user.id
    const role = user.role

    if (!userId) {
      return errorResponse(
        'Invalid authenticated user',
        'UNAUTHORIZED',
        401
      )
    }

    // ------------------------------------------------------
    // 2. GET BOOKING ID
    // ------------------------------------------------------

    const { id } = await params

    if (
      typeof id !== 'string' ||
      !VALID_OBJECT_ID.test(id)
    ) {
      return errorResponse(
        'Invalid booking ID',
        'VALIDATION_ERROR',
        400
      )
    }

    // ------------------------------------------------------
    // 3. VALIDATE REQUEST BODY
    // ------------------------------------------------------

    let body

    try {
      body = await request.json()
    } catch {
      return errorResponse(
        'Invalid JSON request body',
        'VALIDATION_ERROR',
        400
      )
    }

    if (
      !body ||
      typeof body !== 'object' ||
      Array.isArray(body)
    ) {
      return errorResponse(
        'Invalid request body',
        'VALIDATION_ERROR',
        400
      )
    }

    // ------------------------------------------------------
    // 4. FETCH BOOKING
    // ------------------------------------------------------

    const booking = await prisma.booking.findUnique({
      where: { id },
    })

    if (!booking) {
      return errorResponse(
        'Booking not found',
        'NOT_FOUND',
        404
      )
    }

    const updateData = {}
    const updateWhere = {
      id,
      status: booking.status,
    }

    // ======================================================
    // 5. HOSPITAL ADMIN
    // ======================================================

    if (role === 'hospital_admin') {
      // Hospital Admin cannot change gateway/payment details.

      if (
        Object.prototype.hasOwnProperty.call(body, 'paymentStatus') ||
        Object.prototype.hasOwnProperty.call(body, 'labStatus')
      ) {
        return errorResponse(
          'Hospital admins cannot update payment or lab status',
          'FORBIDDEN',
          403
        )
      }

      if (
        typeof body.status !== 'string' ||
        !BOOKING_STATUSES.has(body.status)
      ) {
        return errorResponse(
          'A valid booking status is required',
          'VALIDATION_ERROR',
          400
        )
      }

      // Find the hospital linked to the logged-in admin.
      // This is the same relationship used by GET /api/bookings.

      const hospital = await prisma.hospital.findFirst({
        where: {
          adminUserId: userId,
        },
        select: {
          id: true,
          name: true,
        },
      })

      if (!hospital) {
        return errorResponse(
          'No hospital is assigned to this administrator',
          'HOSPITAL_NOT_FOUND',
          403
        )
      }

      // Strict hospital ownership verification.

      if (
        !booking.hospitalId ||
        booking.hospitalId !== hospital.id ||
        !['hospital', 'online'].includes(booking.type)
      ) {
        return errorResponse(
          'You can update bookings belonging only to your hospital',
          'FORBIDDEN',
          403
        )
      }

      // Check allowed status transition.

      const allowed =
        HOSPITAL_TRANSITIONS[booking.status] || []

      if (!allowed.includes(body.status)) {
        return errorResponse(
          `Cannot change booking status from ${booking.status} to ${body.status}`,
          'INVALID_STATUS_TRANSITION',
          409
        )
      }

      // Only payment-confirmed bookings may progress.

      if (booking.paymentStatus !== 'paid') {
        return errorResponse(
          'Payment must be verified before updating this booking status',
          'PAYMENT_NOT_VERIFIED',
          409
        )
      }

      updateData.status = body.status

      // Recheck ownership, old status, and paid state
      // during the database update.
      updateWhere.hospitalId = hospital.id
      updateWhere.paymentStatus = 'paid'

    // ======================================================
    // 6. DOCTOR
    // ======================================================

    } else if (role === 'doctor') {
      if (
        !['completed', 'no_show'].includes(body.status)
      ) {
        return errorResponse(
          'Doctors can only set completed or no_show',
          'FORBIDDEN',
          403
        )
      }

      const doctor = await prisma.doctor.findFirst({
        where: {
          userId,
        },
        select: {
          id: true,
        },
      })

      if (
        !doctor ||
        booking.doctorId !== doctor.id
      ) {
        return errorResponse(
          'You are not assigned to this booking',
          'FORBIDDEN',
          403
        )
      }

      if (booking.status !== 'confirmed') {
        return errorResponse(
          'Only confirmed appointments can be completed or marked no-show',
          'INVALID_STATUS_TRANSITION',
          409
        )
      }

      updateData.status = body.status
      updateWhere.doctorId = doctor.id

    // ======================================================
    // 7. LAB ADMIN
    // ======================================================

    } else if (role === 'lab_admin') {
      if (
        !body.labStatus ||
        !LAB_STATUSES.has(body.labStatus)
      ) {
        return errorResponse(
          'A valid labStatus is required',
          'VALIDATION_ERROR',
          400
        )
      }

      const lab = await prisma.lab.findFirst({
        where: {
          adminUserId: userId,
        },
        select: {
          id: true,
        },
      })

      if (
        !lab ||
        booking.labId !== lab.id ||
        booking.type !== 'lab'
      ) {
        return errorResponse(
          'You can update only your lab bookings',
          'FORBIDDEN',
          403
        )
      }

      if (
        ['cancelled', 'refunded'].includes(
          booking.status
        )
      ) {
        return errorResponse(
          'Cancelled or refunded bookings cannot be updated',
          'INVALID_STATUS_TRANSITION',
          409
        )
      }

      updateData.labStatus = body.labStatus

      // Preserve your existing report-ready behavior.
      if (body.labStatus === 'report_ready') {
        updateData.status = 'completed'
      }

      updateWhere.labId = lab.id

    // ======================================================
    // 8. SUPER ADMIN
    // ======================================================

    } else if (role === 'super_admin') {
      if (body.status !== undefined) {
        if (!BOOKING_STATUSES.has(body.status)) {
          return errorResponse(
            'Invalid booking status',
            'VALIDATION_ERROR',
            400
          )
        }

        updateData.status = body.status
      }

      if (body.labStatus !== undefined) {
        if (!LAB_STATUSES.has(body.labStatus)) {
          return errorResponse(
            'Invalid lab status',
            'VALIDATION_ERROR',
            400
          )
        }

        updateData.labStatus = body.labStatus
      }

      if (body.paymentStatus !== undefined) {
        if (
          !PAYMENT_STATUSES.has(
            body.paymentStatus
          )
        ) {
          return errorResponse(
            'Invalid payment status',
            'VALIDATION_ERROR',
            400
          )
        }

        // Preserves existing super admin functionality.
        // This does not initiate or verify a Cashfree payment.
        updateData.paymentStatus = body.paymentStatus
      }

    // ======================================================
    // 9. UNAUTHORIZED ROLES
    // ======================================================

    } else {
      return errorResponse(
        'Your account is not authorized to update booking status',
        'FORBIDDEN',
        403
      )
    }

    // ------------------------------------------------------
    // 10. ENSURE THERE IS SOMETHING TO UPDATE
    // ------------------------------------------------------

    if (Object.keys(updateData).length === 0) {
      return errorResponse(
        'No valid fields provided for update',
        'VALIDATION_ERROR',
        400
      )
    }

    // ------------------------------------------------------
    // 11. UPDATE BOOKING
    // ------------------------------------------------------

    // updateMany with conditional filters prevents an outdated
    // status change from overwriting a concurrent status update.

    const result = await prisma.booking.updateMany({
      where: updateWhere,
      data: updateData,
    })

    if (result.count !== 1) {
      return errorResponse(
        'Booking status or payment has changed. Refresh and try again.',
        'BOOKING_CONFLICT',
        409
      )
    }

    const updated = await prisma.booking.findUnique({
      where: { id },
    })

    // ------------------------------------------------------
    // 12. LOG STATUS UPDATE
    // ------------------------------------------------------

    console.log('[Booking Status Updated]', {
      bookingId: id,
      publicBookingId: booking.bookingId,
      userId,
      role,
      previousStatus: booking.status,
      newStatus: updated.status,
      previousLabStatus: booking.labStatus,
      newLabStatus: updated.labStatus,
    })

    // ------------------------------------------------------
    // 13. SUCCESS RESPONSE
    // ------------------------------------------------------

    return successResponse(
      updated,
      'Booking status updated successfully'
    )

  } catch (error) {
    console.error(
      '[PATCH /api/bookings/[id]/status]',
      error
    )

    const message = String(error?.message || '')

    if (
      /token|authentication|unauthorized|jwt|session expired/i.test(
        message
      )
    ) {
      return errorResponse(
        'Authentication expired. Please log in again.',
        'AUTH_ERROR',
        401
      )
    }

    return errorResponse(
      'Failed to update booking status',
      'SERVER_ERROR',
      500
    )
  }
}
