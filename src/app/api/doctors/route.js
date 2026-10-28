import { prisma } from '@/lib/prisma'
import {
  successResponse,
  errorResponse,
  handleOptions,
  paginatedResponse,
} from '@/lib/utils/apiResponse'
import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { checkRole } from '@/lib/middleware/rbac.middleware'
import { logAdminAction } from '@/lib/middleware/audit.middleware'
import {
  getPaginationParams,
  buildPaginationMeta,
} from '@/lib/utils/helpers'

export function OPTIONS() {
  return handleOptions()
}

/* ─── GET /api/doctors — Public listings and admin doctor management ─── */
export async function GET(request) {
  // Doctor listings are shown before sign-in. Admin users retain the full
  // management view; regular users and guests only receive bookable doctors.
  const user = await verifyAuth(request)
  const adminRoles = ['super_admin', 'regional_manager', 'hospital_admin']
  const isAdmin = adminRoles.includes(user?.role)
  if (user && !isAdmin && user.role !== 'user') {
    return errorResponse('Access denied. Doctor listings are unavailable for this role', 403)
  }

  try {
    const { searchParams } = new URL(request.url)
    const search     = searchParams.get('search') || ''
    const hospitalId = searchParams.get('hospitalId')
    const isVerified = searchParams.get('isVerified')
    const isActive   = searchParams.get('isActive')

    const { page, limit, skip, take } = getPaginationParams(
      searchParams.get('page'),
      searchParams.get('limit')
    )

    const where = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (hospitalId) {
      where.hospitalId = hospitalId
    }

    if (!isAdmin) {
      where.isVerified = true
      where.isActive = true

      const hospitals = await prisma.hospital.findMany({
        where: {
          isApproved: true,
          isActive: true,
          ...(hospitalId ? { id: hospitalId } : {}),
        },
        select: { id: true },
      })
      const visibleHospitalIds = hospitals.map((hospital) => hospital.id)
      if (hospitalId && visibleHospitalIds.length === 0) {
        return paginatedResponse([], buildPaginationMeta(0, page, limit), 'doctors')
      }
      where.hospitalId = { in: visibleHospitalIds }
    }

    // Hospital admins can only see doctors from their own hospital
    if (user?.role === 'hospital_admin') {
      const hospital = await prisma.hospital.findFirst({
        where: { adminUserId: user.id },
        select: { id: true },
      })
      if (!hospital) {
        return paginatedResponse([], buildPaginationMeta(0, page, limit), 'doctors')
      }
      where.hospitalId = hospital.id
    }

    if (isAdmin && (isVerified === 'true' || isVerified === 'false')) {
      where.isVerified = isVerified === 'true'
    }
    if (isAdmin && (isActive === 'true' || isActive === 'false')) {
      where.isActive = isActive === 'true'
    }

    const [doctors, total] = await Promise.all([
      prisma.doctor.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          specialization: true,
          qualifications: true,
          experience: true,
          avatar: true,
          consultationFee: true,
          consultationTypes: true,
          isVerified: true,
          isActive: true,
          rating: true,
          hospitalId: true,
          ...(isAdmin ? { userId: true } : {}),
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.doctor.count({ where }),
    ])

    return paginatedResponse(
      doctors,
      buildPaginationMeta(total, page, limit),
      'doctors'
    )
  } catch (error) {
    if (error.message?.includes('Access denied')) {
      return errorResponse(error.message, 403)
    }
    console.error('[GET /api/doctors]', error)
    return errorResponse('Failed to fetch doctors', 500)
  }
}

/* ─── POST /api/doctors — Create doctor (Auto-Verified) ──────────────── */
export async function POST(request) {
  return verifyAuth(request, async (req, user) => {
    try {
      checkRole(user, 'super_admin', 'hospital_admin')

      const body = await request.json()
      const {
        hospitalId,
        userId,
        name,
        specialization    = [],
        qualifications    = [],
        experience        = 0,
        consultationTypes = ['offline'],
        consultationFee   = { online: 0, offline: 0 },
      } = body

      if (!name?.trim()) return errorResponse('Doctor name is required', 400)
      if (!hospitalId)   return errorResponse('hospitalId is required', 400)

      const hospital = await prisma.hospital.findUnique({
        where: { id: hospitalId },
        select: { id: true, adminUserId: true },
      })
      if (!hospital) return errorResponse('Hospital not found', 404)

      if (user.role === 'hospital_admin' && hospital.adminUserId !== user.id) {
        return errorResponse('You can only add doctors to your own hospital', 403)
      }

      if (userId) {
        const existingUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, role: true },
        })
        if (!existingUser) return errorResponse('Linked user not found', 404)
      }

      const doctor = await prisma.doctor.create({
        data: {
          hospitalId,
          userId: userId || null,
          name: name.trim(),
          specialization,
          qualifications,
          experience: Number(experience) || 0,
          consultationTypes,
          consultationFee: {
            online:  Number(consultationFee.online)  || 0,
            offline: Number(consultationFee.offline) || 0,
          },
          availability: [],
          exceptions: [],
          isVerified: true, // ✅ Auto-verified
          isActive: true,
        },
      })

      logAdminAction(
        request, user, 'DOCTOR_CREATED', 'Doctor', doctor.id,
        { hospitalId, userId: userId || null, name: name.trim() }
      ).catch((e) => console.warn('[audit]', e?.message))

      return successResponse(doctor, 'Doctor created successfully', 201)
    } catch (error) {
      if (error.message?.includes('Access denied')) {
        return errorResponse(error.message, 403)
      }
      console.error('[POST /api/doctors]', error)
      return errorResponse('Failed to create doctor', 500)
    }
  })
}
