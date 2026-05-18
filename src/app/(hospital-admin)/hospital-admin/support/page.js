'use client'

import AdminHeader from '@/components/admin/AdminHeader'
import SupportForm from '@/components/support/SupportForm'

export default function HospitalAdminSupportPage() {
  return (
    <>
      <AdminHeader
        title="Contact Support"
        subtitle="Reach support for hospital administration issues"
        breadcrumbs={[
          { label: 'Dashboard', href: '/hospital-admin/dashboard' },
          { label: 'Support' },
        ]}
      />

      <SupportForm
        title="Hospital Admin Support"
        subtitle="Submit doctor, hospital, billing, or management issues"
      />
    </>
  )
}