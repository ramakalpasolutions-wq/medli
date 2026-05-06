import prisma from '@/lib/prisma'
import { cache } from '@/lib/cache'
import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { checkRole } from '@/lib/middleware/rbac.middleware'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'

export function OPTIONS() {
  return handleOptions()
}

export async function DELETE(request, { params }) {
  try {
    const { id, exId } = await params
    const user = await verifyAuth(request)
    checkRole(user, 'super_admin', 'hospital_admin', 'doctor')

    const doctor = await prisma.doctor.findUnique({ where: { id } })
    if (!doctor) {
      return errorResponse('Doctor not found', 'NOT_FOUND', 404)
    }

    if (user.role === 'doctor' && doctor.userId !== user.id) {
      return errorResponse('Access denied', 'FORBIDDEN', 403)
    }

    if (user.role === 'hospital_admin') {
      const hospital = await prisma.hospital.findUnique({ where: { id: doctor.hospitalId } })
      if (!hospital || hospital.adminUserId !== user.id) {
        return errorResponse('Access denied', 'FORBIDDEN', 403)
      }
    }

    // exId is the date string (YYYY-MM-DD) used to identify the exception
    const targetDate = new Date(exId)
    if (isNaN(targetDate.getTime())) {
      return errorResponse('Invalid exception date', 'VALIDATION_ERROR', 400)
    }

    const exceptions = (doctor.exceptions || []).filter((ex) => {
      const exDate = new Date(ex.date)
      return exDate.toISOString().split('T')[0] !== targetDate.toISOString().split('T')[0]
    })

    const updated = await prisma.doctor.update({
      where: { id },
      data: { exceptions },
    })

    await cache.del(`slots:${id}:${targetDate.toISOString().split('T')[0]}`)

    return successResponse(updated, 'Exception removed')
  } catch (err) {
    console.error('[Doctor Exception DELETE]', err.message)
    if (err.message.includes('Access denied') || err.message.includes('token')) {
      return errorResponse(err.message, 'AUTH_ERROR', 403)
    }
    return errorResponse('Failed to remove exception', 'SERVER_ERROR', 500)
  }
}