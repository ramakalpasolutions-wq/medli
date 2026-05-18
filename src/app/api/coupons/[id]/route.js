import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'

export function OPTIONS() { return handleOptions() }

export async function GET(request, { params }) {
  try {
    const user = await verifyAuth(request)
    const { id } = await params

    const coupon = await prisma.coupon.findUnique({ where: { id } })
    if (!coupon) return errorResponse('Coupon not found', 'NOT_FOUND', 404)

    return successResponse(coupon)
  } catch (err) {
    return errorResponse('Failed to fetch coupon', 'SERVER_ERROR', 500)
  }
}

export async function PUT(request, { params }) {
  try {
    const user = await verifyAuth(request)
    const { id } = await params

    if (!['super_admin', 'hospital_admin', 'lab_admin'].includes(user.role))
      return errorResponse('Access denied', 'FORBIDDEN', 403)

    const coupon = await prisma.coupon.findUnique({ where: { id } })
    if (!coupon) return errorResponse('Coupon not found', 'NOT_FOUND', 404)

    if (user.role !== 'super_admin' && coupon.createdBy?.userId !== user.userId)
      return errorResponse('Access denied', 'FORBIDDEN', 403)

    const body = await request.json()
    const updateData = {}

    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.discountValue !== undefined) updateData.discountValue = parseFloat(body.discountValue)
    if (body.maxDiscountAmount !== undefined) updateData.maxDiscountAmount = parseFloat(body.maxDiscountAmount)
    if (body.minOrderAmount !== undefined) updateData.minOrderAmount = parseFloat(body.minOrderAmount)
    if (body.validFrom !== undefined) updateData.validFrom = new Date(body.validFrom)
    if (body.validUntil !== undefined) updateData.validUntil = new Date(body.validUntil)
    if (body.totalUsageLimit !== undefined) updateData.totalUsageLimit = parseInt(body.totalUsageLimit)
    if (body.applicableBookingTypes !== undefined) updateData.applicableBookingTypes = body.applicableBookingTypes

    const updated = await prisma.coupon.update({ where: { id }, data: updateData })
    return successResponse(updated, 'Coupon updated')
  } catch (err) {
    return errorResponse('Failed to update coupon', 'SERVER_ERROR', 500)
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await verifyAuth(request)
    const { id } = await params

    if (!['super_admin', 'hospital_admin', 'lab_admin'].includes(user.role))
      return errorResponse('Access denied', 'FORBIDDEN', 403)

    const coupon = await prisma.coupon.findUnique({ where: { id } })
    if (!coupon) return errorResponse('Coupon not found', 'NOT_FOUND', 404)

    if (user.role !== 'super_admin' && coupon.createdBy?.userId !== user.id)
      return errorResponse('Access denied', 'FORBIDDEN', 403)

    await prisma.coupon.update({ where: { id }, data: { isActive: false } })
    return successResponse(null, 'Coupon deleted')
  } catch (err) {
    return errorResponse('Failed to delete coupon', 'SERVER_ERROR', 500)
  }
}