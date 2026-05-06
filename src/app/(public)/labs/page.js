// src/app/(public)/labs/page.js
'use client'

import { useState, useMemo, useCallback } from 'react'
import dynamic from 'next/dynamic'
import useSWR from 'swr'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/public/Navbar'
import Footer from '@/components/public/Footer'
import LabCard from '@/components/public/LabCard'
import Input from '@/components/ui/Input'
import { SkeletonCard } from '@/components/ui/Skeleton'
import EmptyState from '@/components/ui/EmptyState'
import { Search, Home } from 'lucide-react'

const LeafletMap = dynamic(() => import('@/components/maps/LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full rounded-2xl bg-gray-100 flex items-center justify-center min-h-[300px]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-gray-400">Loading map…</p>
      </div>
    </div>
  ),
})

const fetcher = (url) => fetch(url).then((r) => r.json()).then((j) => j.data)

const VIEWS = [
  { key: 'list',  label: 'List',  icon: '▤' },
  { key: 'split', label: 'Split', icon: '⊞' },
  { key: 'map',   label: 'Map',   icon: '🗺' },
]

export default function LabsPage() {
  const router = useRouter()
  const [search,   setSearch]   = useState('')
  const [city,     setCity]     = useState('')
  const [view,     setView]     = useState('split')
  const [homeOnly, setHomeOnly] = useState(false)
  const [selected, setSelected] = useState(null)

  const qs = new URLSearchParams({ limit: 50, isApproved: 'true' })
  if (search) qs.set('search', search)
  if (city)   qs.set('city',   city)

  const { data, isLoading } = useSWR(`/api/labs?${qs}`, fetcher)
  const allLabs = data?.labs || []
  const labs    = homeOnly ? allLabs.filter((l) => l.homeCollection?.enabled) : allLabs

  const mapMarkers = useMemo(() =>
    labs
      .filter((l) => l.location?.coordinates?.length === 2)
      .map((l) => ({
        id:      l.id,
        lat:     l.location.coordinates[1],
        lng:     l.location.coordinates[0],
        name:    l.name,
        address: [l.address?.line1, l.address?.city, l.address?.state].filter(Boolean).join(', '),
        rating:  l.rating?.average > 0 ? `${l.rating.average.toFixed(1)} (${l.rating.count} reviews)` : null,
        color:   '#10b981',
        emoji:   '🧪',
        href:    `/labs/${l.id}`,
        extra: [
          l.homeCollection?.enabled ? `<p style="font-size:11px;color:#10b981;margin:0 0 4px;">🏠 Home Collection</p>` : '',
          (l.certifications || []).length > 0 ? `<p style="font-size:11px;color:#6b7280;margin:0 0 4px;">🏅 ${l.certifications.join(' · ')}</p>` : '',
        ].join(''),
      })),
    [labs]
  )

  const handleSelect = useCallback((item) => {
    const l = labs.find((x) => x.id === item.id)
    setSelected((prev) => prev?.id === item.id ? null : l)
  }, [labs])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 mt-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Diagnostic Labs</h1>
            <p className="text-gray-400 text-sm mt-0.5">
              {isLoading ? 'Finding labs…' : `${labs.length} lab${labs.length !== 1 ? 's' : ''} found`}
            </p>
          </div>

          {/* View toggle */}
          <div className="flex gap-1 bg-gray-200 rounded-xl p-1 self-start sm:self-auto">
            {VIEWS.map((v) => (
              <button
                key={v.key}
                onClick={() => setView(v.key)}
                className={view === v.key
                  ? 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white text-gray-900 shadow-sm'
                  : 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-700'}
              >
                <span>{v.icon}</span>
                <span>{v.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Filters ── */}
        <div className="flex flex-wrap gap-2 mb-5 items-center">
          <div className="flex-1 min-w-[160px] max-w-xs">
            <Input
              placeholder="Search labs…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-gray-400" />}
            />
          </div>
          <div className="w-28">
            <Input
              placeholder="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>
          <button
            onClick={() => setHomeOnly(!homeOnly)}
            className={homeOnly
              ? 'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border-2 border-green-500 bg-green-50 text-green-700'
              : 'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border-2 border-gray-200 bg-white text-gray-600 hover:border-green-300'}
          >
            <Home className="w-4 h-4" />
            <span>Home Collection</span>
            {homeOnly && <span className="text-green-500">✓</span>}
          </button>
        </div>

        {/* ── LIST view ── */}
        {view === 'list' && (
          <div>
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1,2,3,4,5,6].map((i) => <SkeletonCard key={i} />)}
              </div>
            ) : !labs.length ? (
              <EmptyState
                title="No labs found"
                message={homeOnly ? 'No home collection labs available' : 'Try adjusting your search'}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {labs.map((l) => (
                  <LabCard key={l.id} lab={l} onClick={() => router.push(`/labs/${l.id}`)} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── MAP view ── */}
        {view === 'map' && (
          <div
            className="rounded-2xl overflow-hidden w-full"
            style={{ height: 'calc(100vh - 220px)', minHeight: 400 }}
          >
            <LeafletMap
              markers={mapMarkers}
              selected={selected}
              onSelect={handleSelect}
              height="100%"
              accentColor="#10b981"
            />
          </div>
        )}

        {/* ── SPLIT view ── */}
        {view === 'split' && (
          <div className="flex flex-col lg:flex-row gap-4">

            {/* Cards column */}
            <div className="w-full lg:w-96 flex-shrink-0">
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                  {[1,2,3,4].map((i) => <SkeletonCard key={i} />)}
                </div>
              ) : !labs.length ? (
                <EmptyState
                  title="No labs found"
                  message={homeOnly ? 'No home collection labs' : 'Try adjusting search'}
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 lg:max-h-[calc(100vh-240px)] lg:overflow-y-auto lg:pr-1">
                  {labs.map((l) => (
                    <div
                      key={l.id}
                      className={selected?.id === l.id
                        ? 'rounded-2xl cursor-pointer ring-2 ring-green-500 ring-offset-1'
                        : 'rounded-2xl cursor-pointer hover:ring-1 hover:ring-gray-200'}
                      onClick={() => setSelected((prev) => prev?.id === l.id ? null : l)}
                    >
                      <LabCard lab={l} onClick={() => router.push(`/labs/${l.id}`)} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Map column */}
            <div
              className="flex-1 rounded-2xl overflow-hidden"
              style={{ height: 'clamp(320px, 50vw, calc(100vh - 240px))', minHeight: 320 }}
            >
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
  )
}