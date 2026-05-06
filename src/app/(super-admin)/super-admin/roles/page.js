'use client'

import { useState } from 'react'
import AdminHeader from '@/components/admin/AdminHeader'
import Tabs from '@/components/ui/Tabs'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'

const ROLES = [
  { key: 'super_admin',      label: 'Super Admin' },
  { key: 'regional_manager', label: 'Regional Manager' },
  { key: 'hospital_admin',   label: 'Hospital Admin' },
  { key: 'lab_admin',        label: 'Lab Admin' },
  { key: 'doctor',           label: 'Doctor' },
  { key: 'user',             label: 'Patient' },
]

const PERMISSION_MATRIX = {
  super_admin: {
    Hospitals:   ['read', 'write', 'delete', 'approve'],
    Labs:        ['read', 'write', 'delete', 'approve'],
    Doctors:     ['read', 'write', 'delete', 'verify'],
    Users:       ['read', 'write', 'block'],
    Bookings:    ['read', 'write', 'cancel'],
    Payments:    ['read'],
    Settlements: ['read', 'write', 'process'],
    Refunds:     ['read', 'write', 'process'],
    Coupons:     ['read', 'write', 'delete'],
    Analytics:   ['read', 'export'],
    Settings:    ['read', 'write'],
    'Audit Logs':['read'],
  },
  regional_manager: {
    Hospitals:   ['read'],
    Labs:        ['read'],
    Bookings:    ['read'],
    Settlements: ['read'],
    Analytics:   ['read'],
  },
  hospital_admin: {
    Doctors:     ['read', 'write'],
    Bookings:    ['read', 'update_status'],
    Coupons:     ['read', 'write'],
    Settlements: ['read'],
    Reports:     ['read'],
  },
  lab_admin: {
    Tests:       ['read', 'write', 'delete'],
    Bookings:    ['read', 'update_lab_status'],
    Reports:     ['upload'],
    Coupons:     ['read', 'write'],
    Settlements: ['read'],
  },
  doctor: {
    Bookings:    ['read', 'update_status', 'add_notes'],
    Availability:['read', 'write'],
    Profile:     ['read', 'write'],
  },
  user: {
    Bookings:    ['read', 'create', 'cancel', 'reschedule'],
    Invoices:    ['read', 'download'],
    Reports:     ['download'],
    Profile:     ['read', 'write'],
  },
}

const ACTION_COLORS = {
  read:             'info',
  write:            'success',
  delete:           'danger',
  approve:          'success',
  verify:           'success',
  block:            'danger',
  cancel:           'danger',
  process:          'warning',
  export:           'neutral',
  upload:           'info',
  update_status:    'warning',
  update_lab_status:'warning',
  add_notes:        'neutral',
  reschedule:       'info',
  download:         'info',
  create:           'success',
}

export default function RolesPage() {
  const [activeRole, setActiveRole] = useState('super_admin')

  const perms = PERMISSION_MATRIX[activeRole] || {}

  return (
    <div>
      <AdminHeader
        title="Roles & Permissions"
        subtitle="View permission matrix for each role"
        breadcrumbs={[
          { label: 'Dashboard', href: '/super-admin/dashboard' },
          { label: 'Roles' },
        ]}
      />

      <Tabs
        tabs={ROLES.map((r) => ({ key: r.key, label: r.label }))}
        activeTab={activeRole}
        onChange={setActiveRole}
        className="mb-6"
      />

      <Card title={`${ROLES.find((r) => r.key === activeRole)?.label} Permissions`}>
        {Object.keys(perms).length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">
            No specific permissions configured
          </p>
        ) : (
          <div className="space-y-3">
            {Object.entries(perms).map(([module, actions]) => (
              <div
                key={module}
                className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0"
              >
                <span className="text-sm font-semibold text-gray-700 w-36">
                  {module}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {actions.map((action) => (
                    <Badge
                      key={action}
                      variant={ACTION_COLORS[action] || 'neutral'}
                      size="sm"
                    >
                      {action.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}