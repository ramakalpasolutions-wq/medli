export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { prisma }        from '@/lib/prisma'
import { cache }         from '@/lib/cache'
import { verifyAuth }    from '@/lib/middleware/auth.middleware'
import { checkRole }     from '@/lib/middleware/rbac.middleware'
import { sanitizeInput } from '@/lib/utils/validators'
import {
  successResponse,
  errorResponse,
  handleOptions,
} from '@/lib/utils/apiResponse'

export function OPTIONS() { return handleOptions() }

export async function GET(request, { params }) {
  try {
    // ✅ await params
    const { id } = await params

    const cacheKey = `hospital:${id}`
    const cached   = await cache.get(cacheKey)
    if (cached) {
      const parsed = typeof cached === 'string' ? JSON.parse(cached) : cached
      return successResponse(parsed, 'From cache')
    }

    const hospital = await prisma.hospital.findUnique({ where: { id } })

    if (!hospital) {
      return errorResponse('Hospital not found', 404)
    }

    await cache.set(cacheKey, JSON.stringify(hospital), 300)

    return successResponse(hospital)

  } catch (error) {
    console.error('[GET /api/hospitals/[id]]', error)
    return errorResponse('Failed to fetch hospital', 500)
  }
}

export async function PUT(request, { params }) {
  return verifyAuth(request, async (req, user) => {
    try {
      // ✅ await params
      const { id } = await params

      const hospital = await prisma.hospital.findUnique({ where: { id } })
      if (!hospital) {
        return errorResponse('Hospital not found', 404)
      }

      // Access control
      if (user.role === 'hospital_admin') {
        // ✅ use user.userId not user.id
        if (hospital.adminUserId !== user.userId) {
          return errorResponse('Access denied', 403)
        }
      } else {
        checkRole(user, 'super_admin')
      }

      const body = await request.json()
      const updateData = {}

      if (body.name !== undefined) {
        updateData.name = sanitizeInput(body.name)
      }

      if (body.slug !== undefined && user.role === 'super_admin') {
        updateData.slug = sanitizeInput(body.slug)
      }

      if (body.address !== undefined) {
        updateData.address = {
          line1:   body.address.line1   || null,
          city:    body.address.city    || null,
          state:   body.address.state   || null,
          pinCode: body.address.pinCode || null,
        }
      }

      if (body.location !== undefined) {
        if (body.location.lat !== undefined && body.location.lng !== undefined) {
          updateData.location = {
            type:        'Point',
            coordinates: [
              parseFloat(body.location.lng),
              parseFloat(body.location.lat),
            ],
          }
        } else if (
          body.location.type === 'Point' &&
          Array.isArray(body.location.coordinates) &&
          body.location.coordinates.length === 2
        ) {
          updateData.location = {
            type:        'Point',
            coordinates: [
              parseFloat(body.location.coordinates[0]),
              parseFloat(body.location.coordinates[1]),
            ],
          }
        }
      }

      if (body.departments !== undefined) {
        updateData.departments = Array.isArray(body.departments) ? body.departments : []
      }

      if (body.services !== undefined) {
        updateData.services = Array.isArray(body.services) ? body.services : []
      }

      if (body.images        !== undefined) updateData.images        = body.images
      if (body.contactPhone  !== undefined) updateData.contactPhone  = body.contactPhone
      if (body.contactEmail  !== undefined) updateData.contactEmail  = body.contactEmail
      if (body.operatingHours !== undefined) updateData.operatingHours = body.operatingHours

      if (body.platformFeePercent !== undefined && user.role === 'super_admin') {
        updateData.platformFeePercent = parseFloat(body.platformFeePercent)
      }

      if (body.regionId !== undefined && user.role === 'super_admin') {
        updateData.regionId = body.regionId
      }

      const updated = await prisma.hospital.update({
        where: { id },
        data:  updateData,
      })

      await cache.del(`hospital:${id}`)

      if (body.location !== undefined) {
        cache.flush('nearby:hospitals:*').catch(() => null)
      }

      return successResponse(updated, 'Hospital updated')

    } catch (error) {
      if (error.message?.includes('Access denied')) {
        return errorResponse(error.message, 403)
      }
      console.error('[PUT /api/hospitals/[id]]', error)
      return errorResponse('Failed to update hospital', 500)
    }
  })
}

export async function DELETE(request, { params }) {
  return verifyAuth(request, async (req, user) => {
    try {
      checkRole(user, 'super_admin')

      const { id } = await params

      const hospital = await prisma.hospital.findUnique({ where: { id } })
      if (!hospital) {
        return errorResponse('Hospital not found', 404)
      }

      // Soft delete — just deactivate
      await prisma.hospital.update({
        where: { id },
        data:  { isActive: false, isApproved: false },
      })

      await cache.del(`hospital:${id}`)

      return successResponse({ id }, 'Hospital deactivated')

    } catch (error) {
      if (error.message?.includes('Access denied')) {
        return errorResponse(error.message, 403)
      }
      console.error('[DELETE /api/hospitals/[id]]', error)
      return errorResponse('Failed to delete hospital', 500)
    }
  })
}