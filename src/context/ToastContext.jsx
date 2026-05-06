'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const ToastContext = createContext(null)

let toastId = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback(
    ({ type = 'info', message, title }) => {
      const id = ++toastId
      setToasts((prev) => [...prev.slice(-4), { id, type, message, title }])
      setTimeout(() => dismiss(id), 4000)
    },
    [dismiss]
  )

  const success = useCallback((message, title) => addToast({ type: 'success', message, title }), [addToast])
  const error   = useCallback((message, title) => addToast({ type: 'error',   message, title }), [addToast])
  const warning = useCallback((message, title) => addToast({ type: 'warning', message, title }), [addToast])
  const info    = useCallback((message, title) => addToast({ type: 'info',    message, title }), [addToast])

  const colors = {
    success: { bar: 'bg-emerald-500', icon: '✓', iconBg: 'bg-emerald-100 text-emerald-600', title: 'text-emerald-800' },
    error:   { bar: 'bg-red-500',     icon: '✕', iconBg: 'bg-red-100 text-red-600',         title: 'text-red-800' },
    warning: { bar: 'bg-amber-500',   icon: '!', iconBg: 'bg-amber-100 text-amber-600',     title: 'text-amber-800' },
    info:    { bar: 'bg-blue-500',    icon: 'i', iconBg: 'bg-blue-100 text-blue-600',       title: 'text-blue-800' },
  }

  return (
    <ToastContext.Provider value={{ success, error, warning, info, dismiss }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-80 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => {
            const c = colors[toast.type] || colors.info
            return (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, x: 100, scale: 0.95 }}
                animate={{ opacity: 1, x: 0,   scale: 1 }}
                exit={{    opacity: 0, x: 100,  scale: 0.95 }}
                transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                className="pointer-events-auto bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden flex"
              >
                <div className={`w-1 flex-shrink-0 ${c.bar}`} />
                <div className="flex items-start gap-3 p-3 flex-1">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${c.iconBg}`}>
                    {c.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    {toast.title && (
                      <p className={`text-xs font-semibold mb-0.5 ${c.title}`}>{toast.title}</p>
                    )}
                    <p className="text-xs text-gray-600 leading-relaxed">{toast.message}</p>
                  </div>
                  <button
                    onClick={() => dismiss(toast.id)}
                    className="text-gray-300 hover:text-gray-500 transition-colors flex-shrink-0 text-sm leading-none"
                  >
                    ✕
                  </button>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

export default ToastContext