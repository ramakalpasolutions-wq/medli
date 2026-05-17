'use client'

import { useState, useEffect } from 'react'

/* ✅ Default fallback — Guntur, AP (change to your default city) */
const DEFAULT_LOCATION = {
  lat:     16.3067,
  lng:     80.4365,
  address: 'Guntur, Andhra Pradesh',
  isDefault: true,
}

export function useGeoLocation() {
  const [state, setState] = useState({
    lat:       null,
    lng:       null,
    address:   '',
    loading:   true,
    error:     null,
    isDefault: false,
  })

  useEffect(() => {
    /* ── 1. Try sessionStorage cache first ── */
    try {
      const cached = sessionStorage.getItem('medli_geo')
      if (cached) {
        const parsed = JSON.parse(cached)
        if (parsed.lat && parsed.lng) {
          setState({ ...parsed, loading: false, error: null })
          return
        }
      }
    } catch {}

    /* ── 2. Geolocation not supported → use fallback ── */
    if (!navigator.geolocation) {
      console.warn('[Geo] Geolocation not supported — using default city')
      setState({ ...DEFAULT_LOCATION, loading: false, error: 'Geolocation not supported' })
      return
    }

    setState((s) => ({ ...s, loading: true }))

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lng } = position.coords
        let address = ''

        /* ── 3. Try reverse geocoding (optional — silent fail) ── */
        try {
          const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY
          if (key) {
            const res = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${key}`
            )
            const json = await res.json()
            address = json.results?.[0]?.formatted_address || ''
          }
        } catch {}

        const geo = { lat, lng, address, isDefault: false }

        try {
          sessionStorage.setItem('medli_geo', JSON.stringify(geo))
        } catch {}

        setState({ ...geo, loading: false, error: null })
      },
      (err) => {
        console.warn('[Geo] Permission denied or failed — using default city:', err.message)

        /* ✅ 4. On error/denial → use default location instead of failing */
        const geo = { ...DEFAULT_LOCATION }
        try {
          sessionStorage.setItem('medli_geo', JSON.stringify(geo))
        } catch {}

        setState({
          ...geo,
          loading: false,
          error: err.message || 'Location access denied',
        })
      },
      { timeout: 10000, maximumAge: 300000 }
    )
  }, [])

  return state
}

export default useGeoLocation