// src/components/ui/DataTable.jsx
'use client'

import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { SkeletonTableRow } from './Skeleton'
import EmptyState from './EmptyState'
import Button from './Button'

export default function DataTable({
  columns,
  data         = [],
  loading      = false,
  emptyTitle   = 'No data found',
  emptyMessage = 'Nothing to show here yet.',
  page         = 1,
  totalPages   = 1,
  onPageChange,
  keyField     = 'id',
  skeletonRows = 5,
  className    = '',
}) {
  return (
    <div
      className={`bg-white rounded-2xl border border-gray-100 overflow-hidden ${className}`}
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-max">

          {/* ── Header ── */}
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap ${col.headerClass ?? ''}`}
                  style={{ width: col.width }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          {/* ── Body ── */}
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              // ✅ Pass rowIndex so widths are deterministic (no Math.random)
              Array.from({ length: skeletonRows }).map((_, i) => (
                <SkeletonTableRow key={i} cols={columns.length} rowIndex={i} />
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12">
                  <EmptyState title={emptyTitle} message={emptyMessage} />
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <motion.tr
                  key={row[keyField] ?? rowIndex}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: rowIndex * 0.03 }}
                  className="hover:bg-gray-50/80 transition-colors"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-4 py-3 text-sm text-gray-700 whitespace-nowrap ${col.cellClass ?? ''}`}
                    >
                      {col.render
                        ? col.render(row[col.key], row)
                        : (row[col.key] ?? '—')}
                    </td>
                  ))}
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50">
          <p className="text-xs text-gray-500">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="xs"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let p = i + 1
              if (totalPages > 5) {
                if (page > 3)              p = page - 2 + i
                if (page > totalPages - 3) p = totalPages - 4 + i
              }
              if (p < 1 || p > totalPages) return null
              return (
                <button
                  key={p}
                  onClick={() => onPageChange(p)}
                  className={p === page
                    ? 'w-7 h-7 rounded-lg text-xs font-medium bg-blue-600 text-white'
                    : 'w-7 h-7 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-200 transition-colors'}
                >
                  {p}
                </button>
              )
            })}

            <Button
              variant="ghost"
              size="xs"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}