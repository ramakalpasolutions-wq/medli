'use client'

import { useState } from 'react'
import useSWR from 'swr'
import AdminHeader from '@/components/admin/AdminHeader'
import DataTable   from '@/components/ui/DataTable'
import Badge       from '@/components/ui/Badge'
import Tabs        from '@/components/ui/Tabs'
import Modal       from '@/components/ui/Modal'
import { useToast } from '@/context/ToastContext'

// ✅ Fetcher returns j.data = { notifications: [], pagination: {} }
const fetcher = (url) =>
  fetch(url, { credentials: 'include' })
    .then((r) => r.json())
    .then((j) => j.data)

const KF = `@keyframes nt-spin { to { transform: rotate(360deg) } }`

/* ─── Styled Input ───────────────────────────────────────────────────── */
function FInput({ label, required: req, ...props }) {
  const [f, setF] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && (
        <label style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>
          {label} {req && <span style={{ color: '#ef4444' }}>*</span>}
        </label>
      )}
      <input
        {...props}
        value={props.value ?? ''}
        onFocus={(e) => { setF(true); props.onFocus?.(e) }}
        onBlur={(e)  => { setF(false); props.onBlur?.(e) }}
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

/* ─── Refresh Button ─────────────────────────────────────────────────── */
function RefreshBtn({ onClick }) {
  const [h, setH] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '7px 14px', borderRadius: 10,
        border: `1.5px solid ${h ? '#6366f1' : '#e2e8f0'}`,
        background: h ? 'rgba(99,102,241,0.06)' : '#fff',
        color: h ? '#6366f1' : '#64748b',
        fontSize: 12, fontWeight: 500, cursor: 'pointer',
        transition: 'all .15s ease',
      }}
    >
      🔄 Refresh
    </button>
  )
}

/* ─── Send Button ────────────────────────────────────────────────────── */
function SendBtn({ onClick, loading: isLoading, disabled }) {
  const [h, setH] = useState(false)
  const off = isLoading || disabled
  return (
    <button
      onClick={onClick}
      disabled={off}
      onMouseEnter={() => !off && setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '11px 20px', borderRadius: 12, border: 'none',
        background: off
          ? '#e2e8f0'
          : h ? 'linear-gradient(135deg,#7c3aed,#6d28d9)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
        color: off ? '#94a3b8' : '#fff',
        fontSize: 13, fontWeight: 600,
        cursor: off ? 'not-allowed' : 'pointer',
        transition: 'all .15s ease',
        boxShadow: off ? 'none' : '0 4px 14px rgba(99,102,241,0.35)',
      }}
    >
      {isLoading && (
        <span style={{
          width: 14, height: 14, borderRadius: '50%',
          border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff',
          animation: 'nt-spin .7s linear infinite', display: 'inline-block',
        }} />
      )}
      📤 Send Broadcast
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
        background: h ? '#f1f5f9' : 'transparent',
        color: '#6366f1', fontSize: 11, fontWeight: 600,
        cursor: 'pointer', transition: 'background .13s ease',
      }}
    >
      👁 View
    </button>
  )
}

const NTABS = [
  { key: 'logs',      label: 'Notification Logs' },
  { key: 'broadcast', label: 'Send Broadcast'     },
]

const STATUS_VARIANT = {
  sent:      'success',
  delivered: 'success',
  failed:    'danger',
  queued:    'warning',
  pending:   'warning',
}

const CHANNEL_VARIANT = {
  push:  'info',
  sms:   'warning',
  email: 'purple',
}

