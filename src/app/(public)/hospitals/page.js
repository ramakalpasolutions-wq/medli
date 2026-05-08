'use client'

import { useState, useMemo, useCallback } from 'react'
import dynamic from 'next/dynamic'
import useSWR from 'swr'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/public/Navbar'
import Footer from '@/components/public/Footer'
import HospitalCard from '@/components/public/HospitalCard'
import EmptyState from '@/components/ui/EmptyState'
import { SkeletonCard } from '@/components/ui/Skeleton'

const LeafletMap = dynamic(() => import('@/components/maps/LeafletMap'), {
  ssr: false,
  loading: () => (
    <div style={{
      width:'100%',height:'100%',borderRadius:20,
      background:'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)',
      backgroundSize:'200% 100%',animation:'shimmer 1.5s linear infinite',
      display:'flex',alignItems:'center',justifyContent:'center',
      minHeight:300,
    }}>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <p style={{ fontSize:12,color:'#94a3b8' }}>Loading map…</p>
    </div>
  ),
})

const fetcher = (url) => fetch(url).then((r) => r.json()).then((j) => j.data)

const VIEWS = [
  { key:'list',  label:'List',  icon:'▤' },
  { key:'split', label:'Split', icon:'⊞' },
  { key:'map',   label:'Map',   icon:'🗺' },
]

function SearchInput({ value, onChange, placeholder }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ position:'relative' }}>
      <span style={{
        position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',
        fontSize:16,pointerEvents:'none',
      }}>🔍</span>
      <input
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        style={{
          width:'100%',padding:'10px 14px 10px 38px',
          fontSize:13,fontFamily:'inherit',
          borderRadius:12,
          border:`1.5px solid ${focused ? '#6366f1' : '#e2e8f0'}`,
          background:'#fff',color:'#0f172a',outline:'none',
          boxShadow: focused ? '0 0 0 3px rgba(99,102,241,0.12)' : '0 1px 3px rgba(0,0,0,0.06)',
          transition:'all .15s ease',boxSizing:'border-box',
        }}
      />
    </div>
  )
}

function ViewToggle({ view, onChange, color = '#6366f1' }) {
  return (
    <div style={{
      display:'flex',gap:3,
      background:'#f1f5f9',borderRadius:12,padding:3,
    }}>
      {VIEWS.map((v) => (
  <ViewBtn 
    key={v.key} 
    label={v.label} 
    icon={v.icon} 
    active={view === v.key} 
    color="#6366f1" 
    onClick={() => onChange(v.key)} 
  />
))}
    </div>
  )
}

function ViewBtn({ label, icon, active, onClick }) {
  const [h, setH] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        display:'flex',alignItems:'center',gap:6,
        padding:'7px 12px',borderRadius:9,
        fontSize:12,fontWeight: active?600:500,
        background: active ? '#fff' : h ? 'rgba(255,255,255,0.5)' : 'transparent',
        color: active ? '#0f172a' : '#64748b',
        border:'none',cursor:'pointer',
        boxShadow: active ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
        transition:'all .15s ease',
      }}
    >
      <span>{icon}</span><span>{label}</span>
    </button>
  )
}

