// ═══════════════════════════════════════════════════════════════
//  FeePage.jsx  (Student)  —  Neumorphic
//  → frontend/src/pages/student/FeePage.jsx
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect } from 'react'
import {
  CreditCard, CheckCircle2, AlertTriangle, Clock,
  Loader2, ChevronDown, ChevronUp, Receipt,
  DollarSign, Calendar, Hash, TrendingDown,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { studentAPI } from '../../api/student.api'
import { formatDate, formatCurrency } from '../../utils/helpers'

/* ─── helpers ────────────────────────────────────────────────── */
const neu = (extra = {}) => ({
  background: 'var(--neu-surface)',
  boxShadow: 'var(--neu-raised)',
  border: '1px solid var(--neu-border)',
  borderRadius: '1.25rem',
  ...extra,
})
const neuInset = (extra = {}) => ({
  background: 'var(--neu-surface-deep)',
  boxShadow: 'inset 4px 4px 10px var(--neu-shadow-dark), inset -3px -3px 7px var(--neu-shadow-light)',
  border: '1px solid var(--neu-border)',
  borderRadius: '0.875rem',
  ...extra,
})

/* ─── Status config ──────────────────────────────────────────── */
const STATUS_CFG = {
  paid:    { color: '#3ecf8e', bg: 'rgba(62,207,142,0.12)',  icon: CheckCircle2,   label: 'Paid'    },
  unpaid:  { color: '#5b8af0', bg: 'rgba(91,138,240,0.12)',  icon: Clock,          label: 'Unpaid'  },
  partial: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  icon: AlertTriangle,  label: 'Partial' },
  overdue: { color: '#f87171', bg: 'rgba(248,113,113,0.12)', icon: AlertTriangle,  label: 'Overdue' },
}
const sc = (s) => STATUS_CFG[s] || STATUS_CFG.unpaid

/* ─── Skeleton ───────────────────────────────────────────────── */
function Skeleton() {
  return (
    <div style={{ ...neu({ padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }) }}>
      {[100, 65, 80].map((w, i) => (
        <div key={i} style={{ height: 12, borderRadius: '0.5rem', background: 'var(--neu-surface-deep)', width: `${w}%`, animation: `pulse 1.5s ease-in-out ${i * 0.1}s infinite` }} />
      ))}
    </div>
  )
}

/* ─── Summary Stat ───────────────────────────────────────────── */
function SummaryCard({ icon: Icon, label, amount, color, sub }) {
  return (
    <div style={{ ...neu({ padding: '1.1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.9rem' }) }}>
      <div style={{
        ...neuInset({ width: 44, height: 44, borderRadius: '0.875rem', flexShrink: 0 }),
        display: 'flex', alignItems: 'center', justifyContent: 'center', color,
      }}>
        <Icon size={18} />
      </div>
      <div>
        <p style={{ fontSize: '1.35rem', fontWeight: 900, color, fontFamily: 'Outfit, sans-serif', lineHeight: 1 }}>
          {formatCurrency(amount)}
        </p>
        <p style={{ fontSize: '0.7rem', color: 'var(--neu-text-ghost)', fontWeight: 600, marginTop: '0.2rem' }}>{label}</p>
        {sub && <p style={{ fontSize: '0.65rem', color: 'var(--neu-text-ghost)', marginTop: '0.1rem' }}>{sub}</p>}
      </div>
    </div>
  )
}

