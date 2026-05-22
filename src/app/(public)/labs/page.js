'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import dynamic from 'next/dynamic'
import useSWR from 'swr'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/public/Navbar'
import Footer from '@/components/public/Footer'
import LabCard from '@/components/public/LabCard'
import EmptyState from '@/components/ui/EmptyState'
import { SkeletonCard } from '@/components/ui/Skeleton'
import {
  Search, MapPin, List, LayoutGrid, Map,
  Home, Check, FlaskConical, X, Navigation, AlertTriangle,
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
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <p style={{ fontSize: 12, color: '#94a3b8' }}>Loading map…</p>
    </div>
  ),
})

/* ─────────────────────────────────────────────
   Fetchers
───────────────────────────────────────────── */

const listFetcher = (url) =>
  fetch(url).then((r) => r.json()).then((j) => j.data)

const nearbyFetcher = async (url) => {
  const res  = await fetch(url)
  const json = await res.json()
  if (!json.success && json.error) throw new Error(json.error)
  const inner = json.data ?? {}
  const labs  = inner.labs ?? (Array.isArray(json.data) ? json.data : [])
  return { labs, total: inner.total ?? labs.length, source: inner.source }
}

/* ─────────────────────────────────────────────
   Constants
───────────────────────────────────────────── */

const VIEWS = [
  { key: 'list',  label: 'List',  Icon: List },
  { key: 'split', label: 'Split', Icon: LayoutGrid },
  { key: 'map',   label: 'Map',   Icon: Map },
]

/* ─────────────────────────────────────────────
   Small UI components
───────────────────────────────────────────── */

function SearchInput({
  value, onChange, placeholder,
  InputIcon = Search,
  focusColor = '#10b981',
  focusRing  = 'rgba(16,185,129,0.12)',
}) {
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
              display: 'flex', alignItems: 'center', gap: 5,
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

function HomeToggle({ checked, onChange }) {
  const [h, setH] = useState(false)
  return (
    <button
      onClick={() => onChange(!checked)}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '9px 14px', borderRadius: 12,
        border: `1.5px solid ${checked ? '#10b981' : h ? '#a7f3d0' : '#e2e8f0'}`,
        background: checked ? 'rgba(16,185,129,0.08)' : h ? 'rgba(16,185,129,0.04)' : '#fff',
        color: checked ? '#059669' : '#64748b',
        fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all .15s ease',
      }}
    >
      <Home size={16} strokeWidth={2.2} />
      Home Collection
      {checked && <Check size={14} strokeWidth={2.5} color="#10b981" />}
    </button>
  )
}

