// C:\Users\ASUS\medli2\src\app\api\doctors\route.js

import { prisma }     from '@/lib/prisma'
import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { checkRole }  from '@/lib/middleware/rbac.middleware'
import {
  getPaginationParams,
  buildPaginationMeta,
} from '@/lib/utils/helpers'
import { sanitizeInput } from '@/lib/utils/validators'
import {
  successResponse,
  errorResponse,
  handleOptions,
  paginatedResponse,
} from '@/lib/utils/apiResponse'

export function OPTIONS() { return handleOptions() }

/* ────────────────────────────────────────────────────────────
   GET — unchanged
──────────────────────────────────────────────────────────── */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const search     = sanitizeInput(searchParams.get('search') || '')
    const hospitalId = searchParams.get('hospitalId') || ''
    const isVerified = searchParams.get('isVerified')
    const isActive   = searchParams.get('isActive')

    const { page, limit, skip, take } = getPaginationParams(
      searchParams.get('page'),
      searchParams.get('limit'),
    )

    const where = {}

    if (search) {
      where.OR = [
        { name:           { contains: search, mode: 'insensitive' } },
        { specialization: { has: search } },
      ]
    }
    if (hospitalId) where.hospitalId = hospitalId
    if (isVerified !== null && isVerified !== '' && isVerified !== undefined) {
      where.isVerified = isVerified === 'true'
    }
    if (isActive !== null && isActive !== '' && isActive !== undefined) {
      where.isActive = isActive === 'true'
    }

    const hasToken =
      !!request.headers.get('authorization') ||
      !!request.cookies.get('accessToken')?.value

    if (!hasToken) {
      where.isVerified = true
      where.isActive   = true
    }

    const [doctors, total] = await Promise.all([
      prisma.doctor.findMany({
        where, skip, take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, userId: true, hospitalId: true,
          name: true, specialization: true, qualifications: true,
          experience: true, avatar: true,
          consultationFee: true, consultationTypes: true,
          availability: true,
          isVerified: true, isActive: true,
          rating: true,
          createdAt: true, updatedAt: true,
        },
      }),
      prisma.doctor.count({ where }),
    ])

    return paginatedResponse(
      doctors,
      buildPaginationMeta(total, page, limit),
      'doctors',
    )

  } catch (error) {
    console.error('[GET /api/doctors]', error)
    return errorResponse('Internal server error', 500)
  }
}

/* ────────────────────────────────────────────────────────────
   POST — ✅ FIXED with auto-verification + defaults
──────────────────────────────────────────────────────────── */
export async function POST(request) {
  return verifyAuth(request, async (req, user) => {
    try {
      checkRole(user, 'super_admin', 'hospital_admin')

      const body = await request.json()

      if (!body.name)       return errorResponse('Name is required', 400)
      if (!body.hospitalId) return errorResponse('Hospital ID is required', 400)

      /* ✅ Verify hospital_admin owns this hospital before allowing add */
      if (user.role === 'hospital_admin') {
        const hospital = await prisma.hospital.findUnique({
          where:  { id: body.hospitalId },
          select: { id: true, adminUserId: true, name: true },
        })

        if (!hospital) {
          return errorResponse('Hospital not found', 404)
        }
        if (hospital.adminUserId !== user.userId) {
          return errorResponse('You can only add doctors to your own hospital', 403)
        }
      }

      /* ✅ Smart defaults */
      const specialization = Array.isArray(body.specialization) && body.specialization.length > 0
        ? body.specialization
        : ['General Physician']

      const qualifications = Array.isArray(body.qualifications) && body.qualifications.length > 0
        ? body.qualifications
        : ['MBBS']

      const consultationTypes = Array.isArray(body.consultationTypes) && body.consultationTypes.length > 0
        ? body.consultationTypes
        : ['offline']

      const consultationFee = body.consultationFee || { online: 0, offline: 500 }

      /* ✅ Default availability — Mon-Fri 9-5 */
      const defaultAvailability = [1, 2, 3, 4, 5].map((dayOfWeek) => ({
        dayOfWeek,
        startTime:    '09:00',
        endTime:      '17:00',
        slotDuration: 30,
      }))

      const doctor = await prisma.doctor.create({
        data: {
          name:              sanitizeInput(body.name),
          hospitalId:        body.hospitalId,
          userId:            body.userId || undefined,
          specialization,                                                  // ✅ never empty
          qualifications,                                                  // ✅ never empty
          experience:        body.experience ? Number(body.experience) : 0, // ✅ default 0
          avatar:            body.avatar || undefined,
          consultationFee,                                                 // ✅ default fees
          consultationTypes,                                               // ✅ default offline
          availability:      Array.isArray(body.availability) && body.availability.length > 0
                              ? body.availability
                              : defaultAvailability,                       // ✅ Mon-Fri 9-5

          /* ✅ Initialize rating */
          rating: { average: 0, count: 0 },

          /* ✅ Auto-verify when created by super_admin or hospital_admin
             (both are trusted creators — patients can immediately book) */
          isVerified: true,
          isActive:   true,
        },
      })

      return successResponse(doctor, 'Doctor created successfully', 201)

    } catch (error) {
      if (error.message?.includes('Access denied')) {
        return errorResponse(error.message, 403)
      }
      console.error('[POST /api/doctors]', error)
      return errorResponse('Internal server error', 500)
    }
  })
}