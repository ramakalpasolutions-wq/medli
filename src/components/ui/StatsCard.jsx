'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown } from 'lucide-react'

function useCountUp(target, duration = 1000) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (typeof target !== 'number' || isNaN(target)) {
      setCount(target)
      return
    }
    const start    = Date.now()
    const interval = setInterval(() => {
      const elapsed  = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      setCount(Math.floor(progress * target))
      if (progress >= 1) clearInterval(interval)
    }, 16)
    return () => clearInterval(interval)
  }, [target, duration])

  return count
}

const colorClasses = {
  blue:   { bg: 'bg-blue-100',    icon: 'text-blue-600',    value: 'text-blue-600' },
  green:  { bg: 'bg-emerald-100', icon: 'text-emerald-600', value: 'text-emerald-600' },
  purple: { bg: 'bg-purple-100',  icon: 'text-purple-600',  value: 'text-purple-600' },
  orange: { bg: 'bg-orange-100',  icon: 'text-orange-600',  value: 'text-orange-600' },
  red:    { bg: 'bg-red-100',     icon: 'text-red-600',     value: 'text-red-600' },
  indigo: { bg: 'bg-indigo-100',  icon: 'text-indigo-600',  value: 'text-indigo-600' },
}

export default function StatsCard({
  title,
  value,
  icon,
  color       = 'blue',
  trend,
  trendLabel,
  prefix      = '',
  suffix      = '',
  className   = '',
}) {
  const numericValue = typeof value === 'number' ? value : parseInt(String(value).replace(/[^0-9]/g, '')) || 0
  const animatedCount = useCountUp(numericValue)
  const c = colorClasses[color] ?? colorClasses.blue

  const displayValue = typeof value === 'number'
    ? `${prefix}${animatedCount.toLocaleString('en-IN')}${suffix}`
    : value

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      className={`bg-white rounded-2xl border border-gray-100 p-5 ${className}`}
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.bg}`}>
          <span className={c.icon}>{icon}</span>
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {trend >= 0
              ? <TrendingUp className="w-3.5 h-3.5" />
              : <TrendingDown className="w-3.5 h-3.5" />
            }
            {Math.abs(trend)}%
          </div>
        )}
      </div>

      <div className={`text-2xl font-bold ${c.value} mb-1`}>
        {displayValue}
      </div>
      <p className="text-xs font-medium text-gray-500">{title}</p>
      {trendLabel && (
        <p className="text-xs text-gray-400 mt-1">{trendLabel}</p>
      )}
    </motion.div>
  )
}