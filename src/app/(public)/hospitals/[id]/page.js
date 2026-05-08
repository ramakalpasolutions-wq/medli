'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import Navbar from '@/components/public/Navbar'
import Footer from '@/components/public/Footer'
import DoctorCard from '@/components/public/DoctorCard'
import Badge, { getStatusVariant } from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import { SkeletonCard } from '@/components/ui/Skeleton'

const fetcher = (url) => fetch(url).then((r) => r.json()).then((j) => j.data)

const TABS = [
  { key:'doctors', label:'Doctors' },
  { key:'about',   label:'About'   },
  { key:'gallery', label:'Gallery' },
]

function TabBar({ tabs, active, onChange }) {
  return (
    <div style={{
      display:'flex',gap:4,
      background:'#f1f5f9',borderRadius:14,padding:4,
      marginBottom:24,
    }}>
     
{tabs.map((t) => (
  <TabBtn 
    key={t.key} 
    label={t.label} 
    emoji={t.emoji} // or icon={t.icon}
    count={t.count}
    active={active === t.key} 
    onClick={() => onChange(t.key)} 
  />
))}
    </div>
  )
}

function TabBtn({ label, count, active, onClick }) {
  const [h, setH] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:6,
        padding:'9px 14px',borderRadius:10,
        fontSize:13,fontWeight: active?600:500,
        color: active?'#0f172a':h?'#334155':'#64748b',
        background: active?'#fff': h?'rgba(255,255,255,0.5)':'transparent',
        border:'none',cursor:'pointer',
        boxShadow: active?'0 1px 4px rgba(0,0,0,0.1)':'none',
        transition:'all .15s ease',
      }}
    >
      {label}
      {count !== undefined && (
        <span style={{
          padding:'1px 7px',borderRadius:100,fontSize:11,fontWeight:600,
          background: active?'rgba(99,102,241,0.12)':'#e2e8f0',
          color: active?'#6366f1':'#94a3b8',
        }}>{count}</span>
      )}
    </button>
  )
}

