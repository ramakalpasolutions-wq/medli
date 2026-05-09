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
    const user = await verifyAuth(request)
    checkRole(user, 'super_admin', 'regional_manager')

    const region = await prisma.region.findUnique({ where: { id } })
    if (!region) {
      return errorResponse('Region not found', 'NOT_FOUND', 404)
    }

    if (user.role === 'regional_manager' && region.managerId !== user.id) {
      return errorResponse('Access denied', 'FORBIDDEN', 403)
    }

    return successResponse(region)
  } catch (err) {
    console.error('[Region GET]', err.message)
    if (err.message.includes('Access denied') || err.message.includes('token')) {
      return errorResponse(err.message, 'AUTH_ERROR', 403)
    }
    return errorResponse('Failed to fetch region', 'SERVER_ERROR', 500)
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params
    const user = await verifyAuth(request)
    checkRole(user, 'super_admin')

    const region = await prisma.region.findUnique({ where: { id } })
    if (!region) {
      return errorResponse('Region not found', 'NOT_FOUND', 404)
    }

    const body = await request.json()
    const updateData = {}

    if (body.name !== undefined) updateData.name = sanitizeInput(body.name)
    if (body.states !== undefined) updateData.states = body.states
    if (body.cities !== undefined) updateData.cities = body.cities
    if (body.isActive !== undefined) updateData.isActive = body.isActive

    const updated = await prisma.region.update({ where: { id }, data: updateData })

    return successResponse(updated, 'Region updated')
  } catch (err) {
    console.error('[Region PUT]', err.message)
    if (err.message.includes('Access denied') || err.message.includes('token')) {
      return errorResponse(err.message, 'AUTH_ERROR', 403)
    }
    return errorResponse('Failed to update region', 'SERVER_ERROR', 500)
  }
}