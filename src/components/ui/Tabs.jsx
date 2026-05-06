'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

export default function Tabs({
  tabs,
  activeTab,
  onChange,
  variant   = 'underline',
  className = '',
}) {
  const isUnderline = variant === 'underline'
  const isPills     = variant === 'pills'

  if (isUnderline) {
    return (
      <div className={`flex border-b border-gray-200 ${className}`}>
        {tabs.map((tab) => {
          const active = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => onChange(tab.key)}
              className={`relative px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none flex items-center gap-2 ${
                active ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.icon && <span>{tab.icon}</span>}
              {tab.label}
              {tab.count !== undefined && (
                <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${
                  active ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {tab.count}
                </span>
              )}
              {active && (
                <motion.div
                  layoutId="underline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"
                />
              )}
            </button>
          )
        })}
      </div>
    )
  }

  if (isPills) {
    return (
      <div className={`flex gap-1 bg-gray-100 rounded-xl p-1 ${className}`}>
        {tabs.map((tab) => {
          const active = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => onChange(tab.key)}
              className="relative flex-1 px-3 py-2 text-sm font-medium transition-colors focus:outline-none rounded-lg flex items-center justify-center gap-2"
            >
              {active && (
                <motion.div
                  layoutId="pill"
                  className="absolute inset-0 bg-white rounded-lg"
                  style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
                />
              )}
              <span className={`relative z-10 ${active ? 'text-gray-900' : 'text-gray-500'}`}>
                {tab.icon && <span className="mr-1">{tab.icon}</span>}
                {tab.label}
              </span>
              {tab.count !== undefined && (
                <span className={`relative z-10 px-1.5 py-0.5 rounded-full text-xs font-semibold ${
                  active ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-500'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          )
        })}
      </div>
    )
  }

  return null
}