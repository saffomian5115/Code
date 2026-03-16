// ═══════════════════════════════════════════════════════════════
//  FeeVouchersPage.jsx  —  frontend/src/pages/admin/FeeVouchersPage.jsx
//  All 7 missing features implemented:
//   1. ViewModal → fresh GET /vouchers/{id} → transaction history
//   2. Bulk voucher generation (program + semester)
//   3. Fine calculate per voucher in context menu
//   4. Transaction history table in ViewModal
//   5. Semester filter in list
//   6. Voucher number search/lookup
//   7. Issue date, remarks, semester name in ViewModal
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  CreditCard, Search, Loader2, X, Plus, DollarSign,
  ChevronLeft, ChevronRight, AlertTriangle, CheckCircle2,
  Clock, Eye, Layers, RefreshCw, Banknote, Smartphone,
  Building2, BookCheck, Users, Zap, Hash, Receipt,
} from 'lucide-react'
import toast from 'react-hot-toast'
import AddButton from '../../components/ui/AddButton'
import { adminAPI } from '../../api/admin.api'
import { formatDate, formatCurrency } from '../../utils/helpers'
import { useContextMenu, ContextMenu } from '../../hooks/useContextMenu'

/* ═══════════════════════════════════════════════
   CSS
═══════════════════════════════════════════════ */
const CSS = `
  @keyframes spin    { to { transform: rotate(360deg) } }
  @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.45} }
  @keyframes neu-slide-up { from{opacity:0;transform:translateY(14px) scale(.97)} to{opacity:1;transform:none} }

  .vchr-row {
    display: grid;
    grid-template-columns: 130px 2fr 90px 70px 110px 90px;
    align-items: center; gap: .5rem;
    padding: .75rem 1rem; border-radius: .85rem;
    border: 1px solid transparent; border-left: 3px solid transparent;
    transition: background .14s, border-color .14s, transform .18s;
    cursor: pointer; user-select: none;
  }
  .vchr-row:hover { background: var(--neu-surface-deep); border-color: var(--neu-border); transform: translateX(3px); }
  .vchr-row.st-paid    { border-left-color: #22a06b !important; }
  .vchr-row.st-unpaid  { border-left-color: #ef4444 !important; }
  .vchr-row.st-overdue { border-left-color: #f97316 !important; }
  .vchr-row.st-partial { border-left-color: #5b8af0 !important; }

  .vchr-header {
    display: grid;
    grid-template-columns: 130px 2fr 90px 70px 110px 90px;
    gap: .5rem; padding: .25rem 1rem;
    font-size: .6rem; font-weight: 700;
    text-transform: uppercase; letter-spacing: .07em; color: var(--neu-text-ghost);
  }

  .filter-deck {
    display: flex; flex-direction: row; align-items: center;
    gap: .28rem; padding: .3rem .4rem;
    background: var(--neu-surface); border: 1px solid var(--neu-border);
    border-radius: .9rem;
    box-shadow: 4px 4px 12px var(--neu-shadow-dark), -2px -2px 8px var(--neu-shadow-light);
    width: fit-content;
  }
  .deck-btn {
    width: 34px; height: 34px; border-radius: .6rem;
    border: 1.5px solid transparent; background: none;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    transition: width .15s cubic-bezier(.34,1.56,.64,1),
                height .15s cubic-bezier(.34,1.56,.64,1),
                background .14s, border-color .14s;
    position: relative; flex-shrink: 0;
  }
  .deck-btn:hover { width: 42px; height: 42px; background: var(--neu-surface-deep); border-color: var(--neu-border); }
  .deck-btn.d-act { border-color: currentColor; }
  .deck-btn.d-all.d-act    { background: rgba(91,138,240,.13); color: #5b8af0; }
  .deck-btn.d-paid.d-act   { background: rgba(34,160,107,.13); color: #22a06b; }
  .deck-btn.d-unpaid.d-act { background: rgba(239,68,68,.13);  color: #ef4444; }
  .deck-btn.d-overdue.d-act{ background: rgba(249,115,22,.13); color: #f97316; }
  .deck-btn.d-partial.d-act{ background: rgba(91,138,240,.1);  color: #5b8af0; }
  .deck-dot { position: absolute; top: 3px; right: 3px; width: 6px; height: 6px; border-radius: 50%; }

  .deck-tip {
    position: fixed; pointer-events: none; z-index: 99999;
    background: var(--neu-surface); border: 1px solid var(--neu-border);
    box-shadow: 4px 4px 12px var(--neu-shadow-dark), -2px -2px 6px var(--neu-shadow-light);
    color: var(--neu-text-primary); font-size: .72rem; font-weight: 700;
    padding: .28rem .7rem; border-radius: .5rem; white-space: nowrap;
    animation: neu-slide-up .1s ease both;
  }

  .txn-row {
    display: grid; grid-template-columns: 75px 90px 1fr 90px;
    gap: .4rem; align-items: center; padding: .55rem .8rem;
    border-radius: .7rem; font-size: .75rem;
    border: 1px solid var(--neu-border); background: var(--neu-surface-deep);
  }

  .pg-btn {
    width: 30px; height: 30px; border-radius: .55rem;
    border: 1.5px solid var(--neu-border); background: var(--neu-surface-deep);
    font-size: .75rem; font-weight: 700; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    color: var(--neu-text-muted);
    box-shadow: 3px 3px 7px var(--neu-shadow-dark), -1px -1px 4px var(--neu-shadow-light);
    transition: all .14s;
  }
  .pg-btn.active { background: #5b8af0; border-color: #5b8af0; color: #fff; }
  .pg-btn:disabled { opacity: .35; cursor: not-allowed; }
`

