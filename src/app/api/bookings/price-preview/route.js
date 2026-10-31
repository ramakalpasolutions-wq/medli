
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { calculateBookingPrice } from '@/lib/services/pricing.service'

export const dynamic = 'force-dynamic'

const OBJECT_ID = /^[a-f\d]{24}$/i

function fail(error, status = 400) {
  return NextResponse.json(
    {
      success: false,
      error,
    },
    { status }
  )
}

// ============================================================
// POST /api/bookings/price-preview
// ============================================================

export async function POST(request) {
  try {
    // --------------------------------------------------------
    // AUTHENTICATION
    // --------------------------------------------------------

    const user = await verifyAuth(request)

    if (!user) {
      return fail(
        'Please sign in to view booking pricing',
        401
      )
    }

    const userId = user.userId || user.id

    if (!userId) {
      return fail('Authentication required', 401)
    }

    // --------------------------------------------------------
    // REQUEST BODY
    // --------------------------------------------------------

    let input

    try {
      input = await request.json()
    } catch {
      return fail('Invalid JSON request body')
    }

    const bookingType = input?.bookingType
    const doctorId = input?.doctorId
    const labId = input?.labId
    const testIds = input?.testIds

    const couponCode =
      typeof input?.couponCode === 'string'
        ? input.couponCode.trim().slice(0, 80)
        : null

    let entityId
    let baseAmount

    // ========================================================
    // HOSPITAL / ONLINE CONSULTATION
    // ========================================================

    if (
      bookingType === 'hospital' ||
      bookingType === 'online'
    ) {
      if (
        typeof doctorId !== 'string' ||
        !OBJECT_ID.test(doctorId)
      ) {
        return fail(
          'Valid doctor ID is required'
        )
      }

      const doctor =
        await prisma.doctor.findUnique({
          where: {
            id: doctorId,
          },
          select: {
            hospitalId: true,
            consultationFee: true,
            isActive: true,
          },
        })

      if (
        !doctor?.isActive ||
        !doctor.hospitalId
      ) {
        return fail(
          'Doctor is unavailable',
          404
        )
      }

      entityId = doctor.hospitalId

      baseAmount =
        bookingType === 'online'
          ? doctor.consultationFee?.online
          : doctor.consultationFee?.offline

    // ========================================================
    // LAB TESTS
    // ========================================================

    } else if (bookingType === 'lab') {
      if (
        typeof labId !== 'string' ||
        !OBJECT_ID.test(labId)
      ) {
        return fail(
          'Valid lab ID is required'
        )
      }

      if (
        !Array.isArray(testIds) ||
        testIds.length < 1 ||
        testIds.length > 100
      ) {
        return fail(
          'Select at least one lab test'
        )
      }

      const uniqueIds = [
        ...new Set(testIds),
      ]

      if (
        !uniqueIds.every(
          (id) =>
            typeof id === 'string' &&
            OBJECT_ID.test(id)
        )
      ) {
        return fail('Invalid test selection')
      }

      const lab =
        await prisma.lab.findUnique({
          where: {
            id: labId,
          },
          select: {
            id: true,
            isActive: true,
            isApproved: true,
          },
        })

      if (
        !lab?.isActive ||
        !lab?.isApproved
      ) {
        return fail(
          'Lab is unavailable',
          404
        )
      }

      const tests =
        await prisma.test.findMany({
          where: {
            id: {
              in: uniqueIds,
            },
            labId,
            isActive: true,
          },
          select: {
            price: true,
            discountedPrice: true,
          },
        })

      if (
        tests.length !== uniqueIds.length
      ) {
        return fail(
          'One or more selected tests are unavailable'
        )
      }

      baseAmount = tests.reduce(
        (sum, test) => {
          const normal = Number(
            test.price
          )

          const discount = Number(
            test.discountedPrice
          )

          if (
            !Number.isFinite(normal) ||
            normal <= 0
          ) {
            throw new Error(
              'Lab test price is not configured'
            )
          }

          const effective =
            test.discountedPrice != null &&
            Number.isFinite(discount) &&
            discount > 0 &&
            discount < normal
              ? discount
              : normal

          const rounded =
            Math.round(
              (effective + Number.EPSILON) * 100
            ) / 100

          return sum + rounded
        },
        0
      )

      entityId = labId
    } else {
      return fail('Invalid booking type')
    }

    // --------------------------------------------------------
    // VALIDATE BASE AMOUNT
    // --------------------------------------------------------

    if (
      !Number.isFinite(
        Number(baseAmount)
      ) ||
      Number(baseAmount) <= 0
    ) {
      return fail(
        'Consultation or test fee is not configured'
      )
    }

    // ========================================================
    // CALCULATE PRICE USING YOUR EXISTING SERVICE
    // ========================================================

    const price =
      await calculateBookingPrice({
        bookingType,
        entityId,
        baseAmount,
        couponCode:
          couponCode || null,
        userId,
      })

    // Do not expose the internal coupon database object.

    const {
      appliedCoupon,
      ...amounts
    } = price

    return NextResponse.json(
      {
        success: true,
        data: {
          ...amounts,
          couponApplied:
            Boolean(appliedCoupon),
        },
      },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    )

  } catch (error) {
    console.error(
      '[Booking Price Preview]',
      error
    )

    return fail(
      'Could not calculate booking price. Please try again.',
      500
    )
  }
}
