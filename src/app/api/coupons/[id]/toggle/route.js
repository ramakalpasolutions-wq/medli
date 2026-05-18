import { ObjectId } from 'mongodb'
import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'

export function OPTIONS() {
  return handleOptions()
}

const isValidObjectId = (id) => typeof id === 'string' && ObjectId.isValid(id)

export async function PATCH(request, { params }) {
  try {
    const user = await verifyAuth(request)
    const { id } = params

    if (!isValidObjectId(id)) {
      return errorResponse('Invalid coupon id', 'INVALID_ID', 400)
    }

    if (!['super_admin', 'hospital_admin', 'lab_admin'].includes(user.role)) {
      return errorResponse('Access denied', 'FORBIDDEN', 403)
    }

    const coupon = await prisma.coupon.findUnique({ where: { id } })
    if (!coupon) return errorResponse('Coupon not found', 'NOT_FOUND', 404)

    if (user.role !== 'super_admin' && coupon.createdBy?.userId !== user.id) {
      return errorResponse('Access denied', 'FORBIDDEN', 403)
    }

    const updated = await prisma.coupon.update({
      where: { id },
      data: { isActive: !coupon.isActive },
    })

    return successResponse(
      updated,
      `Coupon ${updated.isActive ? 'activated' : 'deactivated'}`
    )
  } catch (err) {
    return errorResponse('Failed to toggle coupon', 'SERVER_ERROR', 500)
  }
}