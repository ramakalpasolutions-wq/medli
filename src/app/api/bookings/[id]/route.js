// src/app/api/bookings/[id]/route.js

import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/middleware/auth.middleware'
import {
  successResponse,
  errorResponse,
  handleOptions,
} from '@/lib/utils/apiResponse'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export function OPTIONS() {
  return handleOptions()
}

/**
 * GET /api/bookings/:id
 *
 * Get a single booking.
 *
 * Access:
 * - user: own booking only
 * - super_admin: any booking
 * - lab_admin: booking belonging to their lab
 * - hospital_admin: booking belonging to their hospital
 * - doctor: booking belonging to that doctor
 * - regional_manager: allowed for now
 */
export async function GET(request, { params }) {
  try {
    console.log(
      '═══════════════════════════════════════════════════════'
    )
    console.log(
      '[GET BOOKING] Request received:',
      new Date().toISOString()
    )
    console.log(
      '═══════════════════════════════════════════════════════'
    )

    // =====================================================
    // AUTH
    // =====================================================

    const user = await verifyAuth(request)

    if (!user) {
      return errorResponse(
        'Unauthorized',
        'UNAUTHORIZED',
        401
      )
    }

    const authUserId =
      user.userId || user.id

    if (!authUserId) {
      return errorResponse(
        'Unauthorized',
        'UNAUTHORIZED',
        401
      )
    }

    // =====================================================
    // PARAMS
    // =====================================================

    const { id } = await params

    if (!id) {
      return errorResponse(
        'Booking ID is required',
        'VALIDATION_ERROR',
        400
      )
    }

    console.log('[GET BOOKING] Params:', {
      id,
      authUserId,
      role: user.role,
    })

    // =====================================================
    // FIND BOOKING
    // =====================================================

    /*
     * Normally the frontend sends MongoDB booking.id.
     *
     * We also support the human-readable bookingId
     * so URLs/API calls can work with either identifier.
     */

    let booking = null

    try {
      booking =
        await prisma.booking.findUnique({
          where: {
            id,
          },
        })
    } catch (findByIdError) {
      console.warn(
        '[GET BOOKING] Could not search by Mongo id:',
        findByIdError.message
      )
    }

    if (!booking) {
      booking =
        await prisma.booking.findFirst({
          where: {
            bookingId: id,
          },
        })
    }

    if (!booking) {
      console.log(
        '[GET BOOKING] Booking not found:',
        id
      )

      return errorResponse(
        'Booking not found',
        'NOT_FOUND',
        404
      )
    }

    console.log('[GET BOOKING] Found:', {
      id: booking.id,
      bookingId: booking.bookingId,
      userId: booking.userId,
      type: booking.type,
      status: booking.status,
      paymentStatus:
        booking.paymentStatus,
      labId: booking.labId || null,
      hospitalId:
        booking.hospitalId || null,
      doctorId:
        booking.doctorId || null,
      cashfreeOrderId:
        booking.cashfreeOrderId || null,
      cashfreePaymentId:
        booking.cashfreePaymentId || null,
    })

    // =====================================================
    // PERMISSION CHECK
    // =====================================================

    const role = user.role

    // ---------------------------
    // NORMAL USER
    // ---------------------------

    if (role === 'user') {
      if (
        String(booking.userId) !==
        String(authUserId)
      ) {
        return errorResponse(
          'You do not have permission to view this booking',
          'FORBIDDEN',
          403
        )
      }
    }

    // ---------------------------
    // LAB ADMIN
    // ---------------------------

    else if (role === 'lab_admin') {
      const lab =
        await prisma.lab.findFirst({
          where: {
            adminUserId:
              authUserId,
          },

          select: {
            id: true,
          },
        })

      if (!lab) {
        return errorResponse(
          'Lab account not found',
          'LAB_NOT_FOUND',
          404
        )
      }

      if (
        !booking.labId ||
        String(booking.labId) !==
          String(lab.id)
      ) {
        return errorResponse(
          'You do not have permission to view this booking',
          'FORBIDDEN',
          403
        )
      }
    }

    // ---------------------------
    // HOSPITAL ADMIN
    // ---------------------------

    else if (
      role === 'hospital_admin'
    ) {
      const hospital =
        await prisma.hospital.findFirst({
          where: {
            adminUserId:
              authUserId,
          },

          select: {
            id: true,
          },
        })

      if (!hospital) {
        return errorResponse(
          'Hospital account not found',
          'HOSPITAL_NOT_FOUND',
          404
        )
      }

      if (
        !booking.hospitalId ||
        String(
          booking.hospitalId
        ) !==
          String(hospital.id)
      ) {
        return errorResponse(
          'You do not have permission to view this booking',
          'FORBIDDEN',
          403
        )
      }
    }

    // ---------------------------
    // DOCTOR
    // ---------------------------

    else if (role === 'doctor') {
      const doctor =
        await prisma.doctor.findFirst({
          where: {
            userId:
              authUserId,
          },

          select: {
            id: true,
          },
        })

      if (!doctor) {
        return errorResponse(
          'Doctor account not found',
          'DOCTOR_NOT_FOUND',
          404
        )
      }

      if (
        !booking.doctorId ||
        String(
          booking.doctorId
        ) !==
          String(doctor.id)
      ) {
        return errorResponse(
          'You do not have permission to view this booking',
          'FORBIDDEN',
          403
        )
      }
    }

    // ---------------------------
    // SUPER ADMIN
    // ---------------------------

    else if (
      role === 'super_admin'
    ) {
      // Super admin can view every booking.
    }

    // ---------------------------
    // REGIONAL MANAGER
    // ---------------------------

    else if (
      role === 'regional_manager'
    ) {
      /*
       * Keep allowed for now.
       *
       * Later this should be restricted according
       * to the regional manager's assigned region.
       */
    }

    // ---------------------------
    // UNKNOWN ROLE
    // ---------------------------

    else {
      return errorResponse(
        'Access denied',
        'FORBIDDEN',
        403
      )
    }

    // =====================================================
    // LOAD RELATED DATA
    // =====================================================

    let patient = null
    let hospital = null
    let lab = null
    let doctor = null
    let tests = []

    // ---------------------------
    // PATIENT
    // ---------------------------

    if (booking.userId) {
      try {
        patient =
          await prisma.user.findUnique({
            where: {
              id: booking.userId,
            },

            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          })
      } catch (error) {
        console.warn(
          '[GET BOOKING] Patient lookup failed:',
          error.message
        )
      }
    }

    // ---------------------------
    // HOSPITAL
    // ---------------------------

    if (booking.hospitalId) {
      try {
        hospital =
          await prisma.hospital.findUnique({
            where: {
              id:
                booking.hospitalId,
            },
          })
      } catch (error) {
        console.warn(
          '[GET BOOKING] Hospital lookup failed:',
          error.message
        )
      }
    }

    // ---------------------------
    // LAB
    // ---------------------------

    if (booking.labId) {
      try {
        lab =
          await prisma.lab.findUnique({
            where: {
              id:
                booking.labId,
            },
          })
      } catch (error) {
        console.warn(
          '[GET BOOKING] Lab lookup failed:',
          error.message
        )
      }
    }

    // ---------------------------
    // DOCTOR
    // ---------------------------

    if (booking.doctorId) {
      try {
        doctor =
          await prisma.doctor.findUnique({
            where: {
              id:
                booking.doctorId,
            },
          })
      } catch (error) {
        console.warn(
          '[GET BOOKING] Doctor lookup failed:',
          error.message
        )
      }
    }

    // =====================================================
    // LAB TESTS
    // =====================================================

    if (
      booking.type === 'lab' &&
      Array.isArray(
        booking.testIds
      ) &&
      booking.testIds.length > 0
    ) {
      try {
        tests =
          await prisma.test.findMany({
            where: {
              id: {
                in:
                  booking.testIds,
              },
              labId: booking.labId,
            },
          })
      } catch (error) {
        console.warn(
          '[GET BOOKING] Lab test lookup failed:',
          error.message
        )
      }
    }

    // =====================================================
    // BUILD RESPONSE
    // =====================================================

    const result = {
      ...booking,

      // Patient
      user:
        patient || null,

      patient:
        patient || null,

      userName:
        patient?.name ||
        booking.userName ||
        '',

      patientName:
        booking.patientName ||
        patient?.name ||
        booking.userName ||
        '',

      userPhone:
        patient?.phone ||
        booking.userPhone ||
        '',

      userEmail:
        patient?.email ||
        booking.userEmail ||
        '',

      // Hospital
      hospital:
        hospital || null,

      hospitalName:
        hospital?.name ||
        booking.hospitalName ||
        '',

      // Lab
      lab:
        lab || null,

      labName:
        lab?.name ||
        booking.labName ||
        '',

      // Doctor
      doctor:
        doctor || null,

      doctorName:
        doctor?.name ||
        doctor?.fullName ||
        booking.doctorName ||
        '',

      // Lab tests
      tests:
        tests || [],
    }

    console.log(
      '[GET BOOKING] Success:',
      {
        id: result.id,
        bookingId:
          result.bookingId,
        type:
          result.type,
        status:
          result.status,
        paymentStatus:
          result.paymentStatus,
      }
    )

    // =====================================================
    // RESPONSE
    // =====================================================

    /*
     * Your frontend universal fetcher uses:
     *
     * return json?.data ?? json
     *
     * successResponse() therefore remains compatible.
     */

    return successResponse(
      result,
      'Booking fetched successfully'
    )
  } catch (error) {
    console.error(
      '[GET BOOKING] Error:',
      error
    )

    const message =
      error?.message ||
      'Failed to fetch booking'

    if (
      message
        .toLowerCase()
        .includes('token') ||
      message
        .toLowerCase()
        .includes('auth') ||
      message
        .toLowerCase()
        .includes('unauthorized')
    ) {
      return errorResponse(
        message,
        'AUTH_ERROR',
        401
      )
    }

    return errorResponse(
      message,
      'SERVER_ERROR',
      500
    )
  }
}
