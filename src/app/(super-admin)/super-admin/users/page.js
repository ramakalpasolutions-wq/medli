'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import AdminHeader from '@/components/admin/AdminHeader'
import DataTable   from '@/components/ui/DataTable'
import Badge       from '@/components/ui/Badge'
import Modal       from '@/components/ui/Modal'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { useToast } from '@/context/ToastContext'

function useMounted() {
  const [m, setM] = useState(false)
  useEffect(() => { setM(true) }, [])
  return m
}

const fetcher = (url) =>
  fetch(url, { credentials: 'include' }).then((r) => r.json()).then((j) => j.data)

const ROLE_BADGE = {
  super_admin: 'danger', regional_manager: 'warning', hospital_admin: 'purple',
  lab_admin: 'success', doctor: 'info', user: 'neutral',
}

function SearchInput({ value, onChange }) {
  const [f, setF] = useState(false)
  return (
    <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
      <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 16, pointerEvents: 'none', color: '#94a3b8' }}>🔍</span>
      <input value={value} onChange={onChange} placeholder="Search users…"
        onFocus={() => setF(true)} onBlur={() => setF(false)}
        style={{
          width: '100%', padding: '10px 14px 10px 38px', fontSize: 13, fontFamily: 'inherit',
          borderRadius: 12, boxSizing: 'border-box',
          border: `1.5px solid ${f ? '#6366f1' : '#e2e8f0'}`, background: '#fff',
          color: '#0f172a', outline: 'none',
          boxShadow: f ? '0 0 0 3px rgba(99,102,241,0.12)' : '0 1px 3px rgba(0,0,0,0.06)',
          transition: 'all .15s ease',
        }}
      />
    </div>
  )
}

function RoleSelect({ value, onChange }) {
  const [f, setF] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <select value={value} onChange={onChange}
        onFocus={() => setF(true)} onBlur={() => setF(false)}
        style={{
          padding: '10px 30px 10px 12px', fontSize: 13, fontFamily: 'inherit',
          borderRadius: 12, border: `1.5px solid ${f ? '#6366f1' : '#e2e8f0'}`,
          background: '#fff', color: value ? '#0f172a' : '#94a3b8', outline: 'none',
          appearance: 'none', cursor: 'pointer',
          boxShadow: f ? '0 0 0 3px rgba(99,102,241,0.12)' : '0 1px 3px rgba(0,0,0,0.06)',
          transition: 'all .15s ease', boxSizing: 'border-box',
        }}>
        <option value="">All Roles</option>
        <option value="user">Patient</option>
        <option value="doctor">Doctor</option>
        <option value="hospital_admin">Hospital Admin</option>
        <option value="lab_admin">Lab Admin</option>
        <option value="regional_manager">Regional Manager</option>
        <option value="super_admin">Super Admin</option>
      </select>
      <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: '#94a3b8', pointerEvents: 'none' }}>▼</span>
    </div>
  )
}

function ActionBtn({ label, variant, onClick }) {
  const [h, setH] = useState(false)
  const V = {
    success: { base: 'rgba(16,185,129,0.07)', hov: 'rgba(16,185,129,0.14)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' },
    danger:  { base: 'rgba(239,68,68,0.07)',  hov: 'rgba(239,68,68,0.14)',  color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' },
    ghost:   { base: 'transparent', hov: '#f1f5f9', color: '#6366f1', border: 'none' },
  }
  const s = V[variant] || V.ghost
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        padding: '5px 10px', borderRadius: 8, border: s.border || 'none',
        background: h ? s.hov : s.base, color: s.color,
        fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all .13s ease',
        display: 'flex', alignItems: 'center', gap: 4,
      }}>
      {label}
    </button>
  )
}