function NearMeBtn({ active, loading, onClick }) {
  const [h, setH] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      disabled={loading}
      style={{
        display: 'flex', alignItems: 'center', gap: 7,
        padding: '9px 14px', borderRadius: 12, border: 'none',
        cursor: loading ? 'wait' : 'pointer',
        fontSize: 13, fontWeight: 600,
        background: active
          ? 'linear-gradient(135deg,#10b981,#059669)'
          : h ? '#d1fae5' : '#f1f5f9',
        color: active ? '#fff' : '#059669',
        boxShadow: active ? '0 4px 14px rgba(16,185,129,0.35)' : 'none',
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

export default function LabsPage() {
  const router = useRouter()

  const [search,     setSearch]     = useState('')
  const [city,       setCity]       = useState('')
  const [homeOnly,   setHomeOnly]   = useState(false)
  const [selected,   setSelected]   = useState(null)
  const [view,       setView]       = useState('list')

  // Location state
  const [userCoords, setUserCoords] = useState(null)
  const [locLoading, setLocLoading] = useState(false)
  const [locError,   setLocError]   = useState(null)
  const [nearbyMode, setNearbyMode] = useState(false)

  /* ── Location: request and activate nearby mode ── */
  const handleNearMe = useCallback(() => {
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
  const listQs = new URLSearchParams({ limit: 50, isApproved: 'true' })
  if (search) listQs.set('search', search)
  if (city)   listQs.set('city',   city)

  const { data: listData, isLoading: listLoading } = useSWR(
    !nearbyMode ? `/api/labs?${listQs}` : null,
    listFetcher
  )

  const nearbyUrl = nearbyMode && userCoords
    ? `/api/labs/nearby?lat=${userCoords.lat.toFixed(6)}&lng=${userCoords.lng.toFixed(6)}&radius=15000`
    : null

  const { data: nearbyData, isLoading: nearbyLoading, error: nearbyError } = useSWR(
    nearbyUrl,
    nearbyFetcher,
    { revalidateOnFocus: false }
  )

  const allLabs   = nearbyMode ? (nearbyData?.labs ?? []) : (listData?.labs || [])
  const isLoading = nearbyMode ? nearbyLoading : listLoading
  const total     = nearbyMode ? (nearbyData?.total ?? allLabs.length) : allLabs.length

  // homeOnly filter applies on top of location filter
  const labs = homeOnly ? allLabs.filter((l) => l.homeCollection?.enabled) : allLabs

  /* ── Map markers ── */
  const mapMarkers = useMemo(() =>
    labs
      .filter((l) => l.location?.coordinates?.length === 2)
      .map((l) => ({
        id:      l.id,
        lat:     l.location.coordinates[1],
        lng:     l.location.coordinates[0],
        name:    l.name,
        address: [l.address?.line1, l.address?.city, l.address?.state].filter(Boolean).join(', '),
        rating:  l.rating?.average > 0 ? `${l.rating.average.toFixed(1)} (${l.rating.count})` : null,
        color:   '#10b981',
        href:    `/labs/${l.id}`,
        extra: [
          l.distance != null
            ? `<p style="font-size:11px;color:#10b981;margin:0 0 4px;font-weight:600;">📍 ${(l.distance / 1000).toFixed(1)} km away</p>`
            : '',
          l.homeCollection?.enabled
            ? `<p style="font-size:11px;color:#10b981;margin:0 0 4px;">Home Collection</p>`
            : '',
          (l.certifications || []).length > 0
            ? `<p style="font-size:11px;color:#6b7280;margin:0 0 4px;">${l.certifications.join(' · ')}</p>`
            : '',
        ].join(''),
      }))
  , [labs])

  const handleSelect = useCallback((item) => {
    setSelected((prev) => prev?.id === item.id ? null : labs.find((x) => x.id === item.id))
  }, [labs])

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
                  background: '#dcfce7', display: 'inline-flex',
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <FlaskConical size={18} strokeWidth={2.2} color="#16a34a" />
                </span>
                Diagnostic Labs
              </h1>
              <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
                {isLoading
                  ? 'Finding labs…'
                  : nearbyMode
                    ? `${labs.length} lab${labs.length !== 1 ? 's' : ''} within 15 km`
                    : `${labs.length} lab${labs.length !== 1 ? 's' : ''} found`
                }
              </p>
            </div>
            <ViewToggle view={view} onChange={setView} />
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20, alignItems: 'center' }}>
            {!nearbyMode && (
              <>
                <div style={{ flex: 1, minWidth: 160, maxWidth: 280 }}>
                  <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search labs…" />
                </div>
                <div style={{ width: 120 }}>
                  <SearchInput value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" InputIcon={MapPin} />
                </div>
              </>
            )}

            <HomeToggle checked={homeOnly} onChange={setHomeOnly} />

            <NearMeBtn active={nearbyMode} loading={locLoading} onClick={handleNearMe} />

            {!nearbyMode && (search || city || homeOnly) && (
              <button
                onClick={() => { setSearch(''); setCity(''); setHomeOnly(false) }}
                style={{
                  padding: '10px 16px', borderRadius: 12,
                  border: '1.5px solid #fca5a5', background: '#fff1f2',
                  color: '#ef4444', fontSize: 12, fontWeight: 600, cursor: 'pointer',
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

          {/* Nearby info banner */}
          {nearbyMode && !isLoading && (
            <div style={{
              marginBottom: 16, padding: '10px 16px', borderRadius: 12,
              background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)',
              color: '#059669', fontSize: 13, fontWeight: 500,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <Navigation size={15} strokeWidth={2.2} />
              Showing labs within 15 km of your current location, sorted by distance.
            </div>
          )}

          {/* List view */}
          {view === 'list' && (
            isLoading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
                {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)}
              </div>
            ) : !labs.length ? (
              <EmptyState
                title={nearbyMode ? 'No labs within 15 km' : 'No labs found'}
                message={nearbyMode ? 'Try expanding your search or check a different location'
                  : homeOnly ? 'No home collection labs in this area' : 'Try adjusting your search'}
              />
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
                {labs.map((l) => (
                  <LabCard key={l.id} lab={l} onClick={() => router.push(`/labs/${l.id}`)} />
                ))}
              </div>
            )
          )}

          {/* Map view */}
          {view === 'map' && (
            <div style={{ borderRadius: 20, overflow: 'hidden', height: 'calc(100vh - 220px)', minHeight: 400 }}>
              <LeafletMap
                markers={mapMarkers}
                selected={selected}
                onSelect={handleSelect}
                height="100%"
                accentColor="#10b981"
              />
            </div>
          )}

          {/* Split view */}
          {view === 'split' && (
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ width: '100%', maxWidth: 420, flexShrink: 0 }}>
                {isLoading ? (
                  <div style={{ display: 'grid', gap: 12 }}>
                    {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
                  </div>
                ) : !labs.length ? (
                  <EmptyState
                    title={nearbyMode ? 'No labs within 15 km' : 'No labs found'}
                    message={homeOnly ? 'No home collection labs in this area' : 'Try adjusting your search'}
                  />
                ) : (
                  <div style={{ display: 'grid', gap: 12, maxHeight: 'calc(100vh - 240px)', overflowY: 'auto', paddingRight: 4 }}>
                    {labs.map((l) => (
                      <div
                        key={l.id}
                        onClick={() => setSelected((p) => (p?.id === l.id ? null : l))}
                        style={{
                          borderRadius: 20, cursor: 'pointer',
                          outline: selected?.id === l.id ? '2.5px solid #10b981' : '2.5px solid transparent',
                          outlineOffset: 2, transition: 'outline .15s ease',
                        }}
                      >
                        <LabCard lab={l} onClick={() => router.push(`/labs/${l.id}`)} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ flex: 1, minWidth: 320, borderRadius: 20, overflow: 'hidden', height: 'clamp(320px,50vw,calc(100vh - 240px))', minHeight: 320 }}>
                <LeafletMap
                  markers={mapMarkers}
                  selected={selected}
                  onSelect={handleSelect}
                  height="100%"
                  accentColor="#10b981"
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