'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

const NAV_ITEMS = [
  { label: 'Dashboard',         href: '/super-admin/dashboard' },
  { label: 'Hospitals',         href: '/super-admin/hospitals' },
  { label: 'Labs',              href: '/super-admin/labs' },
  { label: 'Doctors',           href: '/super-admin/doctors' },
  { label: 'Users',             href: '/super-admin/users' },
  { label: 'Bookings',          href: '/super-admin/bookings' },
  { label: 'Payments',          href: '/super-admin/payments' },
  { label: 'Settlements',       href: '/super-admin/settlements' },
  { label: 'Refunds',           href: '/super-admin/refunds' },
  { label: 'Coupons',           href: '/super-admin/coupons' },
  { label: 'Invoices',          href: '/super-admin/invoices' },
  { label: 'Regions',           href: '/super-admin/regions' },
  { label: 'Analytics',         href: '/super-admin/analytics' },
  { label: 'Revenue',           href: '/super-admin/revenue' },
  { label: 'Notifications',     href: '/super-admin/notifications' },
  { label: 'Bank Accounts',     href: '/super-admin/bank-accounts' },
  { label: 'Platform Settings', href: '/super-admin/settings' },
  { label: 'Queues',            href: '/super-admin/queues' },
  { label: 'Audit Logs',        href: '/super-admin/audit-logs' },
]

function SidebarContent({ pathname, onClose }) {
  const { user, logout } = useAuth()

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between h-14 px-4 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-blue-600">MEDLI</span>
          <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-md font-medium">Super</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname?.startsWith(item.href + '/')
          return (
            <a
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 mx-0 rounded-xl text-sm transition-colors mb-0.5 ${
                active
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${active ? 'bg-blue-600' : 'bg-gray-300'}`} />
              {item.label}
            </a>
          )
        })}
      </nav>

      {/* User */}
      <div className="flex-shrink-0 p-3 border-t border-gray-100">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold">
            {user?.name?.charAt(0)?.toUpperCase() || 'S'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-800 truncate">{user?.name || 'Super Admin'}</p>
            <p className="text-xs text-gray-400 truncate">{user?.email || user?.phone}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full text-xs text-gray-400 hover:text-red-500 transition-colors text-left px-1"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}

export default function SuperAdminSidebar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Desktop */}
      <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-100 flex flex-col overflow-y-auto z-30 hidden lg:flex">
        <SidebarContent pathname={pathname} />
      </aside>

      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-3 left-3 z-40 lg:hidden p-2 bg-white rounded-xl border border-gray-200 shadow-sm"
      >
        <Menu className="w-4 h-4 text-gray-600" />
      </button>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-100 flex flex-col z-50 lg:hidden"
            >
              <SidebarContent pathname={pathname} onClose={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}