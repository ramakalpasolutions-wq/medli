'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import dynamic       from 'next/dynamic'
import useSWR        from 'swr'
import { useRouter } from 'next/navigation'
import Navbar        from '@/components/public/Navbar'
import Footer        from '@/components/public/Footer'
import HospitalCard  from '@/components/public/HospitalCard'
import EmptyState    from '@/components/ui/EmptyState'
import { SkeletonCard } from '@/components/ui/Skeleton'
import {
  Search, List, LayoutGrid, Map,
  Building2, AlertTriangle, X, MapPin, Navigation,
} from 'lucide-react'

const LeafletMap = dynamic(() => import('@/components/maps/LeafletMap'), {
  ssr: false,
  loading: () => (
    <div style={{
      width: '100%', height: '100%', borderRadius: 20, minHeight: 300,
      background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)',
      backgroundSize: '200% 100%', animation: 'shimmer 1.5s linear infinite',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <p style={{ fontSize: 12, color: '#94a3b8' }}>Loading map…</p>
    </div>
  ),
})

/* ─────────────────────────────────────────────
   Fetchers
───────────────────────────────────────────── */

/** Regular list API: { success, data: { hospitals, pagination } } */
const listFetcher = async (url) => {
  const res  = await fetch(url)
  const json = await res.json()
  if (!json.success && json.error) throw new Error(json.error)

  if (json.data?.hospitals) return { hospitals: json.data.hospitals, pagination: json.data.pagination }
  if (Array.isArray(json.data)) return { hospitals: json.data, pagination: json.pagination || null }
  if (Array.isArray(json.hospitals)) return { hospitals: json.hospitals, pagination: json.pagination || null }
  return { hospitals: [], pagination: null }
}

/** Nearby API: { success, data: { hospitals, total, source } } */
const nearbyFetcher = async (url) => {
  const res  = await fetch(url)
  const json = await res.json()
  if (!json.success && json.error) throw new Error(json.error)

  const inner = json.data ?? {}
  const hospitals = inner.hospitals ?? (Array.isArray(json.data) ? json.data : [])
  return { hospitals, total: inner.total ?? hospitals.length, source: inner.source }
}

/* ─────────────────────────────────────────────
   Constants
───────────────────────────────────────────── */

const VIEWS = [
  { key: 'list',  label: 'List',  Icon: List },
  { key: 'split', label: 'Split', Icon: LayoutGrid },
  { key: 'map',   label: 'Map',   Icon: Map },
]

const VIEW_STORAGE_KEY = 'medli_hospitals_view'

/* ─────────────────────────────────────────────
   Small UI components
───────────────────────────────────────────── */

function SearchInput({ value, onChange, placeholder, InputIcon = Search, focusColor = '#6366f1', focusRing = 'rgba(99,102,241,0.12)' }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <InputIcon
        size={16} strokeWidth={2.2} color="#94a3b8"
        style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
      />
      <input
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        style={{
          width: '100%', padding: '10px 14px 10px 38px',
          fontSize: 13, fontFamily: 'inherit', borderRadius: 12,
          border: `1.5px solid ${focused ? focusColor : '#e2e8f0'}`,
          background: '#fff', color: '#0f172a', outline: 'none',
          boxShadow: focused ? `0 0 0 3px ${focusRing}` : '0 1px 3px rgba(0,0,0,0.06)',
          transition: 'all .15s ease', boxSizing: 'border-box',
        }}
      />
    </div>
  )
}

function ViewToggle({ view, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 3, background: '#f1f5f9', borderRadius: 12, padding: 3 }}>
      {VIEWS.map((v) => {
        const active = view === v.key
        return (
          <button
            key={v.key}
            onClick={() => onChange(v.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 12px', borderRadius: 9,
              fontSize: 12, fontWeight: active ? 600 : 500,
              background: active ? '#fff' : 'transparent',
              color: active ? '#0f172a' : '#64748b',
              border: 'none', cursor: 'pointer',
              boxShadow: active ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
              transition: 'all .15s ease',
            }}
          >
            <v.Icon size={14} strokeWidth={2.2} />
            <span>{v.label}</span>
          </button>
        )
      })}
    </div>
  )
}

