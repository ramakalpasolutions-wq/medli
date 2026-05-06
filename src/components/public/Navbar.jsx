// src/components/public/Navbar.jsx
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { Menu, X, ChevronDown, User, Calendar, FileText, LogOut } from 'lucide-react'

// ✅ Prevents any server/client mismatch for auth-dependent UI
function useMounted() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  return mounted
}

export default function Navbar() {
  const { user, loading, logout } = useAuth()
  const mounted      = useMounted()
  const [mobileOpen,   setMobileOpen]   = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const navLinks = [
    { label: 'Hospitals', href: '/hospitals' },
    { label: 'Labs',      href: '/labs'      },
    { label: 'Doctors',   href: '/doctors'   },
    { label: 'Search',    href: '/search'    },
  ]

  // ✅ What to render in the auth slot
  const renderAuthSlot = () => {
    // Before mount — always render same placeholder (no mismatch)
    if (!mounted) {
      return <div className="w-8 h-8 rounded-full bg-gray-100" />
    }
    // After mount — loading spinner
    if (loading) {
      return <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" />
    }
    // Logged in
    if (user) {
      return (
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-sm font-bold">
              {user.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <span className="text-sm font-medium text-gray-700 max-w-[120px] truncate">
              {user.name?.split(' ')[0]}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>

          <AnimatePresence>
            {dropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 8,  scale: 0.95 }}
                  animate={{ opacity: 1, y: 0,  scale: 1    }}
                  exit={{    opacity: 0, y: 8,  scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-48 bg-white rounded-2xl border border-gray-100 overflow-hidden z-20"
                  style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.10)' }}
                >
                  {[
                    { icon: <User     className="w-4 h-4" />, label: 'Dashboard',  href: '/user/dashboard' },
                    { icon: <Calendar className="w-4 h-4" />, label: 'My Bookings',href: '/user/bookings'  },
                    { icon: <FileText className="w-4 h-4" />, label: 'Invoices',    href: '/user/invoices'  },
                  ].map((item) => (
                    <a key={item.href} href={item.href}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <span className="text-gray-400">{item.icon}</span>
                      {item.label}
                    </a>
                  ))}
                  <button
                    onClick={() => { logout(); setDropdownOpen(false) }}
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors border-t border-gray-50"
                  >
                    <LogOut className="w-4 h-4" /> Sign out
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      )
    }
    // Logged out
    return (
      <>
        <a href="/auth/login"
          className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
          Log in
        </a>
        <a href="/auth/register"
          className="px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors">
          Sign up
        </a>
      </>
    )
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <a href="/" className="flex items-center gap-2">
            <span className="text-2xl">🏥</span>
            <span className="text-blue-600 font-bold text-xl">MEDLI</span>
          </a>

          {/* Desktop nav links — static, no mismatch */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((l) => (
              <a key={l.href} href={l.href}
                className="text-sm text-gray-600 hover:text-blue-600 font-medium transition-colors">
                {l.label}
              </a>
            ))}
          </div>

          {/* Desktop auth slot */}
          <div className="hidden md:flex items-center gap-3">
            {renderAuthSlot()}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
            style={{ minHeight: 44, minWidth: 44 }}
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40 md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 h-screen w-72 bg-white z-50 flex flex-col md:hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <span className="text-blue-600 font-bold text-lg">🏥 MEDLI</span>
                <button onClick={() => setMobileOpen(false)}
                  className="p-2 rounded-xl hover:bg-gray-100"
                  style={{ minHeight: 44, minWidth: 44 }}>
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                {navLinks.map((l) => (
                  <a key={l.href} href={l.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center px-3 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    style={{ minHeight: 44 }}>
                    {l.label}
                  </a>
                ))}

                {/* ✅ Only show user links after mount */}
                {mounted && user && (
                  <>
                    <div className="border-t border-gray-100 my-2" />
                    <a href="/user/dashboard" onClick={() => setMobileOpen(false)}
                      className="flex items-center px-3 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      style={{ minHeight: 44 }}>
                      Dashboard
                    </a>
                    <a href="/user/bookings" onClick={() => setMobileOpen(false)}
                      className="flex items-center px-3 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      style={{ minHeight: 44 }}>
                      My Bookings
                    </a>
                  </>
                )}
              </div>

              <div className="p-4 border-t border-gray-100">
                {/* ✅ Guard mobile auth buttons too */}
                {!mounted ? (
                  <div className="h-11 rounded-xl bg-gray-100 animate-pulse" />
                ) : user ? (
                  <button
                    onClick={() => { logout(); setMobileOpen(false) }}
                    className="w-full py-3 rounded-xl text-sm font-medium text-red-500 border border-red-200 hover:bg-red-50 transition-colors"
                  >
                    Sign out
                  </button>
                ) : (
                  <div className="flex flex-col gap-2">
                    <a href="/auth/login"
                      className="w-full py-3 text-center rounded-xl text-sm font-medium text-gray-700 border border-gray-200 hover:bg-gray-50 transition-colors">
                      Log in
                    </a>
                    <a href="/auth/register"
                      className="w-full py-3 text-center rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                      Sign up
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  )
}