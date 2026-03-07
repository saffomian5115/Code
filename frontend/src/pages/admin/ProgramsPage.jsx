// ═══════════════════════════════════════════════════════════════
//  ProgramsPage.jsx  —  frontend/src/pages/admin/ProgramsPage.jsx
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect, useMemo } from 'react'
import { Plus, Search, GraduationCap, Clock, Hash, Building2, Loader2, Edit2, Trash2, Eye, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { adminAPI } from '../../api/admin.api'
import { useContextMenu, ContextMenu } from '../../hooks/useContextMenu'

const CSS = `
  .prog-card {
    background: var(--neu-surface);
    border: 1px solid var(--neu-border);
    border-radius: 1.25rem;
    box-shadow: 6px 6px 16px var(--neu-shadow-dark), -3px -3px 10px var(--neu-shadow-light);
    padding: 1.4rem;
    position: relative;
    overflow: hidden;
    cursor: context-menu;
    user-select: none;
    transition: box-shadow .25s ease, transform .25s ease;
  }
  .prog-card:hover {
    transform: translateY(-4px);
    box-shadow: 10px 18px 32px var(--neu-shadow-dark), -4px -4px 14px var(--neu-shadow-light);
  }
  .prog-card:hover .card-ring { opacity: 1; }
  .card-ring {
    position: absolute; inset: 0; border-radius: 1.25rem;
    pointer-events: none; opacity: 0; transition: opacity .25s ease;
  }
`

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

const PALETTE = [
  { c: '#22a06b', bg: 'rgba(34,160,107,.1)',  ring: 'rgba(34,160,107,.35)' },
  { c: '#5b8af0', bg: 'rgba(91,138,240,.1)',  ring: 'rgba(91,138,240,.35)' },
  { c: '#9b59b6', bg: 'rgba(155,89,182,.1)',  ring: 'rgba(155,89,182,.35)' },
  { c: '#f97316', bg: 'rgba(249,115,22,.1)',  ring: 'rgba(249,115,22,.35)' },
  { c: '#f59e0b', bg: 'rgba(245,158,11,.1)',  ring: 'rgba(245,158,11,.35)' },
  { c: '#06b6d4', bg: 'rgba(6,182,212,.1)',   ring: 'rgba(6,182,212,.35)'  },
  { c: '#ef4444', bg: 'rgba(239,68,68,.1)',   ring: 'rgba(239,68,68,.35)'  },
]
const DEG_COLOR = { BS:'#5b8af0', BE:'#22a06b', MS:'#9b59b6', MBA:'#f97316', BBA:'#f59e0b', PhD:'#ef4444', Associate:'#06b6d4' }

function Modal({ children, maxW = 420 }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(8,12,20,.7)', backdropFilter: 'blur(10px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: maxW, background: 'var(--neu-surface)', boxShadow: '14px 14px 36px var(--neu-shadow-dark), -6px -6px 20px var(--neu-shadow-light)', border: '1px solid var(--neu-border)', borderRadius: '1.5rem', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'neu-slide-up .2s cubic-bezier(.34,1.56,.64,1) both' }}>
        {children}
      </div>
    </div>
  )
}

