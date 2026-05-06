// src/app/(public)/search/page.js
'use client'

import { useState, useMemo, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import useSWR from 'swr'
import Navbar from '@/components/public/Navbar'
import Footer from '@/components/public/Footer'
import HospitalCard from '@/components/public/HospitalCard'
import LabCard from '@/components/public/LabCard'
import DoctorCard from '@/components/public/DoctorCard'
import Input from '@/components/ui/Input'
import EmptyState from '@/components/ui/EmptyState'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { Search, List, Map, Building2, FlaskConical, Stethoscope, X, SlidersHorizontal } from 'lucide-react'

const LeafletMap = dynamic(() => import('@/components/maps/LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full rounded-2xl bg-gray-100 flex items-center justify-center min-h-[300px]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-gray-400">Loading map…</p>
      </div>
    </div>
  ),
})

const fetcher = (url) => fetch(url).then((r) => r.json()).then((j) => j.data)

// ── Tab config ──────────────────────────────────────────────────────────────
const TABS = [
  { key: 'hospitals', label: 'Hospitals', icon: <Building2 className="w-4 h-4" />,    emoji: '🏥', color: '#1286f5' },
  { key: 'labs',      label: 'Labs',      icon: <FlaskConical className="w-4 h-4" />,  emoji: '🧪', color: '#10b981' },
  { key: 'doctors',   label: 'Doctors',   icon: <Stethoscope className="w-4 h-4" />,   emoji: '👨‍⚕️', color: '#8b5cf6' },
]

const VIEW_OPTS = [
  { key: 'list',  icon: <List className="w-4 h-4" /> },
  { key: 'split', icon: <><List className="w-3 h-3" /><Map className="w-3 h-3" /></> },
  { key: 'map',   icon: <Map className="w-4 h-4" /> },
]

