import { prisma } from '@/lib/prisma'
import { cache } from '@/lib/cache'

import {
  calculateBookingPrice,
} from './pricing.service'

import {
  recordCouponUsage,
} from './coupon.service'

import {
  generateBookingId,
  generateInvoiceNumber,
} from '@/lib/utils/helpers'


// ============================================================
// DEFAULT SLOT DURATIONS
// ============================================================

const DEFAULT_DOCTOR_SLOT_MINUTES = 10
const DEFAULT_LAB_SLOT_MINUTES = 30


// ============================================================
// MONEY HELPER
// ============================================================

function roundMoney(value) {
  const number = Number(value || 0)

  if (!Number.isFinite(number)) {
    return 0
  }

  return (
    Math.round(
      (number + Number.EPSILON) * 100
    ) / 100
  )
}


// ============================================================
// DATE HELPER
// ============================================================

function deriveEndTime(startTime, minutes) {
  const start = new Date(startTime)

  if (Number.isNaN(start.getTime())) {
    throw new Error('Invalid startTime')
  }

  return new Date(
    start.getTime() +
      Number(minutes) * 60 * 1000
  )
}


// ============================================================
// SLOT CACHE
// ============================================================

export async function invalidateSlotCache(
  doctorId,
  startTime
) {
  if (!doctorId || !startTime) {
    return
  }

  try {
    const date = new Date(startTime)
      .toISOString()
      .split('T')[0]

    await cache.del(
      `slots:${doctorId}:${date}`
    )
  } catch (error) {
    console.warn(
      '[Booking] Slot cache invalidation error:',
      error?.message
    )
  }
}


// ============================================================
// CREATE BOOKING
// ============================================================

