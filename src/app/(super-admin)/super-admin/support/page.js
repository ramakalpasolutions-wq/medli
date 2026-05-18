'use client'

import { useMemo, useState } from 'react'
import useSWR from 'swr'
import AdminHeader from '@/components/admin/AdminHeader'
import { useToast } from '@/context/ToastContext'
import { Search, Eye, RefreshCcw } from 'lucide-react'

const fetcher = (url) =>
  fetch(url, { credentials: 'include' }).then((r) => r.json()).then((j) => {
    if (!j.success) throw new Error(j.error || 'Failed to fetch')
    return j.data
  })

function StatusBadge({ status }) {
  const map = {
    new: { bg: 'rgba(59,130,246,0.12)', color: '#2563eb', label: 'New' },
    in_progress: { bg: 'rgba(245,158,11,0.12)', color: '#d97706', label: 'In Progress' },
    resolved: { bg: 'rgba(16,185,129,0.12)', color: '#059669', label: 'Resolved' },
  }
  const item = map[status] || map.new

  return (
    <span
      style={{
        padding: '5px 10px',
        borderRadius: 999,
        background: item.bg,
        color: item.color,
        fontSize: 11,
        fontWeight: 700,
      }}
    >
      {item.label}
    </span>
  )
}

function Modal({ open, onClose, ticket, onSave }) {
  const [status, setStatus] = useState(ticket?.status || 'new')
  const [adminNotes, setAdminNotes] = useState(ticket?.adminNotes || '')
  const [saving, setSaving] = useState(false)

  if (!open || !ticket) return null

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/support/${ticket.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, adminNotes }),
      })
      const json = await res.json()
      if (json.success) {
        onSave?.()
        onClose?.()
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,23,42,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 20,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 760,
          background: '#fff',
          borderRadius: 20,
          padding: 20,
          boxShadow: '0 24px 80px rgba(0,0,0,0.18)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, color: '#0f172a' }}>{ticket.subject}</h3>
            <p style={{ margin: '5px 0 0', fontSize: 12, color: '#64748b' }}>
              {ticket.name} • {ticket.role} • {new Date(ticket.createdAt).toLocaleString('en-IN')}
            </p>
          </div>
          <button onClick={onClose} style={{ fontSize: 20, border: 'none', background: 'none', cursor: 'pointer' }}>
            ×
          </button>
        </div>

        <div style={{ display: 'grid', gap: 14 }}>
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 14,
              padding: 14,
              fontSize: 13,
              color: '#334155',
              lineHeight: 1.75,
              whiteSpace: 'pre-wrap',
            }}
          >
            {ticket.message}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: '#475569' }}>
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 12,
                  border: '1.5px solid #e2e8f0',
                  background: '#fff',
                }}
              >
                <option value="new">New</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: '#475569' }}>
                Category
              </label>
              <input
                value={ticket.category}
                disabled
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 12,
                  border: '1.5px solid #e2e8f0',
                  background: '#f8fafc',
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: '#475569' }}>
              Admin Notes
            </label>
            <textarea
              rows={5}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Add internal notes"
              style={{
                width: '100%',
                padding: '12px 13px',
                borderRadius: 12,
                border: '1.5px solid #e2e8f0',
                resize: 'vertical',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button
              onClick={onClose}
              style={{
                padding: '10px 14px',
                borderRadius: 12,
                border: '1px solid #cbd5e1',
                background: '#fff',
                cursor: 'pointer',
              }}
            >
              Close
            </button>
            <button
              onClick={save}
              disabled={saving}
              style={{
                padding: '10px 14px',
                borderRadius: 12,
                border: 'none',
                background: '#6366f1',
                color: '#fff',
                fontWeight: 700,
                cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SuperAdminSupportPage() {
  const toast = useToast()
  const [status, setStatus] = useState('all')
  const [role, setRole] = useState('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)

  const query = useMemo(() => {
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    if (role) params.set('role', role)
    if (search.trim()) params.set('search', search.trim())
    return `/api/support?${params.toString()}`
  }, [status, role, search])

  const { data, isLoading, mutate } = useSWR(query, fetcher)

  return (
    <>
      <AdminHeader
        title="Support Tickets"
        subtitle="Manage all support submissions from users and admins"
        breadcrumbs={[
          { label: 'Dashboard', href: '/super-admin/dashboard' },
          { label: 'Support' },
        ]}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div
          style={{
            background: '#fff',
            borderRadius: 20,
            border: '1px solid #eef2f7',
            boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
            padding: 16,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))',
            gap: 12,
          }}
        >
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: 12, color: '#94a3b8' }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, subject..."
              style={{
                width: '100%',
                padding: '10px 12px 10px 34px',
                borderRadius: 12,
                border: '1.5px solid #e2e8f0',
              }}
            />
          </div>

          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 12,
              border: '1.5px solid #e2e8f0',
              background: '#fff',
            }}
          >
            <option value="all">All Roles</option>
            <option value="user">User</option>
            <option value="doctor">Doctor</option>
            <option value="hospital_admin">Hospital Admin</option>
            <option value="lab_admin">Lab Admin</option>
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 12,
              border: '1.5px solid #e2e8f0',
              background: '#fff',
            }}
          >
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>

          <button
            onClick={() => mutate()}
            style={{
              padding: '10px 14px',
              borderRadius: 12,
              border: '1px solid #cbd5e1',
              background: '#fff',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              fontWeight: 700,
            }}
          >
            <RefreshCcw size={15} />
            Refresh
          </button>
        </div>

        <div
          style={{
            background: '#fff',
            borderRadius: 20,
            border: '1px solid #eef2f7',
            boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
            overflow: 'hidden',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1000 }}>
              <thead>
                <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                  <th style={{ padding: 14, fontSize: 12, color: '#475569' }}>Date</th>
                  <th style={{ padding: 14, fontSize: 12, color: '#475569' }}>Name</th>
                  <th style={{ padding: 14, fontSize: 12, color: '#475569' }}>Role</th>
                  <th style={{ padding: 14, fontSize: 12, color: '#475569' }}>Subject</th>
                  <th style={{ padding: 14, fontSize: 12, color: '#475569' }}>Category</th>
                  <th style={{ padding: 14, fontSize: 12, color: '#475569' }}>Status</th>
                  <th style={{ padding: 14, fontSize: 12, color: '#475569' }}>Phone</th>
                  <th style={{ padding: 14, fontSize: 12, color: '#475569' }}>Email</th>
                  <th style={{ padding: 14, fontSize: 12, color: '#475569' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={9} style={{ padding: 20, textAlign: 'center', color: '#64748b' }}>
                      Loading tickets...
                    </td>
                  </tr>
                ) : data?.length ? (
                  data.map((ticket) => (
                    <tr key={ticket.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                      <td style={{ padding: 14, fontSize: 13, color: '#334155' }}>
                        {new Date(ticket.createdAt).toLocaleDateString('en-IN')}
                      </td>
                      <td style={{ padding: 14, fontSize: 13, color: '#334155' }}>{ticket.name}</td>
                      <td style={{ padding: 14, fontSize: 13, color: '#334155' }}>{ticket.role}</td>
                      <td style={{ padding: 14, fontSize: 13, color: '#334155' }}>{ticket.subject}</td>
                      <td style={{ padding: 14, fontSize: 13, color: '#334155' }}>{ticket.category}</td>
                      <td style={{ padding: 14 }}><StatusBadge status={ticket.status} /></td>
                      <td style={{ padding: 14, fontSize: 13, color: '#334155' }}>{ticket.phone || '—'}</td>
                      <td style={{ padding: 14, fontSize: 13, color: '#334155' }}>{ticket.email || '—'}</td>
                      <td style={{ padding: 14 }}>
                        <button
                          onClick={() => setSelected(ticket)}
                          style={{
                            padding: '8px 12px',
                            borderRadius: 10,
                            border: '1px solid #cbd5e1',
                            background: '#fff',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          <Eye size={14} />
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} style={{ padding: 20, textAlign: 'center', color: '#64748b' }}>
                      No support tickets found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal
        open={!!selected}
        ticket={selected}
        onClose={() => setSelected(null)}
        onSave={() => {
          toast.success('Ticket updated')
          mutate()
        }}
      />
    </>
  )
}