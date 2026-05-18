'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import useSWR from 'swr'
import AdminHeader from '@/components/admin/AdminHeader'
import Tabs        from '@/components/ui/Tabs'
import StatsCard   from '@/components/ui/StatsCard'
import DataTable   from '@/components/ui/DataTable'
import Badge       from '@/components/ui/Badge'
import Button      from '@/components/ui/Button'
import Modal       from '@/components/ui/Modal'
import Card        from '@/components/ui/Card'
import { useToast } from '@/context/ToastContext'
import {
  Banknote, Clock, CheckCircle, RotateCcw,
  Download, Info, Building2, FlaskConical, Copy,
} from 'lucide-react'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function useMounted() {
  const [m, setM] = useState(false)
  useEffect(() => { setM(true) }, [])
  return m
}

const fetcher = (url) =>
  fetch(url, { credentials: 'include' })
    .then((r) => r.json())
    .then((j) => j.data)

const fmtRs = (n) =>
  `Rs. ${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`

// ─── Transfer Instructions Modal ──────────────────────────────────────────────

function TransferInstructionsModal({ isOpen, onClose, data }) {
  const toast = useToast()
  const copy  = (val) => {
    if (!val) return
    navigator.clipboard.writeText(String(val))
    toast.success('Copied!')
  }
  if (!data) return null

  const rows = [
    { label: 'Amount',       value: fmtRs(data.amount),    bold: true          },
    { label: 'Beneficiary',  value: data.beneficiaryName                        },
    { label: 'Account No.',  value: data.accountNumber,    canCopy: true       },
    { label: 'IFSC Code',    value: data.ifscCode,         canCopy: true       },
    { label: 'Bank',         value: data.bankName                               },
    { label: 'Account Type', value: data.accountType                            },
    { label: 'Reference',    value: data.referenceNote,    canCopy: true, highlight: true },
  ].filter((r) => r.value)
return (
  <Modal open={isOpen} onClose={onClose} title="Bank Transfer Instructions" size="md">
      <div style={{ padding: '0 24px 24px' }}>
        <div style={{
          background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12,
          padding: '12px 16px', display: 'flex', gap: 10, marginBottom: 16,
        }}>
          <Info style={{ width: 16, height: 16, color: '#d97706', flexShrink: 0, marginTop: 2 }} />
          <p style={{ fontSize: 13, color: '#92400e', margin: 0, lineHeight: 1.6 }}>
            Transfer the exact amount to the account below using your bank.
            After the transfer, go to the <strong>Processing</strong> tab and
            confirm with the UTR number.
          </p>
        </div>

        <div style={{
          background: '#f8fafc', borderRadius: 12, padding: '12px 16px',
          marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          {rows.map((row) => (
            <div key={row.label} style={{
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', gap: 16,
            }}>
              <span style={{ fontSize: 12, color: '#64748b', flexShrink: 0, width: 110 }}>
                {row.label}
              </span>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                flex: 1, justifyContent: 'flex-end',
              }}>
                <span style={{
                  fontSize:   row.bold ? 16 : 13,
                  fontWeight: row.bold ? 700 : row.highlight ? 600 : 500,
                  color:      row.highlight ? '#2563eb' : '#1e293b',
                  textAlign: 'right', wordBreak: 'break-all',
                  fontFamily: (row.canCopy && !row.bold) ? 'monospace' : 'inherit',
                }}>
                  {row.value}
                </span>
                {row.canCopy && (
                  <button
                    onClick={() => copy(row.value)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      padding: 4, color: '#94a3b8', flexShrink: 0,
                    }}
                  >
                    <Copy style={{ width: 14, height: 14 }} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {data.upiId && (
          <div style={{
            background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 12,
            padding: '12px 16px', display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', marginBottom: 16,
          }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', margin: '0 0 2px' }}>
                UPI Option
              </p>
              <p style={{ fontSize: 13, fontFamily: 'monospace', color: '#6d28d9', margin: 0 }}>
                {data.upiId}
              </p>
            </div>
            <button
              onClick={() => copy(data.upiId)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a78bfa' }}
            >
              <Copy style={{ width: 16, height: 16 }} />
            </button>
          </div>
        )}

        <p style={{ fontSize: 12, color: '#64748b', textAlign: 'center', marginBottom: 16 }}>
          After transfer, go to <strong>Processing</strong> tab →{' '}
          <strong>Confirm with UTR</strong>
        </p>

        <Button variant="primary" size="lg" className="w-full" onClick={onClose}>
          OK, I&apos;ll Transfer Now
        </Button>
      </div>
    </Modal>
  )
}

// ─── Confirm UTR Modal ────────────────────────────────────────────────────────

// ─── Confirm UTR Modal ────────────────────────────────────────────────────────

function ConfirmUTRModal({ isOpen, onClose, settlement, onConfirmed }) {
  const toast = useToast()
  const [utrNumber,    setUtrNumber]    = useState('')
  const [transferMode, setTransferMode] = useState('NEFT')
  const [loading,      setLoading]      = useState(false)

  useEffect(() => {
    if (isOpen) { setUtrNumber(''); setTransferMode('NEFT') }
  }, [isOpen])

  const handleConfirm = async () => {
    /* ── Validate UTR ── */
    const cleaned = utrNumber.trim().toUpperCase()

    if (!cleaned) {
      toast.error('Please enter the UTR number')
      return
    }
    if (cleaned.length < 6) {
      toast.error('UTR number must be at least 6 characters')
      return
    }
    if (cleaned.length > 30) {
      toast.error('UTR number is too long (max 30 characters)')
      return
    }
    /* UTR is alphanumeric — letters and digits only */
    if (!/^[A-Z0-9]+$/.test(cleaned)) {
      toast.error('UTR can only contain letters and numbers')
      return
    }

    if (!settlement?.id) {
      toast.error('Settlement information missing')
      return
    }

    console.log('[confirm-settlement] Submitting:', {
      settlementId: settlement.id,
      utrNumber:    cleaned,
      transferMode,
    })

    setLoading(true)
    try {
      const res  = await fetch(`/api/settlements/${settlement.id}/confirm`, {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:        JSON.stringify({
          utrNumber:    cleaned,
          transferMode,
        }),
      })

      console.log('[confirm-settlement] Response status:', res.status)

      const json = await res.json().catch(() => ({}))
      console.log('[confirm-settlement] Response body:', json)

      if (!json.success) {
        toast.error(json.error || `Failed (HTTP ${res.status})`)
        return
      }

      toast.success(`✅ Settlement confirmed! UTR: ${cleaned}`)
      onConfirmed()
      onClose()
    } catch (err) {
      console.error('[confirm-settlement] Network error:', err)
      toast.error(`Network error: ${err.message || 'Unknown'}`)
    } finally {
      setLoading(false)
    }
  }

  if (!settlement) return null

  const inputStyle = {
    width: '100%', padding: '10px 12px', fontSize: 13,
    borderRadius: 10, boxSizing: 'border-box',
    border: '1.5px solid #e2e8f0', outline: 'none',
    background: '#fff', transition: 'border-color .15s ease',
    fontFamily: 'inherit',
  }

  return (
    <Modal open={isOpen} onClose={onClose} title="Confirm Settlement" size="sm">
      <div style={{ padding: '0 24px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{
          background: '#f8fafc', borderRadius: 12, padding: '12px 16px',
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          {[
            { l: 'Entity',      v: settlement.entityName                      },
            { l: 'Amount',      v: fmtRs(settlement.netSettlementAmount), bold: true },
            { l: 'Beneficiary', v: settlement.beneficiaryName                 },
            { l: 'Bank',        v: settlement.bankName                        },
          ].filter((r) => r.v).map((row) => (
            <div key={row.l} style={{
              display: 'flex', justifyContent: 'space-between', fontSize: 13,
            }}>
              <span style={{ color: '#64748b' }}>{row.l}</span>
              <span style={{ fontWeight: row.bold ? 700 : 600, color: '#1e293b' }}>
                {row.v}
              </span>
            </div>
          ))}
        </div>

        <div>
          <label style={{
            display: 'block', fontSize: 13, fontWeight: 600,
            color: '#374151', marginBottom: 6,
          }}>
            UTR / Reference Number <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <input
            type="text"
            placeholder="e.g., NEFT12345ABCXYZ"
            value={utrNumber}
            onChange={(e) => setUtrNumber(e.target.value.toUpperCase())}
            disabled={loading}
            style={{ ...inputStyle, fontFamily: 'monospace', textTransform: 'uppercase' }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleConfirm()
            }}
            autoFocus
          />
          <p style={{ fontSize: 11, color: '#94a3b8', margin: '4px 0 0' }}>
            Found in your bank statement after the transfer (6–30 alphanumeric chars)
          </p>
        </div>

        <div>
          <label style={{
            display: 'block', fontSize: 13, fontWeight: 600,
            color: '#374151', marginBottom: 6,
          }}>
            Transfer Mode
          </label>
          <select
            value={transferMode}
            onChange={(e) => setTransferMode(e.target.value)}
            disabled={loading}
            style={{ ...inputStyle, cursor: 'pointer', appearance: 'none' }}
          >
            <option value="NEFT">NEFT</option>
            <option value="IMPS">IMPS</option>
            <option value="RTGS">RTGS</option>
            <option value="UPI">UPI</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="secondary" size="md" className="flex-1"
            onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" size="md" className="flex-1"
            loading={loading} onClick={handleConfirm}>
            Confirm Settlement
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Pending Entity Card ──────────────────────────────────────────────────────

function PendingEntityCard({ entity, onInitiate, initiated, initiating }) {
  const isHospital = entity.entityType === 'hospital'
  const C = isHospital
    ? { bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8', badge: '#dbeafe', badgeText: '#1e40af' }
    : { bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d', badge: '#dcfce7', badgeText: '#166534' }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: initiated ? '#f8fafc' : C.bg,
        border: `1px solid ${initiated ? '#e2e8f0' : C.border}`,
        borderRadius: 20, padding: 24,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        opacity: initiated ? 0.75 : 1,
        transition: 'all .3s ease',
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isHospital
            ? <Building2    style={{ width: 16, height: 16, color: initiated ? '#64748b' : C.text }} />
            : <FlaskConical style={{ width: 16, height: 16, color: initiated ? '#64748b' : C.text }} />
          }
          <p style={{
            fontSize: 13, fontWeight: 700, margin: 0,
            color: initiated ? '#64748b' : C.text,
          }}>
            {entity.name}
          </p>
        </div>
        {/* ✅ Show "Processing" badge if initiated */}
        {initiated ? (
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100,
            background: '#fef3c7', color: '#92400e',
            border: '1px solid #fde68a',
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <Clock style={{ width: 10, height: 10 }} /> Processing
          </span>
        ) : (
          <span style={{
            fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 100,
            background: C.badge, color: C.badgeText,
            border: `1px solid ${C.border}`,
          }}>
            {entity.entityType}
          </span>
        )}
      </div>

      {/* Stats grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
        gap: 10, marginBottom: 16,
      }}>
        {[
          { label: 'Refunds',     value: Number(entity.refundsDeducted) > 0 ? `- ${fmtRs(entity.refundsDeducted)}` : 'None', red: Number(entity.refundsDeducted) > 0 },
          { label: 'You Receive', value: fmtRs(entity.netSettlementAmount), green: true                                  },
        ].map((s) => (
          <div key={s.label} style={{
            background: '#fff', borderRadius: 12, padding: '10px 12px',
            border: s.green ? '2px solid #86efac' : 'none',
          }}>
            <p style={{
              fontSize: 11, marginBottom: 4,
              color: s.green ? '#16a34a' : '#64748b',
              fontWeight: s.green ? 600 : 400,
            }}>
              {s.label}
            </p>
            <p style={{
              fontSize: 13, fontWeight: 700, margin: 0,
              color: s.green ? '#15803d' : s.red ? '#dc2626' : '#1e293b',
            }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Bank status */}
      <div style={{
        background: 'rgba(255,255,255,0.5)', borderRadius: 12,
        padding: '10px 14px', marginBottom: 16, fontSize: 12,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ color: '#64748b' }}>Bank Account</span>
          <span style={{
            fontWeight: 600,
            color: entity.bankAccount?.isVerified ? '#16a34a' : '#d97706',
          }}>
            {entity.bankAccount?.isVerified ? '✓ Verified' : '⚠ Not Verified'}
          </span>
        </div>
        {entity.bankAccount?.bankName && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#64748b' }}>Bank</span>
            <span style={{ fontWeight: 500, color: '#1e293b' }}>
              {entity.bankAccount.bankName}
            </span>
          </div>
        )}
      </div>

      {/* Net amount */}
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <p style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Net Settlement Amount</p>
        <p style={{ fontSize: 24, fontWeight: 800, color: '#1e293b', margin: 0 }}>
          {fmtRs(entity.netSettlementAmount)}
        </p>
      </div>

      {/* ✅ Action — shows initiated state instead of button */}
      {initiated ? (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          background: '#fffbeb', border: '1px solid #fde68a',
          borderRadius: 14, padding: '12px 16px',
        }}>
          <Clock style={{ width: 18, height: 18, color: '#d97706' }} />
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#92400e', margin: 0 }}>
              Settlement Initiated
            </p>
            <p style={{ fontSize: 11, color: '#b45309', margin: '2px 0 0' }}>
              Go to <strong>Processing</strong> tab → Confirm with UTR
            </p>
          </div>
        </div>
      ) : (
        <>
          <Button
            variant="primary"
            size="md"
            className="w-full"
            loading={initiating}
            disabled={!entity.bankAccount?.isVerified || initiating}
            onClick={() => onInitiate(entity)}
          >
            {initiating ? 'Initiating…' : `Initiate Settlement ${fmtRs(entity.netSettlementAmount)}`}
          </Button>
          {!entity.bankAccount?.isVerified && (
            <p style={{
              fontSize: 11, color: '#d97706',
              textAlign: 'center', marginTop: 8,
            }}>
              ⚠ Verify bank account before settling
            </p>
          )}
        </>
      )}
    </motion.div>
  )
}

// ─── Processing Card ──────────────────────────────────────────────────────────

function ProcessingCard({ settlement, onConfirm, onCancel }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: '#fff', borderRadius: 20,
        border: '1px solid #fde68a', padding: 24,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}
    >
      <div style={{
        display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between', marginBottom: 16,
      }}>
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', margin: '0 0 2px' }}>
            {settlement.entityName}
          </p>
          <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>
            {settlement.entityType} · {settlement.settlementNumber}
          </p>
        </div>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontSize: 11, fontWeight: 600,
          background: '#fffbeb', color: '#92400e',
          border: '1px solid #fde68a',
          padding: '4px 10px', borderRadius: 100,
        }}>
          <Clock style={{ width: 12, height: 12 }} /> Awaiting Transfer
        </span>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: 12, marginBottom: 16,
      }}>
        <div style={{ background: '#f8fafc', borderRadius: 12, padding: '10px 14px' }}>
          <p style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Amount</p>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', margin: 0 }}>
            {fmtRs(settlement.netSettlementAmount)}
          </p>
        </div>
        <div style={{ background: '#f8fafc', borderRadius: 12, padding: '10px 14px' }}>
          <p style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Bookings</p>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', margin: 0 }}>
            {settlement.totalBookings}
          </p>
        </div>
      </div>

      <div style={{
        background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12,
        padding: '10px 14px', marginBottom: 16,
        fontSize: 12, color: '#92400e', lineHeight: 1.6,
      }}>
        Transfer <strong>{fmtRs(settlement.netSettlementAmount)}</strong> to{' '}
        <strong>{settlement.beneficiaryName}</strong>
        {settlement.bankName ? ` (${settlement.bankName})` : ''} and confirm with UTR below.
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={() => onCancel(settlement)}
          style={{
            flex: 1, fontSize: 13, fontWeight: 600, color: '#ef4444',
            background: 'transparent', border: '1px solid #fecaca',
            padding: '9px', borderRadius: 12, cursor: 'pointer',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#fff1f2'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          Cancel
        </button>
        <Button
          variant="primary"
          size="sm"
          style={{ flex: 2 }}
          onClick={() => onConfirm(settlement)}
        >
          Confirm with UTR
        </Button>
      </div>
    </motion.div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SettlementsPage() {
  const toast   = useToast()
  const mounted = useMounted()

  const [tab,               setTab]               = useState('pending')
  const [page,              setPage]               = useState(1)
  const [initiatingAll,     setInitiatingAll]      = useState(false)

  // ✅ Track which entity IDs have been initiated this session
  const [initiatedIds,      setInitiatedIds]       = useState(new Set())
  // ✅ Track which entity ID is currently being initiated (for loading state)
  const [initiatingId,      setInitiatingId]       = useState(null)

  const [instructionsModal, setInstructionsModal]  = useState(false)
  const [instructionsData,  setInstructionsData]   = useState(null)
  const [utrModal,          setUtrModal]           = useState(false)
  const [selectedSett,      setSelectedSett]       = useState(null)
  const [dlId,              setDlId]               = useState(null)

  // ── SWR ──────────────────────────────────────────────────────────────────
  const {
    data: pending,
    isLoading: pendingLoading,
    mutate: mutatePending,
  } = useSWR(
    tab === 'pending' ? '/api/settlements/pending' : null,
    fetcher,
    { refreshInterval: 60000 }   // refresh every 60s, not 30s (less aggressive)
  )

  const {
    data: processingData,
    mutate: mutateProcessing,
  } = useSWR(
    '/api/settlements?status=processing&limit=50',
    fetcher,
    { refreshInterval: 30000 }
  )

  const historyStatus = tab === 'failed' ? 'failed' : 'completed'
  const historyQs     = new URLSearchParams({ page, limit: 20, status: historyStatus })
  const {
    data: history,
    isLoading: historyLoading,
    mutate: mutateHistory,
  } = useSWR(
    (tab === 'history' || tab === 'failed')
      ? `/api/settlements?${historyQs}`
      : null,
    fetcher
  )

  // Build pending entity list
  const pendingHospitals = (pending?.hospitals || []).map((h) => ({
    ...h, entityType: 'hospital', entityId: h.id,
  }))
  const pendingLabs = (pending?.labs || []).map((l) => ({
    ...l, entityType: 'lab', entityId: l.id,
  }))
  // ✅ Show ALL entities — but mark initiated ones differently
  const pendingEntities    = [...pendingHospitals, ...pendingLabs]
  const processingSttlmnts = processingData?.settlements || []

  // When tab changes to processing, clear initiated IDs
  // (they are now visible in processing tab)
  useEffect(() => {
    if (tab === 'processing') {
      setInitiatedIds(new Set())
    }
  }, [tab])

  // ── Initiate single ────────────────────────────────────────────────────────
  const handleInitiate = async (entity) => {
    const key = entity.entityId

    setInitiatingId(key)
    try {
      const res  = await fetch('/api/settlements/initiate', {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:        JSON.stringify({
          entityType: entity.entityType,
          entityId:   entity.entityId,
        }),
      })
      const json = await res.json()

      if (!json.success) {
        toast.error(json.error || 'Failed to initiate settlement')
        return
      }

      // ✅ Mark this entity as initiated immediately
      setInitiatedIds((prev) => new Set([...prev, key]))

      setInstructionsData(json.data?.transferInstructions || json.data)
      setInstructionsModal(true)

      mutatePending()
      mutateProcessing()
      toast.success('Settlement initiated — please complete bank transfer')
    } catch {
      toast.error('Failed to initiate settlement')
    } finally {
      setInitiatingId(null)
    }
  }

  // ── Initiate all ───────────────────────────────────────────────────────────
  const handleInitiateAll = async () => {
    const eligible = pendingEntities.filter(
      (e) => e.bankAccount?.isVerified && !initiatedIds.has(e.entityId)
    )
    if (eligible.length === 0) {
      toast.error('No eligible entities with verified bank accounts')
      return
    }
    setInitiatingAll(true)
    try {
      const res  = await fetch('/api/settlements/initiate-all', {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:        JSON.stringify({
          entityIds: eligible.map((e) => ({
            entityType: e.entityType,
            entityId:   e.entityId,
          })),
        }),
      })
      const json = await res.json()

      if (!json.success) {
        toast.error(json.error || 'Bulk initiation failed')
        return
      }

      // ✅ Mark all eligible entities as initiated
      setInitiatedIds((prev) => {
        const next = new Set(prev)
        eligible.forEach((e) => next.add(e.entityId))
        return next
      })

      toast.success(
        `Initiated ${json.data?.successful || eligible.length}/${eligible.length} settlements. ` +
        `Go to Processing tab to confirm with UTR.`
      )
      mutatePending()
      mutateProcessing()
    } catch {
      toast.error('Bulk initiation failed')
    } finally {
      setInitiatingAll(false)
    }
  }

  // ── UTR confirmed ──────────────────────────────────────────────────────────
  const handleUTRConfirmed = () => {
    mutateProcessing()
    mutateHistory()
    mutatePending()
  }

  // ── Cancel processing settlement ───────────────────────────────────────────
  // ── Cancel processing settlement ───────────────────────────────────────────
const handleCancelSettlement = async (settlement) => {
  const reason = prompt(
    `Cancel settlement ${settlement.settlementNumber}?\n\nReason for cancellation (required, min 5 chars):`
  )

  if (reason === null) return     // user clicked "Cancel" in the prompt

  const cleanReason = reason.trim()

  if (cleanReason.length < 5) {
    toast.error('Cancellation reason must be at least 5 characters')
    return
  }

  try {
    const res  = await fetch(`/api/settlements/${settlement.id}/cancel`, {
      method:      'POST',
      headers:     { 'Content-Type': 'application/json' },
      credentials: 'include',
      body:        JSON.stringify({ reason: cleanReason }),
    })
    const json = await res.json()

    if (json.success) {
      toast.success('Settlement cancelled')
    } else {
      toast.error(json.error || 'Cancel failed')
    }

    mutateProcessing()
    mutateHistory()
    mutatePending()
  } catch (err) {
    console.error('[cancel-settlement] Error:', err)
    toast.error('Failed to cancel settlement')
  }
}

  // ── Download ───────────────────────────────────────────────────────────────
  const handleDownload = async (settlementId, settlementNumber) => {
    setDlId(settlementId)
    try {
      const res = await fetch(`/api/settlements/${settlementId}/download`, {
        credentials: 'include',
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || 'Download failed')
        return
      }
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `MEDLI-Settlement-${settlementNumber}.csv`
      document.body.appendChild(a); a.click(); a.remove()
      URL.revokeObjectURL(url)
      toast.success('Downloaded')
    } catch {
      toast.error('Download failed')
    } finally {
      setDlId(null)
    }
  }

  // ── Retry failed ───────────────────────────────────────────────────────────
  const retrySettlement = async (settlement) => {
    try {
      const res  = await fetch('/api/settlements/initiate', {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:        JSON.stringify({
          entityType: settlement.entityType,
          entityId:   settlement.entityId,
        }),
      })
      const json = await res.json()
      if (!json.success) { toast.error(json.error || 'Retry failed'); return }
      setInstructionsData(json.data?.transferInstructions || json.data)
      setInstructionsModal(true)
      mutateHistory()
      mutateProcessing()
      toast.success('Settlement re-initiated')
    } catch {
      toast.error('Retry failed')
    }
  }

  // ── Tabs ───────────────────────────────────────────────────────────────────
  // ✅ Show non-initiated count in pending tab
  const notYetInitiated = pendingEntities.filter((e) => !initiatedIds.has(e.entityId))

  const tabs = [
    { key: 'pending',    label: 'Pending',    count: notYetInitiated.length    },
    { key: 'processing', label: 'Processing', count: processingSttlmnts.length },
    { key: 'history',    label: 'Completed'                                    },
    { key: 'failed',     label: 'Failed'                                       },
  ]

  // ── History table columns ──────────────────────────────────────────────────
  const historyCols = [
    {
      key: 'settlementNumber', header: 'Settlement #',
      render: (v) => (
        <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: '#374151' }}>
          {v}
        </span>
      ),
    },
    {
      key: 'entityName', header: 'Entity',
      render: (v, row) => (
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', margin: '0 0 3px' }}>
            {v || '—'}
          </p>
          <Badge variant={row.entityType === 'hospital' ? 'info' : 'success'} size="sm">
            {row.entityType}
          </Badge>
        </div>
      ),
    },
    {
      key: 'netSettlementAmount', header: 'Net Amount',
      render: (v) => (
        <span style={{ fontWeight: 700, color: '#059669', fontSize: 14 }}>
          {fmtRs(v)}
        </span>
      ),
    },
    {
      key: 'utrNumber', header: 'UTR',
      render: (v) => v
        ? <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#374151' }}>{v}</span>
        : <span style={{ color: '#94a3b8', fontSize: 12 }}>—</span>,
    },
    {
      key: 'transferMode', header: 'Mode',
      render: (v) => v || '—',
    },
    {
      key: 'status', header: 'Status',
      render: (v) => (
        <Badge
          variant={v === 'completed' ? 'success' : v === 'failed' ? 'danger' : 'warning'}
          size="sm" dot
        >
          {v}
        </Badge>
      ),
    },
    {
      key: 'transferredAt', header: 'Date',
      render: (v) =>
        mounted && v
          ? new Date(v).toLocaleDateString('en-IN', { dateStyle: 'medium' })
          : '—',
    },
    {
      key: 'actions', header: '',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={() => handleDownload(row.id, row.settlementNumber)}
            disabled={dlId === row.id}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 12, fontWeight: 600, color: '#2563eb',
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '5px 8px', borderRadius: 8,
              opacity: dlId === row.id ? 0.5 : 1,
            }}
          >
            {dlId === row.id
              ? <span style={{
                  width: 12, height: 12,
                  border: '2px solid #60a5fa', borderTopColor: 'transparent',
                  borderRadius: '50%', animation: 'bk-spin .7s linear infinite',
                  display: 'inline-block',
                }} />
              : <Download style={{ width: 13, height: 13 }} />
            }
            CSV
          </button>
          {tab === 'failed' && row.status === 'failed' && (
            <button
              onClick={() => retrySettlement(row)}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                fontSize: 12, fontWeight: 600, color: '#d97706',
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '5px 8px', borderRadius: 8,
              }}
            >
              <RotateCcw style={{ width: 13, height: 13 }} /> Retry
            </button>
          )}
        </div>
      ),
    },
  ]

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div>
      <style>{`@keyframes bk-spin{to{transform:rotate(360deg)}}`}</style>

      <AdminHeader
        title="Settlements"
        subtitle="Manage provider settlements manually"
        breadcrumbs={[
          { label: 'Dashboard', href: '/super-admin/dashboard' },
          { label: 'Settlements' },
        ]}
      />

      <Tabs
        tabs={tabs}
        activeTab={tab}
        onChange={(k) => { setTab(k); setPage(1) }}
        className="mb-6"
      />

      {/* ── PENDING TAB ── */}
      {tab === 'pending' && (
        <div>
          {/* Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))',
            gap: 16, marginBottom: 24,
          }}>
            <StatsCard
              title="Pending Entities"
              value={notYetInitiated.length}
              icon={<Clock style={{ width: 20, height: 20 }} />}
              color="orange"
            />
            <StatsCard
              title="Processing"
              value={processingSttlmnts.length}
              icon={<Banknote style={{ width: 20, height: 20 }} />}
              color="blue"
            />
            <div style={{
              background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9',
              padding: '16px 20px', display: 'flex', alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}>
              <div>
                <p style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Bulk Action</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', margin: 0 }}>
                  Initiate all pending
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                loading={initiatingAll}
                onClick={handleInitiateAll}
                disabled={notYetInitiated.length === 0 || initiatingAll}
              >
                Initiate All
              </Button>
            </div>
          </div>

          {/* How it works */}
          <div style={{
            background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 14,
            padding: '14px 18px', marginBottom: 24,
            display: 'flex', gap: 12,
          }}>
            <Info style={{ width: 16, height: 16, color: '#2563eb', flexShrink: 0, marginTop: 2 }} />
            <div style={{ fontSize: 13, color: '#1d4ed8', lineHeight: 1.7 }}>
              <p style={{ fontWeight: 700, margin: '0 0 4px' }}>Manual Settlement Flow</p>
              <p style={{ margin: 0 }}>
                1. Click <strong>Initiate Settlement</strong> → system shows bank transfer details.&nbsp;
                2. Transfer the amount from your bank.&nbsp;
                3. Go to <strong>Processing</strong> tab → <strong>Confirm with UTR</strong>.
              </p>
            </div>
          </div>

          {/* Initiated banner */}
          {initiatedIds.size > 0 && (
            <div style={{
              background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 14,
              padding: '12px 18px', marginBottom: 20,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Clock style={{ width: 16, height: 16, color: '#d97706' }} />
                <p style={{ fontSize: 13, color: '#92400e', margin: 0 }}>
                  <strong>{initiatedIds.size}</strong> settlement{initiatedIds.size > 1 ? 's' : ''} initiated.
                  Go to <strong>Processing</strong> tab to confirm with UTR numbers.
                </p>
              </div>
              <button
                onClick={() => { setTab('processing') }}
                style={{
                  fontSize: 12, fontWeight: 700, color: '#92400e',
                  background: '#fde68a', border: 'none',
                  padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                View Processing →
              </button>
            </div>
          )}

          {/* Entity cards */}
          {pendingLoading ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))',
              gap: 16,
            }}>
              {[1, 2].map((i) => (
                <div key={i} style={{
                  background: '#f8fafc', borderRadius: 20,
                  height: 280, opacity: 0.6,
                }} />
              ))}
            </div>
          ) : pendingEntities.length === 0 ? (
            <Card>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '32px 24px',
              }}>
                <CheckCircle style={{ width: 32, height: 32, color: '#10b981', flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#065f46', margin: '0 0 4px' }}>
                    All settled!
                  </p>
                  <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>
                    No pending settlements at this time.
                  </p>
                </div>
              </div>
            </Card>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))',
              gap: 16,
            }}>
              {pendingEntities.map((entity, i) => (
                <motion.div
                  key={entity.entityId}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <PendingEntityCard
                    entity={entity}
                    onInitiate={handleInitiate}
                    // ✅ Pass initiated and initiating states
                    initiated={initiatedIds.has(entity.entityId)}
                    initiating={initiatingId === entity.entityId}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── PROCESSING TAB ── */}
      {tab === 'processing' && (
        <div>
          {processingSttlmnts.length === 0 ? (
            <Card>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '32px 24px',
              }}>
                <Clock style={{ width: 32, height: 32, color: '#d1d5db', flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#374151', margin: '0 0 4px' }}>
                    No processing settlements
                  </p>
                  <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>
                    Settlements awaiting UTR confirmation will appear here.
                  </p>
                </div>
              </div>
            </Card>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))',
              gap: 16,
            }}>
              {processingSttlmnts.map((s) => (
                <ProcessingCard
                  key={s.id}
                  settlement={s}
                  onConfirm={(sett) => { setSelectedSett(sett); setUtrModal(true) }}
                  onCancel={handleCancelSettlement}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── HISTORY / FAILED TAB ── */}
      {(tab === 'history' || tab === 'failed') && (
        <DataTable
          columns={historyCols}
          data={history?.settlements || []}
          loading={historyLoading}
          page={page}
          totalPages={history?.pagination?.totalPages || 1}
          onPageChange={setPage}
          emptyTitle={
            tab === 'failed' ? 'No failed settlements' : 'No completed settlements'
          }
          keyField="id"
        />
      )}

      {/* ── Modals ── */}
      <TransferInstructionsModal
        isOpen={instructionsModal}
        onClose={() => setInstructionsModal(false)}
        data={instructionsData}
      />

      <ConfirmUTRModal
        isOpen={utrModal}
        onClose={() => { setUtrModal(false); setSelectedSett(null) }}
        settlement={selectedSett}
        onConfirmed={handleUTRConfirmed}
      />
    </div>
  )
}