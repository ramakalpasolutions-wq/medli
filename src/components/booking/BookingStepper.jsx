'use client'

import { motion } from 'framer-motion'
import { Check } from 'lucide-react'

const STEPS = [
  { label: 'Review',  sub: 'Booking details' },
  { label: 'Details', sub: 'Patient info' },
  { label: 'Coupon',  sub: 'Pricing' },
  { label: 'Payment', sub: 'Pay securely' },
]

export default function BookingStepper({ currentStep }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((step, i) => {
        const stepNum = i + 1
        const isActive    = stepNum === currentStep
        const isCompleted = stepNum < currentStep

        return (
          <div key={step.label} className="flex items-center flex-1 last:flex-none">
            {/* Circle + label */}
            <div className="flex flex-col items-center">
              <motion.div
                animate={{
                  backgroundColor: isCompleted ? '#10b981' : isActive ? '#2563eb' : '#e5e7eb',
                  scale: isActive ? 1.1 : 1,
                }}
                transition={{ duration: 0.2 }}
                className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm"
              >
                {isCompleted ? <Check className="w-4 h-4" /> : <span className={isActive ? 'text-white' : 'text-gray-400'}>{stepNum}</span>}
              </motion.div>
              <div className="text-center mt-1.5">
                <p className={`text-xs font-semibold ${isActive ? 'text-blue-600' : isCompleted ? 'text-emerald-600' : 'text-gray-400'}`}>{step.label}</p>
                <p className="text-xs text-gray-400 hidden sm:block">{step.sub}</p>
              </div>
            </div>

            {/* Connecting line */}
            {i < STEPS.length - 1 && (
              <motion.div
                animate={{ backgroundColor: isCompleted ? '#10b981' : '#e5e7eb' }}
                className="flex-1 h-0.5 mx-2 mt-0 -translate-y-3"
              />
            )}
          </div>
        )
      })}
    </div>
  )
}