/* ─── Voucher Card ───────────────────────────────────────────── */
function VoucherCard({ voucher: v, idx, expanded, onToggle }) {
  const cfg = sc(v.status)
  const StatusIcon = cfg.icon
  const isOverdue = v.status === 'overdue'
  const dueDate = v.due_date ? new Date(v.due_date) : null
  const isPast = dueDate && dueDate < new Date()

  return (
    <div style={{
      ...neu({ padding: '0' }),
      overflow: 'hidden',
      animation: `fadeUp 0.3s ease ${idx * 0.05}s both`,
      borderLeft: `3px solid ${cfg.color}`,
    }}>
      {/* Header row */}
      <div
        style={{ padding: '1rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.9rem', cursor: 'pointer' }}
        onClick={onToggle}
      >
        {/* Icon */}
        <div style={{
          ...neuInset({ width: 40, height: 40, borderRadius: '0.75rem', flexShrink: 0 }),
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: cfg.color,
        }}>
          <Receipt size={17} />
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <p style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--neu-text-primary)' }}>
              {v.semester_name || `Voucher #${v.voucher_number}`}
            </p>
            {isOverdue && (
              <span style={{ fontSize: '0.6rem', fontWeight: 800, padding: '0.15rem 0.45rem', borderRadius: '0.4rem', background: 'rgba(248,113,113,0.15)', color: '#f87171', animation: 'pulse 2s infinite' }}>
                OVERDUE
              </span>
            )}
          </div>
          <p style={{ fontSize: '0.7rem', color: 'var(--neu-text-ghost)', marginTop: '0.15rem' }}>
            #{v.voucher_number} · Due {dueDate ? formatDate(v.due_date) : '—'}
          </p>
        </div>

        {/* Amount + status */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <p style={{ fontWeight: 900, fontSize: '1rem', color: cfg.color, fontFamily: 'Outfit, sans-serif' }}>
            {formatCurrency(v.total_due || v.amount)}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', justifyContent: 'flex-end', marginTop: '0.2rem' }}>
            <StatusIcon size={11} style={{ color: cfg.color }} />
            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: cfg.color }}>{cfg.label}</span>
          </div>
        </div>

        {/* Expand */}
        <div style={{
          width: 28, height: 28, borderRadius: '0.5rem', flexShrink: 0,
          background: 'var(--neu-surface-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '2px 2px 6px var(--neu-shadow-dark), -1px -1px 3px var(--neu-shadow-light)',
          color: 'var(--neu-text-muted)',
        }}>
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </div>
      </div>

      {/* Expanded breakdown */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--neu-border)', padding: '1rem 1.2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

          {/* Fee breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
            {[
              { label: 'Base Amount', val: v.amount, color: '#5b8af0' },
              { label: 'Fine',        val: v.fine_amount, color: '#f87171' },
              { label: 'Total Due',   val: v.total_due, color: cfg.color },
              { label: 'Issue Date',  val: v.issue_date ? formatDate(v.issue_date) : '—', isText: true, color: 'var(--neu-text-secondary)' },
            ].map(({ label, val, color, isText }) => (
              <div key={label} style={{
                ...neuInset({ padding: '0.65rem 0.85rem', borderRadius: '0.75rem' }),
              }}>
                <p style={{ fontSize: '0.62rem', color: 'var(--neu-text-ghost)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>{label}</p>
                <p style={{ fontSize: '0.9rem', fontWeight: 800, color, fontFamily: 'Outfit, sans-serif' }}>
                  {isText ? val : formatCurrency(val || 0)}
                </p>
              </div>
            ))}
          </div>

          {/* Payment date if paid */}
          {v.status === 'paid' && v.payment_date && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.85rem', borderRadius: '0.75rem', background: 'rgba(62,207,142,0.08)', border: '1px solid rgba(62,207,142,0.2)' }}>
              <CheckCircle2 size={14} style={{ color: '#3ecf8e', flexShrink: 0 }} />
              <p style={{ fontSize: '0.75rem', color: '#3ecf8e', fontWeight: 600 }}>
                Paid on {formatDate(v.payment_date)}
              </p>
            </div>
          )}

          {/* Overdue warning */}
          {isOverdue && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.85rem', borderRadius: '0.75rem', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}>
              <AlertTriangle size={14} style={{ color: '#f87171', flexShrink: 0 }} />
              <p style={{ fontSize: '0.75rem', color: '#f87171', fontWeight: 600 }}>
                This voucher is overdue. Late fine may apply.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ─── Main Page ──────────────────────────────────────────────── */
export default function FeePage() {
  const [vouchers, setVouchers] = useState([])
  const [loading, setLoading]   = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [filter, setFilter]     = useState('all')

  useEffect(() => {
    studentAPI.getMyVouchers()
      .then(r => setVouchers(r.data.data?.vouchers || []))
      .catch(() => toast.error('Failed to load fee vouchers'))
      .finally(() => setLoading(false))
  }, [])

  const totalPaid    = vouchers.filter(v => v.status === 'paid').reduce((s, v) => s + parseFloat(v.total_due || v.amount || 0), 0)
  const totalDue     = vouchers.filter(v => v.status !== 'paid').reduce((s, v) => s + parseFloat(v.total_due || v.amount || 0), 0)
  const overdueCount = vouchers.filter(v => v.status === 'overdue').length

  const FILTERS = [
    { key: 'all',     label: 'All',     count: vouchers.length },
    { key: 'unpaid',  label: 'Unpaid',  count: vouchers.filter(v => v.status === 'unpaid').length },
    { key: 'paid',    label: 'Paid',    count: vouchers.filter(v => v.status === 'paid').length },
    { key: 'overdue', label: 'Overdue', count: vouchers.filter(v => v.status === 'overdue').length },
    { key: 'partial', label: 'Partial', count: vouchers.filter(v => v.status === 'partial').length },
  ]

  const filtered = filter === 'all' ? vouchers : vouchers.filter(v => v.status === filter)

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', paddingBottom: '2rem' }}>
      <style>{`
        @keyframes spin   { to { transform: rotate(360deg) } }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
        @keyframes pulse  { 0%,100%{opacity:.5} 50%{opacity:1} }
      `}</style>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div style={{ ...neuInset({ width: 44, height: 44, borderRadius: '0.875rem' }), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5b8af0' }}>
          <CreditCard size={20} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit, sans-serif' }}>
            Fee Management
          </h1>
          <p style={{ fontSize: '0.78rem', color: 'var(--neu-text-ghost)' }}>View and manage your fee vouchers</p>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[1, 2, 3].map(i => <Skeleton key={i} />)}
        </div>
      ) : (
        <>
          {/* ── Summary Cards ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem', marginBottom: '1.25rem' }}>
            <SummaryCard icon={CheckCircle2} label="Total Paid"    amount={totalPaid}    color="#3ecf8e" sub={`${vouchers.filter(v => v.status === 'paid').length} vouchers`} />
            <SummaryCard icon={TrendingDown} label="Outstanding"   amount={totalDue}     color={totalDue > 0 ? '#f87171' : '#3ecf8e'} sub={`${vouchers.filter(v => v.status !== 'paid').length} pending`} />
            {overdueCount > 0 && (
              <SummaryCard icon={AlertTriangle} label="Overdue"    amount={vouchers.filter(v => v.status === 'overdue').reduce((s, v) => s + parseFloat(v.total_due || 0), 0)} color="#f87171" sub={`${overdueCount} overdue vouchers`} />
            )}
          </div>

          {/* ── Filter tabs ── */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            {FILTERS.filter(f => f.count > 0 || f.key === 'all').map(f => {
              const active = filter === f.key
              const color = f.key === 'overdue' ? '#f87171' : f.key === 'paid' ? '#3ecf8e' : f.key === 'partial' ? '#f59e0b' : '#5b8af0'
              return (
                <button key={f.key} onClick={() => setFilter(f.key)}
                  style={{
                    padding: '0.45rem 1rem', borderRadius: '0.75rem', border: 'none', cursor: 'pointer',
                    fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '0.78rem',
                    background: active ? `${color}18` : 'var(--neu-surface)',
                    color: active ? color : 'var(--neu-text-muted)',
                    boxShadow: active
                      ? `4px 4px 10px var(--neu-shadow-dark), -2px -2px 6px var(--neu-shadow-light), inset 0 0 0 1px ${color}40`
                      : '3px 3px 8px var(--neu-shadow-dark), -2px -2px 5px var(--neu-shadow-light)',
                    transition: 'all 0.18s',
                  }}>
                  {f.label}
                  <span style={{ marginLeft: '0.35rem', opacity: 0.65 }}>({f.count})</span>
                </button>
              )
            })}
          </div>

          {/* ── Voucher list ── */}
          {filtered.length === 0 ? (
            <div style={{ ...neu({ padding: '4rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }) }}>
              <div style={{ ...neuInset({ width: 56, height: 56, borderRadius: '1rem' }), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5b8af0' }}>
                <Receipt size={24} />
              </div>
              <p style={{ fontWeight: 700, color: 'var(--neu-text-secondary)' }}>No vouchers found</p>
              <p style={{ fontSize: '0.78rem', color: 'var(--neu-text-ghost)' }}>No fee vouchers have been generated yet</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {filtered.map((v, idx) => (
                <VoucherCard
                  key={v.id}
                  voucher={v}
                  idx={idx}
                  expanded={expanded === v.id}
                  onToggle={() => setExpanded(expanded === v.id ? null : v.id)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}