export async function createBooking({
  userId,
  type,

  hospitalId = null,
  doctorId = null,

  labId = null,
  testIds = [],

  collectionType = null,
  collectionAddress = null,

  startTime,
  endTime = null,

  timezone = 'Asia/Kolkata',

  couponCode = null,
}) {
  console.log(
    '[Booking] createBooking started:',
    {
      userId,
      type,
      hospitalId,
      doctorId,
      labId,
      testIds,
      collectionType,
      startTime,
      endTime,
      timezone,
      couponCode,
    }
  )

  // ==========================================================
  // BASIC VALIDATION
  // ==========================================================

  if (!userId) {
    throw new Error(
      'User ID is required'
    )
  }

  if (!type) {
    throw new Error(
      'Booking type is required'
    )
  }

  const validTypes = [
    'hospital',
    'online',
    'lab',
  ]

  if (!validTypes.includes(type)) {
    throw new Error(
      'Invalid booking type'
    )
  }

  if (!startTime) {
    throw new Error(
      'startTime is required'
    )
  }

  const start =
    new Date(startTime)

  if (
    Number.isNaN(
      start.getTime()
    )
  ) {
    throw new Error(
      'Invalid startTime'
    )
  }

  if (start <= new Date()) {
    throw new Error(
      'Booking time must be in the future'
    )
  }


  // ==========================================================
  // VARIABLES
  // ==========================================================

  let entityId = null

  let baseFee = 0

  let finalHospitalId =
    hospitalId || null

  let finalEndTime =
    endTime
      ? new Date(endTime)
      : null

  let invoiceItems = []

  let finalCollectionType =
    collectionType || null


  // ==========================================================
  // HOSPITAL / ONLINE CONSULTATION
  // ==========================================================

  if (
    type === 'hospital' ||
    type === 'online'
  ) {
    console.log(
      '[Booking] Processing consultation booking'
    )

    if (!doctorId) {
      throw new Error(
        'doctorId is required for consultation booking'
      )
    }

    // --------------------------------------------------------
    // FETCH DOCTOR
    // --------------------------------------------------------

    const doctor =
      await prisma.doctor.findUnique({
        where: {
          id: doctorId,
        },

        select: {
          id: true,
          hospitalId: true,
          name: true,

          consultationFee: true,
          consultationTypes: true,
          availability: true,

          isActive: true,
        },
      })

    console.log(
      '[Booking] Doctor loaded:',
      {
        id: doctor?.id,
        hospitalId:
          doctor?.hospitalId,
        name:
          doctor?.name,
        isActive:
          doctor?.isActive,
        consultationFee:
          doctor?.consultationFee,
      }
    )

    if (
      !doctor ||
      !doctor.isActive
    ) {
      throw new Error(
        'Doctor not found or inactive'
      )
    }

    // Always trust DB relationship.

    finalHospitalId =
      doctor.hospitalId

    if (!finalHospitalId) {
      throw new Error(
        'Doctor is not assigned to a hospital'
      )
    }

    // If frontend supplied hospital,
    // verify that it matches.

    if (
      hospitalId &&
      hospitalId !==
        doctor.hospitalId
    ) {
      throw new Error(
        'Doctor does not belong to selected hospital'
      )
    }

    entityId =
      finalHospitalId


    // --------------------------------------------------------
    // CONSULTATION PRICE
    // --------------------------------------------------------

    const consultationFee =
      type === 'online'
        ? doctor
            .consultationFee
            ?.online
        : doctor
            .consultationFee
            ?.offline

    baseFee =
      roundMoney(
        consultationFee
      )

    console.log(
      '[Booking] Consultation fee:',
      {
        type,
        rawFee:
          consultationFee,
        baseFee,
      }
    )

    if (baseFee <= 0) {
      throw new Error(
        type === 'online'
          ? 'Online consultation fee is not configured'
          : 'Hospital consultation fee is not configured'
      )
    }


    // --------------------------------------------------------
    // END TIME
    // --------------------------------------------------------

    if (!finalEndTime) {
      finalEndTime =
        deriveEndTime(
          start,
          DEFAULT_DOCTOR_SLOT_MINUTES
        )
    }


    // --------------------------------------------------------
    // INVOICE ITEM
    // --------------------------------------------------------

    invoiceItems = [
      {
        description:
          type === 'online'
            ? `Online consultation - ${doctor.name}`
            : `Hospital consultation - ${doctor.name}`,

        quantity: 1,

        rate:
          baseFee,

        amount:
          baseFee,
      },
    ]
  }


  // ==========================================================
  // LAB BOOKING
  // ==========================================================

  if (type === 'lab') {
    console.log(
      '[Booking] Processing lab booking'
    )

    if (!labId) {
      throw new Error(
        'labId is required for lab booking'
      )
    }

    if (
      !Array.isArray(testIds) ||
      testIds.length === 0
    ) {
      throw new Error(
        'At least one lab test is required'
      )
    }


    // --------------------------------------------------------
    // CLEAN TEST IDS
    // --------------------------------------------------------

    const uniqueTestIds = [
      ...new Set(
        testIds.filter(Boolean)
      ),
    ]

    if (
      uniqueTestIds.length === 0
    ) {
      throw new Error(
        'At least one valid lab test is required'
      )
    }

    console.log(
      '[Booking] Selected tests:',
      uniqueTestIds
    )


    // --------------------------------------------------------
    // FETCH LAB
    // --------------------------------------------------------

    const lab =
      await prisma.lab.findUnique({
        where: {
          id: labId,
        },

        select: {
          id: true,
          name: true,

          isActive: true,
          isApproved: true,

          homeCollection: true,
          walkInSlots: true,
        },
      })

    console.log(
      '[Booking] Lab loaded:',
      {
        id:
          lab?.id,

        name:
          lab?.name,

        isActive:
          lab?.isActive,

        isApproved:
          lab?.isApproved,

        homeCollection:
          lab?.homeCollection,

        walkInSlots:
          lab?.walkInSlots,
      }
    )

    if (!lab) {
      throw new Error(
        'Lab not found'
      )
    }

    if (!lab.isActive) {
      throw new Error(
        'Lab is inactive'
      )
    }

    if (
      lab.isApproved === false
    ) {
      throw new Error(
        'Lab is not approved'
      )
    }

    entityId =
      lab.id


    // --------------------------------------------------------
    // COLLECTION TYPE
    // --------------------------------------------------------

    finalCollectionType =
      collectionType ||
      'walk_in'

    if (
      ![
        'walk_in',
        'home',
      ].includes(
        finalCollectionType
      )
    ) {
      throw new Error(
        'Invalid lab collection type'
      )
    }


    // --------------------------------------------------------
    // HOME COLLECTION
    // --------------------------------------------------------

    if (
      finalCollectionType ===
      'home'
    ) {
      if (
        !lab
          .homeCollection
          ?.enabled
      ) {
        throw new Error(
          'Home collection is not available for this lab'
        )
      }

      if (
        !collectionAddress
      ) {
        throw new Error(
          'Collection address is required for home collection'
        )
      }
    }


    // --------------------------------------------------------
    // FETCH TESTS
    // --------------------------------------------------------
    //
    // IMPORTANT:
    // Prices always come from MongoDB.
    // Never accept frontend test prices.
    // --------------------------------------------------------

    const tests =
      await prisma.test.findMany({
        where: {
          id: {
            in: uniqueTestIds,
          },

          labId,

          isActive: true,
        },

        select: {
          id: true,
          labId: true,

          name: true,
          code: true,

          price: true,
          discountedPrice: true,

          isActive: true,
        },
      })

    console.log(
      '[Booking] Tests loaded:',
      tests.map(
        (test) => ({
          id:
            test.id,

          labId:
            test.labId,

          name:
            test.name,

          code:
            test.code,

          price:
            test.price,

          discountedPrice:
            test.discountedPrice,

          isActive:
            test.isActive,
        })
      )
    )


    // --------------------------------------------------------
    // VERIFY ALL TESTS
    // --------------------------------------------------------

    if (
      tests.length !==
      uniqueTestIds.length
    ) {
      console.error(
        '[Booking] Test mismatch:',
        {
          requested:
            uniqueTestIds,

          found:
            tests.map(
              (test) =>
                test.id
            ),
        }
      )

      throw new Error(
        'One or more selected tests are invalid, inactive, or do not belong to this lab'
      )
    }


    // --------------------------------------------------------
    // TEST PRICING
    // --------------------------------------------------------

    invoiceItems =
      tests.map(
        (test) => {
          const normalPrice =
            Number(
              test.price || 0
            )

          const discountedPrice =
            test.discountedPrice !==
              null &&
            test.discountedPrice !==
              undefined
              ? Number(
                  test.discountedPrice
                )
              : null


          if (
            !Number.isFinite(
              normalPrice
            ) ||
            normalPrice <= 0
          ) {
            throw new Error(
              `Price is not configured for test: ${test.name}`
            )
          }


          let effectivePrice =
            normalPrice


          if (
            discountedPrice !==
              null &&
            Number.isFinite(
              discountedPrice
            ) &&
            discountedPrice > 0 &&
            discountedPrice <
              normalPrice
          ) {
            effectivePrice =
              discountedPrice
          }


          effectivePrice =
            roundMoney(
              effectivePrice
            )


          if (
            effectivePrice <= 0
          ) {
            throw new Error(
              `Price is not configured for test: ${test.name}`
            )
          }


          console.log(
            '[Booking] Test price:',
            {
              testId:
                test.id,

              testName:
                test.name,

              normalPrice,

              discountedPrice,

              effectivePrice,
            }
          )


          return {
            description:
              test.name,

            quantity: 1,

            rate:
              effectivePrice,

            amount:
              effectivePrice,
          }
        }
      )


    // --------------------------------------------------------
    // LAB BASE FEE
    // --------------------------------------------------------

    baseFee =
      roundMoney(
        invoiceItems.reduce(
          (
            total,
            item
          ) =>
            total +
            Number(
              item.amount ||
                0
            ),
          0
        )
      )


    console.log(
      '[Booking] Lab base amount:',
      {
        testCount:
          invoiceItems.length,

        baseFee,
      }
    )


    if (baseFee <= 0) {
      throw new Error(
        'Invalid lab test amount'
      )
    }


    // --------------------------------------------------------
    // LAB END TIME
    // --------------------------------------------------------

    if (!finalEndTime) {
      finalEndTime =
        deriveEndTime(
          start,
          DEFAULT_LAB_SLOT_MINUTES
        )
    }
  }


  // ==========================================================
  // FINAL END TIME VALIDATION
  // ==========================================================

  if (!finalEndTime) {
    throw new Error(
      'Unable to determine booking end time'
    )
  }

  if (
    Number.isNaN(
      finalEndTime.getTime()
    )
  ) {
    throw new Error(
      'Invalid endTime'
    )
  }

  if (
    finalEndTime <= start
  ) {
    throw new Error(
      'endTime must be after startTime'
    )
  }


  console.log(
    '[Booking] Time range:',
    {
      startTime:
        start.toISOString(),

      endTime:
        finalEndTime.toISOString(),

      timezone,
    }
  )


  // ==========================================================
  // DOCTOR SLOT CONFLICT
  // ==========================================================

  if (
    type !== 'lab' &&
    doctorId
  ) {
    const conflict =
      await prisma.booking.findFirst({
        where: {
          doctorId,

          status: {
            in: [
              'created',
              'pending_payment',
              'confirmed',
            ],
          },

          startTime: {
            lt:
              finalEndTime,
          },

          endTime: {
            gt:
              start,
          },
        },

        select: {
          id: true,
          bookingId: true,
          startTime: true,
          endTime: true,
        },
      })


    if (conflict) {
      console.warn(
        '[Booking] Slot conflict:',
        conflict
      )

      throw new Error(
        'This slot is already booked'
      )
    }
  }


  // ==========================================================
  // SERVER-SIDE PRICING
  // ==========================================================

  console.log(
    '[Booking] Pricing input:',
    {
      bookingType:
        type,

      entityId,

      baseAmount:
        baseFee,

      couponCode:
        couponCode || null,

      userId,
    }
  )


  const pricing =
    await calculateBookingPrice({
      bookingType:
        type,

      entityId,

      baseAmount:
        baseFee,

      couponCode:
        couponCode || null,

      userId,
    })


  console.log(
    '[Booking] Pricing result:',
    pricing
  )


  if (!pricing) {
    throw new Error(
      'Unable to calculate booking price'
    )
  }


  // ==========================================================
  // PRICING VALIDATION
  // ==========================================================

  const finalTotal =
    roundMoney(
      pricing.totalAmount
    )


  if (
    !Number.isFinite(
      finalTotal
    )
  ) {
    throw new Error(
      'Invalid booking amount calculated'
    )
  }


  if (finalTotal <= 0) {
    throw new Error(
      'Invalid booking amount. Please contact support.'
    )
  }


  const finalBaseFee =
    roundMoney(
      pricing.baseFee
    )

  const finalCouponDiscount =
    roundMoney(
      pricing.couponDiscount
    )

  const finalDiscountedFee =
    roundMoney(
      pricing.discountedFee
    )

  const finalPlatformFee =
    roundMoney(
      pricing.platformFee
    )

  const finalGst =
    roundMoney(
      pricing.gst
    )

  const finalSubtotal =
    roundMoney(
      pricing.subtotal
    )

  const finalAdminCouponDiscount =
    roundMoney(
      pricing.adminCouponDiscount
    )


  console.log(
    '[Booking] Final pricing:',
    {
      baseFee:
        finalBaseFee,

      couponDiscount:
        finalCouponDiscount,

      discountedFee:
        finalDiscountedFee,

      platformFeePercent:
        pricing
          .platformFeePercent,

      platformFee:
        finalPlatformFee,

      gstPercent:
        pricing.gstPercent,

      gst:
        finalGst,

      subtotal:
        finalSubtotal,

      adminCouponDiscount:
        finalAdminCouponDiscount,

      totalAmount:
        finalTotal,
    }
  )


  // ==========================================================
  // GENERATE BOOKING ID
  // ==========================================================

  const bookingId =
    generateBookingId()


  console.log(
    '[Booking] Creating booking:',
    {
      bookingId,
      userId,
      type,

      hospitalId:
        type === 'lab'
          ? null
          : finalHospitalId,

      doctorId:
        type === 'lab'
          ? null
          : doctorId,

      labId:
        type === 'lab'
          ? labId
          : null,

      testIds:
        type === 'lab'
          ? [
              ...new Set(
                testIds
              ),
            ]
          : [],

      collectionType:
        type === 'lab'
          ? finalCollectionType
          : null,

      startTime:
        start.toISOString(),

      endTime:
        finalEndTime.toISOString(),

      baseFee:
        finalBaseFee,

      platformFee:
        finalPlatformFee,

      gst:
        finalGst,

      totalAmount:
        finalTotal,
    }
  )


  // ==========================================================
  // CREATE BOOKING
  // ==========================================================

  let booking

  try {
    booking =
      await prisma.booking.create({
        data: {
          bookingId,

          userId,

          type,


          // ------------------------------------------
          // CONSULTATION
          // ------------------------------------------

          hospitalId:
            type === 'lab'
              ? null
              : finalHospitalId,

          doctorId:
            type === 'lab'
              ? null
              : doctorId,


          // ------------------------------------------
          // LAB
          // ------------------------------------------

          labId:
            type === 'lab'
              ? labId
              : null,

          testIds:
            type === 'lab'
              ? [
                  ...new Set(
                    testIds
                  ),
                ]
              : [],

          collectionType:
            type === 'lab'
              ? finalCollectionType
              : null,

          collectionAddress:
            type === 'lab' &&
            finalCollectionType ===
              'home'
              ? collectionAddress ||
                null
              : null,


          // ------------------------------------------
          // TIME
          // ------------------------------------------

          startTime:
            start,

          endTime:
            finalEndTime,

          timezone:
            timezone ||
            'Asia/Kolkata',


          // ------------------------------------------
          // STATUS
          // ------------------------------------------

          status:
            'created',

          paymentStatus:
            'pending',


          // ------------------------------------------
          // PRICING
          // ------------------------------------------

          baseFee:
            finalBaseFee,

          couponCode:
            pricing.couponCode ||
            null,

          couponType:
            pricing.couponType ||
            null,

          couponDiscount:
            finalCouponDiscount,

          discountedFee:
            finalDiscountedFee,

          platformFeePercent:
            Number(
              pricing
                .platformFeePercent ||
                0
            ),

          platformFee:
            finalPlatformFee,

          gstPercent:
            Number(
              pricing
                .gstPercent ||
                0
            ),

          gst:
            finalGst,

          subtotal:
            finalSubtotal,

          adminCouponDiscount:
            finalAdminCouponDiscount,

          totalAmount:
            finalTotal,
        },
      })
  } catch (bookingError) {
    console.error(
      '[Booking] Prisma booking.create FAILED:',
      {
        name:
          bookingError?.name,

        message:
          bookingError?.message,

        code:
          bookingError?.code,

        meta:
          bookingError?.meta,

        stack:
          bookingError?.stack,
      }
    )

    throw bookingError
  }


  // ==========================================================
  // BOOKING CREATED
  // ==========================================================

  console.log(
    '[Booking] Database booking created:',
    {
      id:
        booking.id,

      bookingId:
        booking.bookingId,

      type:
        booking.type,

      status:
        booking.status,

      paymentStatus:
        booking.paymentStatus,

      totalAmount:
        booking.totalAmount,
    }
  )


  // ==========================================================
  // RECORD COUPON USAGE
  // ==========================================================

  if (
    pricing.appliedCoupon
  ) {
    try {
      await recordCouponUsage({
        couponId:
          pricing
            .appliedCoupon
            .id,

        couponCode:
          pricing.couponCode,

        userId,

        bookingId:
          booking.id,

        discountAmount:
          roundMoney(
            Number(
              pricing
                .couponDiscount ||
                0
            ) +
              Number(
                pricing
                  .adminCouponDiscount ||
                  0
              )
          ),

        appliedOn:
          type,
      })

      console.log(
        '[Booking] Coupon usage recorded:',
        {
          bookingId:
            booking.id,

          couponCode:
            pricing.couponCode,
        }
      )
    } catch (couponError) {
      console.error(
        '[Booking] Coupon usage recording failed:',
        {
          message:
            couponError?.message,

          code:
            couponError?.code,

          stack:
            couponError?.stack,
        }
      )

      // Do not destroy booking because
      // coupon logging failed.
    }
  }


  // ==========================================================
  // CREATE INITIAL INVOICE
  // ==========================================================

  try {
    const existingInvoice =
      await prisma.invoice.findFirst({
        where: {
          bookingId:
            booking.id,

          type:
            'invoice',
        },

        select: {
          id: true,
          invoiceNumber: true,
        },
      })


    if (!existingInvoice) {
      const invoiceNumber =
        generateInvoiceNumber()


      await prisma.invoice.create({
        data: {
          invoiceNumber,

          bookingId:
            booking.id,

          userId,


          // ----------------------------------------
          // ENTITY
          // ----------------------------------------

          entityType:
            type === 'lab'
              ? 'lab'
              : 'hospital',

          entityId,


          // ----------------------------------------
          // ITEMS
          // ----------------------------------------

          items:
            invoiceItems,


          // ----------------------------------------
          // PRICING
          // ----------------------------------------

          baseFee:
            finalBaseFee,

          couponCode:
            pricing.couponCode ||
            null,

          couponDiscount:
            finalCouponDiscount,

          couponType:
            pricing.couponType ||
            null,

          discountedFee:
            finalDiscountedFee,

          platformFeePercent:
            Number(
              pricing
                .platformFeePercent ||
                0
            ),

          platformFee:
            finalPlatformFee,

          gstPercent:
            Number(
              pricing
                .gstPercent ||
                0
            ),

          gst:
            finalGst,

          subtotal:
            finalSubtotal,

          adminCouponDiscount:
            finalAdminCouponDiscount,

          totalAmount:
            finalTotal,


          // ----------------------------------------
          // GST DETAILS
          // ----------------------------------------

          gstDetails: {
            medliGstin:
              process.env
                .MEDLI_GSTIN ||
              null,

            hsnCode:
              type === 'lab'
                ? '998931'
                : '999311',

            gstRate:
              Number(
                pricing
                  .gstPercent ||
                  0
              ),
          },


          type:
            'invoice',
        },
      })


      console.log(
        '[Booking] Initial invoice created:',
        {
          bookingId:
            booking.id,

          invoiceNumber,
        }
      )
    } else {
      console.log(
        '[Booking] Invoice already exists:',
        {
          bookingId:
            booking.id,

          invoiceId:
            existingInvoice.id,

          invoiceNumber:
            existingInvoice
              .invoiceNumber,
        }
      )
    }
  } catch (invoiceError) {
    console.error(
      '[Booking] Initial invoice creation failed:',
      {
        name:
          invoiceError?.name,

        message:
          invoiceError?.message,

        code:
          invoiceError?.code,

        meta:
          invoiceError?.meta,

        stack:
          invoiceError?.stack,
      }
    )

    // Booking already exists.
    // Invoice failure must not cancel booking.
  }


  // ==========================================================
  // INVALIDATE DOCTOR SLOT CACHE
  // ==========================================================

  if (
    type !== 'lab' &&
    doctorId
  ) {
    try {
      await invalidateSlotCache(
        doctorId,
        start
      )
    } catch (cacheError) {
      console.warn(
        '[Booking] Slot cache invalidation failed:',
        cacheError?.message
      )
    }
  }


  // ==========================================================
  // FINAL LOG
  // ==========================================================

  console.log(
    `[Booking] Created ${booking.bookingId} | ` +
      `type=${type} | ` +
      `baseFee=₹${finalBaseFee} | ` +
      `platformFee=₹${finalPlatformFee} | ` +
      `gst=₹${finalGst} | ` +
      `total=₹${finalTotal}`
  )


  // ==========================================================
  // RETURN BOOKING
  // ==========================================================

  return booking
}