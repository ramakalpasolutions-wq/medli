// C:\Users\ASUS\medli2\src\app\(public)\labs\page.js
'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import dynamic       from 'next/dynamic'
import useSWR        from 'swr'
import { useRouter } from 'next/navigation'
import Navbar        from '@/components/public/Navbar'
import Footer        from '@/components/public/Footer'
import LabCard       from '@/components/public/LabCard'
import EmptyState    from '@/components/ui/EmptyState'
import { SkeletonCard } from '@/components/ui/Skeleton'

const LeafletMap = dynamic(() => import('@/components/maps/LeafletMap'), {
  ssr: false,
  loading: () => (
    <div style={{
      width:'100%', height:'100%', borderRadius:20, minHeight:300,
      background:'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)',
      backgroundSize:'200% 100%', animation:'shimmer 1.5s linear infinite',
      display:'flex', alignItems:'center', justifyContent:'center',
    }}>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <p style={{ fontSize:12, color:'#94a3b8' }}>Loading map…</p>
    </div>
  ),
})

const fetcher = (url) =>
  fetch(url).then((r) => r.json()).then((j) => j.data)

const VIEWS = [
  { key:'list',  label:'List',  icon:'▤' },
  { key:'split', label:'Split', icon:'⊞' },
  { key:'map',   label:'Map',   icon:'🗺' },
]

const VIEW_STORAGE_KEY = 'medli_labs_view'

function SearchInput({ value, onChange, placeholder, icon = '🔍' }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ position:'relative' }}>
      <span style={{
        position:'absolute', left:12, top:'50%',
        transform:'translateY(-50%)', fontSize:16, pointerEvents:'none',
      }}>
        {icon}
      </span>
      <input
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        style={{
          width:'100%', padding:'10px 14px 10px 38px',
          fontSize:13, fontFamily:'inherit',
          borderRadius:12, border:`1.5px solid ${focused?'#10b981':'#e2e8f0'}`,
          background:'#fff', color:'#0f172a', outline:'none',
          boxShadow: focused
            ? '0 0 0 3px rgba(16,185,129,0.12)'
            : '0 1px 3px rgba(0,0,0,0.06)',
          transition:'all .15s ease', boxSizing:'border-box',
        }}
      />
    </div>
  )
}

function ViewToggle({ view, onChange, color = '#10b981' }) {
  return (
    <div style={{
      display:'flex', gap:3,
      background:'#f1f5f9', borderRadius:12, padding:3,
    }}>
      {VIEWS.map((v) => (
        <ViewBtn
          key={v.key}
          label={v.label}
          icon={v.icon}
          active={view === v.key}
          color={color}
          onClick={() => onChange(v.key)}
        />
      ))}
    </div>
  )
}

function ViewBtn({ label, icon, active, color, onClick }) {
  const [h, setH] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        display:'flex', alignItems:'center', gap:5,
        padding:'7px 12px', borderRadius:9,
        fontSize:12, fontWeight: active?600:500,
        background: active?'#fff' : h?'rgba(255,255,255,0.5)':'transparent',
        color: active?'#0f172a':'#64748b',
        border:'none', cursor:'pointer',
        boxShadow: active?'0 1px 4px rgba(0,0,0,0.1)':'none',
        transition:'all .15s ease',
      }}
    >
      <span>{icon}</span><span>{label}</span>
    </button>
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
        display:'flex', alignItems:'center', gap:8,
        padding:'9px 14px', borderRadius:12,
        border:`1.5px solid ${checked?'#10b981': h?'#a7f3d0':'#e2e8f0'}`,
        background: checked
          ? 'rgba(16,185,129,0.08)'
          : h ? 'rgba(16,185,129,0.04)' : '#fff',
        color: checked?'#059669':'#64748b',
        fontSize:13, fontWeight:500, cursor:'pointer',
        transition:'all .15s ease',
      }}
    >
      <span style={{ fontSize:16 }}>🏠</span>
      Home Collection
      {checked && <span style={{ fontSize:14, color:'#10b981' }}>✓</span>}
    </button>
  )
}