function SelectedWrapper({ children, selected, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        borderRadius: 20, cursor: 'pointer',
        outline: selected ? '2.5px solid #6366f1' : '2.5px solid transparent',
        outlineOffset: 2, transition: 'outline .15s ease',
      }}
    >
      {children}
    </div>
  )
}

/**
 * "Near Me" toggle button — green when location is active.
 */
function NearMeBtn({ active, loading, error, onClick }) {
  const [h, setH] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      disabled={loading}
      title={active ? 'Showing hospitals within 15 km — click to clear' : 'Show hospitals near me (within 15 km)'}
      style={{
        display: 'flex', alignItems: 'center', gap: 7,
        padding: '9px 14px', borderRadius: 12, border: 'none', cursor: loading ? 'wait' : 'pointer',
        fontSize: 13, fontWeight: 600,
        background: active
          ? 'linear-gradient(135deg,#6366f1,#8b5cf6)'
          : h ? '#e0e7ff' : '#f1f5f9',
        color: active ? '#fff' : '#6366f1',
        boxShadow: active ? '0 4px 14px rgba(99,102,241,0.35)' : 'none',
        transition: 'all .18s ease',
      }}
    >
      {loading ? (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin .8s linear infinite' }}>
          <path d="M12 2a10 10 0 1 0 10 10" />
        </svg>
      ) : (
        <Navigation size={15} strokeWidth={2.2} />
      )}
      {loading ? 'Locating…' : active ? 'Within 15 km' : 'Near Me'}
      {active && <X size={13} strokeWidth={2.5} style={{ marginLeft: 2 }} />}
    </button>
  )
}

/* ─────────────────────────────────────────────
   Main Page
───────────────────────────────────────────── */

