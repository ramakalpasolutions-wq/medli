// src/app/(super-admin)/super-admin/settlements/page.js
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useSWR from 'swr'
import AdminHeader from '@/components/admin/AdminHeader'
import Tabs from '@/components/ui/Tabs'
import StatsCard from '@/components/ui/StatsCard'
import DataTable from '@/components/ui/DataTable'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Card from '@/components/ui/Card'
import { useToast } from '@/context/ToastContext'
import {
  Banknote, Clock, CheckCircle, RotateCcw,
  Download, Info, Building2, FlaskConical,
  Copy, AlertCircle,
} from 'lucide-react'

function useMounted() {
  const [m, setM] = useState(false)
  useEffect(() => { setM(true) }, [])
  return m
}

const fetcher = (url) =>
  fetch(url, { credentials: 'include' }).then((r) => r.json()).then((j) => j.data)

const fmtRs = (n) =>
  `Rs. ${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`

// ── Transfer Instructions Modal ───────────────────────────────────────────────
function TransferInstructionsModal({ isOpen, onClose, data }) {
  const toast = useToast()

  const copy = (val) => {
    if (!val) return
    navigator.clipboard.writeText(String(val))
    toast.success('Copied!')
  }

  if (!data) return null

  const rows = [
    { label: 'Amount',        value: fmtRs(data.amount),      bold: true    },
    { label: 'Beneficiary',   value: data.beneficiaryName                    },
    { label: 'Account No.',   value: data.accountNumber,       canCopy: true },
    { label: 'IFSC Code',     value: data.ifscCode,            canCopy: true },
    { label: 'Bank',          value: data.bankName                           },
    { label: 'Account Type',  value: data.accountType                        },
    { label: 'Reference',     value: data.referenceNote,       canCopy: true, highlight: true },
  ].filter((r) => r.value)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Bank Transfer Instructions" size="md">
      <div className="p-6 space-y-4">

        {/* Warning banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-2">
          <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700">
            Transfer the exact amount to the account below using your bank.
            After the transfer, go to the <strong>Processing</strong> tab and
            confirm with the UTR number.
          </p>
        </div>

        {/* Bank details */}
        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between gap-4">
              <span className="text-sm text-gray-500 flex-shrink-0 w-28">
                {row.label}
              </span>
              <div className="flex items-center gap-2 flex-1 justify-end">
                <span className={`text-sm text-right break-all ${
                  row.bold
                    ? 'font-bold text-gray-900 text-base'
                    : row.highlight
                      ? 'font-semibold text-blue-600'
                      : 'text-gray-800'
                }`}>
                  {row.value}
                </span>
                {row.canCopy && (
                  <button
                    onClick={() => copy(row.value)}
                    className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* UPI option */}
        {data.upiId && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-purple-600">UPI Option</p>
              <p className="text-sm text-purple-800 font-mono">{data.upiId}</p>
            </div>
            <button onClick={() => copy(data.upiId)}>
              <Copy className="w-4 h-4 text-purple-400" />
            </button>
          </div>
        )}

        <p className="text-xs text-gray-500 text-center">
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

// ── Confirm UTR Modal ─────────────────────────────────────────────────────────
function ConfirmUTRModal({ isOpen, onClose, settlement, onConfirmed }) {
  const toast = useToast()
  const [utrNumber,    setUtrNumber]    = useState('')
  const [transferMode, setTransferMode] = useState('NEFT')
  const [loading,      setLoading]      = useState(false)

  // Reset on open
  useEffect(() => {
    if (isOpen) { setUtrNumber(''); setTransferMode('NEFT') }
  }, [isOpen])

  const handleConfirm = async () => {
    if (!utrNumber.trim()) {
      toast.error('Please enter the UTR number')
      return
    }
    setLoading(true)
    try {
      const res  = await fetch(`/api/settlements/${settlement.id}/confirm`, {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:        JSON.stringify({
          utrNumber:    utrNumber.trim(),
          transferMode,
        }),
      })
      const json = await res.json()

      if (!json.success) {
        toast.error(json.error || 'Failed to confirm settlement')
        return
      }

      toast.success(`Settlement confirmed! UTR: ${utrNumber.trim()}`)
      onConfirmed()
      onClose()
    } catch {
      toast.error('Failed to confirm settlement')
    } finally {
      setLoading(false)
    }
  }

  if (!settlement) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirm Settlement" size="sm">
      <div className="p-6 space-y-4">

        {/* Settlement summary */}
        <div className="bg-gray-50 rounded-xl p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Entity</span>
            <span className="font-semibold text-gray-900">{settlement.entityName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Amount</span>
            <span className="font-bold text-gray-900 text-base">
              {fmtRs(settlement.netSettlementAmount)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Beneficiary</span>
            <span className="font-medium text-gray-900">{settlement.beneficiaryName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Bank</span>
            <span className="font-medium text-gray-900">{settlement.bankName}</span>
          </div>
        </div>

        {/* UTR input */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            UTR / Reference Number <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Enter UTR number from your bank"
            value={utrNumber}
            onChange={(e) => setUtrNumber(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono transition-all"
          />
        </div>

        {/* Transfer mode */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Transfer Mode
          </label>
          <select
            value={transferMode}
            onChange={(e) => setTransferMode(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none bg-white transition-all"
          >
            <option value="NEFT">NEFT</option>
            <option value="IMPS">IMPS</option>
            <option value="RTGS">RTGS</option>
            <option value="UPI">UPI</option>
          </select>
        </div>

        <div className="flex gap-3 pt-1">
          <Button
            variant="secondary"
            size="md"
            className="flex-1"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            className="flex-1"
            loading={loading}
            onClick={handleConfirm}
          >
            Confirm Settlement
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ── Pending entity card ───────────────────────────────────────────────────────
function PendingEntityCard({ entity, result, onInitiate }) {
  const isHospital = entity.entityType === 'hospital'
  const accent     = isHospital ? 'blue' : 'green'

  const cls = {
    blue: {
      bg:     'from-blue-50 to-indigo-50',
      border: 'border-blue-100',
      dot:    'bg-blue-100',
      icon:   'text-blue-600',
      text:   'text-blue-700',
      badge:  'bg-blue-50 border-blue-200 text-blue-700',
      tip:    'text-blue-500',
    },
    green: {
      bg:     'from-green-50 to-emerald-50',
      border: 'border-green-100',
      dot:    'bg-green-100',
      icon:   'text-green-600',
      text:   'text-green-700',
      badge:  'bg-green-50 border-green-200 text-green-700',
      tip:    'text-green-500',
    },
  }[accent]

  const isSettled = result?.status === 'completed'

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-br ${cls.bg} border ${cls.border} rounded-2xl p-6`}
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
    >
      {/* Entity header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {isHospital
            ? <Building2  className={`w-4 h-4 ${cls.icon}`} />
            : <FlaskConical className={`w-4 h-4 ${cls.icon}`} />}
          <p className={`text-xs font-bold uppercase tracking-wide ${cls.text}`}>
            {entity.name}
          </p>
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${cls.badge}`}>
          {entity.entityType}
        </span>
      </div>

      {/* Info */}
      <div className={`flex items-start gap-2 mb-4 mt-1 text-xs ${cls.text}`}>
        <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
        <span>
          {entity.totalBookings} paid booking{entity.totalBookings !== 1 ? 's' : ''} awaiting transfer.
          Only cancelled booking refunds are deducted.
        </span>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-white/70 rounded-xl p-3">
          <p className="text-xs text-gray-500 mb-1">Gross Amount</p>
          <p className="text-sm font-bold text-gray-800">{fmtRs(entity.grossAmount)}</p>
        </div>
        <div className="bg-white/70 rounded-xl p-3">
          <p className="text-xs text-gray-500 mb-1">Refunds</p>
          <p className={`text-sm font-bold ${
            Number(entity.refundsDeducted) > 0 ? 'text-red-600' : 'text-gray-400'
          }`}>
            {Number(entity.refundsDeducted) > 0
              ? `- ${fmtRs(entity.refundsDeducted)}`
              : 'None'}
          </p>
        </div>
        <div className="bg-white/70 rounded-xl p-3 border-2 border-emerald-200">
          <p className="text-xs text-emerald-600 font-semibold mb-1">You Receive</p>
          <p className="text-sm font-bold text-emerald-700">
            {fmtRs(entity.netSettlementAmount)}
          </p>
        </div>
      </div>

      {/* Bank account status */}
      <div className="bg-white/50 rounded-xl p-3 mb-4 text-xs space-y-1">
        <div className="flex justify-between">
          <span className="text-gray-500">Bank Account</span>
          <span className={`font-semibold ${
            entity.bankAccount?.isVerified ? 'text-emerald-600' : 'text-amber-600'
          }`}>
            {entity.bankAccount?.isVerified ? '✓ Verified' : '⚠ Not Verified'}
          </span>
        </div>
        {entity.bankAccount?.bankName && (
          <div className="flex justify-between">
            <span className="text-gray-500">Bank</span>
            <span className="font-medium text-gray-700">{entity.bankAccount.bankName}</span>
          </div>
        )}
        {entity.bankAccount?.ifscCode && (
          <div className="flex justify-between">
            <span className="text-gray-500">IFSC</span>
            <span className="font-mono text-gray-700">{entity.bankAccount.ifscCode}</span>
          </div>
        )}
      </div>

      {/* Net amount */}
      <div className="text-center mb-4">
        <p className="text-xs text-gray-500 mb-1">Net Settlement Amount</p>
        <p className="text-2xl font-bold text-gray-900">
          {fmtRs(entity.netSettlementAmount)}
        </p>
      </div>

      {/* Action */}
      {isSettled ? (
        <div className="flex items-center justify-center gap-2 text-emerald-600 bg-white/80 px-4 py-3 rounded-xl border border-emerald-200">
          <CheckCircle className="w-4 h-4" />
          <div className="text-center">
            <p className="text-xs font-bold">SETTLED</p>
            {result.utrNumber && (
              <p className="text-xs text-gray-500 font-mono">UTR: {result.utrNumber}</p>
            )}
          </div>
        </div>
      ) : (
        <>
          <Button
            variant="primary"
            size="md"
            className="w-full"
            disabled={!entity.bankAccount?.isVerified}
            onClick={() => onInitiate(entity)}
          >
            Initiate Settlement {fmtRs(entity.netSettlementAmount)}
          </Button>
          {!entity.bankAccount?.isVerified && (
            <p className="text-xs text-amber-600 text-center mt-2">
              ⚠ Verify bank account before settling
            </p>
          )}
        </>
      )}
    </motion.div>
  )
}

// ── Processing card ───────────────────────────────────────────────────────────
function ProcessingCard({ settlement, onConfirm, onCancel }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-amber-200 p-6"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="font-semibold text-gray-900">{settlement.entityName}</p>
          <p className="text-xs text-gray-500 mt-0.5 capitalize">
            {settlement.entityType} · {settlement.settlementNumber}
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full">
          <Clock className="w-3 h-3" /> Awaiting Transfer
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-xs text-gray-500 mb-1">Amount</p>
          <p className="font-bold text-gray-900">{fmtRs(settlement.netSettlementAmount)}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-xs text-gray-500 mb-1">Bookings</p>
          <p className="font-bold text-gray-900">{settlement.totalBookings}</p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-xs text-amber-700">
        Transfer <strong>{fmtRs(settlement.netSettlementAmount)}</strong> to{' '}
        <strong>{settlement.beneficiaryName}</strong>
        {settlement.bankName ? ` (${settlement.bankName})` : ''} and confirm
        with UTR below.
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onCancel(settlement)}
          className="flex-1 text-sm font-medium text-red-600 hover:bg-red-50 py-2 rounded-xl transition-colors border border-red-100"
        >
          Cancel
        </button>
        <Button
          variant="primary"
          size="sm"
          className="flex-grow"
          onClick={() => onConfirm(settlement)}
        >
          Confirm with UTR
        </Button>
      </div>
    </motion.div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function SettlementsPage() {
  const toast   = useToast()
  const mounted = useMounted()

  const [tab,                setTab]                = useState('pending')
  const [page,               setPage]               = useState(1)
  const [initiatingAll,      setInitiatingAll]      = useState(false)
  const [settledResult,      setSettledResult]      = useState({})

  // Transfer instructions modal
  const [instructionsModal,  setInstructionsModal]  = useState(false)
  const [instructionsData,   setInstructionsData]   = useState(null)

  // UTR confirm modal
  const [utrModal,           setUtrModal]           = useState(false)
  const [selectedSettlement, setSelectedSettlement] = useState(null)

  // Download
  const [dlId, setDlId] = useState(null)

  // ── SWR ────────────────────────────────────────────────────────────────────
  const { data: pending, isLoading: pendingLoading, mutate: mutatePending } = useSWR(
    tab === 'pending' ? '/api/settlements/pending' : null,
    fetcher,
    { refreshInterval: 30000 }
  )

  const historyQs = new URLSearchParams({
    page,
    limit:  20,
    status: tab === 'failed'     ? 'failed'
          : tab === 'processing' ? 'processing'
          : 'completed',
  })
  const { data: history, isLoading: historyLoading, mutate: mutateHistory } = useSWR(
    tab !== 'pending' ? `/api/settlements?${historyQs}` : null,
    fetcher
  )

  // Build pending entity list from API
  const pendingHospitals = (pending?.hospitals || []).map((h) => ({
    ...h,
    entityType: 'hospital',
    entityId:   h.id,
  }))
  const pendingLabs = (pending?.labs || []).map((l) => ({
    ...l,
    entityType: 'lab',
    entityId:   l.id,
  }))
  const pendingEntities = [...pendingHospitals, ...pendingLabs]

  // Count processing settlements from history
  const { data: processingData, mutate: mutateProcessing } = useSWR(
    '/api/settlements?status=processing&limit=50',
    fetcher,
    { refreshInterval: 30000 }
  )
  const processingSttlmnts = processingData?.settlements || []

  // ── Initiate single settlement ────────────────────────────────────────────
  const handleInitiate = async (entity) => {
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

      setInstructionsData(json.data.transferInstructions)
      setInstructionsModal(true)
      mutatePending()
      mutateProcessing()
      toast.success('Settlement initiated — please complete bank transfer')
    } catch {
      toast.error('Failed to initiate settlement')
    }
  }

  // ── Initiate all ──────────────────────────────────────────────────────────
  const handleInitiateAll = async () => {
    const eligible = pendingEntities.filter((e) => e.bankAccount?.isVerified)
    if (eligible.length === 0) {
      toast.error('No entities with verified bank accounts')
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

      toast.success(
        `Initiated ${json.data.successful}/${json.data.total} settlements. ` +
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

  // ── UTR confirmed callback ────────────────────────────────────────────────
  const handleUTRConfirmed = () => {
    mutateProcessing()
    mutateHistory()
    mutatePending()
  }

  // ── Cancel processing settlement ─────────────────────────────────────────
  const handleCancelSettlement = async (settlement) => {
    const reason = prompt('Reason for cancellation?')
    if (!reason) return

    try {
      const res  = await fetch(`/api/settlements/${settlement.id}/cancel`, {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:        JSON.stringify({ reason }),
      })
      const json = await res.json()

      json.success
        ? toast.success('Settlement cancelled')
        : toast.error(json.error || 'Cancel failed')

      mutateProcessing()
      mutateHistory()
      mutatePending()
    } catch {
      toast.error('Failed to cancel settlement')
    }
  }

  // ── Download PDF ──────────────────────────────────────────────────────────
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
      a.download = `MEDLI-Settlement-${settlementNumber}.pdf`
      document.body.appendChild(a); a.click(); a.remove()
      URL.revokeObjectURL(url)
      toast.success('Downloaded')
    } catch {
      toast.error('Download failed')
    } finally {
      setDlId(null)
    }
  }

  // ── Retry failed settlement ───────────────────────────────────────────────
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

      if (!json.success) {
        toast.error(json.error || 'Retry failed')
        return
      }

      setInstructionsData(json.data.transferInstructions)
      setInstructionsModal(true)
      mutateHistory()
      mutateProcessing()
      toast.success('Settlement re-initiated')
    } catch {
      toast.error('Retry failed')
    }
  }

  // ── Tab definitions ───────────────────────────────────────────────────────
  const tabs = [
    {
      key:   'pending',
      label: 'Pending',
      count: pendingEntities.length,
    },
    {
      key:   'processing',
      label: 'Processing',
      count: processingSttlmnts.length,
    },
    { key: 'history', label: 'Completed' },
    { key: 'failed',  label: 'Failed'    },
  ]

  // ── History table columns ─────────────────────────────────────────────────
  const historyCols = [
    {
      key:    'settlementNumber',
      header: 'Settlement #',
      render: (v) => (
        <span className="font-mono text-xs font-bold text-gray-700">{v}</span>
      ),
    },
    {
      key:    'entityName',
      header: 'Entity',
      render: (v, row) => (
        <div>
          <p className="text-sm font-medium text-gray-800">{v || '—'}</p>
          <Badge
            variant={row.entityType === 'hospital' ? 'info' : 'success'}
            size="sm"
          >
            {row.entityType}
          </Badge>
        </div>
      ),
    },
    {
      key:    'netSettlementAmount',
      header: 'Net Amount',
      render: (v) => (
        <span className="font-bold text-emerald-600">{fmtRs(v)}</span>
      ),
    },
    {
      key:    'utrNumber',
      header: 'UTR',
      render: (v) => v
        ? <span className="font-mono text-xs text-gray-700">{v}</span>
        : <span className="text-gray-400 text-xs">—</span>,
    },
    {
      key:    'transferMode',
      header: 'Mode',
      render: (v) => v || '—',
    },
    {
      key:    'status',
      header: 'Status',
      render: (v) => (
        <Badge
          variant={
            v === 'completed' ? 'success'
            : v === 'failed'  ? 'danger'
            : 'warning'
          }
          size="sm"
          dot
        >
          {v}
        </Badge>
      ),
    },
    {
      key:    'transferredAt',
      header: 'Date',
      render: (v) =>
        mounted && v
          ? new Date(v).toLocaleDateString('en-IN', { dateStyle: 'medium' })
          : '—',
    },
    {
      key:    'actions',
      header: '',
      render: (_, row) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleDownload(row.id, row.settlementNumber)}
            disabled={dlId === row.id}
            className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 px-2 py-1.5 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
          >
            {dlId === row.id
              ? <span className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              : <Download className="w-3.5 h-3.5" />}
            PDF
          </button>
          {tab === 'failed' && row.status === 'failed' && (
            <button
              onClick={() => retrySettlement(row)}
              className="flex items-center gap-1 text-xs font-medium text-amber-600 hover:text-amber-700 px-2 py-1.5 rounded-lg hover:bg-amber-50 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Retry
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div>
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
          {/* Stats row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <StatsCard
              title="Pending Entities"
              value={pendingEntities.length}
              icon={<Clock className="w-5 h-5" />}
              color="orange"
            />
            <StatsCard
              title="Processing Settlements"
              value={processingSttlmnts.length}
              icon={<Banknote className="w-5 h-5" />}
              color="blue"
            />
            {/* Initiate all card */}
            <div
              className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center justify-between"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
            >
              <div>
                <p className="text-xs text-gray-500 mb-1">Bulk Action</p>
                <p className="text-sm font-medium text-gray-800">
                  Initiate all pending
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                loading={initiatingAll}
                onClick={handleInitiateAll}
                disabled={pendingEntities.length === 0 || initiatingAll}
              >
                Initiate All
              </Button>
            </div>
          </div>

          {/* How it works banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700 space-y-1">
              <p className="font-semibold">Manual Settlement Flow</p>
              <p>
                1. Click <strong>Initiate Settlement</strong> — system shows bank transfer details.
              </p>
              <p>
                2. Transfer the amount from your bank to the provider.
              </p>
              <p>
                3. Go to <strong>Processing</strong> tab → click{' '}
                <strong>Confirm with UTR</strong> → enter the UTR number.
              </p>
            </div>
          </div>

          {pendingLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-gray-100 p-6 h-64 animate-pulse"
                />
              ))}
            </div>
          ) : pendingEntities.length === 0 ? (
            <Card>
              <div className="flex items-center gap-3 py-10 px-6">
                <CheckCircle className="w-8 h-8 text-emerald-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-emerald-800">All settled!</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    No pending settlements at this time.
                  </p>
                </div>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingEntities.map((entity, i) => (
                <motion.div
                  key={entity.entityId}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <PendingEntityCard
                    entity={entity}
                    result={settledResult[entity.entityId]}
                    onInitiate={handleInitiate}
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
              <div className="flex items-center gap-3 py-10 px-6">
                <Clock className="w-8 h-8 text-gray-300 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-700">
                    No processing settlements
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Settlements awaiting UTR confirmation will appear here.
                  </p>
                </div>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {processingSttlmnts.map((s) => (
                <ProcessingCard
                  key={s.id}
                  settlement={s}
                  onConfirm={(settlement) => {
                    setSelectedSettlement(settlement)
                    setUtrModal(true)
                  }}
                  onCancel={handleCancelSettlement}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── HISTORY / FAILED TAB ── */}
      {(tab === 'history' || tab === 'failed') && (
        <div className="overflow-x-auto">
          <DataTable
            columns={historyCols}
            data={history?.settlements || []}
            loading={historyLoading}
            page={page}
            totalPages={history?.pagination?.totalPages || 1}
            onPageChange={setPage}
            emptyTitle={
              tab === 'failed'
                ? 'No failed settlements'
                : 'No completed settlements'
            }
            keyField="id"
          />
        </div>
      )}

      {/* ── Transfer Instructions Modal ── */}
      <TransferInstructionsModal
        isOpen={instructionsModal}
        onClose={() => setInstructionsModal(false)}
        data={instructionsData}
      />

      {/* ── Confirm UTR Modal ── */}
      <ConfirmUTRModal
        isOpen={utrModal}
        onClose={() => {
          setUtrModal(false)
          setSelectedSettlement(null)
        }}
        settlement={selectedSettlement}
        onConfirmed={handleUTRConfirmed}
      />
    </div>
  )
}