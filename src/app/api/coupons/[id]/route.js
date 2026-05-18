import { ObjectId } from 'mongodb'
import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/middleware/auth.middleware'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'

export function OPTIONS() {
  return handleOptions()
}

const isValidObjectId = (id) => typeof id === 'string' && ObjectId.isValid(id)

export async function GET(request, { params }) {
  try {
    await verifyAuth(request)
    const { id } = params

    if (!isValidObjectId(id)) {
      return errorResponse('Invalid coupon id', 'INVALID_ID', 400)
    }

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

    const body = await request.json()
    const updateData = {}

    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.discountValue !== undefined) updateData.discountValue = parseFloat(body.discountValue)
    if (body.maxDiscountAmount !== undefined) updateData.maxDiscountAmount = body.maxDiscountAmount ? parseFloat(body.maxDiscountAmount) : null
    if (body.minOrderAmount !== undefined) updateData.minOrderAmount = body.minOrderAmount ? parseFloat(body.minOrderAmount) : 0
    if (body.validFrom !== undefined) updateData.validFrom = body.validFrom ? new Date(body.validFrom) : null
    if (body.validUntil !== undefined) updateData.validUntil = body.validUntil ? new Date(body.validUntil) : null
    if (body.totalUsageLimit !== undefined) updateData.totalUsageLimit = body.totalUsageLimit ? parseInt(body.totalUsageLimit) : null
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

    await prisma.coupon.update({ where: { id }, data: { isActive: false } })
    return successResponse(null, 'Coupon deleted')
  } catch (err) {
    return errorResponse('Failed to delete coupon', 'SERVER_ERROR', 500)
  }
}