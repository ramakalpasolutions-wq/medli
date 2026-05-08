'use client'

import { useState } from 'react'
import AdminHeader from '@/components/admin/AdminHeader'
import Badge from '@/components/ui/Badge'
import Tabs from '@/components/ui/Tabs'

const ROLES = [
  { key: 'super_admin',      label: 'Super Admin'       },
  { key: 'regional_manager', label: 'Regional Manager'  },
  { key: 'hospital_admin',   label: 'Hospital Admin'    },
  { key: 'lab_admin',        label: 'Lab Admin'         },
  { key: 'doctor',           label: 'Doctor'            },
  { key: 'user',             label: 'Patient'           },
]

const PERMISSION_MATRIX = {
  super_admin:      { Hospitals:['read','write','delete','approve'], Labs:['read','write','delete','approve'], Doctors:['read','write','delete','verify'], Users:['read','write','block'], Bookings:['read','write','cancel'], Payments:['read'], Settlements:['read','write','process'], Refunds:['read','write','process'], Coupons:['read','write','delete'], Analytics:['read','export'], Settings:['read','write'], 'Audit Logs':['read'] },
  regional_manager: { Hospitals:['read'], Labs:['read'], Bookings:['read'], Settlements:['read'], Analytics:['read'] },
  hospital_admin:   { Doctors:['read','write'], Bookings:['read','update_status'], Coupons:['read','write'], Settlements:['read'], Reports:['read'] },
  lab_admin:        { Tests:['read','write','delete'], Bookings:['read','update_lab_status'], Reports:['upload'], Coupons:['read','write'], Settlements:['read'] },
  doctor:           { Bookings:['read','update_status','add_notes'], Availability:['read','write'], Profile:['read','write'] },
  user:             { Bookings:['read','create','cancel','reschedule'], Invoices:['read','download'], Reports:['download'], Profile:['read','write'] },
}

const ACTION_COLORS = {
  read:'info', write:'success', delete:'danger', approve:'success', verify:'success',
  block:'danger', cancel:'danger', process:'warning', export:'neutral', upload:'info',
  update_status:'warning', update_lab_status:'warning', add_notes:'neutral',
  reschedule:'info', download:'info', create:'success',
}

function SCard({ title, children }) {
  return (
    <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #f8fafc' }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: 0 }}>{title}</h3>
      </div>
      <div style={{ padding: 20 }}>{children}</div>
    </div>
  )
}

export default function RolesPage() {
  const [activeRole, setActiveRole] = useState('super_admin')
  const perms = PERMISSION_MATRIX[activeRole] || {}

  return (
    <>
      <AdminHeader title="Roles & Permissions" subtitle="View permission matrix for each role"
        breadcrumbs={[{ label: 'Dashboard', href: '/super-admin/dashboard' }, { label: 'Roles' }]} />
      <Tabs tabs={ROLES.map((r) => ({ key: r.key, label: r.label }))} activeTab={activeRole} onChange={setActiveRole} style={{ marginBottom: 20 }} />

      <SCard title={`${ROLES.find((r) => r.key === activeRole)?.label} Permissions`}>
        {!Object.keys(perms).length ? (
          <p style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', padding: '24px 0' }}>No specific permissions configured</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {Object.entries(perms).map(([module, actions]) => (
              <div key={module} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f8fafc' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#475569', width: 140, flexShrink: 0 }}>{module}</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {actions.map((action) => (
                    <Badge key={action} variant={ACTION_COLORS[action] || 'neutral'} size="sm">
                      {action.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </SCard>
    </>
  )
}