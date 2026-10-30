
'use client'

import {
  useEffect,
  useMemo,
  useState,
  useCallback,
} from 'react'
import dynamic from 'next/dynamic'
import useSWR from 'swr'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  Check,
  ChevronDown,
  FlaskConical,
  Home,
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
import LabCard from '@/components/public/LabCard'
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
          background: '#ecfdf5',
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
      'Failed to load labs'
    )
  }

  const data = json.data ?? json

  const labs = Array.isArray(data)
    ? data
    : (data.labs ?? [])

  return {
    labs,
    total:
      data.total ??
      data.pagination?.total ??
      labs.length,
  }
}

const VIEWS = [
  { id: 'list', label: 'List', Icon: List },
  { id: 'split', label: 'Split', Icon: LayoutGrid },
  { id: 'map', label: 'Map', Icon: Map },
]

const control = {
  background: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: 12,
  color: '#334155',
  fontSize: 13,
  padding: '10px 12px',
  outlineColor: '#10b981',
}

function LabItems({
  labs,
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
        style={{
          padding: 20,
          color: '#b91c1c',
        }}
      >
        Could not load labs: {error.message}
      </div>
    )
  }

  if (!labs.length) {
    return (
      <EmptyState
        title={
          nearby
            ? 'No labs within 15 km'
            : 'No labs found'
        }
        message={
          nearby
            ? 'Choose another location or switch to all labs.'
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
        overflowY: compact
          ? 'auto'
          : undefined,
        padding: 3,
      }}
    >
      {labs.map((lab) => (
        <div
          key={lab.id}
          onClick={() => onSelect(lab)}
          style={{
            borderRadius: 20,
            outline:
              selected?.id === lab.id
                ? '2px solid #10b981'
                : '2px solid transparent',
            outlineOffset: 1,
          }}
        >
          <LabCard
            lab={lab}
            onClick={() => onOpen(lab.id)}
          />
        </div>
      ))}
    </div>
  )
}

