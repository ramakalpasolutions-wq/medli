'use client'

import { useState, useEffect } from 'react'

export function useGeoLocation() {
  const [state, setState] = useState({
    lat:     null,
    lng:     null,
    address: '',
    loading: false,
    error:   null,
  })

  useEffect(() => {
    // Try sessionStorage first
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

    if (!navigator.geolocation) {
      setState((s) => ({ ...s, error: 'Geolocation not supported' }))
      return
    }

    setState((s) => ({ ...s, loading: true }))

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lng } = position.coords
        let address = ''

        try {
          const res = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}`
          )
          const json = await res.json()
          address = json.results?.[0]?.formatted_address || ''
        } catch {}

        const geo = { lat, lng, address }

        try {
          sessionStorage.setItem('medli_geo', JSON.stringify(geo))
        } catch {}

        setState({ lat, lng, address, loading: false, error: null })
      },
      (err) => {
        setState((s) => ({
          ...s,
          loading: false,
          error: err.message || 'Could not get location',
        }))
      },
      { timeout: 10000, maximumAge: 300000 }
    )
  }, [])

  return state
}

export default useGeoLocation