export default function LabsPage() {
  const router = useRouter()

  const [search,   setSearch]   = useState('')
  const [city,     setCity]     = useState('')
  const [homeOnly, setHomeOnly] = useState(false)
  const [selected, setSelected] = useState(null)

  /* ─────────────────────────────────────────────────────────────
     ✅ Default view = 'list'
     ✅ Then load saved preference from localStorage on mount
  ───────────────────────────────────────────────────────────── */
  const [view, setView] = useState('list')

  useEffect(() => {
    try {
      const saved = localStorage.getItem(VIEW_STORAGE_KEY)
      if (saved && ['list', 'split', 'map'].includes(saved)) {
        setView(saved)
      }
    } catch {
      /* localStorage blocked — keep default 'list' */
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, view)
    } catch {
      /* silent fail */
    }
  }, [view])

  /* ─────────────────────────────────────────────────────────────
     Data fetching
  ───────────────────────────────────────────────────────────── */
  const qs = new URLSearchParams({ limit: 50, isApproved: 'true' })
  if (search) qs.set('search', search)
  if (city)   qs.set('city',   city)

  const { data, isLoading } = useSWR(`/api/labs?${qs}`, fetcher)
  const allLabs = data?.labs || []
  const labs    = homeOnly
    ? allLabs.filter((l) => l.homeCollection?.enabled)
    : allLabs

  const mapMarkers = useMemo(() =>
    labs
      .filter((l) => l.location?.coordinates?.length === 2)
      .map((l) => ({
        id:    l.id,
        lat:   l.location.coordinates[1],
        lng:   l.location.coordinates[0],
        name:  l.name,
        address: [l.address?.line1, l.address?.city, l.address?.state].filter(Boolean).join(', '),
        rating: l.rating?.average > 0
                  ? `${l.rating.average.toFixed(1)} (${l.rating.count})`
                  : null,
        color: '#10b981',
        emoji: '🧪',
        href:  `/labs/${l.id}`,
        extra: [
          l.homeCollection?.enabled
            ? `<p style="font-size:11px;color:#10b981;margin:0 0 4px;">🏠 Home Collection</p>`
            : '',
          (l.certifications || []).length > 0
            ? `<p style="font-size:11px;color:#6b7280;margin:0 0 4px;">🏅 ${l.certifications.join(' · ')}</p>`
            : '',
        ].join(''),
      }))
  , [labs])

  const handleSelect = useCallback((item) => {
    setSelected((prev) =>
      prev?.id === item.id ? null : labs.find((x) => x.id === item.id)
    )
  }, [labs])

  return (
    <>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <div style={{ minHeight:'100vh', background:'#f8fafc' }}>
        <Navbar />

        <div style={{
          maxWidth:1280, margin:'0 auto',
          padding:'clamp(80px,10vw,96px) clamp(16px,3vw,32px) 64px',
        }}>
          {/* Header */}
          <div style={{
            display:'flex', flexWrap:'wrap',
            alignItems:'center', justifyContent:'space-between',
            gap:12, marginBottom:20,
          }}>
            <div>
              <h1 style={{
                fontSize:'clamp(20px,3vw,28px)',
                fontWeight:800, color:'#0f172a', margin:0,
              }}>
                🧪 Diagnostic Labs
              </h1>
              <p style={{ fontSize:13, color:'#94a3b8', marginTop:4 }}>
                {isLoading
                  ? 'Finding labs…'
                  : `${labs.length} lab${labs.length !== 1 ? 's' : ''} found`}
              </p>
            </div>
            <ViewToggle view={view} onChange={setView} color="#10b981" />
          </div>

          {/* Filters */}
          <div style={{ display:'flex', flexWrap:'wrap', gap:10, marginBottom:20 }}>
            <div style={{ flex:1, minWidth:160, maxWidth:280 }}>
              <SearchInput
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search labs…"
              />
            </div>
            <div style={{ width:120 }}>
              <SearchInput
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City"
                icon="📍"
              />
            </div>
            <HomeToggle checked={homeOnly} onChange={setHomeOnly} />
            {(search || city || homeOnly) && (
              <button
                onClick={() => { setSearch(''); setCity(''); setHomeOnly(false) }}
                style={{
                  padding:'10px 16px', borderRadius:12,
                  border:'1.5px solid #fca5a5',
                  background:'#fff1f2', color:'#ef4444',
                  fontSize:12, fontWeight:600, cursor:'pointer',
                }}
              >
                Clear ✕
              </button>
            )}
          </div>

          {/* List view */}
          {view === 'list' && (
            isLoading ? (
              <div style={{
                display:'grid',
                gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',
                gap:16,
              }}>
                {[1,2,3,4,5,6].map((i) => <SkeletonCard key={i} />)}
              </div>
            ) : !labs.length ? (
              <EmptyState
                title="No labs found"
                message={homeOnly ? 'No home collection labs in this area' : 'Try adjusting your search'}
              />
            ) : (
              <div style={{
                display:'grid',
                gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',
                gap:16,
              }}>
                {labs.map((l) => (
                  <LabCard
                    key={l.id}
                    lab={l}
                    onClick={() => router.push(`/labs/${l.id}`)}
                  />
                ))}
              </div>
            )
          )}

          {/* Map view */}
          {view === 'map' && (
            <div style={{
              borderRadius:20, overflow:'hidden',
              height:'calc(100vh - 220px)', minHeight:400,
            }}>
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
            <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
              <div style={{ width:'100%', maxWidth:420, flexShrink:0 }}>
                {isLoading ? (
                  <div style={{ display:'grid', gap:12 }}>
                    {[1,2,3,4].map((i) => <SkeletonCard key={i} />)}
                  </div>
                ) : !labs.length ? (
                  <EmptyState
                    title="No labs found"
                    message={homeOnly ? 'No home collection labs in this area' : 'Try adjusting your search'}
                  />
                ) : (
                  <div style={{
                    display:'grid', gap:12,
                    maxHeight:'calc(100vh - 240px)',
                    overflowY:'auto', paddingRight:4,
                  }}>
                    {labs.map((l) => (
                      <div
                        key={l.id}
                        onClick={() =>
                          setSelected((p) => p?.id === l.id ? null : l)
                        }
                        style={{
                          borderRadius:20, cursor:'pointer',
                          outline: selected?.id === l.id
                            ? '2.5px solid #10b981'
                            : '2.5px solid transparent',
                          outlineOffset:2,
                          transition:'outline .15s ease',
                        }}
                      >
                        <LabCard
                          lab={l}
                          onClick={() => router.push(`/labs/${l.id}`)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{
                flex:1, minWidth:320, borderRadius:20, overflow:'hidden',
                height:'clamp(320px,50vw,calc(100vh - 240px))',
                minHeight:320,
              }}>
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