/* ═══════════════════════════════════════════════
   SHARED PRIMITIVES
═══════════════════════════════════════════════ */
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
const Tile = ({ children, style }) => (
  <div style={{ background: 'var(--neu-surface-deep)', borderRadius: '.8rem', padding: '.7rem 1rem', boxShadow: 'inset 2px 2px 5px var(--neu-shadow-dark), inset -1px -1px 4px var(--neu-shadow-light)', ...style }}>
    {children}
  </div>
)
const STATUS_CFG = {
  paid:    { c: '#22a06b', bg: 'rgba(34,160,107,.1)',  Icon: CheckCircle2,  label: 'Paid'    },
  unpaid:  { c: '#ef4444', bg: 'rgba(239,68,68,.1)',   Icon: Clock,         label: 'Unpaid'  },
  overdue: { c: '#f97316', bg: 'rgba(249,115,22,.1)',  Icon: AlertTriangle, label: 'Overdue' },
  partial: { c: '#5b8af0', bg: 'rgba(91,138,240,.1)',  Icon: Clock,         label: 'Partial' },
}
const METHOD_FIELDS = {
  cash:          { ref: false, bank: false, receipt: true  },
  bank_transfer: { ref: true,  bank: true,  receipt: true  },
  online:        { ref: true,  bank: true,  receipt: true  },
  cheque:        { ref: true,  bank: true,  receipt: true  },
}
const METHOD_META = {
  cash:          { refLabel: null,                         bankLabel: null,                       icon: Banknote   },
  bank_transfer: { refLabel: 'Transaction ID',             bankLabel: 'Bank Name',                icon: Building2  },
  online:        { refLabel: 'Transaction / Ref No',       bankLabel: 'Platform (e.g. JazzCash)', icon: Smartphone },
  cheque:        { refLabel: 'Cheque Number',              bankLabel: 'Bank Name',                icon: BookCheck  },
}
const METHOD_ICON = { cash: Banknote, bank_transfer: Building2, online: Smartphone, cheque: BookCheck }

/* ═══════════════════════════════════════════════
   MODAL SHELL
═══════════════════════════════════════════════ */
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
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neu-text-ghost)', padding: '.2rem' }}><X size={17} /></button>
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

/* ═══════════════════════════════════════════════
   DECK FILTER
═══════════════════════════════════════════════ */
const DECK_ITEMS = [
  { key: '',        label: 'All',     Icon: Layers,        cls: 'd-all',     color: '#5b8af0' },
  { key: 'paid',    label: 'Paid',    Icon: CheckCircle2,  cls: 'd-paid',    color: '#22a06b' },
  { key: 'unpaid',  label: 'Unpaid',  Icon: Clock,         cls: 'd-unpaid',  color: '#ef4444' },
  { key: 'overdue', label: 'Overdue', Icon: AlertTriangle, cls: 'd-overdue', color: '#f97316' },
  { key: 'partial', label: 'Partial', Icon: BookCheck,     cls: 'd-partial', color: '#5b8af0' },
]
function DeckFilter({ active, onChange, counts, total }) {
  const [tip, setTip] = useState(null)
  const getCount = k => k === '' ? total : (counts[k] ?? 0)
  const handleEnter = (e, label) => {
    const r = e.currentTarget.getBoundingClientRect()
    setTip({ label, x: r.left + r.width / 2, y: r.bottom + 8 })
  }
  return (
    <>
      <div className="filter-deck">
        {DECK_ITEMS.map(({ key, label, Icon, cls, color }) => {
          const isAct = active === key
          return (
            <button key={key} className={`deck-btn ${cls}${isAct ? ' d-act' : ''}`}
              style={{ color: isAct ? color : 'var(--neu-text-ghost)' }}
              onClick={() => onChange(key)}
              onMouseEnter={e => handleEnter(e, `${label} (${getCount(key)})`)}
              onMouseLeave={() => setTip(null)}>
              <Icon size={15} />
              {isAct && <span className="deck-dot" style={{ background: color, boxShadow: `0 0 4px ${color}` }} />}
            </button>
          )
        })}
      </div>
      {tip && createPortal(
        <div className="deck-tip" style={{ top: tip.y, left: tip.x, transform: 'translateX(-50%)' }}>{tip.label}</div>,
        document.body
      )}
    </>
  )
}

