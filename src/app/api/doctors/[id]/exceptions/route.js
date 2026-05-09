import { prisma } from '@/lib/prisma'
import { cache } from '@/lib/cache'
import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { checkRole } from '@/lib/middleware/rbac.middleware'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'

export function OPTIONS() {
  return handleOptions()
}

export async function POST(request, { params }) {
  try {
    const { id } = await params
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

    const body = await request.json()
    const { date, available, reason } = body

    if (!date) {
      return errorResponse('Date is required', 'VALIDATION_ERROR', 400)
    }

    const exceptionDate = new Date(date)
    const now = new Date()
    now.setHours(0, 0, 0, 0)

    if (exceptionDate < now) {
      return errorResponse('Exception date must be in the future', 'VALIDATION_ERROR', 400)
    }

    const exceptions = [
      ...(doctor.exceptions || []),
      {
        date: exceptionDate,
        available: available ?? false,
        reason: reason || null,
      },
    ]

    const updated = await prisma.doctor.update({
      where: { id },
      data: { exceptions },
    })

    // Invalidate slot cache for that date
    const dateStr = exceptionDate.toISOString().split('T')[0]
    await cache.del(`slots:${id}:${dateStr}`)

    return successResponse(updated, 'Exception added')
  } catch (err) {
    console.error('[Doctor Exception POST]', err.message)
    if (err.message.includes('Access denied') || err.message.includes('token')) {
      return errorResponse(err.message, 'AUTH_ERROR', 403)
    }
    return errorResponse('Failed to add exception', 'SERVER_ERROR', 500)
  }
}