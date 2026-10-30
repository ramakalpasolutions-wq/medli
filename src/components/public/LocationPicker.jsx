
'use client'

import { useEffect, useState } from 'react'
import {
  MapPin,
  Navigation,
  Search,
  X,
  Loader2,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react'
import { useGeoLocation } from '@/hooks/useGeoLocation'

// Approximate city-centre coordinates
const POPULAR_CITIES = [
  {
    address: 'Guntur, Andhra Pradesh',
    lat: 16.3067,
    lng: 80.4365,
  },
  {
    address: 'Vijayawada, Andhra Pradesh',
    lat: 16.5062,
    lng: 80.6480,
  },
  {
    address: 'Visakhapatnam, Andhra Pradesh',
    lat: 17.6868,
    lng: 83.2185,
  },
  {
    address: 'Hyderabad, Telangana',
    lat: 17.3850,
    lng: 78.4867,
  },
  {
    address: 'Tenali, Andhra Pradesh',
    lat: 16.2395,
    lng: 80.6498,
  },
  {
    address: 'Tirupati, Andhra Pradesh',
    lat: 13.6288,
    lng: 79.4192,
  },
  {
    address: 'Nellore, Andhra Pradesh',
    lat: 14.4426,
    lng: 79.9865,
  },
  {
    address: 'Ongole, Andhra Pradesh',
    lat: 15.5057,
    lng: 80.0499,
  },
  {
    address: 'Rajahmundry, Andhra Pradesh',
    lat: 17.0005,
    lng: 81.8040,
  },
  {
    address: 'Chennai, Tamil Nadu',
    lat: 13.0827,
    lng: 80.2707,
  },
  {
    address: 'Bengaluru, Karnataka',
    lat: 12.9716,
    lng: 77.5946,
  },
  {
    address: 'Mumbai, Maharashtra',
    lat: 19.0760,
    lng: 72.8777,
  },
]

const itemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  width: '100%',
  border: '1px solid #e2e8f0',
  background: '#fff',
  borderRadius: 12,
  padding: '11px 12px',
  cursor: 'pointer',
  color: '#334155',
  textAlign: 'left',
}

