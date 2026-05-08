'use client'

import { useState } from 'react'
import useSWR from 'swr'
import AdminHeader from '@/components/admin/AdminHeader'
import DataTable from '@/components/ui/DataTable'
import Badge, { getStatusVariant } from '@/components/ui/Badge'
import DateRangePicker from '@/components/ui/DateRangePicker'

const fetcher = (url) =>
  fetch(url, { credentials: 'include' }).then((r) => r.json()).then((j) => j.data)

/* ─── Filter select ──────────────────────────────────────────────────── */
function FSelect({ value, onChange, placeholder, children }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ position:'relative' }}>
      <select value={value} onChange={onChange}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          padding:'10px 30px 10px 12px', fontSize:13, fontFamily:'inherit',
          borderRadius:12, border:`1.5px solid ${focused?'#f97316':'#e2e8f0'}`,
          background:'#fff', color:value?'#0f172a':'#94a3b8', outline:'none',
          appearance:'none', cursor:'pointer',
          boxShadow:focused?'0 0 0 3px rgba(249,115,22,0.12)':'0 1px 3px rgba(0,0,0,0.06)',
          transition:'all .15s ease', boxSizing:'border-box',
        }}>
        <option value="">{placeholder}</option>
        {children}
      </select>
      <span style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', fontSize:11, color:'#94a3b8', pointerEvents:'none' }}>▼</span>
    </div>
  )
}

export default function RegionalBookingsPage() {
  const [page,      setPage]      = useState(1)
  const [type,      setType]      = useState('')
  const [status,    setStatus]    = useState('')
  const [dateRange, setDateRange] = useState({ preset:'last30', dateFrom:'', dateTo:'' })

  const qs = new URLSearchParams({ page, limit:20 })
  if (type)                 qs.set('type',     type)
  if (status)               qs.set('status',   status)
  if (dateRange.dateFrom)   qs.set('dateFrom', dateRange.dateFrom)
  if (dateRange.dateTo)     qs.set('dateTo',   dateRange.dateTo)

  const { data, isLoading } = useSWR(`/api/bookings?${qs}`, fetcher)

  const columns = [
    { key:'bookingId',    header:'Booking ID',  render:(v) => <span style={{ fontFamily:'monospace', fontSize:11, fontWeight:600, color:'#475569' }}>{v}</span> },
    { key:'type',         header:'Type',        render:(v) => <Badge variant="info" size="sm">{v}</Badge> },
    { key:'status',       header:'Status',      render:(v) => <Badge variant={getStatusVariant(v)} size="sm" dot>{v?.replace(/_/g,' ')}</Badge> },
    { key:'paymentStatus',header:'Payment',     render:(v) => <Badge variant={getStatusVariant(v)} size="sm">{v?.replace(/_/g,' ')}</Badge> },
    { key:'baseFee',      header:'Base',        render:(v) => `₹${(v||0).toFixed(0)}` },
    { key:'totalAmount',  header:'Total',       render:(v) => <span style={{ fontSize:13, fontWeight:600, color:'#1e293b' }}>₹{(v||0).toLocaleString('en-IN')}</span> },
    { key:'startTime',    header:'Date',        render:(v) => <span style={{ fontSize:12, color:'#64748b' }}>{new Date(v).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</span> },
    { key:'isSettled',    header:'Settled',     render:(v) => <Badge variant={v?'success':'warning'} size="sm">{v?'Yes':'No'}</Badge> },
  ]

  return (
    <>
      <AdminHeader
        title="Bookings"
        subtitle="All bookings in your region (read-only)"
        breadcrumbs={[{label:'Dashboard',href:'/regional/dashboard'},{label:'Bookings'}]}
      />

      <div style={{ display:'flex', flexWrap:'wrap', gap:10, marginBottom:14 }}>
        <FSelect value={type} onChange={(e) => { setType(e.target.value); setPage(1) }} placeholder="All Types">
          <option value="hospital">Hospital</option>
          <option value="online">Online</option>
          <option value="lab">Lab</option>
        </FSelect>
        <FSelect value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} placeholder="All Status">
          <option value="created">Created</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="pending_payment">Pending Payment</option>
          <option value="no_show">No Show</option>
          <option value="refunded">Refunded</option>
        </FSelect>
      </div>

      <div style={{ marginBottom:16 }}>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      <DataTable
        columns={columns}
        data={data?.bookings || []}
        loading={isLoading}
        page={page}
        totalPages={data?.pagination?.totalPages || 1}
        onPageChange={setPage}
        emptyTitle="No bookings found"
        emptyMessage="Bookings in your region will appear here"
      />
    </>
  )
}