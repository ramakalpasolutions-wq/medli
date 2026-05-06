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

    const cacheKey = `lab:${id}`
    const cached = await cache.get(cacheKey)
    if (cached) {
      return successResponse(cached, 'From cache')
    }

    const lab = await prisma.lab.findUnique({ where: { id } })
    if (!lab) {
      return errorResponse('Lab not found', 'NOT_FOUND', 404)
    }

    await cache.set(cacheKey, lab, 300)

    return successResponse(lab)
  } catch (err) {
    console.error('[Lab GET]', err.message)
    return errorResponse('Failed to fetch lab', 'SERVER_ERROR', 500)
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params
    const user = await verifyAuth(request)

    const lab = await prisma.lab.findUnique({ where: { id } })
    if (!lab) {
      return errorResponse('Lab not found', 'NOT_FOUND', 404)
    }

    if (user.role === 'lab_admin') {
      if (lab.adminUserId !== user.id) {
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
    if (body.images !== undefined) updateData.images = body.images
    if (body.certifications !== undefined) updateData.certifications = body.certifications
    if (body.homeCollection !== undefined) updateData.homeCollection = body.homeCollection
    if (body.walkInSlots !== undefined) updateData.walkInSlots = body.walkInSlots
    if (body.contactPhone !== undefined) updateData.contactPhone = body.contactPhone
    if (body.contactEmail !== undefined) updateData.contactEmail = body.contactEmail
    if (body.platformFeePercent !== undefined && user.role === 'super_admin') {
      updateData.platformFeePercent = body.platformFeePercent
    }

    const updated = await prisma.lab.update({ where: { id }, data: updateData })

    await cache.del(`lab:${id}`)

    return successResponse(updated, 'Lab updated')
  } catch (err) {
    console.error('[Lab PUT]', err.message)
    if (err.message.includes('Access denied') || err.message.includes('token')) {
      return errorResponse(err.message, 'AUTH_ERROR', 403)
    }
    return errorResponse('Failed to update lab', 'SERVER_ERROR', 500)
  }
}