/* ═══════════════════════════════════════════════
   1+4+7. VIEW MODAL — fresh data + transactions + issue date + remarks
═══════════════════════════════════════════════ */
function ViewModal({ voucherId, onClose, onPay }) {
  const [v,       setV]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminAPI.getVoucher(voucherId)
      .then(r => setV(r.data.data))
      .catch(() => toast.error('Failed to load voucher'))
      .finally(() => setLoading(false))
  }, [voucherId])

  if (loading || !v) return (
    <Modal onClose={onClose}>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
        <Loader2 size={26} style={{ color: '#5b8af0', animation: 'spin 1s linear infinite' }} />
      </div>
    </Modal>
  )

  const sc        = STATUS_CFG[v.status] || STATUS_CFG.unpaid
  const totalDue  = v.total_due  || 0
  const totalPaid = v.total_paid || 0
  const remaining = Math.max(totalDue - totalPaid, 0)
  const pct       = totalDue > 0 ? Math.min((totalPaid / totalDue) * 100, 100) : 0
  const payments  = v.payments || []

  return (
    <Modal onClose={onClose} maxW={540}>
      <MHead icon={sc.Icon} title="Voucher Detail" sub={v.voucher_number} onClose={onClose} iconColor={sc.c} />
      <div style={{ padding: '1rem 1.4rem', display: 'flex', flexDirection: 'column', gap: '.6rem', overflowY: 'auto' }}>

        {/* Student + Semester (7) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem' }}>
          <Tile>
            <p style={{ fontSize: '.6rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '.2rem' }}>Student</p>
            <p style={{ fontSize: '.88rem', fontWeight: 700, color: 'var(--neu-text-primary)' }}>{v.student?.name}</p>
            <p style={{ fontSize: '.68rem', color: 'var(--neu-text-ghost)', fontFamily: 'monospace' }}>{v.student?.roll_number}</p>
          </Tile>
          <Tile>
            <p style={{ fontSize: '.6rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '.2rem' }}>Semester</p>
            <p style={{ fontSize: '.88rem', fontWeight: 700, color: 'var(--neu-text-primary)' }}>{v.semester?.name || '—'}</p>
            <p style={{ fontSize: '.68rem', color: 'var(--neu-text-ghost)' }}>Issued: {formatDate(v.issue_date)}</p>
          </Tile>
        </div>

        {/* Amounts */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '.5rem' }}>
          {[
            { l: 'Base Amount', val: formatCurrency(v.amount),        c: '#5b8af0' },
            { l: 'Fine',        val: v.fine_amount > 0 ? formatCurrency(v.fine_amount) : '—', c: '#f97316' },
            { l: 'Total Due',   val: formatCurrency(totalDue),        c: '#ef4444' },
          ].map(t => (
            <Tile key={t.l} style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '.6rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '.2rem' }}>{t.l}</p>
              <p style={{ fontSize: '.9rem', fontWeight: 800, color: t.c, fontFamily: 'Outfit,sans-serif' }}>{t.val}</p>
            </Tile>
          ))}
        </div>

        {/* Progress bar */}
        <Tile>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.35rem', fontSize: '.78rem' }}>
            <span style={{ color: 'var(--neu-text-muted)' }}>Payment Progress</span>
            <span style={{ fontWeight: 700, color: sc.c }}>{pct.toFixed(0)}%</span>
          </div>
          <div style={{ height: 7, background: 'var(--neu-surface)', borderRadius: 99, overflow: 'hidden', boxShadow: 'inset 1px 1px 3px var(--neu-shadow-dark)' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: sc.c, borderRadius: 99, transition: 'width .4s ease' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '.3rem', fontSize: '.7rem' }}>
            <span style={{ color: '#22a06b', fontWeight: 600 }}>Paid: {formatCurrency(totalPaid)}</span>
            <span style={{ color: '#ef4444', fontWeight: 600 }}>Remaining: {formatCurrency(remaining)}</span>
          </div>
        </Tile>

        {/* Due date + Status */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem' }}>
          <Tile>
            <p style={{ fontSize: '.6rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '.2rem' }}>Due Date</p>
            <p style={{ fontSize: '.82rem', fontWeight: 700, color: new Date(v.due_date) < new Date() && v.status !== 'paid' ? '#ef4444' : 'var(--neu-text-primary)' }}>{formatDate(v.due_date)}</p>
          </Tile>
          <Tile style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: sc.c, flexShrink: 0 }} />
            <span style={{ fontSize: '.82rem', fontWeight: 700, color: sc.c, textTransform: 'capitalize' }}>{v.status}</span>
          </Tile>
        </div>

        {/* Remarks (7) */}
        {v.remarks && (
          <Tile>
            <p style={{ fontSize: '.6rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '.2rem' }}>Remarks</p>
            <p style={{ fontSize: '.8rem', color: 'var(--neu-text-secondary)' }}>{v.remarks}</p>
          </Tile>
        )}

        {/* 4. Transaction History */}
        {payments.length > 0 ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', marginBottom: '.4rem' }}>
              <Receipt size={12} style={{ color: 'var(--neu-text-ghost)' }} />
              <p style={{ fontSize: '.62rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                Transaction History ({payments.length})
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.3rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '75px 90px 1fr 90px', gap: '.4rem', padding: '.2rem .8rem', fontSize: '.58rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                <span>Date</span><span>Method</span><span>Reference</span><span style={{ textAlign: 'right' }}>Amount</span>
              </div>
              {payments.map((p, i) => {
                const MIcon = METHOD_ICON[p.payment_method] || DollarSign
                return (
                  <div key={p.id || i} className="txn-row">
                    <span style={{ fontSize: '.68rem', color: 'var(--neu-text-ghost)' }}>{formatDate(p.payment_date)}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.3rem' }}>
                      <MIcon size={11} style={{ color: 'var(--neu-text-ghost)', flexShrink: 0 }} />
                      <span style={{ fontSize: '.68rem', color: 'var(--neu-text-secondary)', textTransform: 'capitalize' }}>{p.payment_method?.replace('_', ' ')}</span>
                    </div>
                    <p style={{ fontSize: '.7rem', color: 'var(--neu-text-primary)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.reference_number || p.bank_name || p.receipt_number || '—'}
                    </p>
                    <span style={{ fontSize: '.78rem', fontWeight: 800, color: '#22a06b', fontFamily: 'Outfit,sans-serif', textAlign: 'right' }}>{formatCurrency(p.amount_paid)}</span>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <Tile style={{ textAlign: 'center', padding: '.9rem' }}>
            <p style={{ fontSize: '.75rem', color: 'var(--neu-text-ghost)' }}>No payment transactions yet</p>
          </Tile>
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

/* ═══════════════════════════════════════════════
   PAY MODAL
═══════════════════════════════════════════════ */
function PayModal({ voucher: v, onClose, onSuccess }) {
  const totalPaid = v.total_paid || 0
  const totalDue  = v.total_due  || 0
  const remaining = Math.max(totalDue - totalPaid, 0)
  const [form, setForm] = useState({ amount_paid: remaining > 0 ? remaining : totalDue, payment_method: 'bank_transfer', reference_number: '', bank_name: '', receipt_number: '', payment_date: new Date().toISOString().split('T')[0] })
  const [loading, setLoading] = useState(false)
  const set = (k, val) => setForm(p => ({ ...p, [k]: val }))
  const fields = METHOD_FIELDS[form.payment_method] || METHOD_FIELDS.bank_transfer
  const meta   = METHOD_META[form.payment_method]

  const submit = async () => {
    if (!form.amount_paid || parseFloat(form.amount_paid) <= 0) return toast.error('Enter a valid amount')
    if (fields.ref && !form.reference_number.trim()) return toast.error(`${meta.refLabel} is required`)
    setLoading(true)
    try { await adminAPI.payVoucher(v.id, form); toast.success('Payment recorded!'); onSuccess(); onClose() }
    catch (e) { toast.error(e.response?.data?.message || 'Failed') }
    finally { setLoading(false) }
  }

  return (
    <Modal onClose={onClose} maxW={460}>
      <MHead icon={DollarSign} title="Record Payment" sub={v.voucher_number || v.id} onClose={onClose} iconColor="#22a06b" />
      <div style={{ padding: '1.1rem 1.4rem', display: 'flex', flexDirection: 'column', gap: '.8rem', overflowY: 'auto' }}>
        <Tile>
          {[
            { l: 'Total Due',    val: formatCurrency(totalDue),  bold: false },
            { l: 'Already Paid', val: formatCurrency(totalPaid), bold: false, green: true },
            { l: 'Remaining',    val: formatCurrency(remaining), bold: true,  red: true },
          ].map(r => (
            <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: r.bold ? '.85rem' : '.78rem', borderTop: r.bold ? '1px solid var(--neu-border)' : 'none', paddingTop: r.bold ? '.25rem' : 0, marginBottom: r.bold ? 0 : '.2rem' }}>
              <span style={{ color: 'var(--neu-text-muted)', fontWeight: r.bold ? 700 : 400 }}>{r.l}</span>
              <span style={{ fontWeight: r.bold ? 800 : 600, color: r.red ? '#ef4444' : r.green ? '#22a06b' : 'var(--neu-text-primary)', fontFamily: r.bold ? 'Outfit,sans-serif' : 'inherit' }}>{r.val}</span>
            </div>
          ))}
        </Tile>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
          <F label="Amount *"><input style={iS} type="number" min="1" value={form.amount_paid} onChange={e => set('amount_paid', e.target.value)} /></F>
          <F label="Payment Method">
            <select style={iS} value={form.payment_method} onChange={e => set('payment_method', e.target.value)}>
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="online">Online</option>
              <option value="cheque">Cheque</option>
            </select>
          </F>
        </div>
        {fields.ref && <F label={`${meta.refLabel} *`}><input style={iS} value={form.reference_number} onChange={e => set('reference_number', e.target.value)} placeholder={form.payment_method === 'cheque' ? 'CHQ-00123' : 'TXN-2025-001'} /></F>}
        {fields.bank && <F label={meta.bankLabel}><input style={iS} value={form.bank_name} onChange={e => set('bank_name', e.target.value)} placeholder={form.payment_method === 'online' ? 'e.g. JazzCash' : 'e.g. HBL'} /></F>}
        <div style={{ display: 'grid', gridTemplateColumns: fields.receipt ? '1fr 1fr' : '1fr', gap: '.75rem' }}>
          {fields.receipt && <F label="Receipt Number"><input style={iS} value={form.receipt_number} onChange={e => set('receipt_number', e.target.value)} placeholder="RCP-001" /></F>}
          <F label="Payment Date"><input style={iS} type="date" value={form.payment_date} onChange={e => set('payment_date', e.target.value)} /></F>
        </div>
      </div>
      <MFoot onClose={onClose} onConfirm={submit} confirmLabel="Record Payment" loading={loading} />
    </Modal>
  )
}

/* ═══════════════════════════════════════════════
   GENERATE SINGLE VOUCHER
═══════════════════════════════════════════════ */
function GenerateModal({ onClose, onSuccess }) {
  const [students, setStudents]       = useState([])
  const [semesters, setSemesters]     = useState([])
  const [form, setForm]               = useState({ student_id: '', semester_id: '', due_date: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0], remarks: '' })
  const [loading, setLoading]         = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  useEffect(() => {
    Promise.all([adminAPI.getStudents(1, 500), adminAPI.getSemesters()])
      .then(([s, sem]) => { setStudents(s.data.data?.students || []); setSemesters(sem.data.data?.semesters || []) })
      .finally(() => setLoadingData(false))
  }, [])

  const submit = async () => {
    if (!form.student_id || !form.semester_id || !form.due_date) return toast.error('All fields required')
    setLoading(true)
    try { await adminAPI.createVoucher(form); toast.success('Voucher generated!'); onSuccess(); onClose() }
    catch (e) { toast.error(e.response?.data?.message || 'Failed') }
    finally { setLoading(false) }
  }

  return (
    <Modal onClose={onClose} maxW={440}>
      <MHead icon={Plus} title="Generate Voucher" onClose={onClose} iconColor="#5b8af0" />
      <div style={{ padding: '1.1rem 1.4rem', display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
        {loadingData ? <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><Loader2 size={24} style={{ color: '#5b8af0', animation: 'spin 1s linear infinite' }} /></div> : (
          <>
            <F label="Student *"><select style={iS} value={form.student_id} onChange={e => set('student_id', e.target.value)}><option value="">— Select Student —</option>{students.map(s => <option key={s.user_id} value={s.user_id}>{s.full_name} ({s.roll_number})</option>)}</select></F>
            <F label="Semester *"><select style={iS} value={form.semester_id} onChange={e => set('semester_id', e.target.value)}><option value="">— Select Semester —</option>{semesters.map(s => <option key={s.id} value={s.id}>{s.name}{s.is_active ? ' ★' : ''}</option>)}</select></F>
            <F label="Due Date *"><input style={iS} type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} /></F>
            <F label="Remarks (optional)"><input style={iS} value={form.remarks} onChange={e => set('remarks', e.target.value)} placeholder="Any notes..." /></F>
          </>
        )}
      </div>
      <MFoot onClose={onClose} onConfirm={submit} confirmLabel="Generate Voucher" confirmColor="linear-gradient(145deg,#5b8af0,#3a6bd4)" loading={loading || loadingData} />
    </Modal>
  )
}

/* ═══════════════════════════════════════════════
   2. BULK GENERATE MODAL
═══════════════════════════════════════════════ */
function BulkGenerateModal({ onClose, onSuccess }) {
  const [programs, setPrograms]       = useState([])
  const [semesters, setSemesters]     = useState([])
  const [form, setForm]               = useState({ program_id: '', semester_id: '', due_date: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0], remarks: '' })
  const [loading, setLoading]         = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [result, setResult]           = useState(null)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  useEffect(() => {
    Promise.all([adminAPI.getPrograms(), adminAPI.getSemesters()])
      .then(([p, s]) => { setPrograms(p.data.data?.programs || []); setSemesters(s.data.data?.semesters || []) })
      .finally(() => setLoadingData(false))
  }, [])

  const submit = async () => {
    if (!form.program_id || !form.semester_id || !form.due_date) return toast.error('All fields required')
    setLoading(true)
    try {
      const res = await adminAPI.createBulkVouchers(form)
      const d   = res.data.data
      setResult(d)
      toast.success(`${d.generated_count} vouchers generated!`)
      onSuccess()
    } catch (e) { toast.error(e.response?.data?.message || 'Failed') }
    finally { setLoading(false) }
  }

  return (
    <Modal onClose={onClose} maxW={480}>
      <MHead icon={Users} title="Bulk Generate Vouchers" sub="Generate for entire program batch" onClose={onClose} iconColor="#9b59b6" />
      <div style={{ padding: '1.1rem 1.4rem', display: 'flex', flexDirection: 'column', gap: '.85rem', overflowY: 'auto' }}>
        {loadingData ? <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><Loader2 size={24} style={{ color: '#9b59b6', animation: 'spin 1s linear infinite' }} /></div>
        : result ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
            <Tile style={{ textAlign: 'center', padding: '1.2rem' }}>
              <CheckCircle2 size={32} style={{ color: '#22a06b', margin: '0 auto .5rem', display: 'block' }} />
              <p style={{ fontSize: '1.05rem', fontWeight: 800, color: '#22a06b', fontFamily: 'Outfit,sans-serif' }}>Bulk Generation Complete</p>
            </Tile>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem' }}>
              <Tile style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '.6rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', marginBottom: '.2rem' }}>Generated</p>
                <p style={{ fontSize: '1.4rem', fontWeight: 900, color: '#22a06b', fontFamily: 'Outfit,sans-serif' }}>{result.generated_count}</p>
              </Tile>
              <Tile style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '.6rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', marginBottom: '.2rem' }}>Skipped</p>
                <p style={{ fontSize: '1.4rem', fontWeight: 900, color: '#f97316', fontFamily: 'Outfit,sans-serif' }}>{result.skipped_count}</p>
              </Tile>
            </div>
            {result.skipped_count > 0 && result.skipped_details?.length > 0 && (
              <Tile>
                <p style={{ fontSize: '.62rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', marginBottom: '.3rem' }}>Skipped Details</p>
                {result.skipped_details.slice(0, 6).map((s, i) => (
                  <p key={i} style={{ fontSize: '.72rem', color: 'var(--neu-text-secondary)', marginBottom: '.12rem' }}>• Student {s.student_id}: {s.reason}</p>
                ))}
              </Tile>
            )}
          </div>
        ) : (
          <>
            <div style={{ padding: '.7rem 1rem', borderRadius: '.8rem', background: 'rgba(155,89,182,.07)', border: '1px solid rgba(155,89,182,.2)', fontSize: '.78rem', color: 'var(--neu-text-secondary)' }}>
              Generates vouchers for all active students in the selected program. Students with an existing active voucher will be skipped.
            </div>
            <F label="Program *"><select style={iS} value={form.program_id} onChange={e => set('program_id', e.target.value)}><option value="">— Select Program —</option>{programs.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}</select></F>
            <F label="Semester *"><select style={iS} value={form.semester_id} onChange={e => set('semester_id', e.target.value)}><option value="">— Select Semester —</option>{semesters.map(s => <option key={s.id} value={s.id}>{s.name}{s.is_active ? ' ★' : ''}</option>)}</select></F>
            <F label="Due Date *"><input style={iS} type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} /></F>
            <F label="Remarks (optional)"><input style={iS} value={form.remarks} onChange={e => set('remarks', e.target.value)} placeholder="e.g. Spring 2025 Fee" /></F>
          </>
        )}
      </div>
      <MFoot onClose={onClose} onConfirm={result ? null : submit} confirmLabel="Generate Bulk Vouchers" confirmColor="linear-gradient(145deg,#9b59b6,#7d3f9e)" loading={loading} />
    </Modal>
  )
}

/* ═══════════════════════════════════════════════
   3. FINE CALCULATE MODAL
═══════════════════════════════════════════════ */
function FineModal({ voucher: v, onClose, onSuccess }) {
  const [finePerDay, setFinePerDay] = useState('50')
  const [loading, setLoading]       = useState(false)

  const today    = new Date()
  const due      = new Date(v.due_date)
  const isOverdue = today > due
  const daysOver  = isOverdue ? Math.floor((today - due) / (1000 * 60 * 60 * 24)) : 0
  const previewFine = daysOver * (parseFloat(finePerDay) || 0)

  const submit = async () => {
    setLoading(true)
    try {
      const res = await adminAPI.applyFine(v.id, { voucher_id: v.id, fine_per_day: parseFloat(finePerDay) })
      toast.success(`Fine of ${formatCurrency(res.data.data?.fine_amount)} applied!`)
      onSuccess(); onClose()
    } catch (e) { toast.error(e.response?.data?.message || 'Failed') }
    finally { setLoading(false) }
  }

  return (
    <Modal onClose={onClose} maxW={400}>
      <MHead icon={Zap} title="Calculate Fine" sub={v.voucher_number} onClose={onClose} iconColor="#f97316" />
      <div style={{ padding: '1.1rem 1.4rem', display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
        {v.status === 'paid' ? (
          <Tile style={{ textAlign: 'center', padding: '1.5rem' }}>
            <CheckCircle2 size={28} style={{ color: '#22a06b', margin: '0 auto .5rem', display: 'block' }} />
            <p style={{ color: '#22a06b', fontWeight: 700 }}>Voucher already paid — no fine applicable</p>
          </Tile>
        ) : !isOverdue ? (
          <Tile style={{ textAlign: 'center', padding: '1.5rem' }}>
            <Clock size={28} style={{ color: '#5b8af0', margin: '0 auto .5rem', display: 'block' }} />
            <p style={{ color: '#5b8af0', fontWeight: 700 }}>Due date has not passed yet</p>
            <p style={{ fontSize: '.75rem', color: 'var(--neu-text-ghost)', marginTop: '.3rem' }}>Due: {formatDate(v.due_date)}</p>
          </Tile>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem' }}>
              <Tile style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '.6rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', marginBottom: '.2rem' }}>Days Overdue</p>
                <p style={{ fontSize: '1.3rem', fontWeight: 900, color: '#f97316', fontFamily: 'Outfit,sans-serif' }}>{daysOver}</p>
              </Tile>
              <Tile style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '.6rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', marginBottom: '.2rem' }}>Fine Preview</p>
                <p style={{ fontSize: '1.3rem', fontWeight: 900, color: '#ef4444', fontFamily: 'Outfit,sans-serif' }}>{formatCurrency(previewFine)}</p>
              </Tile>
            </div>
            <F label="Fine per Day (Rs.)">
              <input style={iS} type="number" min="1" value={finePerDay} onChange={e => setFinePerDay(e.target.value)} />
            </F>
            {v.fine_amount > 0 && (
              <p style={{ fontSize: '.72rem', color: '#f97316', fontWeight: 600 }}>⚠ Current fine: {formatCurrency(v.fine_amount)} — this will be overwritten</p>
            )}
          </>
        )}
      </div>
      <MFoot onClose={onClose} onConfirm={isOverdue && v.status !== 'paid' ? submit : null} confirmLabel="Apply Fine" confirmColor="linear-gradient(145deg,#f97316,#ea6a00)" loading={loading} />
    </Modal>
  )
}

/* ═══════════════════════════════════════════════
   6. VOUCHER LOOKUP MODAL
═══════════════════════════════════════════════ */
function LookupModal({ onClose, onFound }) {
  const [query, setQuery]   = useState('')
  const [loading, setLoading] = useState(false)

  const search = async () => {
    if (!query.trim()) return toast.error('Enter a voucher number')
    setLoading(true)
    try {
      const res = await adminAPI.getVoucherByNumber(query.trim().toUpperCase())
      const id = res.data.data?.id
      if (!id) { toast.error('Voucher not found'); return }
      onFound(id); onClose()
    } catch { toast.error('Voucher not found') }
    finally { setLoading(false) }
  }

  return (
    <Modal onClose={onClose} maxW={360}>
      <MHead icon={Hash} title="Find Voucher" sub="Search by voucher number" onClose={onClose} iconColor="#5b8af0" />
      <div style={{ padding: '1.1rem 1.4rem' }}>
        <F label="Voucher Number">
          <input style={iS} value={query} onChange={e => setQuery(e.target.value)} placeholder="e.g. VCH-2025-00001" onKeyDown={e => e.key === 'Enter' && search()} />
        </F>
      </div>
      <MFoot onClose={onClose} onConfirm={search} confirmLabel="Find Voucher" confirmColor="linear-gradient(145deg,#5b8af0,#3a6bd4)" loading={loading} />
    </Modal>
  )
}

/* ═══════════════════════════════════════════════
   VOUCHER ROW
═══════════════════════════════════════════════ */
function VoucherRow({ v, onRowClick }) {
  const sc        = STATUS_CFG[v.status] || STATUS_CFG.unpaid
  const isPastDue = new Date(v.due_date) < new Date() && v.status !== 'paid'
  const totalDue  = v.total_due  || 0
  const totalPaid = v.total_paid || 0
  const pct       = totalDue > 0 ? Math.min((totalPaid / totalDue) * 100, 100) : 0

  return (
    <div className={`vchr-row st-${v.status}`} onClick={e => onRowClick(e, v)}>
      <span style={{ fontSize: '.72rem', fontWeight: 800, color: '#5b8af0', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.voucher_number}</span>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: '.84rem', fontWeight: 600, color: 'var(--neu-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.student_name}</p>
        <p style={{ fontSize: '.64rem', color: 'var(--neu-text-ghost)', fontFamily: 'monospace' }}>{v.roll_number}</p>
      </div>
      <span style={{ fontSize: '.82rem', fontWeight: 700, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif' }}>{formatCurrency(totalDue)}</span>
      {v.fine_amount > 0
        ? <span style={{ fontSize: '.78rem', fontWeight: 700, color: '#f97316', fontFamily: 'Outfit,sans-serif' }}>{formatCurrency(v.fine_amount)}</span>
        : <span style={{ fontSize: '.7rem', color: 'var(--neu-text-ghost)', opacity: .4 }}>—</span>
      }
      <div>
        <div style={{ height: 5, background: 'var(--neu-surface-deep)', borderRadius: 99, overflow: 'hidden', boxShadow: 'inset 1px 1px 3px var(--neu-shadow-dark)', marginBottom: '.18rem' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: sc.c, borderRadius: 99 }} />
        </div>
        <span style={{ fontSize: '.6rem', color: 'var(--neu-text-ghost)' }}>{pct.toFixed(0)}% · {formatCurrency(totalPaid)}</span>
      </div>
      <span style={{ fontSize: '.72rem', fontWeight: 600, color: isPastDue ? '#ef4444' : 'var(--neu-text-primary)' }}>{formatDate(v.due_date)}</span>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════ */
export default function FeeVouchersPage() {
  const [vouchers,        setVouchers]        = useState([])
  const [pagination,      setPagination]      = useState({ total: 0, page: 1, per_page: 20, total_pages: 1 })
  const [loading,         setLoading]         = useState(true)
  const [search,          setSearch]          = useState('')
  const [filterStatus,    setFilterStatus]    = useState('')
  const [filterSemester,  setFilterSemester]  = useState('')  // 5
  const [semesters,       setSemesters]       = useState([])
  const [payVoucher,      setPayVoucher]      = useState(null)
  const [viewVoucherId,   setViewVoucherId]   = useState(null)// 1
  const [fineVoucher,     setFineVoucher]     = useState(null)// 3
  const [showGenerate,    setShowGenerate]    = useState(false)
  const [showBulk,        setShowBulk]        = useState(false)// 2
 
  const [updatingOverdue, setUpdatingOverdue] = useState(false)

  const { menu, open: openMenu, close: closeMenu } = useContextMenu()

  useEffect(() => {
    adminAPI.getSemesters().then(r => setSemesters(r.data.data?.semesters || []))
  }, [])

  const fetchVouchers = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const params = { page, per_page: 20 }
      if (filterStatus)   params.status      = filterStatus
      if (filterSemester) params.semester_id = filterSemester
      const res = await adminAPI.getVouchers(params)
      setVouchers(res.data.data?.vouchers || [])
      setPagination(res.data.data?.pagination || { total: 0, page: 1, per_page: 20, total_pages: 1 })
    } catch { toast.error('Failed to load vouchers') }
    finally { setLoading(false) }
  }, [filterStatus, filterSemester])

  useEffect(() => { fetchVouchers() }, [filterStatus, filterSemester])

  const handleUpdateOverdue = async () => {
    setUpdatingOverdue(true)
    try { const res = await adminAPI.updateOverdueVouchers(); toast.success(`${res.data.data?.updated_count || 0} updated`); fetchVouchers() }
    catch { toast.error('Failed') }
    finally { setUpdatingOverdue(false) }
  }

  const ctxItems = (v) => [
    { label: 'View Details',     icon: Eye,        onClick: () => setViewVoucherId(v.id)   },
    ...(v.status !== 'paid' ? [
      { label: 'Record Payment', icon: DollarSign, onClick: () => setPayVoucher(v)         },
      { label: 'Calculate Fine', icon: Zap,        onClick: () => setFineVoucher(v)        },
    ] : []),
  ]

  const filtered = vouchers.filter(v =>
    !search || v.student_name?.toLowerCase().includes(search.toLowerCase()) || v.voucher_number?.toLowerCase().includes(search.toLowerCase())
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
      <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1.3rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.7rem' }}>
            <div style={{ width: 42, height: 42, borderRadius: '.9rem', background: 'rgba(34,160,107,.12)', boxShadow: '5px 5px 14px var(--neu-shadow-dark), -3px -3px 10px var(--neu-shadow-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CreditCard size={20} style={{ color: '#22a06b' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', letterSpacing: '-.02em' }}>Fee Vouchers</h1>
              <p style={{ fontSize: '.78rem', color: 'var(--neu-text-ghost)', marginTop: 2 }}>Manage and track student fee payments</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
            
            
            <AddButton Icon={Loader2} onClick={handleUpdateOverdue} tooltip="Sync Overdue" color="#5b8af0" />

            <AddButton Icon={Users} onClick={() => setShowBulk(true)} tooltip="Bulk Generate" color="#5b8af0" />

            <AddButton onClick={() => setShowGenerate(true)} tooltip="Generate" color="#5b8af0" />
          </div>
        </div>

        {/* KPI tiles */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '.75rem' }}>
          {[
            { label: 'Paid',      value: counts.paid,                   c: '#22a06b', bg: 'rgba(34,160,107,.1)',  Icon: CheckCircle2  },
            { label: 'Unpaid',    value: counts.unpaid,                 c: '#ef4444', bg: 'rgba(239,68,68,.1)',   Icon: Clock         },
            { label: 'Overdue',   value: counts.overdue,                c: '#f97316', bg: 'rgba(249,115,22,.1)',  Icon: AlertTriangle },
            { label: 'Collected', value: formatCurrency(totalCollected), c: '#5b8af0', bg: 'rgba(91,138,240,.1)', Icon: DollarSign    },
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

        {/* Filters + Table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
          {/* Filter row: deck + semester + search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem', flexWrap: 'wrap' }}>
            <DeckFilter active={filterStatus} onChange={setFilterStatus} counts={counts} total={pagination.total} />
            {/* 5. Semester filter */}
            <select style={{ ...iS, width: 'auto', minWidth: 150, flex: '0 1 180px' }} value={filterSemester} onChange={e => setFilterSemester(e.target.value)}>
              <option value="">All Semesters</option>
              {semesters.map(s => <option key={s.id} value={s.id}>{s.name}{s.is_active ? ' ★' : ''}</option>)}
            </select>
            {/* Search */}
            <div style={{ flex: 1, minWidth: 180, display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.5rem .9rem', background: 'var(--neu-surface)', border: '1px solid var(--neu-border)', borderRadius: '.85rem', boxShadow: '4px 4px 12px var(--neu-shadow-dark), -2px -2px 8px var(--neu-shadow-light)' }}>
              <Search size={14} style={{ color: 'var(--neu-text-ghost)', flexShrink: 0 }} />
              <input style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: '.85rem', color: 'var(--neu-text-primary)', fontFamily: "'DM Sans',sans-serif" }}
                placeholder="Name or voucher number…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>

          {/* Table */}
          <div style={{ background: 'var(--neu-surface)', border: '1px solid var(--neu-border)', borderRadius: '1.25rem', boxShadow: '6px 6px 16px var(--neu-shadow-dark), -3px -3px 10px var(--neu-shadow-light)', overflow: 'hidden' }}>
            <div className="vchr-header">
              <span>Voucher #</span><span>Student</span><span>Amount</span><span>Fine</span><span>Progress</span><span>Due Date</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.3rem', padding: '.4rem .5rem' }}>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => <div key={i} style={{ height: 52, background: 'var(--neu-surface-deep)', borderRadius: '.85rem', animation: 'pulse 1.5s infinite', border: '1px solid var(--neu-border)' }} />)
              ) : filtered.length === 0 ? (
                <div style={{ padding: '4rem', textAlign: 'center' }}>
                  <CreditCard size={32} style={{ color: 'var(--neu-text-ghost)', opacity: .15, display: 'block', margin: '0 auto .8rem' }} />
                  <p style={{ color: 'var(--neu-text-secondary)', fontWeight: 600 }}>No vouchers found</p>
                </div>
              ) : filtered.map(v => <VoucherRow key={v.id} v={v} onRowClick={(e, row) => openMenu(e, row)} />)}
            </div>
            {pagination.total_pages > 1 && (
              <div style={{ padding: '.7rem 1rem', borderTop: '1px solid var(--neu-border)', background: 'var(--neu-surface-deep)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '.72rem', color: 'var(--neu-text-ghost)' }}>Page {pagination.page} of {pagination.total_pages} ({pagination.total} records)</span>
                <div style={{ display: 'flex', gap: '.3rem', alignItems: 'center' }}>
                  <button className="pg-btn" disabled={pagination.page === 1} onClick={() => fetchVouchers(pagination.page - 1)}><ChevronLeft size={13} /></button>
                  {Array.from({ length: Math.min(pagination.total_pages, 5) }, (_, i) => i + 1).map(p => (
                    <button key={p} className={`pg-btn${p === pagination.page ? ' active' : ''}`} onClick={() => fetchVouchers(p)}>{p}</button>
                  ))}
                  <button className="pg-btn" disabled={pagination.page === pagination.total_pages} onClick={() => fetchVouchers(pagination.page + 1)}><ChevronRight size={13} /></button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ContextMenu menu={menu} close={closeMenu} items={menu ? ctxItems(menu.row) : []} />

      {viewVoucherId && <ViewModal  voucherId={viewVoucherId} onClose={() => setViewVoucherId(null)} onPay={v => { setViewVoucherId(null); setPayVoucher(v) }} />}
      {payVoucher    && <PayModal   voucher={payVoucher}  onClose={() => setPayVoucher(null)}  onSuccess={() => fetchVouchers(pagination.page)} />}
      {fineVoucher   && <FineModal  voucher={fineVoucher} onClose={() => setFineVoucher(null)} onSuccess={() => fetchVouchers(pagination.page)} />}
      {showGenerate  && <GenerateModal     onClose={() => setShowGenerate(false)} onSuccess={() => fetchVouchers(1)} />}
      {showBulk      && <BulkGenerateModal onClose={() => setShowBulk(false)}    onSuccess={() => fetchVouchers(1)} />}
    </>
  )
}