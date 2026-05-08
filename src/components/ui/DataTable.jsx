'use client'

import { useState } from 'react'
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
  style: extraStyle = {},
}) {
  return (
    <>
      <style>{`
        @keyframes sk-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        .dt-row:hover { background: #f8fafc !important; }
        .dt-page-btn:hover { background: #e2e8f0 !important; }
      `}</style>

      <div style={{
        background: '#ffffff',
        borderRadius: 20,
        border: '1px solid #f1f5f9',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        ...extraStyle,
      }}>
        {/* Scrollable table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            minWidth: 'max-content',
          }}>
            {/* Header */}
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                {columns.map((col) => (
                  <th key={col.key} style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#94a3b8',
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px',
                    whiteSpace: 'nowrap',
                    width: col.width,
                  }}>
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>

            {/* Body */}
            <tbody>
              {loading ? (
                Array.from({ length: skeletonRows }).map((_, i) => (
                  <SkeletonTableRow key={i} cols={columns.length} rowIndex={i} />
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} style={{ padding: 0 }}>
                    <EmptyState title={emptyTitle} message={emptyMessage} />
                  </td>
                </tr>
              ) : (
                data.map((row, rowIndex) => (
                  <DataRow
                    key={row[keyField] ?? rowIndex}
                    row={row}
                    columns={columns}
                    rowIndex={rowIndex}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && onPageChange && (
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        )}
      </div>
    </>
  )
}

function DataRow({ row, columns, rowIndex }) {
  const [hover, setHover] = useState(false)
  return (
    <tr
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        borderBottom: '1px solid #f8fafc',
        background: hover ? '#f8fafc' : '#ffffff',
        transition: 'background 0.12s ease',
        animation: `fadeInRow 0.2s ease ${rowIndex * 0.03}s both`,
      }}
    >
      <style>{`
        @keyframes fadeInRow {
          from { opacity: 0; transform: translateY(5px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      {columns.map((col) => (
        <td key={col.key} style={{
          padding: '12px 16px',
          fontSize: 13,
          color: '#334155',
          whiteSpace: 'nowrap',
        }}>
          {col.render
            ? col.render(row[col.key], row)
            : (row[col.key] ?? '—')}
        </td>
      ))}
    </tr>
  )
}

function Pagination({ page, totalPages, onPageChange }) {
  const pages = []
  let start = Math.max(1, page - 2)
  let end   = Math.min(totalPages, start + 4)
  start     = Math.max(1, end - 4)
  for (let p = start; p <= end; p++) pages.push(p)

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 16px',
      borderTop: '1px solid #f1f5f9',
      background: '#fafafa',
      flexWrap: 'wrap',
      gap: 8,
    }}>
      <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>
        Page {page} of {totalPages}
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <PageBtn
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          label="←"
        />
        {pages.map((p) => (
          <PageNumBtn
            key={p}
            p={p}
            active={p === page}
            onClick={() => onPageChange(p)}
          />
        ))}
        <PageBtn
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          label="→"
        />
      </div>
    </div>
  )
}

function PageBtn({ onClick, disabled, label }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: 30, height: 30,
        borderRadius: 8,
        border: '1px solid #e2e8f0',
        background: hover && !disabled ? '#e2e8f0' : '#fff',
        color: disabled ? '#cbd5e1' : '#334155',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: 13,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s ease',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {label}
    </button>
  )
}

function PageNumBtn({ p, active, onClick }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: 30, height: 30,
        borderRadius: 8,
        border: 'none',
        background: active
          ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
          : hover ? '#f1f5f9' : 'transparent',
        color: active ? '#fff' : '#334155',
        cursor: 'pointer',
        fontSize: 13,
        fontWeight: active ? 700 : 500,
        transition: 'all 0.15s ease',
        boxShadow: active ? '0 2px 8px rgba(99,102,241,0.35)' : 'none',
      }}
    >
      {p}
    </button>
  )
}