'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'

const Select = forwardRef(function Select(
  {
    label,
    error,
    hint,
    className    = '',
    wrapperClass = '',
    children,
    placeholder,
    required,
    ...props
  },
  ref
) {
  const base =
    'w-full rounded-xl border bg-white px-3 py-2.5 text-sm focus:outline-none transition-all appearance-none cursor-pointer pr-9'
  const normal =
    'border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900'
  const errCls =
    'border-red-400 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-gray-900'

  return (
    <div className={`flex flex-col gap-1.5 ${wrapperClass}`}>
      {label && (
        <label className="text-xs font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          className={`${base} ${error ? errCls : normal} ${className}`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {children}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>
      <AnimatePresence mode="wait">
        {error && (
          <motion.p
            key="error"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{    opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="text-xs text-red-500 flex items-center gap-1"
          >
            <span>⚠</span> {error}
          </motion.p>
        )}
        {hint && !error && (
          <motion.p
            key="hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-gray-400"
          >
            {hint}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
})

export default Select