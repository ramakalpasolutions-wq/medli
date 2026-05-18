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
  Building2, AlertTriangle, X, MapPin,
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

/**
 * Fetcher — handles { success, data: { hospitals, pagination } }
 * Returns { hospitals: [], pagination: {} }
 */
const fetcher = async (url) => {
  const res  = await fetch(url)
  const json = await res.json()

  if (!json.success && json.error) throw new Error(json.error)

  if (json.data?.hospitals) {
    return { hospitals: json.data.hospitals, pagination: json.data.pagination }
  }
  if (Array.isArray(json.data)) {
    return { hospitals: json.data, pagination: json.pagination || null }
  }
  if (Array.isArray(json.hospitals)) {
    return { hospitals: json.hospitals, pagination: json.pagination || null }
  }

  return { hospitals: [], pagination: null }
}

const VIEWS = [
  { key: 'list',  label: 'List',  Icon: List },
  { key: 'split', label: 'Split', Icon: LayoutGrid },
  { key: 'map',   label: 'Map',   Icon: Map },
]

const VIEW_STORAGE_KEY = 'medli_hospitals_view'

function SearchInput({ value, onChange, placeholder, InputIcon = Search, focusColor = '#6366f1', focusRing = 'rgba(99,102,241,0.12)' }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <InputIcon
        size={16}
        strokeWidth={2.2}
        color="#94a3b8"
        style={{
          position: 'absolute', left: 12, top: '50%',
          transform: 'translateY(-50%)', pointerEvents: 'none',
        }}
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
          boxShadow: focused
            ? `0 0 0 3px ${focusRing}`
            : '0 1px 3px rgba(0,0,0,0.06)',
          transition: 'all .15s ease', boxSizing: 'border-box',
        }}
      />
    </div>
  )
}

function ViewToggle({ view, onChange }) {
  return (
    <div style={{
      display: 'flex', gap: 3,
      background: '#f1f5f9', borderRadius: 12, padding: 3,
    }}>
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

export default function HospitalsPage() {
  const router = useRouter()

  const [search,   setSearch]   = useState('')
  const [city,     setCity]     = useState('')
  const [selected, setSelected] = useState(null)

  const [view, setView] = useState('list')

  useEffect(() => {
    try {
      const saved = localStorage.getItem(VIEW_STORAGE_KEY)
      if (saved && ['list', 'split', 'map'].includes(saved)) setView(saved)
    } catch { /* localStorage blocked — keep default 'list' */ }
  }, [])

  useEffect(() => {
    try { localStorage.setItem(VIEW_STORAGE_KEY, view) }
    catch { /* silent fail */ }
  }, [view])

  /* Data fetching */
  const qs = new URLSearchParams({ limit: 50 })
  if (search) qs.set('search', search)
  if (city)   qs.set('city',   city)

  const { data, isLoading, error } = useSWR(
    `/api/hospitals?${qs}`,
    fetcher,
    { revalidateOnFocus: false }
  )

  const hospitals = data?.hospitals ?? []
  const total     = data?.pagination?.total ?? hospitals.length

  const mapMarkers = useMemo(() =>
    hospitals
      .filter((h) => Array.isArray(h.location?.coordinates) && h.location.coordinates.length === 2)
      .map((h) => ({
        id:      h.id,
        lat:     h.location.coordinates[1],
        lng:     h.location.coordinates[0],
        name:    h.name,
        address: [h.address?.city, h.address?.state].filter(Boolean).join(', '),
        rating:  h.rating?.average > 0
                   ? `${h.rating.average.toFixed(1)} (${h.rating.count})`
                   : null,
        color:  '#6366f1',
        href:   `/hospitals/${h.id}`,
        extra:  h.departments?.length > 0
                  ? `<p style="font-size:11px;color:#6b7280;margin:0 0 4px;">${h.departments.slice(0, 3).join(' · ')}</p>`
                  : '',
      }))
  , [hospitals])

  const handleSelect = useCallback((item) => {
    const h = hospitals.find((x) => x.id === item.id)
    setSelected((prev) => prev?.id === item.id ? null : h)
  }, [hospitals])

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
      title="No hospitals found"
      message={search || city ? 'Try different search terms' : 'No hospitals available yet'}
    />
  )

  /* Grid for list view */
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

  /* List for split view (scrollable) */
  const HospitalList = () => {
    if (isLoading) return (
      <div style={{ display: 'grid', gap: 12 }}>
        {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
      </div>
    )
    if (error)             return <ErrorBox />
    if (!hospitals.length) return <EmptyBox />
    return (
      <div style={{
        display: 'grid', gap: 12,
        maxHeight: 'calc(100vh - 240px)',
        overflowY: 'auto', paddingRight: 4,
      }}>
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

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0%   { background-position:  200% 0 }
          100% { background-position: -200% 0 }
        }
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
                  : `${total} hospital${total !== 1 ? 's' : ''} found`
                }
              </p>
            </div>
            <ViewToggle view={view} onChange={setView} />
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
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
            {(search || city) && (
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

          {/* Views */}
          {view === 'list' && <HospitalGrid />}

          {view === 'map' && (
            <div style={{
              borderRadius: 20, overflow: 'hidden',
              height: 'calc(100vh - 220px)', minHeight: 400,
            }}>
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