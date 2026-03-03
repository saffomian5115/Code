// ═══════════════════════════════════════════════
// Badge.jsx
// ═══════════════════════════════════════════════
const BADGE_COLORS = {
  blue:    'bg-blue-100 text-blue-700',
  green:   'bg-emerald-100 text-emerald-700',
  red:     'bg-red-100 text-red-700',
  orange:  'bg-orange-100 text-orange-700',
  purple:  'bg-purple-100 text-purple-700',
  slate:   'bg-slate-100 text-slate-600',
  yellow:  'bg-yellow-100 text-yellow-700',
  pink:    'bg-pink-100 text-pink-700',
}

export function Badge({ children, color = 'blue', dot = false, className = '' }) {
  return (
    <span className={`
      inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full
      text-xs font-semibold
      ${BADGE_COLORS[color] || BADGE_COLORS.blue}
      ${className}
    `}>
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full bg-current`} />
      )}
      {children}
    </span>
  )
}

// Status badge helper
export function StatusBadge({ status }) {
  const map = {
    active:     { color: 'green',  label: 'Active' },
    inactive:   { color: 'red',    label: 'Inactive' },
    enrolled:   { color: 'blue',   label: 'Enrolled' },
    completed:  { color: 'green',  label: 'Completed' },
    dropped:    { color: 'red',    label: 'Dropped' },
    pending:    { color: 'orange', label: 'Pending' },
    paid:       { color: 'green',  label: 'Paid' },
    unpaid:     { color: 'red',    label: 'Unpaid' },
    partial:    { color: 'orange', label: 'Partial' },
    overdue:    { color: 'red',    label: 'Overdue' },
    submitted:  { color: 'blue',   label: 'Submitted' },
    graded:     { color: 'green',  label: 'Graded' },
    late:       { color: 'orange', label: 'Late' },
    present:    { color: 'green',  label: 'Present' },
    absent:     { color: 'red',    label: 'Absent' },
    excused:    { color: 'yellow', label: 'Excused' },
    in_progress:{ color: 'blue',   label: 'In Progress' },
    urgent:     { color: 'red',    label: 'Urgent' },
    high:       { color: 'orange', label: 'High' },
    normal:     { color: 'blue',   label: 'Normal' },
    low:        { color: 'slate',  label: 'Low' },
    improving:  { color: 'green',  label: '↑ Improving' },
    stable:     { color: 'blue',   label: '→ Stable' },
    declining:  { color: 'red',    label: '↓ Declining' },
  }
  const cfg = map[status] || { color: 'slate', label: status }
  return <Badge color={cfg.color} dot>{cfg.label}</Badge>
}


// ═══════════════════════════════════════════════
// Spinner.jsx
// ═══════════════════════════════════════════════
import { Loader2 } from 'lucide-react'

const SPIN_SIZES = { sm: 16, md: 24, lg: 36, xl: 48 }

export function Spinner({ size = 'md', className = '' }) {
  return (
    <Loader2
      size={SPIN_SIZES[size] || 24}
      className={`animate-spin text-blue-600 ${className}`}
    />
  )
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" />
        <p className="text-slate-400 text-sm">Loading...</p>
      </div>
    </div>
  )
}


// ═══════════════════════════════════════════════
// PageHeader.jsx
// ═══════════════════════════════════════════════
export function PageHeader({ title, subtitle, action, breadcrumb }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        {breadcrumb && (
          <p className="text-xs text-slate-400 mb-1">{breadcrumb}</p>
        )}
        <h1 className="font-display font-bold text-2xl text-slate-800">{title}</h1>
        {subtitle && <p className="text-slate-400 text-sm mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="flex items-center gap-2 flex-shrink-0">{action}</div>}
    </div>
  )
}


// ═══════════════════════════════════════════════
// EmptyState.jsx
// ═══════════════════════════════════════════════
export function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {Icon && (
        <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
          <Icon size={24} className="text-slate-400" />
        </div>
      )}
      <p className="font-semibold text-slate-700 text-base">{title || 'No data found'}</p>
      {message && <p className="text-slate-400 text-sm mt-1 max-w-xs">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}


// ═══════════════════════════════════════════════
// ConfirmDialog.jsx
// ═══════════════════════════════════════════════
import Modal from './Modal'
import Button from './Button'
import { AlertTriangle, Trash2 } from 'lucide-react'

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
}) {
  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="flex flex-col items-center text-center py-2">
        <div className={`
          w-14 h-14 rounded-2xl flex items-center justify-center mb-4
          ${variant === 'danger' ? 'bg-red-100' : 'bg-orange-100'}
        `}>
          {variant === 'danger'
            ? <Trash2 size={24} className="text-red-500" />
            : <AlertTriangle size={24} className="text-orange-500" />
          }
        </div>
        <h3 className="font-display font-bold text-lg text-slate-800 mb-2">{title}</h3>
        {message && <p className="text-slate-500 text-sm leading-relaxed">{message}</p>}
      </div>
      <div className="flex gap-3 mt-6">
        <Button variant="outline" fullWidth onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button
          variant={variant === 'danger' ? 'danger' : 'warning'}
          fullWidth
          onClick={onConfirm}
          loading={loading}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}


// ═══════════════════════════════════════════════
// Pagination.jsx
// ═══════════════════════════════════════════════
import { ChevronLeft, ChevronRight } from 'lucide-react'

export function Pagination({ pagination, onPageChange }) {
  if (!pagination || pagination.total_pages <= 1) return null

  const { page, total_pages, total, per_page } = pagination
  const start = (page - 1) * per_page + 1
  const end   = Math.min(page * per_page, total)

  // Page number range
  const getPages = () => {
    const pages = []
    const delta = 1
    for (let i = Math.max(1, page - delta); i <= Math.min(total_pages, page + delta); i++) {
      pages.push(i)
    }
    return pages
  }

  return (
    <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
      <p className="text-sm text-slate-400">
        Showing <span className="text-slate-700 font-medium">{start}–{end}</span> of{' '}
        <span className="text-slate-700 font-medium">{total}</span> records
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={16} />
        </button>

        {page > 2 && (
          <>
            <button onClick={() => onPageChange(1)} className="w-8 h-8 rounded-lg text-sm text-slate-600 hover:bg-slate-100 transition-colors">1</button>
            {page > 3 && <span className="text-slate-300 text-sm px-1">…</span>}
          </>
        )}

        {getPages().map(p => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
              p === page
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {p}
          </button>
        ))}

        {page < total_pages - 1 && (
          <>
            {page < total_pages - 2 && <span className="text-slate-300 text-sm px-1">…</span>}
            <button onClick={() => onPageChange(total_pages)} className="w-8 h-8 rounded-lg text-sm text-slate-600 hover:bg-slate-100 transition-colors">{total_pages}</button>
          </>
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === total_pages}
          className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
