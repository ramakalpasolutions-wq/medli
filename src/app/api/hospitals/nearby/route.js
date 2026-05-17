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

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const lat    = parseFloat(searchParams.get('lat'))
    const lng    = parseFloat(searchParams.get('lng'))
    const radius = parseInt(searchParams.get('radius') || '15000', 10)

    if (isNaN(lat) || isNaN(lng)) {
      return errorResponse('lat and lng are required', 'VALIDATION_ERROR', 400)
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return errorResponse('Invalid coordinates', 'VALIDATION_ERROR', 400)
    }

    const cacheKey = `nearby:hospitals:${lat.toFixed(4)}:${lng.toFixed(4)}:${radius}`

    try {
      const cached = await cache.get(cacheKey)
      if (cached) {
        const parsed = typeof cached === 'string' ? JSON.parse(cached) : cached
        return successResponse(parsed, 'From cache')
      }
    } catch {}

    let hospitals = []

    /* ── Try $geoNear first ── */
    try {
      const result = await prisma.$runCommandRaw({
        aggregate: 'hospitals',
        pipeline: [
          {
            $geoNear: {
              near:          { type: 'Point', coordinates: [lng, lat] },
              distanceField: 'distance',
              maxDistance:   radius,
              spherical:     true,
              query:         { isApproved: true, isActive: true },
            },
          },
          { $limit: 15 },
          {
            $project: {
              name: 1, slug: 1, address: 1, location: 1,
              images: 1, rating: 1, departments: 1,
              contactPhone: 1, distance: 1,
              isApproved: 1, isActive: 1,
            },
          },
        ],
        cursor: {},
      })

      const raw = result?.cursor?.firstBatch || []
      hospitals = raw.map(normalizeDoc)

      console.log(`[Hospitals Nearby] ✅ $geoNear returned ${hospitals.length}`)
    } catch (geoErr) {
      console.warn('[Hospitals Nearby] $geoNear failed, using fallback:', geoErr.message)
    }

    /* ✅ FALLBACK — if $geoNear failed OR returned empty, get any approved hospitals */
    if (hospitals.length === 0) {
      const fallback = await prisma.hospital.findMany({
        where:  { isApproved: true, isActive: true },
        take:   15,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, name: true, slug: true,
          address: true, location: true, images: true,
          rating: true, departments: true, contactPhone: true,
        },
      })
      hospitals = fallback
      console.log(`[Hospitals Nearby] ✅ Fallback returned ${hospitals.length}`)
    }

    try {
      await cache.set(cacheKey, JSON.stringify(hospitals), 300)
    } catch {}

    return successResponse(hospitals, 'Nearby hospitals')
  } catch (err) {
    console.error('[Hospitals Nearby] FATAL:', err.message)

    /* ✅ Even on total failure, try basic fetch */
    try {
      const emergency = await prisma.hospital.findMany({
        where:  { isApproved: true, isActive: true },
        take:   15,
        select: {
          id: true, name: true, slug: true,
          address: true, location: true, images: true,
          rating: true, departments: true, contactPhone: true,
        },
      })
      return successResponse(emergency, 'Nearby hospitals (emergency fallback)')
    } catch {
      return errorResponse('Failed to fetch nearby hospitals', 'SERVER_ERROR', 500)
    }
  }
}