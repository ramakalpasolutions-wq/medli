'use client'

import { useState } from 'react'
import useSWR from 'swr'
import AdminHeader from '@/components/admin/AdminHeader'
import DataTable   from '@/components/ui/DataTable'
import Badge       from '@/components/ui/Badge'
import Modal       from '@/components/ui/Modal'

const fetcher = (url) =>
  fetch(url, { credentials: 'include' }).then((r) => r.json()).then((j) => j.data)

const KF = `@keyframes rh-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`

function SearchInput({ value, onChange }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ position: 'relative', flex: 1, minWidth: 180, maxWidth: 320 }}>
      <span style={{
        position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
        fontSize: 16, pointerEvents: 'none', color: '#94a3b8',
      }}>🔍</span>
      <input
        value={value}
        onChange={onChange}
        placeholder="Search hospitals…"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%', padding: '10px 14px 10px 38px', fontSize: 13,
          fontFamily: 'inherit', borderRadius: 12, boxSizing: 'border-box',
          border: `1.5px solid ${focused ? '#f97316' : '#e2e8f0'}`,
          background: '#fff', color: '#0f172a', outline: 'none',
          boxShadow: focused ? '0 0 0 3px rgba(249,115,22,0.12)' : '0 1px 3px rgba(0,0,0,0.06)',
          transition: 'all .15s ease',
        }}
      />
    </div>
  )
}

function ViewBtn({ onClick }) {
  const [h, setH] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        padding: '5px 10px ', borderRadius: 8, border: 'none',
        background: h ? 'rgba(249,115,22,0.1)' : 'transparent',
        color: '#f97316', fontSize: 11, fontWeight: 900,
        fontFamily:"Times New Roman",
        cursor: 'pointer', transition: 'background .13s ease',

      }}
    >
      👁 View
    </button>
  )
}

