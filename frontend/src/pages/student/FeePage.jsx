// ═══════════════════════════════════════════════════════════════
//  FeePage.jsx  (Student)  —  Enhanced with Charts & Animations
//  → frontend/src/pages/student/FeePage.jsx
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect, useRef } from 'react'
import {
  CreditCard, CheckCircle2, AlertTriangle, Clock,
  Loader2, ChevronDown, ChevronUp, Receipt,
  TrendingDown, TrendingUp, BarChart2, PieChart,
  Calendar, DollarSign, AlertCircle, ArrowRight,
} from 'lucide-react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid, Cell, PieChart as RechartPie,
  Pie, Legend,
} from 'recharts'
import toast from 'react-hot-toast'
import { studentAPI } from '../../api/student.api'
import { formatDate, formatCurrency } from '../../utils/helpers'
import { authStore } from '../../store/authStore'

/* ─── helpers ─────────────────────────────────────────────── */
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
  paid:    { color: '#3ecf8e', bg: 'rgba(62,207,142,0.12)',  icon: CheckCircle2,  label: 'Paid',    barColor: '#3ecf8e' },
  unpaid:  { color: '#5b8af0', bg: 'rgba(91,138,240,0.12)',  icon: Clock,         label: 'Unpaid',  barColor: '#5b8af0' },
  partial: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  icon: AlertTriangle, label: 'Partial', barColor: '#f59e0b' },
  overdue: { color: '#f87171', bg: 'rgba(248,113,113,0.12)', icon: AlertCircle,   label: 'Overdue', barColor: '#f87171' },
}
const sc = (s) => STATUS_CFG[s] || STATUS_CFG.unpaid

/* ─── Animated Counter ───────────────────────────────────────── */
function AnimatedNumber({ target, prefix = '', suffix = '', duration = 800 }) {
  const [current, setCurrent] = useState(0)
  const startRef = useRef(null)

  useEffect(() => {
    if (target === 0) { setCurrent(0); return }
    const start = Date.now()
    startRef.current = start
    const animate = () => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCurrent(Math.round(target * eased))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
    return () => { startRef.current = null }
  }, [target, duration])

  return <>{prefix}{current.toLocaleString('en-PK')}{suffix}</>
}

/* ─── Progress Ring ──────────────────────────────────────────── */
function ProgressRing({ pct = 0, color = '#5b8af0', size = 90, stroke = 8 }) {
  const r    = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--neu-border)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s cubic-bezier(0.34,1.56,0.64,1)' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '1.1rem', fontWeight: 900, color, fontFamily: 'Outfit, sans-serif', lineHeight: 1 }}>{Math.round(pct)}%</span>
        <span style={{ fontSize: '0.55rem', color: 'var(--neu-text-ghost)', fontWeight: 600 }}>PAID</span>
      </div>
    </div>
  )
}

/* ─── Summary KPI Card ───────────────────────────────────────── */
function SummaryCard({ icon: Icon, label, amount, color, sub, active, onClick }) {
  return (
    <div onClick={onClick}
      style={{
        ...neu({
          padding: '1.1rem 1.25rem',
          display: 'flex', alignItems: 'flex-start', gap: '0.85rem',
          cursor: onClick ? 'pointer' : 'default',
          borderLeft: active ? `3px solid ${color}` : '3px solid transparent',
          transition: 'all 0.25s ease',
          animation: 'fadeUp 0.35s ease both',
        }),
      }}
      onMouseEnter={e => { if (onClick) e.currentTarget.style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { if (onClick) e.currentTarget.style.transform = '' }}>
      <div style={{
        ...neuInset({ width: 44, height: 44, borderRadius: '0.875rem', flexShrink: 0 }),
        display: 'flex', alignItems: 'center', justifyContent: 'center', color,
      }}>
        <Icon size={18} />
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.2rem' }}>{label}</p>
        <p style={{ fontSize: '1.35rem', fontWeight: 900, color, fontFamily: 'Outfit, sans-serif', lineHeight: 1 }}>
          <AnimatedNumber target={amount} prefix="Rs " />
        </p>
        {sub && <p style={{ fontSize: '0.7rem', color: 'var(--neu-text-ghost)', marginTop: '0.25rem' }}>{sub}</p>}
      </div>
    </div>
  )
}

/* ─── Custom Tooltip ─────────────────────────────────────────── */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ ...neu({ padding: '0.75rem 1rem', borderRadius: '0.75rem' }), fontSize: '0.78rem' }}>
      <p style={{ fontWeight: 700, color: 'var(--neu-text-primary)', marginBottom: '0.35rem' }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: Rs {p.value?.toLocaleString('en-PK')}
        </p>
      ))}
    </div>
  )
}

