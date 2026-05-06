// src/app/(public)/hospitals/page.js
'use client'

import { useState, useMemo, useCallback } from 'react'
import dynamic from 'next/dynamic'
import useSWR from 'swr'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/public/Navbar'
import Footer from '@/components/public/Footer'
import HospitalCard from '@/components/public/HospitalCard'
import Input from '@/components/ui/Input'
import { SkeletonCard } from '@/components/ui/Skeleton'
import EmptyState from '@/components/ui/EmptyState'
import { Search } from 'lucide-react'

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

const VIEWS = [
  { key: 'list',  label: 'List',  icon: '▤' },
  { key: 'split', label: 'Split', icon: '⊞' },
  { key: 'map',   label: 'Map',   icon: '🗺' },
]

export default function HospitalsPage() {
  const router = useRouter()
  const [search,   setSearch]   = useState('')
  const [city,     setCity]     = useState('')
  const [view,     setView]     = useState('split')
  const [selected, setSelected] = useState(null)

  const qs = new URLSearchParams({ limit: 50, isApproved: 'true' })
  if (search) qs.set('search', search)
  if (city)   qs.set('city',   city)

  const { data, isLoading } = useSWR(`/api/hospitals?${qs}`, fetcher)
  const hospitals = data?.hospitals || []

  const mapMarkers = useMemo(() =>
    hospitals
      .filter((h) => h.location?.coordinates?.length === 2)
      .map((h) => ({
        id:      h.id,
        lat:     h.location.coordinates[1],
        lng:     h.location.coordinates[0],
        name:    h.name,
        address: [h.address?.line1, h.address?.city, h.address?.state].filter(Boolean).join(', '),
        rating:  h.rating?.average > 0 ? `${h.rating.average.toFixed(1)} (${h.rating.count} reviews)` : null,
        color:   '#1286f5',
        emoji:   '🏥',
        href:    `/hospitals/${h.id}`,
        extra:   (h.departments || []).length > 0
          ? `<p style="font-size:11px;color:#6b7280;margin:0 0 4px;">🏥 ${h.departments.slice(0, 3).join(' · ')}</p>`
          : '',
      })),
    [hospitals]
  )

  const handleSelect = useCallback((item) => {
    const h = hospitals.find((x) => x.id === item.id)
    setSelected((prev) => prev?.id === item.id ? null : h)
  }, [hospitals])

  // ── Shared card grid content ──────────────────────────────────────────────
  const CardGrid = ({ cols }) => {
    if (isLoading) {
      return (
        <div className={cols}>
          {[1,2,3,4,5,6].map((i) => <SkeletonCard key={i} />)}
        </div>
      )
    }
    if (!hospitals.length) {
      return <EmptyState title="No hospitals found" message="Try adjusting your search" />
    }
    return (
      <div className={cols}>
        {hospitals.map((h) => (
          <div
            key={h.id}
            className={selected?.id === h.id
              ? 'rounded-2xl cursor-pointer ring-2 ring-blue-500 ring-offset-1'
              : 'rounded-2xl cursor-pointer hover:ring-1 hover:ring-gray-200'}
            onClick={() => setSelected((prev) => prev?.id === h.id ? null : h)}
          >
            <HospitalCard hospital={h} onClick={() => router.push(`/hospitals/${h.id}`)} />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 mt-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Hospitals</h1>
            <p className="text-gray-400 text-sm mt-0.5">
              {isLoading ? 'Finding hospitals…' : `${hospitals.length} hospital${hospitals.length !== 1 ? 's' : ''} found`}
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
        <div className="flex flex-wrap gap-2 mb-5">
          <div className="flex-1 min-w-[180px] max-w-xs">
            <Input
              placeholder="Search hospitals…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
        </div>

        {/* ── LIST view ── */}
        {view === 'list' && (
          <CardGrid cols="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" />
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
              accentColor="#1286f5"
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
              ) : !hospitals.length ? (
                <EmptyState title="No hospitals found" message="Try adjusting your search" />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 lg:max-h-[calc(100vh-240px)] lg:overflow-y-auto lg:pr-1">
                  {hospitals.map((h) => (
                    <div
                      key={h.id}
                      className={selected?.id === h.id
                        ? 'rounded-2xl cursor-pointer ring-2 ring-blue-500 ring-offset-1'
                        : 'rounded-2xl cursor-pointer hover:ring-1 hover:ring-gray-200'}
                      onClick={() => setSelected((prev) => prev?.id === h.id ? null : h)}
                    >
                      <HospitalCard hospital={h} onClick={() => router.push(`/hospitals/${h.id}`)} />
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
                accentColor="#1286f5"
              />
            </div>

          </div>
        )}

      </div>
      <Footer />
    </div>
  )
}