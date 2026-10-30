
'use client'

import {
  useCallback,
  useEffect,
  useSyncExternalStore,
} from 'react'

const MANUAL_KEY = 'medli_manual_location'
const SESSION_KEY = 'medli_geo'

const EMPTY = Object.freeze({
  lat: null,
  lng: null,
  address: '',
  loading: true,
  error: null,
  isDefault: false,
  mode: 'initial',
  lastAction: 'initial',
  selectionId: 0,
})

const DEFAULT_LOCATION = {
  lat: 16.3067,
  lng: 80.4365,
  address: 'Guntur, Andhra Pradesh',
  isDefault: true,
  mode: 'default',
  lastAction: 'initial',
}

let snapshot = EMPTY
let initialized = false
let requestNumber = 0
let selectionNumber = 0

const listeners = new Set()

function publish(next) {
  snapshot = { ...snapshot, ...next }
  listeners.forEach((listener) => listener())
}

function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return snapshot
}

function getServerSnapshot() {
  return EMPTY
}

function usable(place) {
  return (
    place &&
    place.lat !== null &&
    place.lat !== undefined &&
    String(place.lat).trim() !== '' &&
    place.lng !== null &&
    place.lng !== undefined &&
    String(place.lng).trim() !== '' &&
    Number.isFinite(Number(place.lat)) &&
    Number.isFinite(Number(place.lng)) &&
    Number(place.lat) >= -90 &&
    Number(place.lat) <= 90 &&
    Number(place.lng) >= -180 &&
    Number(place.lng) <= 180
  )
}

function normalize(place) {
  return {
    lat: Number(place.lat),
    lng: Number(place.lng),
    address: String(
      place.address || 'Selected location'
    ).trim().slice(0, 250),
    isDefault: Boolean(place.isDefault),
    mode: place.mode || 'manual',
  }
}

function loadJson(storage, key) {
  try {
    return JSON.parse(storage.getItem(key) || 'null')
  } catch {
    return null
  }
}

function saveSession(place) {
  try {
    sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify(place)
    )
  } catch {}
}

async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `/api/location/search?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`
    )

    if (!res.ok) return 'Current location'

    const json = await res.json()

    return json.address || 'Current location'
  } catch {
    return 'Current location'
  }
}

function locate({ explicit = false } = {}) {
  if (typeof window === 'undefined') {
    return Promise.resolve(null)
  }

  const request = ++requestNumber

  if (!navigator.geolocation) {
    if (explicit) {
      publish({
        loading: false,
        error: 'Your browser does not support location detection.',
      })
      return Promise.resolve(null)
    }

    const fallback = { ...DEFAULT_LOCATION }
    saveSession(fallback)

    publish({
      ...fallback,
      loading: false,
      error: 'Location detection is unavailable.',
    })

    return Promise.resolve(fallback)
  }

  publish({ loading: true, error: null })

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const lat = coords.latitude
        const lng = coords.longitude

        const address = await reverseGeocode(lat, lng)

        // Prevent old GPS results replacing manual selections
        if (request !== requestNumber) {
          resolve(null)
          return
        }

        const place = {
          lat,
          lng,
          address,
          mode: 'auto',
          isDefault: false,
          lastAction: explicit ? 'user' : 'initial',
          selectionId: explicit
            ? ++selectionNumber
            : snapshot.selectionId,
        }

        try {
          localStorage.removeItem(MANUAL_KEY)
        } catch {}

        saveSession(place)

        publish({
          ...place,
          loading: false,
          error: null,
        })

        resolve(place)
      },

      (error) => {
        if (request !== requestNumber) {
          resolve(null)
          return
        }

        const message =
          error?.code === 1
            ? 'Location permission denied. Choose a city manually.'
            : error?.code === 2
              ? 'Device location unavailable. Choose a city manually.'
              : 'Location detection timed out. Choose a city manually.'

        // Preserve the previous manual selection if GPS fails
        if (explicit || usable(snapshot)) {
          publish({
            loading: false,
            error: message,
          })

          resolve(null)
        } else {
          const fallback = { ...DEFAULT_LOCATION }

          saveSession(fallback)

          publish({
            ...fallback,
            loading: false,
            error: message,
          })

          resolve(fallback)
        }
      },

      {
        timeout: 10000,
        maximumAge: 300000,
        enableHighAccuracy: false,
      }
    )
  })
}

function chooseManual(place) {
  if (!usable(place)) {
    throw new Error(
      'Select a valid location with coordinates.'
    )
  }

  // Cancel any pending automatic-location response
  ++requestNumber

  const selected = {
    ...normalize(place),
    mode: 'manual',
    isDefault: false,
    lastAction: 'user',
    selectionId: ++selectionNumber,
  }

  try {
    localStorage.setItem(
      MANUAL_KEY,
      JSON.stringify(selected)
    )
  } catch {}

  saveSession(selected)

  publish({
    ...selected,
    loading: false,
    error: null,
  })

  return selected
}

function initialize() {
  if (initialized || typeof window === 'undefined') {
    return
  }

  initialized = true

  const manual = loadJson(
    localStorage,
    MANUAL_KEY
  )

  if (usable(manual)) {
    publish({
      ...normalize(manual),
      mode: 'manual',
      loading: false,
      error: null,
      lastAction: 'user',
      selectionId: ++selectionNumber,
    })
  } else {
    const cached = loadJson(
      sessionStorage,
      SESSION_KEY
    )

    if (usable(cached)) {
      publish({
        ...normalize(cached),
        mode:
          cached.mode ||
          (cached.isDefault ? 'default' : 'auto'),
        loading: false,
        error: null,
        lastAction: 'initial',
      })
    } else {
      void locate()
    }
  }

  // Synchronize manual changes between browser tabs
  window.addEventListener('storage', (event) => {
    if (event.key !== MANUAL_KEY) return

    const saved = loadJson(
      localStorage,
      MANUAL_KEY
    )

    if (usable(saved)) {
      ++requestNumber

      publish({
        ...normalize(saved),
        mode: 'manual',
        isDefault: false,
        loading: false,
        error: null,
        lastAction: 'user',
        selectionId: ++selectionNumber,
      })
    } else if (snapshot.mode === 'manual') {
      void locate({ explicit: true })
    }
  })
}

export function useGeoLocation() {
  const state = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  )

  useEffect(() => {
    initialize()
  }, [])

  const setManualLocation = useCallback(
    (place) => chooseManual(place),
    []
  )

  const detectCurrentLocation = useCallback(
    () => locate({ explicit: true }),
    []
  )

  return {
    ...state,
    setManualLocation,
    detectCurrentLocation,
  }
}

export default useGeoLocation