/* ─── Voucher Card ───────────────────────────────────────────── */
function VoucherCard({ voucher: v, idx, expanded, onToggle }) {
  const cfg = sc(v.status)
  const StatusIcon = cfg.icon
  const dueDate = v.due_date ? new Date(v.due_date) : null
  const isPast = dueDate && dueDate < new Date()
  const daysOverdue = isPast && v.status === 'overdue'
    ? Math.floor((Date.now() - dueDate.getTime()) / 86400000)
    : 0
  const paidSoFar = v.status === 'paid' ? (v.total_due || v.amount) : (v.paid_so_far || 0)
  const pct = (v.total_due || v.amount) > 0 ? Math.min(100, Math.round((paidSoFar / (v.total_due || v.amount)) * 100)) : 0

  return (
    <div style={{
      ...neu({ padding: '0' }),
      overflow: 'hidden',
      animation: `fadeUp 0.3s ease ${idx * 0.07}s both`,
      borderLeft: `3px solid ${cfg.color}`,
      transition: 'all 0.2s ease',
    }}>
      {/* Header row */}
      <div style={{ padding: '1rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.9rem', cursor: 'pointer' }}
        onClick={onToggle}>
        <div style={{ ...neuInset({ width: 42, height: 42, borderRadius: '0.875rem', flexShrink: 0 }), display: 'flex', alignItems: 'center', justifyContent: 'center', color: cfg.color }}>
          <Receipt size={17} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <p style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--neu-text-primary)' }}>
              {v.semester_name || `Voucher #${v.voucher_number}`}
            </p>
            {daysOverdue > 0 && (
              <span style={{ fontSize: '0.58rem', fontWeight: 800, padding: '0.12rem 0.4rem', borderRadius: '0.35rem', background: 'rgba(248,113,113,0.15)', color: '#f87171', animation: 'pulse 2s infinite' }}>
                {daysOverdue}d OVERDUE
              </span>
            )}
          </div>
          <p style={{ fontSize: '0.7rem', color: 'var(--neu-text-ghost)', marginTop: '0.15rem' }}>
            #{v.voucher_number} · Due {dueDate ? formatDate(v.due_date) : '—'}
          </p>
          {/* Mini progress bar */}
          <div style={{ ...neuInset({ height: 5, borderRadius: 3, padding: '1px', marginTop: '0.5rem' }) }}>
            <div style={{
              height: '100%', borderRadius: 3,
              background: `linear-gradient(90deg, ${cfg.color}, ${cfg.color}aa)`,
              width: `${pct}%`,
              transition: 'width 0.8s cubic-bezier(0.34,1.56,0.64,1)',
              boxShadow: `0 0 4px ${cfg.color}55`,
            }} />
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <p style={{ fontWeight: 900, fontSize: '1.05rem', color: cfg.color, fontFamily: 'Outfit, sans-serif' }}>
            {formatCurrency(v.total_due || v.amount)}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
            <StatusIcon size={11} style={{ color: cfg.color }} />
            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: cfg.color }}>{cfg.label}</span>
          </div>
        </div>
        <div style={{ width: 28, height: 28, borderRadius: '0.5rem', flexShrink: 0, background: 'var(--neu-surface-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '2px 2px 6px var(--neu-shadow-dark), -1px -1px 3px var(--neu-shadow-light)', color: 'var(--neu-text-muted)', transition: 'transform 0.2s' }}>
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </div>
      </div>

      {/* Expanded breakdown */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--neu-border)', padding: '1rem 1.2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', animation: 'fadeUp 0.2s ease' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
            {[
              { label: 'Base Amount', val: formatCurrency(v.amount),                    color: '#5b8af0' },
              { label: 'Late Fine',   val: formatCurrency(v.fine_amount || 0),          color: (v.fine_amount || 0) > 0 ? '#f87171' : 'var(--neu-text-ghost)' },
              { label: 'Total Due',   val: formatCurrency(v.total_due || v.amount),     color: cfg.color },
              { label: 'Paid So Far', val: formatCurrency(paidSoFar),                  color: '#3ecf8e' },
              { label: 'Remaining',   val: formatCurrency((v.total_due || v.amount) - paidSoFar), color: (v.total_due || v.amount) - paidSoFar > 0 ? '#f59e0b' : '#3ecf8e' },
              { label: 'Issue Date',  val: v.issue_date ? formatDate(v.issue_date) : '—', color: 'var(--neu-text-secondary)', isText: true },
            ].map(({ label, val, color, isText }) => (
              <div key={label} style={{ ...neuInset({ padding: '0.65rem 0.85rem', borderRadius: '0.75rem' }) }}>
                <p style={{ fontSize: '0.62rem', color: 'var(--neu-text-ghost)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>{label}</p>
                <p style={{ fontSize: isText ? '0.8rem' : '0.92rem', fontWeight: 800, color, fontFamily: isText ? 'inherit' : 'Outfit, sans-serif' }}>{val}</p>
              </div>
            ))}
          </div>

          {v.status === 'paid' && v.payment_date && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.85rem', borderRadius: '0.75rem', background: 'rgba(62,207,142,0.08)', border: '1px solid rgba(62,207,142,0.2)' }}>
              <CheckCircle2 size={14} style={{ color: '#3ecf8e', flexShrink: 0 }} />
              <p style={{ fontSize: '0.75rem', color: '#3ecf8e', fontWeight: 600 }}>
                Paid on {formatDate(v.payment_date)}{v.payment_method ? ` via ${v.payment_method}` : ''}
              </p>
            </div>
          )}

          {v.status === 'overdue' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.85rem', borderRadius: '0.75rem', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}>
              <AlertCircle size={14} style={{ color: '#f87171', flexShrink: 0 }} />
              <p style={{ fontSize: '0.75rem', color: '#f87171', fontWeight: 600 }}>
                Overdue by {daysOverdue} day(s). Additional fine may apply.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════ */
export default function FeePage() {
  const user = authStore.getUser()
  const [vouchers, setVouchers]     = useState([])
  const [summary, setSummary]       = useState(null)
  const [loading, setLoading]       = useState(true)
  const [expanded, setExpanded]     = useState(null)
  const [filter, setFilter]         = useState('all')
  const [activeCard, setActiveCard] = useState(null)

  useEffect(() => {
    const fetchFeeData = async () => {
      try {
        const [voucherRes] = await Promise.all([
          studentAPI.getMyVouchers(),
        ])
        const data = voucherRes.data.data
        setVouchers(data?.vouchers || [])
        setSummary(data?.fee_summary || null)
      } catch {
        toast.error('Failed to load fee information')
      } finally {
        setLoading(false)
      }
    }
    fetchFeeData()
  }, [])

  // ── Derived values ──
  const allVouchers = vouchers
  const totalAmt    = summary?.total_fee || allVouchers.reduce((s, v) => s + parseFloat(v.amount || 0), 0)
  const totalFine   = summary?.total_fine || allVouchers.reduce((s, v) => s + parseFloat(v.fine_amount || 0), 0)
  const totalPaid   = summary?.total_paid || allVouchers.filter(v => v.status === 'paid').reduce((s, v) => s + parseFloat(v.total_due || v.amount || 0), 0)
  const totalDue    = summary?.total_due || allVouchers.filter(v => v.status !== 'paid').reduce((s, v) => s + parseFloat(v.total_due || v.amount || 0), 0)
  const paidPct     = (totalAmt + totalFine) > 0 ? Math.round((totalPaid / (totalAmt + totalFine)) * 100) : 0

  const paidCount    = allVouchers.filter(v => v.status === 'paid').length
  const unpaidCount  = allVouchers.filter(v => v.status === 'unpaid').length
  const overdueCount = allVouchers.filter(v => v.status === 'overdue').length
  const partialCount = allVouchers.filter(v => v.status === 'partial').length

  // ── Chart data ──
  const barData = allVouchers.map(v => ({
    name: v.semester_name?.replace('Semester', 'Sem') || v.voucher_number?.slice(-5) || '—',
    due:  parseFloat(v.total_due || v.amount || 0),
    paid: v.status === 'paid' ? parseFloat(v.total_due || v.amount || 0) : 0,
    fine: parseFloat(v.fine_amount || 0),
  }))

  const pieData = [
    { name: 'Paid',    value: totalPaid,        color: '#3ecf8e' },
    { name: 'Pending', value: Math.max(0, totalDue - totalFine), color: '#5b8af0' },
    { name: 'Fines',   value: totalFine,         color: '#f87171' },
  ].filter(d => d.value > 0)

  const FILTERS = [
    { key: 'all',     label: 'All',     count: allVouchers.length },
    { key: 'paid',    label: 'Paid',    count: paidCount },
    { key: 'unpaid',  label: 'Unpaid',  count: unpaidCount },
    { key: 'overdue', label: 'Overdue', count: overdueCount },
    { key: 'partial', label: 'Partial', count: partialCount },
  ]

  const filtered = filter === 'all' ? allVouchers : allVouchers.filter(v => v.status === filter)

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', gap: '0.75rem', flexDirection: 'column' }}>
      <Loader2 size={28} style={{ color: '#5b8af0', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ fontSize: '0.82rem', color: 'var(--neu-text-ghost)' }}>Loading fee data…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  return (
    <div style={{ maxWidth: 1050, margin: '0 auto', paddingBottom: '2rem' }}>
      <style>{`
        @keyframes spin   { to { transform: rotate(360deg) } }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
        @keyframes pulse  { 0%,100%{opacity:.5} 50%{opacity:1} }
        @keyframes slideIn { from{opacity:0;transform:translateX(-6px)} to{opacity:1;transform:none} }
      `}</style>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', animation: 'fadeUp 0.3s ease both' }}>
        <div style={{ ...neuInset({ width: 44, height: 44, borderRadius: '0.875rem' }), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5b8af0' }}>
          <CreditCard size={20} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit, sans-serif' }}>
            Fee Management
          </h1>
          <p style={{ fontSize: '0.78rem', color: 'var(--neu-text-ghost)' }}>
            {allVouchers.length} voucher(s) · All semesters overview
          </p>
        </div>
      </div>

      {/* ── Summary KPI Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem', marginBottom: '1.25rem' }}>
        <SummaryCard icon={BarChart2}    label="Total Fee"       amount={totalAmt + totalFine} color="#5b8af0" sub={`${allVouchers.length} vouchers`} active={activeCard==='total'} onClick={() => setActiveCard(p => p==='total' ? null : 'total')} />
        <SummaryCard icon={CheckCircle2} label="Total Paid"      amount={totalPaid}            color="#3ecf8e" sub={`${paidCount} cleared`}           active={activeCard==='paid'}  onClick={() => setActiveCard(p => p==='paid'  ? null : 'paid')} />
        <SummaryCard icon={TrendingDown} label="Outstanding"     amount={totalDue}             color={totalDue > 0 ? '#f87171' : '#3ecf8e'} sub={`${allVouchers.length - paidCount} remaining`} active={activeCard==='due'} onClick={() => setActiveCard(p => p==='due' ? null : 'due')} />
        <SummaryCard icon={AlertTriangle} label="Late Fines"     amount={totalFine}            color={totalFine > 0 ? '#f59e0b' : '#3ecf8e'} sub={`${overdueCount} overdue`} active={activeCard==='fine'} onClick={() => setActiveCard(p => p==='fine' ? null : 'fine')} />
      </div>

      {/* ── Payment Progress ── */}
      <div style={{ ...neu({ padding: '1.25rem 1.4rem', marginBottom: '1.25rem', animation: 'fadeUp 0.35s ease 0.1s both', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }) }}>
        <ProgressRing pct={paidPct} color={paidPct >= 100 ? '#3ecf8e' : paidPct >= 50 ? '#5b8af0' : '#f59e0b'} size={88} stroke={9} />
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--neu-text-primary)' }}>Payment Progress</p>
            <p style={{ fontSize: '0.78rem', color: 'var(--neu-text-ghost)' }}>
              {formatCurrency(totalPaid)} paid of {formatCurrency(totalAmt + totalFine)}
            </p>
          </div>
          <div style={{ ...neuInset({ height: 12, borderRadius: 6, padding: '2px' }) }}>
            <div style={{ height: '100%', borderRadius: 5, background: `linear-gradient(90deg, #3ecf8e, #5b8af0)`, width: `${paidPct}%`, transition: 'width 1.2s cubic-bezier(0.34,1.56,0.64,1)', boxShadow: '0 0 6px rgba(62,207,142,0.4)' }} />
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
            {[
              { label: 'Paid', count: paidCount,    color: '#3ecf8e' },
              { label: 'Unpaid', count: unpaidCount,  color: '#5b8af0' },
              { label: 'Overdue', count: overdueCount, color: '#f87171' },
              { label: 'Partial', count: partialCount, color: '#f59e0b' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color }} />
                <span style={{ fontSize: '0.72rem', color: 'var(--neu-text-ghost)' }}>{item.label}: <strong style={{ color: 'var(--neu-text-primary)' }}>{item.count}</strong></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Charts Row ── */}
      {allVouchers.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem', marginBottom: '1.25rem', animation: 'fadeUp 0.4s ease 0.15s both' }}>
          {/* Bar chart */}
          <div style={{ ...neu({ padding: '1.3rem' }) }}>
            <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--neu-text-primary)', marginBottom: '0.25rem' }}>Semester-wise Fee</p>
            <p style={{ fontSize: '0.72rem', color: 'var(--neu-text-ghost)', marginBottom: '1rem' }}>Dues vs payments per semester</p>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
              {[{ color: '#5b8af0', label: 'Total Due' }, { color: '#3ecf8e', label: 'Paid' }, { color: '#f87171', label: 'Fine' }].map(l => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: l.color }} />
                  <span style={{ fontSize: '0.68rem', color: 'var(--neu-text-ghost)' }}>{l.label}</span>
                </div>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} barSize={14} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--neu-border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: 'var(--neu-text-ghost)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => 'Rs ' + (v / 1000).toFixed(0) + 'k'} tick={{ fill: 'var(--neu-text-ghost)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="due"  name="Due"  fill="#5b8af0" radius={[3,3,0,0]} />
                <Bar dataKey="paid" name="Paid" fill="#3ecf8e" radius={[3,3,0,0]} />
                <Bar dataKey="fine" name="Fine" fill="#f87171" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie chart */}
          <div style={{ ...neu({ padding: '1.3rem', display: 'flex', flexDirection: 'column' }) }}>
            <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--neu-text-primary)', marginBottom: '0.25rem' }}>Fee Distribution</p>
            <p style={{ fontSize: '0.72rem', color: 'var(--neu-text-ghost)', marginBottom: '1rem' }}>Paid vs outstanding vs fines</p>
            {pieData.length > 0 ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <ResponsiveContainer width="100%" height={160}>
                  <RechartPie>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={72}
                      dataKey="value" paddingAngle={3} animationBegin={0} animationDuration={900}
                      label={({ name, percent }) => `${Math.round(percent * 100)}%`}
                      labelLine={false}>
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(val) => formatCurrency(val)} contentStyle={{ background: 'var(--neu-surface)', border: '1px solid var(--neu-border)', borderRadius: '0.75rem', fontSize: '0.75rem' }} />
                  </RechartPie>
                </ResponsiveContainer>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', width: '100%', marginTop: '0.5rem' }}>
                  {pieData.map(d => (
                    <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                      <span style={{ fontSize: '0.72rem', color: 'var(--neu-text-secondary)', flex: 1 }}>{d.name}</span>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--neu-text-primary)' }}>{formatCurrency(d.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--neu-text-ghost)', fontSize: '0.8rem' }}>
                No data available
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Voucher List ── */}
      <div style={{ animation: 'fadeUp 0.4s ease 0.2s both' }}>
        {/* Filter tabs */}
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
                {f.label} <span style={{ opacity: 0.65 }}>({f.count})</span>
              </button>
            )
          })}
        </div>

        {/* Vouchers */}
        {filtered.length === 0 ? (
          <div style={{ ...neu({ padding: '4rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }) }}>
            <div style={{ ...neuInset({ width: 56, height: 56, borderRadius: '1rem' }), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5b8af0' }}>
              <Receipt size={24} />
            </div>
            <p style={{ fontWeight: 700, color: 'var(--neu-text-secondary)' }}>
              {filter === 'all' ? 'No fee vouchers generated yet' : `No ${filter} vouchers`}
            </p>
            <p style={{ fontSize: '0.78rem', color: 'var(--neu-text-ghost)' }}>
              {filter === 'all' ? 'Your vouchers will appear here once generated by admin' : 'Try a different filter'}
            </p>
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
      </div>
    </div>
  )
}