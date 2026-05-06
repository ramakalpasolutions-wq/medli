'use client'

import { motion } from 'framer-motion'

const variants = {
  primary:  'bg-blue-600 hover:bg-blue-700 text-white shadow-sm',
  secondary:'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50',
  danger:   'bg-red-600 hover:bg-red-700 text-white',
  ghost:    'text-blue-600 hover:bg-blue-50 bg-transparent',
  outline:  'border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white',
}

const sizes = {
  xs: 'px-2.5 py-1.5 text-xs rounded-lg',
  sm: 'px-3 py-2 text-sm rounded-lg',
  md: 'px-4 py-2.5 text-sm rounded-xl',
  lg: 'px-6 py-3 text-base rounded-xl',
  xl: 'px-8 py-4 text-lg rounded-2xl',
}

const base =
  'inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed'

const Spinner = () => (
  <svg
    className="animate-spin h-4 w-4"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
    />
  </svg>
)

export default function Button({
  children,
  variant = 'primary',
  size    = 'md',
  loading = false,
  disabled = false,
  className = '',
  leftIcon,
  rightIcon,
  ...props
}) {
  return (
    <motion.button
      whileHover={disabled || loading ? {} : { scale: 1.02 }}
      whileTap={disabled   || loading ? {} : { scale: 0.98 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      disabled={disabled || loading}
      className={`${base} ${variants[variant] ?? variants.primary} ${sizes[size] ?? sizes.md} ${className}`}
      {...props}
    >
      {loading ? <Spinner /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </motion.button>
  )
}