'use client'

import Navbar from '@/components/public/Navbar'
import Footer from '@/components/public/Footer'
import AdminHeader from '@/components/admin/AdminHeader'
import SupportForm from '@/components/support/SupportForm'

export default function UserSupportPage() {
  return (
    <>
      <Navbar />

      <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '88px 16px 64px' }}>
          <AdminHeader
            title="Contact Support"
            subtitle="Get help with your account, bookings, payments, and reports"
            breadcrumbs={[
              { label: 'Dashboard', href: '/user/dashboard' },
              { label: 'Support' },
            ]}
          />

          <SupportForm
            title="User Support"
            subtitle="Tell us your issue and our team will review it"
          />
        </div>
      </div>

      <Footer />
    </>
  )
}