export default function LocationPicker({
  open,
  onClose,
}) {
  const geo = useGeoLocation()

  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return

    const onEscape = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', onEscape)

    const previousOverflow =
      document.body.style.overflow

    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener(
        'keydown',
        onEscape
      )
      document.body.style.overflow =
        previousOverflow
    }
  }, [open, onClose])

  if (!open) return null

  const pick = (place) => {
    try {
      geo.setManualLocation(place)

      setQuery('')
      setResults([])
      setError('')

      onClose()
    } catch (err) {
      setError(err.message)
    }
  }

  const detect = async () => {
    setError('')

    const result =
      await geo.detectCurrentLocation()

    if (result) {
      setQuery('')
      setResults([])
      onClose()
    } else {
      setError(
        'GPS unavailable. Select a city manually.'
      )
    }
  }

  const search = async (event) => {
    event.preventDefault()

    const value = query.trim()

    if (value.length < 3) {
      setError(
        'Enter at least 3 characters to search.'
      )
      return
    }

    setSearching(true)
    setError('')
    setResults([])

    try {
      const res = await fetch(
        `/api/location/search?q=${encodeURIComponent(value)}`
      )

      const json = await res.json()

      if (!res.ok || !json.success) {
        throw new Error(
          json.message || 'Unable to find locations'
        )
      }

      setResults(json.locations || [])

      if (!json.locations?.length) {
        setError(
          'No matching location found. Try a nearby city.'
        )
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setSearching(false)
    }
  }

  const matchingPopular = POPULAR_CITIES.filter(
    (item) =>
      item.address
        .toLowerCase()
        .includes(query.trim().toLowerCase())
  )

  return (
    <div
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1500,
        background: 'rgba(15,23,42,.55)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Choose your location"
        style={{
          width: '100%',
          maxWidth: 480,
          maxHeight: '88vh',
          overflowY: 'auto',
          background: '#fff',
          borderRadius: 22,
          boxShadow:
            '0 24px 80px rgba(0,0,0,.2)',
          padding: 'clamp(18px,4vw,28px)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: 18,
          }}
        >
          <div>
            <h2
              style={{
                margin: '0 0 4px',
                fontSize: 21,
                fontWeight: 800,
                color: '#0f172a',
              }}
            >
              Choose your location
            </h2>

            <p
              style={{
                margin: 0,
                fontSize: 12,
                color: '#64748b',
              }}
            >
              Find hospitals, doctors and labs near you
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close location picker"
            style={{
              border: 'none',
              borderRadius: 9,
              background: '#f1f5f9',
              padding: 7,
              cursor: 'pointer',
              alignSelf: 'flex-start',
            }}
          >
            <X size={18} color="#64748b" />
          </button>
        </div>

        {/* Selected location */}
        <div
          style={{
            borderRadius: 12,
            background: '#eef2ff',
            padding: 12,
            marginBottom: 16,
            display: 'flex',
            gap: 10,
            alignItems: 'center',
            color: '#4f46e5',
          }}
        >
          <MapPin size={18} />

          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
              }}
            >
              CURRENT SELECTION
            </div>

            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                overflowWrap: 'anywhere',
              }}
            >
              {geo.address || 'Locating…'}
            </div>
          </div>
        </div>

        {/* Automatic GPS */}
        <button
          type="button"
          onClick={detect}
          disabled={geo.loading}
          style={{
            width: '100%',
            display: 'flex',
            gap: 10,
            alignItems: 'center',
            background: '#f8fafc',
            border: '1px solid #c7d2fe',
            borderRadius: 12,
            padding: 14,
            cursor: geo.loading
              ? 'wait'
              : 'pointer',
            textAlign: 'left',
            color: '#4f46e5',
            marginBottom: 20,
          }}
        >
          {geo.loading ? (
            <Loader2 size={20} />
          ) : (
            <Navigation size={20} />
          )}

          <span style={{ flex: 1 }}>
            <strong
              style={{
                display: 'block',
                fontSize: 13,
              }}
            >
              Use my current location
            </strong>

            <span
              style={{
                color: '#64748b',
                fontSize: 11,
              }}
            >
              Detect automatically using GPS
            </span>
          </span>

          <ArrowRight size={16} />
        </button>

        {/* Manual search */}
        <form
          onSubmit={search}
          style={{ marginBottom: 16 }}
        >
          <label
            htmlFor="medli-location-search"
            style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 700,
              color: '#334155',
              marginBottom: 8,
            }}
          >
            Or choose manually
          </label>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              border: '1px solid #cbd5e1',
              borderRadius: 12,
              padding: '7px 8px 7px 12px',
            }}
          >
            <Search
              size={18}
              color="#94a3b8"
            />

            <input
              id="medli-location-search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setResults([])
                setError('')
              }}
              placeholder="City, area or PIN code"
              style={{
                flex: 1,
                minWidth: 0,
                fontSize: 14,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#0f172a',
              }}
            />

            <button
              type="submit"
              disabled={searching}
              style={{
                background: '#6366f1',
                color: '#fff',
                border: 'none',
                borderRadius: 9,
                padding: '9px 13px',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              {searching
                ? 'Searching…'
                : 'Search'}
            </button>
          </div>
        </form>

        {/* Errors */}
        {error && (
          <p
            role="alert"
            style={{
              fontSize: 12,
              color: '#b91c1c',
              background: '#fef2f2',
              padding: 10,
              borderRadius: 10,
            }}
          >
            {error}
          </p>
        )}

        {geo.error && !error && (
          <p
            role="status"
            style={{
              fontSize: 12,
              color: '#b45309',
            }}
          >
            {geo.error}
          </p>
        )}

        {/* Search results */}
        {results.length > 0 && (
          <section style={{ marginBottom: 15 }}>
            <h3
              style={{
                fontSize: 12,
                color: '#64748b',
                margin: '0 0 8px',
              }}
            >
              SEARCH RESULTS
            </h3>

            <div
              style={{
                display: 'grid',
                gap: 7,
              }}
            >
              {results.map((item, index) => (
                <button
                  key={`${item.lat}:${item.lng}:${index}`}
                  type="button"
                  onClick={() => pick(item)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    width: '100%',
                    border:
                      '1px solid #e2e8f0',
                    background: '#fff',
                    borderRadius: 12,
                    padding: '11px 12px',
                    cursor: 'pointer',
                    color: '#334155',
                    textAlign: 'left',
                  }}
                >
                  <MapPin
                    size={17}
                    color="#6366f1"
                  />

                  <span
                    style={{
                      flex: 1,
                      fontSize: 12,
                      lineHeight: 1.5,
                    }}
                  >
                    {item.address}
                  </span>

                  <ArrowRight
                    size={15}
                    color="#94a3b8"
                  />
                </button>
              ))}
            </div>

            <p
              style={{
                fontSize: 10,
                color: '#94a3b8',
                textAlign: 'right',
              }}
            >
              Location data © OpenStreetMap contributors
            </p>
          </section>
        )}

        {/* Popular cities */}
        <h3
          style={{
            fontSize: 12,
            color: '#64748b',
            margin: '0 0 8px',
          }}
        >
          POPULAR CITIES
        </h3>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(2,minmax(0,1fr))',
            gap: 7,
          }}
        >
          {matchingPopular.map((city) => (
            <button
              key={city.address}
              type="button"
              onClick={() => pick(city)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                width: '100%',
                background: '#fff',
                border:
                  geo.mode === 'manual' &&
                  geo.address === city.address
                    ? '1px solid #a5b4fc'
                    : '1px solid #e2e8f0',
                borderRadius: 12,
                padding: '10px 9px',
                cursor: 'pointer',
                color: '#334155',
                fontSize: 12,
              }}
            >
              <MapPin
                size={15}
                color="#6366f1"
              />

              <span
                style={{
                  flex: 1,
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  textAlign: 'left',
                }}
              >
                {city.address.split(',')[0]}
              </span>

              {geo.address === city.address && (
                <CheckCircle2
                  size={16}
                  color="#059669"
                />
              )}
            </button>
          ))}
        </div>

        {matchingPopular.length === 0 &&
          results.length === 0 && (
            <p
              style={{
                fontSize: 12,
                color: '#94a3b8',
              }}
            >
              Use Search to find this area or PIN code.
            </p>
          )}
      </div>
    </div>
  )
}
