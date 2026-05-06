// src/app/(regional)/regional/settlements/page.js
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import useSWR from 'swr'
import AdminHeader from '@/components/admin/AdminHeader'
import DataTable from '@/components/ui/DataTable'
import Badge from '@/components/ui/Badge'
import Card from '@/components/ui/Card'
import StatsCard from '@/components/ui/StatsCard'
import EmptyState from '@/components/ui/EmptyState'
import { useToast } from '@/context/ToastContext'
import {
  Banknote, Clock, CheckCircle, Building2,
  FlaskConical, AlertCircle,
} from 'lucide-react'

function useMounted() {
  const [m, setM] = useState(false)
  useEffect(() => { setM(true) }, [])
  return m
}

const fetcher = (url) =>
  fetch(url, { credentials: 'include' })
    .then((r) => r.json())
    .then((j) => {
      if (!j.success) throw new Error(j.error || 'Failed to fetch')
      return j.data
    })

const fmtRs = (n) =>
  `Rs. ${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`

// ── Pending entity card (read-only for regional manager) ─────────────────────
function PendingEntityCard({ entity }) {
  const isHospital = entity.entityType === 'hospital'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-2xl border p-5 ${
        isHospital ? 'border-blue-100' : 'border-green-100'
      }`}
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {isHospital
            ? <Building2   className="w-4 h-4 text-blue-500"  />
            : <FlaskConical className="w-4 h-4 text-green-500" />}
          <div>
            <p className="text-sm font-semibold text-gray-900">{entity.name}</p>
            <p className="text-xs text-gray-400 capitalize">{entity.entityType}</p>
          </div>
        </div>
        <Badge variant={entity.bankAccount?.isVerified ? 'success' : 'warning'}>
          {entity.bankAccount?.isVerified ? 'Bank Verified' : 'Bank Unverified'}
        </Badge>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        {[
          { label: 'Bookings',    value: entity.totalBookings                   },
          { label: 'Gross',       value: fmtRs(entity.grossAmount)              },
          { label: 'Net Amount',  value: fmtRs(entity.netSettlementAmount), highlight: true },
        ].map((s) => (
          <div
            key={s.label}
            className={`rounded-xl p-2.5 text-center ${
              s.highlight ? 'bg-blue-50' : 'bg-gray-50'
            }`}
          >
            <p className={`text-xs mb-0.5 ${
              s.highlight ? 'text-blue-600' : 'text-gray-400'
            }`}>
              {s.label}
            </p>
            <p className={`text-sm font-bold ${
              s.highlight ? 'text-blue-700' : 'text-gray-800'
            }`}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Read-only notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-700">
        ℹ️ Contact super admin to process this settlement
      </div>
    </motion.div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function RegionalSettlementsPage() {
  const toast   = useToast()
  const mounted = useMounted()
  const [tab,   setTab]   = useState('pending')
  const [page,  setPage]  = useState(1)

  // ── Pending settlements (regional scope) ──────────────────────────────────
  const {
    data:      pending,
    isLoading: pendingLoading,
    error:     pendingError,
  } = useSWR(
    tab === 'pending' ? '/api/settlements/pending' : null,
    fetcher,
    { refreshInterval: 60000 }
  )

  // ── Settlement history ────────────────────────────────────────────────────
  const historyQs = new URLSearchParams({ page, limit: 20 })
  const {
    data:      history,
    isLoading: historyLoading,
  } = useSWR(
    tab === 'history' ? `/api/settlements?${historyQs}` : null,
    fetcher
  )

  const pendingHospitals = pending?.hospitals || []
  const pendingLabs      = pending?.labs      || []
  const pendingEntities  = [...pendingHospitals, ...pendingLabs]

  const tabs = [
    { key: 'pending', label: 'Pending',   count: pendingEntities.length },
    { key: 'history', label: 'Completed'                                 },
  ]

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
            : v === 'processing' ? 'info'
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
  ]

  return (
    <div>
      <AdminHeader
        title="Settlements"
        subtitle="View settlement status for your region"
        breadcrumbs={[
          { label: 'Dashboard', href: '/regional/dashboard' },
          { label: 'Settlements' },
        ]}
      />

      {/* Tab buttons */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setPage(1) }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
              tab === t.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-1.5 py-0.5 rounded-full">
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── PENDING TAB ── */}
      {tab === 'pending' && (
        <div>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <StatsCard
              title="Pending Entities"
              value={pendingEntities.length}
              icon={<Clock className="w-5 h-5" />}
              color="orange"
            />
            <StatsCard
              title="Total Pending Amount"
              value={fmtRs(pending?.totalAmount || 0)}
              icon={<Banknote className="w-5 h-5" />}
              color="blue"
            />
          </div>

          {/* Info banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-semibold mb-1">Read-Only View</p>
              <p>
                You can view pending settlements for your region.
                Only the super admin can initiate and confirm settlements.
                Contact <strong>support@medli.in</strong> to request a settlement.
              </p>
            </div>
          </div>

          {pendingLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-gray-100 p-6 h-48 animate-pulse"
                />
              ))}
            </div>
          ) : pendingError ? (
            <Card>
              <div className="flex items-center gap-3 py-8 px-6">
                <AlertCircle className="w-6 h-6 text-red-400" />
                <p className="text-sm text-gray-600">
                  Failed to load settlements.
                </p>
              </div>
            </Card>
          ) : pendingEntities.length === 0 ? (
            <EmptyState
              icon={<CheckCircle className="w-8 h-8 text-emerald-500" />}
              title="All settled!"
              message="No pending settlements for your region."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingEntities.map((entity) => (
                <PendingEntityCard
                  key={`${entity.entityType}-${entity.entityId}`}
                  entity={entity}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── HISTORY TAB ── */}
      {tab === 'history' && (
        <div className="overflow-x-auto">
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
        </div>
      )}
    </div>
  )
}