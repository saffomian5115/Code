// ═══════════════════════════════════════════════════════════════
//  ui/index.jsx  —  Neumorphic UI Component Library
//  Paste this file at:  frontend/src/components/ui/index.jsx
//  (REPLACE the existing file completely)
// ═══════════════════════════════════════════════════════════════

import { useRef, useEffect } from 'react'
import { Loader2, ChevronLeft, ChevronRight, AlertTriangle, Trash2, X } from 'lucide-react'

// ── 3D Tilt Hook ─────────────────────────────────────────────
export function use3DTilt(strength = 8) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const onMove = (e) => {
      const rect = el.getBoundingClientRect()
      const cx = rect.left + rect.width  / 2
      const cy = rect.top  + rect.height / 2
      const dx = (e.clientX - cx) / (rect.width  / 2)
      const dy = (e.clientY - cy) / (rect.height / 2)
      el.style.transform = `
        perspective(800px)
        rotateX(${-dy * strength}deg)
        rotateY(${dx * strength}deg)
        translateZ(6px)
      `
    }

    const onLeave = () => {
      el.style.transform =
        'perspective(800px) rotateX(0deg) rotateY(0deg) translateZ(0px)'
    }

    el.addEventListener('mousemove', onMove)
    el.addEventListener('mouseleave', onLeave)
    return () => {
      el.removeEventListener('mousemove', onMove)
      el.removeEventListener('mouseleave', onLeave)
    }
  }, [strength])

  return ref
}

