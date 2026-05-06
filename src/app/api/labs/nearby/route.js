import prisma from '@/lib/prisma'
import { cache } from '@/lib/cache'
import { successResponse, errorResponse, handleOptions } from '@/lib/utils/apiResponse'

export function OPTIONS() {
  return handleOptions()
}

// Convert MongoDB raw _id { $oid: "..." } to plain string
function normalizeDoc(doc) {
  if (!doc) return doc
  const id =
    doc._id?.$oid ||
    (typeof doc._id === 'string' ? doc._id : null) ||
    doc.id ||
    null

  return {
    ...doc,
    _id: undefined,
    id,
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const lat    = parseFloat(searchParams.get('lat'))
    const lng    = parseFloat(searchParams.get('lng'))
    const radius = parseInt(searchParams.get('radius') || '10000', 10)

    if (isNaN(lat) || isNaN(lng)) {
      return errorResponse('lat and lng are required', 'VALIDATION_ERROR', 400)
    }

    const cacheKey = `nearby:labs:${lat.toFixed(4)}:${lng.toFixed(4)}:${radius}`
    const cached   = await cache.get(cacheKey)
    if (cached) {
      return successResponse(cached, 'From cache')
    }

    const result = await prisma.$runCommandRaw({
      aggregate: 'labs',
      pipeline: [
        {
          $geoNear: {
            near:         { type: 'Point', coordinates: [lng, lat] },
            distanceField:'distance',
            maxDistance:  radius,
            spherical:    true,
            query:        { isApproved: true, isActive: true },
          },
        },
        { $limit: 20 },
        {
          $project: {
            name:          1,
            slug:          1,
            address:       1,
            location:      1,
            images:        1,
            rating:        1,
            certifications:1,
            homeCollection:1,
            contactPhone:  1,
            distance:      1,
          },
        },
      ],
      cursor: {},
    })

    const raw  = result?.cursor?.firstBatch || []
    const labs = raw.map(normalizeDoc)

    await cache.set(cacheKey, labs, 300)

    return successResponse(labs, 'Nearby labs')
  } catch (err) {
    console.error('[Labs Nearby]', err.message)
    return errorResponse('Failed to fetch nearby labs', 'SERVER_ERROR', 500)
  }
}