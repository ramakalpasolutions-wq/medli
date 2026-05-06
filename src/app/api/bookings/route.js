// src/app/api/bookings/route.js
import prisma from '@/lib/prisma'
import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { getPaginationParams, generateBookingId, generateInvoiceNumber } from '@/lib/utils/helpers'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'
import { calculateBookingPrice } from '@/lib/services/pricing.service'
import { invalidateSlotCache } from '@/lib/services/booking.service'

export function OPTIONS() { return handleOptions() }

export async function GET(request) {
  try {
    const user = await verifyAuth(request)
    const { searchParams } = new URL(request.url)
    const { skip, take, page, limit } = getPaginationParams(
      searchParams.get('page'),
      searchParams.get('limit')
    )

    const filter   = searchParams.get('filter')
    const type     = searchParams.get('type')
    const status   = searchParams.get('status')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo   = searchParams.get('dateTo')

    const where = {}

    // ── Role scoping ──────────────────────────────────────────────────────────
    if (user.role === 'user') {
      where.userId = user.id
    } else if (user.role === 'doctor') {
      const doctor = await prisma.doctor.findFirst({ where: { userId: user.id } })
      if (doctor) where.doctorId = doctor.id
    } else if (user.role === 'hospital_admin') {
      const hospital = await prisma.hospital.findFirst({ where: { adminUserId: user.id } })
      if (hospital) where.hospitalId = hospital.id
    } else if (user.role === 'lab_admin') {
      const lab = await prisma.lab.findFirst({ where: { adminUserId: user.id } })
      if (lab) where.labId = lab.id
    }

    // ── Filters ───────────────────────────────────────────────────────────────
    if (type)   where.type   = type
    if (status) where.status = status

    if (filter === 'upcoming') {
      where.status    = { in: ['confirmed', 'pending_payment', 'created'] }
      where.startTime = { gte: new Date() }
    } else if (filter === 'completed') {
      where.status = 'completed'
    } else if (filter === 'cancelled') {
      where.status = { in: ['cancelled', 'refunded'] }
    }

    if (dateFrom || dateTo) {
      where.startTime = where.startTime || {}
      if (dateFrom) where.startTime.gte = new Date(`${dateFrom}T00:00:00`)
      if (dateTo)   where.startTime.lte = new Date(`${dateTo}T23:59:59`)
    }

    // ── Fetch bookings ────────────────────────────────────────────────────────
    const [rawBookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take,
        orderBy: { startTime: filter === 'upcoming' ? 'asc' : 'desc' },
      }),
      prisma.booking.count({ where }),
    ])

    // ── Attach user + doctor names in one batch ───────────────────────────────
    const userIds   = [...new Set(rawBookings.map((b) => b.userId).filter(Boolean))]
    const doctorIds = [...new Set(rawBookings.map((b) => b.doctorId).filter(Boolean))]

    const [users, doctors] = await Promise.all([
      userIds.length > 0
        ? prisma.user.findMany({
            where:  { id: { in: userIds } },
            select: { id: true, name: true, phone: true, email: true },
          })
        : Promise.resolve([]),
      doctorIds.length > 0
        ? prisma.doctor.findMany({
            where:  { id: { in: doctorIds } },
            select: { id: true, name: true, specialization: true },
          })
        : Promise.resolve([]),
    ])

    const userMap   = Object.fromEntries(users.map((u) => [u.id, u]))
    const doctorMap = Object.fromEntries(doctors.map((d) => [d.id, d]))

    // ✅ Attach userName, userPhone, doctorName to every booking
    const bookings = rawBookings.map((b) => ({
      ...b,
      userName:             userMap[b.userId]?.name              || null,
      userPhone:            userMap[b.userId]?.phone             || null,
      userEmail:            userMap[b.userId]?.email             || null,
      doctorName:           doctorMap[b.doctorId]?.name          || null,
      doctorSpecialization: doctorMap[b.doctorId]?.specialization || null,
    }))

    return successResponse({
      bookings,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (err) {
    console.error('[Bookings GET]', err.message)
    if (err.message?.includes('token') || err.message?.includes('Unauthorized'))
      return errorResponse(err.message, 'AUTH_ERROR', 401)
    return errorResponse('Failed to fetch bookings', 'SERVER_ERROR', 500)
  }
}

export async function POST(request) {
  try {
    const user = await verifyAuth(request)
    const body = await request.json()

    const {
      type,
      hospitalId,
      doctorId,
      labId,
      testIds        = [],
      collectionType,
      collectionAddress,
      startTime,
      endTime,
      timezone       = 'Asia/Kolkata',
      couponCode,
    } = body

    if (!type) return errorResponse('Booking type is required', 'VALIDATION_ERROR', 400)

    let resolvedHospitalId = hospitalId || null
    let resolvedDoctorId   = doctorId   || null
    let resolvedLabId      = labId      || null
    let baseFee            = 0
    let entityId           = null
    let entityType         = null

    if (type === 'hospital' || type === 'offline' || type === 'online') {
      if (!doctorId)   return errorResponse('doctorId is required', 'VALIDATION_ERROR', 400)
      if (!startTime)  return errorResponse('startTime is required for doctor bookings', 'VALIDATION_ERROR', 400)

      const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } })
      if (!doctor)          return errorResponse('Doctor not found', 'NOT_FOUND', 404)
      if (!doctor.isActive) return errorResponse('Doctor is not active', 'VALIDATION_ERROR', 400)

      resolvedDoctorId   = doctor.id
      resolvedHospitalId = doctor.hospitalId

      baseFee    = type === 'online'
        ? (doctor.consultationFee?.online  || 0)
        : (doctor.consultationFee?.offline || 0)
      entityId   = resolvedHospitalId
      entityType = 'hospital'

    } else if (type === 'lab') {
      if (!labId)          return errorResponse('labId is required', 'VALIDATION_ERROR', 400)
      if (!testIds.length) return errorResponse('At least one test is required', 'VALIDATION_ERROR', 400)

      const lab = await prisma.lab.findUnique({ where: { id: labId } })
      if (!lab)          return errorResponse('Lab not found', 'NOT_FOUND', 404)
      if (!lab.isActive) return errorResponse('Lab is not active', 'VALIDATION_ERROR', 400)

      const tests = await prisma.test.findMany({
        where: { id: { in: testIds }, labId, isActive: true },
      })
      if (!tests.length) return errorResponse('No valid tests found', 'VALIDATION_ERROR', 400)

      baseFee       = tests.reduce((sum, t) => sum + (t.discountedPrice || t.price), 0)
      resolvedLabId = labId
      entityId      = labId
      entityType    = 'lab'
    } else {
      return errorResponse(`Invalid booking type: ${type}`, 'VALIDATION_ERROR', 400)
    }

    const resolvedStartTime = startTime
      ? new Date(startTime)
      : new Date(Date.now() + 60 * 60 * 1000)

    const resolvedEndTime = endTime
      ? new Date(endTime)
      : new Date(resolvedStartTime.getTime() + 30 * 60 * 1000)

    if (resolvedDoctorId) {
      const conflict = await prisma.booking.findFirst({
        where: {
          doctorId:  resolvedDoctorId,
          startTime: resolvedStartTime,
          status:    { in: ['confirmed', 'pending_payment', 'created'] },
        },
      })
      if (conflict) return errorResponse('This slot is already booked', 'SLOT_CONFLICT', 409)
    }

    const pricing = await calculateBookingPrice({
      bookingType: entityType,
      entityId,
      baseAmount:  baseFee,
      couponCode,
      userId:      user.id,
    })

    const bookingIdStr = generateBookingId()

    const booking = await prisma.booking.create({
      data: {
        bookingId:           bookingIdStr,
        userId:              user.id,
        type:                type === 'offline' ? 'hospital' : type,
        hospitalId:          resolvedHospitalId,
        doctorId:            resolvedDoctorId,
        labId:               resolvedLabId,
        testIds,
        collectionType:      collectionType   || null,
        collectionAddress:   collectionAddress || null,
        startTime:           resolvedStartTime,
        endTime:             resolvedEndTime,
        timezone,
        status:              'created',
        paymentStatus:       'pending',
        baseFee:             pricing.baseFee,
        couponCode:          pricing.couponCode          || null,
        couponType:          pricing.couponType          || null,
        couponDiscount:      pricing.couponDiscount,
        discountedFee:       pricing.discountedFee,
        platformFeePercent:  pricing.platformFeePercent,
        platformFee:         pricing.platformFee,
        gstPercent:          18,
        gst:                 pricing.gst,
        subtotal:            pricing.subtotal,
        adminCouponDiscount: pricing.adminCouponDiscount,
        totalAmount:         pricing.totalAmount,
      },
    })

    try {
      const invoiceNumber = generateInvoiceNumber()
      await prisma.invoice.create({
        data: {
          invoiceNumber,
          bookingId:           booking.id,
          userId:              user.id,
          entityType:          entityType || null,
          entityId:            entityId   || null,
          items:               [],
          baseFee:             pricing.baseFee,
          couponCode:          pricing.couponCode          || null,
          couponDiscount:      pricing.couponDiscount,
          couponType:          pricing.couponType          || null,
          discountedFee:       pricing.discountedFee,
          platformFeePercent:  pricing.platformFeePercent,
          platformFee:         pricing.platformFee,
          gstPercent:          18,
          gst:                 pricing.gst,
          subtotal:            pricing.subtotal,
          adminCouponDiscount: pricing.adminCouponDiscount,
          totalAmount:         pricing.totalAmount,
        },
      })
    } catch (invErr) {
      console.error('[Invoice create]', invErr.message)
    }

    if (resolvedDoctorId) {
      await invalidateSlotCache(resolvedDoctorId, resolvedStartTime)
    }

    return successResponse(booking, 'Booking created', 201)
  } catch (err) {
    console.error('[Bookings POST]', err.message)
    if (err.message?.includes('token') || err.message?.includes('Unauthorized'))
      return errorResponse(err.message, 'AUTH_ERROR', 401)
    return errorResponse(err.message || 'Failed to create booking', 'SERVER_ERROR', 500)
  }
}