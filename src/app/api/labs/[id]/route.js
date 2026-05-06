// src/app/api/labs/[id]/route.js

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

    const cacheKey = `lab:${id}`
    const cached   = await cache.get(cacheKey)
    if (cached) {
      const parsed = typeof cached === 'string' ? JSON.parse(cached) : cached
      return successResponse(parsed, 'From cache')
    }

    const lab = await prisma.lab.findUnique({ where: { id } })
    if (!lab) {
      return errorResponse('Lab not found', 'NOT_FOUND', 404)
    }

    await cache.set(cacheKey, JSON.stringify(lab), 300)

    return successResponse(lab)
  } catch (err) {
    console.error('[Lab GET]', err.message)
    return errorResponse('Failed to fetch lab', 'SERVER_ERROR', 500)
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params
    const user    = await verifyAuth(request)

    const lab = await prisma.lab.findUnique({ where: { id } })
    if (!lab) {
      return errorResponse('Lab not found', 'NOT_FOUND', 404)
    }

    // lab_admin: must own this lab
    // super_admin: can edit any lab
    if (user.role === 'lab_admin') {
      if (lab.adminUserId !== user.id) {
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

    if (body.images !== undefined) {
      updateData.images = body.images
    }

    if (body.certifications !== undefined) {
      updateData.certifications = Array.isArray(body.certifications)
        ? body.certifications
        : []
    }

    if (body.homeCollection !== undefined) {
      updateData.homeCollection = body.homeCollection
    }

    if (body.walkInSlots !== undefined) {
      updateData.walkInSlots = Array.isArray(body.walkInSlots)
        ? body.walkInSlots
        : []
    }

    if (body.contactPhone !== undefined) {
      updateData.contactPhone = body.contactPhone
    }

    if (body.contactEmail !== undefined) {
      updateData.contactEmail = body.contactEmail
    }

    // Only super_admin can change platform fee
    if (body.platformFeePercent !== undefined && user.role === 'super_admin') {
      updateData.platformFeePercent = parseFloat(body.platformFeePercent)
    }

    // Only super_admin can change region
    if (body.regionId !== undefined && user.role === 'super_admin') {
      updateData.regionId = body.regionId
    }

    const updated = await prisma.lab.update({
      where: { id },
      data:  updateData,
    })

    // Invalidate cache
    await cache.del(`lab:${id}`)

    // Also invalidate nearby cache when location changes
    if (body.location !== undefined) {
      try {
        await cache.delPattern('nearby:labs:*')
      } catch {
        // Pattern delete may not be supported — ignore
      }
    }

    return successResponse(updated, 'Lab updated')
  } catch (err) {
    console.error('[Lab PUT]', err.message)

    if (
      err.message.includes('Access denied') ||
      err.message.includes('token') ||
      err.message.includes('FORBIDDEN')
    ) {
      return errorResponse(err.message, 'AUTH_ERROR', 403)
    }

    return errorResponse('Failed to update lab', 'SERVER_ERROR', 500)
  }
}