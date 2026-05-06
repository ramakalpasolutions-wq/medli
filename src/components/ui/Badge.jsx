'use client'

const variants = {
  success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border border-amber-200',
  danger:  'bg-red-50 text-red-700 border border-red-200',
  info:    'bg-blue-50 text-blue-700 border border-blue-200',
  neutral: 'bg-gray-100 text-gray-600',
  purple:  'bg-purple-50 text-purple-700 border border-purple-200',
}

const dotColors = {
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger:  'bg-red-500',
  info:    'bg-blue-500',
  neutral: 'bg-gray-400',
  purple:  'bg-purple-500',
}

const sizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
}

export function getStatusVariant(status) {
  const map = {
    confirmed:       'info',
    completed:       'success',
    cancelled:       'danger',
    refunded:        'neutral',
    no_show:         'warning',
    pending_payment: 'warning',
    pending:         'warning',
    processing:      'info',
    report_ready:    'success',
    failed:          'danger',
    success:         'success',
    approved:        'success',
    on_hold:         'warning',
    active:          'success',
    inactive:        'neutral',
    created:         'neutral',
    paid:            'success',
    partial_refund:  'warning',
    sample_collected:'info',
  }
  return map[status] || 'neutral'
}

export default function Badge({
  children,
  variant   = 'info',
  size      = 'md',
  dot       = false,
  pulse     = false,
  className = '',
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full ${variants[variant] ?? variants.info} ${sizes[size] ?? sizes.md} ${className}`}
    >
      {dot && (
        <span className="relative flex-shrink-0">
          <span
            className={`block w-1.5 h-1.5 rounded-full ${dotColors[variant] ?? dotColors.info}`}
          />
          {pulse && (
            <span
              className={`absolute inset-0 w-1.5 h-1.5 rounded-full animate-ping opacity-75 ${dotColors[variant] ?? dotColors.info}`}
            />
          )}
        </span>
      )}
      {children}
    </span>
  )
}