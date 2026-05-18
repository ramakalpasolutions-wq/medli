'use client'

import AdminHeader from '@/components/admin/AdminHeader'
import SupportForm from '@/components/support/SupportForm'

export default function LabAdminSupportPage() {
  return (
    <>
      <AdminHeader
        title="Contact Support"
        subtitle="Reach support for lab operations and platform issues"
        breadcrumbs={[
          { label: 'Dashboard', href: '/lab-admin/dashboard' },
          { label: 'Support' },
        ]}
      />

      <SupportForm
        title="Lab Admin Support"
        subtitle="Submit report, test, home collection, or account issues"
      />
    </>
  )
}