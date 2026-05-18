'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { FileText, Download, ChevronLeft, ChevronRight } from 'lucide-react'
import Navbar from '@/components/public/Navbar'
import Footer from '@/components/public/Footer'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import { SkeletonTableRow } from '@/components/ui/Skeleton'

const fetcher = (url) =>
  fetch(url, { credentials: 'include' }).then((r) => r.json()).then((j) => j.data)

const KF = `
  @keyframes sk-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  @keyframes inv-spin { to{transform:rotate(360deg)} }
`

function DownloadBtn({ invoiceId }) {
  const [loading, setLoading] = useState(false)
  const [h, setH] = useState(false)

  const handleDownload = async () => {
    try {
      setLoading(true)

      const res = await fetch(`/api/invoices/${invoiceId}/download`, {
        credentials: 'include',
      })

      if (!res.ok) {
        const j = await res.json().catch(() => null)
        alert(j?.error || 'Failed to download invoice')
        return
      }

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `invoice-${invoiceId}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      alert('Failed to download invoice')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDownload}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      disabled={loading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '5px 12px',
        borderRadius: 8,
        border: `1.5px solid ${h ? '#6366f1' : '#e2e8f0'}`,
        background: h ? 'rgba(99,102,241,0.06)' : '#fff',
        color: h ? '#6366f1' : '#64748b',
        fontSize: 12,
        fontWeight: 600,
        transition: 'all .15s ease',
        cursor: loading ? 'not-allowed' : 'pointer',
      }}
      type="button"
    >
      <Download size={14} strokeWidth={2.4} />
      {loading ? 'Downloading...' : 'PDF'}
    </button>
  )
}

function PageBtn({ label, disabled, onClick, icon: Icon, iconSide = 'left' }) {
  const [h, setH] = useState(false)

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => !disabled && setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '7px 16px',
        borderRadius: 10,
        border: `1.5px solid ${h && !disabled ? '#6366f1' : '#e2e8f0'}`,
        background: h && !disabled ? 'rgba(99,102,241,0.06)' : '#fff',
        color: disabled ? '#cbd5e1' : h ? '#6366f1' : '#64748b',
        fontSize: 12,
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all .15s ease',
      }}
      type="button"
    >
      {Icon && iconSide === 'left' && <Icon size={14} strokeWidth={2.4} />}
      {label}
      {Icon && iconSide === 'right' && <Icon size={14} strokeWidth={2.4} />}
    </button>
  )
}

export default function InvoicesPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useSWR(`/api/invoices?page=${page}&limit=20`, fetcher)
  const invoices = data?.invoices || []
  const totalPages = data?.pagination?.totalPages || 1

  const COLS = [
    { label: 'Invoice #', width: '25%' },
    { label: 'Amount', width: '20%' },
    { label: 'Type', width: '20%' },
    { label: 'Date', width: '20%' },
    { label: '', width: '15%' },
  ]

  return (
    <>
      <style>{KF}</style>
      <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
        <Navbar />

        <div
          style={{
            maxWidth: 860,
            margin: '0 auto',
            padding: 'clamp(88px,12vw,104px) clamp(16px,3vw,32px) 64px',
          }}
        >
          <h1
            style={{
              fontSize: 'clamp(20px,3vw,26px)',
              fontWeight: 800,
              color: '#0f172a',
              margin: '0 0 24px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: '#ede9fe',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <FileText size={18} strokeWidth={2.2} color="#7c3aed" />
            </span>
            Invoices
          </h1>

          {!isLoading && !invoices.length ? (
            <div
              style={{
                background: '#fff',
                borderRadius: 20,
                border: '1px solid #f1f5f9',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}
            >
              <EmptyState
                icon={
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 16,
                      background: '#ede9fe',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <FileText size={28} color="#7c3aed" strokeWidth={2.1} />
                  </div>
                }
                title="No invoices yet"
                message="Invoices will appear here after bookings"
              />
            </div>
          ) : (
            <div
              style={{
                background: '#fff',
                borderRadius: 20,
                border: '1px solid #f1f5f9',
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 540 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                      {COLS.map((c) => (
                        <th
                          key={c.label}
                          style={{
                            padding: '12px 16px',
                            textAlign: 'left',
                            fontSize: 11,
                            fontWeight: 700,
                            color: '#94a3b8',
                            textTransform: 'uppercase',
                            letterSpacing: '0.8px',
                            width: c.width,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {c.label}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {isLoading ? (
                      [1, 2, 3, 4, 5].map((_, i) => (
                        <SkeletonTableRow key={i} cols={5} rowIndex={i} />
                      ))
                    ) : (
                      invoices.map((inv, i) => (
                        <InvoiceRow key={inv.id} inv={inv} isLast={i === invoices.length - 1} />
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderTop: '1px solid #f1f5f9',
                    background: '#fafafa',
                    flexWrap: 'wrap',
                    gap: 8,
                  }}
                >
                  <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>
                    Page {page} of {totalPages}
                  </p>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <PageBtn
                      label="Prev"
                      icon={ChevronLeft}
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    />
                    <PageBtn
                      label="Next"
                      icon={ChevronRight}
                      iconSide="right"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <Footer />
      </div>
    </>
  )
}

function InvoiceRow({ inv, isLast }) {
  const [h, setH] = useState(false)

  return (
    <tr
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        borderBottom: isLast ? 'none' : '1px solid #f8fafc',
        background: h ? '#f8fafc' : '#fff',
        transition: 'background .12s ease',
      }}
    >
      <td
        style={{
          padding: '12px 16px',
          fontSize: 12,
          fontFamily: 'monospace',
          fontWeight: 700,
          color: '#334155',
        }}
      >
        {inv.invoiceNumber}
      </td>

      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
        ₹{(inv.totalAmount || 0).toFixed(2)}
      </td>

      <td style={{ padding: '12px 16px' }}>
        <Badge variant={inv.type === 'credit_note' ? 'danger' : 'info'} size="sm">
          {inv.type}
        </Badge>
      </td>

      <td style={{ padding: '12px 16px', fontSize: 12, color: '#64748b' }}>
        {new Date(inv.createdAt).toLocaleDateString('en-IN')}
      </td>

      <td style={{ padding: '12px 16px' }}>
        <DownloadBtn invoiceId={inv.id} />
      </td>
    </tr>
  )
}