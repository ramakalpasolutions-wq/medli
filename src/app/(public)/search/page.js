'use client'

import { useState, useMemo, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import useSWR from 'swr'
import {
  Search,
  Building2,
  FlaskConical,
  Stethoscope,
  List,
  LayoutGrid,
  Map,
  X,
} from 'lucide-react'
import Navbar from '@/components/public/Navbar'
import Footer from '@/components/public/Footer'
import HospitalCard from '@/components/public/HospitalCard'
import LabCard from '@/components/public/LabCard'
import DoctorCard from '@/components/public/DoctorCard'
import EmptyState from '@/components/ui/EmptyState'
import { SkeletonCard } from '@/components/ui/Skeleton'

const LeafletMap = dynamic(() => import('@/components/maps/LeafletMap'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        width: '100%',
        height: '100%',
        borderRadius: 20,
        minHeight: 300,
        backgroundImage: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s linear infinite',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <p style={{ fontSize: 12, color: '#94a3b8' }}>Loading map…</p>
    </div>
  ),
})

const fetcher = (url) => fetch(url).then((r) => r.json()).then((j) => j.data)

const TABS = [
  { key: 'hospitals', label: 'Hospitals', Icon: Building2, color: '#6366f1' },
  { key: 'labs', label: 'Labs', Icon: FlaskConical, color: '#10b981' },
  { key: 'doctors', label: 'Doctors', Icon: Stethoscope, color: '#8b5cf6' },
]

const VIEWS = [
  { key: 'list', Icon: List },
  { key: 'split', Icon: LayoutGrid },
  { key: 'map', Icon: Map },
]

function SearchInput({ value, onChange }) {
  const [focused, setFocused] = useState(false)

  return (
    <div style={{ position: 'relative', flex: 1, minWidth: 160, maxWidth: 380 }}>
      <Search
        size={16}
        strokeWidth={2.2}
        color="#94a3b8"
        style={{
          position: 'absolute',
          left: 12,
          top: '50%',
          transform: 'translateY(-50%)',
          pointerEvents: 'none',
        }}
      />

      <input
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Search hospitals, labs, doctors…"
        style={{
          width: '100%',
          padding: '10px 14px 10px 38px',
          fontSize: 13,
          fontFamily: 'inherit',
          borderRadius: 12,
          border: `1.5px solid ${focused ? '#6366f1' : '#e2e8f0'}`,
          background: '#fff',
          color: '#0f172a',
          outline: 'none',
          boxShadow: focused
            ? '0 0 0 3px rgba(99,102,241,0.12)'
            : '0 1px 3px rgba(0,0,0,0.06)',
          transition: 'all .15s ease',
          boxSizing: 'border-box',
        }}
      />
    </div>
  )
}

function CityInput({ value, onChange }) {
  const [focused, setFocused] = useState(false)

  return (
    <input
      value={value}
      onChange={onChange}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      placeholder="City"
      style={{
        width: 110,
        padding: '10px 14px',
        fontSize: 13,
        fontFamily: 'inherit',
        borderRadius: 12,
        border: `1.5px solid ${focused ? '#6366f1' : '#e2e8f0'}`,
        background: '#fff',
        color: '#0f172a',
        outline: 'none',
        boxShadow: focused
          ? '0 0 0 3px rgba(99,102,241,0.12)'
          : '0 1px 3px rgba(0,0,0,0.06)',
        transition: 'all .15s ease',
        boxSizing: 'border-box',
      }}
    />
  )
}

function TabBar({ tabs, active, onChange }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 4,
        background: '#f1f5f9',
        borderRadius: 14,
        padding: 4,
      }}
    >
      {tabs.map((t) => (
        <TabBtn
          key={t.key}
          label={t.label}
          Icon={t.Icon}
          active={active === t.key}
          onClick={() => onChange(t.key)}
        />
      ))}
    </div>
  )
}

function TabBtn({ label, Icon, active, onClick }) {
  const [h, setH] = useState(false)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        padding: '9px 14px',
        borderRadius: 10,
        fontSize: 13,
        fontWeight: active ? 600 : 500,
        color: active ? '#0f172a' : h ? '#334155' : '#64748b',
        background: active ? '#fff' : h ? 'rgba(255,255,255,0.5)' : 'transparent',
        border: 'none',
        cursor: 'pointer',
        boxShadow: active ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
        transition: 'all .15s ease',
      }}
    >
      <Icon size={15} strokeWidth={2.2} />
      <span>{label}</span>
    </button>
  )
}

function ViewToggle({ view, onChange, disabled }) {
  if (disabled) return null

  return (
    <div
      style={{
        display: 'flex',
        gap: 3,
        background: '#f1f5f9',
        borderRadius: 12,
        padding: 3,
      }}
    >
      {VIEWS.map((v) => (
        <ViewBtn
          key={v.key}
          Icon={v.Icon}
          active={view === v.key}
          onClick={() => onChange(v.key)}
        />
      ))}
    </div>
  )
}