export default function LabsPage() {
  const router = useRouter()
  const geo = useGeoLocation()

  const [search, setSearch] = useState('')
  const [city, setCity] = useState('')
  const [homeOnly, setHomeOnly] = useState(false)
  const [selected, setSelected] = useState(null)
  const [view, setView] = useState('list')
  const [nearbyMode, setNearbyMode] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)

  const lat = Number(geo.lat)
  const lng = Number(geo.lng)

  const hasCoords =
    geo.lat !== null &&
    geo.lng !== null &&
    Number.isFinite(lat) &&
    Number.isFinite(lng)

  // Restore saved view preference
  useEffect(() => {
    try {
      const saved = localStorage.getItem(
        'medli_labs_view'
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
        'medli_labs_view',
        next
      )
    } catch {}
  }

  // Apply manually selected or explicit GPS location
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

  // Search parameters
  const params = new URLSearchParams({
    limit: '50',
    isApproved: 'true',
  })

  if (search.trim()) {
    params.set('search', search.trim())
  }

  if (city.trim()) {
    params.set('city', city.trim())
  }

  const listUrl = !nearbyMode
    ? `/api/labs?${params}`
    : null

  const nearUrl =
    nearbyMode && hasCoords
      ? `/api/labs/nearby?lat=${lat.toFixed(6)}&lng=${lng.toFixed(6)}&radius=15000`
      : null

  // SWR automatically refetches when location changes
  const list = useSWR(listUrl, fetcher, {
    revalidateOnFocus: false,
  })

  const near = useSWR(nearUrl, fetcher, {
    revalidateOnFocus: false,
  })

  const active = nearbyMode ? near : list

  const allLabs = active.data?.labs ?? []

  const labs = homeOnly
    ? allLabs.filter(
        (lab) => lab.homeCollection?.enabled
      )
    : allLabs

  const total =
    nearbyMode || homeOnly
      ? labs.length
      : (active.data?.total ?? labs.length)

  const loading = nearbyMode
    ? (!hasCoords && geo.loading) || near.isLoading
    : list.isLoading

  const error = active.error

  const markers = useMemo(
    () =>
      labs
        .filter(
          (lab) =>
            Array.isArray(
              lab.location?.coordinates
            ) &&
            lab.location.coordinates.length === 2
        )
        .map((lab) => ({
          id: lab.id,
          name: lab.name,
          lat: Number(
            lab.location.coordinates[1]
          ),
          lng: Number(
            lab.location.coordinates[0]
          ),
          address: [
            lab.address?.city,
            lab.address?.state,
          ]
            .filter(Boolean)
            .join(', '),
          href: `/labs/${lab.id}`,
          color: '#10b981',
          extra:
            Number.isFinite(
              Number(lab.distance)
            ) &&
            lab.distance !== null
              ? `<p style="font-size:11px;color:#059669">${(
                  Number(lab.distance) / 1000
                ).toFixed(1)} km away</p>`
              : '',
        })),
    [labs]
  )

  const selectMarker = (item) => {
    const found = labs.find(
      (lab) => lab.id === item.id
    )

    setSelected((previous) =>
      previous?.id === item.id
        ? null
        : (found ?? null)
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
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
            marginBottom: 20,
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                color: '#0f172a',
                fontSize: 'clamp(20px,3vw,28px)',
                fontWeight: 800,
              }}
            >
              <FlaskConical
                size={24}
                color="#16a34a"
              />

              Diagnostic Labs
            </h1>

            <p
              style={{
                fontSize: 13,
                color: '#94a3b8',
                margin: '5px 0 0',
              }}
            >
              {loading
                ? 'Finding labs…'
                : `${total} lab${
                    total === 1 ? '' : 's'
                  } ${
                    nearbyMode
                      ? 'within 15 km'
                      : 'found'
                  }`}
            </p>
          </div>

          {/* View switcher */}
          <div
            style={{
              display: 'flex',
              gap: 3,
              padding: 3,
              background: '#f1f5f9',
              borderRadius: 12,
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
                    gap: 6,
                    alignItems: 'center',
                    padding: '8px 11px',
                    border: 'none',
                    borderRadius: 9,
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight:
                      view === id ? 700 : 500,
                    color:
                      view === id
                        ? '#0f172a'
                        : '#64748b',
                    background:
                      view === id
                        ? '#fff'
                        : 'transparent',
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
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 10,
            marginBottom: 18,
          }}
        >
          {!nearbyMode && (
            <>
              <div
                style={{
                  flex: 1,
                  minWidth: 180,
                  maxWidth: 300,
                  position: 'relative',
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
                  aria-label="Search labs"
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  placeholder="Search labs…"
                  style={{
                    ...control,
                    width: '100%',
                    paddingLeft: 35,
                  }}
                />
              </div>

              <input
                aria-label="Filter labs by city"
                value={city}
                onChange={(e) =>
                  setCity(e.target.value)
                }
                placeholder="City"
                style={{
                  ...control,
                  width: 130,
                }}
              />
            </>
          )}

          {/* Home collection filter */}
          <button
            type="button"
            onClick={() =>
              setHomeOnly((value) => !value)
            }
            style={{
              ...control,
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              cursor: 'pointer',
              background: homeOnly
                ? '#ecfdf5'
                : '#fff',
              borderColor: homeOnly
                ? '#6ee7b7'
                : '#e2e8f0',
              color: homeOnly
                ? '#059669'
                : '#64748b',
            }}
          >
            <Home size={15} />

            Home Collection

            {homeOnly && <Check size={14} />}
          </button>

          {/* Manual location selector */}
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            style={{
              ...control,
              display: 'flex',
              gap: 7,
              alignItems: 'center',
              background: '#ecfdf5',
              borderColor: '#a7f3d0',
              color: '#059669',
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
              cursor: 'pointer',
              fontWeight: 700,
              background: nearbyMode
                ? 'linear-gradient(135deg,#10b981,#059669)'
                : '#ecfdf5',
              color: nearbyMode
                ? '#fff'
                : '#059669',
              borderColor: '#a7f3d0',
            }}
          >
            <Navigation size={15} />

            {nearbyMode
              ? 'Within 15 km'
              : 'Near Selected Location'}

            {nearbyMode && <X size={13} />}
          </button>

          {!nearbyMode &&
            (search || city || homeOnly) && (
              <button
                type="button"
                onClick={() => {
                  setSearch('')
                  setCity('')
                  setHomeOnly(false)
                }}
                style={{
                  ...control,
                  cursor: 'pointer',
                  color: '#ef4444',
                }}
              >
                Clear
              </button>
            )}
        </div>

        {/* Location banner */}
        {nearbyMode && (
          <div
            style={{
              padding: '11px 15px',
              borderRadius: 12,
              background: '#ecfdf5',
              color: '#047857',
              display: 'flex',
              gap: 9,
              alignItems: 'center',
              marginBottom: 15,
              fontSize: 13,
            }}
          >
            <Navigation size={15} />

            Showing labs within 15 km of{' '}
            {geo.address ||
              'your selected location'}.
          </div>
        )}

        {geo.error && nearbyMode && (
          <div
            role="status"
            style={{
              padding: '12px 0',
              color: '#b45309',
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
              labs.
            </p>
          )}

        {/* List view */}
        {view === 'list' && (
          <LabItems
            labs={labs}
            loading={loading}
            error={error}
            nearby={nearbyMode}
            selected={selected}
            onSelect={setSelected}
            onOpen={(id) =>
              router.push(`/labs/${id}`)
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
                accentColor="#10b981"
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
            <LabItems
              labs={labs}
              loading={loading}
              error={error}
              nearby={nearbyMode}
              selected={selected}
              onSelect={setSelected}
              onOpen={(id) =>
                router.push(`/labs/${id}`)
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
                accentColor="#10b981"
              />
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