function ViewModal({ prog, pal, onClose }) {
  const rows = [
    { label: 'Code',         value: prog.code },
    { label: 'Department',   value: prog.department_name },
    { label: 'Degree Type',  value: prog.degree_type },
    { label: 'Duration',     value: prog.duration_years ? `${prog.duration_years} Years` : null },
    { label: 'Credit Hours', value: prog.total_credit_hours ? `${prog.total_credit_hours} cr` : null },
    { label: 'Enrolled',     value: prog.total_students != null ? `${prog.total_students} students` : null },
  ].filter(r => r.value)
  const dc = DEG_COLOR[prog.degree_type] || pal.c

  return (
    <Modal maxW={440}>
      <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--neu-border)', display: 'flex', alignItems: 'center', gap: '.85rem' }}>
        <div style={{ width: 50, height: 50, borderRadius: '1rem', background: pal.bg, border: `1px solid ${pal.ring}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <GraduationCap size={22} style={{ color: pal.c }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ fontSize: '1.02rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', lineHeight: 1.25 }}>{prog.name}</h2>
          <div style={{ display: 'flex', gap: '.35rem', marginTop: '.3rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '.63rem', fontWeight: 800, padding: '.15rem .5rem', background: pal.bg, color: pal.c, border: `1px solid ${pal.ring}`, borderRadius: '.4rem', fontFamily: 'monospace' }}>{prog.code}</span>
            {prog.degree_type && <span style={{ fontSize: '.63rem', fontWeight: 800, padding: '.15rem .5rem', background: `${dc}18`, color: dc, borderRadius: '.4rem' }}>{prog.degree_type}</span>}
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neu-text-ghost)', padding: '.25rem', borderRadius: '.5rem' }}><X size={18} /></button>
      </div>

      <div style={{ padding: '1.1rem 1.4rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.55rem', overflowY: 'auto' }}>
        {rows.map(r => (
          <div key={r.label} style={{ background: 'var(--neu-surface-deep)', borderRadius: '.8rem', padding: '.75rem 1rem', boxShadow: 'inset 2px 2px 5px var(--neu-shadow-dark), inset -1px -1px 4px var(--neu-shadow-light)' }}>
            <p style={{ fontSize: '.62rem', fontWeight: 700, color: 'var(--neu-text-ghost)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: '.2rem' }}>{r.label}</p>
            <p style={{ fontSize: '.85rem', color: 'var(--neu-text-primary)', fontWeight: 500 }}>{r.value}</p>
          </div>
        ))}
      </div>

      <div style={{ padding: '.9rem 1.4rem', borderTop: '1px solid var(--neu-border)' }}>
        <button onClick={onClose} style={{ ...iS, cursor: 'pointer', textAlign: 'center', fontWeight: 600, color: 'var(--neu-text-secondary)', padding: '.6rem' }}>Close</button>
      </div>
    </Modal>
  )
}

function ProgramModal({ prog, departments, onClose, onSuccess }) {
  const isEdit = !!prog?.id
  const [form, setForm] = useState({ name: prog?.name||'', code: prog?.code||'', department_id: prog?.department_id||'', duration_years: prog?.duration_years||4, total_credit_hours: prog?.total_credit_hours||'', degree_type: prog?.degree_type||'' })
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const submit = async () => {
    if (!form.name || !form.code || !form.department_id) { toast.error('Name, code, department required'); return }
    setLoading(true)
    try {
      isEdit ? await adminAPI.updateProgram(prog.id, form) : await adminAPI.createProgram(form)
      toast.success(isEdit ? 'Program updated!' : 'Program created!')
      onSuccess(); onClose()
    } catch (e) { toast.error(e.response?.data?.message || 'Failed') }
    finally { setLoading(false) }
  }

  return (
    <Modal maxW={520}>
      <div style={{ padding: '1.4rem 1.5rem', borderBottom: '1px solid var(--neu-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem' }}>
          <div style={{ width: 34, height: 34, borderRadius: '.65rem', background: 'rgba(34,160,107,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><GraduationCap size={15} style={{ color: '#22a06b' }} /></div>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif' }}>{isEdit ? 'Edit Program' : 'Add Program'}</h2>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neu-text-ghost)' }}><X size={18} /></button>
      </div>

      <div style={{ padding: '1.2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '.85rem', overflowY: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.8rem' }}>
          <Field label="Program Name *"><input style={iS} value={form.name} onChange={e => set('name', e.target.value)} placeholder="BS Information Technology" autoFocus /></Field>
          <Field label="Code *"><input style={iS} value={form.code} onChange={e => set('code', e.target.value.toUpperCase())} placeholder="BSIT" maxLength={15} /></Field>
        </div>
        <Field label="Department *">
          <select style={iS} value={form.department_id} onChange={e => set('department_id', parseInt(e.target.value))}>
            <option value="">— Select Department —</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name} ({d.code})</option>)}
          </select>
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '.8rem' }}>
          <Field label="Duration (Yrs)"><input style={iS} type="number" min={1} max={8} value={form.duration_years} onChange={e => set('duration_years', parseInt(e.target.value))} /></Field>
          <Field label="Credit Hours"><input style={iS} type="number" value={form.total_credit_hours} onChange={e => set('total_credit_hours', parseInt(e.target.value))} placeholder="136" /></Field>
          <Field label="Degree Type">
            <select style={iS} value={form.degree_type} onChange={e => set('degree_type', e.target.value)}>
              <option value="">Select</option>
              {['BS','BE','MS','MBA','BBA','Associate','PhD'].map(d => <option key={d}>{d}</option>)}
            </select>
          </Field>
        </div>
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

function DeleteModal({ prog, onClose, onConfirm, loading }) {
  return (
    <Modal maxW={400}>
      <div style={{ padding: '2rem 1.75rem', textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: '1.1rem', background: 'rgba(239,68,68,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.1rem' }}>
          <Trash2 size={24} style={{ color: '#ef4444' }} />
        </div>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', marginBottom: '.4rem' }}>Delete Program?</h3>
        <p style={{ fontSize: '.82rem', color: 'var(--neu-text-muted)', marginBottom: '1.6rem' }}>
          <strong style={{ color: 'var(--neu-text-primary)' }}>{prog?.name}</strong> permanently delete ho jayega.
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

function ProgCard({ prog, pal, onContextMenu }) {
  const dc = DEG_COLOR[prog.degree_type] || pal.c
  return (
    <div className="prog-card" onContextMenu={onContextMenu}>
      <div className="card-ring" style={{ boxShadow: `inset 0 0 0 1.5px ${pal.ring}` }} />
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, borderRadius: '1.25rem 1.25rem 0 0', background: `linear-gradient(90deg,${pal.c},${pal.c}44,transparent)` }} />

      {/* top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ width: 44, height: 44, borderRadius: '.875rem', background: pal.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <GraduationCap size={20} style={{ color: pal.c }} />
        </div>
        <div style={{ display: 'flex', gap: '.35rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {prog.degree_type && <span style={{ fontSize: '.63rem', fontWeight: 800, padding: '.18rem .5rem', background: `${dc}18`, color: dc, borderRadius: '.4rem' }}>{prog.degree_type}</span>}
          <span style={{ fontSize: '.63rem', fontWeight: 800, padding: '.18rem .5rem', background: pal.bg, color: pal.c, border: `1px solid ${pal.ring}`, borderRadius: '.4rem', fontFamily: 'monospace' }}>{prog.code}</span>
        </div>
      </div>

      <h3 style={{ fontSize: '.93rem', fontWeight: 700, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', lineHeight: 1.3, marginBottom: '.25rem' }}>{prog.name}</h3>
      {prog.department_name && (
        <p style={{ fontSize: '.72rem', color: 'var(--neu-text-ghost)', marginBottom: '.8rem', display: 'flex', alignItems: 'center', gap: '.3rem' }}>
          <Building2 size={10} />{prog.department_name}
        </p>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '.8rem', paddingTop: '.7rem', borderTop: '1px solid var(--neu-border)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '.3rem', fontSize: '.71rem', color: 'var(--neu-text-muted)', fontWeight: 500 }}><Clock size={11} style={{ color: 'var(--neu-text-ghost)' }} />{prog.duration_years || 4} yr</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '.3rem', fontSize: '.71rem', color: 'var(--neu-text-muted)', fontWeight: 500 }}><Hash size={11} style={{ color: 'var(--neu-text-ghost)' }} />{prog.total_credit_hours || '—'} cr</span>
        <span style={{ marginLeft: 'auto', fontSize: '.71rem', color: 'var(--neu-text-muted)', fontWeight: 500 }}>{prog.total_students || 0} students</span>
      </div>
      <span style={{ position: 'absolute', bottom: '.5rem', right: '.7rem', fontSize: '.58rem', color: 'var(--neu-text-ghost)', opacity: .4, pointerEvents: 'none' }}>⊞ right-click</span>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div style={{ background: 'var(--neu-surface)', border: '1px solid var(--neu-border)', borderRadius: '1.25rem', padding: '1.4rem', boxShadow: '6px 6px 16px var(--neu-shadow-dark), -3px -3px 10px var(--neu-shadow-light)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ width: 44, height: 44, borderRadius: '.875rem', background: 'var(--neu-surface-deep)', animation: 'pulse 1.5s ease-in-out infinite' }} />
        <div style={{ width: 52, height: 22, borderRadius: '.4rem', background: 'var(--neu-surface-deep)', animation: 'pulse 1.5s ease-in-out infinite' }} />
      </div>
      <div style={{ height: 14, background: 'var(--neu-surface-deep)', borderRadius: 6, width: '75%', marginBottom: '.5rem', animation: 'pulse 1.5s ease-in-out infinite' }} />
      <div style={{ height: 11, background: 'var(--neu-surface-deep)', borderRadius: 6, width: '50%', animation: 'pulse 1.5s ease-in-out infinite' }} />
    </div>
  )
}

export default function ProgramsPage() {
  const [programs,    setPrograms]    = useState([])
  const [departments, setDepartments] = useState([])
  const [loading,     setLoading]     = useState(true)
  const [search,      setSearch]      = useState('')
  const [filterDept,  setFilterDept]  = useState('')
  const [modal,       setModal]       = useState(null)
  const [viewTarget,  setViewTarget]  = useState(null)
  const [delTarget,   setDelTarget]   = useState(null)
  const [deletingId,  setDeletingId]  = useState(null)

  const { menu, open: openMenu, close: closeMenu } = useContextMenu()

  const filtered = useMemo(() => {
    let r = programs
    if (filterDept) r = r.filter(p => p.department_id == filterDept)
    if (search.trim()) { const q = search.toLowerCase(); r = r.filter(p => p.name?.toLowerCase().includes(q) || p.code?.toLowerCase().includes(q)) }
    return r
  }, [programs, search, filterDept])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [p, d] = await Promise.all([adminAPI.getPrograms(), adminAPI.getDepartments()])
      setPrograms(p.data.data?.programs || [])
      setDepartments(d.data.data?.departments || [])
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchAll() }, [])

  const handleDelete = async () => {
    setDeletingId(delTarget.id)
    try { await adminAPI.deleteProgram(delTarget.id); toast.success('Program deleted'); setDelTarget(null); fetchAll() }
    catch (e) { toast.error(e.response?.data?.message || 'Cannot delete') }
    finally { setDeletingId(null) }
  }

  const ctxItems = (pal) => [
    { label: 'View Details', icon: Eye,    onClick: p => setViewTarget({ prog: p, pal }) },
    { label: 'Edit',         icon: Edit2,  onClick: p => setModal(p) },
    { divider: true },
    { label: 'Delete',       icon: Trash2, onClick: p => setDelTarget(p), danger: true },
  ]

  return (
    <>
      <style>{CSS}</style>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.3rem', paddingBottom: '2rem' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', letterSpacing: '-.02em' }}>Programs</h1>
            <p style={{ fontSize: '.78rem', color: 'var(--neu-text-ghost)', marginTop: 2 }}>{programs.length} academic programs</p>
          </div>
          <button onClick={() => setModal({})} style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.65rem 1.25rem', background: 'linear-gradient(145deg,#22a06b,#1a7d54)', boxShadow: '0 4px 16px rgba(34,160,107,.38), 6px 6px 14px var(--neu-shadow-dark), -3px -3px 8px var(--neu-shadow-light)', border: '1px solid rgba(255,255,255,.18)', borderRadius: '.9rem', color: '#fff', fontWeight: 700, fontSize: '.82rem', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>
            <Plus size={16} /> Add Program
          </button>
        </div>

        <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1', minWidth: 220, maxWidth: 320 }}>
            <Search size={14} style={{ position: 'absolute', left: '.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--neu-text-ghost)', pointerEvents: 'none' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search programs…" style={{ ...iS, paddingLeft: '2.25rem' }} />
          </div>
          <select value={filterDept} onChange={e => setFilterDept(e.target.value)} style={{ ...iS, width: 'auto', minWidth: 180 }}>
            <option value="">All Departments</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: '1rem' }}>
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ background: 'var(--neu-surface)', border: '1px solid var(--neu-border)', borderRadius: '1.25rem', padding: '4rem 2rem', textAlign: 'center', boxShadow: '6px 6px 16px var(--neu-shadow-dark)' }}>
            <GraduationCap size={38} style={{ color: 'var(--neu-text-ghost)', margin: '0 auto .8rem', opacity: .25, display: 'block' }} />
            <p style={{ fontWeight: 600, color: 'var(--neu-text-secondary)' }}>{search || filterDept ? 'No match' : 'No programs yet'}</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: '1rem' }}>
            {filtered.map((prog, i) => {
              const pal = PALETTE[i % PALETTE.length]
              return <ProgCard key={prog.id} prog={prog} pal={pal} onContextMenu={e => openMenu(e, prog)} />
            })}
          </div>
        )}

        <ContextMenu menu={menu} close={closeMenu} items={menu ? ctxItems(PALETTE[filtered.findIndex(p => p.id === menu.row?.id) % PALETTE.length]) : []} />
        {viewTarget  && <ViewModal prog={viewTarget.prog} pal={viewTarget.pal} onClose={() => setViewTarget(null)} />}
        {modal !== null && <ProgramModal prog={modal?.id ? modal : null} departments={departments} onClose={() => setModal(null)} onSuccess={fetchAll} />}
        {delTarget   && <DeleteModal prog={delTarget} onClose={() => setDelTarget(null)} onConfirm={handleDelete} loading={!!deletingId} />}
      </div>
    </>
  )
}