
'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import useSWR from 'swr'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  Building2,
  ChevronDown,
  LayoutGrid,
  List,
  Map,
  MapPin,
  Navigation,
  Search,
  X,
} from 'lucide-react'
import Navbar from '@/components/public/Navbar'
import Footer from '@/components/public/Footer'
import HospitalCard from '@/components/public/HospitalCard'
import EmptyState from '@/components/ui/EmptyState'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { useGeoLocation } from '@/hooks/useGeoLocation'
import LocationPicker from '@/components/public/LocationPicker'

const LeafletMap = dynamic(
  () => import('@/components/maps/LeafletMap'),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          height: 360,
          background: '#eef2ff',
          borderRadius: 20,
          padding: 24,
        }}
      >
        Loading map…
      </div>
    ),
  }
)

async function fetcher(url) {
  const response = await fetch(url)
  const json = await response.json()

  if (!response.ok || json.success === false) {
    throw new Error(
      json.error ||
      json.message ||
      'Failed to load hospitals'
    )
  }

  const result = json.data ?? json

  const hospitals = Array.isArray(result)
    ? result
    : (result.hospitals ?? [])

  return {
    hospitals,
    total:
      result.total ??
      result.pagination?.total ??
      hospitals.length,
  }
}

const VIEWS = [
  { id: 'list', label: 'List', Icon: List },
  { id: 'split', label: 'Split', Icon: LayoutGrid },
  { id: 'map', label: 'Map', Icon: Map },
]

const control = {
  border: '1px solid #e2e8f0',
  background: '#fff',
  color: '#334155',
  borderRadius: 12,
  padding: '10px 12px',
  fontSize: 13,
  outlineColor: '#6366f1',
}

function HospitalItems({
  hospitals,
  loading,
  error,
  nearby,
  selected,
  onSelect,
  onOpen,
  compact = false,
}) {
  if (loading) {
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: compact
            ? '1fr'
            : 'repeat(auto-fill,minmax(280px,1fr))',
          gap: 14,
        }}
      >
        {[1, 2, 3, 4].map((n) => (
          <SkeletonCard key={n} />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div
        role="alert"
        style={{ padding: 20, color: '#b91c1c' }}
      >
        Could not load hospitals: {error.message}
      </div>
    )
  }

  if (!hospitals.length) {
    return (
      <EmptyState
        title={
          nearby
            ? 'No hospitals within 15 km'
            : 'No hospitals found'
        }
        message={
          nearby
            ? 'Choose another location or switch to all hospitals.'
            : 'Try changing your search filters.'
        }
      />
    )
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: compact
          ? '1fr'
          : 'repeat(auto-fill,minmax(280px,1fr))',
        gap: 14,
        maxHeight: compact
          ? 'calc(100vh - 240px)'
          : undefined,
        overflowY: compact ? 'auto' : undefined,
        padding: 3,
      }}
    >
      {hospitals.map((hospital) => (
        <div
          key={hospital.id}
          style={{
            borderRadius: 20,
            outline:
              selected?.id === hospital.id
                ? '2px solid #6366f1'
                : '2px solid transparent',
            outlineOffset: 1,
          }}
          onClick={() => onSelect(hospital)}
        >
          <HospitalCard
            hospital={hospital}
            onClick={() => onOpen(hospital.id)}
          />
        </div>
      ))}
    </div>
  )
}

