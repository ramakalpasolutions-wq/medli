
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const SEARCH_URL =
  'https://nominatim.openstreetmap.org/search'

const REVERSE_URL =
  'https://nominatim.openstreetmap.org/reverse'

const cache = new Map()
let lastRequestAt = 0

function respond(body, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
    },
  })
}

export async function GET(request) {
  const url = new URL(request.url)

  const query = (
    url.searchParams.get('q') || ''
  ).trim()

  const latParam = url.searchParams.get('lat')
  const lngParam = url.searchParams.get('lng')

  const reverse =
    latParam !== null &&
    lngParam !== null

  if (reverse) {
    const lat = Number(latParam)
    const lng = Number(lngParam)

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      Math.abs(lat) > 90 ||
      Math.abs(lng) > 180
    ) {
      return respond(
        {
          success: false,
          message: 'Invalid coordinates',
        },
        400
      )
    }
  } else if (
    query.length < 3 ||
    query.length > 100 ||
    /[<>\x00-\x1f]/.test(query)
  ) {
    return respond(
      {
        success: false,
        message:
          'Enter a city, area or PIN code (3–100 characters).',
      },
      400
    )
  }

  const key = reverse
    ? `r:${Number(latParam).toFixed(3)}:${Number(lngParam).toFixed(3)}`
    : `q:${query.toLowerCase()}`

  const previous = cache.get(key)

  // 24-hour geocode cache
  if (
    previous &&
    Date.now() - previous.time <
      24 * 60 * 60 * 1000
  ) {
    return respond(previous.data)
  }

  // Basic per-process public-service rate limit
  if (Date.now() - lastRequestAt < 1100) {
    return respond(
      {
        success: false,
        message: 'Please try again in a moment.',
      },
      429
    )
  }

  lastRequestAt = Date.now()

  const upstream = new URL(
    reverse ? REVERSE_URL : SEARCH_URL
  )

  upstream.searchParams.set('format', 'jsonv2')
  upstream.searchParams.set('accept-language', 'en')

  if (reverse) {
    upstream.searchParams.set('lat', latParam)
    upstream.searchParams.set('lon', lngParam)
    upstream.searchParams.set('zoom', '12')
  } else {
    upstream.searchParams.set(
      'q',
      `${query}, India`
    )
    upstream.searchParams.set(
      'countrycodes',
      'in'
    )
    upstream.searchParams.set('limit', '6')
  }

  try {
    const response = await fetch(upstream, {
      headers: {
        'User-Agent':
          'MEDLI-Healthcare/1.0 (https://www.medli.in)',
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(8000),
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error(
        `Geocoding service returned ${response.status}`
      )
    }

    const data = await response.json()

    const result = reverse
      ? {
          success: true,
          address: String(
            data.display_name || 'Current location'
          ),
        }
      : {
          success: true,
          locations: (
            Array.isArray(data) ? data : []
          )
            .map((place) => ({
              lat: Number(place.lat),
              lng: Number(place.lon),
              address: String(
                place.display_name || ''
              ).slice(0, 250),
            }))
            .filter(
              (place) =>
                Number.isFinite(place.lat) &&
                Number.isFinite(place.lng)
            ),
        }

    if (cache.size > 300) {
      cache.clear()
    }

    cache.set(key, {
      time: Date.now(),
      data: result,
    })

    return respond(result)
  } catch (error) {
    console.error(
      '[location search]',
      error.message
    )

    return respond(
      {
        success: false,
        message:
          'Location search is temporarily unavailable. Try a popular city.',
      },
      503
    )
  }
}
