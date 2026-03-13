// ═══════════════════════════════════════════════════════════════
//  SemestersPage.jsx
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect } from 'react'
import { Calendar, CheckCircle2, Loader2, Edit2, Zap, Trash2, Eye, X, Hash, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import { adminAPI } from '../../api/admin.api'
import { useContextMenu, ContextMenu } from '../../hooks/useContextMenu'
import AddButton from '../../components/ui/AddButton'
import { createPortal } from 'react-dom'

/* ─── CSS ─────────────────────────────────── */
const CSS = `
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
  @keyframes spin   { to{transform:rotate(360deg)} }
  @keyframes neu-slide-up { from{opacity:0;transform:translateY(20px) scale(.97)} to{opacity:1;transform:none} }

  .sem-card {
    background: var(--neu-surface);
    border: 1px solid var(--neu-border);
    border-radius: 1.25rem;
    box-shadow: 6px 6px 16px var(--neu-shadow-dark), -3px -3px 10px var(--neu-shadow-light);
    padding: 1.4rem;
    position: relative;
    overflow: hidden;
    cursor: pointer;
    user-select: none;
    transition: box-shadow 0.25s ease, transform 0.25s ease;
  }
  .sem-card:hover {
    transform: translateY(-4px);
    box-shadow: 10px 18px 32px var(--neu-shadow-dark), -4px -4px 14px var(--neu-shadow-light);
  }
  .sem-card:hover .card-accent-border { opacity: 1; }
  .card-accent-border {
    position: absolute; inset: 0; border-radius: 1.25rem;
    pointer-events: none; opacity: 0; transition: opacity 0.25s ease;
  }
`

/* ─── Palette ────────────────────────────── */
const PALETTE = [
  { c: '#5b8af0', ring: 'rgba(91,138,240,.35)'  },
  { c: '#9b59b6', ring: 'rgba(155,89,182,.35)'  },
  { c: '#f97316', ring: 'rgba(249,115,22,.35)'  },
  { c: '#f59e0b', ring: 'rgba(245,158,11,.35)'  },
  { c: '#06b6d4', ring: 'rgba(6,182,212,.35)'   },
  { c: '#ef4444', ring: 'rgba(239,68,68,.35)'   },
]

/* ─── Shared input style ─────────────────── */
const iS = {
  width: '100%', background: 'var(--neu-surface-deep)',
  boxShadow: 'inset 3px 3px 7px var(--neu-shadow-dark), inset -2px -2px 5px var(--neu-shadow-light)',
  border: '1px solid var(--neu-border)', borderRadius: '.75rem',
  padding: '.6rem .9rem', fontSize: '.85rem', color: 'var(--neu-text-primary)',
  outline: 'none', fontFamily: "'DM Sans',sans-serif",
}
const Field = ({ label, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '.35rem' }}>
    <label style={{ fontSize: '.68rem', fontWeight: 700, color: 'var(--neu-text-ghost)', letterSpacing: '.06em', textTransform: 'uppercase' }}>{label}</label>
    {children}
  </div>
)
const toDate = v => v ? v.slice(0, 10) : ''
const fmt = d => d ? new Date(d).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

/* ─── Modal shell ────────────────────────── */
function Modal({ children, maxW = 420 }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(8,12,20,.7)', backdropFilter: 'blur(10px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: maxW, background: 'var(--neu-surface)', boxShadow: '14px 14px 36px var(--neu-shadow-dark), -6px -6px 20px var(--neu-shadow-light)', border: '1px solid var(--neu-border)', borderRadius: '1.5rem', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'neu-slide-up .2s cubic-bezier(.34,1.56,.64,1) both' }}>
        {children}
      </div>
    </div>
  )
}

