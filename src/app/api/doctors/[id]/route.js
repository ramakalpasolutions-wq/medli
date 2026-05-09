import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { checkRole } from '@/lib/middleware/rbac.middleware'
import { sanitizeInput } from '@/lib/utils/validators'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'

export function OPTIONS() {
  return handleOptions()
}

export async function GET(request, { params }) {
  try {
    const { id } = await params
    const doctor = await prisma.doctor.findUnique({ where: { id } })

    if (!doctor) {
      return errorResponse('Doctor not found', 'NOT_FOUND', 404)
    }

    return successResponse(doctor)
  } catch (err) {
    console.error('[Doctor GET]', err.message)
    return errorResponse('Failed to fetch doctor', 'SERVER_ERROR', 500)
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params
    const user = await verifyAuth(request)
    checkRole(user, 'super_admin', 'hospital_admin')

    const doctor = await prisma.doctor.findUnique({ where: { id } })
    if (!doctor) {
      return errorResponse('Doctor not found', 'NOT_FOUND', 404)
    }

    if (user.role === 'hospital_admin') {
      const hospital = await prisma.hospital.findUnique({ where: { id: doctor.hospitalId } })
      if (!hospital || hospital.adminUserId !== user.id) {
        return errorResponse('Access denied', 'FORBIDDEN', 403)
      }
    }

    const body = await request.json()
    const updateData = {}

    if (body.name !== undefined) updateData.name = sanitizeInput(body.name)
    if (body.specialization !== undefined) updateData.specialization = body.specialization
    if (body.qualifications !== undefined) updateData.qualifications = body.qualifications
    if (body.experience !== undefined) updateData.experience = body.experience
    if (body.avatar !== undefined) updateData.avatar = body.avatar
    if (body.consultationFee !== undefined) updateData.consultationFee = body.consultationFee
    if (body.consultationTypes !== undefined) updateData.consultationTypes = body.consultationTypes

    const updated = await prisma.doctor.update({
      where: { id },
      data: updateData,
    })

    return successResponse(updated, 'Doctor updated')
  } catch (err) {
    console.error('[Doctor PUT]', err.message)
    if (err.message.includes('Access denied') || err.message.includes('token')) {
      return errorResponse(err.message, 'AUTH_ERROR', 403)
    }
    return errorResponse('Failed to update doctor', 'SERVER_ERROR', 500)
  }
}