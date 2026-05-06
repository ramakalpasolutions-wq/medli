import prisma from '@/lib/prisma'
import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { checkRole } from '@/lib/middleware/rbac.middleware'
import { getPaginationParams } from '@/lib/utils/helpers'
import { sanitizeInput } from '@/lib/utils/validators'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'

export function OPTIONS() {
  return handleOptions()
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const { skip, take, page, limit } = getPaginationParams(
      searchParams.get('page'),
      searchParams.get('limit')
    )

    const hospitalId = searchParams.get('hospitalId')
    const specialization = searchParams.get('specialization')
    const search = searchParams.get('search')

    const where = { isActive: true }

    if (hospitalId) where.hospitalId = hospitalId
    if (specialization) where.specialization = { has: specialization }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [doctors, total] = await Promise.all([
      prisma.doctor.findMany({ where, skip, take, orderBy: { name: 'asc' } }),
      prisma.doctor.count({ where }),
    ])

    return successResponse({
      doctors,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (err) {
    console.error('[Doctors GET]', err.message)
    return errorResponse('Failed to fetch doctors', 'SERVER_ERROR', 500)
  }
}

export async function POST(request) {
  try {
    const user = await verifyAuth(request)
    checkRole(user, 'super_admin', 'hospital_admin')

    const body = await request.json()

    if (!body.name || !body.hospitalId) {
      return errorResponse('Name and hospitalId are required', 'VALIDATION_ERROR', 400)
    }

    // hospital_admin can only add to their hospital
    if (user.role === 'hospital_admin') {
      const hospital = await prisma.hospital.findUnique({ where: { id: body.hospitalId } })
      if (!hospital || hospital.adminUserId !== user.id) {
        return errorResponse('Access denied', 'FORBIDDEN', 403)
      }
    }

    const doctor = await prisma.doctor.create({
      data: {
        name: sanitizeInput(body.name),
        hospitalId: body.hospitalId,
        userId: body.userId || null,
        specialization: body.specialization || [],
        qualifications: body.qualifications || [],
        experience: body.experience || null,
        avatar: body.avatar || null,
        consultationFee: body.consultationFee || null,
        consultationTypes: body.consultationTypes || [],
        availability: body.availability || [],
        exceptions: [],
      },
    })

    return successResponse(doctor, 'Doctor created', 201)
  } catch (err) {
    console.error('[Doctors POST]', err.message)
    if (err.message.includes('Access denied') || err.message.includes('token')) {
      return errorResponse(err.message, 'AUTH_ERROR', 403)
    }
    return errorResponse('Failed to create doctor', 'SERVER_ERROR', 500)
  }
}