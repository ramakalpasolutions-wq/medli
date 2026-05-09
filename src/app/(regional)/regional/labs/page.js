'use client'

import { useState } from 'react'
import useSWR from 'swr'
import AdminHeader from '@/components/admin/AdminHeader'
import DataTable   from '@/components/ui/DataTable'
import Badge       from '@/components/ui/Badge'
import Modal       from '@/components/ui/Modal'

const fetcher = (url) =>
  fetch(url, { credentials: 'include' }).then((r) => r.json()).then((j) => j.data)

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
        placeholder="Search labs…"
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
        padding: '5px 10px', borderRadius: 8, border: 'none',
        background: h ? 'rgba(249,115,22,0.1)' : 'transparent',
        color: '#f97316', fontSize: 11, fontWeight: 600,
        cursor: 'pointer', transition: 'background .13s ease',
      }}
    >
      👁 View
    </button>
  )
}

/* ─── Lab Detail ─────────────────────────────────────────────────────── */
function LabDetail({ l }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Header */}
      <div style={{
        display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap',
        padding: 16, background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)',
        borderRadius: 16, border: '1px solid #bbf7d0',
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14, flexShrink: 0,
          background: '#dcfce7', border: '2px solid #bbf7d0',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
          overflow: 'hidden',
        }}>
          {l.images?.logo
            ? <img src={l.images.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }} />
            : '🧪'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', margin: '0 0 6px' }}>{l.name}</h3>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <Badge variant={l.isApproved ? 'success' : 'warning'} size="sm" dot>
              {l.isApproved ? 'Approved' : 'Pending'}
            </Badge>
            <Badge variant={l.isActive ? 'success' : 'neutral'} size="sm">
              {l.isActive ? 'Active' : 'Inactive'}
            </Badge>
            {l.homeCollection?.enabled && (
              <Badge variant="info" size="sm">🏠 Home Collection</Badge>
            )}
            <Badge variant="neutral" size="sm">Fee: {l.platformFeePercent}%</Badge>
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
          { label: '📍 City',    value: l.address?.city   || '—' },
          { label: '📞 Phone',   value: l.contactPhone    || '—' },
          { label: '✉️ Email',   value: l.contactEmail    || '—' },
          { label: '⭐ Rating',  value: l.rating?.average > 0 ? `${l.rating.average.toFixed(1)} (${l.rating.count})` : '—' },
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

      {/* Certifications */}
      {l.certifications?.length > 0 && (
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8 }}>
            Certifications ({l.certifications.length})
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {l.certifications.map((c) => (
              <span key={c} style={{
                fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 100,
                background: 'rgba(16,185,129,0.08)', color: '#059669',
              }}>{c}</span>
            ))}
          </div>
        </div>
      )}

      {/* Home collection */}
      {l.homeCollection?.enabled && (
        <div style={{
          background: '#f0f9ff', border: '1px solid #bae6fd',
          borderRadius: 14, padding: '14px 16px',
        }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#0369a1', margin: '0 0 8px' }}>
            🏠 Home Collection
          </p>
          {l.homeCollection.areaCoverage?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
              {l.homeCollection.areaCoverage.map((area) => (
                <span key={area} style={{
                  fontSize: 11, padding: '3px 10px', borderRadius: 100,
                  background: '#fff', color: '#0369a1', border: '1px solid #bae6fd',
                }}>{area}</span>
              ))}
            </div>
          )}
          {l.homeCollection.slots?.length > 0 && (
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8,
            }}>
              {l.homeCollection.slots.map((slot, i) => (
                <div key={i} style={{
                  padding: '8px 12px', background: '#fff', borderRadius: 10,
                  border: '1px solid #bae6fd',
                }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#0369a1', margin: '0 0 2px' }}>
                    {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][slot.dayOfWeek]}
                  </p>
                  <p style={{ fontSize: 11, color: '#374151', margin: 0 }}>
                    {slot.startTime} – {slot.endTime}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Walk-in slots */}
      {l.walkInSlots?.length > 0 && (
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8 }}>
            Walk-In Slots
          </p>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8,
          }}>
            {l.walkInSlots.map((slot, i) => (
              <div key={i} style={{
                padding: '8px 12px', background: '#f0fdf4', borderRadius: 10,
                border: '1px solid #bbf7d0',
              }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', margin: '0 0 2px' }}>
                  {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][slot.dayOfWeek]}
                </p>
                <p style={{ fontSize: 11, color: '#374151', margin: 0 }}>
                  {slot.startTime} – {slot.endTime}
                </p>
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
          { l: 'Lab ID',     v: l.id        },
          { l: 'Slug',       v: l.slug      },
          { l: 'Region ID',  v: l.regionId  || '—' },
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

export default function RegionalLabs() {
  const [page,     setPage]     = useState(1)
  const [search,   setSearch]   = useState('')
  const [viewItem, setViewItem] = useState(null)

  const qs = new URLSearchParams({ page, limit: 20 })
  if (search) qs.set('search', search)

  const { data, isLoading } = useSWR(`/api/labs?${qs}`, fetcher)

  const labs       = data?.labs       || []
  const totalPages = data?.pagination?.totalPages || 1
  const total      = data?.pagination?.total      || labs.length

  const columns = [
    {
      key: 'name', header: 'Lab',
      render: (v, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, flexShrink: 0,
            background: 'rgba(16,185,129,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
          }}>🧪</div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v}</p>
            <p style={{ fontSize: 11, color: '#94a3b8', margin: '1px 0 0' }}>{row.address?.city || '—'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'certifications', header: 'Certs',
      render: (v) => (v || []).length > 0
        ? <span style={{ fontSize: 11, fontWeight: 500, background: 'rgba(16,185,129,0.08)', color: '#059669', padding: '2px 8px', borderRadius: 100 }}>
            {(v || []).slice(0, 2).join(' · ')}
            {(v || []).length > 2 ? ` +${v.length - 2}` : ''}
          </span>
        : <span style={{ fontSize: 12, color: '#94a3b8' }}>—</span>,
    },
    {
      key: 'homeCollection', header: 'Home',
      render: (v) => (
        <Badge variant={v?.enabled ? 'success' : 'neutral'} size="sm">
          {v?.enabled ? '✓ Yes' : 'No'}
        </Badge>
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
      key: 'actions', header: '',
      render: (_, row) => <ViewBtn onClick={() => setViewItem(row)} />,
    },
  ]

  return (
    <div>
      <AdminHeader
        title="Labs"
        subtitle={`${total} lab${total !== 1 ? 's' : ''} in your region (read-only)`}
        breadcrumbs={[{ label: 'Regional', href: '/regional/dashboard' }, { label: 'Labs' }]}
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
        data={labs}
        loading={isLoading}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        emptyTitle="No labs found"
        emptyMessage="Labs in your region will appear here"
      />

      <Modal
        open={!!viewItem}
        onClose={() => setViewItem(null)}
        title="Lab Details"
        size="lg"
      >
        {viewItem && <LabDetail l={viewItem} />}
      </Modal>
    </div>
  )
}