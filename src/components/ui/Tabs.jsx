'use client'

import { useState, useRef, useEffect } from 'react'

export default function Tabs({
  tabs,
  activeTab,
  onChange,
  variant   = 'underline',
  style: extraStyle = {},
}) {
  const [indicatorStyle, setIndicatorStyle] = useState({})
  const tabRefs = useRef({})

  useEffect(() => {
    if (variant !== 'underline') return
    const el = tabRefs.current[activeTab]
    if (el) {
      setIndicatorStyle({
        left: el.offsetLeft,
        width: el.offsetWidth,
      })
    }
  }, [activeTab, variant, tabs])

  if (variant === 'underline') {
    return (
      <div style={{
        display: 'flex',
        borderBottom: '2px solid #f1f5f9',
        position: 'relative',
        overflowX: 'auto',
        ...extraStyle,
      }}>
        {tabs.map((tab) => {
          const active = activeTab === tab.key
          return (
            <TabUnderlineItem
              key={tab.key}
              tab={tab}
              active={active}
              onChange={onChange}
              ref={(el) => { if (el) tabRefs.current[tab.key] = el }}
            />
          )
        })}
        {/* Sliding indicator */}
        <div style={{
          position: 'absolute',
          bottom: -2,
          height: 2,
          background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
          borderRadius: 2,
          transition: 'left 0.25s ease, width 0.25s ease',
          ...indicatorStyle,
        }} />
      </div>
    )
  }

  if (variant === 'pills') {
    return (
      <div style={{
        display: 'flex',
        gap: 4,
        background: '#f1f5f9',
        borderRadius: 14,
        padding: 4,
        ...extraStyle,
      }}>
        {tabs.map((tab) => {
          const active = activeTab === tab.key
          return (
            <TabPillItem
              key={tab.key}
              tab={tab}
              active={active}
              onChange={onChange}
            />
          )
        })}
      </div>
    )
  }

  return null
}

import { forwardRef } from 'react'

const TabUnderlineItem = forwardRef(function TabUnderlineItem({ tab, active, onChange }, ref) {
  const [hover, setHover] = useState(false)
  return (
    <button
      ref={ref}
      onClick={() => onChange(tab.key)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '10px 16px',
        fontSize: 14,
        fontWeight: active ? 600 : 500,
        color: active ? '#6366f1' : hover ? '#334155' : '#94a3b8',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        outline: 'none',
        transition: 'color 0.15s ease',
        whiteSpace: 'nowrap',
        position: 'relative',
        flexShrink: 0,
      }}
    >
      {tab.icon && (
        <span style={{ display: 'inline-flex' }}>{tab.icon}</span>
      )}
      {tab.label}
      {tab.count !== undefined && (
        <span style={{
          padding: '1px 7px',
          borderRadius: 100,
          fontSize: 11,
          fontWeight: 600,
          background: active ? 'rgba(99,102,241,0.12)' : '#f1f5f9',
          color: active ? '#6366f1' : '#94a3b8',
        }}>
          {tab.count}
        </span>
      )}
    </button>
  )
})

function TabPillItem({ tab, active, onChange }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onClick={() => onChange(tab.key)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        flex: 1,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        padding: '8px 12px',
        fontSize: 13,
        fontWeight: active ? 600 : 500,
        color: active ? '#0f172a' : hover ? '#334155' : '#94a3b8',
        background: active
          ? '#ffffff'
          : hover ? 'rgba(255,255,255,0.5)' : 'transparent',
        border: 'none',
        borderRadius: 10,
        cursor: 'pointer',
        outline: 'none',
        transition: 'all 0.18s ease',
        boxShadow: active ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
        whiteSpace: 'nowrap',
      }}
    >
      {tab.icon && <span style={{ display: 'inline-flex' }}>{tab.icon}</span>}
      {tab.label}
      {tab.count !== undefined && (
        <span style={{
          padding: '1px 7px',
          borderRadius: 100,
          fontSize: 11,
          fontWeight: 600,
          background: active ? 'rgba(99,102,241,0.12)' : 'rgba(0,0,0,0.06)',
          color: active ? '#6366f1' : '#94a3b8',
        }}>
          {tab.count}
        </span>
      )}
    </button>
  )
}