'use client'

import { useState } from 'react'
import useSWR from 'swr'
import AdminHeader from '@/components/admin/AdminHeader'
import Tabs from '@/components/ui/Tabs'
import DataTable from '@/components/ui/DataTable'
import Badge from '@/components/ui/Badge'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { useToast } from '@/context/ToastContext'
import { Send, RefreshCw } from 'lucide-react'

const fetcher = (url) =>
  fetch(url, { credentials: 'include' })
    .then((r) => r.json())
    .then((j) => j.data)

export default function NotificationsPage() {
  const [tab,     setTab]     = useState('logs')
  const [page,    setPage]    = useState(1)
  const [title,   setTitle]   = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const toast = useToast()

  // ✅ No refreshInterval — only fetch once, manual refresh button
  const { data, isLoading, mutate } = useSWR(
    tab === 'logs' ? `/api/notifications?page=${page}&limit=20` : null,
    fetcher
  )

  const broadcast = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error('Title and message are required')
      return
    }
    setSending(true)
    try {
      const res  = await fetch('/api/notifications/broadcast', {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:        JSON.stringify({
          title,
          message,
          channels: ['push'],
        }),
      })
      const json = await res.json()
      json.success
        ? toast.success('Broadcast queued successfully')
        : toast.error(json.error)
    } catch {
      toast.error('Failed to broadcast')
    }
    setSending(false)
  }

  const logCols = [
    {
      key:    'channel',
      header: 'Channel',
      render: (v) => <Badge variant="info" size="sm">{v}</Badge>,
    },
    {
      key:    'template',
      header: 'Template',
      render: (v) => v || '—',
    },
    {
      key:    'status',
      header: 'Status',
      render: (v) => (
        <Badge
          variant={
            v === 'sent' || v === 'delivered' ? 'success'
            : v === 'failed' ? 'danger'
            : 'warning'
          }
          size="sm"
          dot
        >
          {v}
        </Badge>
      ),
    },
    {
      key:    'retryCount',
      header: 'Retries',
      render: (v) => v || 0,
    },
    {
      key:    'createdAt',
      header: 'Date',
      render: (v) => new Date(v).toLocaleString('en-IN'),
    },
  ]

  const tabs = [
    { key: 'logs',      label: 'Notification Logs' },
    { key: 'broadcast', label: 'Send Broadcast' },
  ]

  return (
    <div>
      <AdminHeader
        title="Notifications"
        subtitle="Manage notification logs and broadcasts"
        breadcrumbs={[
          { label: 'Dashboard', href: '/super-admin/dashboard' },
          { label: 'Notifications' },
        ]}
      />

      <Tabs
        tabs={tabs}
        activeTab={tab}
        onChange={(k) => { setTab(k); setPage(1) }}
        className="mb-6"
      />

      {/* ── LOGS TAB ── */}
      {tab === 'logs' && (
        <div>
          <div className="flex justify-end mb-3">
            <Button
              size="sm"
              variant="secondary"
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              onClick={() => mutate()}
            >
              Refresh
            </Button>
          </div>
          <DataTable
            columns={logCols}
            data={data?.logs || []}
            loading={isLoading}
            page={page}
            totalPages={data?.pagination?.totalPages || 1}
            onPageChange={setPage}
            emptyTitle="No notification logs"
            emptyMessage="Notifications sent via queues will appear here"
          />
        </div>
      )}

      {/* ── BROADCAST TAB ── */}
      {tab === 'broadcast' && (
        <Card title="Send Push Broadcast" className="max-w-lg">
          <div className="space-y-4">
            <Input
              label="Notification Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. New feature available!"
              required
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-700">
                Message <span className="text-red-500">*</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder="Your notification message..."
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
              />
              <p className="text-xs text-gray-400">{message.length}/500 characters</p>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
              <p className="text-xs text-blue-600 font-medium mb-1">Who receives this?</p>
              <p className="text-xs text-blue-500">
                All users with registered device tokens (web, Android, iOS).
                Delivered via Firebase Cloud Messaging.
              </p>
            </div>

            <Button
              leftIcon={<Send className="w-4 h-4" />}
              onClick={broadcast}
              loading={sending}
              disabled={!title.trim() || !message.trim()}
            >
              Send Broadcast
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}