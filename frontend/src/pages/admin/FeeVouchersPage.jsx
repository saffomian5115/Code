// ═══════════════════════════════════════════════════════════════
//  FeeVouchersPage.jsx  —  frontend/src/pages/admin/FeeVouchersPage.jsx
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect, useCallback } from 'react'
import {
  CreditCard, Search, Loader2, X, Plus, DollarSign,
  ChevronLeft, ChevronRight, AlertTriangle, CheckCircle2,
  Clock, Eye,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { adminAPI } from '../../api/admin.api'
import { formatDate, formatCurrency } from '../../utils/helpers'
import { useContextMenu, ContextMenu } from '../../hooks/useContextMenu'

/* ─── CSS ─────────────────────────────────────────── */
const CSS = `
  .vchr-row {
    display: grid;
    grid-template-columns: 130px 2fr 90px 70px 100px 90px 110px 80px;
    align-items: center;
    gap: .5rem;
    padding: .7rem 1rem;
    border-radius: .85rem;
    border: 1px solid transparent;
    transition: background .14s ease, border-color .14s ease, transform .18s ease;
    position: relative;
    cursor: default;
  }
  .vchr-row:hover {
    background: var(--neu-surface-deep);
    border-color: var(--neu-border);
    transform: translateX(3px);
  }
  .vchr-row .rc-hint {
    position: absolute; right: 10px; bottom: 5px;
    font-size: .58rem; color: var(--neu-text-ghost);
    opacity: 0; transition: opacity .2s; pointer-events: none; font-family: monospace;
  }
  .vchr-row:hover .rc-hint { opacity: .35; }
  .vchr-row.st-paid     { border-left: 3px solid #22a06b !important; }
  .vchr-row.st-unpaid   { border-left: 3px solid #ef4444 !important; }
  .vchr-row.st-overdue  { border-left: 3px solid #f97316 !important; }
  .vchr-row.st-partial  { border-left: 3px solid #5b8af0 !important; }

  .stat-pill {
    padding: .35rem 1rem;
    border-radius: .65rem;
    font-size: .78rem; font-weight: 700; cursor: pointer;
    border: 1.5px solid var(--neu-border);
    background: var(--neu-surface-deep);
    font-family: 'DM Sans', sans-serif;
    box-shadow: 4px 4px 10px var(--neu-shadow-dark), -2px -2px 6px var(--neu-shadow-light);
    transition: all .16s ease;
    color: var(--neu-text-muted);
    display: flex; align-items: center; gap: .4rem;
  }
  .stat-pill.act-all     { background:#5b8af0; color:#fff; border-color:#5b8af0; box-shadow:0 3px 12px rgba(91,138,240,.35); }
  .stat-pill.act-paid    { background:#22a06b; color:#fff; border-color:#22a06b; box-shadow:0 3px 12px rgba(34,160,107,.35); }
  .stat-pill.act-unpaid  { background:#ef4444; color:#fff; border-color:#ef4444; box-shadow:0 3px 12px rgba(239,68,68,.35); }
  .stat-pill.act-overdue { background:#f97316; color:#fff; border-color:#f97316; box-shadow:0 3px 12px rgba(249,115,22,.35); }
  .stat-pill.act-partial { background:#5b8af0; color:#fff; border-color:#5b8af0; box-shadow:0 3px 12px rgba(91,138,240,.35); }

  .pg-btn {
    width: 30px; height: 30px; border-radius: .55rem;
    border: 1.5px solid var(--neu-border);
    background: var(--neu-surface-deep);
    font-size: .75rem; font-weight: 700; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    font-family: 'DM Sans', sans-serif; color: var(--neu-text-muted);
    box-shadow: 3px 3px 7px var(--neu-shadow-dark), -1px -1px 4px var(--neu-shadow-light);
    transition: all .14s;
  }
  .pg-btn.active { background: #5b8af0; border-color: #5b8af0; color: #fff; box-shadow: 0 2px 8px rgba(91,138,240,.35); }
  .pg-btn:disabled { opacity: .35; cursor: not-allowed; }
  .pg-btn:not(:disabled):not(.active):hover { color: var(--neu-text-primary); }
`

/* ─── Shared ─────────────────────────────────────── */
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
  paid:    { c: '#22a06b', bg: 'rgba(34,160,107,.1)',  Icon: CheckCircle2, label: 'Paid'    },
  unpaid:  { c: '#ef4444', bg: 'rgba(239,68,68,.1)',   Icon: Clock,        label: 'Unpaid'  },
  overdue: { c: '#f97316', bg: 'rgba(249,115,22,.1)',  Icon: AlertTriangle,label: 'Overdue' },
  partial: { c: '#5b8af0', bg: 'rgba(91,138,240,.1)',  Icon: Clock,        label: 'Partial' },
}