function SearchContent() {
  const searchParams = useSearchParams()
  const router       = useRouter()

  const [query,       setQuery]       = useState(searchParams.get('q') || '')
  const [city,        setCity]        = useState(searchParams.get('city') || '')
  const [tab,         setTab]         = useState('hospitals')
  const [view,        setView]        = useState('split')
  const [selected,    setSelected]    = useState(null)
  const [filtersOpen, setFiltersOpen] = useState(false)

  // ── Build query strings ───────────────────────────────────────────────────
  const qs = useMemo(() => {
    const params = new URLSearchParams({ limit: '30' })
    if (query) params.set('search', query)
    if (city)  params.set('city', city)
    if (tab === 'hospitals' || tab === 'labs') params.set('isApproved', 'true')
    return params.toString()
  }, [query, city, tab])

  // ── Fetch data ────────────────────────────────────────────────────────────
  const { data: hData, isLoading: hLoading } = useSWR(
    tab === 'hospitals' ? `/api/hospitals?${qs}` : null, fetcher
  )
  const { data: lData, isLoading: lLoading } = useSWR(
    tab === 'labs' ? `/api/labs?${qs}` : null, fetcher
  )
  const { data: dData, isLoading: dLoading } = useSWR(
    tab === 'doctors' ? `/api/doctors?${qs}` : null, fetcher
  )

  const hospitals = hData?.hospitals || []
  const labs      = lData?.labs      || []
  const doctors   = dData?.doctors   || dData || []

  const isLoading = tab === 'hospitals' ? hLoading : tab === 'labs' ? lLoading : dLoading
  const items     = tab === 'hospitals' ? hospitals : tab === 'labs' ? labs : doctors
  const count     = items.length

  // ── Map markers ───────────────────────────────────────────────────────────
  const activeTab = TABS.find((t) => t.key === tab)

  const mapMarkers = useMemo(() => {
    if (tab === 'doctors') return [] // doctors typically don't have locations

    const list = tab === 'hospitals' ? hospitals : labs
    return list
      .filter((item) => item.location?.coordinates?.length === 2)
      .map((item) => ({
        id:      item.id,
        lat:     item.location.coordinates[1],
        lng:     item.location.coordinates[0],
        name:    item.name,
        address: [item.address?.line1, item.address?.city, item.address?.state]
          .filter(Boolean).join(', '),
        rating:  item.rating?.average > 0
          ? `${item.rating.average.toFixed(1)} (${item.rating.count} reviews)`
          : null,
        color: activeTab?.color || '#1286f5',
        emoji: activeTab?.emoji || '📍',
        href:  `/${tab}/${item.id}`,
        extra: tab === 'hospitals'
          ? ((item.departments || []).length > 0
              ? `<p style="font-size:11px;color:#6b7280;margin:0 0 4px;">🏥 ${item.departments.slice(0, 3).join(' · ')}</p>`
              : '')
          : [
              item.homeCollection?.enabled
                ? `<p style="font-size:11px;color:#10b981;margin:0 0 4px;">🏠 Home Collection</p>`
                : '',
              (item.certifications || []).length > 0
                ? `<p style="font-size:11px;color:#6b7280;margin:0 0 4px;">🏅 ${item.certifications.join(' · ')}</p>`
                : '',
            ].join(''),
      }))
  }, [tab, hospitals, labs, activeTab])

  const handleSelect = useCallback((item) => {
    const list = tab === 'hospitals' ? hospitals : labs
    const found = list.find((x) => x.id === item.id)
    setSelected((prev) => prev?.id === item.id ? null : found)
  }, [tab, hospitals, labs])

  const handleCardClick = useCallback((id) => {
    router.push(`/${tab}/${id}`)
  }, [tab, router])

  const clearFilters = () => {
    setQuery('')
    setCity('')
  }

  const hasFilters = query || city

  // ── Render cards ──────────────────────────────────────────────────────────
  const renderCards = (gridClass) => {
    if (isLoading) {
      return (
        <div className={gridClass}>
          {[1,2,3,4,5,6].map((i) => <SkeletonCard key={i} />)}
        </div>
      )
    }

    if (!count) {
      return (
        <EmptyState
          title={`No ${tab} found`}
          message={hasFilters ? 'Try adjusting your search or filters' : `No ${tab} available right now`}
          action={hasFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Clear Filters
            </button>
          )}
        />
      )
    }

    return (
      <div className={gridClass}>
        {tab === 'hospitals' && hospitals.map((h) => (
          <div
            key={h.id}
            className={selected?.id === h.id
              ? 'rounded-2xl cursor-pointer ring-2 ring-blue-500 ring-offset-1'
              : 'rounded-2xl cursor-pointer hover:ring-1 hover:ring-gray-200'}
            onClick={() => setSelected((prev) => prev?.id === h.id ? null : h)}
          >
            <HospitalCard hospital={h} onClick={() => handleCardClick(h.id)} />
          </div>
        ))}
        {tab === 'labs' && labs.map((l) => (
          <div
            key={l.id}
            className={selected?.id === l.id
              ? 'rounded-2xl cursor-pointer ring-2 ring-green-500 ring-offset-1'
              : 'rounded-2xl cursor-pointer hover:ring-1 hover:ring-gray-200'}
            onClick={() => setSelected((prev) => prev?.id === l.id ? null : l)}
          >
            <LabCard lab={l} onClick={() => handleCardClick(l.id)} />
          </div>
        ))}
        {tab === 'doctors' && (Array.isArray(doctors) ? doctors : []).map((d) => (
          <DoctorCard key={d.id} doctor={d} onClick={() => router.push(`/doctors/${d.id}`)} />
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">

        {/* ── Header ── */}
        <div className="flex flex-col gap-4 mb-5 mt-4">

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Search</h1>
              <p className="text-gray-400 text-sm mt-0.5">
                {isLoading ? 'Searching…' : `${count} result${count !== 1 ? 's' : ''} found`}
              </p>
            </div>

            {/* View toggle — hide on doctors (no map) */}
            {tab !== 'doctors' && (
              <div className="flex gap-1 bg-gray-200 rounded-xl p-1 self-start sm:self-auto">
                {VIEW_OPTS.map((v) => (
                  <button
                    key={v.key}
                    onClick={() => setView(v.key)}
                    className={view === v.key
                      ? 'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-white text-gray-900 shadow-sm'
                      : 'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-700'}
                  >
                    {v.icon}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Filters row ── */}
          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex-1 min-w-[160px] max-w-sm">
              <Input
                placeholder="Search hospitals, labs, doctors…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                leftIcon={<Search className="w-4 h-4 text-gray-400" />}
              />
            </div>
            <div className="w-28 sm:w-32">
              <Input
                placeholder="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-red-500 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors"
              >
                <X className="w-3 h-3" /> Clear
              </button>
            )}
          </div>

          {/* ── Tabs ── */}
          <div className="flex gap-1 bg-gray-100 rounded-2xl p-1">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => { setTab(t.key); setSelected(null) }}
                className={tab === t.key
                  ? 'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-white text-gray-900 shadow-sm transition-all'
                  : 'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:text-gray-700 transition-all'}
              >
                {t.icon}
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Content ── */}

        {/* Doctors tab — always list, no map */}
        {tab === 'doctors' && renderCards('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4')}

        {/* Hospitals / Labs — support list, split, map */}
        {tab !== 'doctors' && view === 'list' && renderCards('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4')}

        {tab !== 'doctors' && view === 'map' && (
          <div
            className="rounded-2xl overflow-hidden w-full"
            style={{ height: 'calc(100vh - 280px)', minHeight: 400 }}
          >
            {isLoading ? (
              <div className="w-full h-full bg-gray-100 rounded-2xl flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : mapMarkers.length === 0 ? (
              <EmptyState title="No locations to show" message="No results have map coordinates" />
            ) : (
              <LeafletMap
                markers={mapMarkers}
                selected={selected}
                onSelect={handleSelect}
                height="100%"
                accentColor={activeTab?.color || '#1286f5'}
              />
            )}
          </div>
        )}

        {tab !== 'doctors' && view === 'split' && (
          <div className="flex flex-col lg:flex-row gap-4">

            {/* Cards */}
            <div className="w-full lg:w-96 flex-shrink-0">
              {renderCards('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 lg:max-h-[calc(100vh-300px)] lg:overflow-y-auto lg:pr-1')}
            </div>

            {/* Map */}
            <div
              className="flex-1 rounded-2xl overflow-hidden"
              style={{ height: 'clamp(320px, 50vw, calc(100vh - 300px))', minHeight: 320 }}
            >
              {isLoading ? (
                <div className="w-full h-full bg-gray-100 rounded-2xl flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : mapMarkers.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-sm text-gray-400">No map data available</p>
                </div>
              ) : (
                <LeafletMap
                  markers={mapMarkers}
                  selected={selected}
                  onSelect={handleSelect}
                  height="100%"
                  accentColor={activeTab?.color || '#1286f5'}
                />
              )}
            </div>
          </div>
        )}

      </div>
      <Footer />
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading search…</p>
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}