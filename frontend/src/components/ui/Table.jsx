import { EmptyState } from './index.jsx'
import { Database } from 'lucide-react'

/**
 * Reusable Table Component
 *
 * columns = [
 *   { key: 'name',  label: 'Full Name', render: (row) => <span>{row.name}</span> },
 *   { key: 'email', label: 'Email', className: 'hidden md:table-cell' },
 *   { key: 'actions', label: '', render: (row) => <Actions row={row} /> }
 * ]
 */
export default function Table({
  columns = [],
  data = [],
  loading = false,
  emptyTitle = 'No records found',
  emptyMessage = 'Try adjusting your search or filters.',
  rowKey = 'id',
  onRowClick,
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full text-sm">
        {/* Head */}
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`
                  text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide
                  whitespace-nowrap
                  ${col.className || ''}
                `}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>

        {/* Body */}
        <tbody className="divide-y divide-slate-100">
          {loading ? (
            // Skeleton rows
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="animate-pulse">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3">
                    <div className="h-4 bg-slate-200 rounded-lg w-full max-w-[160px]" />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>
                <EmptyState
                  icon={Database}
                  title={emptyTitle}
                  message={emptyMessage}
                />
              </td>
            </tr>
          ) : (
            data.map((row, idx) => (
              <tr
                key={row[rowKey] ?? idx}
                onClick={() => onRowClick?.(row)}
                className={`
                  bg-white transition-colors
                  ${onRowClick ? 'cursor-pointer hover:bg-blue-50/50' : 'hover:bg-slate-50/50'}
                `}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-4 py-3 text-slate-700 ${col.cellClassName || ''} ${col.className || ''}`}
                  >
                    {col.render ? col.render(row) : row[col.key] ?? '—'}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
