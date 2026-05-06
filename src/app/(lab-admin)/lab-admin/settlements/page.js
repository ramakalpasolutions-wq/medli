// src/app/(lab-admin)/lab-admin/settlements/page.js
'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { motion } from 'framer-motion'
import AdminHeader from '@/components/admin/AdminHeader'
import Card from '@/components/ui/Card'
import Badge, { getStatusVariant } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import DataTable from '@/components/ui/DataTable'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import EmptyState from '@/components/ui/EmptyState'
import { useToast } from '@/context/ToastContext'
import { Building2, CheckCircle, Clock, Info, Download } from 'lucide-react'

function useMounted() {
  const [m, setM] = useState(false)
  useEffect(() => { setM(true) }, [])
  return m
}

const fetcher = (url) =>
  fetch(url, { credentials: 'include' }).then((r) => r.json()).then((j) => j.data)

export default function LabSettlements() {
  const toast   = useToast()
  const mounted = useMounted()
  const [page,       setPage]       = useState(1)
  const [bankOpen,   setBankOpen]   = useState(false)
  const [bankSaving, setBankSaving] = useState(false)
  const [dlId,       setDlId]       = useState(null)   // downloading settlement id
  const [bankForm,   setBankForm]   = useState({
    accountHolderName: '',
    accountNumber:     '',
    ifscCode:          '',
    bankName:          '',
    upiId:             '',
  })

  const { data: labData } = useSWR('/api/labs?adminOnly=true', fetcher)
  const lab   = labData?.labs?.[0]
  const labId = lab?.id

  const { data: pendingData, mutate: mutatePending } = useSWR(
    '/api/settlements/pending', fetcher
  )
  const myPending = (pendingData?.labs || []).find((l) => l.id === labId)

  const { data: historyData, isLoading } = useSWR(
    labId
      ? `/api/settlements?page=${page}&limit=10&entityType=lab&entityId=${labId}`
      : null,
    fetcher
  )
  const settlements = historyData?.settlements || []
  const totalPages  = historyData?.pagination?.totalPages || 1

  // ── Download settlement PDF ─────────────────────────────────────────────────
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
      const blob   = await res.blob()
      const url    = URL.createObjectURL(blob)
      const a      = document.createElement('a')
      a.href       = url
      a.download   = `MEDLI-Settlement-${settlementNumber}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toast.success('Settlement downloaded')
    } catch {
      toast.error('Download failed. Please try again.')
    } finally {
      setDlId(null)
    }
  }

  const saveBankAccount = async () => {
    if (!labId) { toast.error('Lab not found'); return }
    if (!bankForm.accountNumber || !bankForm.ifscCode) {
      toast.error('Account number and IFSC code are required')
      return
    }
    setBankSaving(true)
    try {
      const res  = await fetch(`/api/labs/${labId}/bank-account`, {
        method:      'PUT',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:        JSON.stringify(bankForm),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Bank account saved successfully')
        setBankOpen(false)
        mutatePending()
      } else {
        toast.error(json.error || 'Failed to save bank account')
      }
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setBankSaving(false)
    }
  }

  // ✅ Columns with Download button
  const cols = [
    {
      key:    'settlementNumber',
      header: 'Settlement #',
      render: (v) => <span className="font-mono text-xs font-bold text-gray-700">{v}</span>,
    },
    {
      key:    'totalBookings',
      header: 'Bookings',
      render: (v) => <span className="text-sm font-medium text-gray-800">{v || 0}</span>,
    },
    {
      key:    'grossAmount',
      header: 'Test Revenue',
      render: (v) => (
        <span className="text-sm font-medium text-gray-700">
          Rs. {Number(v || 0).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key:    'refundsDeducted',
      header: 'Refunds',
      render: (v) => v > 0
        ? <span className="text-sm text-red-500">- Rs. {Number(v).toLocaleString('en-IN')}</span>
        : <span className="text-xs text-gray-400">None</span>,
    },
    {
      key:    'netSettlementAmount',
      header: 'Amount Transferred',
      render: (v) => (
        <span className="text-sm font-bold text-emerald-600">
          Rs. {Number(v || 0).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key:    'status',
      header: 'Status',
      render: (v) => <Badge variant={getStatusVariant(v)} size="sm" dot>{v}</Badge>,
    },
    {
      key:    'utrNumber',
      header: 'UTR',
      render: (v) => v
        ? <span className="font-mono text-xs text-gray-700">{v}</span>
        : <span className="text-xs text-gray-400">—</span>,
    },
    {
      key:    'transferredAt',
      header: 'Date',
      render: (v) => mounted && v
        ? new Date(v).toLocaleDateString('en-IN', { dateStyle: 'medium' })
        : '—',
    },
    {
      key:    'actions',
      header: '',
      render: (_, row) => (
        // ✅ Download PDF button
        <button
          onClick={() => handleDownload(row.id, row.settlementNumber)}
          disabled={dlId === row.id}
          className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 px-2 py-1.5 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
        >
          {dlId === row.id
            ? <span className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            : <Download className="w-3.5 h-3.5" />
          }
          PDF
        </button>
      ),
    },
  ]

  return (
    <div>
      <AdminHeader
        title="Settlements"
        subtitle="Your test revenue settlements"
        breadcrumbs={[{ label: 'Lab Admin' }, { label: 'Settlements' }]}
        actions={
          <Button
            size="sm"
            variant="secondary"
            leftIcon={<Building2 className="w-3.5 h-3.5" />}
            onClick={() => setBankOpen(true)}
          >
            Update Bank Account
          </Button>
        }
      />

      {/* Info banner */}
      <div className="flex items-start gap-3 bg-green-50 border border-green-100 rounded-xl p-4 mb-5">
        <Info className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-green-700">
          You receive the full test fee paid by patients.
          Only refunds from cancelled bookings are deducted.
        </p>
      </div>

      {/* Pending settlement */}
      {myPending ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-2xl p-6 mb-6"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-semibold text-green-500 uppercase tracking-wide mb-1">
                Pending Settlement
              </p>
              <p className="text-sm text-green-700">
                {myPending.totalBookings} paid booking{myPending.totalBookings !== 1 ? 's' : ''} awaiting transfer
              </p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-green-600" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className="bg-white/70 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Test Revenue</p>
              <p className="text-xl font-bold text-gray-800">
                Rs. {Number(myPending.grossAmount || 0).toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {myPending.totalBookings} booking{myPending.totalBookings !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="bg-white/70 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Refunds Deducted</p>
              <p className={`text-xl font-bold ${myPending.refundsDeducted > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                {myPending.refundsDeducted > 0
                  ? `- Rs. ${Number(myPending.refundsDeducted).toLocaleString('en-IN')}`
                  : 'None'}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">Cancelled bookings</p>
            </div>
            <div className="bg-white/70 rounded-xl p-4 border-2 border-emerald-200">
              <p className="text-xs text-emerald-600 font-semibold mb-1">You Will Receive</p>
              <p className="text-xl font-bold text-emerald-700">
                Rs. {Number(myPending.netSettlementAmount || 0).toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">Transferred to bank</p>
            </div>
          </div>

          <p className="text-xs text-green-500">
            💡 Contact support@medli.in if your settlement is overdue.
          </p>
        </motion.div>
      ) : (
        pendingData && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 mb-6 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-emerald-800">All caught up!</p>
              <p className="text-xs text-emerald-600">No pending settlements at this time.</p>
            </div>
          </div>
        )
      )}

      {/* Settlement history */}
      <Card title="Settlement History">
        {!labId ? (
          <EmptyState title="Loading..." message="Fetching lab data" />
        ) : (
          <DataTable
            columns={cols}
            data={settlements}
            loading={isLoading}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            emptyTitle="No settlements yet"
            emptyMessage="Settlements appear here after MEDLI processes your payments"
            keyField="id"
          />
        )}
      </Card>

      {/* Bank Account Modal */}
      <Modal open={bankOpen} onClose={() => setBankOpen(false)} title="Update Bank Account" size="md">
        <p className="text-sm text-gray-500 mb-4">
          Settlement amounts will be transferred directly to this account.
        </p>
        <div className="space-y-3">
          <Input
            label="Account Holder Name *"
            value={bankForm.accountHolderName}
            onChange={(e) => setBankForm((f) => ({ ...f, accountHolderName: e.target.value }))}
            placeholder="As per bank records"
          />
          <Input
            label="Account Number *"
            value={bankForm.accountNumber}
            onChange={(e) => setBankForm((f) => ({ ...f, accountNumber: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="IFSC Code *"
              value={bankForm.ifscCode}
              onChange={(e) => setBankForm((f) => ({ ...f, ifscCode: e.target.value.toUpperCase() }))}
              placeholder="SBIN0001234"
            />
            <Input
              label="Bank Name"
              value={bankForm.bankName}
              onChange={(e) => setBankForm((f) => ({ ...f, bankName: e.target.value }))}
            />
          </div>
          <Input
            label="UPI ID (Optional)"
            value={bankForm.upiId}
            onChange={(e) => setBankForm((f) => ({ ...f, upiId: e.target.value }))}
            placeholder="name@upi"
          />
        </div>
        <div className="flex gap-3 mt-5">
          <Button variant="secondary" className="flex-1" onClick={() => setBankOpen(false)}>Cancel</Button>
          <Button className="flex-1" onClick={saveBankAccount} loading={bankSaving}>Save Bank Account</Button>
        </div>
      </Modal>
    </div>
  )
}