/* ─── Hospital Detail ────────────────────────────────────────────────── */
function HospitalDetail({ h }) {
  const DAYS = ['mon','tue','wed','thu','fri','sat','sun']
  const DAY_LABELS = { mon:'Monday',tue:'Tuesday',wed:'Wednesday',thu:'Thursday',fri:'Friday',sat:'Saturday',sun:'Sunday' }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Header */}
      <div style={{
        display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap',
        padding: 16, background: 'linear-gradient(135deg,#fff7ed,#ffedd5)',
        borderRadius: 16, border: '1px solid #fed7aa',
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14, flexShrink: 0,
          background: h.images?.logo ? 'transparent' : '#fff',
          border: '2px solid #fed7aa',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
          overflow: 'hidden',
        }}>
          {h.images?.logo
            ? <img src={h.images.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : '🏥'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', margin: '0 0 6px' }}>
            {h.name}
          </h3>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <Badge variant={h.isApproved ? 'success' : 'warning'} size="sm" dot>
              {h.isApproved ? 'Approved' : 'Pending'}
            </Badge>
            <Badge variant={h.isActive ? 'success' : 'neutral'} size="sm">
              {h.isActive ? 'Active' : 'Inactive'}
            </Badge>
            <Badge variant="info" size="sm">Fee: {h.platformFeePercent}%</Badge>
          </div>
        </div>
      </div>

      {/* Info grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: 10,
      }}>
        {[
          { label: '📍 Address', value: [h.address?.line1, h.address?.city, h.address?.state].filter(Boolean).join(', ') || '—' },
          { label: '📞 Phone',   value: h.contactPhone || '—' },
          { label: '✉️ Email',   value: h.contactEmail || '—' },
          { label: '⭐ Rating',  value: h.rating?.average > 0 ? `${h.rating.average.toFixed(1)} (${h.rating.count})` : '—' },
        ].map((r) => (
          <div key={r.label} style={{
            padding: '10px 12px', background: '#fff',
            borderRadius: 12, border: '1px solid #f1f5f9',
          }}>
            <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 3px' }}>{r.label}</p>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', margin: 0, wordBreak: 'break-word' }}>{r.value}</p>
          </div>
        ))}
      </div>

      {/* Departments */}
      {h.departments?.length > 0 && (
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8 }}>
            Departments ({h.departments.length})
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {h.departments.map((d) => (
              <span key={d} style={{
                fontSize: 11, fontWeight: 500, padding: '4px 12px', borderRadius: 100,
                background: 'rgba(249,115,22,0.08)', color: '#ea580c',
              }}>{d}</span>
            ))}
          </div>
        </div>
      )}

      {/* Services */}
      {h.services?.length > 0 && (
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8 }}>
            Services ({h.services.length})
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {h.services.map((s) => (
              <span key={s} style={{
                fontSize: 11, fontWeight: 500, padding: '4px 12px', borderRadius: 100,
                background: 'rgba(16,185,129,0.08)', color: '#059669',
              }}>{s}</span>
            ))}
          </div>
        </div>
      )}

      {/* Operating Hours */}
      {h.operatingHours && (
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8 }}>
            Operating Hours
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
            gap: 8,
          }}>
            {DAYS.map((day) => {
              const slot = h.operatingHours?.[day]
              return (
                <div key={day} style={{
                  padding: '8px 12px', borderRadius: 10,
                  background: slot?.isOpen ? '#f0fdf4' : '#f8fafc',
                  border: `1px solid ${slot?.isOpen ? '#bbf7d0' : '#e2e8f0'}`,
                }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#374151', margin: '0 0 2px' }}>
                    {DAY_LABELS[day]}
                  </p>
                  <p style={{ fontSize: 11, margin: 0, color: slot?.isOpen ? '#16a34a' : '#94a3b8' }}>
                    {slot?.isOpen ? `${slot.open} – ${slot.close}` : 'Closed'}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Gallery */}
      {h.images?.gallery?.length > 0 && (
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8 }}>
            Gallery ({h.images.gallery.length})
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
            gap: 8,
          }}>
            {h.images.gallery.map((img, i) => (
              <div key={i} style={{
                borderRadius: 10, overflow: 'hidden',
                aspectRatio: '4/3', background: '#f1f5f9',
              }}>
                <img src={img} alt={`Gallery ${i + 1}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* IDs */}
      <div style={{
        padding: '10px 14px', background: '#f8fafc',
        borderRadius: 12, border: '1px solid #e2e8f0',
      }}>
        {[
          { l: 'Hospital ID', v: h.id },
          { l: 'Slug', v: h.slug },
          { l: 'Region ID', v: h.regionId || '—' },
        ].map((r) => (
          <div key={r.l} style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: 5,
          }}>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>{r.l}</span>
            <span style={{
              fontSize: 11, fontFamily: 'monospace', color: '#64748b',
              wordBreak: 'break-all', textAlign: 'right', maxWidth: '65%',
            }}>{r.v}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function RegionalHospitals() {
  const [page,     setPage]     = useState(1)
  const [search,   setSearch]   = useState('')
  const [viewItem, setViewItem] = useState(null)

  const qs = new URLSearchParams({ page, limit: 20 })
  if (search) qs.set('search', search)

  const { data, isLoading } = useSWR(`/api/hospitals?${qs}`, fetcher)

  const hospitals  = data?.hospitals  || []
  const totalPages = data?.pagination?.totalPages || 1
  const total      = data?.pagination?.total      || hospitals.length

  const columns = [
    {
      key: 'name', header: 'Hospital',
      render: (v, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, flexShrink: 0,
            background: 'rgba(249,115,22,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, overflow: 'hidden',
          }}>
            {row.images?.logo
              ? <img src={row.images.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : '🏥'}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v}</p>
            <p style={{ fontSize: 11, color: '#94a3b8', margin: '1px 0 0' }}>{row.address?.city || '—'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'isApproved', header: 'Approved',
      render: (v) => <Badge variant={v ? 'success' : 'warning'} size="sm" dot>{v ? 'Yes' : 'Pending'}</Badge>,
    },
    {
      key: 'isActive', header: 'Active',
      render: (v) => <Badge variant={v ? 'success' : 'neutral'} size="sm">{v ? 'Yes' : 'No'}</Badge>,
    },
    {
      key: 'rating', header: 'Rating',
      render: (v) => v?.average > 0
        ? <span style={{ fontSize: 12, fontWeight: 600, color: '#92400e' }}>⭐ {v.average.toFixed(1)}</span>
        : <span style={{ fontSize: 12, color: '#94a3b8' }}>—</span>,
    },
    {
      key: 'platformFeePercent', header: 'Fee %',
      render: (v) => <span style={{ fontSize: 12, fontWeight: 600 }}>{v}%</span>,
    },
    {
      key: 'actions', header: '',
      render: (_, row) => <ViewBtn onClick={() => setViewItem(row)} />,
    },
  ]

  return (
    <>
      <style>{KF}</style>

      <AdminHeader
        title="Hospitals"
        subtitle={`${total} hospital${total !== 1 ? 's' : ''} in your region (read-only)`}
        breadcrumbs={[{ label: 'Regional', href: '/regional/dashboard' }, { label: 'Hospitals' }]}
      />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
        <SearchInput
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
        />
        {search && (
          <button
            onClick={() => { setSearch(''); setPage(1) }}
            style={{
              padding: '10px 14px', borderRadius: 12,
              border: '1.5px solid #fca5a5', background: '#fff1f2',
              color: '#ef4444', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Clear ✕
          </button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={hospitals}
        loading={isLoading}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        emptyTitle="No hospitals found"
        emptyMessage="Hospitals in your region will appear here"
      />

      <Modal
        open={!!viewItem}
        onClose={() => setViewItem(null)}
        title="Hospital Details"
        size="lg"
      >
        {viewItem && <HospitalDetail h={viewItem} />}
      </Modal>
    </>
  )
}