'use client'

import AdminHeader from '@/components/admin/AdminHeader'
import SupportForm from '@/components/support/SupportForm'

export default function DoctorSupportPage() {
  return (
    <>
      <AdminHeader
        title="Contact Support"
        subtitle="Reach support for doctor account and platform issues"
        breadcrumbs={[
          { label: 'Dashboard', href: '/doctor/dashboard' },
          { label: 'Support' },
        ]}
      />

      <SupportForm
        title="Doctor Support"
        subtitle="Submit platform, schedule, payout, or profile related issues"
      />
    </>
  )
}