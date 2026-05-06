import prisma from '@/lib/prisma'

export async function validateCoupon({
  code,
  bookingType,
  amount,
  entityId,
  userId,
}) {
  const coupon = await prisma.coupon.findUnique({ where: { code } })

  if (!coupon) throw new Error('Coupon not found')
  if (!coupon.isActive) throw new Error('Coupon is inactive')

  const now = new Date()
  if (coupon.validFrom && new Date(coupon.validFrom) > now)
    throw new Error('Coupon is not yet valid')
  if (coupon.validUntil && new Date(coupon.validUntil) < now)
    throw new Error('Coupon has expired')

  if (amount < coupon.minOrderAmount)
    throw new Error(`Minimum order amount is ₹${coupon.minOrderAmount}`)

  if (coupon.totalUsageLimit !== null &&
    coupon.currentUsageCount >= coupon.totalUsageLimit)
    throw new Error('Coupon usage limit reached')

  // Per-user limit
  if (coupon.perUserLimit > 0) {
    const userUsage = await prisma.couponUsage.count({
      where: { couponId: coupon.id, userId },
    })
    if (userUsage >= coupon.perUserLimit)
      throw new Error('You have already used this coupon')
  }

  // Booking type match
  if (coupon.applicableBookingTypes.length > 0 &&
    !coupon.applicableBookingTypes.includes(bookingType))
    throw new Error('Coupon not valid for this booking type')

  // Scope (entity) check
  if (coupon.applicableFor !== 'all') {
    if (bookingType === 'hospital' || bookingType === 'online') {
      if (coupon.hospitalIds.length > 0 && !coupon.hospitalIds.includes(entityId))
        throw new Error('Coupon not valid for this hospital')
    }
    if (bookingType === 'lab') {
      if (coupon.labIds.length > 0 && !coupon.labIds.includes(entityId))
        throw new Error('Coupon not valid for this lab')
    }
  }

  return coupon
}

export async function recordCouponUsage({
  couponId,
  couponCode,
  userId,
  bookingId,
  discountAmount,
  appliedOn,
}) {
  await Promise.all([
    prisma.couponUsage.create({
      data: {
        couponId,
        couponCode,
        userId,
        bookingId,
        discountAmount,
        appliedOn,
      },
    }),
    prisma.coupon.update({
      where: { id: couponId },
      data: { currentUsageCount: { increment: 1 } },
    }),
  ])
}