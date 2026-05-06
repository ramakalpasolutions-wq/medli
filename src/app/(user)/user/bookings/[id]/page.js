// src/app/(user)/user/bookings/[id]/page.js
'use client'

import { use, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useSWR from 'swr'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/public/Navbar'
import Footer from '@/components/public/Footer'
import Badge, { getStatusVariant } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { useToast } from '@/context/ToastContext'
import {
  Video, Download, FileText, X, ChevronLeft, FlaskConical,
} from 'lucide-react'

function useMounted() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  return mounted
}

const fetcher = (url) =>
  fetch(url, { credentials: 'include' })
    .then((r) => r.json())
    .then((j) => j.data)

// ── Lab status tracker ────────────────────────────────────────────────────────
const LAB_STEPS = [
  { key: 'sample_collected', label: 'Sample Collected', emoji: '🧪' },
  { key: 'processing',       label: 'Processing',       emoji: '⚗️' },
  { key: 'report_ready',     label: 'Report Ready',     emoji: '📄' },
]

function LabTracker({ status }) {
  const currentIndex = LAB_STEPS.findIndex((s) => s.key === status)

  return (
    <div className="flex items-start gap-0 my-4">
      {LAB_STEPS.map((step, i) => {
        const done   = i <= currentIndex
        const active = i === currentIndex
        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center
                text-xs font-bold transition-all duration-300
                ${done
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                  : 'bg-gray-200 text-gray-400'}
                ${active ? 'ring-2 ring-blue-300 ring-offset-2' : ''}
              `}>
                {i < currentIndex ? '✓' : step.emoji}
              </div>
              <p className={`
                text-[10px] font-medium text-center leading-tight max-w-[64px]
                ${done ? 'text-blue-600' : 'text-gray-400'}
              `}>
                {step.label}
              </p>
            </div>
            {i < LAB_STEPS.length - 1 && (
              <div className={`
                flex-1 h-0.5 mx-1 -translate-y-3 transition-all duration-300
                ${i < currentIndex ? 'bg-blue-600' : 'bg-gray-200'}
              `} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function BookingDetailPage({ params }) {
  const { id }  = use(params)
  const router  = useRouter()
  const mounted = useMounted()
  const toast   = useToast()

  const [cancelConfirm, setCancelConfirm] = useState(false)
  const [cancelling,    setCancelling]    = useState(false)
  const [dlInvoice,     setDlInvoice]     = useState(false)
  const [dlReport,      setDlReport]      = useState(false)

  const { data: booking, isLoading, mutate } = useSWR(
    `/api/bookings/${id}`,
    fetcher
  )

  // Time-based join window — only valid after mount
  const now      = mounted ? new Date() : null
  const diffMins = mounted && booking?.startTime && now
    ? (new Date(booking.startTime) - now) / 60_000
    : null

  const showJoin = booking?.type === 'online'
    && booking?.meetLink
    && diffMins !== null
    && diffMins <= 15
    && diffMins >= -30

  // Cancel only for active bookings
  const canCancel = booking
    ? ['created', 'pending_payment', 'confirmed'].includes(booking.status)
    : false

  const isFinished = ['completed', 'cancelled', 'refunded', 'no_show']
    .includes(booking?.status)

  // ── Invoice download ───────────────────────────────────────────────────────
  const handleInvoiceDownload = async () => {
    setDlInvoice(true)
    try {
      // Step 1: resolve invoice by booking
      const lookupRes  = await fetch(`/api/invoices/by-booking/${id}`, {
        credentials: 'include',
      })
      const lookupJson = await lookupRes.json()

      if (!lookupRes.ok || !lookupJson.data?.id) {
        toast.error(lookupJson.error || 'Invoice not found for this booking')
        return
      }

      const invoiceId     = lookupJson.data.id
      const invoiceNumber = lookupJson.data.invoiceNumber || booking?.bookingId

      // Step 2: stream PDF
      const dlRes = await fetch(`/api/invoices/${invoiceId}/download`, {
        credentials: 'include',
      })

      if (!dlRes.ok) {
        const errJson = await dlRes.json().catch(() => ({}))
        toast.error(errJson.error || 'Could not generate PDF')
        return
      }

      const blob    = await dlRes.blob()
      const blobUrl = URL.createObjectURL(blob)
      const anchor  = document.createElement('a')
      anchor.href     = blobUrl
      anchor.download = `MEDLI-${invoiceNumber}.pdf`
      document.body.appendChild(anchor); anchor.click(); anchor.remove()
      URL.revokeObjectURL(blobUrl)

      toast.success('Invoice downloaded')
    } catch (err) {
      console.error('[Invoice download]', err)
      toast.error('Download failed. Please try again.')
    } finally {
      setDlInvoice(false)
    }
  }

  // ── Lab report download ────────────────────────────────────────────────────
  const handleReportDownload = async () => {
    setDlReport(true)
    try {
      const res  = await fetch(`/api/bookings/${id}/report`, {
        credentials: 'include',
      })
      const json = await res.json()

      if (json.success && json.data?.signedUrl) {
        window.open(json.data.signedUrl, '_blank')
      } else {
        toast.error(json.error || 'Report not available yet')
      }
    } catch {
      toast.error('Failed to fetch report')
    } finally {
      setDlReport(false)
    }
  }

  // ── Cancel booking ─────────────────────────────────────────────────────────
  const handleCancel = async () => {
    setCancelling(true)
    try {
      const res  = await fetch(`/api/bookings/${id}/cancel`, {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:        JSON.stringify({ reason: 'Cancelled by patient' }),
      })
      const json = await res.json()

      if (json.success) {
        const refund = json.data?.refundAmount || 0
        toast.success(
          refund > 0
            ? `Booking cancelled. Refund Rs. ${refund} will be processed.`
            : 'Booking cancelled. No refund applicable.'
        )
        mutate()
        setCancelConfirm(false)
        router.push('/user/bookings')
      } else {
        toast.error(json.error || 'Cancel failed')
      }
    } catch {
      toast.error('Cancel failed. Please try again.')
    } finally {
      setCancelling(false)
    }
  }

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 pt-24 pb-16 space-y-4">
          {[140, 100, 180, 80].map((h, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse"
              style={{ height: h }}
            >
              <div className="h-3 w-24 bg-gray-100 rounded mb-3" />
              <div className="h-3 w-40 bg-gray-100 rounded mb-2" />
              <div className="h-3 w-32 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
        <Footer />
      </div>
    )
  }

  if (!booking) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 space-y-4">

        {/* Back */}
        <button
          onClick={() => router.push('/user/bookings')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-1"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Bookings
        </button>

        {/* Header card */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 border border-gray-100"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs text-gray-400 mb-1">Booking ID</p>
              <p className="text-base font-bold text-gray-800 font-mono">
                {booking.bookingId}
              </p>
            </div>
            <Badge variant={getStatusVariant(booking.status)} size="md" dot>
              {booking.status?.replace(/_/g, ' ')}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              ['Type',    booking.type],
              ['Date',    mounted
                ? new Date(booking.startTime).toLocaleDateString('en-IN')
                : '—'],
              ['Time',    mounted
                ? new Date(booking.startTime).toLocaleTimeString('en-IN', {
                    hour: '2-digit', minute: '2-digit',
                  })
                : '—'],
              ['Payment', booking.paymentStatus],
            ].map(([k, v]) => (
              <div key={k} className="bg-gray-50 rounded-xl px-3 py-2">
                <p className="text-xs text-gray-400">{k}</p>
                <p className="text-sm font-medium text-gray-800 capitalize">{v}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Completed banner */}
        {booking.status === 'completed' && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-2xl p-5"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-lg">
                ✅
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-800">
                  {booking.type === 'lab' ? 'Tests Completed' : 'Consultation Completed'}
                </p>
                <p className="text-xs text-emerald-600 mt-0.5">
                  {mounted
                    ? `Completed on ${new Date(booking.updatedAt)
                        .toLocaleDateString('en-IN', { dateStyle: 'medium' })}`
                    : '—'}
                </p>
              </div>
            </div>
            {booking.doctorNotes && (
              <div className="mt-3 p-3 bg-white/60 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Doctor&apos;s Notes</p>
                <p className="text-sm text-gray-700">{booking.doctorNotes}</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Cancelled banner */}
        {booking.status === 'cancelled' && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-gradient-to-br from-red-50 to-orange-50 border border-red-200 rounded-2xl p-5"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-lg">
                ❌
              </div>
              <div>
                <p className="text-sm font-semibold text-red-800">Booking Cancelled</p>
                {booking.cancellationReason && (
                  <p className="text-xs text-red-600 mt-0.5">
                    Reason: {booking.cancellationReason}
                  </p>
                )}
              </div>
            </div>
            {booking.refundAmount > 0 && (
              <div className="mt-3 p-3 bg-white/60 rounded-xl flex items-center justify-between">
                <span className="text-xs text-gray-500">Refund Amount</span>
                <span className="text-sm font-bold text-green-600">
                  Rs. {booking.refundAmount?.toFixed(2)}
                </span>
              </div>
            )}
          </motion.div>
        )}

        {/* Online meet — only for active bookings */}
        {booking.type === 'online' && !isFinished && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6"
          >
            <p className="text-sm font-semibold text-green-800 mb-2">
              Video Consultation
            </p>
            {!mounted ? (
              <div className="h-3 w-48 bg-green-100 rounded animate-pulse" />
            ) : showJoin ? (
              <button
                onClick={() => window.open(booking.meetLink, '_blank')}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                style={{ minHeight: 44 }}
              >
                <Video className="w-4 h-4" /> Join Google Meet
              </button>
            ) : (
              <p className="text-xs text-green-700">
                {diffMins !== null && diffMins > 15
                  ? `Link available 15 min before — ${Math.floor(diffMins - 15)} min remaining`
                  : 'Waiting for consultation window'}
              </p>
            )}
          </motion.div>
        )}

        {/* Lab tracker — active lab bookings */}
        {booking.type === 'lab' && !isFinished && booking.labStatus && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="bg-white rounded-2xl p-6 border border-gray-100"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
          >
            <p className="text-sm font-semibold text-gray-800 mb-1 flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-blue-500" /> Lab Status
            </p>
            <LabTracker status={booking.labStatus} />

            {booking.labStatus === 'report_ready' && (
              <button
                onClick={handleReportDownload}
                disabled={dlReport}
                className="flex items-center gap-2 mt-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60"
                style={{ minHeight: 44 }}
              >
                {dlReport
                  ? <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                  : <Download className="w-4 h-4" />}
                {dlReport ? 'Loading…' : 'Download Report'}
              </button>
            )}
          </motion.div>
        )}

        {/* Lab report for completed bookings */}
        {booking.type === 'lab' && isFinished && booking.reportR2Key && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="bg-white rounded-2xl p-5 border border-gray-100"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                  📄
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Lab Report</p>
                  <p className="text-xs text-gray-400">Ready for download</p>
                </div>
              </div>
              <button
                onClick={handleReportDownload}
                disabled={dlReport}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60"
                style={{ minHeight: 44 }}
              >
                {dlReport
                  ? <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                  : <Download className="w-4 h-4" />}
                {dlReport ? 'Loading…' : 'Download'}
              </button>
            </div>
          </motion.div>
        )}

        {/* Payment summary */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 border border-gray-100"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
        >
          <p className="text-sm font-semibold text-gray-800 mb-3">Payment Summary</p>
          <div className="space-y-2">
            {[
              { label: 'Base Fee',                    value: booking.baseFee,              show: true },
              { label: `Coupon (${booking.couponCode || ''})`,
                                                      value: -booking.couponDiscount,      show: booking.couponDiscount > 0 },
              { label: `Platform Fee (${booking.platformFeePercent}%)`,
                                                      value: booking.platformFee,          show: true },
              { label: `GST (${booking.gstPercent}%)`,value: booking.gst,                  show: true },
              { label: 'Platform Coupon',             value: -booking.adminCouponDiscount, show: booking.adminCouponDiscount > 0 },
            ]
              .filter((r) => r.show)
              .map(({ label, value }) => (
                <div key={label} className="flex justify-between py-1">
                  <span className="text-sm text-gray-500">{label}</span>
                  <span className={`text-sm font-medium ${value < 0 ? 'text-green-600' : 'text-gray-800'}`}>
                    {value < 0 ? '-' : ''}Rs. {Math.abs(value || 0).toFixed(2)}
                  </span>
                </div>
              ))}

            <div className="border-t border-gray-100 pt-2 flex justify-between">
              <span className="text-sm font-bold text-gray-800">Total Paid</span>
              <span className="text-sm font-bold text-blue-600">
                Rs. {booking.totalAmount?.toFixed(2)}
              </span>
            </div>

            {booking.refundAmount > 0 && (
              <div className="flex justify-between py-1">
                <span className="text-sm text-gray-500">Refund Processed</span>
                <span className="text-sm font-medium text-green-600">
                  Rs. {booking.refundAmount?.toFixed(2)}
                </span>
              </div>
            )}
          </div>

          {/* 1Pay transaction details */}
          {(booking.onePayTxnId || booking.onePayPgRefId) && (
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-1.5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Payment Details
              </p>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Gateway</span>
                <span className="text-gray-700 font-medium">1Pay Payment Gateway</span>
              </div>
              {booking.onePayTxnId && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Transaction ID</span>
                  <span className="font-mono text-gray-700">{booking.onePayTxnId}</span>
                </div>
              )}
              {booking.onePayPgRefId && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">PG Reference</span>
                  <span className="font-mono text-gray-700">{booking.onePayPgRefId}</span>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="flex flex-wrap gap-3"
        >
          {/* Invoice download */}
          <Button
            variant="secondary"
            size="sm"
            leftIcon={
              dlInvoice
                ? <span className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                : <FileText className="w-4 h-4" />
            }
            onClick={handleInvoiceDownload}
            disabled={dlInvoice}
          >
            {dlInvoice ? 'Downloading…' : 'Invoice'}
          </Button>

          {/* Cancel — only for active bookings */}
          {canCancel && (
            <Button
              variant="danger"
              size="sm"
              leftIcon={<X className="w-4 h-4" />}
              onClick={() => setCancelConfirm(true)}
            >
              Cancel Booking
            </Button>
          )}
        </motion.div>

      </div>

      <Footer />

      {/* Cancel confirm modal */}
      <ConfirmModal
        open={cancelConfirm}
        onClose={() => setCancelConfirm(false)}
        onConfirm={handleCancel}
        title="Cancel Booking?"
        message="Refund will be processed via 1Pay based on cancellation policy: >24h = 100%, 12-24h = 50%, 4-12h = 25%, <4h = 0%."
        confirmText="Cancel Booking"
        variant="danger"
        loading={cancelling}
        details={{
          'Booking ID': booking?.bookingId,
          'Amount':     `Rs. ${booking?.totalAmount}`,
          'Status':     booking?.status,
        }}
      />
    </div>
  )
}