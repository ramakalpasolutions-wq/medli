'use client'

import useSWR from 'swr'
import AdminHeader from '@/components/admin/AdminHeader'
import StatsCard from '@/components/ui/StatsCard'
import DataTable from '@/components/ui/DataTable'
import Badge, { getStatusVariant } from '@/components/ui/Badge'
import Card from '@/components/ui/Card'
import { useAuth } from '@/hooks/useAuth'
import { Building2, FlaskConical, Calendar, IndianRupee } from 'lucide-react'

const fetcher = (url) =>
  fetch(url, { credentials: 'include' }).then((r) => r.json()).then((j) => j.data)

export default function RegionalDashboard() {
  const { user }  = useAuth()
  const { data: bookings } = useSWR('/api/bookings?limit=10', fetcher)

  const bookingCols = [
    { key: 'bookingId', header: 'ID',
      render: (v) => <span className="font-mono text-xs">{v}</span> },
    { key: 'type',   header: 'Type',
      render: (v) => <Badge variant="info" size="sm">{v}</Badge> },
    { key: 'status', header: 'Status',
      render: (v) => (
        <Badge variant={getStatusVariant(v)} size="sm" dot>
          {v?.replace('_', ' ')}
        </Badge>
      ) },
    { key: 'totalAmount', header: 'Amount',
      render: (v) => `₹${(v || 0).toFixed(2)}` },
  ]

  return (
    <div>
      <AdminHeader
        title={`Welcome, ${user?.name?.split(' ')[0] || 'Manager'}`}
        subtitle="Regional overview"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard title="Hospitals" value={0} icon={<Building2 className="w-5 h-5" />}    color="blue"   />
        <StatsCard title="Labs"      value={0} icon={<FlaskConical className="w-5 h-5" />}  color="green"  />
        <StatsCard title="Bookings"  value={0} icon={<Calendar className="w-5 h-5" />}     color="purple" />
        <StatsCard title="Revenue"   value={0} prefix="₹" icon={<IndianRupee className="w-5 h-5" />} color="orange" />
      </div>

      <Card title="Recent Bookings">
        <DataTable
          columns={bookingCols}
          data={bookings?.bookings || []}
          emptyTitle="No recent bookings"
        />
      </Card>
    </div>
  )
}