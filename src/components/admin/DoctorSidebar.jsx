// src/components/admin/DoctorSidebar.jsx
'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, LayoutDashboard, Calendar, Clock, User } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

// ✅ Fixed nav — removed /doctor/schedule (404), added /doctor/availability
const NAV_ITEMS = [
  { label: 'Dashboard',    href: '/doctor/dashboard',    icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: 'Appointments', href: '/doctor/appointments', icon: <Calendar        className="w-4 h-4" /> },
  { label: 'Availability', href: '/doctor/availability', icon: <Clock           className="w-4 h-4" /> },
  { label: 'Profile',      href: '/doctor/profile',      icon: <User            className="w-4 h-4" /> },
]

function SidebarContent({ pathname, onClose }) {
  const { user, logout } = useAuth()

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between h-14 px-4 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-blue-600">MEDLI</span>
          <span className="text-xs bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-md font-medium">
            Doctor
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname?.startsWith(item.href + '/')
          return (
            <a
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={active
                ? 'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold bg-blue-50 text-blue-700 transition-colors'
                : 'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors'}
            >
              <span className={active ? 'text-blue-600' : 'text-gray-400'}>
                {item.icon}
              </span>
              {item.label}
              {active && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600 flex-shrink-0" />
              )}
            </a>
          )
        })}
      </nav>

      {/* User footer */}
      <div className="flex-shrink-0 p-3 border-t border-gray-100">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold flex-shrink-0">
            {user?.name?.charAt(0)?.toUpperCase() || 'D'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-800 truncate">{user?.name || '—'}</p>
            <p className="text-xs text-gray-400 truncate">{user?.email || user?.phone || '—'}</p>
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

export default function DoctorSidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Desktop */}
      <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-100 z-30 hidden lg:flex flex-col">
        <SidebarContent pathname={pathname} />
      </aside>

      {/* Mobile hamburger */}
      <button
        onClick={() => setOpen(true)}
        className="fixed top-3 left-3 z-40 lg:hidden p-2 bg-white rounded-xl border border-gray-200 shadow-sm"
        style={{ minHeight: 44, minWidth: 44 }}
      >
        <Menu className="w-4 h-4 text-gray-600" />
      </button>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40 lg:hidden"
              onClick={() => setOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-100 flex flex-col z-50 lg:hidden"
            >
              <SidebarContent pathname={pathname} onClose={() => setOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}