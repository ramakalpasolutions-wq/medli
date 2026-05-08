'use client'

import { useState } from 'react'
import useSWR from 'swr'
import AdminHeader from '@/components/admin/AdminHeader'
import DataTable from '@/components/ui/DataTable'
import Badge from '@/components/ui/Badge'

const fetcher = (url) =>
  fetch(url, { credentials: 'include' }).then((r) => r.json()).then((j) => j.data)

function SearchInput({ value, onChange }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ position:'relative', flex:1, minWidth:180, maxWidth:320 }}>
      <span style={{ position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',fontSize:16,pointerEvents:'none',color:'#94a3b8' }}>🔍</span>
      <input value={value} onChange={onChange} placeholder="Search labs…"
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          width:'100%', padding:'10px 14px 10px 38px', fontSize:13, fontFamily:'inherit',
          borderRadius:12, boxSizing:'border-box',
          border:`1.5px solid ${focused?'#f97316':'#e2e8f0'}`,
          background:'#fff', color:'#0f172a', outline:'none',
          boxShadow:focused?'0 0 0 3px rgba(249,115,22,0.12)':'0 1px 3px rgba(0,0,0,0.06)',
          transition:'all .15s ease',
        }}
      />
    </div>
  )
}

export default function RegionalLabs() {
  const [page,   setPage]   = useState(1)
  const [search, setSearch] = useState('')

  const qs = new URLSearchParams({ page, limit: 20 })
  if (search) qs.set('search', search)

  const { data, isLoading } = useSWR(`/api/labs?${qs}`, fetcher)

  const columns = [
    { key:'name',       header:'Lab',      render:(v) => <span style={{ fontSize:13, fontWeight:600, color:'#1e293b' }}>{v}</span> },
    { key:'address',    header:'City',     render:(v) => <span style={{ fontSize:12, color:'#64748b' }}>{v?.city||'—'}</span> },
    { key:'certifications', header:'Certs', render:(v) => (v||[]).length>0
      ? <span style={{ fontSize:11, fontWeight:500, background:'rgba(16,185,129,0.08)', color:'#059669', padding:'2px 8px', borderRadius:100 }}>{(v||[]).join(' · ')}</span>
      : '—' },
    { key:'isApproved', header:'Approved', render:(v) => <Badge variant={v?'success':'warning'} size="sm">{v?'Yes':'Pending'}</Badge> },
    { key:'isActive',   header:'Status',   render:(v) => <Badge variant={v?'success':'neutral'} size="sm">{v?'Active':'Inactive'}</Badge> },
  ]

  return (
    <>
      <AdminHeader
        title="Labs"
        subtitle="Region labs (read-only view)"
        breadcrumbs={[{label:'Regional'},{label:'Labs'}]}
      />

      <div style={{ display:'flex', flexWrap:'wrap', gap:10, marginBottom:16 }}>
        <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <DataTable
        columns={columns}
        data={data?.labs || []}
        loading={isLoading}
        page={page}
        totalPages={data?.pagination?.totalPages || 1}
        onPageChange={setPage}
        emptyTitle="No labs found"
        emptyMessage="Labs in your region will appear here"
      />
    </>
  )
}