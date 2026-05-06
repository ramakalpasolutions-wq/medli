'use client'

import useSWR from 'swr'
import { motion } from 'framer-motion'
import AdminHeader from '@/components/admin/AdminHeader'
import StatsCard from '@/components/ui/StatsCard'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { FlaskConical, Clock, Home, IndianRupee, Upload } from 'lucide-react'

const fetcher = (url) => fetch(url, { credentials: 'include' }).then((r) => r.json()).then((j) => j.data)

export default function LabAdminDashboard() {
  const { user } = useAuth()
  const { data: bookings } = useSWR('/api/bookings?limit=10&type=lab', fetcher)

  const pending = (bookings?.bookings || []).filter((b) => b.labStatus !== 'report_ready')

  return (
    <div>
      <AdminHeader title={`Welcome, ${user?.name?.split(' ')[0] || 'Admin'}`} subtitle="Lab dashboard" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard title="Today Bookings" value={0} icon={<FlaskConical className="w-5 h-5" />} color="blue" />
        <StatsCard title="Pending Reports" value={pending.length} icon={<Clock className="w-5 h-5" />} color="orange" />
        <StatsCard title="Home Collections" value={0} icon={<Home className="w-5 h-5" />} color="green" />
        <StatsCard title="Monthly Revenue" value={0} prefix="₹" icon={<IndianRupee className="w-5 h-5" />} color="purple" />
      </div>
      <Card title="Pending Reports">
        {pending.length === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center">All reports uploaded 🎉</p>
        ) : (
          <div className="space-y-3">
            {pending.map((b, i) => (
              <motion.div key={b.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-100">
                <div>
                  <p className="text-sm font-medium text-gray-800">{b.bookingId}</p>
                  <p className="text-xs text-gray-400">{new Date(b.startTime).toLocaleDateString('en-IN')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="warning" size="sm">{b.labStatus || 'pending'}</Badge>
                  <Button size="xs" variant="primary" leftIcon={<Upload className="w-3 h-3" />}>Upload</Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}