import { useState, useEffect, useMemo } from 'react'
import {
  Plus, DollarSign, Loader2, Edit2, Trash2, Eye, X,
  TrendingUp, BookOpen, Layers, Search,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { adminAPI } from '../../api/admin.api'
import AddButton from '../../components/ui/AddButton'
import { useContextMenu, ContextMenu } from '../../hooks/useContextMenu'

/* ─── CSS ────────────────────────────────────────── */
const CSS = `
  .fee-row {
    display: grid;
    grid-template-columns: 80px 1fr 1fr 1fr 1fr 1fr 1fr;
    align-items: center;
    gap: .5rem;
    padding: .85rem 1.1rem;
    border-radius: .85rem;
    cursor: context-menu;
    user-select: none;
    transition: background .15s ease, transform .18s ease;
    border: 1px solid transparent;
  }
  .fee-row:hover {
    background: var(--neu-surface-deep);
    border-color: var(--neu-border);
    transform: translateX(3px);
  }
`

const iS = {
  width: '100%', background: 'var(--neu-surface-deep)',
  boxShadow: 'inset 3px 3px 7px var(--neu-shadow-dark), inset -2px -2px 5px var(--neu-shadow-light)',
  border: '1px solid var(--neu-border)', borderRadius: '.75rem',
  padding: '.6rem .9rem', fontSize: '.85rem', color: 'var(--neu-text-primary)',
  outline: 'none', fontFamily: "'DM Sans',sans-serif",
}
const F = ({ label, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '.35rem' }}>
    <label style={{ fontSize: '.68rem', fontWeight: 700, color: 'var(--neu-text-ghost)', letterSpacing: '.06em', textTransform: 'uppercase' }}>{label}</label>
    {children}
  </div>
)

const formatCurrency = v => {
  const n = parseFloat(v) || 0
  return n === 0 ? '—' : `Rs. ${n.toLocaleString()}`
}

const PROGRAM_ACCENTS = [
  { c: '#5b8af0', bg: 'rgba(91,138,240,.1)',  bd: 'rgba(91,138,240,.2)' },
  { c: '#22a06b', bg: 'rgba(34,160,107,.1)',  bd: 'rgba(34,160,107,.2)' },
  { c: '#9b59b6', bg: 'rgba(155,89,182,.1)',  bd: 'rgba(155,89,182,.2)' },
  { c: '#f97316', bg: 'rgba(249,115,22,.1)',  bd: 'rgba(249,115,22,.2)' },
  { c: '#06b6d4', bg: 'rgba(6,182,212,.1)',   bd: 'rgba(6,182,212,.2)'  },
  { c: '#f59e0b', bg: 'rgba(245,158,11,.1)',  bd: 'rgba(245,158,11,.2)' },
]

/* ─── Modal Shell ────────────────────────────────── */
function Modal({ children, maxW = 480 }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(8,12,20,.7)', backdropFilter: 'blur(10px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: maxW, background: 'var(--neu-surface)', boxShadow: '14px 14px 36px var(--neu-shadow-dark), -6px -6px 20px var(--neu-shadow-light)', border: '1px solid var(--neu-border)', borderRadius: '1.5rem', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'neu-slide-up .2s cubic-bezier(.34,1.56,.64,1) both' }}>
        {children}
      </div>
    </div>
  )
}

