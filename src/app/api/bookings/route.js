import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/middleware/auth.middleware'

import {
  successResponse,
  errorResponse,
} from '@/lib/utils/apiResponse'

export const dynamic = 'force-dynamic'

// ============================================================
// GET BOOKINGS
// ============================================================

export async function GET(request) {
  try {
    // ========================================================
    // AUTHENTICATE USER
    // ========================================================

    const user = await verifyAuth(request)

    if (!user) {
      return errorResponse(
        'Authentication required',
        'UNAUTHORIZED',
        401
      )
    }

    const userId =
      user.userId ||
      user.id

    const role =
      user.role

    // ========================================================
    // QUERY PARAMETERS
    // ========================================================

    const { searchParams } =
      new URL(request.url)

    const page =
      Math.max(
        1,
        Number(
          searchParams.get('page') ||
          1
        )
      )

    const limit =
      Math.min(
        100,
        Math.max(
          1,
          Number(
            searchParams.get(
              'limit'
            ) || 20
          )
        )
      )

    const type =
      searchParams.get('type')

    const status =
      searchParams.get('status')

    const paymentStatus =
      searchParams.get(
        'paymentStatus'
      )

    const dateFrom =
      searchParams.get(
        'dateFrom'
      )

    const dateTo =
      searchParams.get(
        'dateTo'
      )

    const search =
      searchParams.get(
        'search'
      )

    const skip =
      (page - 1) * limit

    // ========================================================
    // BUILD WHERE
    // ========================================================

    const where = {}

    // --------------------------------------------------------
    // BOOKING TYPE
    // --------------------------------------------------------

    if (
      type &&
      [
        'hospital',
        'online',
        'lab',
      ].includes(type)
    ) {
      where.type = type
    }

    // --------------------------------------------------------
    // BOOKING STATUS
    // --------------------------------------------------------

    if (status) {
      where.status = status
    }

    // --------------------------------------------------------
    // PAYMENT STATUS
    // --------------------------------------------------------

    if (paymentStatus) {
      where.paymentStatus =
        paymentStatus
    }

    // ========================================================
    // ROLE BASED ACCESS
    // ========================================================

    // --------------------------------------------------------
    // NORMAL USER
    // --------------------------------------------------------

    if (role === 'user') {
      where.userId = userId
    }

    // --------------------------------------------------------
    // LAB ADMIN
    // --------------------------------------------------------

    else if (
      role === 'lab_admin'
    ) {
      const lab =
        await prisma.lab.findFirst({
          where: {
            adminUserId:
              userId,
          },

          select: {
            id: true,
            name: true,
            isActive: true,
            isApproved: true,
          },
        })

      if (!lab) {
        return errorResponse(
          'Lab not found for this administrator',
          'LAB_NOT_FOUND',
          404
        )
      }

      where.labId =
        lab.id

      /*
       * Lab admins should only see
       * lab bookings.
       */
      where.type =
        'lab'
    }

    // --------------------------------------------------------
    // HOSPITAL ADMIN
    // --------------------------------------------------------

    else if (
      role === 'hospital_admin'
    ) {
      const hospital =
        await prisma.hospital.findFirst({
          where: {
            adminUserId:
              userId,
          },

          select: {
            id: true,
            name: true,
          },
        })

      if (!hospital) {
        return errorResponse(
          'Hospital not found for this administrator',
          'HOSPITAL_NOT_FOUND',
          404
        )
      }

      where.hospitalId =
        hospital.id
    }

    // --------------------------------------------------------
    // DOCTOR
    // --------------------------------------------------------

    else if (
      role === 'doctor'
    ) {
      const doctor =
        await prisma.doctor.findFirst({
          where: {
            userId:
              userId,
          },

          select: {
            id: true,
          },
        })

      if (!doctor) {
        return errorResponse(
          'Doctor profile not found',
          'DOCTOR_NOT_FOUND',
          404
        )
      }

      where.doctorId =
        doctor.id
    }

    // --------------------------------------------------------
    // SUPER ADMIN
    // --------------------------------------------------------

    else if (
      role === 'super_admin'
    ) {
      // No entity restriction.
      // Super admin can view all bookings.
    }

    // --------------------------------------------------------
    // REGIONAL MANAGER
    // --------------------------------------------------------

    else if (
      role ===
      'regional_manager'
    ) {
      /*
       * Leave unrestricted here temporarily.
       *
       * If your regional manager model contains
       * regionId, we can restrict hospitals/labs
       * by region separately.
       */
    }

    // --------------------------------------------------------
    // UNKNOWN ROLE
    // --------------------------------------------------------

    else {
      return errorResponse(
        'You are not authorized to view bookings',
        'FORBIDDEN',
        403
      )
    }

    // ========================================================
    // DATE FILTER
    // ========================================================

    if (
      dateFrom ||
      dateTo
    ) {
      where.startTime = {}

      if (dateFrom) {
        const startDate =
          new Date(
            `${dateFrom}T00:00:00.000Z`
          )

        if (
          !Number.isNaN(
            startDate.getTime()
          )
        ) {
          where.startTime.gte =
            startDate
        }
      }

      if (dateTo) {
        const endDate =
          new Date(
            `${dateTo}T23:59:59.999Z`
          )

        if (
          !Number.isNaN(
            endDate.getTime()
          )
        ) {
          where.startTime.lte =
            endDate
        }
      }

      if (
        Object.keys(
          where.startTime
        ).length === 0
      ) {
        delete where.startTime
      }
    }

    // ========================================================
    // SEARCH
    // ========================================================

    if (
      search &&
      search.trim()
    ) {
      const query =
        search.trim()

      where.OR = [
        {
          bookingId: {
            contains:
              query,
            mode:
              'insensitive',
          },
        },
      ]
    }

    console.log(
      '[GET /api/bookings]',
      {
        userId,
        role,
        page,
        limit,
        type:
          where.type ||
          null,
        status:
          where.status ||
          null,
        paymentStatus:
          where.paymentStatus ||
          null,
        labId:
          where.labId ||
          null,
        hospitalId:
          where.hospitalId ||
          null,
        doctorId:
          where.doctorId ||
          null,
        dateFrom,
        dateTo,
      }
    )

    // ========================================================
    // FETCH BOOKINGS
    // ========================================================

    const [
      bookings,
      total,
    ] =
      await Promise.all([
        prisma.booking.findMany({
          where,

          orderBy: {
            createdAt:
              'desc',
          },

          skip,

          take:
            limit,
        }),

        prisma.booking.count({
          where,
        }),
      ])

    // ========================================================
    // ENRICH BOOKINGS
    // ========================================================

    const enrichedBookings =
      await Promise.all(
        bookings.map(
          async (
            booking
          ) => {
            let userData =
              null

            let hospitalData =
              null

            let doctorData =
              null

            let labData =
              null

            let tests =
              []

            // ----------------------------------------------
            // USER
            // ----------------------------------------------

            if (
              booking.userId
            ) {
              userData =
                await prisma.user.findUnique({
                  where: {
                    id:
                      booking.userId,
                  },

                  select: {
                    id:
                      true,

                    name:
                      true,

                    phone:
                      true,

                    email:
                      true,
                  },
                })
            }

            // ----------------------------------------------
            // HOSPITAL
            // ----------------------------------------------

            if (
              booking.hospitalId
            ) {
              hospitalData =
                await prisma.hospital.findUnique({
                  where: {
                    id:
                      booking.hospitalId,
                  },

                  select: {
                    id:
                      true,

                    name:
                      true,

                    slug:
                      true,
                  },
                })
            }

            // ----------------------------------------------
            // DOCTOR
            // ----------------------------------------------

            if (
              booking.doctorId
            ) {
              doctorData =
                await prisma.doctor.findUnique({
                  where: {
                    id:
                      booking.doctorId,
                  },

                  select: {
                    id:
                      true,

                    name:
                      true,
                  },
                })
            }

            // ----------------------------------------------
            // LAB
            // ----------------------------------------------

            if (
              booking.labId
            ) {
              labData =
                await prisma.lab.findUnique({
                  where: {
                    id:
                      booking.labId,
                  },

                  select: {
                    id:
                      true,

                    name:
                      true,

                    slug:
                      true,

                    contactPhone:
                      true,

                    contactEmail:
                      true,
                  },
                })
            }

            // ----------------------------------------------
            // LAB TESTS
            // ----------------------------------------------

            if (
              booking.type ===
                'lab' &&
              Array.isArray(
                booking.testIds
              ) &&
              booking.testIds
                .length > 0
            ) {
              tests =
                await prisma.test.findMany({
                  where: {
                    id: {
                      in:
                        booking.testIds,
                    },
                  },

                  select: {
                    id:
                      true,

                    name:
                      true,

                    code:
                      true,

                    price:
                      true,

                    discountedPrice:
                      true,

                    category:
                      true,

                    sampleType:
                      true,
                  },
                })
            }

            return {
              ...booking,

              user:
                userData,

              patient:
                userData,

              hospital:
                hospitalData,

              doctor:
                doctorData,

              lab:
                labData,

              tests,
            }
          }
        )
      )

    // ========================================================
    // RESPONSE
    // ========================================================

    return Response.json(
      {
        success: true,

        bookings:
          enrichedBookings,

        pagination: {
          page,

          limit,

          total,

          totalPages:
            Math.ceil(
              total /
                limit
            ),

          hasNextPage:
            page *
              limit <
            total,

          hasPreviousPage:
            page > 1,
        },
      },
      {
        status: 200,

        headers: {
          'Cache-Control':
            'no-store, no-cache, must-revalidate',
        },
      }
    )
  } catch (error) {
    console.error(
      '[GET /api/bookings] ERROR:',
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

    return errorResponse(
      error?.message ||
        'Failed to fetch bookings',
      'SERVER_ERROR',
      500
    )
  }
}

// ============================================================
// CREATE BOOKING
// ============================================================

export async function POST(
  request
) {
  return verifyAuth(
    request,
    async (
      req,
      user
    ) => {
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

        if (
          !body.startTime
        ) {
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
        } =
          await import(
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

        const validationMessages =
          [
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
              String(
                message
              )
                .toLowerCase()
                .includes(
                  text
                )
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