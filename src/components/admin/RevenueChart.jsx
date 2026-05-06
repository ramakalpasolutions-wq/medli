'use client'

import { useState } from 'react'
import {
  ResponsiveContainer,
  LineChart, Line,
  BarChart, Bar,
  AreaChart, Area,
  XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div
      className="bg-white rounded-xl px-3 py-2.5 border border-gray-100"
      style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
    >
      <p className="text-xs font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-xs" style={{ color: entry.color }}>
          {entry.name}: {typeof entry.value === 'number'
            ? `₹${entry.value.toLocaleString('en-IN')}`
            : entry.value}
        </p>
      ))}
    </div>
  )
}

const CHART_TYPES = [
  { key: 'area', label: 'Area' },
  { key: 'line', label: 'Line' },
  { key: 'bar',  label: 'Bar' },
]

export default function RevenueChart({
  data       = [],
  title      = 'Revenue Overview',
  dataKeys   = [{ key: 'revenue', color: '#1286f5', name: 'Revenue' }],
  className  = '',
  xAxisKey   = 'date',
}) {
  const [chartType, setChartType] = useState('area')

  const commonProps = {
    data,
    margin: { top: 5, right: 10, left: 0, bottom: 0 },
  }

  const axisProps = {
    xAxis: <XAxis dataKey={xAxisKey} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />,
    yAxis: <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />,
    grid:  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />,
    tooltip: <Tooltip content={<CustomTooltip />} />,
    legend: <Legend wrapperStyle={{ fontSize: 11 }} />,
  }

  const renderChart = () => {
    if (chartType === 'line') {
      return (
        <LineChart {...commonProps}>
          {axisProps.grid}{axisProps.xAxis}{axisProps.yAxis}{axisProps.tooltip}{axisProps.legend}
          {dataKeys.map((dk) => (
            <Line key={dk.key} type="monotone" dataKey={dk.key} stroke={dk.color} strokeWidth={2} dot={false} name={dk.name} />
          ))}
        </LineChart>
      )
    }
    if (chartType === 'bar') {
      return (
        <BarChart {...commonProps}>
          {axisProps.grid}{axisProps.xAxis}{axisProps.yAxis}{axisProps.tooltip}{axisProps.legend}
          {dataKeys.map((dk) => (
            <Bar key={dk.key} dataKey={dk.key} fill={dk.color} radius={[4, 4, 0, 0]} name={dk.name} />
          ))}
        </BarChart>
      )
    }
    // area (default)
    return (
      <AreaChart {...commonProps}>
        <defs>
          {dataKeys.map((dk) => (
            <linearGradient key={dk.key} id={`grad-${dk.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={dk.color} stopOpacity={0.12} />
              <stop offset="95%" stopColor={dk.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        {axisProps.grid}{axisProps.xAxis}{axisProps.yAxis}{axisProps.tooltip}{axisProps.legend}
        {dataKeys.map((dk) => (
          <Area
            key={dk.key}
            type="monotone"
            dataKey={dk.key}
            stroke={dk.color}
            strokeWidth={2}
            fill={`url(#grad-${dk.key})`}
            name={dk.name}
          />
        ))}
      </AreaChart>
    )
  }

  return (
    <div
      className={`bg-white rounded-2xl border border-gray-100 p-5 ${className}`}
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
          {CHART_TYPES.map((ct) => (
            <button
              key={ct.key}
              onClick={() => setChartType(ct.key)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                chartType === ct.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {ct.label}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  )
}