function ViewBtn({ Icon, active, onClick }) {
  const [h, setH] = useState(false)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        width: 34,
        height: 32,
        borderRadius: 9,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: active ? '#fff' : h ? 'rgba(255,255,255,0.5)' : 'transparent',
        color: active ? '#0f172a' : '#64748b',
        border: 'none',
        cursor: 'pointer',
        boxShadow: active ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
        transition: 'all .15s ease',
      }}
    >
      <Icon size={15} strokeWidth={2.2} />
    </button>
  )
}

function SelectedWrapper({ children, selected, color, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        borderRadius: 20,
        cursor: 'pointer',
        outline: selected ? `2.5px solid ${color}` : '2.5px solid transparent',
        outlineOffset: 2,
        transition: 'outline .15s ease',
      }}
    >
      {children}
    </div>
  )
}

function ClearBtn({ onClick }) {
  const [h, setH] = useState(false)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        padding: '10px 14px',
        borderRadius: 12,
        border: `1.5px solid ${h ? '#fca5a5' : '#fee2e2'}`,
        background: h ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.05)',
        color: '#ef4444',
        fontSize: 12,
        fontWeight: 600,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        transition: 'all .15s ease',
      }}
    >
      <X size={14} strokeWidth={2.5} />
      Clear
    </button>
  )
}

function Spinner({ color = '#6366f1' }) {
  return (
    <>
      <style>{`@keyframes srch-spin{to{transform:rotate(360deg)}}`}</style>
      <div
        style={{
          width: 24,
          height: 24,
          borderRadius: '50%',
          border: `2.5px solid ${color}`,
          borderTopColor: 'transparent',
          animation: 'srch-spin .8s linear infinite',
        }}
      />
    </>
  )
}

