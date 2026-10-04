import { prisma } from '@/lib/prisma'
import { validateCoupon } from './coupon.service'

function round2(value) {
  const number = Number(value || 0)

  if (!Number.isFinite(number)) {
    return 0
  }

  return Math.round((number + Number.EPSILON) * 100) / 100
}

export function calculateDiscount(coupon, amount) {
  const safeAmount = round2(amount)

  if (!coupon || safeAmount <= 0) {
    return 0
  }

  const discountValue = Number(coupon.discountValue || 0)

  let discount = 0

  if (coupon.discountType === 'percent') {
    discount = round2(
      (safeAmount * discountValue) / 100
    )
  } else if (coupon.discountType === 'fixed') {
    discount = round2(discountValue)
  }

  const maxDiscountAmount =
    Number(coupon.maxDiscountAmount || 0)

  if (
    maxDiscountAmount > 0 &&
    discount > maxDiscountAmount
  ) {
    discount = maxDiscountAmount
  }

  if (discount < 0) {
    discount = 0
  }

  if (discount > safeAmount) {
    discount = safeAmount
  }

  return round2(discount)
}

export async function calculateBookingPrice({
  bookingType,
  entityId,
  baseAmount,
  couponCode,
  userId,
}) {
  // --------------------------------------------------
  // VALIDATION
  // --------------------------------------------------

  if (!bookingType) {
    throw new Error('Booking type is required for pricing')
  }

  if (!entityId) {
    throw new Error('Entity ID is required for pricing')
  }

  const baseFee = round2(baseAmount)

  if (baseFee <= 0) {
    throw new Error(
      'Base booking amount must be greater than zero'
    )
  }

  // --------------------------------------------------
  // PLATFORM FEE
  // --------------------------------------------------

  let platformFeePercent =
    bookingType === 'lab'
      ? 8
      : 10

  if (
    bookingType === 'hospital' ||
    bookingType === 'online'
  ) {
    const hospital =
      await prisma.hospital.findUnique({
        where: {
          id: entityId,
        },
        select: {
          id: true,
          platformFeePercent: true,
          isActive: true,
        },
      })

    if (!hospital || !hospital.isActive) {
      throw new Error(
        'Hospital not found or inactive'
      )
    }

    platformFeePercent =
      Number(
        hospital.platformFeePercent ?? 10
      )
  } else if (bookingType === 'lab') {
    const lab =
      await prisma.lab.findUnique({
        where: {
          id: entityId,
        },
        select: {
          id: true,
          platformFeePercent: true,
          isActive: true,
        },
      })

    if (!lab || !lab.isActive) {
      throw new Error(
        'Lab not found or inactive'
      )
    }

    platformFeePercent =
      Number(
        lab.platformFeePercent ?? 8
      )
  } else {
    throw new Error('Invalid booking type')
  }

  if (
    !Number.isFinite(platformFeePercent) ||
    platformFeePercent < 0
  ) {
    throw new Error(
      'Invalid platform fee configuration'
    )
  }

  // --------------------------------------------------
  // COUPON
  // --------------------------------------------------

  let appliedCoupon = null
  let couponType = null
  let couponDiscount = 0
  let adminCouponDiscount = 0

  if (
    couponCode &&
    String(couponCode).trim()
  ) {
    try {
      appliedCoupon =
        await validateCoupon({
          code: String(
            couponCode
          ).trim(),

          bookingType,
          amount: baseFee,
          entityId,
          userId,
        })

      couponType =
        appliedCoupon?.couponType || null
    } catch (couponError) {
      console.warn(
        '[Pricing] Coupon rejected:',
        couponError.message
      )

      /*
       * Current MEDLI behaviour:
       * Invalid coupon does NOT block booking.
       * Booking continues without coupon.
       */
      appliedCoupon = null
      couponType = null
    }
  }

  // --------------------------------------------------
  // ENTITY DISCOUNT
  // Hospital/Lab coupon reduces service fee.
  // --------------------------------------------------

  let discountedFee = baseFee

  if (
    appliedCoupon &&
    (
      couponType === 'hospital' ||
      couponType === 'lab'
    )
  ) {
    couponDiscount =
      calculateDiscount(
        appliedCoupon,
        baseFee
      )

    discountedFee =
      round2(
        baseFee - couponDiscount
      )
  }

  if (discountedFee < 0) {
    discountedFee = 0
  }

  // --------------------------------------------------
  // PLATFORM FEE
  // --------------------------------------------------

  const platformFee =
    round2(
      (
        discountedFee *
        platformFeePercent
      ) / 100
    )

  // --------------------------------------------------
  // GST
  //
  // MEDLI current business rule:
  // 18% GST only on platform fee.
  // --------------------------------------------------

  const gstPercent = 18

  const gst =
    round2(
      platformFee *
      (gstPercent / 100)
    )

  // --------------------------------------------------
  // SUBTOTAL
  // --------------------------------------------------

  const subtotal =
    round2(
      discountedFee +
      platformFee +
      gst
    )

  // --------------------------------------------------
  // PLATFORM COUPON
  // --------------------------------------------------

  let totalAmount = subtotal

  if (
    appliedCoupon &&
    couponType === 'platform'
  ) {
    adminCouponDiscount =
      calculateDiscount(
        appliedCoupon,
        subtotal
      )

    totalAmount =
      round2(
        subtotal -
        adminCouponDiscount
      )
  }

  if (totalAmount < 0) {
    totalAmount = 0
  }

  // --------------------------------------------------
  // CASHFREE SAFETY
  // --------------------------------------------------

  if (totalAmount <= 0) {
    throw new Error(
      'Final payable amount must be greater than zero'
    )
  }

  console.log('[Pricing]', {
    bookingType,
    entityId,
    baseFee,
    couponCode:
      appliedCoupon?.code || null,
    couponType,
    couponDiscount,
    discountedFee,
    platformFeePercent,
    platformFee,
    gstPercent,
    gst,
    subtotal,
    adminCouponDiscount,
    totalAmount,
  })

  return {
    baseFee,

    couponCode:
      appliedCoupon?.code || null,

    couponType:
      couponType || null,

    couponDiscount:
      round2(couponDiscount),

    discountedFee:
      round2(discountedFee),

    platformFeePercent:
      round2(platformFeePercent),

    platformFee:
      round2(platformFee),

    gstPercent,

    gst:
      round2(gst),

    subtotal:
      round2(subtotal),

    adminCouponDiscount:
      round2(adminCouponDiscount),

    totalAmount:
      round2(totalAmount),

    appliedCoupon,
  }
}