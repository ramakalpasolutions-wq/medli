'use client'

import { useState } from 'react'
import useSWR from 'swr'
import AdminHeader from '@/components/admin/AdminHeader'
import DataTable from '@/components/ui/DataTable'
import Badge from '@/components/ui/Badge'
import Tabs from '@/components/ui/Tabs'
import { useToast } from '@/context/ToastContext'

const fetcher = (url) =>
  fetch(url, { credentials: 'include' }).then((r) => r.json()).then((j) => j.data)

const KF = `@keyframes nt-spin{to{transform:rotate(360deg)}}`

function FInput({ label, required: req, ...props }) {
  const [f, setF] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && (
        <label style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>
          {label} {req && <span style={{ color: '#ef4444' }}>*</span>}
        </label>
      )}
      <input {...props} onFocus={(e) => { setF(true); props.onFocus?.(e) }} onBlur={(e) => { setF(false); props.onBlur?.(e) }}
        style={{
          padding: '10px 12px', fontSize: 13, fontFamily: 'inherit',
          borderRadius: 12, border: `1.5px solid ${f ? '#6366f1' : '#e2e8f0'}`,
          background: '#fff', color: '#0f172a', outline: 'none',
          boxShadow: f ? '0 0 0 3px rgba(99,102,241,0.12)' : '0 1px 3px rgba(0,0,0,0.06)',
          transition: 'all .15s ease', width: '100%', boxSizing: 'border-box',
        }}
      />
    </div>
  )
}

function RefreshBtn({ onClick }) {
  const [h, setH] = useState(false)
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10,
        border: `1.5px solid ${h ? '#6366f1' : '#e2e8f0'}`,
        background: h ? 'rgba(99,102,241,0.06)' : '#fff', color: h ? '#6366f1' : '#64748b',
        fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all .15s ease',
      }}>
      🔄 Refresh
    </button>
  )
}

function SendBtn({ onClick, loading: isLoading, disabled }) {
  const [h, setH] = useState(false)
  return (
    <button onClick={onClick} disabled={isLoading || disabled} onMouseEnter={() => !(isLoading||disabled) && setH(true)} onMouseLeave={() => setH(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '11px 20px', borderRadius: 12, border: 'none',
        background: isLoading || disabled ? '#e2e8f0' : h ? 'linear-gradient(135deg,#7c3aed,#6d28d9)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
        color: isLoading || disabled ? '#94a3b8' : '#fff', fontSize: 13, fontWeight: 600,
        cursor: isLoading || disabled ? 'not-allowed' : 'pointer', transition: 'all .15s ease',
      }}>
      {isLoading && <span style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', animation: 'nt-spin .7s linear infinite', display: 'inline-block' }} />}
      📤 Send Broadcast
    </button>
  )
}

const NTABS = [
  { key: 'logs',      label: 'Notification Logs' },
  { key: 'broadcast', label: 'Send Broadcast'     },
]

export default function NotificationsPage() {
  const [tab,     setTab]     = useState('logs')
  const [page,    setPage]    = useState(1)
  const [title,   setTitle]   = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [msgFoc,  setMsgFoc]  = useState(false)
  const toast = useToast()

  const { data, isLoading, mutate } = useSWR(
    tab === 'logs' ? `/api/notifications?page=${page}&limit=20` : null,
    fetcher
  )

  const broadcast = async () => {
    if (!title.trim() || !message.trim()) { toast.error('Title and message are required'); return }
    setSending(true)
    try {
      const res  = await fetch('/api/notifications/broadcast', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ title, message, channels: ['push'] }),
      })
      const json = await res.json()
      json.success ? toast.success('Broadcast queued') : toast.error(json.error)
    } catch { toast.error('Failed to broadcast') }
    setSending(false)
  }

  const logCols = [
    { key: 'channel',    header: 'Channel',  render: (v) => <Badge variant="info" size="sm">{v}</Badge> },
    { key: 'template',   header: 'Template', render: (v) => <span style={{ fontSize: 12 }}>{v || '—'}</span> },
    { key: 'status',     header: 'Status',   render: (v) => <Badge variant={v==='sent'||v==='delivered'?'success':v==='failed'?'danger':'warning'} size="sm" dot>{v}</Badge> },
    { key: 'retryCount', header: 'Retries',  render: (v) => <span style={{ fontSize: 12 }}>{v || 0}</span> },
    { key: 'createdAt',  header: 'Date',     render: (v) => <span style={{ fontSize: 12, color: '#64748b' }}>{new Date(v).toLocaleString('en-IN')}</span> },
  ]

  return (
    <>
      <style>{KF}</style>
      <AdminHeader title="Notifications" subtitle="Manage notification logs and broadcasts"
        breadcrumbs={[{ label: 'Dashboard', href: '/super-admin/dashboard' }, { label: 'Notifications' }]} />
      <Tabs tabs={NTABS} activeTab={tab} onChange={(k) => { setTab(k); setPage(1) }} style={{ marginBottom: 20 }} />

      {tab === 'logs' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <RefreshBtn onClick={() => mutate()} />
          </div>
          <DataTable columns={logCols} data={data?.logs || []} loading={isLoading}
            page={page} totalPages={data?.pagination?.totalPages || 1} onPageChange={setPage}
            emptyTitle="No notification logs" emptyMessage="Notifications sent via queues will appear here" />
        </>
      )}

      {tab === 'broadcast' && (
        <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', padding: 24, maxWidth: 520 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', marginBottom: 20 }}>Send Push Broadcast</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <FInput label="Notification Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. New feature available!" required />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>
                Message <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onFocus={() => setMsgFoc(true)}
                onBlur={() => setMsgFoc(false)}
                rows={4}
                placeholder="Your notification message..."
                style={{
                  padding: '10px 12px', fontSize: 13, fontFamily: 'inherit',
                  borderRadius: 12, border: `1.5px solid ${msgFoc ? '#6366f1' : '#e2e8f0'}`,
                  background: '#fff', color: '#0f172a', outline: 'none', resize: 'none',
                  boxShadow: msgFoc ? '0 0 0 3px rgba(99,102,241,0.12)' : '0 1px 3px rgba(0,0,0,0.06)',
                  transition: 'all .15s ease', width: '100%', boxSizing: 'border-box',
                }}
              />
              <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>{message.length}/500 characters</p>
            </div>

            <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 12, padding: '10px 14px' }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#6366f1', margin: '0 0 3px' }}>Who receives this?</p>
              <p style={{ fontSize: 11, color: '#6366f1', opacity: 0.8, margin: 0, lineHeight: 1.6 }}>
                All users with registered device tokens. Delivered via Firebase Cloud Messaging.
              </p>
            </div>

            <SendBtn onClick={broadcast} loading={sending} disabled={!title.trim() || !message.trim()} />
          </div>
        </div>
      )}
    </>
  )
}