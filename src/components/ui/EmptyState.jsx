'use client'

import { motion } from 'framer-motion'

export default function EmptyState({
  icon,
  title   = 'No data found',
  message = 'Nothing to show here yet.',
  action,
  className = '',
}) {
  const defaultIcon = (
    <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
  )

  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 ${className}`}>
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        className="mb-4 text-gray-300"
      >
        {icon ?? defaultIcon}
      </motion.div>
      <h3 className="text-sm font-semibold text-gray-700 mb-1">{title}</h3>
      <p className="text-xs text-gray-400 text-center max-w-xs">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}