import { prisma } from '@/lib/prisma'
import { cache } from '@/lib/cache'
import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { checkRole } from '@/lib/middleware/rbac.middleware'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'

export function OPTIONS() {
  return handleOptions()
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params
    const user = await verifyAuth(request)
    checkRole(user, 'super_admin', 'hospital_admin', 'doctor')

    const doctor = await prisma.doctor.findUnique({ where: { id } })
    if (!doctor) {
      return errorResponse('Doctor not found', 'NOT_FOUND', 404)
    }

    // Doctor can update own availability
    if (user.role === 'doctor' && doctor.userId !== user.id) {
      return errorResponse('Access denied', 'FORBIDDEN', 403)
    }

    if (user.role === 'hospital_admin') {
      const hospital = await prisma.hospital.findUnique({ where: { id: doctor.hospitalId } })
      if (!hospital || hospital.adminUserId !== user.id) {
        return errorResponse('Access denied', 'FORBIDDEN', 403)
      }
    }

    const body = await request.json()

    if (!Array.isArray(body.availability)) {
      return errorResponse('availability must be an array', 'VALIDATION_ERROR', 400)
    }

    const updated = await prisma.doctor.update({
      where: { id },
      data: { availability: body.availability },
    })

    // Invalidate all slot caches for this doctor
    await cache.delPattern(`slots:${id}:*`)

    return successResponse(updated, 'Availability updated')
  } catch (err) {
    console.error('[Doctor Availability]', err.message)
    if (err.message.includes('Access denied') || err.message.includes('token')) {
      return errorResponse(err.message, 'AUTH_ERROR', 403)
    }
    return errorResponse('Failed to update availability', 'SERVER_ERROR', 500)
  }
}