import prisma from '@/lib/prisma'
import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'

export function OPTIONS() { return handleOptions() }

export async function PATCH(request, { params }) {
  try {
    const user = await verifyAuth(request)
    const { id } = await params

    if (!['super_admin', 'hospital_admin', 'lab_admin'].includes(user.role))
      return errorResponse('Access denied', 'FORBIDDEN', 403)

    const coupon = await prisma.coupon.findUnique({ where: { id } })
    if (!coupon) return errorResponse('Coupon not found', 'NOT_FOUND', 404)

    const updated = await prisma.coupon.update({
      where: { id },
      data: { isActive: !coupon.isActive },
    })

    return successResponse(updated, `Coupon ${updated.isActive ? 'activated' : 'deactivated'}`)
  } catch (err) {
    return errorResponse('Failed to toggle coupon', 'SERVER_ERROR', 500)
  }
}