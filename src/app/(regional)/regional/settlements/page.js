'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import AdminHeader from '@/components/admin/AdminHeader'
import DataTable   from '@/components/ui/DataTable'
import Badge, { getStatusVariant } from '@/components/ui/Badge'
import StatsCard   from '@/components/ui/StatsCard'
import Modal       from '@/components/ui/Modal'

function useMounted() {
  const [m, setM] = useState(false)
  useEffect(() => { setM(true) }, [])
  return m
}

const fetcher = (url) =>
  fetch(url, { credentials: 'include' })
    .then((r) => r.json())
    .then((j) => {
      if (!j.success) throw new Error(j.error || 'Failed')
      return j.data
    })

const fmtRs = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`

const KF = `
  @keyframes rs-in     { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes rs-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
`
const SHIMMER = {
  backgroundImage: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)',
  backgroundSize: '200% 100%', animation: 'rs-shimmer 1.5s linear infinite',
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

function TabBtn({ label, active, count, onClick }) {
  const [h, setH] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '8px 16px', borderRadius: 12, border: 'none',
        fontSize: 13, fontWeight: active ? 600 : 500, cursor: 'pointer',
        background: active ? '#fff' : h ? 'rgba(255,255,255,0.5)' : 'transparent',
        color: active ? '#0f172a' : h ? '#334155' : '#64748b',
        boxShadow: active ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
        transition: 'all .15s ease',
      }}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span style={{
          padding: '1px 7px', borderRadius: 100, fontSize: 11, fontWeight: 700,
          background: 'rgba(245,158,11,0.12)', color: '#d97706',
        }}>{count}</span>
      )}
    </button>
  )
}

/* ─── Pending entity card ────────────────────────────────────────────── */
function PendingEntityCard({ entity, idx, onView }) {
  const isHospital = entity.entityType === 'hospital'
  return (
    <div style={{
      background: '#fff', borderRadius: 20, padding: 20,
      border: `1.5px solid ${isHospital ? 'rgba(99,102,241,0.15)' : 'rgba(16,185,129,0.15)'}`,
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      animation: `rs-in .2s ease ${idx * 0.06}s both`,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        marginBottom: 14, gap: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 22, flexShrink: 0 }}>{isHospital ? '🏥' : '🧪'}</span>
          <div style={{ minWidth: 0 }}>
            <p style={{
              fontSize: 14, fontWeight: 700, color: '#1e293b', margin: 0,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {entity.name}
            </p>
            <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0', textTransform: 'capitalize' }}>
              {entity.entityType}
            </p>
          </div>
        </div>
        <Badge variant={entity.bankAccount?.isVerified ? 'success' : 'warning'} size="sm">
          {entity.bankAccount?.isVerified ? 'Bank ✓' : 'Bank ⚠'}
        </Badge>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 8, marginBottom: 14,
      }}>
        {[
          { label: 'Bookings',   value: entity.totalBookings,               highlight: false },
          { label: 'Gross',      value: fmtRs(entity.grossAmount),          highlight: false },
          { label: 'Net Amount', value: fmtRs(entity.netSettlementAmount),  highlight: true  },
        ].map(({ label, value, highlight }) => (
          <div key={label} style={{
            borderRadius: 12, padding: '10px 8px', textAlign: 'center',
            background: highlight ? 'rgba(249,115,22,0.06)' : '#f8fafc',
          }}>
            <p style={{ fontSize: 10, color: highlight ? '#ea580c' : '#94a3b8', margin: '0 0 3px' }}>
              {label}
            </p>
            <p style={{
              fontSize: 13, fontWeight: 700,
              color: highlight ? '#c2410c' : '#1e293b', margin: 0,
            }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Bank info */}
      {entity.bankAccount && (
        <div style={{
          background: '#f8fafc', borderRadius: 10, padding: '8px 12px',
          marginBottom: 10, fontSize: 12,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ color: '#64748b' }}>Bank</span>
            <span style={{ fontWeight: 600, color: '#1e293b' }}>{entity.bankAccount.bankName || '—'}</span>
          </div>
          {entity.bankAccount.ifscCode && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>IFSC</span>
              <span style={{ fontFamily: 'monospace', color: '#1e293b' }}>{entity.bankAccount.ifscCode}</span>
            </div>
          )}
        </div>
      )}

      {/* Action row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{
          flex: 1, background: 'rgba(245,158,11,0.06)',
          border: '1px solid rgba(245,158,11,0.2)',
          borderRadius: 10, padding: '7px 10px', fontSize: 11, color: '#92400e',
        }}>
          ℹ️ Contact super admin to process
        </div>
        <button
          onClick={() => onView(entity)}
          style={{
            padding: '7px 12px', borderRadius: 10, border: 'none',
            background: 'rgba(249,115,22,0.08)', color: '#f97316',
            fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0,
          }}
        >
          👁 View
        </button>
      </div>
    </div>
  )
}

/* ─── Settlement Detail Modal ────────────────────────────────────────── */
function SettlementDetail({ s, isPending, mounted }) {
  if (isPending) {
    // Pending entity detail
    const isHospital = s.entityType === 'hospital'
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{
          padding: '14px 16px', borderRadius: 14,
          background: isHospital ? '#eff6ff' : '#f0fdf4',
          border: `1px solid ${isHospital ? '#bfdbfe' : '#bbf7d0'}`,
          display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: 28 }}>{isHospital ? '🏥' : '🧪'}</span>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 }}>{s.name}</h3>
            <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0', textTransform: 'capitalize' }}>
              {s.entityType}
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
          {[
            { label: 'Total Bookings',  value: String(s.totalBookings || 0)                },
            { label: 'Gross Amount',    value: fmtRs(s.grossAmount)                        },
            { label: 'Refunds',         value: fmtRs(s.refundsDeducted)                    },
            { label: 'Coupon Absorbed', value: fmtRs(s.couponAbsorbed)                     },
            { label: 'Platform Fee',    value: fmtRs(s.platformFee)                        },
            { label: 'Net Payout',      value: fmtRs(s.netSettlementAmount), bold: true     },
          ].map((r) => (
            <div key={r.label} style={{
              padding: '10px 12px', background: r.bold ? '#fff7ed' : '#fff',
              borderRadius: 12, border: `1px solid ${r.bold ? '#fed7aa' : '#f1f5f9'}`,
              textAlign: 'center',
            }}>
              <p style={{ fontSize: 10, color: r.bold ? '#ea580c' : '#94a3b8', margin: '0 0 3px' }}>{r.label}</p>
              <p style={{ fontSize: r.bold ? 16 : 14, fontWeight: r.bold ? 800 : 600, color: r.bold ? '#c2410c' : '#1e293b', margin: 0 }}>
                {r.value}
              </p>
            </div>
          ))}
        </div>

        {s.bankAccount && (
          <div style={{
            background: '#f8fafc', borderRadius: 14, border: '1px solid #e2e8f0',
            padding: '12px 16px',
          }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#374151', margin: '0 0 10px' }}>
              🏦 Bank Account
            </p>
            {[
              { l: 'Holder',   v: s.bankAccount.accountHolderName },
              { l: 'Bank',     v: s.bankAccount.bankName          },
              { l: 'IFSC',     v: s.bankAccount.ifscCode          },
              { l: 'Verified', v: s.bankAccount.isVerified ? '✓ Yes' : '✗ No' },
            ].filter((r) => r.v).map((r) => (
              <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                <span style={{ color: '#64748b' }}>{r.l}</span>
                <span style={{ fontWeight: 600, color: '#1e293b' }}>{r.v}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{
          background: '#fffbeb', border: '1px solid #fde68a',
          borderRadius: 12, padding: '12px 16px', fontSize: 12, color: '#92400e',
          lineHeight: 1.6,
        }}>
          ℹ️ This settlement is pending. Only super admin can initiate and confirm settlements.
          Contact <strong>support@medli.in</strong> to request processing.
        </div>
      </div>
    )
  }

  // Completed settlement detail
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{
        padding: '14px 16px', borderRadius: 14,
        background: s.status === 'completed' ? '#f0fdf4' : s.status === 'failed' ? '#fff1f2' : '#fffbeb',
        border: `1px solid ${s.status === 'completed' ? '#bbf7d0' : s.status === 'failed' ? '#fecaca' : '#fde68a'}`,
        display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: 28 }}>
          {s.status === 'completed' ? '✅' : s.status === 'failed' ? '❌' : '⏳'}
        </span>
        <div>
          <p style={{ fontSize: 15, fontWeight: 800, color: '#1e293b', margin: 0 }}>
            {s.settlementNumber}
          </p>
          <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
            <Badge variant={getStatusVariant(s.status)} size="sm" dot>{s.status}</Badge>
            <Badge variant={s.entityType === 'hospital' ? 'info' : 'success'} size="sm">{s.entityType}</Badge>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 }}>
        {[
          { label: 'Gross',      value: fmtRs(s.grossAmount)          },
          { label: 'Platform Fee',value: fmtRs(s.platformFee)         },
          { label: 'Refunds',    value: fmtRs(s.refundsDeducted)      },
          { label: 'Net Payout', value: fmtRs(s.netSettlementAmount), bold: true },
        ].map((r) => (
          <div key={r.label} style={{
            padding: '10px 12px', background: r.bold ? '#fff7ed' : '#fff',
            borderRadius: 12, border: `1px solid ${r.bold ? '#fed7aa' : '#f1f5f9'}`,
            textAlign: 'center',
          }}>
            <p style={{ fontSize: 10, color: r.bold ? '#ea580c' : '#94a3b8', margin: '0 0 3px' }}>{r.label}</p>
            <p style={{ fontSize: r.bold ? 16 : 14, fontWeight: r.bold ? 800 : 600, color: r.bold ? '#c2410c' : '#1e293b', margin: 0 }}>
              {r.value}
            </p>
          </div>
        ))}
      </div>

      <div style={{
        background: '#f8fafc', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden',
      }}>
        <div style={{ padding: '10px 16px', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#374151', margin: 0 }}>Settlement Details</p>
        </div>
        <div style={{ padding: '4px 0' }}>
          {[
            { l: 'Entity',       v: s.entityName       || '—' },
            { l: 'UTR Number',   v: s.utrNumber         || '—', mono: true },
            { l: 'Transfer Mode',v: s.transferMode      || '—' },
            { l: 'Beneficiary',  v: s.beneficiaryName   || '—' },
            { l: 'Bank Name',    v: s.bankName          || '—' },
            { l: 'Total Bookings',v: String(s.totalBookings || 0) },
            { l: 'Period From',  v: s.periodFrom ? new Date(s.periodFrom).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : '—' },
            { l: 'Period To',    v: s.periodTo   ? new Date(s.periodTo).toLocaleDateString('en-IN', { dateStyle: 'medium' })   : '—' },
            { l: 'Transferred',  v: s.transferredAt && mounted ? new Date(s.transferredAt).toLocaleDateString('en-IN', { dateStyle: 'long' }) : '—' },
          ].map((row) => (
            <div key={row.l} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '9px 16px', borderBottom: '1px solid #f8fafc', flexWrap: 'wrap', gap: 4,
            }}>
              <span style={{ fontSize: 12, color: '#64748b', flexShrink: 0 }}>{row.l}</span>
              <span style={{
                fontSize: 12, fontWeight: 600, color: '#1e293b',
                fontFamily: row.mono ? 'monospace' : 'inherit',
                wordBreak: 'break-all', textAlign: 'right',
              }}>{row.v}</span>
            </div>
          ))}
        </div>
      </div>

      {s.failureReason && (
        <div style={{ background: '#fff1f2', border: '1px solid #fecaca', borderRadius: 12, padding: '12px 16px' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#dc2626', margin: '0 0 4px' }}>Failure Reason</p>
          <p style={{ fontSize: 12, color: '#991b1b', margin: 0 }}>{s.failureReason}</p>
        </div>
      )}

      <div style={{
        padding: '10px 14px', background: '#f8fafc',
        borderRadius: 12, border: '1px solid #e2e8f0',
        display: 'flex', flexDirection: 'column', gap: 5,
      }}>
        {[
          { l: 'Settlement ID', v: s.id },
          { l: 'Entity ID',     v: s.entityId },
          { l: 'Created',       v: mounted ? new Date(s.createdAt).toLocaleDateString('en-IN', { dateStyle: 'long' }) : '—' },
        ].map((r) => (
          <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>{r.l}</span>
            <span style={{
              fontSize: 11, fontFamily: 'monospace', color: '#64748b',
              wordBreak: 'break-all', textAlign: 'right', maxWidth: '60%',
            }}>{r.v}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function RegionalSettlementsPage() {
  const mounted = useMounted()
  const [tab,      setTab]      = useState('pending')
  const [page,     setPage]     = useState(1)
  const [viewItem, setViewItem] = useState(null)
  const [viewPending, setViewPending] = useState(false)

  const { data: pending, isLoading: pendingLoading, error: pendingError } = useSWR(
    tab === 'pending' ? '/api/settlements/pending' : null,
    fetcher,
    { refreshInterval: 60000 }
  )

  const historyQs = new URLSearchParams({ page, limit: 20 })
  const { data: history, isLoading: historyLoading } = useSWR(
    tab === 'history' ? `/api/settlements?${historyQs}` : null,
    fetcher
  )

  const pendingHospitals = (pending?.hospitals || []).map((h) => ({ ...h, entityType: 'hospital', entityId: h.id }))
  const pendingLabs      = (pending?.labs      || []).map((l) => ({ ...l, entityType: 'lab',      entityId: l.id }))
  const pendingEntities  = [...pendingHospitals, ...pendingLabs]

  const STATUS_VARIANT = {
    pending: 'warning', processing: 'info', completed: 'success',
    failed: 'danger', on_hold: 'neutral',
  }

  const historyCols = [
    {
      key: 'settlementNumber', header: 'Settlement #',
      render: (v) => <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700 }}>{v}</span>,
    },
    {
      key: 'entityName', header: 'Entity',
      render: (v, row) => (
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', margin: 0 }}>{v || '—'}</p>
          <Badge variant={row.entityType === 'hospital' ? 'info' : 'success'} size="sm">{row.entityType}</Badge>
        </div>
      ),
    },
    {
      key: 'netSettlementAmount', header: 'Net Amount',
      render: (v) => <span style={{ fontWeight: 700, color: '#059669', fontSize: 14 }}>{fmtRs(v)}</span>,
    },
    {
      key: 'utrNumber', header: 'UTR',
      render: (v) => v
        ? <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{v}</span>
        : <span style={{ color: '#94a3b8', fontSize: 12 }}>—</span>,
    },
    {
      key: 'status', header: 'Status',
      render: (v) => <Badge variant={STATUS_VARIANT[v] || 'neutral'} size="sm" dot>{v?.replace('_', ' ')}</Badge>,
    },
    {
      key: 'transferredAt', header: 'Date',
      render: (v) => mounted && v
        ? <span style={{ fontSize: 12, color: '#64748b' }}>{new Date(v).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span>
        : '—',
    },
    {
      key: 'actions', header: '',
      render: (_, row) => (
        <ViewBtn onClick={() => { setViewItem(row); setViewPending(false) }} />
      ),
    },
  ]

  return (
    <>
      <style>{KF}</style>

      <AdminHeader
        title="Settlements"
        subtitle="View settlement status for your region (read-only)"
        breadcrumbs={[{ label: 'Dashboard', href: '/regional/dashboard' }, { label: 'Settlements' }]}
      />

      {/* Tab bar */}
      <div style={{
        display: 'flex', gap: 3, background: '#f1f5f9',
        borderRadius: 14, padding: 4, width: 'fit-content', marginBottom: 24,
        overflowX: 'auto',
      }}>
        <TabBtn
          label="Pending"
          active={tab === 'pending'}
          count={pendingEntities.length}
          onClick={() => { setTab('pending'); setPage(1) }}
        />
        <TabBtn
          label="Completed"
          active={tab === 'history'}
          onClick={() => { setTab('history'); setPage(1) }}
        />
      </div>

      {/* ── PENDING TAB ── */}
      {tab === 'pending' && (
        <div>
          {/* Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 14, marginBottom: 20,
          }}>
            <StatsCard
              title="Pending Entities"
              value={pendingEntities.length}
              icon="⏳"
              color="orange"
            />
            <StatsCard
              title="Total Pending"
              value={fmtRs(pending?.totalAmount || 0)}
              icon="💰"
              color="blue"
              valueIsString
            />
          </div>

          {/* Info banner */}
          <div style={{
            background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.2)',
            borderRadius: 14, padding: '12px 16px', marginBottom: 20,
            display: 'flex', alignItems: 'flex-start', gap: 10,
          }}>
            <span style={{ fontSize: 18, flexShrink: 0, marginTop: 2 }}>⚠️</span>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#c2410c', margin: '0 0 3px' }}>
                Read-Only View
              </p>
              <p style={{ fontSize: 12, color: '#92400e', margin: 0, lineHeight: 1.6 }}>
                Only the super admin can initiate and confirm settlements.
                Contact <strong>support@medli.in</strong> to request settlement processing.
              </p>
            </div>
          </div>

          {pendingLoading ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 14,
            }}>
              {[1, 2].map((i) => (
                <div key={i} style={{ height: 220, borderRadius: 20, ...SHIMMER }} />
              ))}
            </div>
          ) : pendingError ? (
            <div style={{
              background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)',
              borderRadius: 14, padding: 20, display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ fontSize: 20 }}>⚠️</span>
              <p style={{ fontSize: 13, color: '#ef4444', margin: 0 }}>Failed to load settlements.</p>
            </div>
          ) : !pendingEntities.length ? (
            <div style={{
              background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9',
              padding: 40, textAlign: 'center',
            }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#10b981', margin: 0 }}>All settled!</p>
              <p style={{ fontSize: 12, color: '#94a3b8', margin: '4px 0 0' }}>
                No pending settlements for your region.
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 14,
            }}>
              {pendingEntities.map((entity, i) => (
                <PendingEntityCard
                  key={`${entity.entityType}-${entity.entityId}`}
                  entity={entity}
                  idx={i}
                  onView={(e) => { setViewItem(e); setViewPending(true) }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── HISTORY TAB ── */}
      {tab === 'history' && (
        <DataTable
          columns={historyCols}
          data={history?.settlements || []}
          loading={historyLoading}
          page={page}
          totalPages={history?.pagination?.totalPages || 1}
          onPageChange={setPage}
          emptyTitle="No completed settlements"
          keyField="id"
        />
      )}

      {/* ── View Detail Modal ── */}
      <Modal
        open={!!viewItem}
        onClose={() => { setViewItem(null); setViewPending(false) }}
        title={viewPending ? `${viewItem?.name} — Pending Settlement` : `Settlement — ${viewItem?.settlementNumber || ''}`}
        size="md"
      >
        {viewItem && (
          <SettlementDetail
            s={viewItem}
            isPending={viewPending}
            mounted={mounted}
          />
        )}
      </Modal>
    </>
  )
}