export default function HospitalsPage() {
  const router = useRouter()

  const [search,     setSearch]     = useState('')
  const [city,       setCity]       = useState('')
  const [selected,   setSelected]   = useState(null)
  const [view,       setView]       = useState('list')

  // Location state
  const [userCoords,  setUserCoords]  = useState(null) // { lat, lng }
  const [locLoading,  setLocLoading]  = useState(false)
  const [locError,    setLocError]    = useState(null)
  const [nearbyMode,  setNearbyMode]  = useState(false) // true = use nearby API

  /* Persist view preference */
  useEffect(() => {
    try {
      const saved = localStorage.getItem(VIEW_STORAGE_KEY)
      if (saved && ['list', 'split', 'map'].includes(saved)) setView(saved)
    } catch {}
  }, [])

  useEffect(() => {
    try { localStorage.setItem(VIEW_STORAGE_KEY, view) } catch {}
  }, [view])

  /* ── Location: request and activate nearby mode ── */
  const handleNearMe = useCallback(() => {
    // Toggle off
    if (nearbyMode) {
      setNearbyMode(false)
      return
    }

    if (!navigator.geolocation) {
      setLocError('Geolocation not supported by your browser')
      return
    }

    setLocLoading(true)
    setLocError(null)

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setUserCoords({ lat: coords.latitude, lng: coords.longitude })
        setNearbyMode(true)
        setLocLoading(false)
        // Clear text filters when using location
        setSearch('')
        setCity('')
      },
      (err) => {
        setLocLoading(false)
        setLocError(
          err.code === 1 ? 'Location permission denied'
          : err.code === 2 ? 'Location unavailable'
          : 'Location request timed out'
        )
      },
      { timeout: 10000, maximumAge: 60000, enableHighAccuracy: true }
    )
  }, [nearbyMode])

  /* ── Data fetching ── */
  const listQs = new URLSearchParams({ limit: 50 })
  if (search) listQs.set('search', search)
  if (city)   listQs.set('city',   city)

  // Only fetch list API when NOT in nearby mode
  const { data: listData, isLoading: listLoading, error: listError } = useSWR(
    !nearbyMode ? `/api/hospitals?${listQs}` : null,
    listFetcher,
    { revalidateOnFocus: false }
  )

  // Only fetch nearby API when in nearby mode AND we have coords
  const nearbyUrl = nearbyMode && userCoords
    ? `/api/hospitals/nearby?lat=${userCoords.lat.toFixed(6)}&lng=${userCoords.lng.toFixed(6)}&radius=15000`
    : null

  const { data: nearbyData, isLoading: nearbyLoading, error: nearbyError } = useSWR(
    nearbyUrl,
    nearbyFetcher,
    { revalidateOnFocus: false }
  )

  const hospitals  = nearbyMode ? (nearbyData?.hospitals ?? []) : (listData?.hospitals ?? [])
  const isLoading  = nearbyMode ? nearbyLoading : listLoading
  const error      = nearbyMode ? nearbyError   : listError
  const total      = nearbyMode
    ? (nearbyData?.total ?? hospitals.length)
    : (listData?.pagination?.total ?? hospitals.length)

  /* ── Map markers ── */
  const mapMarkers = useMemo(() =>
    hospitals
      .filter((h) => Array.isArray(h.location?.coordinates) && h.location.coordinates.length === 2)
      .map((h) => ({
        id:      h.id,
        lat:     h.location.coordinates[1],
        lng:     h.location.coordinates[0],
        name:    h.name,
        address: [h.address?.city, h.address?.state].filter(Boolean).join(', '),
        rating:  h.rating?.average > 0 ? `${h.rating.average.toFixed(1)} (${h.rating.count})` : null,
        color:   '#6366f1',
        href:    `/hospitals/${h.id}`,
        extra:   h.distance != null
          ? `<p style="font-size:11px;color:#6366f1;margin:0 0 4px;font-weight:600;">📍 ${(h.distance / 1000).toFixed(1)} km away</p>`
          : (h.departments?.length > 0
            ? `<p style="font-size:11px;color:#6b7280;margin:0 0 4px;">${h.departments.slice(0, 3).join(' · ')}</p>`
            : ''),
      }))
  , [hospitals])

  const handleSelect = useCallback((item) => {
    const h = hospitals.find((x) => x.id === item.id)
    setSelected((prev) => prev?.id === item.id ? null : h)
  }, [hospitals])

  /* ── Subcomponents ── */
  const ErrorBox = () => (
    <div style={{
      padding: 32, borderRadius: 20,
      background: '#fff1f2', border: '1px solid #fecaca',
      color: '#dc2626', fontSize: 14,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    }}>
      <AlertTriangle size={18} strokeWidth={2.2} />
      Failed to load hospitals. Please refresh.
    </div>
  )

  const EmptyBox = () => (
    <EmptyState
      title={nearbyMode ? 'No hospitals within 15 km' : 'No hospitals found'}
      message={nearbyMode
        ? 'Try expanding your search or check a different location'
        : (search || city ? 'Try different search terms' : 'No hospitals available yet')}
    />
  )

  const HospitalGrid = () => {
    if (isLoading) return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
        {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)}
      </div>
    )
    if (error)             return <ErrorBox />
    if (!hospitals.length) return <EmptyBox />
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
        {hospitals.map((h) => (
          <SelectedWrapper
            key={h.id}
            selected={selected?.id === h.id}
            onClick={() => setSelected((p) => p?.id === h.id ? null : h)}
          >
            <HospitalCard hospital={h} onClick={() => router.push(`/hospitals/${h.id}`)} />
          </SelectedWrapper>
        ))}
      </div>
    )
  }

  const HospitalList = () => {
    if (isLoading) return (
      <div style={{ display: 'grid', gap: 12 }}>
        {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
      </div>
    )
    if (error)             return <ErrorBox />
    if (!hospitals.length) return <EmptyBox />
    return (
      <div style={{ display: 'grid', gap: 12, maxHeight: 'calc(100vh - 240px)', overflowY: 'auto', paddingRight: 4 }}>
        {hospitals.map((h) => (
          <SelectedWrapper
            key={h.id}
            selected={selected?.id === h.id}
            onClick={() => setSelected((p) => p?.id === h.id ? null : h)}
          >
            <HospitalCard hospital={h} onClick={() => router.push(`/hospitals/${h.id}`)} />
          </SelectedWrapper>
        ))}
      </div>
    )
  }

  /* ─────────────────────────────────────────────
     Render
  ───────────────────────────────────────────── */
  return (
    <>
      <style>{`
        @keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }
        @keyframes spin     { to { transform: rotate(360deg) } }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
        <Navbar />

        <div style={{
          maxWidth: 1280, margin: '0 auto',
          padding: 'clamp(80px,10vw,96px) clamp(16px,3vw,32px) 64px',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', flexWrap: 'wrap',
            alignItems: 'center', justifyContent: 'space-between',
            gap: 12, marginBottom: 20,
          }}>
            <div>
              <h1 style={{
                fontSize: 'clamp(20px,3vw,28px)', fontWeight: 800,
                color: '#0f172a', margin: 0,
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span style={{
                  width: 34, height: 34, borderRadius: 10,
                  background: '#dbeafe', display: 'inline-flex',
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Building2 size={18} strokeWidth={2.2} color="#2563eb" />
                </span>
                Hospitals
              </h1>
              <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
                {isLoading
                  ? 'Finding hospitals…'
                  : nearbyMode
                    ? `${total} hospital${total !== 1 ? 's' : ''} within 15 km`
                    : `${total} hospital${total !== 1 ? 's' : ''} found`
                }
              </p>
            </div>
            <ViewToggle view={view} onChange={setView} />
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20, alignItems: 'center' }}>
            {/* Search — hidden when nearby mode is active */}
            {!nearbyMode && (
              <>
                <div style={{ flex: 1, minWidth: 160, maxWidth: 340 }}>
                  <SearchInput
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search hospitals…"
                  />
                </div>
                <div style={{ width: 180 }}>
                  <SearchInput
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Filter by city…"
                    InputIcon={MapPin}
                  />
                </div>
              </>
            )}

            {/* Near Me button */}
            <NearMeBtn
              active={nearbyMode}
              loading={locLoading}
              error={locError}
              onClick={handleNearMe}
            />

            {/* Clear text filters */}
            {!nearbyMode && (search || city) && (
              <button
                onClick={() => { setSearch(''); setCity('') }}
                style={{
                  padding: '10px 16px', borderRadius: 12,
                  border: '1.5px solid #fca5a5',
                  background: '#fff1f2', color: '#ef4444',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <X size={14} strokeWidth={2.5} />
                Clear
              </button>
            )}
          </div>

          {/* Location error */}
          {locError && (
            <div style={{
              marginBottom: 16, padding: '10px 16px', borderRadius: 12,
              background: '#fff1f2', border: '1px solid #fecaca',
              color: '#dc2626', fontSize: 13,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <AlertTriangle size={16} strokeWidth={2.2} />
              {locError}
            </div>
          )}

          {/* Nearby mode info banner */}
          {nearbyMode && !isLoading && (
            <div style={{
              marginBottom: 16, padding: '10px 16px', borderRadius: 12,
              background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.2)',
              color: '#6366f1', fontSize: 13, fontWeight: 500,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <Navigation size={15} strokeWidth={2.2} />
              Showing hospitals within 15 km of your current location, sorted by distance.
            </div>
          )}

          {/* Views */}
          {view === 'list' && <HospitalGrid />}

          {view === 'map' && (
            <div style={{ borderRadius: 20, overflow: 'hidden', height: 'calc(100vh - 220px)', minHeight: 400 }}>
              <LeafletMap
                markers={mapMarkers}
                selected={selected}
                onSelect={handleSelect}
                height="100%"
                accentColor="#6366f1"
              />
            </div>
          )}

          {view === 'split' && (
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ width: '100%', maxWidth: 420, flexShrink: 0 }}>
                <HospitalList />
              </div>
              <div style={{
                flex: 1, minWidth: 320, borderRadius: 20, overflow: 'hidden',
                height: 'clamp(320px,50vw,calc(100vh - 240px))', minHeight: 320,
              }}>
                <LeafletMap
                  markers={mapMarkers}
                  selected={selected}
                  onSelect={handleSelect}
                  height="100%"
                  accentColor="#6366f1"
                />
              </div>
            </div>
          )}
        </div>

        <Footer />
      </div>
    </>
  )
}