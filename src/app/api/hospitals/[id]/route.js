// src/app/api/hospitals/[id]/route.js

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

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
    const cached   = await cache.get(cacheKey)
    if (cached) {
      const parsed = typeof cached === 'string' ? JSON.parse(cached) : cached
      return successResponse(parsed, 'From cache')
    }

    const hospital = await prisma.hospital.findUnique({ where: { id } })

    if (!hospital) {
      return errorResponse('Hospital not found', 'NOT_FOUND', 404)
    }

    await cache.set(cacheKey, JSON.stringify(hospital), 300)

    return successResponse(hospital)
  } catch (err) {
    console.error('[Hospital GET]', err.message)
    return errorResponse('Failed to fetch hospital', 'SERVER_ERROR', 500)
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params
    const user    = await verifyAuth(request)

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

    // ── Location update (for nearby search to work) ───────────────────────
    // Accepts: { lat: 16.3189, lng: 80.4318 }
    // OR:      { type: "Point", coordinates: [80.4318, 16.3189] }
    if (body.location !== undefined) {
      if (body.location.lat !== undefined && body.location.lng !== undefined) {
        // Convert from {lat, lng} to GeoJSON Point
        updateData.location = {
          type:        'Point',
          coordinates: [
            parseFloat(body.location.lng),  // longitude FIRST
            parseFloat(body.location.lat),  // latitude SECOND
          ],
        }
      } else if (
        body.location.type === 'Point' &&
        Array.isArray(body.location.coordinates) &&
        body.location.coordinates.length === 2
      ) {
        // Already in GeoJSON format
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
      updateData.departments = Array.isArray(body.departments)
        ? body.departments
        : []
    }

    if (body.services !== undefined) {
      updateData.services = Array.isArray(body.services)
        ? body.services
        : []
    }

    if (body.images !== undefined) {
      updateData.images = body.images
    }

    if (body.contactPhone !== undefined) {
      updateData.contactPhone = body.contactPhone
    }

    if (body.contactEmail !== undefined) {
      updateData.contactEmail = body.contactEmail
    }

    if (body.operatingHours !== undefined) {
      updateData.operatingHours = body.operatingHours
    }

    // Only super_admin can change platform fee
    if (body.platformFeePercent !== undefined && user.role === 'super_admin') {
      updateData.platformFeePercent = parseFloat(body.platformFeePercent)
    }

    // Only super_admin can change region
    if (body.regionId !== undefined && user.role === 'super_admin') {
      updateData.regionId = body.regionId
    }

    const updated = await prisma.hospital.update({
      where: { id },
      data:  updateData,
    })

    // Invalidate cache
    await cache.del(`hospital:${id}`)

    // Also invalidate nearby cache when location changes
    if (body.location !== undefined) {
      try {
        await cache.delPattern('nearby:hospitals:*')
      } catch {
        // Pattern delete may not be supported — ignore
      }
    }

    return successResponse(updated, 'Hospital updated')
  } catch (err) {
    console.error('[Hospital PUT]', err.message)

    if (
      err.message.includes('Access denied') ||
      err.message.includes('token') ||
      err.message.includes('FORBIDDEN')
    ) {
      return errorResponse(err.message, 'AUTH_ERROR', 403)
    }

    return errorResponse('Failed to update hospital', 'SERVER_ERROR', 500)
  }
}