export default function HospitalsPage() {
  const router = useRouter()
  const [search,   setSearch]   = useState('')
  const [city,     setCity]     = useState('')
  const [view,     setView]     = useState('split')
  const [selected, setSelected] = useState(null)

  const qs = new URLSearchParams({ limit:50, isApproved:'true' })
  if (search) qs.set('search', search)
  if (city)   qs.set('city', city)

  const { data, isLoading } = useSWR(`/api/hospitals?${qs}`, fetcher)
  const hospitals = data?.hospitals || []

  const mapMarkers = useMemo(() =>
    hospitals
      .filter((h) => h.location?.coordinates?.length === 2)
      .map((h) => ({
        id:    h.id,
        lat:   h.location.coordinates[1],
        lng:   h.location.coordinates[0],
        name:  h.name,
        address: [h.address?.line1,h.address?.city,h.address?.state].filter(Boolean).join(', '),
        rating: h.rating?.average > 0 ? `${h.rating.average.toFixed(1)} (${h.rating.count})` : null,
        color: '#6366f1', emoji:'🏥', href:`/hospitals/${h.id}`,
        extra: (h.departments||[]).length > 0
          ? `<p style="font-size:11px;color:#6b7280;margin:0 0 4px;">🏥 ${h.departments.slice(0,3).join(' · ')}</p>` : '',
      }))
  , [hospitals])

  const handleSelect = useCallback((item) => {
    const h = hospitals.find((x) => x.id === item.id)
    setSelected((prev) => prev?.id === item.id ? null : h)
  }, [hospitals])

  const Cards = ({ style: extraStyle }) => {
    if (isLoading) return (
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16, ...extraStyle }}>
        {[1,2,3,4,5,6].map((i) => <SkeletonCard key={i} />)}
      </div>
    )
    if (!hospitals.length) return <EmptyState title="No hospitals found" message="Try adjusting your search" />
    return (
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16, ...extraStyle }}>
        {hospitals.map((h) => (
          <SelectedWrapper
            key={h.id}
            selected={selected?.id === h.id}
            color="#6366f1"
            onClick={() => setSelected((p) => p?.id===h.id ? null : h)}
          >
            <HospitalCard hospital={h} onClick={() => router.push(`/hospitals/${h.id}`)} />
          </SelectedWrapper>
        ))}
      </div>
    )
  }

  return (
    <>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <div style={{ minHeight:'100vh', background:'#f8fafc' }}>
        <Navbar />

        <div style={{
          maxWidth:1280,margin:'0 auto',
          padding:'clamp(80px,10vw,96px) clamp(16px,3vw,32px) 64px',
        }}>
          {/* Header */}
          <div style={{
            display:'flex',flexWrap:'wrap',
            alignItems:'center',justifyContent:'space-between',
            gap:12,marginBottom:20,
          }}>
            <div>
              <h1 style={{ fontSize:'clamp(20px,3vw,28px)',fontWeight:800,color:'#0f172a',margin:0 }}>
                Hospitals
              </h1>
              <p style={{ fontSize:13,color:'#94a3b8',marginTop:4 }}>
                {isLoading ? 'Finding hospitals…' : `${hospitals.length} found`}
              </p>
            </div>
        <ViewToggle view={view} onChange={setView} color="#6366f1" />
          </div>

          {/* Filters */}
          <div style={{ display:'flex',flexWrap:'wrap',gap:10,marginBottom:20 }}>
            <div style={{ flex:1,minWidth:160,maxWidth:320 }}>
              <SearchInput
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search hospitals…"
              />
            </div>
            <div style={{ width:120 }}>
              <SearchInput
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City"
              />
            </div>
          </div>

          {/* Views */}
          {view === 'list' && <Cards />}

          {view === 'map' && (
            <div style={{ borderRadius:20,overflow:'hidden',height:'calc(100vh - 220px)',minHeight:400 }}>
              <LeafletMap markers={mapMarkers} selected={selected} onSelect={handleSelect} height="100%" accentColor="#6366f1" />
            </div>
          )}

          {view === 'split' && (
            <div style={{ display:'flex',gap:16,flexWrap:'wrap' }}>
              <div style={{ width:'100%',maxWidth:420,flexShrink:0 }}>
                {isLoading ? (
                  <div style={{ display:'grid',gap:12 }}>
                    {[1,2,3,4].map((i) => <SkeletonCard key={i} />)}
                  </div>
                ) : !hospitals.length ? (
                  <EmptyState title="No hospitals found" />
                ) : (
                  <div style={{
                    display:'grid',gap:12,
                    maxHeight:'calc(100vh - 240px)',
                    overflowY:'auto',paddingRight:4,
                  }}>
                    {hospitals.map((h) => (
                      <SelectedWrapper
                        key={h.id}
                        selected={selected?.id === h.id}
                        color="#6366f1"
                        onClick={() => setSelected((p) => p?.id===h.id ? null : h)}
                      >
                        <HospitalCard hospital={h} onClick={() => router.push(`/hospitals/${h.id}`)} />
                      </SelectedWrapper>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ flex:1,minWidth:320,borderRadius:20,overflow:'hidden',height:'clamp(320px,50vw,calc(100vh-240px))',minHeight:320 }}>
                <LeafletMap markers={mapMarkers} selected={selected} onSelect={handleSelect} height="100%" accentColor="#6366f1" />
              </div>
            </div>
          )}
        </div>
        <Footer />
      </div>
    </>
  )
}

function SelectedWrapper({ children, selected, color, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        borderRadius:20,cursor:'pointer',
        outline: selected ? `2.5px solid ${color}` : '2.5px solid transparent',
        outlineOffset:2,
        transition:'outline .15s ease',
      }}
    >
      {children}
    </div>
  )
}