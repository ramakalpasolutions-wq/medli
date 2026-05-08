'use client'

import { useState } from 'react'
import useSWR from 'swr'
import AdminHeader from '@/components/admin/AdminHeader'
import DataTable from '@/components/ui/DataTable'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'

const fetcher = (url) =>
  fetch(url, { credentials: 'include' }).then((r) => r.json()).then((j) => j.data)

function EyeBtn({ onClick }) {
  const [h, setH] = useState(false)
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        padding: '5px 9px', borderRadius: 8, border: 'none',
        background: h ? 'rgba(99,102,241,0.1)' : 'transparent',
        color: '#6366f1', fontSize: 14, cursor: 'pointer', transition: 'background .13s ease',
      }}>
      👁
    </button>
  )
}

export default function AuditLogsPage() {
  const [page,    setPage]    = useState(1)
  const [viewLog, setViewLog] = useState(null)

  const { data, isLoading } = useSWR(`/api/audit-logs?page=${page}&limit=20`, fetcher)

  const columns = [
    { key: 'actorRole',  header: 'Role',   render: (v) => <Badge variant="info" size="sm">{v || '—'}</Badge> },
    { key: 'action',     header: 'Action', render: (v) => <span style={{ fontSize: 13, fontWeight: 500 }}>{v}</span> },
    { key: 'targetType', header: 'Target', render: (v) => <span style={{ fontSize: 12, color: '#64748b' }}>{v || '—'}</span> },
    { key: 'ipAddress',  header: 'IP',     render: (v) => <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{v || '—'}</span> },
    { key: 'createdAt',  header: 'Date',   render: (v) => <span style={{ fontSize: 12, color: '#64748b' }}>{new Date(v).toLocaleString('en-IN')}</span> },
    { key: 'actions',    header: '',       render: (_, row) => <EyeBtn onClick={() => setViewLog(row)} /> },
  ]

  return (
    <>
      <AdminHeader title="Audit Logs" subtitle="Activity trail"
        breadcrumbs={[{ label: 'Dashboard', href: '/super-admin/dashboard' }, { label: 'Audit Logs' }]} />
      <DataTable columns={columns} data={data?.logs || []} loading={isLoading}
        page={page} totalPages={data?.pagination?.totalPages || 1} onPageChange={setPage} />
      <Modal open={!!viewLog} onClose={() => setViewLog(null)} title="Log Details" size="md">
        {viewLog && (
          <pre style={{
            fontSize: 11, background: '#f8fafc', borderRadius: 12, padding: 16,
            overflow: 'auto', maxHeight: 380, whiteSpace: 'pre-wrap', fontFamily: 'monospace',
            color: '#334155', margin: 0,
          }}>
            {JSON.stringify(viewLog, null, 2)}
          </pre>
        )}
      </Modal>
    </>
  )
}