import { prisma } from '@/lib/prisma'
import { cache } from '@/lib/cache'
import { calculateBookingPrice } from './pricing.service'
import { recordCouponUsage } from './coupon.service'
import {
  generateBookingId,
  generateInvoiceNumber,
} from '@/lib/utils/helpers'

const DEFAULT_DOCTOR_SLOT_MINUTES = 10
const DEFAULT_LAB_SLOT_MINUTES = 30

function roundMoney(value) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100
}

function deriveEndTime(startTime, minutes) {
  const start = new Date(startTime)

  if (Number.isNaN(start.getTime())) {
    throw new Error('Invalid startTime')
  }

  return new Date(start.getTime() + minutes * 60 * 1000)
}

export async function invalidateSlotCache(doctorId, startTime) {
  if (!doctorId || !startTime) return

  const date = new Date(startTime).toISOString().split('T')[0]
  await cache.del(`slots:${doctorId}:${date}`)
}

export async function createBooking({
  userId,
  type,
  hospitalId,
  doctorId,
  labId,
  testIds,
  collectionType,
  collectionAddress,
  startTime,
  endTime,
  timezone,
  couponCode,
}) {
  // --------------------------------------------------
  // BASIC VALIDATION
  // --------------------------------------------------

  if (!userId) {
    throw new Error('User ID is required')
  }

  if (!type) {
    throw new Error('Booking type is required')
  }

  if (!['hospital', 'online', 'lab'].includes(type)) {
    throw new Error('Invalid booking type')
  }

  if (!startTime) {
    throw new Error('startTime is required')
  }

  const start = new Date(startTime)

  if (Number.isNaN(start.getTime())) {
    throw new Error('Invalid startTime')
  }

  if (start <= new Date()) {
    throw new Error('Booking time must be in the future')
  }

  // --------------------------------------------------
  // ENTITY / PRICING
  // --------------------------------------------------

  let entityId = null
  let baseFee = 0
  let finalHospitalId = hospitalId || null
  let finalEndTime = endTime ? new Date(endTime) : null
  let invoiceItems = []

  // ==================================================
  // HOSPITAL / ONLINE CONSULTATION
  // ==================================================

  if (type === 'hospital' || type === 'online') {
    if (!doctorId) {
      throw new Error('doctorId is required for consultation booking')
    }

    const doctor = await prisma.doctor.findUnique({
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

    if (!doctor || !doctor.isActive) {
      throw new Error('Doctor not found or inactive')
    }

    // Always trust doctor's hospital from DB
    finalHospitalId = doctor.hospitalId

    if (!finalHospitalId) {
      throw new Error('Doctor is not assigned to a hospital')
    }

    // If frontend sent hospitalId, make sure it matches
    if (hospitalId && hospitalId !== doctor.hospitalId) {
      throw new Error('Doctor does not belong to selected hospital')
    }

    entityId = finalHospitalId

    const fee =
      type === 'online'
        ? doctor.consultationFee?.online
        : doctor.consultationFee?.offline

    baseFee = roundMoney(fee)

    if (baseFee <= 0) {
      throw new Error(
        type === 'online'
          ? 'Online consultation fee is not configured'
          : 'Hospital consultation fee is not configured'
      )
    }

    // If frontend doesn't send endTime, derive it.
    if (!finalEndTime) {
      finalEndTime = deriveEndTime(
        start,
        DEFAULT_DOCTOR_SLOT_MINUTES
      )
    }

    invoiceItems = [
      {
        description:
          type === 'online'
            ? `Online consultation - ${doctor.name}`
            : `Hospital consultation - ${doctor.name}`,
        quantity: 1,
        rate: baseFee,
        amount: baseFee,
      },
    ]
  }

  // ==================================================
  // LAB BOOKING
  // ==================================================

  if (type === 'lab') {
    if (!labId) {
      throw new Error('labId is required for lab booking')
    }

    if (!Array.isArray(testIds) || testIds.length === 0) {
      throw new Error('At least one lab test is required')
    }

    const uniqueTestIds = [...new Set(testIds)]

    const lab = await prisma.lab.findUnique({
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

    if (!lab || !lab.isActive) {
      throw new Error('Lab not found or inactive')
    }

    entityId = lab.id

    // --------------------------------------------------
    // COLLECTION TYPE
    // --------------------------------------------------

    const finalCollectionType = collectionType || 'walk_in'

    if (!['walk_in', 'home'].includes(finalCollectionType)) {
      throw new Error('Invalid lab collection type')
    }

    if (
      finalCollectionType === 'home' &&
      !lab.homeCollection?.enabled
    ) {
      throw new Error('Home collection is not available for this lab')
    }

    if (
      finalCollectionType === 'home' &&
      !collectionAddress
    ) {
      throw new Error(
        'Collection address is required for home collection'
      )
    }

    // --------------------------------------------------
    // FETCH TESTS FROM DATABASE
    // NEVER TRUST FRONTEND PRICES
    // --------------------------------------------------

    const tests = await prisma.test.findMany({
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

    if (tests.length !== uniqueTestIds.length) {
      throw new Error(
        'One or more selected tests are invalid, inactive, or do not belong to this lab'
      )
    }

    // --------------------------------------------------
    // SERVER-SIDE TEST PRICE CALCULATION
    // --------------------------------------------------

    invoiceItems = tests.map((test) => {
      const normalPrice = Number(test.price || 0)

      const discountedPrice =
        test.discountedPrice !== null &&
        test.discountedPrice !== undefined
          ? Number(test.discountedPrice)
          : null

      // Only use discounted price when valid.
      const effectivePrice =
        discountedPrice !== null &&
        discountedPrice >= 0 &&
        discountedPrice < normalPrice
          ? discountedPrice
          : normalPrice

      if (effectivePrice <= 0) {
        throw new Error(
          `Price is not configured for test: ${test.name}`
        )
      }

      return {
        description: test.name,
        quantity: 1,
        rate: roundMoney(effectivePrice),
        amount: roundMoney(effectivePrice),
      }
    })

    baseFee = roundMoney(
      invoiceItems.reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0
      )
    )

    if (baseFee <= 0) {
      throw new Error('Invalid lab test amount')
    }

    // Lab frontend may only send startTime.
    if (!finalEndTime) {
      finalEndTime = deriveEndTime(
        start,
        DEFAULT_LAB_SLOT_MINUTES
      )
    }
  }

  // --------------------------------------------------
  // END TIME VALIDATION
  // --------------------------------------------------

  if (!finalEndTime) {
    throw new Error('Unable to determine booking end time')
  }

  if (Number.isNaN(finalEndTime.getTime())) {
    throw new Error('Invalid endTime')
  }

  if (finalEndTime <= start) {
    throw new Error('endTime must be after startTime')
  }

  // --------------------------------------------------
  // DOCTOR SLOT CONFLICT
  // --------------------------------------------------

  if (doctorId) {
    const conflict = await prisma.booking.findFirst({
      where: {
        doctorId,
        status: {
          in: ['created', 'pending_payment', 'confirmed'],
        },

        // Overlap check
        startTime: {
          lt: finalEndTime,
        },

        endTime: {
          gt: start,
        },
      },
      select: {
        id: true,
        bookingId: true,
      },
    })

    if (conflict) {
      throw new Error('This slot is already booked')
    }
  }

  // --------------------------------------------------
  // SERVER-SIDE PRICING
  // --------------------------------------------------

  const pricing = await calculateBookingPrice({
    bookingType: type,
    entityId,
    baseAmount: baseFee,
    couponCode: couponCode || null,
    userId,
  })

  if (!pricing) {
    throw new Error('Unable to calculate booking price')
  }

  const finalTotal = roundMoney(pricing.totalAmount)

  if (finalTotal <= 0) {
    throw new Error(
      'Invalid booking amount. Please contact support.'
    )
  }

  // --------------------------------------------------
  // CREATE BOOKING
  // --------------------------------------------------

  const bookingId = generateBookingId()

  const booking = await prisma.booking.create({
    data: {
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
          ? [...new Set(testIds)]
          : [],

      collectionType:
        type === 'lab'
          ? collectionType || 'walk_in'
          : null,

      collectionAddress:
        type === 'lab' &&
        (collectionType || 'walk_in') === 'home'
          ? collectionAddress || null
          : null,

      startTime: start,
      endTime: finalEndTime,

      timezone:
        timezone || 'Asia/Kolkata',

      status: 'created',
      paymentStatus: 'pending',

      baseFee: roundMoney(pricing.baseFee),

      couponCode:
        pricing.couponCode || null,

      couponType:
        pricing.couponType || null,

      couponDiscount:
        roundMoney(pricing.couponDiscount),

      discountedFee:
        roundMoney(pricing.discountedFee),

      platformFeePercent:
        Number(pricing.platformFeePercent || 0),

      platformFee:
        roundMoney(pricing.platformFee),

      gstPercent:
        Number(pricing.gstPercent || 0),

      gst:
        roundMoney(pricing.gst),

      subtotal:
        roundMoney(pricing.subtotal),

      adminCouponDiscount:
        roundMoney(pricing.adminCouponDiscount),

      totalAmount:
        finalTotal,
    },
  })

  // --------------------------------------------------
  // COUPON USAGE
  // --------------------------------------------------

  if (pricing.appliedCoupon) {
    try {
      await recordCouponUsage({
        couponId: pricing.appliedCoupon.id,
        couponCode: pricing.couponCode,
        userId,
        bookingId: booking.id,

        discountAmount: roundMoney(
          Number(pricing.couponDiscount || 0) +
          Number(pricing.adminCouponDiscount || 0)
        ),

        appliedOn: type,
      })
    } catch (couponError) {
      console.error(
        '[Booking] Coupon usage recording failed:',
        couponError
      )
    }
  }

  // --------------------------------------------------
  // CREATE INITIAL INVOICE
  // --------------------------------------------------

  try {
    const existingInvoice =
      await prisma.invoice.findFirst({
        where: {
          bookingId: booking.id,
          type: 'invoice',
        },
      })

    if (!existingInvoice) {
      await prisma.invoice.create({
        data: {
          invoiceNumber:
            generateInvoiceNumber(),

          bookingId: booking.id,
          userId,

          entityType:
            type === 'lab'
              ? 'lab'
              : 'hospital',

          entityId,

          items: invoiceItems,

          baseFee:
            roundMoney(pricing.baseFee),

          couponCode:
            pricing.couponCode || null,

          couponDiscount:
            roundMoney(pricing.couponDiscount),

          couponType:
            pricing.couponType || null,

          discountedFee:
            roundMoney(pricing.discountedFee),

          platformFeePercent:
            Number(
              pricing.platformFeePercent || 0
            ),

          platformFee:
            roundMoney(pricing.platformFee),

          gstPercent:
            Number(pricing.gstPercent || 0),

          gst:
            roundMoney(pricing.gst),

          subtotal:
            roundMoney(pricing.subtotal),

          adminCouponDiscount:
            roundMoney(
              pricing.adminCouponDiscount
            ),

          totalAmount:
            finalTotal,

          gstDetails: {
            medliGstin:
              process.env.MEDLI_GSTIN || null,

            hsnCode:
              type === 'lab'
                ? '998931'
                : '999311',

            gstRate:
              Number(pricing.gstPercent || 0),
          },

          type: 'invoice',
        },
      })
    }
  } catch (invoiceError) {
    console.error(
      '[Booking] Initial invoice creation failed:',
      invoiceError
    )
  }

  // --------------------------------------------------
  // INVALIDATE SLOT CACHE
  // --------------------------------------------------

  if (doctorId) {
    try {
      await invalidateSlotCache(
        doctorId,
        start
      )
    } catch (cacheError) {
      console.warn(
        '[Booking] Slot cache invalidation failed:',
        cacheError.message
      )
    }
  }

  console.log(
    `[Booking] Created ${booking.bookingId} | ` +
    `type=${type} | baseFee=₹${pricing.baseFee} | ` +
    `total=₹${finalTotal}`
  )

  return booking
}