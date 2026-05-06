// src/app/(user)/layout.js
'use client'

import { ToastProvider } from '@/context/ToastContext'

export default function UserLayout({ children }) {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    </ToastProvider>
  )
}