/* ─── View Modal ─────────────────────────────────── */
function ViewModal({ structure, pal, onClose }) {
  const otherTotal = (structure.other_fees || []).reduce((s, f) => s + parseFloat(f.amount || 0), 0)
  const total = [structure.tuition_fee, structure.admission_fee, structure.library_fee, structure.sports_fee, otherTotal]
    .reduce((s, v) => s + (parseFloat(v) || 0), 0)

  const fees = [
    { label: 'Tuition Fee',   value: structure.tuition_fee },
    { label: 'Admission Fee', value: structure.admission_fee },
    { label: 'Library Fee',   value: structure.library_fee },
    { label: 'Sports Fee',    value: structure.sports_fee },
    ...(structure.other_fees || []).map(f => ({ label: f.name, value: f.amount })),
  ].filter(f => parseFloat(f.value) > 0)

  return (
    <Modal maxW={440}>
      <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--neu-border)', display: 'flex', alignItems: 'center', gap: '.85rem' }}>
        <div style={{ width: 50, height: 50, borderRadius: '1rem', background: pal.bg, border: `1px solid ${pal.bd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <DollarSign size={22} style={{ color: pal.c }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', lineHeight: 1.2 }}>{structure.program_name}</h2>
          <span style={{ display: 'inline-block', marginTop: '.3rem', fontSize: '.65rem', fontWeight: 800, padding: '.15rem .55rem', background: pal.bg, color: pal.c, border: `1px solid ${pal.bd}`, borderRadius: '.4rem' }}>Semester {structure.semester_number}</span>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neu-text-ghost)', padding: '.25rem' }}><X size={18} /></button>
      </div>

      <div style={{ padding: '1.1rem 1.4rem', display: 'flex', flexDirection: 'column', gap: '.5rem', overflowY: 'auto' }}>
        {fees.map(f => (
          <div key={f.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '.7rem 1rem', background: 'var(--neu-surface-deep)', borderRadius: '.8rem', boxShadow: 'inset 2px 2px 5px var(--neu-shadow-dark), inset -1px -1px 4px var(--neu-shadow-light)' }}>
            <span style={{ fontSize: '.83rem', color: 'var(--neu-text-muted)', fontWeight: 500 }}>{f.label}</span>
            <span style={{ fontSize: '.83rem', color: 'var(--neu-text-primary)', fontWeight: 700 }}>{formatCurrency(f.value)}</span>
          </div>
        ))}

        {/* Total */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '.85rem 1rem', background: `${pal.bg}`, border: `1.5px solid ${pal.bd}`, borderRadius: '.8rem', marginTop: '.25rem' }}>
          <span style={{ fontSize: '.85rem', color: pal.c, fontWeight: 700 }}>Total per Semester</span>
          <span style={{ fontSize: '1.05rem', color: pal.c, fontWeight: 800, fontFamily: 'Outfit,sans-serif' }}>Rs. {total.toLocaleString()}</span>
        </div>

        {structure.valid_from && (
          <div style={{ padding: '.65rem 1rem', background: 'var(--neu-surface-deep)', borderRadius: '.8rem', boxShadow: 'inset 2px 2px 5px var(--neu-shadow-dark), inset -1px -1px 4px var(--neu-shadow-light)' }}>
            <p style={{ fontSize: '.62rem', fontWeight: 700, color: 'var(--neu-text-ghost)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: '.2rem' }}>Valid From</p>
            <p style={{ fontSize: '.83rem', color: 'var(--neu-text-primary)', fontWeight: 500 }}>{new Date(structure.valid_from).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
          </div>
        )}
      </div>

      <div style={{ padding: '.9rem 1.4rem', borderTop: '1px solid var(--neu-border)' }}>
        <button onClick={onClose} style={{ ...iS, cursor: 'pointer', textAlign: 'center', fontWeight: 600, color: 'var(--neu-text-secondary)', padding: '.6rem' }}>Close</button>
      </div>
    </Modal>
  )
}

/* ─── Fee Structure Form Modal ───────────────────── */
function FeeModal({ structure, programs, onClose, onSuccess }) {
  const isEdit = !!structure?.id
  const [form, setForm] = useState({
    program_id:      structure?.program_id      || '',
    semester_number: structure?.semester_number || 1,
    tuition_fee:     structure?.tuition_fee     || 35000,
    admission_fee:   structure?.admission_fee   || 0,
    library_fee:     structure?.library_fee     || 1000,
    sports_fee:      structure?.sports_fee      || 500,
    other_fees:      structure?.other_fees      || [],
    valid_from:      structure?.valid_from      ? structure.valid_from.slice(0, 10) : new Date().toISOString().slice(0, 10),
  })
  const [newFee,  setNewFee]  = useState({ name: '', amount: '' })
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const total = [form.tuition_fee, form.admission_fee, form.library_fee, form.sports_fee]
    .reduce((s, v) => s + (parseFloat(v) || 0), 0)
    + (form.other_fees || []).reduce((s, f) => s + parseFloat(f.amount || 0), 0)

  const addOther = () => {
    if (!newFee.name || !newFee.amount) return
    set('other_fees', [...(form.other_fees || []), { name: newFee.name, amount: parseFloat(newFee.amount) }])
    setNewFee({ name: '', amount: '' })
  }
  const removeOther = i => set('other_fees', form.other_fees.filter((_, idx) => idx !== i))

  const submit = async () => {
    if (!form.program_id) { toast.error('Program required'); return }
    if (!form.tuition_fee || form.tuition_fee <= 0) { toast.error('Tuition fee required'); return }
    setLoading(true)
    try {
      isEdit ? await adminAPI.updateFeeStructure(structure.id, form) : await adminAPI.createFeeStructure(form)
      toast.success(isEdit ? 'Fee structure updated!' : 'Fee structure created!')
      onSuccess(); onClose()
    } catch (e) { toast.error(e.response?.data?.message || 'Failed') }
    finally { setLoading(false) }
  }

  return (
    <Modal maxW={520}>
      <div style={{ padding: '1.4rem 1.5rem', borderBottom: '1px solid var(--neu-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem' }}>
          <div style={{ width: 34, height: 34, borderRadius: '.65rem', background: 'rgba(34,160,107,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><DollarSign size={15} style={{ color: '#22a06b' }} /></div>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif' }}>{isEdit ? 'Edit Fee Structure' : 'Add Fee Structure'}</h2>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neu-text-ghost)' }}><X size={18} /></button>
      </div>

      <div style={{ padding: '1.2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '.85rem', overflowY: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.8rem' }}>
          <F label="Program *">
            <select style={iS} value={form.program_id} onChange={e => set('program_id', Number(e.target.value))} disabled={isEdit}>
              <option value="">— Select Program —</option>
              {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </F>
          <F label="Semester *">
            <select style={iS} value={form.semester_number} onChange={e => set('semester_number', Number(e.target.value))} disabled={isEdit}>
              {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>Semester {n}</option>)}
            </select>
          </F>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.8rem' }}>
          <F label="Tuition Fee (Rs.) *"><input style={iS} type="number" value={form.tuition_fee} onChange={e => set('tuition_fee', parseFloat(e.target.value) || 0)} /></F>
          <F label="Admission Fee (Rs.)"><input style={iS} type="number" value={form.admission_fee} onChange={e => set('admission_fee', parseFloat(e.target.value) || 0)} /></F>
          <F label="Library Fee (Rs.)"><input style={iS} type="number" value={form.library_fee} onChange={e => set('library_fee', parseFloat(e.target.value) || 0)} /></F>
          <F label="Sports Fee (Rs.)"><input style={iS} type="number" value={form.sports_fee} onChange={e => set('sports_fee', parseFloat(e.target.value) || 0)} /></F>
        </div>

        {/* Other fees */}
        <div>
          <label style={{ fontSize: '.68rem', fontWeight: 700, color: 'var(--neu-text-ghost)', letterSpacing: '.06em', textTransform: 'uppercase', display: 'block', marginBottom: '.5rem' }}>Other Fees</label>
          {(form.other_fees || []).map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.4rem', padding: '.55rem .75rem', background: 'var(--neu-surface-deep)', borderRadius: '.7rem', boxShadow: 'inset 2px 2px 5px var(--neu-shadow-dark), inset -1px -1px 4px var(--neu-shadow-light)' }}>
              <span style={{ flex: 1, fontSize: '.83rem', color: 'var(--neu-text-primary)', fontWeight: 500 }}>{f.name}</span>
              <span style={{ fontSize: '.83rem', color: '#22a06b', fontWeight: 700 }}>Rs. {parseFloat(f.amount).toLocaleString()}</span>
              <button onClick={() => removeOther(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '.1rem', display: 'flex' }}><X size={14} /></button>
            </div>
          ))}
          <div style={{ display: 'flex', gap: '.5rem', marginTop: '.35rem' }}>
            <input style={{ ...iS, flex: 1 }} value={newFee.name} onChange={e => setNewFee(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Lab Fee" />
            <input style={{ ...iS, width: 110 }} type="number" value={newFee.amount} onChange={e => setNewFee(p => ({ ...p, amount: e.target.value }))} placeholder="Amount" />
            <button onClick={addOther} style={{ width: 36, height: 36, borderRadius: '.65rem', background: 'var(--neu-surface-deep)', border: '1px solid var(--neu-border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--neu-text-secondary)', boxShadow: '3px 3px 7px var(--neu-shadow-dark), -2px -2px 5px var(--neu-shadow-light)', flexShrink: 0 }}><Plus size={14} /></button>
          </div>
        </div>

        {/* Total */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '.85rem 1.1rem', background: 'rgba(34,160,107,.08)', border: '1.5px solid rgba(34,160,107,.25)', borderRadius: '.9rem' }}>
          <span style={{ fontSize: '.85rem', color: '#22a06b', fontWeight: 700 }}>Total per Semester</span>
          <span style={{ fontSize: '1.1rem', color: '#22a06b', fontWeight: 800, fontFamily: 'Outfit,sans-serif' }}>Rs. {total.toLocaleString()}</span>
        </div>

        <F label="Valid From *"><input style={iS} type="date" value={form.valid_from} onChange={e => set('valid_from', e.target.value)} /></F>
      </div>

      <div style={{ padding: '.9rem 1.5rem', borderTop: '1px solid var(--neu-border)', display: 'flex', gap: '.6rem' }}>
        <button onClick={onClose} style={{ ...iS, cursor: 'pointer', textAlign: 'center', fontWeight: 600, color: 'var(--neu-text-secondary)', flex: 1, padding: '.6rem' }}>Cancel</button>
        <button onClick={submit} disabled={loading} style={{ flex: 1, padding: '.6rem', borderRadius: '.75rem', border: 'none', background: 'linear-gradient(145deg,#22a06b,#1a7d54)', boxShadow: '0 4px 14px rgba(34,160,107,.35)', color: '#fff', fontWeight: 700, fontSize: '.85rem', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? .7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.4rem', fontFamily: "'DM Sans',sans-serif" }}>
          {loading && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
          {isEdit ? 'Save Changes' : 'Create'}
        </button>
      </div>
    </Modal>
  )
}

/* ─── Delete Modal ───────────────────────────────── */
function DeleteModal({ structure, onClose, onConfirm, loading }) {
  return (
    <Modal maxW={400}>
      <div style={{ padding: '2rem 1.75rem', textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: '1.1rem', background: 'rgba(239,68,68,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.1rem' }}>
          <Trash2 size={24} style={{ color: '#ef4444' }} />
        </div>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', marginBottom: '.4rem' }}>Delete Fee Structure?</h3>
        <p style={{ fontSize: '.82rem', color: 'var(--neu-text-muted)', marginBottom: '1.6rem' }}>
          <strong style={{ color: 'var(--neu-text-primary)' }}>{structure?.program_name}</strong> — Semester {structure?.semester_number}
        </p>
        <div style={{ display: 'flex', gap: '.6rem' }}>
          <button onClick={onClose} style={{ ...iS, cursor: 'pointer', textAlign: 'center', fontWeight: 600, color: 'var(--neu-text-secondary)', flex: 1, padding: '.6rem' }}>Cancel</button>
          <button onClick={onConfirm} disabled={loading} style={{ flex: 1, padding: '.6rem', borderRadius: '.75rem', border: 'none', background: 'linear-gradient(145deg,#f26b6b,#d94f4f)', boxShadow: '0 4px 14px rgba(242,107,107,.3)', color: '#fff', fontWeight: 700, fontSize: '.85rem', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? .7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.4rem', fontFamily: "'DM Sans',sans-serif" }}>
            {loading && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}Delete
          </button>
        </div>
      </div>
    </Modal>
  )
}

/* ═══════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════ */
export default function FeeStructurePage() {
  const [structures,     setStructures]     = useState([])
  const [programs,       setPrograms]       = useState([])
  const [loading,        setLoading]        = useState(true)
  const [filterProgram,  setFilterProgram]  = useState('')
  const [showForm,       setShowForm]       = useState(false)
  const [editTarget,     setEditTarget]     = useState(null)
  const [viewTarget,     setViewTarget]     = useState(null)
  const [delTarget,      setDelTarget]      = useState(null)
  const [deletingId,     setDeletingId]     = useState(null)

  const { menu, open: openMenu, close: closeMenu } = useContextMenu()

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [s, p] = await Promise.all([adminAPI.getFeeStructures(filterProgram || undefined), adminAPI.getPrograms()])
      setStructures(s.data.data?.structures || s.data.data?.fee_structures || [])
      setPrograms(p.data.data?.programs || [])
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchAll() }, [filterProgram])

  const grouped = useMemo(() => {
    const map = {}
    structures.forEach(s => {
      const key = s.program_name || 'Unknown'
      if (!map[key]) map[key] = []
      map[key].push(s)
    })
    return map
  }, [structures])

  const handleDelete = async () => {
  setDeletingId(delTarget.id)
  try {
    await adminAPI.deleteFeeStructure(delTarget.id)
    toast.success('Fee structure deleted')
    setDelTarget(null)
    fetchAll()
  } catch (e) {
    toast.error(e.response?.data?.message || 'Cannot delete')
  } finally {
    setDeletingId(null)
  }
}

  // Get program accent by its position in grouped keys
  const progKeys = Object.keys(grouped)
  const ctxItems = (structure, pal) => [
    { label: 'View Details', icon: Eye,    onClick: s => setViewTarget({ structure: s, pal }) },
    { label: 'Edit',         icon: Edit2,  onClick: s => { setEditTarget(s); setShowForm(true) } },
    { divider: true },
    { label: 'Delete',       icon: Trash2, onClick: s => setDelTarget(s), danger: true },
  ]

  return (
    <>
      <style>{CSS}</style>
      <div style={{ maxWidth: 1050, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.3rem', paddingBottom: '2rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', letterSpacing: '-.02em' }}>Fee Structure</h1>
            <p style={{ fontSize: '.78rem', color: 'var(--neu-text-ghost)', marginTop: 2 }}>Semester-wise fee per program</p>
          </div>
          <AddButton onClick={() => { setEditTarget(null); setShowForm(true) }} tooltip="Add Structure" color="#5b8af0" />

        </div>

        {/* Filter */}
        <div style={{ maxWidth: 260 }}>
          <select value={filterProgram} onChange={e => setFilterProgram(e.target.value)} style={iS}>
            <option value="">All Programs</option>
            {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[1, 2].map(i => (
              <div key={i} style={{ background: 'var(--neu-surface)', border: '1px solid var(--neu-border)', borderRadius: '1.25rem', overflow: 'hidden', boxShadow: '6px 6px 16px var(--neu-shadow-dark)' }}>
                <div style={{ padding: '1rem 1.25rem', background: 'var(--neu-surface-deep)', borderBottom: '1px solid var(--neu-border)' }}>
                  <div style={{ height: 14, background: 'var(--neu-border)', borderRadius: 6, width: '30%', animation: 'pulse 1.5s infinite' }} />
                </div>
                {[1,2,3].map(j => <div key={j} style={{ height: 52, margin: '.5rem', background: 'var(--neu-surface-deep)', borderRadius: '.7rem', animation: 'pulse 1.5s infinite' }} />)}
              </div>
            ))}
          </div>
        ) : structures.length === 0 ? (
          <div style={{ background: 'var(--neu-surface)', border: '1px solid var(--neu-border)', borderRadius: '1.25rem', padding: '5rem 2rem', textAlign: 'center', boxShadow: '6px 6px 16px var(--neu-shadow-dark)' }}>
            <DollarSign size={42} style={{ color: 'var(--neu-text-ghost)', margin: '0 auto 1rem', opacity: .2, display: 'block' }} />
            <p style={{ fontWeight: 600, color: 'var(--neu-text-secondary)' }}>No fee structures configured</p>
            <p style={{ fontSize: '.8rem', color: 'var(--neu-text-ghost)', marginTop: '.35rem', marginBottom: '1.5rem' }}>Each program aur semester ke liye fee add karein</p>
            <button onClick={() => { setEditTarget(null); setShowForm(true) }} style={{ display: 'inline-flex', alignItems: 'center', gap: '.5rem', padding: '.6rem 1.2rem', background: 'linear-gradient(145deg,#22a06b,#1a7d54)', borderRadius: '.8rem', border: 'none', color: '#fff', fontWeight: 700, fontSize: '.82rem', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>
              <Plus size={14} /> Add First Structure
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {progKeys.map((programName, pi) => {
              const pal = PROGRAM_ACCENTS[pi % PROGRAM_ACCENTS.length]
              const items = grouped[programName].sort((a, b) => a.semester_number - b.semester_number)
              const maxTotal = Math.max(...items.map(s => [s.tuition_fee, s.admission_fee, s.library_fee, s.sports_fee, ...(s.other_fees || []).map(f => f.amount)].reduce((t, v) => t + (parseFloat(v) || 0), 0)))

              return (
                <div key={programName} style={{ background: 'var(--neu-surface)', border: '1px solid var(--neu-border)', borderRadius: '1.25rem', overflow: 'hidden', boxShadow: '6px 6px 16px var(--neu-shadow-dark), -3px -3px 10px var(--neu-shadow-light)' }}>
                  {/* Program header */}
                  <div style={{ padding: '1rem 1.25rem', background: 'var(--neu-surface-deep)', borderBottom: '1px solid var(--neu-border)', display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '.7rem', background: pal.bg, border: `1px solid ${pal.bd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Layers size={16} style={{ color: pal.c }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '.9rem', fontWeight: 700, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif' }}>{programName}</h3>
                      <p style={{ fontSize: '.7rem', color: 'var(--neu-text-ghost)' }}>{items.length} semesters configured · right-click rows to manage</p>
                    </div>
                  </div>

                  {/* Column headers */}
                  <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr 1fr 1fr 1fr 1fr', gap: '.5rem', padding: '.55rem 1.1rem', borderBottom: '1px solid var(--neu-border)' }}>
                    {['Sem', 'Tuition', 'Admission', 'Library', 'Sports', 'Other', 'Total'].map(h => (
                      <span key={h} style={{ fontSize: '.62rem', fontWeight: 700, color: 'var(--neu-text-ghost)', letterSpacing: '.06em', textTransform: 'uppercase' }}>{h}</span>
                    ))}
                  </div>

                  {/* Rows */}
                  <div style={{ padding: '.45rem .6rem', display: 'flex', flexDirection: 'column', gap: '.2rem' }}>
                    {items.map(s => {
                      const otherTotal = (s.other_fees || []).reduce((sum, f) => sum + parseFloat(f.amount || 0), 0)
                      const rowTotal   = [s.tuition_fee, s.admission_fee, s.library_fee, s.sports_fee, otherTotal].reduce((t, v) => t + (parseFloat(v) || 0), 0)

                      return (
                        <div
                          key={s.id}
                          className="fee-row"
                          onClick={e => openMenu(e, { ...s, _pal: pal })}
                        >
                          {/* Sem badge */}
                          <div>
                            <span style={{ fontSize: '.7rem', fontWeight: 800, padding: '.2rem .55rem', background: pal.bg, color: pal.c, border: `1px solid ${pal.bd}`, borderRadius: '.45rem', display: 'inline-block' }}>
                              Sem {s.semester_number}
                            </span>
                          </div>

                          {/* Fee cells */}
                          {[
                            s.tuition_fee, s.admission_fee, s.library_fee, s.sports_fee,
                            otherTotal > 0 ? otherTotal : null,
                          ].map((v, ci) => (
                            <span key={ci} style={{ fontSize: '.78rem', color: parseFloat(v) > 0 ? 'var(--neu-text-primary)' : 'var(--neu-text-ghost)', fontWeight: parseFloat(v) > 0 ? 600 : 400 }}>
                              {v != null && parseFloat(v) > 0 ? `Rs. ${parseFloat(v).toLocaleString()}` : '—'}
                            </span>
                          ))}

                          {/* Total */}
                          <span style={{ fontSize: '.8rem', fontWeight: 800, color: pal.c }}>Rs. {rowTotal.toLocaleString()}</span>
                        </div>
                      )
                    })}
                  </div>

                  {/* Valid from note */}
                  {items[0]?.valid_from && (
                    <div style={{ padding: '.55rem 1.25rem', borderTop: '1px solid var(--neu-border)' }}>
                      <span style={{ fontSize: '.68rem', color: 'var(--neu-text-ghost)' }}>Valid from: {new Date(items[0].valid_from).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Context menu */}
        <ContextMenu
          menu={menu}
          close={closeMenu}
          items={menu ? ctxItems(menu.row, menu.row?._pal || PROGRAM_ACCENTS[0]) : []}
        />

        {/* Modals */}
        {viewTarget && <ViewModal structure={viewTarget.structure} pal={viewTarget.pal} onClose={() => setViewTarget(null)} />}
        {showForm   && <FeeModal  structure={editTarget} programs={programs} onClose={() => { setShowForm(false); setEditTarget(null) }} onSuccess={fetchAll} />}
        {delTarget  && <DeleteModal structure={delTarget} onClose={() => setDelTarget(null)} onConfirm={handleDelete} loading={!!deletingId} />}
      </div>
    </>
  )
}