export default function UsersPage() {
  const [page,     setPage]     = useState(1)
  const [search,   setSearch]   = useState('')
  const [role,     setRole]     = useState('')
  const [action,   setAction]   = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [viewItem, setViewItem] = useState(null)
  const mounted = useMounted()
  const toast   = useToast()

  const qs = new URLSearchParams({ page, limit: 20 })
  if (search) qs.set('search', search)
  if (role)   qs.set('role', role)

  const { data, isLoading, mutate } = useSWR(`/api/users?${qs}`, fetcher)

  const doBlock = async () => {
    setLoading(true)
    const { user } = action
    try {
      const res  = await fetch(`/api/users/${user.id}/block`, { method: 'PATCH', credentials: 'include' })
      const json = await res.json()
      json.success ? toast.success(json.message || 'Status updated') : toast.error(json.error)
      mutate()
    } catch { toast.error('Action failed') }
    setLoading(false)
    setAction(null)
  }

  const columns = [
    {
      key: 'name', header: 'User',
      render: (v, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg,rgba(99,102,241,0.12),rgba(139,92,246,0.08))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: '#6366f1', flexShrink: 0, overflow: 'hidden',
          }}>
            {row.avatar ? <img src={row.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : v?.charAt(0) || 'U'}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v || '—'}</p>
            <p style={{ fontSize: 11, color: '#94a3b8', margin: '1px 0 0' }}>
              {row.phone ? `+91 ${row.phone}` : row.email || '—'}
            </p>
          </div>
        </div>
      ),
    },
    { key: 'role',       header: 'Role',     render: (v) => <Badge variant={ROLE_BADGE[v] || 'neutral'} size="sm">{v?.replace(/_/g, ' ')}</Badge> },
    { key: 'isVerified', header: 'Verified', render: (v) => <Badge variant={v ? 'success' : 'warning'} size="sm" dot>{v ? 'Yes' : 'No'}</Badge> },
    { key: 'isBlocked',  header: 'Status',   render: (v) => <Badge variant={v ? 'danger' : 'success'} size="sm">{v ? 'Blocked' : 'Active'}</Badge> },
    {
      key: 'createdAt', header: 'Joined',
      render: (v) => mounted ? <span style={{ fontSize: 12, color: '#64748b' }}>{new Date(v).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span> : '—',
    },
    {
      key: 'actions', header: 'Actions',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <ActionBtn label="👁 View" variant="ghost" onClick={() => setViewItem(row)} />
          <ActionBtn
            label={row.isBlocked ? 'Unblock' : 'Block'}
            variant={row.isBlocked ? 'success' : 'danger'}
            onClick={() => setAction({ user: row })}
          />
        </div>
      ),
    },
  ]

  return (
    <div>
      <AdminHeader title="Users" subtitle="Manage platform users"
        breadcrumbs={[{ label: 'Dashboard', href: '/super-admin/dashboard' }, { label: 'Users' }]} />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
        <SearchInput value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
        <RoleSelect value={role} onChange={(e) => { setRole(e.target.value); setPage(1) }} />
      </div>

      <DataTable columns={columns} data={data?.users || []} loading={isLoading}
        page={page} totalPages={data?.pagination?.totalPages || 1}
        onPageChange={setPage} emptyTitle="No users found" />

      {/* ── View Detail Modal ── */}
      <Modal open={!!viewItem} onClose={() => setViewItem(null)} title="User Details" size="md">
        {viewItem && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Avatar + name */}
            <div style={{
              display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap',
              padding: 16, background: '#f8fafc', borderRadius: 16,
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%', overflow: 'hidden',
                background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 22, fontWeight: 700, flexShrink: 0,
              }}>
                {viewItem.avatar
                  ? <img src={viewItem.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : viewItem.name?.charAt(0) || 'U'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: '0 0 6px' }}>{viewItem.name}</h3>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <Badge variant={ROLE_BADGE[viewItem.role] || 'neutral'} size="sm">{viewItem.role?.replace(/_/g, ' ')}</Badge>
                  <Badge variant={viewItem.isBlocked ? 'danger' : 'success'} size="sm">{viewItem.isBlocked ? 'Blocked' : 'Active'}</Badge>
                  <Badge variant={viewItem.isVerified ? 'success' : 'warning'} size="sm" dot>{viewItem.isVerified ? 'Verified' : 'Unverified'}</Badge>
                </div>
              </div>
            </div>

            {/* Contact info */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12,
            }}>
              <InfoBox label="📞 Phone" value={viewItem.phone ? `+91 ${viewItem.phone}` : '—'} />
              <InfoBox label="✉️ Email" value={viewItem.email || '—'} />
              <InfoBox label="📅 Joined" value={new Date(viewItem.createdAt).toLocaleDateString('en-IN', { dateStyle: 'long' })} />
              {viewItem.wallet?.balance !== undefined && (
                <InfoBox label="💰 Wallet" value={`₹${Number(viewItem.wallet.balance).toLocaleString('en-IN')}`} />
              )}
            </div>

            {/* Family members */}
            {viewItem.familyMembers?.length > 0 && (
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8 }}>
                  👨‍👩‍👧‍👦 Family Members ({viewItem.familyMembers.length})
                </p>
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8,
                }}>
                  {viewItem.familyMembers.map((m) => (
                    <div key={m.id} style={{
                      padding: '10px 14px', background: '#f0f9ff', borderRadius: 12,
                      border: '1px solid #bae6fd',
                    }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', margin: '0 0 2px' }}>{m.name}</p>
                      <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>
                        {m.relation}{m.age ? ` · ${m.age}y` : ''}{m.gender ? ` · ${m.gender}` : ''}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bank account */}
            {viewItem.bankAccount && (
              <div style={{
                padding: '12px 14px', background: '#f8fafc', borderRadius: 12,
                border: '1px solid #e2e8f0',
              }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8 }}>
                  🏦 Bank Account
                </p>
                {[
                  { l: 'Holder', v: viewItem.bankAccount.accountHolderName },
                  { l: 'Bank',   v: viewItem.bankAccount.bankName          },
                  { l: 'IFSC',   v: viewItem.bankAccount.ifscCode          },
                  { l: 'UPI',    v: viewItem.bankAccount.upiId             },
                  { l: 'Verified', v: viewItem.bankAccount.isVerified ? '✓ Yes' : '✗ No' },
                ].filter((r) => r.v).map((r) => (
                  <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
                    <span style={{ color: '#94a3b8' }}>{r.l}</span>
                    <span style={{ fontWeight: 600, color: '#1e293b' }}>{r.v}</span>
                  </div>
                ))}
              </div>
            )}

            {/* ID */}
            <div style={{
              padding: '10px 14px', background: '#f8fafc', borderRadius: 12,
              border: '1px solid #e2e8f0',
            }}>
              <IDRow label="User ID" value={viewItem.id} />
            </div>
          </div>
        )}
      </Modal>

      <ConfirmModal open={!!action} onClose={() => setAction(null)} onConfirm={doBlock}
        title={action?.user?.isBlocked ? 'Unblock User?' : 'Block User?'}
        loading={loading} details={{ Name: action?.user?.name, Role: action?.user?.role }} />
    </div>
  )
}

function InfoBox({ label, value }) {
  return (
    <div style={{ padding: '12px 14px', background: '#fff', borderRadius: 12, border: '1px solid #f1f5f9' }}>
      <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 4px' }}>{label}</p>
      <p style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', margin: 0, wordBreak: 'break-word' }}>{value}</p>
    </div>
  )
}

function IDRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 11, color: '#94a3b8' }}>{label}</span>
      <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#64748b' }}>{value}</span>
    </div>
  )
}