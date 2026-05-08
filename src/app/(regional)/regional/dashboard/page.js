'use client'

import { useState } from 'react'
import useSWR from 'swr'
import AdminHeader from '@/components/admin/AdminHeader'
import StatsCard from '@/components/ui/StatsCard'
import DataTable from '@/components/ui/DataTable'
import Badge, { getStatusVariant } from '@/components/ui/Badge'
import { useAuth } from '@/hooks/useAuth'

const fetcher = (url) =>
  fetch(url, { credentials: 'include' }).then((r) => r.json()).then((j) => j.data)

const KF = `@keyframes rd-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`

function SCard({ title, action, children }) {
  return (
    <div style={{ background:'#fff', borderRadius:20, border:'1px solid #f1f5f9', boxShadow:'0 2px 8px rgba(0,0,0,0.04)', overflow:'hidden' }}>
      {(title||action) && (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px', borderBottom:'1px solid #f8fafc' }}>
          {title && <h3 style={{ fontSize:14, fontWeight:700, color:'#1e293b', margin:0 }}>{title}</h3>}
          {action}
        </div>
      )}
      <div style={{ padding:20 }}>{children}</div>
    </div>
  )
}

function ViewLink({ href }) {
  const [h, setH] = useState(false)
  return (
    <a href={href} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ fontSize:12, fontWeight:600, color:h?'#ea580c':'#f97316', textDecoration:'none', transition:'color .15s ease' }}>
      View all →
    </a>
  )
}

export default function RegionalDashboard() {
  const { user } = useAuth()
  const { data: bookings } = useSWR('/api/bookings?limit=10', fetcher)
  const { data: hospitals } = useSWR('/api/hospitals?limit=5', fetcher)
  const { data: labs }      = useSWR('/api/labs?limit=5',      fetcher)

  const bookingCols = [
    { key:'bookingId', header:'Booking ID', render:(v) => <span style={{ fontFamily:'monospace', fontSize:11, color:'#475569' }}>{v}</span> },
    { key:'type',      header:'Type',       render:(v) => <Badge variant="info" size="sm">{v}</Badge> },
    { key:'status',    header:'Status',     render:(v) => <Badge variant={getStatusVariant(v)} size="sm" dot>{v?.replace(/_/g,' ')}</Badge> },
    { key:'totalAmount', header:'Amount',   render:(v) => <span style={{ fontSize:13, fontWeight:600 }}>₹{(v||0).toFixed(2)}</span> },
  ]

  const STATS = [
    { title:'Hospitals', value:hospitals?.hospitals?.length||0,       icon:'🏥', color:'blue'   },
    { title:'Labs',      value:labs?.labs?.length||0,                 icon:'🧪', color:'green'  },
    { title:'Bookings',  value:bookings?.pagination?.total||0,        icon:'📅', color:'purple' },
    { title:'Revenue',   value:'—',                                   icon:'💰', color:'orange' },
  ]

  return (
    <>
      <style>{KF}</style>
      <AdminHeader
        title={`Welcome, ${user?.name?.split(' ')[0] || 'Manager'}`}
        subtitle="Regional management overview"
        breadcrumbs={[{label:'Regional Manager'},{label:'Dashboard'}]}
      />

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:14, marginBottom:24, animation:'rd-in .3s ease' }}>
        {STATS.map((s) => (
          <StatsCard key={s.title} title={s.title} value={s.value} icon={s.icon} color={s.color} />
        ))}
      </div>

      {/* Recent bookings */}
      <SCard title="Recent Bookings" action={<ViewLink href="/regional/bookings" />}>
        <DataTable
          columns={bookingCols}
          data={bookings?.bookings || []}
          emptyTitle="No recent bookings"
          emptyMessage="Bookings will appear here"
        />
      </SCard>
    </>
  )
}