/* ─── View Modal ─────────────────────────── */
function ViewModal({ sem, pal, onClose }) {
  const rows = [
    { label: 'Code',               value: sem.code },
    { label: 'Start Date',         value: fmt(sem.start_date) },
    { label: 'End Date',           value: fmt(sem.end_date) },
    { label: 'Registration Start', value: fmt(sem.registration_start) },
    { label: 'Registration End',   value: fmt(sem.registration_end) },
    { label: 'Add/Drop Deadline',  value: fmt(sem.add_drop_last_date) },
    { label: 'Status',             value: sem.is_active ? 'Active' : 'Inactive' },
  ].filter(r => r.value && r.value !== '—')

  return (
    <Modal maxW={440}>
      <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--neu-border)', display: 'flex', alignItems: 'center', gap: '.85rem' }}>
        <div style={{ width: 50, height: 50, borderRadius: '1rem', background: sem.is_active ? 'rgba(34,160,107,.12)' : `${pal.c}18`, border: `1px solid ${sem.is_active ? 'rgba(34,160,107,.35)' : pal.ring}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Calendar size={22} style={{ color: sem.is_active ? '#22a06b' : pal.c }} />
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '1.02rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif' }}>{sem.name}</h2>
          {sem.is_active && <span style={{ fontSize: '.68rem', fontWeight: 700, color: '#22a06b', background: 'rgba(34,160,107,.1)', padding: '.15rem .5rem', borderRadius: '.4rem' }}>● Active</span>}
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neu-text-ghost)' }}><X size={18} /></button>
      </div>
      <div style={{ padding: '1.1rem 1.4rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.55rem', overflowY: 'auto' }}>
        {rows.map(r => (
          <div key={r.label} style={{ background: 'var(--neu-surface-deep)', borderRadius: '.8rem', padding: '.75rem 1rem', boxShadow: 'inset 2px 2px 5px var(--neu-shadow-dark), inset -1px -1px 4px var(--neu-shadow-light)' }}>
            <p style={{ fontSize: '.62rem', fontWeight: 700, color: 'var(--neu-text-ghost)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: '.2rem' }}>{r.label}</p>
            <p style={{ fontSize: '.85rem', color: r.label === 'Status' && sem.is_active ? '#22a06b' : 'var(--neu-text-primary)', fontWeight: 500 }}>{r.value}</p>
          </div>
        ))}
      </div>
      <div style={{ padding: '.9rem 1.4rem', borderTop: '1px solid var(--neu-border)' }}>
        <button onClick={onClose} style={{ ...iS, cursor: 'pointer', textAlign: 'center', fontWeight: 600, color: 'var(--neu-text-secondary)', padding: '.6rem' }}>Close</button>
      </div>
    </Modal>
  )
}

/* ─── Semester Form Modal ────────────────── */
function SemesterModal({ sem, onClose, onSuccess }) {
  const isEdit = !!sem?.id
  const [form, setForm] = useState({
    name: sem?.name || '', code: sem?.code || '',
    start_date: toDate(sem?.start_date), end_date: toDate(sem?.end_date),
    registration_start: toDate(sem?.registration_start),
    registration_end: toDate(sem?.registration_end),
    add_drop_last_date: toDate(sem?.add_drop_last_date),
  })
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const submit = async () => {
    if (!form.name || !form.code || !form.start_date || !form.end_date) {
      toast.error('Name, code, start & end date required'); return
    }
    setLoading(true)
    try {
      isEdit ? await adminAPI.updateSemester(sem.id, form) : await adminAPI.createSemester(form)
      toast.success(isEdit ? 'Semester updated!' : 'Semester created!')
      onSuccess(); onClose()
    } catch (e) { toast.error(e.response?.data?.message || 'Failed') }
    finally { setLoading(false) }
  }

  return (
    <Modal maxW={500}>
      <div style={{ padding: '1.4rem 1.5rem', borderBottom: '1px solid var(--neu-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem' }}>
          <div style={{ width: 34, height: 34, borderRadius: '.65rem', background: 'rgba(91,138,240,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Calendar size={15} style={{ color: '#5b8af0' }} /></div>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif' }}>{isEdit ? 'Edit Semester' : 'Add Semester'}</h2>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neu-text-ghost)' }}><X size={18} /></button>
      </div>
      <div style={{ padding: '1.2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '.85rem', overflowY: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.8rem' }}>
          <Field label="Semester Name *"><input style={iS} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Fall 2025" autoFocus /></Field>
          <Field label="Code *"><input style={iS} value={form.code} onChange={e => set('code', e.target.value.toUpperCase())} placeholder="F2025" /></Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.8rem' }}>
          <Field label="Start Date *"><input type="date" style={iS} value={form.start_date} onChange={e => set('start_date', e.target.value)} /></Field>
          <Field label="End Date *"><input type="date" style={iS} value={form.end_date} onChange={e => set('end_date', e.target.value)} /></Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.8rem' }}>
          <Field label="Reg. Start"><input type="date" style={iS} value={form.registration_start} onChange={e => set('registration_start', e.target.value)} /></Field>
          <Field label="Reg. End"><input type="date" style={iS} value={form.registration_end} onChange={e => set('registration_end', e.target.value)} /></Field>
        </div>
        <Field label="Add/Drop Deadline"><input type="date" style={iS} value={form.add_drop_last_date} onChange={e => set('add_drop_last_date', e.target.value)} /></Field>
      </div>
      <div style={{ padding: '.9rem 1.5rem', borderTop: '1px solid var(--neu-border)', display: 'flex', gap: '.6rem' }}>
        <button onClick={onClose} style={{ ...iS, cursor: 'pointer', textAlign: 'center', fontWeight: 600, color: 'var(--neu-text-secondary)', flex: 1, padding: '.6rem' }}>Cancel</button>
        <button onClick={submit} disabled={loading} style={{ flex: 1, padding: '.6rem', borderRadius: '.75rem', border: 'none', background: 'linear-gradient(145deg,#5b8af0,#3a6bd4)', boxShadow: '0 4px 14px rgba(91,138,240,.35)', color: '#fff', fontWeight: 700, fontSize: '.85rem', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? .7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.4rem', fontFamily: "'DM Sans',sans-serif" }}>
          {loading && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
          {isEdit ? 'Save Changes' : 'Create'}
        </button>
      </div>
    </Modal>
  )
}

/* ─── Delete Modal ───────────────────────── */
function DeleteModal({ sem, onClose, onConfirm, loading }) {
  return (
    <Modal maxW={400}>
      <div style={{ padding: '2rem 1.75rem', textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: '1.1rem', background: 'rgba(239,68,68,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.1rem' }}>
          <Trash2 size={24} style={{ color: '#ef4444' }} />
        </div>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', marginBottom: '.4rem' }}>Delete Semester?</h3>
        <p style={{ fontSize: '.82rem', color: 'var(--neu-text-muted)', marginBottom: '1.6rem' }}>
          <strong style={{ color: 'var(--neu-text-primary)' }}>{sem?.name}</strong> permanently delete ho jayega.
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

/* ─── Semester Card ──────────────────────── */
function SemCard({ sem, pal, onClick }) {
  const isActive = sem.is_active
  const accent = isActive ? '#22a06b' : pal.c
  const ring   = isActive ? 'rgba(34,160,107,.35)' : pal.ring

  return (
    <div className="sem-card" onClick={onClick}>
      <div className="card-accent-border" style={{ boxShadow: `inset 0 0 0 1.5px ${ring}` }} />
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: accent, opacity: 0.8 }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

        {/* Code badge + Active pill */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '0.25rem 0.75rem', background: 'var(--neu-surface-deep)', color: accent, borderRadius: '0.5rem', boxShadow: 'inset 2px 2px 4px var(--neu-shadow-dark), inset -1px -1px 3px var(--neu-shadow-light)', fontFamily: 'monospace', letterSpacing: '0.05em' }}>
            {sem.code}
          </span>
          {isActive && (
            <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '0.2rem 0.6rem', background: 'rgba(34,160,107,.12)', color: '#22a06b', borderRadius: '0.4rem', border: '1px solid rgba(34,160,107,.3)' }}>
              ● Active
            </span>
          )}
        </div>

        {/* Name */}
        <div style={{ marginTop: '0.25rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit, sans-serif', lineHeight: 1.2, marginBottom: '0.4rem' }}>
            {sem.name}
          </h3>
        </div>

        {/* Dates footer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingTop: '0.8rem', borderTop: '1px solid var(--neu-border)', marginTop: '0.4rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={13} style={{ color: accent }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--neu-text-primary)', fontWeight: 600 }}>
              {fmt(sem.start_date)}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={13} style={{ color: accent }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--neu-text-secondary)' }}>
              {fmt(sem.end_date)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Skeleton ───────────────────────────── */
function SkeletonCard() {
  return (
    <div style={{ background: 'var(--neu-surface)', border: '1px solid var(--neu-border)', borderRadius: '1.25rem', padding: '1.4rem', boxShadow: '6px 6px 16px var(--neu-shadow-dark), -3px -3px 10px var(--neu-shadow-light)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ width: 70, height: 26, borderRadius: '.5rem', background: 'var(--neu-surface-deep)', animation: 'pulse 1.5s ease-in-out infinite' }} />
        <div style={{ width: 52, height: 22, borderRadius: '.4rem', background: 'var(--neu-surface-deep)', animation: 'pulse 1.5s ease-in-out infinite' }} />
      </div>
      <div style={{ height: 14, background: 'var(--neu-surface-deep)', borderRadius: 6, width: '60%', marginBottom: '.5rem', animation: 'pulse 1.5s ease-in-out infinite' }} />
      <div style={{ height: 11, background: 'var(--neu-surface-deep)', borderRadius: 6, width: '80%', marginBottom: '.3rem', animation: 'pulse 1.5s ease-in-out infinite' }} />
      <div style={{ height: 11, background: 'var(--neu-surface-deep)', borderRadius: 6, width: '50%', animation: 'pulse 1.5s ease-in-out infinite' }} />
    </div>
  )
}

/* ═══════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════ */
export default function SemestersPage() {
  const [semesters,  setSemesters]  = useState([])
  const [loading,    setLoading]    = useState(true)
  const [activating, setActivating] = useState(null)
  const [showForm,   setShowForm]   = useState(false)
  const [editSem,    setEditSem]    = useState(null)
  const [viewSem,    setViewSem]    = useState(null)
  const [viewPal,    setViewPal]    = useState(null)
  const [delTarget,  setDelTarget]  = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const { menu, open: openMenu, close: closeMenu } = useContextMenu()

  const fetch_ = async () => {
    setLoading(true)
    try { const r = await adminAPI.getSemesters(); setSemesters(r.data.data?.semesters || []) }
    catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }
  useEffect(() => { fetch_() }, [])

  const handleActivate = async (sem) => {
    if (sem.is_active) { toast('Already active', { icon: 'ℹ️' }); return }
    setActivating(sem.id)
    try { await adminAPI.activateSemester(sem.id); toast.success(`"${sem.name}" active!`); fetch_() }
    catch (e) { toast.error(e.response?.data?.message || 'Failed') }
    finally { setActivating(null) }
  }

  const handleDelete = async () => {
    setDeletingId(delTarget.id)
    try {
      await adminAPI.deleteSemester(delTarget.id)
      toast.success('Semester deleted')
      setDelTarget(null)
      fetch_()
    }
    catch (e) { toast.error(e.response?.data?.message || 'Cannot delete') }
    finally { setDeletingId(null) }
  }

  const ctxItems = (sem) => [
    { label: 'View Details', icon: Eye,   onClick: s => { setViewSem(s); setViewPal(PALETTE[semesters.findIndex(x => x.id === s.id) % PALETTE.length]) } },
    { label: 'Edit',         icon: Edit2, onClick: s => { setEditSem(s); setShowForm(true) } },
    { label: sem?.is_active ? 'Active ✓' : 'Set Active', icon: CheckCircle2, onClick: handleActivate, disabled: sem?.is_active },
    { divider: true },
    { label: 'Delete',       icon: Trash2, onClick: s => setDelTarget(s), danger: true },
  ]

  return (
    <>
      <style>{CSS}</style>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.3rem', paddingBottom: '2rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', letterSpacing: '-.02em' }}>Semesters</h1>
            <p style={{ fontSize: '.78rem', color: 'var(--neu-text-ghost)', marginTop: 2 }}>{semesters.length} semesters configured</p>
          </div>
          <AddButton onClick={() => { setEditSem(null); setShowForm(true) }} tooltip="Add Semester" color="#5b8af0" />
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(270px,1fr))', gap: '1rem' }}>
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : semesters.length === 0 ? (
          <div style={{ background: 'var(--neu-surface)', border: '1px solid var(--neu-border)', borderRadius: '1.25rem', padding: '4rem 2rem', textAlign: 'center', boxShadow: '6px 6px 16px var(--neu-shadow-dark)' }}>
            <Calendar size={38} style={{ color: 'var(--neu-text-ghost)', margin: '0 auto .8rem', opacity: .25, display: 'block' }} />
            <p style={{ fontWeight: 600, color: 'var(--neu-text-secondary)' }}>No semesters yet</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(270px,1fr))', gap: '1rem' }}>
            {semesters.map((sem, i) => {
              const pal = PALETTE[i % PALETTE.length]
              return (
                <SemCard
                  key={sem.id}
                  sem={sem}
                  pal={pal}
                  onClick={e => openMenu(e, sem)}
                />
              )
            })}
          </div>
        )}

        <ContextMenu menu={menu} close={closeMenu} items={menu ? ctxItems(menu.row) : []} />

        {viewSem  && <ViewModal sem={viewSem} pal={viewPal || PALETTE[0]} onClose={() => setViewSem(null)} />}
        {showForm && <SemesterModal sem={editSem} onClose={() => { setShowForm(false); setEditSem(null) }} onSuccess={fetch_} />}
        {delTarget && <DeleteModal sem={delTarget} onClose={() => setDelTarget(null)} onConfirm={handleDelete} loading={!!deletingId} />}
      </div>
    </>
  )
}