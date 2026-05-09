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
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id:               true,
          userId:           true,
          hospitalId:       true,
          name:             true,
          specialization:   true,
          qualifications:   true,
          experience:       true,
          avatar:           true,
          consultationFee:  true,
          consultationTypes:true,
          availability:     true,
          isVerified:       true,
          isActive:         true,
          rating:           true,
          createdAt:        true,
          updatedAt:        true,
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

export async function POST(request) {
  return verifyAuth(request, async (req, user) => {
    try {
      checkRole(user, 'super_admin', 'hospital_admin')

      const body = await request.json()

      if (!body.name)       return errorResponse('Name is required', 400)
      if (!body.hospitalId) return errorResponse('Hospital ID is required', 400)

      const doctor = await prisma.doctor.create({
        data: {
          name:             sanitizeInput(body.name),
          hospitalId:       body.hospitalId,
          userId:           body.userId           || undefined,
          specialization:   body.specialization   || [],
          qualifications:   body.qualifications   || [],
          experience:       body.experience        ? Number(body.experience) : undefined,
          avatar:           body.avatar            || undefined,
          consultationFee:  body.consultationFee   || undefined,
          consultationTypes:body.consultationTypes || [],
          isVerified:       false,
          isActive:         true,
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