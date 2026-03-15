// ═══════════════════════════════════════════════════════════════
//  FeeVouchersPage.jsx  —  frontend/src/pages/admin/FeeVouchersPage.jsx
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  CreditCard, Search, Loader2, X, Plus, DollarSign,
  ChevronLeft, ChevronRight, AlertTriangle, CheckCircle2,
  Clock, Eye, Layers, RefreshCw, Banknote, Smartphone,
  Building2, BookCheck,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { adminAPI } from '../../api/admin.api'
import { formatDate, formatCurrency } from '../../utils/helpers'
import { useContextMenu, ContextMenu } from '../../hooks/useContextMenu'

/* ═══════════════════════════════════════════════════
   CSS
═══════════════════════════════════════════════════ */
const CSS = `
  @keyframes spin    { to { transform: rotate(360deg) } }
  @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.45} }
  @keyframes neu-slide-up { from{opacity:0;transform:translateY(14px) scale(.97)} to{opacity:1;transform:none} }

  .vchr-row {
    display: grid;
    grid-template-columns: 130px 2fr 90px 70px 100px 90px;
    align-items: center;
    gap: .5rem;
    padding: .75rem 1rem;
    border-radius: .85rem;
    border: 1px solid transparent;
    border-left: 3px solid transparent;
    transition: background .14s, border-color .14s, transform .18s;
    cursor: pointer;
    user-select: none;
  }
  .vchr-row:hover { background: var(--neu-surface-deep); border-color: var(--neu-border); transform: translateX(3px); }
  .vchr-row.st-paid    { border-left-color: #22a06b !important; }
  .vchr-row.st-unpaid  { border-left-color: #ef4444 !important; }
  .vchr-row.st-overdue { border-left-color: #f97316 !important; }
  .vchr-row.st-partial { border-left-color: #5b8af0 !important; }

  .vchr-header {
    display: grid;
    grid-template-columns: 130px 2fr 90px 70px 100px 90px;
    gap: .5rem;
    padding: .25rem 1rem;
    font-size: .6rem; font-weight: 700;
    text-transform: uppercase; letter-spacing: .07em;
    color: var(--neu-text-ghost);
  }

  /* ── Deck-style filter rail (sidebar theme) ── */
  .filter-deck {
    display: flex;
    flex-direction: column;
    gap: .3rem;
    padding: .4rem;
    background: var(--neu-surface);
    border: 1px solid var(--neu-border);
    border-radius: 1rem;
    box-shadow: 4px 4px 12px var(--neu-shadow-dark), -2px -2px 8px var(--neu-shadow-light);
  }
  .deck-btn {
    width: 38px; height: 38px;
    border-radius: .7rem;
    border: 1.5px solid transparent;
    background: none;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    transition: all .16s ease;
    position: relative;
    flex-shrink: 0;
  }
  .deck-btn:hover   { background: var(--neu-surface-deep); border-color: var(--neu-border); }
  .deck-btn.d-act   { border-color: currentColor; }
  .deck-btn.d-all.d-act   { background: rgba(91,138,240,.13); color: #5b8af0; }
  .deck-btn.d-paid.d-act  { background: rgba(34,160,107,.13); color: #22a06b; }
  .deck-btn.d-unpaid.d-act{ background: rgba(239,68,68,.13);  color: #ef4444; }
  .deck-btn.d-overdue.d-act{ background: rgba(249,115,22,.13);color: #f97316; }
  .deck-btn.d-partial.d-act{ background: rgba(91,138,240,.1); color: #5b8af0; }

  .deck-tip {
    position: fixed;
    background: var(--neu-surface);
    border: 1px solid var(--neu-border);
    box-shadow: 4px 4px 12px var(--neu-shadow-dark), -2px -2px 6px var(--neu-shadow-light);
    color: var(--neu-text-primary);
    font-size: .72rem; font-weight: 700;
    padding: .28rem .7rem;
    border-radius: .5rem;
    white-space: nowrap;
    pointer-events: none;
    z-index: 99999;
    animation: neu-slide-up .1s ease both;
  }

  .pg-btn {
    width: 30px; height: 30px; border-radius: .55rem;
    border: 1.5px solid var(--neu-border);
    background: var(--neu-surface-deep);
    font-size: .75rem; font-weight: 700; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    color: var(--neu-text-muted);
    box-shadow: 3px 3px 7px var(--neu-shadow-dark), -1px -1px 4px var(--neu-shadow-light);
    transition: all .14s;
  }
  .pg-btn.active { background: #5b8af0; border-color: #5b8af0; color: #fff; }
  .pg-btn:disabled { opacity: .35; cursor: not-allowed; }
`

