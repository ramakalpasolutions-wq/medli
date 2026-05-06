'use client'

import { useState } from 'react'
import useSWR from 'swr'
import AdminHeader from '@/components/admin/AdminHeader'
import DataTable from '@/components/ui/DataTable'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { Eye } from 'lucide-react'

const fetcher = (url) => fetch(url, { credentials: 'include' }).then((r) => r.json()).then((j) => j.data)

export default function AuditLogsPage() {
  const [page, setPage] = useState(1)
  const [viewLog, setViewLog] = useState(null)
  const { data, isLoading } = useSWR(`/api/audit-logs?page=${page}&limit=20`, fetcher)

  const columns = [
    { key: 'actorRole', header: 'Role', render: (v) => <Badge variant="info" size="sm">{v || '—'}</Badge> },
    { key: 'action', header: 'Action', render: (v) => <span className="font-medium text-gray-800">{v}</span> },
    { key: 'targetType', header: 'Target' },
    { key: 'ipAddress', header: 'IP', render: (v) => <span className="font-mono text-xs">{v || '—'}</span> },
    { key: 'createdAt', header: 'Date', render: (v) => new Date(v).toLocaleString('en-IN') },
    { key: 'actions', header: '', render: (_, row) => <Button size="xs" variant="ghost" onClick={() => setViewLog(row)}><Eye className="w-3.5 h-3.5" /></Button> },
  ]

  return (
    <div>
      <AdminHeader title="Audit Logs" subtitle="Activity trail" />
      <DataTable columns={columns} data={data?.logs || []} loading={isLoading} page={page} totalPages={data?.pagination?.totalPages || 1} onPageChange={setPage} />
      <Modal open={!!viewLog} onClose={() => setViewLog(null)} title="Log Details" size="md">
        {viewLog && <pre className="text-xs bg-gray-50 rounded-xl p-4 overflow-auto max-h-96 whitespace-pre-wrap">{JSON.stringify(viewLog, null, 2)}</pre>}
      </Modal>
    </div>
  )
}