// ═══════════════════════════════════════════════
// Button
// ═══════════════════════════════════════════════
export default function Button({
  children,
  variant = 'default',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  onClick,
  type = 'button',
  className = '',
  icon,
}) {
  const variantClass = {
    default: 'neu-btn',
    primary: 'neu-btn neu-btn-accent',
    danger:  'neu-btn neu-btn-danger',
    outline: 'neu-btn',
    warning: 'neu-btn',
    ghost:   'neu-btn',
  }[variant] || 'neu-btn'

  const sizeStyle = {
    sm: { padding: '0.55rem 1.1rem', fontSize: '0.8rem' },
    md: { padding: '0.85rem 1.75rem', fontSize: '0.9rem' },
    lg: { padding: '1rem 2.2rem', fontSize: '1rem' },
  }[size]

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${variantClass} ${fullWidth ? 'w-full' : ''} ${className}`}
      style={{
        ...sizeStyle,
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.22s cubic-bezier(0.4,0,0.2,1)',
      }}
    >
      {loading
        ? <Loader2 size={15} className="animate-spin" />
        : icon
          ? <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              {icon}{children}
            </span>
          : children
      }
    </button>
  )
}

export { Button }

// ═══════════════════════════════════════════════
// Modal
// ═══════════════════════════════════════════════
export function Modal({ open, onClose, children, size = 'md', title }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  const maxWidth = { sm: '380px', md: '480px', lg: '640px', xl: '780px' }[size] || '480px'

  return (
    <div className="neu-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="neu-modal" style={{ maxWidth }}>
        {/* Header */}
        {title && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.5rem 1.75rem 0',
          }}>
            <h2 style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 700,
              fontSize: '1.15rem',
              color: 'var(--neu-text-primary)',
              letterSpacing: '-0.02em',
            }}>
              {title}
            </h2>
            <button
              onClick={onClose}
              className="neu-btn-icon"
              style={{ width: '2rem', height: '2rem', borderRadius: '0.625rem' }}
            >
              <X size={15} />
            </button>
          </div>
        )}
        <div style={{ padding: '1.5rem 1.75rem' }}>
          {children}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════
// ConfirmDialog
// ═══════════════════════════════════════════════
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
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', paddingTop: '0.5rem' }}>
        <div style={{
          width: '3.5rem', height: '3.5rem',
          borderRadius: '1rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '1rem',
          background: variant === 'danger'
            ? 'linear-gradient(145deg,#fde8e8,#f9d4d4)'
            : 'linear-gradient(145deg,#fef3cd,#fde8a8)',
          boxShadow: variant === 'danger'
            ? '6px 6px 14px rgba(163,177,198,0.5), -4px -4px 10px rgba(255,255,255,0.9)'
            : '6px 6px 14px rgba(163,177,198,0.5), -4px -4px 10px rgba(255,255,255,0.9)',
        }}>
          {variant === 'danger'
            ? <Trash2 size={22} style={{ color: 'var(--neu-danger)' }} />
            : <AlertTriangle size={22} style={{ color: 'var(--neu-warning)' }} />
          }
        </div>
        <h3 className="neu-heading" style={{ fontSize: '1.05rem', marginBottom: '0.4rem' }}>{title}</h3>
        {message && (
          <p style={{ color: 'var(--neu-text-muted)', fontSize: '0.875rem', lineHeight: 1.5 }}>
            {message}
          </p>
        )}
      </div>
      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
        <Button fullWidth onClick={onClose} disabled={loading}>{cancelLabel}</Button>
        <Button
          fullWidth
          variant={variant === 'danger' ? 'danger' : 'warning'}
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
// Badge
// ═══════════════════════════════════════════════
const BADGE_STYLES = {
  blue:   { bg: 'rgba(91,138,240,0.12)',  color: '#4a7de0' },
  green:  { bg: 'rgba(62,207,142,0.12)', color: '#22a06b' },
  red:    { bg: 'rgba(242,107,107,0.12)',color: '#d94f4f' },
  orange: { bg: 'rgba(245,166,35,0.12)', color: '#c87d10' },
  purple: { bg: 'rgba(155,89,182,0.12)', color: '#7d3ec9' },
  slate:  { bg: 'rgba(100,116,139,0.1)', color: 'var(--neu-text-muted)' },
  yellow: { bg: 'rgba(234,179,8,0.12)',  color: '#a16207' },
  pink:   { bg: 'rgba(236,72,153,0.12)', color: '#be185d' },
}

export function Badge({ children, color = 'blue', dot = false, className = '' }) {
  const style = BADGE_STYLES[color] || BADGE_STYLES.blue
  return (
    <span
      className={`neu-badge ${className}`}
      style={{
        background: style.bg,
        color: style.color,
        boxShadow: 'none',
        border: `1px solid ${style.bg}`,
      }}
    >
      {dot && (
        <span style={{
          width: '6px', height: '6px',
          borderRadius: '50%',
          background: style.color,
          display: 'inline-block',
          flexShrink: 0,
        }} />
      )}
      {children}
    </span>
  )
}

export function StatusBadge({ status }) {
  const map = {
    active:      { color: 'green',  label: 'Active' },
    inactive:    { color: 'red',    label: 'Inactive' },
    enrolled:    { color: 'blue',   label: 'Enrolled' },
    completed:   { color: 'green',  label: 'Completed' },
    dropped:     { color: 'red',    label: 'Dropped' },
    pending:     { color: 'orange', label: 'Pending' },
    paid:        { color: 'green',  label: 'Paid' },
    unpaid:      { color: 'red',    label: 'Unpaid' },
    partial:     { color: 'orange', label: 'Partial' },
    overdue:     { color: 'red',    label: 'Overdue' },
    submitted:   { color: 'blue',   label: 'Submitted' },
    graded:      { color: 'green',  label: 'Graded' },
    late:        { color: 'orange', label: 'Late' },
    present:     { color: 'green',  label: 'Present' },
    absent:      { color: 'red',    label: 'Absent' },
    excused:     { color: 'yellow', label: 'Excused' },
    in_progress: { color: 'blue',   label: 'In Progress' },
    urgent:      { color: 'red',    label: 'Urgent' },
    high:        { color: 'orange', label: 'High' },
    normal:      { color: 'blue',   label: 'Normal' },
    low:         { color: 'slate',  label: 'Low' },
    improving:   { color: 'green',  label: '↑ Improving' },
    stable:      { color: 'blue',   label: '→ Stable' },
    declining:   { color: 'red',    label: '↓ Declining' },
  }
  const cfg = map[status] || { color: 'slate', label: status }
  return <Badge color={cfg.color} dot>{cfg.label}</Badge>
}

// ═══════════════════════════════════════════════
// Spinner / PageLoader
// ═══════════════════════════════════════════════
export function Spinner({ size = 'md', className = '' }) {
  const sizes = { sm: 16, md: 24, lg: 36, xl: 48 }
  return (
    <Loader2
      size={sizes[size] || 24}
      className={`animate-spin ${className}`}
      style={{ color: 'var(--neu-accent)' }}
    />
  )
}

export function PageLoader() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '16rem',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        {/* Neu spinner ring */}
        <div style={{
          width: '3rem', height: '3rem',
          borderRadius: '50%',
          boxShadow: 'var(--neu-raised-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--neu-surface)',
        }}>
          <Spinner size="md" />
        </div>
        <p style={{ color: 'var(--neu-text-muted)', fontSize: '0.85rem' }}>Loading...</p>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════
// PageHeader
// ═══════════════════════════════════════════════
export function PageHeader({ title, subtitle, action, breadcrumb }) {
  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '1rem',
      marginBottom: '1.75rem',
    }}>
      <div>
        {breadcrumb && (
          <p style={{
            fontSize: '0.75rem',
            color: 'var(--neu-text-ghost)',
            marginBottom: '0.25rem',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}>
            {breadcrumb}
          </p>
        )}
        <h1 className="neu-heading" style={{ fontSize: '1.6rem' }}>{title}</h1>
        {subtitle && (
          <p className="neu-subtext" style={{ marginTop: '0.25rem' }}>{subtitle}</p>
        )}
      </div>
      {action && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          {action}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════
// EmptyState
// ═══════════════════════════════════════════════
export function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '4rem 1rem',
      textAlign: 'center',
    }}>
      {Icon && (
        <div className="neu-card-sm" style={{
          width: '3.5rem', height: '3.5rem',
          borderRadius: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1rem',
        }}>
          <Icon size={22} style={{ color: 'var(--neu-text-ghost)' }} />
        </div>
      )}
      <p style={{
        fontFamily: "'Outfit', sans-serif",
        fontWeight: 600,
        fontSize: '0.95rem',
        color: 'var(--neu-text-secondary)',
      }}>
        {title || 'No data found'}
      </p>
      {message && (
        <p style={{
          color: 'var(--neu-text-muted)',
          fontSize: '0.85rem',
          marginTop: '0.35rem',
          maxWidth: '20rem',
        }}>
          {message}
        </p>
      )}
      {action && <div style={{ marginTop: '1rem' }}>{action}</div>}
    </div>
  )
}

// ═══════════════════════════════════════════════
// Pagination
// ═══════════════════════════════════════════════
export function Pagination({ pagination, onPageChange }) {
  if (!pagination || pagination.total_pages <= 1) return null

  const { page, total_pages, total, per_page } = pagination
  const start = (page - 1) * per_page + 1
  const end   = Math.min(page * per_page, total)

  const getPages = () => {
    const pages = []
    for (
      let i = Math.max(1, page - 1);
      i <= Math.min(total_pages, page + 1);
      i++
    ) pages.push(i)
    return pages
  }

  const btnBase = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '2rem',
    height: '2rem',
    borderRadius: '0.625rem',
    border: '1px solid var(--neu-border)',
    background: 'var(--neu-surface)',
    boxShadow: 'var(--neu-raised)',
    color: 'var(--neu-text-secondary)',
    fontSize: '0.8rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
  }

  const btnActive = {
    ...btnBase,
    background: 'linear-gradient(145deg, var(--neu-accent), var(--neu-accent-dark))',
    color: '#fff',
    boxShadow: '4px 4px 10px var(--neu-shadow-dark), -2px -2px 6px var(--neu-shadow-light), 0 2px 12px var(--neu-accent-glow)',
    border: 'none',
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: '1rem',
      paddingTop: '1rem',
      borderTop: '1px solid var(--neu-border-inner)',
    }}>
      <p style={{ fontSize: '0.8rem', color: 'var(--neu-text-muted)' }}>
        Showing{' '}
        <span style={{ color: 'var(--neu-text-primary)', fontWeight: 600 }}>{start}–{end}</span>
        {' '}of{' '}
        <span style={{ color: 'var(--neu-text-primary)', fontWeight: 600 }}>{total}</span>
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          style={{ ...btnBase, opacity: page === 1 ? 0.35 : 1 }}
        >
          <ChevronLeft size={14} />
        </button>

        {page > 2 && (
          <>
            <button onClick={() => onPageChange(1)} style={btnBase}>1</button>
            {page > 3 && <span style={{ color: 'var(--neu-text-ghost)', fontSize: '0.85rem', padding: '0 2px' }}>…</span>}
          </>
        )}

        {getPages().map(p => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            style={p === page ? btnActive : btnBase}
          >
            {p}
          </button>
        ))}

        {page < total_pages - 1 && (
          <>
            {page < total_pages - 2 && <span style={{ color: 'var(--neu-text-ghost)', fontSize: '0.85rem', padding: '0 2px' }}>…</span>}
            <button onClick={() => onPageChange(total_pages)} style={btnBase}>{total_pages}</button>
          </>
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === total_pages}
          style={{ ...btnBase, opacity: page === total_pages ? 0.35 : 1 }}
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════
// NeuInput — styled form field wrapper
// ═══════════════════════════════════════════════
export function NeuField({ label, required, children, error }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
      {label && (
        <label style={{
          fontSize: '0.78rem',
          fontWeight: 600,
          color: 'var(--neu-text-muted)',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}>
          {label}
          {required && <span style={{ color: 'var(--neu-danger)', marginLeft: '3px' }}>*</span>}
        </label>
      )}
      {children}
      {error && (
        <p style={{ fontSize: '0.78rem', color: 'var(--neu-danger)', marginTop: '2px' }}>
          {error}
        </p>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════
// NeuSelect — styled select dropdown
// ═══════════════════════════════════════════════
export function NeuSelect({ value, onChange, children, placeholder, style: extraStyle }) {
  return (
    <select
      value={value}
      onChange={onChange}
      className="neu-input-rect"
      style={{
        appearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%237a8699' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 1rem center',
        paddingRight: '2.5rem',
        cursor: 'pointer',
        ...extraStyle,
      }}
    >
      {placeholder && (
        <option value="">{placeholder}</option>
      )}
      {children}
    </select>
  )
}

// ═══════════════════════════════════════════════
// NeuTextarea
// ═══════════════════════════════════════════════
export function NeuTextarea({ value, onChange, placeholder, rows = 4, style: extraStyle }) {
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      className="neu-input-rect"
      style={{
        resize: 'vertical',
        borderRadius: '1rem',
        lineHeight: 1.6,
        ...extraStyle,
      }}
    />
  )
}

// ═══════════════════════════════════════════════
// StatCard — dashboard metric card
// ═══════════════════════════════════════════════
export function StatCard({ title, value, icon: Icon, color = 'blue', trend, trendLabel }) {
  const colors = {
    blue:   { bg: 'rgba(91,138,240,0.12)',  icon: '#4a7de0', glow: 'rgba(91,138,240,0.2)' },
    green:  { bg: 'rgba(62,207,142,0.12)', icon: '#22a06b', glow: 'rgba(62,207,142,0.2)' },
    orange: { bg: 'rgba(245,166,35,0.12)', icon: '#c87d10', glow: 'rgba(245,166,35,0.2)' },
    red:    { bg: 'rgba(242,107,107,0.12)',icon: '#d94f4f', glow: 'rgba(242,107,107,0.2)' },
    purple: { bg: 'rgba(155,89,182,0.12)', icon: '#7d3ec9', glow: 'rgba(155,89,182,0.2)' },
  }
  const c = colors[color] || colors.blue

  return (
    <div className="neu-stat-card" style={{ '--accent-glow': c.glow }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'var(--neu-text-muted)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            marginBottom: '0.5rem',
          }}>
            {title}
          </p>
          <p style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: '2rem',
            fontWeight: 800,
            color: 'var(--neu-text-primary)',
            letterSpacing: '-0.03em',
            lineHeight: 1,
          }}>
            {value}
          </p>
          {trend !== undefined && (
            <p style={{
              fontSize: '0.78rem',
              color: trend >= 0 ? 'var(--neu-success)' : 'var(--neu-danger)',
              marginTop: '0.5rem',
              fontWeight: 500,
            }}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
              {trendLabel && <span style={{ color: 'var(--neu-text-muted)', marginLeft: '4px' }}>{trendLabel}</span>}
            </p>
          )}
        </div>
        {Icon && (
          <div style={{
            width: '3rem', height: '3rem',
            borderRadius: '1rem',
            background: c.bg,
            boxShadow: `6px 6px 14px var(--neu-shadow-dark), -4px -4px 10px var(--neu-shadow-light), inset 0 1px 2px rgba(255,255,255,0.3)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Icon size={20} style={{ color: c.icon }} />
          </div>
        )}
      </div>
    </div>
  )
}