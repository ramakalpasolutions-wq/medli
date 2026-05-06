import prisma from '@/lib/prisma'
import { cache } from '@/lib/cache'
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

    const cacheKey = `hospital:${id}`
    const cached = await cache.get(cacheKey)
    if (cached) {
      return successResponse(cached, 'From cache')
    }

    const hospital = await prisma.hospital.findUnique({ where: { id } })

    if (!hospital) {
      return errorResponse('Hospital not found', 'NOT_FOUND', 404)
    }

    await cache.set(cacheKey, hospital, 300)

    return successResponse(hospital)
  } catch (err) {
    console.error('[Hospital GET]', err.message)
    return errorResponse('Failed to fetch hospital', 'SERVER_ERROR', 500)
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params
    const user = await verifyAuth(request)

    const hospital = await prisma.hospital.findUnique({ where: { id } })
    if (!hospital) {
      return errorResponse('Hospital not found', 'NOT_FOUND', 404)
    }

    // super_admin or hospital_admin who owns this hospital
    if (user.role === 'hospital_admin') {
      if (hospital.adminUserId !== user.id) {
        return errorResponse('Access denied', 'FORBIDDEN', 403)
      }
    } else {
      checkRole(user, 'super_admin')
    }

    const body = await request.json()

    const updateData = {}
    if (body.name !== undefined) updateData.name = sanitizeInput(body.name)
    if (body.address !== undefined) updateData.address = body.address
    if (body.location !== undefined) updateData.location = body.location
    if (body.departments !== undefined) updateData.departments = body.departments
    if (body.services !== undefined) updateData.services = body.services
    if (body.images !== undefined) updateData.images = body.images
    if (body.contactPhone !== undefined) updateData.contactPhone = body.contactPhone
    if (body.contactEmail !== undefined) updateData.contactEmail = body.contactEmail
    if (body.operatingHours !== undefined) updateData.operatingHours = body.operatingHours
    if (body.platformFeePercent !== undefined && user.role === 'super_admin') {
      updateData.platformFeePercent = body.platformFeePercent
    }

    const updated = await prisma.hospital.update({
      where: { id },
      data: updateData,
    })

    await cache.del(`hospital:${id}`)

    return successResponse(updated, 'Hospital updated')
  } catch (err) {
    console.error('[Hospital PUT]', err.message)
    if (err.message.includes('Access denied') || err.message.includes('token')) {
      return errorResponse(err.message, 'AUTH_ERROR', 403)
    }
    return errorResponse('Failed to update hospital', 'SERVER_ERROR', 500)
  }
}