/* ─── Log Detail Modal Content ───────────────────────────────────────── */
function LogDetail({ log: l }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* Status banner */}
      <div style={{
        padding: '12px 16px', borderRadius: 14,
        background: l.status === 'sent' || l.status === 'delivered'
          ? '#f0fdf4' : l.status === 'failed' ? '#fff1f2' : '#fffbeb',
        border: `1px solid ${
          l.status === 'sent' || l.status === 'delivered'
            ? '#bbf7d0' : l.status === 'failed' ? '#fecaca' : '#fde68a'
        }`,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <span style={{ fontSize: 24 }}>
          {l.status === 'sent' || l.status === 'delivered' ? '✅'
           : l.status === 'failed' ? '❌' : '⏳'}
        </span>
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: 0 }}>
            {l.status?.toUpperCase()}
          </p>
          <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>
            {new Date(l.createdAt).toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* Core fields */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: 12,
      }}>
        <InfoBox label="Channel"   value={l.channel   || '—'} />
        <InfoBox label="Template"  value={l.template  || '—'} />
        <InfoBox label="Retries"   value={String(l.retryCount || 0)} />
        <InfoBox label="User ID"   value={l.userId    || '—'} mono />
      </div>

      {/* Variables */}
      {l.variables && Object.keys(l.variables).length > 0 && (
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8 }}>
            Template Variables
          </p>
          <div style={{
            background: '#f8fafc', borderRadius: 12, padding: '4px 0',
            border: '1px solid #e2e8f0',
          }}>
            {Object.entries(l.variables).map(([k, v]) => (
              <div key={k} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 14px', borderBottom: '1px solid #f1f5f9',
              }}>
                <span style={{ fontSize: 12, color: '#64748b' }}>{k}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#1e293b' }}>{String(v)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Provider response */}
      {l.providerResponse && (
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8 }}>
            Provider Response
          </p>
          <pre style={{
            background: '#0f172a', color: '#e2e8f0', borderRadius: 12,
            padding: '14px 16px', fontSize: 11, fontFamily: 'monospace',
            overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            margin: 0,
          }}>
            {JSON.stringify(l.providerResponse, null, 2)}
          </pre>
        </div>
      )}

      {/* ID */}
      <div style={{
        padding: '10px 14px', background: '#f8fafc',
        borderRadius: 12, border: '1px solid #e2e8f0',
      }}>
        <IDRow label="Log ID" value={l.id} />
      </div>
    </div>
  )
}

function InfoBox({ label, value, mono }) {
  return (
    <div style={{ padding: '10px 14px', background: '#fff', borderRadius: 12, border: '1px solid #f1f5f9' }}>
      <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 3px' }}>{label}</p>
      <p style={{
        fontSize: 13, fontWeight: 600, color: '#1e293b', margin: 0,
        fontFamily: mono ? 'monospace' : 'inherit', wordBreak: 'break-all',
      }}>{value}</p>
    </div>
  )
}

function IDRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 11, color: '#94a3b8' }}>{label}</span>
      <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#64748b', wordBreak: 'break-all' }}>{value}</span>
    </div>
  )
}

