'use client'

import { motion } from 'framer-motion'

export default function Card({
  children,
  className   = '',
  hoverable   = false,
  animate     = true,
  title,
  action,
  padding     = true,
  ...props
}) {
  return (
    <motion.div
      initial={animate ? { opacity: 0, y: 10 } : false}
      animate={animate ? { opacity: 1, y: 0  } : false}
      transition={{ duration: 0.25 }}
      whileHover={hoverable ? { boxShadow: '0 8px 24px rgba(0,0,0,0.10)' } : undefined}
      className={`bg-white rounded-2xl border border-gray-100 ${padding ? 'p-5' : ''} ${className}`}
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
      {...props}
    >
      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
          {title && (
            <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
          )}
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </motion.div>
  )
}