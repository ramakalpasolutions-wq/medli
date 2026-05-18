'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import AdminHeader from '@/components/admin/AdminHeader'
import DataTable   from '@/components/ui/DataTable'
import Badge, { getStatusVariant } from '@/components/ui/Badge'
import Modal       from '@/components/ui/Modal'
import EmptyState  from '@/components/ui/EmptyState'
import { useToast } from '@/context/ToastContext'

function useMounted() {
  const [m, setM] = useState(false)
  useEffect(() => { setM(true) }, [])
  return m
}

const fetcher = (url) =>
  fetch(url, { credentials: 'include' }).then((r) => r.json()).then((j) => j.data)

const KF = `
  @keyframes sl-spin { to { transform: rotate(360deg) } }
  @keyframes sl-in   { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
`
const fmtRs = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`

/* ─── Bank Button ────────────────────────────────────────────────────── */
function BankBtn({ onClick }) {
  const [h, setH] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '9px 16px', borderRadius: 12,
        border: `1.5px solid ${h ? '#6366f1' : '#e2e8f0'}`,
        background: h ? 'rgba(99,102,241,0.06)' : '#fff',
        color: h ? '#6366f1' : '#475569', fontSize: 13, fontWeight: 600,
        cursor: 'pointer', transition: 'all .15s ease',
      }}
    >
      🏦 Update Bank Account
    </button>
  )
}

/* ─── Download Button ────────────────────────────────────────────────── */
function DlBtn({ onClick, loading: isLoading }) {
  const [h, setH] = useState(false)
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      onMouseEnter={() => !isLoading && setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '4px 9px', borderRadius: 7, border: 'none',
        background: h ? 'rgba(99,102,241,0.1)' : 'transparent',
        color: h ? '#6366f1' : '#94a3b8', fontSize: 11, fontWeight: 600,
        cursor: isLoading ? 'not-allowed' : 'pointer',
        transition: 'all .12s ease', opacity: isLoading ? 0.6 : 1,
      }}
    >
      {isLoading
        ? <span style={{
            width: 12, height: 12, borderRadius: '50%',
            border: '2px solid #94a3b8', borderTopColor: 'transparent',
            animation: 'sl-spin .7s linear infinite', display: 'inline-block',
          }} />
        : '⬇'
      }
      PDF
    </button>
  )
}

/* ─── View Button ────────────────────────────────────────────────────── */
function ViewBtn({ onClick }) {
  const [h, setH] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        padding: '4px 9px', borderRadius: 7, border: 'none',
        background: h ? 'rgba(99,102,241,0.1)' : 'transparent',
        color: '#6366f1', fontSize: 11, fontWeight: 600,
        cursor: 'pointer', transition: 'background .13s ease',
      }}
    >
      👁 View
    </button>
  )
}

/* ─── Bank Form Input ────────────────────────────────────────────────── */
function BInput({ label, ...props }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && <label style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>{label}</label>}
      <input
        {...props}
        value={props.value ?? ''}
        onFocus={(e) => { setFocused(true); props.onFocus?.(e) }}
        onBlur={(e)  => { setFocused(false); props.onBlur?.(e) }}
        style={{
          padding: '10px 12px', fontSize: 13, fontFamily: 'inherit',
          borderRadius: 12, boxSizing: 'border-box',
          border: `1.5px solid ${focused ? '#6366f1' : '#e2e8f0'}`,
          background: '#fff', color: '#0f172a', outline: 'none',
          boxShadow: focused ? '0 0 0 3px rgba(99,102,241,0.12)' : '0 1px 3px rgba(0,0,0,0.06)',
          transition: 'all .15s ease', width: '100%',
        }}
      />
    </div>
  )
}

/* ─── Settlement Detail ──────────────────────────────────────────────── */
/* ─── Settlement Detail ──────────────────────────────────────────────── */
function SettlementDetail({ s, mounted }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Status banner */}
      <div style={{
        padding: '14px 16px', borderRadius: 14, flexWrap: 'wrap',
        background: s.status === 'completed' ? '#f0fdf4'
          : s.status === 'failed' ? '#fff1f2' : '#fffbeb',
        border: `1px solid ${
          s.status === 'completed' ? '#bbf7d0'
          : s.status === 'failed' ? '#fecaca' : '#fde68a'
        }`,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <span style={{ fontSize: 28 }}>
          {s.status === 'completed' ? '✅' : s.status === 'failed' ? '❌' : '⏳'}
        </span>
        <div>
          <p style={{ fontSize: 14, fontWeight: 800, color: '#1e293b', margin: 0, fontFamily: 'monospace' }}>
            {s.settlementNumber}
          </p>
          <Badge variant={getStatusVariant(s.status)} size="sm" dot style={{ marginTop: 6 }}>
            {s.status}
          </Badge>
        </div>
      </div>

      {/* Amount breakdown */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10,
      }}>
        {[
          { label: 'Refunds',       value: fmtRs(s.refundsDeducted), red: Number(s.refundsDeducted) > 0 },
          { label: 'Net Transfer',  value: fmtRs(s.netSettlementAmount), green: true },
        ].map((r) => (
          <div key={r.label} style={{
            padding: '12px 14px', textAlign: 'center',
            background: r.green ? '#f0fdf4' : r.red ? '#fff1f2' : '#f8fafc',
            borderRadius: 12,
            border: `1px solid ${r.green ? '#bbf7d0' : r.red ? '#fecaca' : '#f1f5f9'}`,
          }}>
            <p style={{ fontSize: 10, color: r.green ? '#16a34a' : r.red ? '#dc2626' : '#94a3b8', margin: '0 0 3px' }}>
              {r.label}
            </p>
            <p style={{
              fontSize: 15, fontWeight: 800, margin: 0,
              color: r.green ? '#15803d' : r.red ? '#991b1b' : '#1e293b',
            }}>
              {r.red && Number(s.refundsDeducted) > 0 ? '- ' : ''}{r.value}
            </p>
          </div>
        ))}
      </div>

      {/* ✅ Settlement Details — Only Total Bookings & Total Amount */}
      <div style={{
        background: '#f8fafc', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden',
      }}>
        <div style={{ padding: '10px 16px', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#374151', margin: 0 }}>Settlement Details</p>
        </div>
        {[
          { l: 'Total Bookings', v: String(s.totalBookings || 0) },
          { l: 'Total Amount',   v: fmtRs(s.netSettlementAmount) },
        ].map((row) => (
          <div key={row.l} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '9px 16px', borderBottom: '1px solid #f8fafc',
            flexWrap: 'wrap', gap: 4,
          }}>
            <span style={{ fontSize: 12, color: '#64748b', flexShrink: 0 }}>{row.l}</span>
            <span style={{
              fontSize: 12, fontWeight: 600, color: '#1e293b',
              wordBreak: 'break-all', textAlign: 'right',
            }}>
              {row.v}
            </span>
          </div>
        ))}
      </div>

      {/* Failure reason */}
      {s.failureReason && (
        <div style={{
          background: '#fff1f2', border: '1px solid #fecaca',
          borderRadius: 12, padding: '12px 16px',
        }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#dc2626', margin: '0 0 4px' }}>
            Failure Reason
          </p>
          <p style={{ fontSize: 13, color: '#991b1b', margin: 0 }}>{s.failureReason}</p>
        </div>
      )}

      {/* IDs */}
      <div style={{
        padding: '10px 14px', background: '#f8fafc',
        borderRadius: 12, border: '1px solid #e2e8f0',
        display: 'flex', flexDirection: 'column', gap: 5,
      }}>
        {[
          { l: 'Settlement ID', v: s.id },
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

export default function HospitalSettlements() {
  const toast   = useToast()
  const mounted = useMounted()

  const [page,       setPage]       = useState(1)
  const [bankOpen,   setBankOpen]   = useState(false)
  const [bankSaving, setBankSaving] = useState(false)
  const [dlId,       setDlId]       = useState(null)
  const [viewItem,   setViewItem]   = useState(null)
  const [bankForm,   setBankForm]   = useState({
  accountHolderName: '',
  accountNumber:     '',
  ifscCode:          '',
  bankName:          '',
  branchName:        '',
  accountType:       'current',
  upiId:             '',
  panNumber:         '',
  gstin:             '',
})

  const { data: hospitalData }                       = useSWR('/api/hospitals?adminOnly=true', fetcher)
  const hospital                                     = hospitalData?.hospitals?.[0]
  const hospitalId                                   = hospital?.id

  const { data: pendingData, mutate: mutatePending } = useSWR('/api/settlements/pending', fetcher)
  const myPending = (pendingData?.hospitals || []).find((h) => h.id === hospitalId)

  const { data: historyData, isLoading }             = useSWR(
    hospitalId
      ? `/api/settlements?page=${page}&limit=10&entityType=hospital&entityId=${hospitalId}`
      : null,
    fetcher
  )
  const settlements = historyData?.settlements || []
  const totalPages  = historyData?.pagination?.totalPages || 1

  const handleDownload = async (settlementId, settlementNumber) => {
    setDlId(settlementId)
    try {
      const res = await fetch(`/api/settlements/${settlementId}/download`, { credentials: 'include' })
      if (!res.ok) { toast.error('Download failed'); return }
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href = url
      a.download = `MEDLI-Settlement-${settlementNumber}.csv`
      document.body.appendChild(a); a.click(); a.remove()
      URL.revokeObjectURL(url)
      toast.success('Settlement downloaded')
    } catch { toast.error('Download failed') }
    finally { setDlId(null) }
  }

  const saveBankAccount = async () => {
  if (!hospitalId) { toast.error('Hospital not found'); return }

  /* ── Validate required ── */
  if (!bankForm.accountHolderName.trim()) {
    toast.error('Account holder name is required'); return
  }
  if (!bankForm.accountNumber.trim()) {
    toast.error('Account number is required'); return
  }
  if (!/^\d{9,18}$/.test(bankForm.accountNumber.replace(/\s/g, ''))) {
    toast.error('Account number must be 9–18 digits'); return
  }
  if (!bankForm.ifscCode.trim()) {
    toast.error('IFSC code is required'); return
  }
  if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(bankForm.ifscCode.toUpperCase())) {
    toast.error('Invalid IFSC format (e.g., SBIN0001234)'); return
  }

  /* ── Validate optional ── */
  if (bankForm.panNumber && !/^[A-Z]{5}\d{4}[A-Z]$/.test(bankForm.panNumber.toUpperCase())) {
    toast.error('Invalid PAN format (e.g., ABCDE1234F)'); return
  }
  if (bankForm.gstin && !/^\d{2}[A-Z]{5}\d{4}[A-Z]\d[A-Z]\d$/.test(bankForm.gstin.toUpperCase())) {
    toast.error('Invalid GSTIN format'); return
  }

  setBankSaving(true)
  try {
    const res  = await fetch(`/api/hospitals/${hospitalId}/bank-account`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        accountHolderName: bankForm.accountHolderName.trim(),
        accountNumber:     bankForm.accountNumber.replace(/\s/g, ''),
        ifscCode:          bankForm.ifscCode.toUpperCase(),
        bankName:          bankForm.bankName.trim() || undefined,
        branchName:        bankForm.branchName.trim() || undefined,
        accountType:       bankForm.accountType,
        upiId:             bankForm.upiId.trim() || undefined,
        panNumber:         bankForm.panNumber.toUpperCase().trim() || undefined,
        gstin:             bankForm.gstin.toUpperCase().trim() || undefined,
      }),
    })
    const json = await res.json()
    if (json.success) {
      toast.success(json.message || '✅ Bank account saved')
      setBankOpen(false)
      mutatePending()
    } else {
      toast.error(json.error || 'Failed to save')
    }
  } catch { toast.error('Network error') }
  finally { setBankSaving(false) }
}

  const cols = [
    {
      key: 'settlementNumber', header: 'Settlement #',
      render: (v) => (
        <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700 }}>{v}</span>
      ),
    },
    {
      key: 'totalBookings', header: 'Bookings',
      render: (v) => <span style={{ fontSize: 13, fontWeight: 600 }}>{v || 0}</span>,
    },
    {
      key: 'grossAmount', header: 'Revenue',
      render: (v) => <span style={{ fontSize: 13 }}>₹{Number(v || 0).toLocaleString('en-IN')}</span>,
    },
    {
      key: 'refundsDeducted', header: 'Refunds',
      render: (v) => v > 0
        ? <span style={{ fontSize: 13, color: '#ef4444' }}>- ₹{Number(v).toLocaleString('en-IN')}</span>
        : <span style={{ fontSize: 12, color: '#94a3b8' }}>None</span>,
    },
    {
      key: 'netSettlementAmount', header: 'Transferred',
      render: (v) => (
        <span style={{ fontSize: 13, fontWeight: 700, color: '#10b981' }}>
          ₹{Number(v || 0).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'status', header: 'Status',
      render: (v) => <Badge variant={getStatusVariant(v)} size="sm" dot>{v}</Badge>,
    },
    {
      key: 'utrNumber', header: 'UTR',
      render: (v) => v
        ? <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{v}</span>
        : <span style={{ color: '#94a3b8' }}>—</span>,
    },
    {
      key: 'transferredAt', header: 'Date',
      render: (v) => mounted && v
        ? <span style={{ fontSize: 12, color: '#64748b' }}>
            {new Date(v).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
          </span>
        : '—',
    },
    {
      key: 'actions', header: '',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <ViewBtn onClick={() => setViewItem(row)} />
          <DlBtn
            onClick={() => handleDownload(row.id, row.settlementNumber)}
            loading={dlId === row.id}
          />
        </div>
      ),
    },
  ]

  return (
    <>
      <style>{KF}</style>

      <AdminHeader
        title="Settlements"
        subtitle="Your consultation revenue settlements"
        breadcrumbs={[{ label: 'Hospital Admin' }, { label: 'Settlements' }]}
        actions={<BankBtn onClick={() => setBankOpen(true)} />}
      />

      {/* Info banner */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 10,
        background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.12)',
        borderRadius: 14, padding: '12px 16px', marginBottom: 20,
      }}>
        <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>ℹ️</span>
        <p style={{ fontSize: 13, color: '#6366f1', margin: 0, lineHeight: 1.6 }}>
          You receive the full consultation fee paid by patients. Only refunds from cancelled bookings are deducted.
        </p>
      </div>

      {/* Pending settlement card */}
      {myPending ? (
        <div style={{
          backgroundImage: 'linear-gradient(135deg,rgba(99,102,241,0.06),rgba(139,92,246,0.04))',
          border: '1px solid rgba(99,102,241,0.12)', borderRadius: 20, padding: 24, marginBottom: 20,
          animation: 'sl-in .3s ease',
        }}>
          <div style={{
            display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
            marginBottom: 18, flexWrap: 'wrap', gap: 10,
          }}>
            <div>
              <p style={{
                fontSize: 11, fontWeight: 700, color: '#6366f1',
                letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 4px',
              }}>
                Pending Settlement
              </p>
              <p style={{ fontSize: 13, color: '#6366f1', margin: 0 }}>
                {myPending.totalBookings} paid booking{myPending.totalBookings !== 1 ? 's' : ''} awaiting transfer
              </p>
            </div>
            <div style={{
              width: 44, height: 44, background: 'rgba(99,102,241,0.1)',
              borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
            }}>⏳</div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: 12, marginBottom: 16,
          }}>
            {[
              { label: 'Consultation Revenue', value: fmtRs(myPending.grossAmount), sub: `${myPending.totalBookings} bookings` },
              { label: 'Refunds Deducted', value: myPending.refundsDeducted > 0 ? `- ${fmtRs(myPending.refundsDeducted)}` : 'None', sub: 'Cancelled bookings', red: myPending.refundsDeducted > 0 },
              { label: 'You Will Receive', value: fmtRs(myPending.netSettlementAmount), sub: 'Transferred to bank', green: true },
            ].map(({ label, value, sub, green, red }) => (
              <div key={label} style={{
                background: 'rgba(255,255,255,0.7)', borderRadius: 14, padding: 14,
                border: green ? '2px solid rgba(16,185,129,0.3)' : 'none',
              }}>
                <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 4px' }}>{label}</p>
                <p style={{
                  fontSize: 18, fontWeight: 800,
                  color: green ? '#059669' : red ? '#ef4444' : '#1e293b',
                  margin: '0 0 2px',
                }}>
                  {value}
                </p>
                <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>{sub}</p>
              </div>
            ))}
          </div>

          <p style={{ fontSize: 12, color: '#6366f1', margin: 0 }}>
            💡 Contact support@medli.in if your settlement is overdue.
          </p>
        </div>
      ) : pendingData && (
        <div style={{
          background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)',
          borderRadius: 16, padding: '14px 18px', marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 20 }}>✅</span>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#065f46', margin: 0 }}>All caught up!</p>
            <p style={{ fontSize: 11, color: '#10b981', margin: 0 }}>No pending settlements at this time.</p>
          </div>
        </div>
      )}

      {/* Settlement History */}
      <div style={{
        background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9',
        overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f8fafc' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: 0 }}>
            Settlement History
          </h3>
        </div>
        <div style={{ padding: 0 }}>
          {!hospitalId ? (
            <div style={{ padding: 32 }}>
              <EmptyState title="Loading..." message="Fetching hospital data" />
            </div>
          ) : (
            <DataTable
              columns={cols}
              data={settlements}
              loading={isLoading}
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              emptyTitle="No settlements yet"
              emptyMessage="Settlements appear after MEDLI processes your payments"
            />
          )}
        </div>
      </div>

      {/* View Detail Modal */}
      <Modal
        open={!!viewItem}
        onClose={() => setViewItem(null)}
        title={`Settlement — ${viewItem?.settlementNumber || ''}`}
        size="md"
      >
        {viewItem && <SettlementDetail s={viewItem} mounted={mounted} />}
      </Modal>

      {/* Bank Account Modal */}
    {/* Bank Account Modal */}
<Modal open={bankOpen} onClose={() => setBankOpen(false)} title="Update Bank Account" size="md">
  <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 16px' }}>
    Settlement amounts will be transferred directly to this account.
    Fields marked with <span style={{ color: '#ef4444' }}>*</span> are required.
  </p>

  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

    {/* ── Required fields ── */}
    <BInput
      label="Account Holder Name *"
      value={bankForm.accountHolderName}
      onChange={(e) => setBankForm((f) => ({ ...f, accountHolderName: e.target.value }))}
      placeholder="As per bank records"
    />

    <BInput
      label="Account Number *"
      value={bankForm.accountNumber}
      onChange={(e) => setBankForm((f) => ({
        ...f,
        accountNumber: e.target.value.replace(/\D/g, '').slice(0, 18),
      }))}
      placeholder="9 to 18 digits"
    />

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
      <BInput
        label="IFSC Code *"
        value={bankForm.ifscCode}
        onChange={(e) => setBankForm((f) => ({ ...f, ifscCode: e.target.value.toUpperCase().slice(0, 11) }))}
        placeholder="SBIN0001234"
      />
      <BInput
        label="Bank Name"
        value={bankForm.bankName}
        onChange={(e) => setBankForm((f) => ({ ...f, bankName: e.target.value }))}
        placeholder="State Bank of India"
      />
    </div>

    {/* ── Branch + Account Type ── */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
      <BInput
        label="Branch Name"
        value={bankForm.branchName}
        onChange={(e) => setBankForm((f) => ({ ...f, branchName: e.target.value }))}
        placeholder="e.g., Guntur Main"
      />

      {/* Account Type Select */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>
          Account Type
        </label>
        <select
          value={bankForm.accountType}
          onChange={(e) => setBankForm((f) => ({ ...f, accountType: e.target.value }))}
          style={{
            padding: '10px 12px', fontSize: 13, fontFamily: 'inherit',
            borderRadius: 12, border: '1.5px solid #e2e8f0',
            background: '#fff', color: '#0f172a',
            outline: 'none', cursor: 'pointer',
            boxSizing: 'border-box', appearance: 'none',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}
        >
          <option value="current">Current</option>
          <option value="savings">Savings</option>
        </select>
      </div>
    </div>

    {/* ── UPI ── */}
    <BInput
      label="UPI ID (Optional)"
      value={bankForm.upiId}
      onChange={(e) => setBankForm((f) => ({ ...f, upiId: e.target.value }))}
      placeholder="hospitalname@upi"
    />

    {/* ── Tax info ── */}
    <div style={{
      padding: 12, background: 'rgba(99,102,241,0.04)',
      borderRadius: 12, border: '1px solid rgba(99,102,241,0.12)',
    }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', margin: '0 0 10px',
        textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        📋 Tax Information (Optional)
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <BInput
          label="PAN Number"
          value={bankForm.panNumber}
          onChange={(e) => setBankForm((f) => ({
            ...f, panNumber: e.target.value.toUpperCase().slice(0, 10),
          }))}
          placeholder="ABCDE1234F"
        />
        <BInput
          label="GSTIN"
          value={bankForm.gstin}
          onChange={(e) => setBankForm((f) => ({
            ...f, gstin: e.target.value.toUpperCase().slice(0, 15),
          }))}
          placeholder="22AAAAA0000A1Z5"
        />
      </div>
    </div>

    {/* ── Action Buttons ── */}
    <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
      <button
        onClick={() => setBankOpen(false)}
        disabled={bankSaving}
        style={{
          flex: 1, padding: '11px', borderRadius: 12,
          border: '1.5px solid #e2e8f0', background: '#fff',
          color: '#475569', fontSize: 13, fontWeight: 600,
          cursor: bankSaving ? 'not-allowed' : 'pointer',
        }}
      >
        Cancel
      </button>
      <button
        onClick={saveBankAccount}
        disabled={bankSaving}
        style={{
          flex: 1, padding: '11px', borderRadius: 12, border: 'none',
          background: bankSaving
            ? '#e2e8f0'
            : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
          color: bankSaving ? '#94a3b8' : '#fff',
          fontSize: 13, fontWeight: 600,
          cursor: bankSaving ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
      >
        {bankSaving && (
          <span style={{
            width: 14, height: 14, borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff',
            animation: 'sl-spin .7s linear infinite', display: 'inline-block',
          }} />
        )}
        💾 Save Bank Account
      </button>
    </div>

    {/* ⚠️ Re-verification notice */}
    <div style={{
      background: 'rgba(245,158,11,0.08)',
      border: '1px solid rgba(245,158,11,0.25)',
      borderRadius: 10, padding: '8px 12px',
      fontSize: 11, color: '#92400e',
    }}>
      ⚠️ Note: After updating bank details, super admin will need to re-verify the account before settlements can be processed.
    </div>
  </div>
</Modal>
    </>
  )
}