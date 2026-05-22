export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { prisma } from '@/lib/prisma'
import { cache } from '@/lib/cache'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'

export function OPTIONS() {
  return handleOptions()
}

function normalizeDoc(doc) {
  if (!doc) return doc
  const id =
    doc._id?.$oid ||
    (typeof doc._id === 'string' ? doc._id : null) ||
    doc.id ||
    null
  return { ...doc, _id: undefined, id }
}

/**
 * Haversine distance in kilometres between two lat/lng points.
 */
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const lat    = parseFloat(searchParams.get('lat'))
    const lng    = parseFloat(searchParams.get('lng'))
    const radius = parseInt(searchParams.get('radius') || '15000', 10) // metres, default 15 km

    if (isNaN(lat) || isNaN(lng)) {
      return errorResponse('lat and lng are required', 'VALIDATION_ERROR', 400)
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return errorResponse('Invalid coordinates', 'VALIDATION_ERROR', 400)
    }

    const cacheKey = `nearby:labs:${lat.toFixed(4)}:${lng.toFixed(4)}:${radius}`

    try {
      const cached = await cache.get(cacheKey)
      if (cached) {
        const parsed = typeof cached === 'string' ? JSON.parse(cached) : cached
        return successResponse(parsed, 'From cache')
      }
    } catch {}

    let labs = []
    let source = 'geoNear'

    /* ── Primary: MongoDB $geoNear (requires 2dsphere index) ── */
    try {
      const result = await prisma.$runCommandRaw({
        aggregate: 'labs',
        pipeline: [
          {
            $geoNear: {
              near:          { type: 'Point', coordinates: [lng, lat] },
              distanceField: 'distance',
              maxDistance:   radius,   // strictly enforced — only within radius metres
              spherical:     true,
              query:         { isApproved: true, isActive: true },
            },
          },
          { $limit: 15 },
          {
            $project: {
              name: 1, slug: 1, address: 1, location: 1,
              images: 1, rating: 1, certifications: 1,
              homeCollection: 1, contactPhone: 1,
              distance: 1, isApproved: 1, isActive: 1,
            },
          },
        ],
        cursor: {},
      })

      const raw = result?.cursor?.firstBatch || []
      labs = raw.map(normalizeDoc)
      console.log(`[Labs Nearby] ✅ $geoNear returned ${labs.length} within ${radius}m`)
    } catch (geoErr) {
      console.warn('[Labs Nearby] $geoNear failed, using Haversine fallback:', geoErr.message)
      source = 'haversine-fallback'

      /*
       * Haversine fallback — pull a broad candidate set then filter
       * strictly by distance in JavaScript. Never returns results
       * outside the requested radius.
       */
      try {
        const candidates = await prisma.lab.findMany({
          where:   { isApproved: true, isActive: true },
          take:    300,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true, name: true, slug: true,
            address: true, location: true, images: true,
            rating: true, certifications: true,
            homeCollection: true, contactPhone: true,
          },
        })

        const radiusKm = radius / 1000

        labs = candidates
          .filter((l) => {
            const coords = l.location?.coordinates
            if (!Array.isArray(coords) || coords.length < 2) return false
            const distKm = haversineKm(lat, lng, coords[1], coords[0])
            return distKm <= radiusKm
          })
          .map((l) => {
            const coords = l.location?.coordinates
            const distKm = haversineKm(lat, lng, coords[1], coords[0])
            return { ...l, distance: Math.round(distKm * 1000) }
          })
          .sort((a, b) => a.distance - b.distance)
          .slice(0, 15)

        console.log(`[Labs Nearby] ✅ Haversine fallback: ${labs.length} within ${radiusKm}km`)
      } catch (fbErr) {
        console.error('[Labs Nearby] Haversine fallback also failed:', fbErr.message)
      }
    }

    const payload = { labs, total: labs.length, source }

    try {
      await cache.set(cacheKey, JSON.stringify(payload), 300)
    } catch {}

    return successResponse(payload, 'Nearby labs')
  } catch (err) {
    console.error('[Labs Nearby] FATAL:', err.message)
    return errorResponse('Failed to fetch nearby labs', 'SERVER_ERROR', 500)
  }
}