export default function HospitalsPage() {
  const router = useRouter()
  const geo = useGeoLocation()

  const [search, setSearch] = useState('')
  const [city, setCity] = useState('')
  const [view, setView] = useState('list')
  const [selected, setSelected] = useState(null)
  const [nearbyMode, setNearbyMode] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)

  const lat = Number(geo.lat)
  const lng = Number(geo.lng)

  const hasCoords =
    geo.lat !== null &&
    geo.lng !== null &&
    Number.isFinite(lat) &&
    Number.isFinite(lng)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(
        'medli_hospitals_view'
      )

      if (VIEWS.some((v) => v.id === saved)) {
        setView(saved)
      }
    } catch {}
  }, [])

  const changeView = (next) => {
    setView(next)

    try {
      localStorage.setItem(
        'medli_hospitals_view',
        next
      )
    } catch {}
  }

  // Manual or explicit GPS selection activates nearby mode.
  useEffect(() => {
    if (
      geo.lastAction !== 'user' ||
      !geo.selectionId ||
      !hasCoords
    ) {
      return
    }

    setNearbyMode(true)
    setSearch('')
    setCity('')
    setSelected(null)
  }, [
    geo.selectionId,
    geo.lastAction,
    geo.lat,
    geo.lng,
    hasCoords,
  ])

  const toggleNearby = useCallback(() => {
    if (nearbyMode) {
      setNearbyMode(false)
      return
    }

    if (hasCoords) {
      setNearbyMode(true)
      setSearch('')
      setCity('')
      return
    }

    void geo.detectCurrentLocation()
  }, [
    nearbyMode,
    hasCoords,
    geo.detectCurrentLocation,
  ])

  const params = new URLSearchParams({
    limit: '50',
  })

  if (search.trim()) {
    params.set('search', search.trim())
  }

  if (city.trim()) {
    params.set('city', city.trim())
  }

  const listUrl = !nearbyMode
    ? `/api/hospitals?${params}`
    : null

  const nearUrl =
    nearbyMode && hasCoords
      ? `/api/hospitals/nearby?lat=${lat.toFixed(6)}&lng=${lng.toFixed(6)}&radius=15000`
      : null

  const list = useSWR(listUrl, fetcher, {
    revalidateOnFocus: false,
  })

  const near = useSWR(nearUrl, fetcher, {
    revalidateOnFocus: false,
  })

  const active = nearbyMode ? near : list

  const hospitals = active.data?.hospitals ?? []
  const total =
    active.data?.total ?? hospitals.length

  const loading = nearbyMode
    ? (!hasCoords && geo.loading) || near.isLoading
    : list.isLoading

  const error = active.error

  const markers = useMemo(
    () =>
      hospitals
        .filter(
          (hospital) =>
            Array.isArray(
              hospital.location?.coordinates
            ) &&
            hospital.location.coordinates.length === 2
        )
        .map((hospital) => ({
          id: hospital.id,
          name: hospital.name,
          lat: Number(
            hospital.location.coordinates[1]
          ),
          lng: Number(
            hospital.location.coordinates[0]
          ),
          address: [
            hospital.address?.city,
            hospital.address?.state,
          ]
            .filter(Boolean)
            .join(', '),
          href: `/hospitals/${hospital.id}`,
          color: '#6366f1',
          extra:
            Number.isFinite(
              Number(hospital.distance)
            ) &&
            hospital.distance !== null
              ? `<p style="font-size:11px;color:#6366f1">${(
                  Number(hospital.distance) / 1000
                ).toFixed(1)} km away</p>`
              : '',
        })),
    [hospitals]
  )

  const selectMarker = (item) => {
    const match = hospitals.find(
      (hospital) => hospital.id === item.id
    )

    setSelected((previous) =>
      previous?.id === item.id
        ? null
        : (match ?? null)
    )
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f8fafc',
      }}
    >
      <Navbar />

      <LocationPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
      />

      <main
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding:
            'clamp(80px,10vw,96px) clamp(16px,3vw,32px) 64px',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
            marginBottom: 20,
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 'clamp(20px,3vw,28px)',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                margin: 0,
                fontWeight: 800,
                color: '#0f172a',
              }}
            >
              <Building2
                size={24}
                color="#2563eb"
              />
              Hospitals
            </h1>

            <p
              style={{
                fontSize: 13,
                color: '#94a3b8',
                margin: '5px 0 0',
              }}
            >
              {loading
                ? 'Finding hospitals…'
                : `${total} hospital${
                    total === 1 ? '' : 's'
                  } ${
                    nearbyMode
                      ? 'within 15 km'
                      : 'found'
                  }`}
            </p>
          </div>

          {/* View toggle */}
          <div
            style={{
              display: 'flex',
              padding: 3,
              background: '#f1f5f9',
              borderRadius: 12,
              gap: 3,
            }}
          >
            {VIEWS.map(
              ({ id, label, Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => changeView(id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    border: 'none',
                    borderRadius: 9,
                    cursor: 'pointer',
                    padding: '8px 11px',
                    color:
                      view === id
                        ? '#0f172a'
                        : '#64748b',
                    background:
                      view === id
                        ? '#fff'
                        : 'transparent',
                    fontSize: 12,
                    fontWeight:
                      view === id ? 700 : 500,
                  }}
                >
                  <Icon size={14} />
                  {label}
                </button>
              )
            )}
          </div>
        </div>

        {/* Filters */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 10,
            marginBottom: 18,
          }}
        >
          {!nearbyMode && (
            <>
              <div
                style={{
                  position: 'relative',
                  flex: 1,
                  minWidth: 180,
                  maxWidth: 320,
                }}
              >
                <Search
                  size={15}
                  color="#94a3b8"
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: 13,
                  }}
                />

                <input
                  aria-label="Search hospitals"
                  placeholder="Search hospitals…"
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  style={{
                    ...control,
                    width: '100%',
                    paddingLeft: 35,
                  }}
                />
              </div>

              <input
                aria-label="Filter hospitals by city"
                placeholder="Filter by city…"
                value={city}
                onChange={(e) =>
                  setCity(e.target.value)
                }
                style={{
                  ...control,
                  width: 180,
                }}
              />
            </>
          )}

          {/* Manual location selection */}
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            style={{
              ...control,
              display: 'flex',
              gap: 7,
              alignItems: 'center',
              background: '#eef2ff',
              borderColor: '#c7d2fe',
              color: '#4f46e5',
              cursor: 'pointer',
              fontWeight: 700,
              maxWidth: '100%',
            }}
          >
            <MapPin size={15} />

            <span
              style={{
                maxWidth: 160,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {geo.address?.split(',')[0] ||
                'Choose location'}
            </span>

            <ChevronDown size={14} />
          </button>

          {/* Nearby toggle */}
          <button
            type="button"
            onClick={toggleNearby}
            disabled={
              geo.loading && !hasCoords
            }
            style={{
              ...control,
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              fontWeight: 700,
              cursor: 'pointer',
              borderColor: '#c7d2fe',
              color: nearbyMode
                ? '#fff'
                : '#6366f1',
              background: nearbyMode
                ? 'linear-gradient(135deg,#6366f1,#8b5cf6)'
                : '#eef2ff',
            }}
          >
            <Navigation size={15} />

            {nearbyMode
              ? 'Within 15 km'
              : 'Near Selected Location'}

            {nearbyMode && <X size={13} />}
          </button>

          {!nearbyMode &&
            (search || city) && (
              <button
                type="button"
                onClick={() => {
                  setSearch('')
                  setCity('')
                }}
                style={{
                  ...control,
                  color: '#ef4444',
                  cursor: 'pointer',
                }}
              >
                Clear
              </button>
            )}
        </div>

        {/* Location status */}
        {nearbyMode && (
          <div
            style={{
              padding: '11px 15px',
              marginBottom: 15,
              borderRadius: 12,
              background: '#eef2ff',
              color: '#4f46e5',
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              fontSize: 13,
            }}
          >
            <Navigation size={15} />
            Showing hospitals within 15 km of{' '}
            {geo.address ||
              'your selected location'}.
          </div>
        )}

        {geo.error && nearbyMode && (
          <div
            role="status"
            style={{
              color: '#b45309',
              padding: '12px 0',
              fontSize: 13,
            }}
          >
            <AlertTriangle
              size={15}
              style={{ display: 'inline' }}
            />{' '}
            {geo.error}
          </div>
        )}

        {nearbyMode &&
          !hasCoords &&
          !geo.loading && (
            <p style={{ color: '#b91c1c' }}>
              Select a location to search nearby
              hospitals.
            </p>
          )}

        {/* List view */}
        {view === 'list' && (
          <HospitalItems
            hospitals={hospitals}
            loading={loading}
            error={error}
            nearby={nearbyMode}
            selected={selected}
            onSelect={setSelected}
            onOpen={(id) =>
              router.push(`/hospitals/${id}`)
            }
          />
        )}

        {/* Map view */}
        {view === 'map' && (
          <div
            style={{
              borderRadius: 20,
              overflow: 'hidden',
              minHeight: 400,
              height: 'calc(100vh - 220px)',
            }}
          >
            {error ? (
              <p role="alert">
                {error.message}
              </p>
            ) : (
              <LeafletMap
                markers={markers}
                selected={selected}
                onSelect={selectMarker}
                height="100%"
                accentColor="#6366f1"
              />
            )}
          </div>
        )}

        {/* Split view */}
        {view === 'split' && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit,minmax(300px,1fr))',
              gap: 16,
            }}
          >
            <HospitalItems
              hospitals={hospitals}
              loading={loading}
              error={error}
              nearby={nearbyMode}
              selected={selected}
              onSelect={setSelected}
              onOpen={(id) =>
                router.push(`/hospitals/${id}`)
              }
              compact
            />

            <div
              style={{
                borderRadius: 20,
                overflow: 'hidden',
                height: 460,
              }}
            >
              <LeafletMap
                markers={markers}
                selected={selected}
                onSelect={selectMarker}
                height="100%"
                accentColor="#6366f1"
              />
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