function MapBox({ style: extraStyle, isLoading, markers, selected, onSelect, accentColor }) {
  return (
    <div style={{ borderRadius: 20, overflow: 'hidden', ...extraStyle }}>
      {isLoading ? (
        <div
          style={{
            width: '100%',
            height: '100%',
            background: '#f1f5f9',
            borderRadius: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Spinner color={accentColor} />
        </div>
      ) : (
        <LeafletMap
          markers={markers}
          selected={selected}
          onSelect={onSelect}
          height="100%"
          accentColor={accentColor}
        />
      )}
    </div>
  )
}

function SearchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [city, setCity] = useState(searchParams.get('city') || '')
  const [tab, setTab] = useState('hospitals')
  const [view, setView] = useState('split')
  const [selected, setSelected] = useState(null)

  const qs = useMemo(() => {
    const p = new URLSearchParams({ limit: '30' })
    if (query) p.set('search', query)
    if (city) p.set('city', city)
    if (tab !== 'doctors') p.set('isApproved', 'true')
    return p.toString()
  }, [query, city, tab])

  const { data: hData, isLoading: hLoad } = useSWR(
    tab === 'hospitals' ? `/api/hospitals?${qs}` : null,
    fetcher
  )
  const { data: lData, isLoading: lLoad } = useSWR(
    tab === 'labs' ? `/api/labs?${qs}` : null,
    fetcher
  )
  const { data: dData, isLoading: dLoad } = useSWR(
    tab === 'doctors' ? `/api/doctors?${qs}` : null,
    fetcher
  )

  const hospitals = hData?.hospitals || []
  const labs = lData?.labs || []
  const doctors = Array.isArray(dData?.doctors) ? dData.doctors : Array.isArray(dData) ? dData : []

  const isLoading = tab === 'hospitals' ? hLoad : tab === 'labs' ? lLoad : dLoad
  const count = tab === 'hospitals' ? hospitals.length : tab === 'labs' ? labs.length : doctors.length

  const activeTab = TABS.find((t) => t.key === tab)
  const accentColor = activeTab?.color || '#6366f1'
  const hasFilters = !!(query || city)

  const mapMarkers = useMemo(() => {
    if (tab === 'doctors') return []
    const list = tab === 'hospitals' ? hospitals : labs

    return list
      .filter((x) => x.location?.coordinates?.length === 2)
      .map((x) => ({
        id: x.id,
        lat: x.location.coordinates[1],
        lng: x.location.coordinates[0],
        name: x.name,
        address: [x.address?.line1, x.address?.city, x.address?.state].filter(Boolean).join(', '),
        rating: x.rating?.average > 0 ? `${x.rating.average.toFixed(1)} (${x.rating.count})` : null,
        color: accentColor,
        href: `/${tab}/${x.id}`,
      }))
  }, [tab, hospitals, labs, accentColor])

  const handleSelect = useCallback((item) => {
    const list = tab === 'hospitals' ? hospitals : labs
    setSelected((prev) => (prev?.id === item.id ? null : list.find((x) => x.id === item.id) || null))
  }, [tab, hospitals, labs])

  const clearFilters = () => {
    setQuery('')
    setCity('')
  }

  const renderCards = (gridStyle = {}) => {
    if (isLoading) {
      return (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))',
            gap: 14,
            ...gridStyle,
          }}
        >
          {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)}
        </div>
      )
    }

    if (!count) {
      return (
        <EmptyState
          title={`No ${tab} found`}
          message={hasFilters ? 'Try adjusting your search or filters' : `No ${tab} available right now`}
          action={hasFilters ? <ClearBtn onClick={clearFilters} /> : null}
        />
      )
    }

    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))',
          gap: 14,
          ...gridStyle,
        }}
      >
        {tab === 'hospitals' && hospitals.map((h) => (
          <SelectedWrapper
            key={h.id}
            selected={selected?.id === h.id}
            color="#6366f1"
            onClick={() => setSelected((p) => (p?.id === h.id ? null : h))}
          >
            <HospitalCard hospital={h} onClick={() => router.push(`/hospitals/${h.id}`)} />
          </SelectedWrapper>
        ))}

        {tab === 'labs' && labs.map((l) => (
          <SelectedWrapper
            key={l.id}
            selected={selected?.id === l.id}
            color="#10b981"
            onClick={() => setSelected((p) => (p?.id === l.id ? null : l))}
          >
            <LabCard lab={l} onClick={() => router.push(`/labs/${l.id}`)} />
          </SelectedWrapper>
        ))}

        {tab === 'doctors' && doctors.map((d) => (
          <DoctorCard
            key={d.id}
            doctor={d}
            onClick={() => router.push(`/doctors/${d.id}`)}
          />
        ))}
      </div>
    )
  }

  return (
    <>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>

      <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
        <Navbar />

        <div
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            padding: 'clamp(80px,10vw,96px) clamp(16px,3vw,32px) 64px',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
              marginBottom: 16,
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: 'clamp(20px,3vw,28px)',
                  fontWeight: 800,
                  color: '#0f172a',
                  margin: 0,
                }}
              >
                Search
              </h1>
              <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
                {isLoading ? 'Searching…' : `${count} result${count !== 1 ? 's' : ''} found`}
              </p>
            </div>

            <ViewToggle
              view={view}
              onChange={setView}
              disabled={tab === 'doctors'}
            />
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
            <SearchInput value={query} onChange={(e) => setQuery(e.target.value)} />
            <CityInput value={city} onChange={(e) => setCity(e.target.value)} />
            {hasFilters && <ClearBtn onClick={clearFilters} />}
          </div>

          <div style={{ marginBottom: 20 }}>
            <TabBar
              tabs={TABS}
              active={tab}
              onChange={(t) => {
                setTab(t)
                setSelected(null)
              }}
            />
          </div>

          {tab === 'doctors' && renderCards()}

          {tab !== 'doctors' && view === 'list' && renderCards()}

          {tab !== 'doctors' && view === 'map' && (
            <MapBox
              style={{ height: 'calc(100vh - 280px)', minHeight: 400 }}
              isLoading={isLoading}
              markers={mapMarkers}
              selected={selected}
              onSelect={handleSelect}
              accentColor={accentColor}
            />
          )}

          {tab !== 'doctors' && view === 'split' && (
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ width: '100%', maxWidth: 420, flexShrink: 0 }}>
                {isLoading ? (
                  <div style={{ display: 'grid', gap: 12 }}>
                    {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
                  </div>
                ) : !count ? (
                  <EmptyState title={`No ${tab} found`} />
                ) : (
                  <div
                    style={{
                      display: 'grid',
                      gap: 12,
                      maxHeight: 'calc(100vh - 300px)',
                      overflowY: 'auto',
                      paddingRight: 4,
                    }}
                  >
                    {tab === 'hospitals' && hospitals.map((h) => (
                      <SelectedWrapper
                        key={h.id}
                        selected={selected?.id === h.id}
                        color="#6366f1"
                        onClick={() => setSelected((p) => (p?.id === h.id ? null : h))}
                      >
                        <HospitalCard hospital={h} onClick={() => router.push(`/hospitals/${h.id}`)} />
                      </SelectedWrapper>
                    ))}

                    {tab === 'labs' && labs.map((l) => (
                      <SelectedWrapper
                        key={l.id}
                        selected={selected?.id === l.id}
                        color="#10b981"
                        onClick={() => setSelected((p) => (p?.id === l.id ? null : l))}
                      >
                        <LabCard lab={l} onClick={() => router.push(`/labs/${l.id}`)} />
                      </SelectedWrapper>
                    ))}
                  </div>
                )}
              </div>

              <MapBox
                style={{
                  flex: 1,
                  minWidth: 300,
                  height: 'clamp(320px,50vw,calc(100vh - 300px))',
                  minHeight: 320,
                }}
                isLoading={isLoading}
                markers={mapMarkers}
                selected={selected}
                onSelect={handleSelect}
                accentColor={accentColor}
              />
            </div>
          )}
        </div>

        <Footer />
      </div>
    </>
  )
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '100vh',
            background: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <style>{`@keyframes srch-spin{to{transform:rotate(360deg)}}`}</style>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: '3px solid #6366f1',
              borderTopColor: 'transparent',
              animation: 'srch-spin .8s linear infinite',
            }}
          />
          <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>
            Loading search…
          </p>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  )
}