/* ═══════════════════════════════════════════════════
   HELPERS / SHARED
═══════════════════════════════════════════════════ */
const iS = {
  background: 'var(--neu-surface-deep)',
  boxShadow: 'inset 3px 3px 7px var(--neu-shadow-dark), inset -2px -2px 5px var(--neu-shadow-light)',
  border: '1px solid var(--neu-border)', borderRadius: '.75rem',
  padding: '.6rem .9rem', fontSize: '.85rem', color: 'var(--neu-text-primary)',
  outline: 'none', fontFamily: "'DM Sans',sans-serif", width: '100%',
}

const F = ({ label, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '.3rem' }}>
    <label style={{ fontSize: '.68rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{label}</label>
    {children}
  </div>
)

const STATUS_CFG = {
  paid:    { c: '#22a06b', bg: 'rgba(34,160,107,.1)',  Icon: CheckCircle2,  label: 'Paid'    },
  unpaid:  { c: '#ef4444', bg: 'rgba(239,68,68,.1)',   Icon: Clock,         label: 'Unpaid'  },
  overdue: { c: '#f97316', bg: 'rgba(249,115,22,.1)',  Icon: AlertTriangle, label: 'Overdue' },
  partial: { c: '#5b8af0', bg: 'rgba(91,138,240,.1)',  Icon: Clock,         label: 'Partial' },
}

// fields visible per payment method
const METHOD_FIELDS = {
  cash:          { ref: false, bank: false, receipt: true  },
  bank_transfer: { ref: true,  bank: true,  receipt: true  },
  online:        { ref: true,  bank: true,  receipt: true  },
  cheque:        { ref: true,  bank: true,  receipt: true  },
}

/* ═══════════════════════════════════════════════════
   MODAL SHELL
═══════════════════════════════════════════════════ */
function Modal({ children, maxW = 480, onClose }) {
  return (
    <div onClick={e => e.target === e.currentTarget && onClose?.()}
      style={{ position: 'fixed', inset: 0, background: 'rgba(8,12,20,.72)', backdropFilter: 'blur(10px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: maxW, background: 'var(--neu-surface)', boxShadow: '14px 14px 36px var(--neu-shadow-dark), -6px -6px 20px var(--neu-shadow-light)', border: '1px solid var(--neu-border)', borderRadius: '1.5rem', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'neu-slide-up .2s cubic-bezier(.34,1.56,.64,1) both' }}>
        {children}
      </div>
    </div>
  )
}

function MHead({ icon: Icon, title, sub, onClose, iconColor = '#22a06b' }) {
  return (
    <div style={{ padding: '1.1rem 1.4rem', borderBottom: '1px solid var(--neu-border)', display: 'flex', alignItems: 'center', gap: '.75rem', flexShrink: 0 }}>
      <div style={{ width: 36, height: 36, borderRadius: '.65rem', background: `${iconColor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={16} style={{ color: iconColor }} />
      </div>
      <div style={{ flex: 1 }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif' }}>{title}</h2>
        {sub && <p style={{ fontSize: '.72rem', color: 'var(--neu-text-ghost)', marginTop: '.1rem' }}>{sub}</p>}
      </div>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neu-text-ghost)', padding: '.2rem' }}>
        <X size={17} />
      </button>
    </div>
  )
}

function MFoot({ onClose, onConfirm, confirmLabel, confirmColor = 'linear-gradient(145deg,#22a06b,#1a7d54)', loading }) {
  return (
    <div style={{ padding: '.9rem 1.4rem', borderTop: '1px solid var(--neu-border)', display: 'flex', gap: '.6rem', flexShrink: 0 }}>
      <button onClick={onClose} style={{ ...iS, cursor: 'pointer', textAlign: 'center', fontWeight: 600, color: 'var(--neu-text-secondary)', flex: 1, padding: '.65rem', boxShadow: 'none' }}>Cancel</button>
      {onConfirm && (
        <button onClick={onConfirm} disabled={loading} style={{ flex: 1, padding: '.65rem', borderRadius: '.75rem', border: 'none', background: confirmColor, color: '#fff', fontWeight: 700, fontSize: '.85rem', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? .7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.4rem', fontFamily: "'DM Sans',sans-serif" }}>
          {loading && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}{confirmLabel}
        </button>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   DECK FILTER (sidebar-style icon rail)
═══════════════════════════════════════════════════ */
const DECK_ITEMS = [
  { key: '',        label: 'All',     Icon: Layers,        cls: 'd-all',     color: '#5b8af0' },
  { key: 'paid',    label: 'Paid',    Icon: CheckCircle2,  cls: 'd-paid',    color: '#22a06b' },
  { key: 'unpaid',  label: 'Unpaid',  Icon: Clock,         cls: 'd-unpaid',  color: '#ef4444' },
  { key: 'overdue', label: 'Overdue', Icon: AlertTriangle, cls: 'd-overdue', color: '#f97316' },
  { key: 'partial', label: 'Partial', Icon: BookCheck,     cls: 'd-partial', color: '#5b8af0' },
]

function DeckFilter({ active, onChange, counts, total }) {
  const [tip, setTip] = useState(null) // { label, x, y }

  const handleEnter = (e, label) => {
    const r = e.currentTarget.getBoundingClientRect()
    setTip({ label, x: r.right + 10, y: r.top + r.height / 2 })
  }

  const getCount = (key) => {
    if (key === '') return total
    return counts[key] ?? 0
  }

  return (
    <>
      <div className="filter-deck">
        {DECK_ITEMS.map(({ key, label, Icon, cls, color }) => (
          <button
            key={key}
            className={`deck-btn ${cls}${active === key ? ' d-act' : ''}`}
            style={{ color: active === key ? color : 'var(--neu-text-ghost)' }}
            onClick={() => onChange(key)}
            onMouseEnter={e => handleEnter(e, `${label} (${getCount(key)})`)}
            onMouseLeave={() => setTip(null)}
          >
            <Icon size={16} />
            {active === key && (
              <span style={{
                position: 'absolute', top: 2, right: 3,
                width: 7, height: 7, borderRadius: '50%',
                background: color,
                boxShadow: `0 0 4px ${color}`,
              }} />
            )}
          </button>
        ))}
      </div>
      {tip && createPortal(
        <div className="deck-tip" style={{ top: tip.y, left: tip.x, transform: 'translateY(-50%)' }}>
          {tip.label}
        </div>,
        document.body
      )}
    </>
  )
}

/* ═══════════════════════════════════════════════════
   VIEW MODAL
═══════════════════════════════════════════════════ */
function ViewModal({ voucher: v, onClose, onPay }) {
  const sc   = STATUS_CFG[v.status] || STATUS_CFG.unpaid
  const tile = { background: 'var(--neu-surface-deep)', borderRadius: '.8rem', padding: '.7rem 1rem', boxShadow: 'inset 2px 2px 5px var(--neu-shadow-dark), inset -1px -1px 4px var(--neu-shadow-light)' }
  const pct  = v.total_due > 0 ? Math.min(((v.total_paid || 0) / v.total_due) * 100, 100) : 0

  return (
    <Modal onClose={onClose}>
      <MHead icon={sc.Icon} title="Voucher Detail" sub={v.voucher_number} onClose={onClose} iconColor={sc.c} />
      <div style={{ padding: '1rem 1.4rem', display: 'flex', flexDirection: 'column', gap: '.55rem', overflowY: 'auto' }}>

        {/* Student */}
        <div style={tile}>
          <p style={{ fontSize: '.62rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.25rem' }}>Student</p>
          <p style={{ fontSize: '.9rem', fontWeight: 700, color: 'var(--neu-text-primary)' }}>{v.student_name}</p>
          <p style={{ fontSize: '.7rem', color: 'var(--neu-text-ghost)', fontFamily: 'monospace' }}>{v.roll_number}</p>
        </div>

        {/* Amount tiles */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '.5rem' }}>
          {[
            { label: 'Base Amount', value: formatCurrency(v.amount),       c: '#5b8af0' },
            { label: 'Fine',        value: v.fine_amount > 0 ? formatCurrency(v.fine_amount) : '—', c: '#f97316' },
            { label: 'Total Due',   value: formatCurrency(v.total_due),    c: '#ef4444' },
          ].map(t => (
            <div key={t.label} style={{ ...tile, textAlign: 'center' }}>
              <p style={{ fontSize: '.6rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '.2rem' }}>{t.label}</p>
              <p style={{ fontSize: '.92rem', fontWeight: 800, color: t.c, fontFamily: 'Outfit,sans-serif' }}>{t.value}</p>
            </div>
          ))}
        </div>

        {/* Progress */}
        <div style={tile}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.4rem', fontSize: '.78rem' }}>
            <span style={{ color: 'var(--neu-text-muted)' }}>Payment Progress</span>
            <span style={{ fontWeight: 700, color: sc.c }}>{pct.toFixed(0)}%</span>
          </div>
          <div style={{ height: 7, background: 'var(--neu-surface)', borderRadius: 99, overflow: 'hidden', boxShadow: 'inset 1px 1px 3px var(--neu-shadow-dark)' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: sc.c, borderRadius: 99, transition: 'width .4s ease' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '.35rem', fontSize: '.7rem' }}>
            <span style={{ color: '#22a06b', fontWeight: 600 }}>Paid: {formatCurrency(v.total_paid || 0)}</span>
            <span style={{ color: '#ef4444', fontWeight: 600 }}>Remaining: {formatCurrency((v.total_due || 0) - (v.total_paid || 0))}</span>
          </div>
        </div>

        {/* Due date + Status */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem' }}>
          <div style={tile}>
            <p style={{ fontSize: '.6rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '.2rem' }}>Due Date</p>
            <p style={{ fontSize: '.82rem', fontWeight: 700, color: new Date(v.due_date) < new Date() && v.status !== 'paid' ? '#ef4444' : 'var(--neu-text-primary)' }}>{formatDate(v.due_date)}</p>
          </div>
          <div style={{ ...tile, display: 'flex', alignItems: 'center', gap: '.5rem' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: sc.c, flexShrink: 0 }} />
            <span style={{ fontSize: '.82rem', fontWeight: 700, color: sc.c, textTransform: 'capitalize' }}>{v.status}</span>
          </div>
        </div>

        {/* Fee breakdown */}
        {(v.tuition_fee || v.admission_fee || v.library_fee) && (
          <div style={tile}>
            <p style={{ fontSize: '.62rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.4rem' }}>Fee Breakdown</p>
            {[
              { label: 'Tuition',   val: v.tuition_fee   },
              { label: 'Admission', val: v.admission_fee },
              { label: 'Library',   val: v.library_fee   },
              { label: 'Sports',    val: v.sports_fee    },
            ].filter(f => f.val > 0).map(f => (
              <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.78rem', marginBottom: '.2rem' }}>
                <span style={{ color: 'var(--neu-text-muted)' }}>{f.label} Fee</span>
                <span style={{ fontWeight: 700, color: 'var(--neu-text-primary)' }}>{formatCurrency(f.val)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: '.9rem 1.4rem', borderTop: '1px solid var(--neu-border)', display: 'flex', gap: '.6rem', flexShrink: 0 }}>
        <button onClick={onClose} style={{ ...iS, cursor: 'pointer', textAlign: 'center', fontWeight: 600, color: 'var(--neu-text-secondary)', flex: 1, padding: '.65rem', boxShadow: 'none' }}>Close</button>
        {v.status !== 'paid' && (
          <button onClick={() => { onClose(); onPay(v) }} style={{ flex: 1, padding: '.65rem', borderRadius: '.75rem', border: 'none', background: 'linear-gradient(145deg,#22a06b,#1a7d54)', color: '#fff', fontWeight: 700, fontSize: '.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.45rem', fontFamily: "'DM Sans',sans-serif" }}>
            <DollarSign size={14} /> Record Payment
          </button>
        )}
      </div>
    </Modal>
  )
}

/* ═══════════════════════════════════════════════════
   PAY MODAL  — fields change per method
═══════════════════════════════════════════════════ */
function PayModal({ voucher: v, onClose, onSuccess }) {
  const remaining = Math.max((v.total_due || 0) - (v.total_paid || 0), 0)
  const [form, setForm] = useState({
    amount_paid:      remaining > 0 ? remaining : v.total_due,
    payment_method:   'bank_transfer',
    reference_number: '',
    bank_name:        '',
    receipt_number:   '',
    payment_date:     new Date().toISOString().split('T')[0],
  })
  const [loading, setLoading] = useState(false)
  const set = (k, val) => setForm(p => ({ ...p, [k]: val }))

  const fields = METHOD_FIELDS[form.payment_method] || METHOD_FIELDS.bank_transfer

  // method label map for placeholders
  const methodMeta = {
    cash:          { refLabel: null,                    bankLabel: null,              icon: Banknote    },
    bank_transfer: { refLabel: 'Transaction ID',        bankLabel: 'Bank Name',       icon: Building2   },
    online:        { refLabel: 'Transaction / Ref No',  bankLabel: 'Platform (e.g. JazzCash)', icon: Smartphone },
    cheque:        { refLabel: 'Cheque Number',         bankLabel: 'Bank Name',       icon: BookCheck   },
  }
  const meta = methodMeta[form.payment_method]

  const submit = async () => {
    if (!form.amount_paid || parseFloat(form.amount_paid) <= 0) {
      return toast.error('Enter a valid amount')
    }
    if (fields.ref && !form.reference_number.trim()) {
      return toast.error(`${meta.refLabel} is required`)
    }
    setLoading(true)
    try {
      await adminAPI.payVoucher(v.id, form)
      toast.success('Payment recorded!')
      onSuccess()
      onClose()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to record payment')
    } finally { setLoading(false) }
  }

  return (
    <Modal onClose={onClose} maxW={460}>
      <MHead icon={DollarSign} title="Record Payment" sub={v.voucher_number} onClose={onClose} iconColor="#22a06b" />
      <div style={{ padding: '1.1rem 1.4rem', display: 'flex', flexDirection: 'column', gap: '.8rem', overflowY: 'auto' }}>

        {/* Summary bar */}
        <div style={{ padding: '.8rem 1rem', borderRadius: '.9rem', background: 'rgba(91,138,240,.07)', border: '1px solid rgba(91,138,240,.18)', display: 'flex', flexDirection: 'column', gap: '.25rem' }}>
          {[
            { l: 'Total Due',     v: formatCurrency(v.total_due),       bold: false },
            { l: 'Already Paid',  v: formatCurrency(v.total_paid || 0), bold: false, green: true },
            { l: 'Remaining',     v: formatCurrency(remaining),         bold: true,  red: true   },
          ].map(r => (
            <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: r.bold ? '.85rem' : '.78rem', borderTop: r.bold ? '1px solid rgba(91,138,240,.18)' : 'none', paddingTop: r.bold ? '.25rem' : 0 }}>
              <span style={{ color: 'var(--neu-text-muted)', fontWeight: r.bold ? 700 : 400 }}>{r.l}</span>
              <span style={{ fontWeight: r.bold ? 800 : 600, color: r.red ? '#ef4444' : r.green ? '#22a06b' : 'var(--neu-text-primary)', fontFamily: r.bold ? 'Outfit,sans-serif' : 'inherit' }}>{r.v}</span>
            </div>
          ))}
        </div>

        {/* Amount + Method */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
          <F label="Amount *">
            <input style={iS} type="number" min="1" value={form.amount_paid}
              onChange={e => set('amount_paid', e.target.value)} placeholder="0" />
          </F>
          <F label="Payment Method">
            <select style={iS} value={form.payment_method} onChange={e => set('payment_method', e.target.value)}>
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="online">Online</option>
              <option value="cheque">Cheque</option>
            </select>
          </F>
        </div>

        {/* Conditional fields */}
        {fields.ref && (
          <F label={`${meta.refLabel} *`}>
            <input style={iS} value={form.reference_number}
              onChange={e => set('reference_number', e.target.value)}
              placeholder={form.payment_method === 'cheque' ? 'e.g. CHQ-00123' : 'e.g. TXN-2025-001'} />
          </F>
        )}

        {fields.bank && (
          <F label={meta.bankLabel}>
            <input style={iS} value={form.bank_name}
              onChange={e => set('bank_name', e.target.value)}
              placeholder={form.payment_method === 'online' ? 'e.g. JazzCash' : 'e.g. HBL'} />
          </F>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
          {fields.receipt && (
            <F label="Receipt Number">
              <input style={iS} value={form.receipt_number}
                onChange={e => set('receipt_number', e.target.value)} placeholder="RCP-001" />
            </F>
          )}
          <F label="Payment Date">
            <input style={iS} type="date" value={form.payment_date}
              onChange={e => set('payment_date', e.target.value)} />
          </F>
        </div>

      </div>
      <MFoot onClose={onClose} onConfirm={submit} confirmLabel="Record Payment" loading={loading} />
    </Modal>
  )
}

/* ═══════════════════════════════════════════════════
   GENERATE VOUCHER MODAL
═══════════════════════════════════════════════════ */
function GenerateModal({ onClose, onSuccess }) {
  const [students,    setStudents]    = useState([])
  const [semesters,   setSemesters]   = useState([])
  const [form,        setForm]        = useState({
    student_id: '', semester_id: '',
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  })
  const [loading,     setLoading]     = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  useEffect(() => {
    Promise.all([adminAPI.getStudents(1, 500), adminAPI.getSemesters()])
      .then(([s, sem]) => {
        setStudents(s.data.data?.students || [])
        setSemesters(sem.data.data?.semesters || [])
      })
      .finally(() => setLoadingData(false))
  }, [])

  const submit = async () => {
    if (!form.student_id || !form.semester_id || !form.due_date) {
      return toast.error('All fields are required')
    }
    setLoading(true)
    try {
      await adminAPI.createVoucher(form)
      toast.success('Voucher generated!')
      onSuccess()
      onClose()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed')
    } finally { setLoading(false) }
  }

  return (
    <Modal onClose={onClose} maxW={420}>
      <MHead icon={Plus} title="Generate Voucher" onClose={onClose} iconColor="#5b8af0" />
      <div style={{ padding: '1.1rem 1.4rem', display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
        {loadingData ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
            <Loader2 size={24} style={{ color: '#5b8af0', animation: 'spin 1s linear infinite' }} />
          </div>
        ) : (
          <>
            <F label="Student *">
              <select style={iS} value={form.student_id} onChange={e => set('student_id', e.target.value)}>
                <option value="">— Select Student —</option>
                {students.map(s => <option key={s.user_id} value={s.user_id}>{s.full_name} ({s.roll_number})</option>)}
              </select>
            </F>
            <F label="Semester *">
              <select style={iS} value={form.semester_id} onChange={e => set('semester_id', e.target.value)}>
                <option value="">— Select Semester —</option>
                {semesters.map(s => <option key={s.id} value={s.id}>{s.name}{s.is_active ? ' ★' : ''}</option>)}
              </select>
            </F>
            <F label="Due Date *">
              <input style={iS} type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} />
            </F>
          </>
        )}
      </div>
      <MFoot onClose={onClose} onConfirm={submit} confirmLabel="Generate Voucher"
        confirmColor="linear-gradient(145deg,#5b8af0,#3a6bd4)" loading={loading || loadingData} />
    </Modal>
  )
}

/* ═══════════════════════════════════════════════════
   VOUCHER ROW — onClick opens context menu
═══════════════════════════════════════════════════ */
function VoucherRow({ v, onRowClick, actionLoading }) {
  const sc        = STATUS_CFG[v.status] || STATUS_CFG.unpaid
  const isPastDue = new Date(v.due_date) < new Date() && v.status !== 'paid'
  const pct       = v.total_due > 0 ? Math.min(((v.total_paid || 0) / v.total_due) * 100, 100) : 0

  return (
    <div className={`vchr-row st-${v.status}`} onClick={e => onRowClick(e, v)}>

      {/* Voucher No */}
      <span style={{ fontSize: '.72rem', fontWeight: 800, color: '#5b8af0', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {v.voucher_number}
      </span>

      {/* Student */}
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: '.84rem', fontWeight: 600, color: 'var(--neu-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.student_name}</p>
        <p style={{ fontSize: '.64rem', color: 'var(--neu-text-ghost)', fontFamily: 'monospace' }}>{v.roll_number}</p>
      </div>

      {/* Amount */}
      <span style={{ fontSize: '.82rem', fontWeight: 700, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif' }}>
        {formatCurrency(v.total_due)}
      </span>

      {/* Fine */}
      {v.fine_amount > 0
        ? <span style={{ fontSize: '.78rem', fontWeight: 700, color: '#f97316', fontFamily: 'Outfit,sans-serif' }}>{formatCurrency(v.fine_amount)}</span>
        : <span style={{ fontSize: '.7rem', color: 'var(--neu-text-ghost)', opacity: .4 }}>—</span>
      }

      {/* Progress */}
      <div>
        <div style={{ height: 5, background: 'var(--neu-surface-deep)', borderRadius: 99, overflow: 'hidden', boxShadow: 'inset 1px 1px 3px var(--neu-shadow-dark)', marginBottom: '.2rem' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: sc.c, borderRadius: 99 }} />
        </div>
        <span style={{ fontSize: '.6rem', color: 'var(--neu-text-ghost)' }}>{pct.toFixed(0)}% paid</span>
      </div>

      {/* Due date */}
      <span style={{ fontSize: '.72rem', fontWeight: 600, color: isPastDue ? '#ef4444' : 'var(--neu-text-primary)' }}>
        {formatDate(v.due_date)}
      </span>
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════ */
export default function FeeVouchersPage() {
  const [vouchers,        setVouchers]        = useState([])
  const [pagination,      setPagination]      = useState({ total: 0, page: 1, per_page: 20, total_pages: 1 })
  const [loading,         setLoading]         = useState(true)
  const [search,          setSearch]          = useState('')
  const [filterStatus,    setFilterStatus]    = useState('')
  const [payVoucher,      setPayVoucher]      = useState(null)
  const [viewVoucher,     setViewVoucher]     = useState(null)
  const [showGenerate,    setShowGenerate]    = useState(false)
  const [updatingOverdue, setUpdatingOverdue] = useState(false)

  const { menu, open: openMenu, close: closeMenu } = useContextMenu()

  const fetchVouchers = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const params = { page, per_page: 20 }
      if (filterStatus) params.status = filterStatus
      const res = await adminAPI.getVouchers(params)
      setVouchers(res.data.data?.vouchers || [])
      setPagination(res.data.data?.pagination || { total: 0, page: 1, per_page: 20, total_pages: 1 })
    } catch { toast.error('Failed to load vouchers') }
    finally   { setLoading(false) }
  }, [filterStatus])

  useEffect(() => { fetchVouchers() }, [filterStatus])

  const handleUpdateOverdue = async () => {
    setUpdatingOverdue(true)
    try {
      const res = await adminAPI.updateOverdueVouchers()
      toast.success(`${res.data.data?.updated_count || 0} vouchers updated`)
      fetchVouchers()
    } catch { toast.error('Failed to update overdue') }
    finally { setUpdatingOverdue(false) }
  }

  // context menu items
  const ctxItems = (v) => [
    { label: 'View Details',    icon: Eye,        onClick: () => setViewVoucher(v) },
    ...(v.status !== 'paid' ? [
      { label: 'Record Payment', icon: DollarSign, onClick: () => setPayVoucher(v) },
    ] : []),
  ]

  const handleRowClick = (e, v) => openMenu(e, v)

  const filtered = vouchers.filter(v =>
    !search ||
    v.student_name?.toLowerCase().includes(search.toLowerCase()) ||
    v.voucher_number?.toLowerCase().includes(search.toLowerCase())
  )

  const counts = {
    paid:    vouchers.filter(v => v.status === 'paid').length,
    unpaid:  vouchers.filter(v => v.status === 'unpaid').length,
    overdue: vouchers.filter(v => v.status === 'overdue').length,
    partial: vouchers.filter(v => v.status === 'partial').length,
  }
  const totalCollected = vouchers.filter(v => v.status === 'paid').reduce((s, v) => s + parseFloat(v.total_due || 0), 0)

  return (
    <>
      <style>{CSS}</style>
      <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: '2rem' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '.75rem', marginBottom: '1.3rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.7rem' }}>
            <div style={{ width: 42, height: 42, borderRadius: '.9rem', background: 'rgba(34,160,107,.12)', boxShadow: '5px 5px 14px var(--neu-shadow-dark), -3px -3px 10px var(--neu-shadow-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CreditCard size={20} style={{ color: '#22a06b' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', letterSpacing: '-.02em' }}>Fee Vouchers</h1>
              <p style={{ fontSize: '.78rem', color: 'var(--neu-text-ghost)', marginTop: 2 }}>Manage and track student fee payments</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '.6rem', alignItems: 'center' }}>
            <button onClick={handleUpdateOverdue} disabled={updatingOverdue} style={{ display: 'flex', alignItems: 'center', gap: '.4rem', padding: '.55rem 1rem', border: '1.5px solid var(--neu-border)', borderRadius: '.8rem', background: 'var(--neu-surface-deep)', color: 'var(--neu-text-secondary)', fontSize: '.78rem', fontWeight: 600, cursor: updatingOverdue ? 'not-allowed' : 'pointer', opacity: updatingOverdue ? .7 : 1, fontFamily: "'DM Sans',sans-serif" }}>
              {updatingOverdue ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={14} />}
              Sync Overdue
            </button>
            <button onClick={() => setShowGenerate(true)} style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.6rem 1.15rem', background: 'linear-gradient(145deg,#22a06b,#1a7d54)', boxShadow: '0 4px 14px rgba(34,160,107,.35)', border: 'none', borderRadius: '.85rem', color: '#fff', fontWeight: 700, fontSize: '.82rem', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>
              <Plus size={15} /> Generate Voucher
            </button>
          </div>
        </div>

        {/* ── KPI tiles ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '.75rem', marginBottom: '1.3rem' }}>
          {[
            { label: 'Paid',      value: counts.paid,              c: '#22a06b', bg: 'rgba(34,160,107,.1)',  Icon: CheckCircle2  },
            { label: 'Unpaid',    value: counts.unpaid,            c: '#ef4444', bg: 'rgba(239,68,68,.1)',   Icon: Clock         },
            { label: 'Overdue',   value: counts.overdue,           c: '#f97316', bg: 'rgba(249,115,22,.1)',  Icon: AlertTriangle },
            { label: 'Collected', value: formatCurrency(totalCollected), c: '#5b8af0', bg: 'rgba(91,138,240,.1)', Icon: DollarSign },
          ].map(t => (
            <div key={t.label} style={{ background: 'var(--neu-surface)', border: '1px solid var(--neu-border)', borderRadius: '1rem', padding: '.9rem 1.1rem', boxShadow: '6px 6px 16px var(--neu-shadow-dark), -3px -3px 10px var(--neu-shadow-light)', display: 'flex', alignItems: 'center', gap: '.75rem' }}>
              <div style={{ width: 38, height: 38, borderRadius: '.75rem', background: t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <t.Icon size={17} style={{ color: t.c }} />
              </div>
              <div>
                <p style={{ fontSize: '.62rem', color: 'var(--neu-text-ghost)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em' }}>{t.label}</p>
                <p style={{ fontSize: '1.2rem', fontWeight: 800, color: t.c, fontFamily: 'Outfit,sans-serif', lineHeight: 1.1, marginTop: '.1rem' }}>{t.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Main content: deck + table ── */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>

          {/* Deck filter rail */}
          <DeckFilter
            active={filterStatus}
            onChange={setFilterStatus}
            counts={counts}
            total={pagination.total}
          />

          {/* Table panel */}
          <div style={{ flex: 1, background: 'var(--neu-surface)', border: '1px solid var(--neu-border)', borderRadius: '1.25rem', boxShadow: '6px 6px 16px var(--neu-shadow-dark), -3px -3px 10px var(--neu-shadow-light)', overflow: 'hidden' }}>

            {/* Search bar */}
            <div style={{ padding: '.75rem 1rem', borderBottom: '1px solid var(--neu-border)', display: 'flex', alignItems: 'center', gap: '.6rem' }}>
              <Search size={14} style={{ color: 'var(--neu-text-ghost)', flexShrink: 0 }} />
              <input
                style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: '.85rem', color: 'var(--neu-text-primary)', fontFamily: "'DM Sans',sans-serif" }}
                placeholder="Search by student name or voucher number…"
                value={search} onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* Column headers */}
            <div className="vchr-header">
              <span>Voucher #</span>
              <span>Student</span>
              <span>Amount</span>
              <span>Fine</span>
              <span>Progress</span>
              <span>Due Date</span>
            </div>

            {/* Rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.3rem', padding: '.4rem .5rem' }}>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} style={{ height: 52, background: 'var(--neu-surface-deep)', borderRadius: '.85rem', animation: 'pulse 1.5s infinite', border: '1px solid var(--neu-border)' }} />
                ))
              ) : filtered.length === 0 ? (
                <div style={{ padding: '4rem', textAlign: 'center' }}>
                  <CreditCard size={32} style={{ color: 'var(--neu-text-ghost)', opacity: .15, display: 'block', margin: '0 auto .8rem' }} />
                  <p style={{ color: 'var(--neu-text-secondary)', fontWeight: 600 }}>No vouchers found</p>
                </div>
              ) : filtered.map(v => (
                <VoucherRow key={v.id} v={v} onRowClick={handleRowClick} />
              ))}
            </div>

            {/* Pagination */}
            {pagination.total_pages > 1 && (
              <div style={{ padding: '.7rem 1rem', borderTop: '1px solid var(--neu-border)', background: 'var(--neu-surface-deep)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '.72rem', color: 'var(--neu-text-ghost)' }}>
                  Page {pagination.page} of {pagination.total_pages} ({pagination.total} records)
                </span>
                <div style={{ display: 'flex', gap: '.3rem', alignItems: 'center' }}>
                  <button className="pg-btn" disabled={pagination.page === 1} onClick={() => fetchVouchers(pagination.page - 1)}>
                    <ChevronLeft size={13} />
                  </button>
                  {Array.from({ length: Math.min(pagination.total_pages, 5) }, (_, i) => i + 1).map(p => (
                    <button key={p} className={`pg-btn${p === pagination.page ? ' active' : ''}`} onClick={() => fetchVouchers(p)}>{p}</button>
                  ))}
                  <button className="pg-btn" disabled={pagination.page === pagination.total_pages} onClick={() => fetchVouchers(pagination.page + 1)}>
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Context Menu */}
      <ContextMenu menu={menu} close={closeMenu} items={menu ? ctxItems(menu.row) : []} />

      {/* Modals */}
      {payVoucher   && <PayModal      voucher={payVoucher}  onClose={() => setPayVoucher(null)}  onSuccess={() => fetchVouchers(pagination.page)} />}
      {viewVoucher  && <ViewModal     voucher={viewVoucher} onClose={() => setViewVoucher(null)} onPay={setPayVoucher} />}
      {showGenerate && <GenerateModal onClose={() => setShowGenerate(false)} onSuccess={() => fetchVouchers(1)} />}
    </>
  )
}