/* ─── Modal Shell ────────────────────────────────── */
function Modal({ children, maxW = 480, onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(8,12,20,.72)', backdropFilter: 'blur(10px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={e => e.target === e.currentTarget && onClose?.()}>
      <div style={{ width: '100%', maxWidth: maxW, background: 'var(--neu-surface)', boxShadow: '14px 14px 36px var(--neu-shadow-dark), -6px -6px 20px var(--neu-shadow-light)', border: '1px solid var(--neu-border)', borderRadius: '1.5rem', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'neu-slide-up .2s cubic-bezier(.34,1.56,.64,1) both' }}>
        {children}
      </div>
    </div>
  )
}
function MHead({ icon: Icon, title, sub, onClose, iconColor = '#22a06b' }) {
  return (
    <div style={{ padding: '1.3rem 1.5rem', borderBottom: '1px solid var(--neu-border)', display: 'flex', alignItems: 'center', gap: '.75rem' }}>
      <div style={{ width: 38, height: 38, borderRadius: '.75rem', background: `${iconColor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={17} style={{ color: iconColor }} />
      </div>
      <div style={{ flex: 1 }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif' }}>{title}</h2>
        {sub && <p style={{ fontSize: '.72rem', color: 'var(--neu-text-ghost)', marginTop: '.1rem' }}>{sub}</p>}
      </div>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neu-text-ghost)' }}><X size={18} /></button>
    </div>
  )
}
function MFoot({ onClose, onConfirm, confirmLabel, confirmColor = 'linear-gradient(145deg,#22a06b,#1a7d54)', loading }) {
  return (
    <div style={{ padding: '.9rem 1.5rem', borderTop: '1px solid var(--neu-border)', display: 'flex', gap: '.6rem' }}>
      <button onClick={onClose} style={{ ...iS, cursor: 'pointer', textAlign: 'center', fontWeight: 600, color: 'var(--neu-text-secondary)', flex: 1, padding: '.65rem', boxShadow: 'none' }}>Cancel</button>
      <button onClick={onConfirm} disabled={loading} style={{ flex: 1, padding: '.65rem', borderRadius: '.75rem', border: 'none', background: confirmColor, boxShadow: '0 4px 14px rgba(34,160,107,.3)', color: '#fff', fontWeight: 700, fontSize: '.85rem', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? .7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.4rem', fontFamily: "'DM Sans',sans-serif" }}>
        {loading && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}{confirmLabel}
      </button>
    </div>
  )
}

/* ─── View Modal ─────────────────────────────────── */
function ViewModal({ voucher: v, onClose, onPay }) {
  const sc = STATUS_CFG[v.status] || STATUS_CFG.unpaid
  const tile = { background: 'var(--neu-surface-deep)', borderRadius: '.8rem', padding: '.7rem 1rem', boxShadow: 'inset 2px 2px 5px var(--neu-shadow-dark), inset -1px -1px 4px var(--neu-shadow-light)' }
  const pct  = v.total_due > 0 ? Math.min(((v.total_paid || 0) / v.total_due) * 100, 100) : 0
  return (
    <Modal onClose={onClose}>
      <MHead icon={sc.Icon} title="Voucher Detail" sub={v.voucher_number} onClose={onClose} iconColor={sc.c} />
      <div style={{ padding: '1.1rem 1.4rem', display: 'flex', flexDirection: 'column', gap: '.5rem', overflowY: 'auto' }}>
        {/* Student */}
        <div style={tile}>
          <p style={{ fontSize: '.62rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.3rem' }}>Student</p>
          <p style={{ fontSize: '.92rem', fontWeight: 700, color: 'var(--neu-text-primary)' }}>{v.student_name}</p>
          <p style={{ fontSize: '.7rem', color: 'var(--neu-text-ghost)', fontFamily: 'monospace' }}>{v.roll_number}</p>
        </div>

        {/* Amount tiles */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '.5rem' }}>
          {[
            { label: 'Base Amount',  value: formatCurrency(v.amount),      c: '#5b8af0' },
            { label: 'Fine',         value: v.fine_amount > 0 ? formatCurrency(v.fine_amount) : '—', c: '#f97316' },
            { label: 'Total Due',    value: formatCurrency(v.total_due),   c: 'var(--neu-text-primary)' },
          ].map(r => (
            <div key={r.label} style={{ ...tile, textAlign: 'center' }}>
              <p style={{ fontSize: '.6rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.2rem' }}>{r.label}</p>
              <p style={{ fontSize: '.92rem', fontWeight: 800, color: r.c, fontFamily: 'Outfit,sans-serif' }}>{r.value}</p>
            </div>
          ))}
        </div>

        {/* Payment bar */}
        <div style={tile}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.5rem' }}>
            <span style={{ fontSize: '.68rem', fontWeight: 700, color: 'var(--neu-text-ghost)' }}>Payment Progress</span>
            <span style={{ fontSize: '.68rem', fontWeight: 800, color: sc.c }}>{pct.toFixed(0)}% paid</span>
          </div>
          <div style={{ height: 7, background: 'var(--neu-border)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: sc.c, borderRadius: 99, transition: 'width .5s ease' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '.4rem' }}>
            <span style={{ fontSize: '.68rem', color: 'var(--neu-text-ghost)' }}>Paid: {formatCurrency(v.total_paid || 0)}</span>
            <span style={{ fontSize: '.68rem', color: 'var(--neu-text-ghost)' }}>Remaining: {formatCurrency(Math.max((v.total_due || 0) - (v.total_paid || 0), 0))}</span>
          </div>
        </div>

        {/* Status + due date */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem' }}>
          <div style={tile}>
            <p style={{ fontSize: '.6rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.3rem' }}>Status</p>
            <span style={{ fontSize: '.75rem', fontWeight: 800, padding: '.25rem .65rem', background: sc.bg, color: sc.c, borderRadius: '.45rem', display: 'inline-block' }}>{sc.label}</span>
          </div>
          <div style={tile}>
            <p style={{ fontSize: '.6rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.3rem' }}>Due Date</p>
            <p style={{ fontSize: '.88rem', fontWeight: 700, color: new Date(v.due_date) < new Date() && v.status !== 'paid' ? '#ef4444' : 'var(--neu-text-primary)' }}>{formatDate(v.due_date)}</p>
          </div>
        </div>

        {/* Fee breakdown */}
        {(v.tuition_fee || v.admission_fee || v.library_fee) && (
          <div style={tile}>
            <p style={{ fontSize: '.62rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.5rem' }}>Fee Breakdown</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.3rem' }}>
              {[
                { label: 'Tuition',   val: v.tuition_fee   },
                { label: 'Admission', val: v.admission_fee },
                { label: 'Library',   val: v.library_fee   },
                { label: 'Sports',    val: v.sports_fee    },
              ].filter(f => f.val > 0).map(f => (
                <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.78rem' }}>
                  <span style={{ color: 'var(--neu-text-muted)' }}>{f.label} Fee</span>
                  <span style={{ fontWeight: 700, color: 'var(--neu-text-primary)' }}>{formatCurrency(f.val)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: '.9rem 1.4rem', borderTop: '1px solid var(--neu-border)', display: 'flex', gap: '.6rem' }}>
        <button onClick={onClose} style={{ ...iS, cursor: 'pointer', textAlign: 'center', fontWeight: 600, color: 'var(--neu-text-secondary)', flex: 1, padding: '.65rem', boxShadow: 'none' }}>Close</button>
        {v.status !== 'paid' && (
          <button onClick={() => { onClose(); onPay(v) }} style={{ flex: 1, padding: '.65rem', borderRadius: '.75rem', border: 'none', background: 'linear-gradient(145deg,#22a06b,#1a7d54)', boxShadow: '0 4px 14px rgba(34,160,107,.35)', color: '#fff', fontWeight: 700, fontSize: '.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.45rem', fontFamily: "'DM Sans',sans-serif" }}>
            <DollarSign size={14} />Record Payment
          </button>
        )}
      </div>
    </Modal>
  )
}

/* ─── Pay Modal ──────────────────────────────────── */
function PayModal({ voucher: v, onClose, onSuccess }) {
  const remaining = (v.total_due || 0) - (v.total_paid || 0)
  const [form, setForm] = useState({
    amount_paid: remaining > 0 ? remaining : v.total_due,
    payment_method: 'bank_transfer',
    reference_number: '', bank_name: '', receipt_number: '',
    payment_date: new Date().toISOString().split('T')[0],
  })
  const [loading, setLoading] = useState(false)
  const set = (k, val) => setForm(p => ({ ...p, [k]: val }))

  const submit = async () => {
    if (!form.amount_paid || !form.reference_number) { toast.error('Amount & reference required'); return }
    setLoading(true)
    try { await adminAPI.payVoucher(v.id, form); toast.success('Payment recorded!'); onSuccess(); onClose() }
    catch (e) { toast.error(e.response?.data?.message || 'Failed') }
    finally { setLoading(false) }
  }

  return (
    <Modal onClose={onClose}>
      <MHead icon={DollarSign} title="Record Payment" sub={v.voucher_number} onClose={onClose} />
      <div style={{ padding: '1.2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '.8rem', overflowY: 'auto' }}>

        {/* Summary */}
        <div style={{ padding: '.85rem 1rem', borderRadius: '.9rem', background: 'rgba(91,138,240,.07)', border: '1px solid rgba(91,138,240,.18)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.3rem', fontSize: '.8rem' }}>
            <span style={{ color: 'var(--neu-text-muted)' }}>Total Due</span>
            <span style={{ fontWeight: 700, color: 'var(--neu-text-primary)' }}>{formatCurrency(v.total_due)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.3rem', fontSize: '.8rem' }}>
            <span style={{ color: 'var(--neu-text-muted)' }}>Already Paid</span>
            <span style={{ fontWeight: 700, color: '#22a06b' }}>{formatCurrency(v.total_paid || 0)}</span>
          </div>
          <div style={{ borderTop: '1px solid rgba(91,138,240,.2)', paddingTop: '.3rem', display: 'flex', justifyContent: 'space-between', fontSize: '.85rem' }}>
            <span style={{ fontWeight: 700, color: 'var(--neu-text-primary)' }}>Remaining</span>
            <span style={{ fontWeight: 800, color: '#ef4444', fontFamily: 'Outfit,sans-serif' }}>{formatCurrency(remaining)}</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
          <F label="Amount Paid *"><input style={iS} type="number" value={form.amount_paid} onChange={e => set('amount_paid', e.target.value)} /></F>
          <F label="Payment Method">
            <select style={iS} value={form.payment_method} onChange={e => set('payment_method', e.target.value)}>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cash">Cash</option>
              <option value="cheque">Cheque</option>
              <option value="online">Online</option>
            </select>
          </F>
        </div>
        <F label="Reference Number *"><input style={iS} value={form.reference_number} onChange={e => set('reference_number', e.target.value)} placeholder="TXN-2025-001" /></F>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
          <F label="Bank Name"><input style={iS} value={form.bank_name} onChange={e => set('bank_name', e.target.value)} placeholder="e.g. HBL" /></F>
          <F label="Receipt Number"><input style={iS} value={form.receipt_number} onChange={e => set('receipt_number', e.target.value)} placeholder="RCP-001" /></F>
        </div>
        <F label="Payment Date"><input style={iS} type="date" value={form.payment_date} onChange={e => set('payment_date', e.target.value)} /></F>
      </div>
      <MFoot onClose={onClose} onConfirm={submit} confirmLabel="Record Payment" loading={loading} />
    </Modal>
  )
}

/* ─── Generate Voucher Modal ─────────────────────── */
function GenerateModal({ onClose, onSuccess }) {
  const [students,     setStudents]     = useState([])
  const [semesters,    setSemesters]    = useState([])
  const [form,         setForm]         = useState({ student_id: '', semester_id: '', due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] })
  const [loading,      setLoading]      = useState(false)
  const [loadingData,  setLoadingData]  = useState(true)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  useEffect(() => {
    Promise.all([adminAPI.getStudents(1, 200), adminAPI.getSemesters()])
      .then(([s, sem]) => { setStudents(s.data.data?.students || []); setSemesters(sem.data.data?.semesters || []) })
      .finally(() => setLoadingData(false))
  }, [])

  const submit = async () => {
    if (!form.student_id || !form.semester_id || !form.due_date) { toast.error('All fields required'); return }
    setLoading(true)
    try { await adminAPI.createVoucher(form); toast.success('Voucher generated!'); onSuccess(); onClose() }
    catch (e) { toast.error(e.response?.data?.message || 'Failed') }
    finally { setLoading(false) }
  }

  return (
    <Modal onClose={onClose} maxW={440}>
      <MHead icon={Plus} title="Generate Voucher" onClose={onClose} iconColor="#5b8af0" />
      <div style={{ padding: '1.2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '.8rem' }}>
        {loadingData ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><Loader2 size={24} style={{ color: '#5b8af0', animation: 'spin 1s linear infinite' }} /></div>
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
      <MFoot onClose={onClose} onConfirm={submit} confirmLabel="Generate" confirmColor="linear-gradient(145deg,#5b8af0,#3a6bd4)" loading={loading || loadingData} />
    </Modal>
  )
}

/* ─── Voucher Row ────────────────────────────────── */
function VoucherRow({ v, onView, onPay }) {
  const sc        = STATUS_CFG[v.status] || STATUS_CFG.unpaid
  const isPastDue = new Date(v.due_date) < new Date() && v.status !== 'paid'
  const pct       = v.total_due > 0 ? Math.min(((v.total_paid || 0) / v.total_due) * 100, 100) : 0
  const { onContextMenu, menuState, closeMenu } = useContextMenu()

  const menuItems = [
    { label: 'View Details',    icon: Eye,        onClick: () => onView(v) },
    ...(v.status !== 'paid' ? [{ label: 'Record Payment', icon: DollarSign, onClick: () => onPay(v) }] : []),
  ]

  return (
    <>
      <div className={`vchr-row st-${v.status}`} onContextMenu={onContextMenu}>
        {/* Voucher No */}
        <span style={{ fontSize: '.72rem', fontWeight: 800, color: '#5b8af0', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.voucher_number}</span>

        {/* Student */}
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: '.84rem', fontWeight: 600, color: 'var(--neu-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.student_name}</p>
          <p style={{ fontSize: '.64rem', color: 'var(--neu-text-ghost)', fontFamily: 'monospace' }}>{v.roll_number}</p>
        </div>

        {/* Amount */}
        <span style={{ fontSize: '.82rem', fontWeight: 700, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif' }}>{formatCurrency(v.total_due)}</span>

        {/* Fine */}
        {v.fine_amount > 0
          ? <span style={{ fontSize: '.78rem', fontWeight: 700, color: '#f97316', fontFamily: 'Outfit,sans-serif' }}>{formatCurrency(v.fine_amount)}</span>
          : <span style={{ fontSize: '.72rem', color: 'var(--neu-text-ghost)', opacity: .4 }}>—</span>}

        {/* Progress bar */}
        <div>
          <div style={{ height: 5, background: 'var(--neu-surface-deep)', borderRadius: 99, overflow: 'hidden', boxShadow: 'inset 1px 1px 3px var(--neu-shadow-dark)', marginBottom: '.2rem' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: sc.c, borderRadius: 99 }} />
          </div>
          <span style={{ fontSize: '.6rem', color: 'var(--neu-text-ghost)' }}>{pct.toFixed(0)}% paid</span>
        </div>

        {/* Due date */}
        <span style={{ fontSize: '.72rem', fontWeight: 600, color: isPastDue ? '#ef4444' : 'var(--neu-text-muted)' }}>{formatDate(v.due_date)}</span>

        {/* Status badge */}
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '.3rem', fontSize: '.65rem', fontWeight: 800, padding: '.2rem .55rem', background: sc.bg, color: sc.c, borderRadius: '.4rem' }}>
          <sc.Icon size={11} />{sc.label}
        </span>

        {/* Pay button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          {v.status !== 'paid' && (
            <button onClick={() => onPay(v)} style={{ display: 'flex', alignItems: 'center', gap: '.3rem', padding: '.3rem .7rem', background: 'rgba(34,160,107,.1)', border: '1px solid rgba(34,160,107,.25)', borderRadius: '.55rem', color: '#22a06b', fontWeight: 700, fontSize: '.72rem', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", transition: 'all .14s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(34,160,107,.2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(34,160,107,.1)'}>
              <DollarSign size={11} />Pay
            </button>
          )}
        </div>

        <span className="rc-hint">⊞ right-click</span>
      </div>
      <ContextMenu state={menuState} onClose={closeMenu} items={menuItems} />
    </>
  )
}

/* ═══════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════ */
export default function FeeVouchersPage() {
  const [vouchers,        setVouchers]        = useState([])
  const [pagination,      setPagination]      = useState({ total: 0, page: 1, per_page: 20, total_pages: 1 })
  const [loading,         setLoading]         = useState(true)
  const [filterStatus,    setFilterStatus]    = useState('')
  const [search,          setSearch]          = useState('')
  const [payVoucher,      setPayVoucher]      = useState(null)
  const [viewVoucher,     setViewVoucher]     = useState(null)
  const [showGenerate,    setShowGenerate]    = useState(false)
  const [updatingOverdue, setUpdatingOverdue] = useState(false)

  const fetchVouchers = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const params = { page, per_page: 20 }
      if (filterStatus) params.status = filterStatus
      const res = await adminAPI.getVouchers(params)
      setVouchers(res.data.data?.vouchers || [])
      setPagination(res.data.data?.pagination || { total: 0, page: 1, per_page: 20, total_pages: 1 })
    } catch { toast.error('Failed to load vouchers') }
    finally { setLoading(false) }
  }, [filterStatus])

  useEffect(() => { fetchVouchers() }, [filterStatus])

  const handleUpdateOverdue = async () => {
    setUpdatingOverdue(true)
    try { const res = await adminAPI.updateOverdueVouchers(); toast.success(`${res.data.data?.updated_count || 0} vouchers updated`); fetchVouchers() }
    catch { toast.error('Failed to update overdue') }
    finally { setUpdatingOverdue(false) }
  }

  const filtered = vouchers.filter(v => !search || v.student_name?.toLowerCase().includes(search.toLowerCase()) || v.voucher_number?.toLowerCase().includes(search.toLowerCase()))

  const stats = {
    paid:    vouchers.filter(v => v.status === 'paid').length,
    unpaid:  vouchers.filter(v => v.status === 'unpaid').length,
    overdue: vouchers.filter(v => v.status === 'overdue').length,
    partial: vouchers.filter(v => v.status === 'partial').length,
  }

  const totalCollected = vouchers.filter(v => v.status === 'paid').reduce((s, v) => s + parseFloat(v.total_due || 0), 0)

  return (
    <>
      <style>{CSS}</style>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.3rem', paddingBottom: '2rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.7rem' }}>
            <div style={{ width: 42, height: 42, borderRadius: '.9rem', background: 'linear-gradient(145deg,rgba(34,160,107,.18),rgba(34,160,107,.08))', boxShadow: '5px 5px 14px var(--neu-shadow-dark), -3px -3px 10px var(--neu-shadow-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CreditCard size={20} style={{ color: '#22a06b' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', letterSpacing: '-.02em' }}>Fee Vouchers</h1>
              <p style={{ fontSize: '.78rem', color: 'var(--neu-text-ghost)', marginTop: 2 }}>{pagination.total} total vouchers</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '.6rem', flexWrap: 'wrap' }}>
            <button onClick={() => setShowGenerate(true)} style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.6rem 1.1rem', background: 'linear-gradient(145deg,#5b8af0,#3a6bd4)', boxShadow: '0 4px 14px rgba(91,138,240,.35), 5px 5px 12px var(--neu-shadow-dark)', borderRadius: '.85rem', border: 'none', color: '#fff', fontWeight: 700, fontSize: '.8rem', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>
              <Plus size={14} />Generate
            </button>
            <button onClick={handleUpdateOverdue} disabled={updatingOverdue} style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.6rem 1.1rem', background: 'linear-gradient(145deg,#f97316,#ea6c00)', boxShadow: '0 4px 14px rgba(249,115,22,.3), 5px 5px 12px var(--neu-shadow-dark)', borderRadius: '.85rem', border: 'none', color: '#fff', fontWeight: 700, fontSize: '.8rem', cursor: updatingOverdue ? 'not-allowed' : 'pointer', opacity: updatingOverdue ? .7 : 1, fontFamily: "'DM Sans',sans-serif" }}>
              {updatingOverdue ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <AlertTriangle size={14} />}Update Overdue
            </button>
          </div>
        </div>

        {/* KPI tiles */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '.75rem' }}>
          {[
            { label: 'Paid',       value: stats.paid,       c: '#22a06b', bg: 'rgba(34,160,107,.1)',  Icon: CheckCircle2  },
            { label: 'Unpaid',     value: stats.unpaid,     c: '#ef4444', bg: 'rgba(239,68,68,.1)',   Icon: Clock         },
            { label: 'Overdue',    value: stats.overdue,    c: '#f97316', bg: 'rgba(249,115,22,.1)',  Icon: AlertTriangle },
            { label: 'Collected',  value: formatCurrency(totalCollected), c: '#5b8af0', bg: 'rgba(91,138,240,.1)',  Icon: DollarSign },
          ].map(t => (
            <div key={t.label} style={{ background: 'var(--neu-surface)', border: '1px solid var(--neu-border)', borderRadius: '1rem', padding: '.9rem 1.1rem', boxShadow: '6px 6px 16px var(--neu-shadow-dark), -3px -3px 10px var(--neu-shadow-light)', display: 'flex', alignItems: 'center', gap: '.75rem' }}>
              <div style={{ width: 38, height: 38, borderRadius: '.75rem', background: t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <t.Icon size={17} style={{ color: t.c }} />
              </div>
              <div>
                <p style={{ fontSize: '.65rem', color: 'var(--neu-text-ghost)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em' }}>{t.label}</p>
                <p style={{ fontSize: '1.25rem', fontWeight: 800, color: t.c, fontFamily: 'Outfit,sans-serif', lineHeight: 1.1, marginTop: '.1rem' }}>{t.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filter bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem', flexWrap: 'wrap' }}>
          {/* Status pills */}
          {[
            { key: '',        label: 'All',     count: pagination.total },
            { key: 'paid',    label: 'Paid',    count: stats.paid       },
            { key: 'unpaid',  label: 'Unpaid',  count: stats.unpaid     },
            { key: 'overdue', label: 'Overdue', count: stats.overdue    },
            { key: 'partial', label: 'Partial', count: stats.partial    },
          ].map(p => (
            <button key={p.key} onClick={() => setFilterStatus(p.key)} className={`stat-pill ${filterStatus === p.key ? `act-${p.key || 'all'}` : ''}`}>
              {p.label}
              <span style={{ fontSize: '.68rem', fontWeight: 800, opacity: .8 }}>{p.count}</span>
            </button>
          ))}

          {/* Search */}
          <div style={{ marginLeft: 'auto', position: 'relative', width: 200 }}>
            <Search size={13} style={{ position: 'absolute', top: '50%', left: 10, transform: 'translateY(-50%)', color: 'var(--neu-text-ghost)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Student or voucher…" style={{ ...iS, paddingLeft: '2rem', width: '100%' }} />
          </div>
        </div>

        {/* Main table card */}
        <div style={{ background: 'var(--neu-surface)', border: '1px solid var(--neu-border)', borderRadius: '1.25rem', overflow: 'hidden', boxShadow: '6px 6px 16px var(--neu-shadow-dark), -3px -3px 10px var(--neu-shadow-light)' }}>

          {/* Table header */}
          <div style={{ padding: '.55rem 1rem', borderBottom: '1px solid var(--neu-border)', background: 'var(--neu-surface-deep)', display: 'grid', gridTemplateColumns: '130px 2fr 90px 70px 100px 90px 110px 80px', gap: '.5rem' }}>
            {['Voucher #', 'Student', 'Total Due', 'Fine', 'Progress', 'Due Date', 'Status', 'Action'].map(h => (
              <span key={h} style={{ fontSize: '.6rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{h}</span>
            ))}
          </div>

          {/* Rows */}
          <div style={{ padding: '.4rem .5rem', display: 'flex', flexDirection: 'column', gap: '.15rem', minHeight: 200 }}>
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
              <VoucherRow key={v.id} v={v} onView={setViewVoucher} onPay={setPayVoucher} />
            ))}
          </div>

          {/* Pagination */}
          {pagination.total_pages > 1 && (
            <div style={{ padding: '.7rem 1rem', borderTop: '1px solid var(--neu-border)', background: 'var(--neu-surface-deep)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '.72rem', color: 'var(--neu-text-ghost)' }}>Page {pagination.page} of {pagination.total_pages} ({pagination.total} records)</span>
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

        {/* Modals */}
        {payVoucher   && <PayModal      voucher={payVoucher}  onClose={() => setPayVoucher(null)}  onSuccess={() => fetchVouchers(pagination.page)} />}
        {viewVoucher  && <ViewModal     voucher={viewVoucher} onClose={() => setViewVoucher(null)} onPay={setPayVoucher} />}
        {showGenerate && <GenerateModal onClose={() => setShowGenerate(false)} onSuccess={() => fetchVouchers(1)} />}
      </div>
    </>
  )
}