/* ─── Main Page ──────────────────────────────────────────────────────── */
export default function NotificationsPage() {
  const [tab,     setTab]     = useState('logs')
  const [page,    setPage]    = useState(1)
  const [title,   setTitle]   = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [msgFoc,  setMsgFoc]  = useState(false)
  const [viewLog, setViewLog] = useState(null)
  const toast = useToast()

  const { data, isLoading, mutate } = useSWR(
    tab === 'logs' ? `/api/notifications?page=${page}&limit=20` : null,
    fetcher,
    { revalidateOnFocus: false }
  )

  // ✅ Correctly read from paginatedResponse shape
  const logs       = data?.notifications || []
  const totalPages = data?.pagination?.totalPages || 1
  const total      = data?.pagination?.total      || 0

  const broadcast = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error('Title and message are required')
      return
    }
    if (message.length > 500) {
      toast.error('Message must be under 500 characters')
      return
    }
    setSending(true)
    try {
      const res  = await fetch('/api/notifications/broadcast', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:    JSON.stringify({ title, message, channels: ['push'] }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Broadcast queued successfully')
        setTitle('')
        setMessage('')
      } else {
        toast.error(json.error || 'Failed to broadcast')
      }
    } catch {
      toast.error('Failed to broadcast')
    }
    setSending(false)
  }

  const logCols = [
    {
      key: 'channel', header: 'Channel',
      render: (v) => (
        <Badge variant={CHANNEL_VARIANT[v] || 'neutral'} size="sm">{v}</Badge>
      ),
    },
    {
      key: 'template', header: 'Template',
      render: (v) => (
        <span style={{ fontSize: 12, color: '#475569' }}>{v || '—'}</span>
      ),
    },
    {
      key: 'status', header: 'Status',
      render: (v) => (
        <Badge variant={STATUS_VARIANT[v] || 'neutral'} size="sm" dot>{v}</Badge>
      ),
    },
    {
      key: 'retryCount', header: 'Retries',
      render: (v) => (
        <span style={{
          fontSize: 12, fontWeight: 600,
          color: Number(v) > 0 ? '#f59e0b' : '#94a3b8',
        }}>
          {v || 0}
        </span>
      ),
    },
    {
      key: 'createdAt', header: 'Date',
      render: (v) => (
        <span style={{ fontSize: 12, color: '#64748b' }}>
          {new Date(v).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'actions', header: '',
      render: (_, row) => (
        <ViewBtn onClick={() => setViewLog(row)} />
      ),
    },
  ]

  return (
    <>
      <style>{KF}</style>

      <AdminHeader
        title="Notifications"
        subtitle={tab === 'logs' ? `${total} notification${total !== 1 ? 's' : ''} sent` : 'Send push notifications'}
        breadcrumbs={[
          { label: 'Dashboard', href: '/super-admin/dashboard' },
          { label: 'Notifications' },
        ]}
      />

      <Tabs
        tabs={NTABS}
        activeTab={tab}
        onChange={(k) => { setTab(k); setPage(1) }}
        style={{ marginBottom: 20 }}
      />

      {/* ── LOGS TAB ── */}
      {tab === 'logs' && (
        <div>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: 12, flexWrap: 'wrap', gap: 10,
          }}>
            {/* Legend */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {Object.entries(STATUS_VARIANT).map(([status, variant]) => (
                <Badge key={status} variant={variant} size="sm" dot>{status}</Badge>
              ))}
            </div>
            <RefreshBtn onClick={() => mutate()} />
          </div>

          <DataTable
            columns={logCols}
            data={logs}
            loading={isLoading}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            emptyTitle="No notification logs"
            emptyMessage="Notifications sent via queues will appear here"
          />
        </div>
      )}

      {/* ── BROADCAST TAB ── */}
      {tab === 'broadcast' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 20, alignItems: 'start',
        }}>
          {/* Form */}
          <div style={{
            background: '#fff', borderRadius: 20,
            border: '1px solid #f1f5f9',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            padding: 24,
          }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', marginBottom: 20 }}>
              📢 Send Push Broadcast
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <FInput
                label="Notification Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. New feature available!"
                required
              />

              {/* Textarea */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>
                  Message <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value.slice(0, 500))}
                  onFocus={() => setMsgFoc(true)}
                  onBlur={() => setMsgFoc(false)}
                  rows={4}
                  placeholder="Your notification message..."
                  style={{
                    padding: '10px 12px', fontSize: 13, fontFamily: 'inherit',
                    borderRadius: 12,
                    border: `1.5px solid ${msgFoc ? '#6366f1' : '#e2e8f0'}`,
                    background: '#fff', color: '#0f172a', outline: 'none', resize: 'none',
                    boxShadow: msgFoc
                      ? '0 0 0 3px rgba(99,102,241,0.12)'
                      : '0 1px 3px rgba(0,0,0,0.06)',
                    transition: 'all .15s ease',
                    width: '100%', boxSizing: 'border-box',
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>Max 500 characters</span>
                  <span style={{
                    fontSize: 11,
                    color: message.length > 450 ? '#ef4444' : '#94a3b8',
                    fontWeight: message.length > 450 ? 600 : 400,
                  }}>
                    {message.length}/500
                  </span>
                </div>
              </div>

              {/* Info banner */}
              <div style={{
                background: 'rgba(99,102,241,0.06)',
                border: '1px solid rgba(99,102,241,0.15)',
                borderRadius: 12, padding: '10px 14px',
              }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#6366f1', margin: '0 0 3px' }}>
                  Who receives this?
                </p>
                <p style={{ fontSize: 11, color: '#6366f1', opacity: 0.8, margin: 0, lineHeight: 1.6 }}>
                  All users with registered device tokens (web, Android, iOS).
                  Delivered via Firebase Cloud Messaging.
                </p>
              </div>

              <SendBtn
                onClick={broadcast}
                loading={sending}
                disabled={!title.trim() || !message.trim()}
              />
            </div>
          </div>

          {/* Preview card */}
          <div style={{
            background: '#0f172a', borderRadius: 20, padding: 24,
            border: '1px solid #1e293b',
          }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 16 }}>
              📱 Preview
            </p>
            <div style={{
              background: '#1e293b', borderRadius: 16, padding: '14px 16px',
              border: '1px solid #334155',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                  background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                }}>
                  🏥
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontSize: 13, fontWeight: 700, color: '#f1f5f9',
                    margin: '0 0 4px',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {title || 'Notification Title'}
                  </p>
                  <p style={{
                    fontSize: 12, color: '#94a3b8', margin: 0,
                    lineHeight: 1.5, wordBreak: 'break-word',
                    display: '-webkit-box',
                    WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>
                    {message || 'Your notification message will appear here...'}
                  </p>
                </div>
              </div>
              <p style={{ fontSize: 10, color: '#475569', margin: '10px 0 0', textAlign: 'right' }}>
                MEDLI · now
              </p>
            </div>

            {/* Tips */}
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                '✓ Keep title under 50 characters',
                '✓ Keep message under 100 characters for best display',
                '✓ Include a clear call-to-action',
              ].map((tip) => (
                <p key={tip} style={{ fontSize: 11, color: '#475569', margin: 0 }}>{tip}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── View Log Modal ── */}
      <Modal
        open={!!viewLog}
        onClose={() => setViewLog(null)}
        title="Notification Log Details"
        size="md"
      >
        {viewLog && <LogDetail log={viewLog} />}
      </Modal>
    </>
  )
}