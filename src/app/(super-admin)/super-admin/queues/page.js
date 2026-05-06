'use client'

import useSWR from 'swr'
import AdminHeader from '@/components/admin/AdminHeader'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { useToast } from '@/context/ToastContext'
import { Trash2 } from 'lucide-react'

const fetcher = (url) => fetch(url, { credentials: 'include' }).then((r) => r.json()).then((j) => j.data)

export default function QueuesPage() {
  const { data, isLoading } = useSWR('/api/admin/queues', fetcher, { refreshInterval: 10000 })
  const toast = useToast()

  const clearCache = async (pattern) => {
    try {
      const res = await fetch('/api/admin/cache/clear', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ pattern }) })
      const json = await res.json()
      json.success ? toast.success('Cache cleared') : toast.error(json.error)
    } catch { toast.error('Failed') }
  }

  return (
    <div>
      <AdminHeader title="System" subtitle="Queues & cache management" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Cache Management">
          <div className="space-y-3">
            {['hospitals:*', 'labs:*', 'slots:*', 'nearby:*', 'analytics:*', '*'].map((p) => (
              <div key={p} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm font-mono text-gray-600">{p}</span>
                <Button size="xs" variant="danger" leftIcon={<Trash2 className="w-3 h-3" />} onClick={() => clearCache(p)}>Clear</Button>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Queue Status" action={<Badge variant="success" size="sm" dot pulse>Live</Badge>}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50"><th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Queue</th><th className="px-3 py-2 text-xs text-gray-500">Waiting</th><th className="px-3 py-2 text-xs text-gray-500">Active</th><th className="px-3 py-2 text-xs text-gray-500">Completed</th><th className="px-3 py-2 text-xs text-gray-500">Failed</th></tr></thead>
              <tbody>
                {(data || []).map((q) => (
                  <tr key={q.name} className="border-b border-gray-50">
                    <td className="px-3 py-2 font-medium capitalize">{q.name}</td>
                    <td className="px-3 py-2 text-center">{q.waiting}</td>
                    <td className="px-3 py-2 text-center"><Badge variant={q.active > 0 ? 'info' : 'neutral'} size="sm">{q.active}</Badge></td>
                    <td className="px-3 py-2 text-center text-emerald-600">{q.completed}</td>
                    <td className="px-3 py-2 text-center">{q.failed > 0 ? <Badge variant="danger" size="sm">{q.failed}</Badge> : '0'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}