import prisma from '@/lib/prisma'
import { cache } from '@/lib/cache'
import { calculateBookingPrice } from './pricing.service'
import { recordCouponUsage } from './coupon.service'
import {
  generateBookingId,
  generateInvoiceNumber,
} from '@/lib/utils/helpers'

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
  // Validation
  if (!type) throw new Error('Booking type is required')
  if (!startTime || !endTime) throw new Error('startTime and endTime are required')

  const start = new Date(startTime)
  const end = new Date(endTime)

  if (start <= new Date()) throw new Error('Booking time must be in the future')
  if (end <= start) throw new Error('endTime must be after startTime')

  // Determine entity and baseFee
  let entityId = null
  let baseFee = 0

  if (type === 'hospital' || type === 'online') {
    if (!hospitalId || !doctorId) throw new Error('hospitalId and doctorId required for this booking type')
    entityId = hospitalId

    const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } })
    if (!doctor || !doctor.isActive) throw new Error('Doctor not found or inactive')

    baseFee =
      type === 'online'
        ? doctor.consultationFee?.online || 0
        : doctor.consultationFee?.offline || 0
  } else if (type === 'lab') {
    if (!labId || !testIds?.length) throw new Error('labId and testIds required for lab booking')
    entityId = labId

    const tests = await prisma.test.findMany({
      where: { id: { in: testIds }, isActive: true },
    })
    if (tests.length !== testIds.length) throw new Error('Some tests not found or inactive')

    baseFee = tests.reduce((sum, t) => sum + (t.discountedPrice || t.price), 0)
  }

  // Atomic slot check for doctor bookings
  if (doctorId) {
    const conflict = await prisma.booking.findFirst({
      where: {
        doctorId,
        startTime: start,
        status: { in: ['confirmed', 'pending_payment'] },
      },
    })
    if (conflict) throw new Error('This slot is already booked')
  }

  // Calculate pricing
  const pricing = await calculateBookingPrice({
    bookingType: type,
    entityId,
    baseAmount: baseFee,
    couponCode,
    userId,
  })

  const bookingId = generateBookingId()

  const booking = await prisma.booking.create({
    data: {
      bookingId,
      userId,
      type,
      hospitalId: hospitalId || null,
      doctorId: doctorId || null,
      labId: labId || null,
      testIds: testIds || [],
      collectionType: collectionType || null,
      collectionAddress: collectionAddress || null,
      startTime: start,
      endTime: end,
      timezone: timezone || 'Asia/Kolkata',
      status: 'created',
      paymentStatus: 'pending',
      baseFee: pricing.baseFee,
      couponCode: pricing.couponCode,
      couponType: pricing.couponType,
      couponDiscount: pricing.couponDiscount,
      discountedFee: pricing.discountedFee,
      platformFeePercent: pricing.platformFeePercent,
      platformFee: pricing.platformFee,
      gstPercent: pricing.gstPercent,
      gst: pricing.gst,
      subtotal: pricing.subtotal,
      adminCouponDiscount: pricing.adminCouponDiscount,
      totalAmount: pricing.totalAmount,
    },
  })

  // Record coupon usage
  if (pricing.appliedCoupon) {
    await recordCouponUsage({
      couponId: pricing.appliedCoupon.id,
      couponCode: pricing.couponCode,
      userId,
      bookingId: booking.id,
      discountAmount: pricing.couponDiscount || pricing.adminCouponDiscount,
      appliedOn: type,
    })
  }

  // Create invoice
  const invoiceNumber = generateInvoiceNumber()
  await prisma.invoice.create({
    data: {
      invoiceNumber,
      bookingId: booking.id,
      userId,
      entityType: type === 'lab' ? 'lab' : 'hospital',
      entityId,
      items: [
        {
          description: type === 'lab' ? 'Lab Tests' : 'Consultation Fee',
          quantity: 1,
          rate: pricing.baseFee,
          amount: pricing.baseFee,
        },
      ],
      baseFee: pricing.baseFee,
      couponCode: pricing.couponCode,
      couponDiscount: pricing.couponDiscount,
      couponType: pricing.couponType,
      discountedFee: pricing.discountedFee,
      platformFeePercent: pricing.platformFeePercent,
      platformFee: pricing.platformFee,
      gstPercent: pricing.gstPercent,
      gst: pricing.gst,
      subtotal: pricing.subtotal,
      adminCouponDiscount: pricing.adminCouponDiscount,
      totalAmount: pricing.totalAmount,
      gstDetails: {
        medliGstin: process.env.MEDLI_GSTIN || null,
        hsnCode: type === 'lab' ? '998931' : '999311',
        gstRate: 18,
      },
      type: 'invoice',
    },
  })

  return booking
}