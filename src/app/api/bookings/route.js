import { prisma }     from '@/lib/prisma'
import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { checkRole }  from '@/lib/middleware/rbac.middleware'
import {
  getPaginationParams,
  buildPaginationMeta,
  getDateRange,
} from '@/lib/utils/helpers'
import {
  successResponse,
  errorResponse,
  handleOptions,
  paginatedResponse,
} from '@/lib/utils/apiResponse'

export function OPTIONS() { return handleOptions() }

export async function GET(request) {
  return verifyAuth(request, async (req, user) => {
    try {
      const { searchParams } = new URL(request.url)
      const status     = searchParams.get('status')     || ''
      const type       = searchParams.get('type')       || ''
      const hospitalId = searchParams.get('hospitalId') || ''
      const labId      = searchParams.get('labId')      || ''
      const doctorId   = searchParams.get('doctorId')   || ''
      const dateFrom   = searchParams.get('dateFrom')   || ''
      const dateTo     = searchParams.get('dateTo')     || ''

      const { page, limit, skip, take } = getPaginationParams(
        searchParams.get('page'),
        searchParams.get('limit'),
      )

      const where = {}

      // Role-based filtering
      if (user.role === 'user') {
        where.userId = user.userId
      } else if (user.role === 'doctor') {
        const doctor = await prisma.doctor.findFirst({
          where:  { userId: user.userId },
          select: { id: true },
        })
        if (doctor) where.doctorId = doctor.id
      } else if (user.role === 'hospital_admin') {
        const hospital = await prisma.hospital.findFirst({
          where:  { adminUserId: user.userId },
          select: { id: true },
        })
        if (hospital) where.hospitalId = hospital.id
      } else if (user.role === 'lab_admin') {
        const lab = await prisma.lab.findFirst({
          where:  { adminUserId: user.userId },
          select: { id: true },
        })
        if (lab) where.labId = lab.id
      }
      // super_admin and regional_manager see all

      if (status)     where.status     = status
      if (type)       where.type       = type
      if (hospitalId) where.hospitalId = hospitalId
      if (labId)      where.labId      = labId
      if (doctorId)   where.doctorId   = doctorId

      if (dateFrom || dateTo) {
        where.startTime = {}
        if (dateFrom) where.startTime.gte = new Date(dateFrom)
        if (dateTo) {
          const end = new Date(dateTo)
          end.setHours(23, 59, 59, 999)
          where.startTime.lte = end
        }
      }

      const [bookings, total] = await Promise.all([
        prisma.booking.findMany({
          where,
          skip,
          take,
          orderBy: { startTime: 'desc' },
        }),
        prisma.booking.count({ where }),
      ])

      // Enrich with user names and doctor names
      const userIds   = [...new Set(bookings.map((b) => b.userId).filter(Boolean))]
      const doctorIds = [...new Set(bookings.map((b) => b.doctorId).filter(Boolean))]

      const [users, doctors] = await Promise.all([
        userIds.length > 0
          ? prisma.user.findMany({
              where:  { id: { in: userIds } },
              select: { id: true, name: true, phone: true, email: true },
            })
          : [],
        doctorIds.length > 0
          ? prisma.doctor.findMany({
              where:  { id: { in: doctorIds } },
              select: { id: true, name: true, specialization: true },
            })
          : [],
      ])

      const userMap   = Object.fromEntries(users.map((u) => [u.id, u]))
      const doctorMap = Object.fromEntries(doctors.map((d) => [d.id, d]))

      const enriched = bookings.map((b) => ({
        ...b,
        userName:   userMap[b.userId]?.name   || null,
        userPhone:  userMap[b.userId]?.phone  || null,
        doctorName: doctorMap[b.doctorId]?.name || null,
      }))

      return paginatedResponse(
        enriched,
        buildPaginationMeta(total, page, limit),
        'bookings',
      )

    } catch (error) {
      console.error('[GET /api/bookings]', error)
      return errorResponse('Internal server error', 500)
    }
  })
}

export async function POST(request) {
  return verifyAuth(request, async (req, user) => {
    try {
      const body = await request.json()

      if (!body.type)      return errorResponse('Booking type is required', 400)
      if (!body.startTime) return errorResponse('Start time is required', 400)

      const { generateBookingId } = await import('@/lib/utils/helpers')

      const booking = await prisma.booking.create({
        data: {
          bookingId:         generateBookingId(),
          userId:            user.userId,
          type:              body.type,
          hospitalId:        body.hospitalId    || undefined,
          doctorId:          body.doctorId      || undefined,
          labId:             body.labId         || undefined,
          testIds:           body.testIds        || [],
          startTime:         new Date(body.startTime),
          endTime:           body.endTime ? new Date(body.endTime) : undefined,
          collectionType:    body.collectionType || undefined,
          collectionAddress: body.collectionAddress || undefined,
          status:            'created',
          paymentStatus:     'pending',
          baseFee:           Number(body.baseFee)           || 0,
          platformFeePercent:Number(body.platformFeePercent)|| 0,
          platformFee:       Number(body.platformFee)       || 0,
          gst:               Number(body.gst)               || 0,
          subtotal:          Number(body.subtotal)          || 0,
          totalAmount:       Number(body.totalAmount)       || 0,
        },
      })

      return successResponse(booking, 'Booking created', 201)

    } catch (error) {
      console.error('[POST /api/bookings]', error)
      return errorResponse('Internal server error', 500)
    }
  })
}