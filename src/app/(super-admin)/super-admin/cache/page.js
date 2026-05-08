'use client'

import { useState } from 'react'
import useSWR from 'swr'
import AdminHeader from '@/components/admin/AdminHeader'
import Badge from '@/components/ui/Badge'
import { useToast } from '@/context/ToastContext'

const fetcher = (url) =>
  fetch(url, { credentials: 'include' }).then((r) => r.json()).then((j) => j.data)

const KF = `@keyframes cc-spin{to{transform:rotate(360deg)}}`

const CACHE_PATTERNS = [
  { pattern: 'hospital:*',         label: 'Hospital Cache'   },
  { pattern: 'lab:*',              label: 'Lab Cache'        },
  { pattern: 'slots:*',            label: 'Slot Cache'       },
  { pattern: 'nearby:hospitals:*', label: 'Nearby Hospitals' },
  { pattern: 'nearby:labs:*',      label: 'Nearby Labs'      },
  { pattern: 'analytics:*',        label: 'Analytics Cache'  },
  { pattern: 'otp:*',              label: 'OTP Cache'        },
  { pattern: '*',                  label: 'ALL Cache (Nuclear)' },
]

function ClearBtn({ label, isDanger, onClick }) {
  const [h, setH] = useState(false)
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 9, border: 'none',
        background: isDanger
          ? h ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.08)'
          : h ? '#e2e8f0' : '#f1f5f9',
        color: isDanger ? '#ef4444' : '#64748b',
        fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all .13s ease',
      }}>
      🗑 Clear
    </button>
  )
}

function RefreshBtn({ onClick }) {
  const [h, setH] = useState(false)
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 9,
        border: `1.5px solid ${h ? '#6366f1' : '#e2e8f0'}`,
        background: h ? 'rgba(99,102,241,0.06)' : '#fff',
        color: h ? '#6366f1' : '#64748b', fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all .13s ease',
      }}>
      🔄 Refresh
    </button>
  )
}

function SCard({ title, action, children }) {
  return (
    <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
      {(title || action) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid #f8fafc' }}>
          {title && <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: 0 }}>{title}</h3>}
          {action}
        </div>
      )}
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  )
}

export default function CachePage() {
  const toast = useToast()
  const { data: queues, isLoading, mutate } = useSWR('/api/admin/queues', fetcher, { refreshInterval: 10000 })

  const clearCache = async (pattern) => {
    try {
      const res  = await fetch('/api/admin/cache/clear', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ pattern }),
      })
      const json = await res.json()
      json.success ? toast.success(`Cleared: ${pattern}`) : toast.error(json.error)
    } catch { toast.error('Failed to clear cache') }
  }

  return (
    <>
      <style>{KF}</style>
      <AdminHeader title="Cache & Queues" subtitle="Manage Redis cache and BullMQ queue status"
        breadcrumbs={[{ label: 'Dashboard', href: '/super-admin/dashboard' }, { label: 'Cache' }]} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 20 }}>
        {/* Cache management */}
        <SCard title="Cache Management">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {CACHE_PATTERNS.map((item) => (
              <div key={item.pattern} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 12px', borderRadius: 12,
                border: `1px solid ${item.pattern === '*' ? 'rgba(239,68,68,0.15)' : '#f1f5f9'}`,
                background: item.pattern === '*' ? 'rgba(239,68,68,0.04)' : '#f8fafc',
              }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 500, color: item.pattern === '*' ? '#dc2626' : '#334155', margin: 0 }}>{item.label}</p>
                  <p style={{ fontSize: 10, fontFamily: 'monospace', color: '#94a3b8', margin: '2px 0 0' }}>{item.pattern}</p>
                </div>
                <ClearBtn label="Clear" isDanger={item.pattern === '*'} onClick={() => clearCache(item.pattern)} />
              </div>
            ))}
          </div>
        </SCard>

        {/* Queue status */}
        <SCard title="Queue Status" action={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Badge variant="success" size="sm" dot pulse>Live</Badge>
            <RefreshBtn onClick={() => mutate()} />
          </div>
        }>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                  {['Queue','Waiting','Active','Done','Failed'].map((h) => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={5} style={{ padding: '24px', textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>Loading...</td></tr>
                ) : (queues || []).map((q) => (
                  <tr key={q.name} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 500, color: '#1e293b', textTransform: 'capitalize' }}>{q.name}</td>
                    <td style={{ padding: '10px 12px', color: '#64748b' }}>{q.waiting}</td>
                    <td style={{ padding: '10px 12px' }}><Badge variant={q.active>0?'info':'neutral'} size="sm">{q.active}</Badge></td>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: '#10b981' }}>{q.completed}</td>
                    <td style={{ padding: '10px 12px' }}>
                      {q.failed > 0 ? <Badge variant="danger" size="sm">{q.failed}</Badge> : <span style={{ color: '#94a3b8', fontSize: 12 }}>0</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', marginTop: 12 }}>Auto-refreshes every 10 seconds</p>
        </SCard>
      </div>
    </>
  )
}