export default function HospitalPage({ params }) {
  const { id } = use(params)
  const router = useRouter()
  const [tab, setTab] = useState('doctors')
  const [imgHover, setImgHover] = useState(null)

  const { data: hospital, isLoading } = useSWR(`/api/hospitals/${id}`, fetcher)
  const { data: doctorsData, isLoading: dLoading } = useSWR(`/api/hospitals/${id}/doctors`, fetcher)

  if (isLoading) {
    return (
      <div style={{ minHeight:'100vh',background:'#f8fafc' }}>
        <Navbar />
        <div style={{ maxWidth:800,margin:'0 auto',padding:'100px 16px 64px' }}>
          <SkeletonCard />
        </div>
        <Footer />
      </div>
    )
  }

  if (!hospital) {
    return (
      <div style={{ minHeight:'100vh',background:'#f8fafc' }}>
        <Navbar />
        <div style={{ paddingTop:96 }}>
          <EmptyState title="Hospital not found" />
        </div>
        <Footer />
      </div>
    )
  }

  const tabsConfig = [
    { key:'doctors', label:'Doctors', count: doctorsData?.length || 0 },
    { key:'about',   label:'About'   },
    { key:'gallery', label:'Gallery', count: hospital.images?.gallery?.length || 0 },
  ]

  return (
    <div style={{ minHeight:'100vh',background:'#f8fafc' }}>
      <Navbar />

      {/* Hero */}
      <div style={{
        position:'relative',height:260,
        background:'linear-gradient(135deg,#4f46e5,#2563eb)',
        overflow:'hidden',marginTop:64,
      }}>
        {hospital.images?.cover && (
          <img src={hospital.images.cover} alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }} />
        )}
        <div style={{ position:'absolute',inset:0,background:'linear-gradient(to top,rgba(0,0,0,0.65),rgba(0,0,0,0.1))' }} />

        <div style={{
          position:'absolute',bottom:0,left:0,right:0,
          padding:'0 clamp(16px,3vw,32px) 20px',
          display:'flex',alignItems:'flex-end',gap:16,
          flexWrap:'wrap',
        }}>
          {/* Logo */}
          <div style={{
            width:60,height:60,borderRadius:16,
            background:'#fff',border:'3px solid #fff',
            display:'flex',alignItems:'center',justifyContent:'center',
            fontSize:28,boxShadow:'0 6px 20px rgba(0,0,0,0.15)',
            overflow:'hidden',flexShrink:0,
          }}>
            {hospital.images?.logo
              ? <img src={hospital.images.logo} alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }}/>
              : '🏥'}
          </div>
          <div style={{ flex:1,minWidth:0 }}>
            <h1 style={{ fontSize:'clamp(18px,3vw,24px)',fontWeight:800,color:'#fff',margin:'0 0 4px',lineHeight:1.2 }}>
              {hospital.name}
            </h1>
            {hospital.address?.city && (
              <p style={{ fontSize:13,color:'rgba(255,255,255,0.8)',margin:0 }}>
                📍 {hospital.address.city}{hospital.address.state ? `, ${hospital.address.state}` : ''}
              </p>
            )}
          </div>
          {hospital.rating?.average > 0 && (
            <div style={{
              display:'flex',alignItems:'center',gap:6,
              background:'rgba(255,255,255,0.92)',backdropFilter:'blur(8px)',
              borderRadius:100,padding:'6px 14px',flexShrink:0,
            }}>
              <span>⭐</span>
              <span style={{ fontSize:14,fontWeight:700,color:'#1e293b' }}>
                {hospital.rating.average.toFixed(1)}
              </span>
              <span style={{ fontSize:12,color:'#64748b' }}>
                ({hospital.rating.count})
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth:860,margin:'0 auto',padding:'clamp(24px,4vw,40px) clamp(16px,3vw,32px) 64px' }}>
        <TabBar tabs={tabsConfig} active={tab} onChange={setTab} />

        {/* Doctors tab */}
        {tab === 'doctors' && (
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:16 }}>
            {dLoading
              ? [1,2,3,4].map((i) => <SkeletonCard key={i} />)
              : !doctorsData?.length
                ? <div style={{ gridColumn:'1/-1' }}><EmptyState title="No doctors listed" /></div>
                : doctorsData.map((d) => (
                    <DoctorCard key={d.id} doctor={d} onClick={() => router.push(`/doctors/${d.id}`)} />
                  ))
            }
          </div>
        )}

        {/* About tab */}
        {tab === 'about' && (
          <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
            {hospital.departments?.length > 0 && (
              <div style={{
                background:'#fff',borderRadius:20,padding:24,
                border:'1px solid #f1f5f9',boxShadow:'0 2px 8px rgba(0,0,0,0.04)',
              }}>
                <h3 style={{ fontSize:15,fontWeight:700,color:'#1e293b',marginBottom:14 }}>Departments</h3>
                <div style={{ display:'flex',flexWrap:'wrap',gap:8 }}>
                  {hospital.departments.map((d) => (
                    <Badge key={d} variant="info" size="md">{d}</Badge>
                  ))}
                </div>
              </div>
            )}

            <div style={{
              background:'#fff',borderRadius:20,padding:24,
              border:'1px solid #f1f5f9',boxShadow:'0 2px 8px rgba(0,0,0,0.04)',
            }}>
              <h3 style={{ fontSize:15,fontWeight:700,color:'#1e293b',marginBottom:14 }}>Contact</h3>
              <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
                {hospital.contactPhone && (
                  <div style={{ display:'flex',alignItems:'center',gap:10,fontSize:13,color:'#475569' }}>
                    <span style={{ fontSize:18 }}>📞</span>
                    <span>{hospital.contactPhone}</span>
                  </div>
                )}
                {hospital.contactEmail && (
                  <div style={{ display:'flex',alignItems:'center',gap:10,fontSize:13,color:'#475569' }}>
                    <span style={{ fontSize:18 }}>✉️</span>
                    <span>{hospital.contactEmail}</span>
                  </div>
                )}
                {hospital.address && (
                  <div style={{ display:'flex',alignItems:'flex-start',gap:10,fontSize:13,color:'#475569' }}>
                    <span style={{ fontSize:18 }}>📍</span>
                    <span>
                      {[hospital.address.line1,hospital.address.city,hospital.address.state,hospital.address.pincode]
                        .filter(Boolean).join(', ')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Gallery tab */}
        {tab === 'gallery' && (
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:12 }}>
            {!hospital.images?.gallery?.length
              ? <div style={{ gridColumn:'1/-1' }}><EmptyState title="No gallery images" /></div>
              : hospital.images.gallery.map((img, i) => (
                  <div
                    key={i}
                    onMouseEnter={() => setImgHover(i)}
                    onMouseLeave={() => setImgHover(null)}
                    style={{
                      borderRadius:16,overflow:'hidden',
                      aspectRatio:'4/3',cursor:'zoom-in',
                      boxShadow: imgHover===i ? '0 12px 32px rgba(0,0,0,0.15)' : '0 2px 8px rgba(0,0,0,0.06)',
                      transition:'all .2s ease',
                      transform: imgHover===i ? 'scale(1.02)' : 'scale(1)',
                    }}
                  >
                    <img
                      src={img}
                      alt={`Gallery ${i+1}`}
                      style={{ width:'100%',height:'100%',objectFit:'cover' }}
                    />
                  </div>
                ))
            }
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}