'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/public/Navbar'
import Footer from '@/components/public/Footer'
import DoctorCard from '@/components/public/DoctorCard'
import EmptyState from '@/components/ui/EmptyState'
import { SkeletonCard } from '@/components/ui/Skeleton'

const fetcher = (url) => fetch(url).then((r) => r.json()).then((j) => j.data)

const SPECIALIZATIONS = [
  'Cardiologist','Neurologist','Gynecologist','Dermatologist',
  'Orthopedic Surgeon','General Physician','Pediatrician','Diabetologist',
]

function SearchInput({ value, onChange }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ position:'relative' }}>
      <span style={{ position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',fontSize:16,pointerEvents:'none' }}>🔍</span>
      <input
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Search doctors…"
        style={{
          width:'100%',padding:'11px 14px 11px 38px',fontSize:13,fontFamily:'inherit',
          borderRadius:12,border:`1.5px solid ${focused?'#8b5cf6':'#e2e8f0'}`,
          background:'#fff',color:'#0f172a',outline:'none',
          boxShadow: focused?'0 0 0 3px rgba(139,92,246,0.12)':'0 1px 3px rgba(0,0,0,0.06)',
          transition:'all .15s ease',boxSizing:'border-box',
        }}
      />
    </div>
  )
}

function SpecPill({ label, active, onClick }) {
  const [h, setH] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        padding:'6px 14px',borderRadius:100,
        fontSize:12,fontWeight:500,
        background: active
          ? 'linear-gradient(135deg,#8b5cf6,#7c3aed)'
          : h ? '#e2e8f0' : '#f1f5f9',
        color: active ? '#fff' : '#64748b',
        border:'none',cursor:'pointer',whiteSpace:'nowrap',
        boxShadow: active ? '0 2px 8px rgba(139,92,246,0.35)' : 'none',
        transition:'all .15s ease',
        transform: active ? 'scale(1.02)' : 'scale(1)',
        flexShrink:0,
      }}
    >
      {label}
    </button>
  )
}

export default function DoctorsPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [spec,   setSpec]   = useState('')

  const qs = new URLSearchParams({ limit:20 })
  if (search) qs.set('search', search)
  if (spec)   qs.set('specialization', spec)

  const { data, isLoading } = useSWR(`/api/doctors?${qs}`, fetcher)
  const doctors = data?.doctors || data || []

  return (
    <div style={{ minHeight:'100vh',background:'#f8fafc' }}>
      <Navbar />

      <div style={{
        maxWidth:1280,margin:'0 auto',
        padding:'clamp(80px,10vw,96px) clamp(16px,3vw,32px) 64px',
      }}>
        {/* Header */}
        <div style={{ marginBottom:24 }}>
          <h1 style={{ fontSize:'clamp(22px,3vw,32px)',fontWeight:800,color:'#0f172a',margin:'0 0 6px' }}>
            Find Doctors
          </h1>
          <p style={{ fontSize:14,color:'#64748b',margin:0 }}>
            Book appointments with verified doctors — in-person or online
          </p>
        </div>

        {/* Search */}
        <div style={{ maxWidth:400,marginBottom:20 }}>
          <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {/* Specialization pills */}
        <div style={{ display:'flex',flexWrap:'wrap',gap:8,marginBottom:28 }}>
          <SpecPill
            label="All"
            active={!spec}
            onClick={() => setSpec('')}
          />
          {SPECIALIZATIONS.map((s) => (
            <SpecPill
              key={s}
              label={s}
              active={spec === s}
              onClick={() => setSpec(spec===s?'':s)}
            />
          ))}
        </div>

        {/* Count */}
        <p style={{ fontSize:13,color:'#94a3b8',marginBottom:16 }}>
          {isLoading ? 'Searching…' : `${Array.isArray(doctors)?doctors.length:0} doctor${doctors.length!==1?'s':''} found`}
        </p>

        {/* Grid */}
        {isLoading ? (
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:20 }}>
            {[1,2,3,4,5,6].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : !doctors?.length ? (
          <EmptyState
            title="No doctors found"
            message="Try adjusting your search or specialization filter"
          />
        ) : (
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:20 }}>
            {(Array.isArray(doctors)?doctors:[]).map((d) => (
              <DoctorCard
                key={d.id}
                doctor={d}
                onClick={() => router.push(`/doctors/${d.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}