import { prisma } from '@/lib/prisma'
import { validateCoupon } from './coupon.service'

function round2(n) {
  return Math.round(n * 100) / 100
}

export function calculateDiscount(coupon, amount) {
  let discount = 0
  if (coupon.discountType === 'percent') {
    discount = round2((amount * coupon.discountValue) / 100)
  } else {
    discount = coupon.discountValue
  }
  if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
    discount = coupon.maxDiscountAmount
  }
  if (discount < 0) discount = 0
  if (discount > amount) discount = amount
  return round2(discount)
}

export async function calculateBookingPrice({
  bookingType,
  entityId,
  baseAmount,
  couponCode,
  userId,
}) {
  // 1. Get entity platformFeePercent
  let platformFeePercent = 10
  if (bookingType === 'hospital' || bookingType === 'online') {
    const hospital = await prisma.hospital.findUnique({
      where: { id: entityId },
      select: { platformFeePercent: true },
    })
    if (hospital) platformFeePercent = hospital.platformFeePercent
  } else if (bookingType === 'lab') {
    const lab = await prisma.lab.findUnique({
      where: { id: entityId },
      select: { platformFeePercent: true },
    })
    if (lab) platformFeePercent = lab.platformFeePercent
  }

  const baseFee = round2(baseAmount)
  let couponDiscount = 0
  let adminCouponDiscount = 0
  let appliedCoupon = null
  let couponType = null

  // 2. Validate coupon
  if (couponCode) {
    try {
      appliedCoupon = await validateCoupon({
        code: couponCode,
        bookingType,
        amount: baseFee,
        entityId,
        userId,
      })
      couponType = appliedCoupon.couponType
    } catch {
      // Invalid coupon — proceed without
    }
  }

  // 3. Entity coupon (hospital/lab)
  let discountedFee = baseFee
  if (appliedCoupon && (couponType === 'hospital' || couponType === 'lab')) {
    couponDiscount = calculateDiscount(appliedCoupon, baseFee)
    discountedFee = round2(baseFee - couponDiscount)
  }

  // 4. Platform fee on discounted fee
  const platformFee = round2((discountedFee * platformFeePercent) / 100)

  // 5. GST on platform fee
  const gst = round2(platformFee * 0.18)

  // 6. Subtotal
  const subtotal = round2(discountedFee + platformFee + gst)

  // 7. Platform coupon on subtotal
  let totalAmount = subtotal
  if (appliedCoupon && couponType === 'platform') {
    adminCouponDiscount = calculateDiscount(appliedCoupon, subtotal)
    totalAmount = round2(subtotal - adminCouponDiscount)
  }

  return {
    baseFee,
    couponCode: appliedCoupon?.code || null,
    couponType: couponType || null,
    couponDiscount,
    discountedFee,
    platformFeePercent,
    platformFee,
    gstPercent: 18,
    gst,
    subtotal,
    adminCouponDiscount,
    totalAmount,
    appliedCoupon,
  }
}