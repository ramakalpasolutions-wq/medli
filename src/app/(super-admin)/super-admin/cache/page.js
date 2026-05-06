'use client'

import useSWR from 'swr'
import AdminHeader from '@/components/admin/AdminHeader'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { useToast } from '@/context/ToastContext'
import { Trash2, RefreshCw } from 'lucide-react'

const fetcher = (url) =>
  fetch(url, { credentials: 'include' }).then((r) => r.json()).then((j) => j.data)

const CACHE_PATTERNS = [
  { pattern: 'hospital:*',         label: 'Hospital Cache' },
  { pattern: 'lab:*',              label: 'Lab Cache' },
  { pattern: 'slots:*',            label: 'Slot Cache' },
  { pattern: 'nearby:hospitals:*', label: 'Nearby Hospitals' },
  { pattern: 'nearby:labs:*',      label: 'Nearby Labs' },
  { pattern: 'analytics:*',        label: 'Analytics Cache' },
  { pattern: 'otp:*',              label: 'OTP Cache' },
  { pattern: '*',                  label: 'ALL Cache (Nuclear)' },
]

export default function CachePage() {
  const toast = useToast()

  const { data: queues, isLoading, mutate } = useSWR(
    '/api/admin/queues',
    fetcher,
    { refreshInterval: 10000 }
  )

  const clearCache = async (pattern) => {
    try {
      const res  = await fetch('/api/admin/cache/clear', {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:        JSON.stringify({ pattern }),
      })
      const json = await res.json()
      json.success
        ? toast.success(`Cleared: ${pattern}`)
        : toast.error(json.error)
    } catch {
      toast.error('Failed to clear cache')
    }
  }

  return (
    <div>
      <AdminHeader
        title="Cache & Queues"
        subtitle="Manage Redis cache and BullMQ queue status"
        breadcrumbs={[
          { label: 'Dashboard', href: '/super-admin/dashboard' },
          { label: 'Cache' },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cache management */}
        <Card title="Cache Management">
          <div className="space-y-2">
            {CACHE_PATTERNS.map((item) => (
              <div
                key={item.pattern}
                className={`flex items-center justify-between py-2.5 px-3 rounded-xl border transition-colors ${
                  item.pattern === '*'
                    ? 'border-red-100 bg-red-50'
                    : 'border-gray-100 bg-gray-50'
                }`}
              >
                <div>
                  <p className={`text-sm font-medium ${item.pattern === '*' ? 'text-red-700' : 'text-gray-700'}`}>
                    {item.label}
                  </p>
                  <p className="text-xs font-mono text-gray-400">{item.pattern}</p>
                </div>
                <Button
                  size="xs"
                  variant={item.pattern === '*' ? 'danger' : 'secondary'}
                  leftIcon={<Trash2 className="w-3 h-3" />}
                  onClick={() => clearCache(item.pattern)}
                >
                  Clear
                </Button>
              </div>
            ))}
          </div>
        </Card>

        {/* Queue status */}
        <Card
          title="Queue Status"
          action={
            <div className="flex items-center gap-2">
              <Badge variant="success" size="sm" dot pulse>Live</Badge>
              <Button
                size="xs"
                variant="ghost"
                leftIcon={<RefreshCw className="w-3 h-3" />}
                onClick={() => mutate()}
              >
                Refresh
              </Button>
            </div>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Queue', 'Waiting', 'Active', 'Done', 'Failed'].map((h) => (
                    <th
                      key={h}
                      className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-8 text-center text-xs text-gray-400">
                      Loading...
                    </td>
                  </tr>
                ) : (queues || []).map((q) => (
                  <tr key={q.name} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-2.5 text-sm font-medium text-gray-800 capitalize">
                      {q.name}
                    </td>
                    <td className="px-3 py-2.5 text-sm text-gray-500">
                      {q.waiting}
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge variant={q.active > 0 ? 'info' : 'neutral'} size="sm">
                        {q.active}
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5 text-sm text-emerald-600 font-medium">
                      {q.completed}
                    </td>
                    <td className="px-3 py-2.5">
                      {q.failed > 0
                        ? <Badge variant="danger" size="sm">{q.failed}</Badge>
                        : <span className="text-sm text-gray-400">0</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 mt-3 text-center">
            Auto-refreshes every 10 seconds
          </p>
        </Card>
      </div>
    </div>
  )
}