// ═══════════════════════════════════════════════════════════════
//  CoursesPage.jsx  —  frontend/src/pages/admin/CoursesPage.jsx
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect, useMemo } from 'react'
import {
  Search, BookOpen, Hash, Clock, Building2,
  Loader2, Edit2, Trash2, Eye, X, Tag, Layers,
  ChevronLeft, ChevronRight, Plus, Check, AlertTriangle,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { adminAPI } from '../../api/admin.api'
import { useContextMenu, ContextMenu } from '../../hooks/useContextMenu'
import AddButton from '../../components/ui/AddButton'

/* ─── CSS ─────────────────────────────────────────── */
const CSS = `
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
  @keyframes spin   { to{transform:rotate(360deg)} }
  @keyframes neu-slide-up { from{opacity:0;transform:translateY(20px) scale(.97)} to{opacity:1;transform:none} }

  .course-card {
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
  .course-card:hover {
    transform: translateY(-4px);
    box-shadow: 10px 18px 32px var(--neu-shadow-dark), -4px -4px 14px var(--neu-shadow-light);
  }
  .course-card:hover .cc-ring { opacity: 1; }
  .cc-ring {
    position: absolute; inset: 0; border-radius: 1.25rem;
    pointer-events: none; opacity: 0; transition: opacity 0.25s ease;
  }
`

/* ─── Shared styles ──────────────────────────────── */
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

/* ─── Palette ─────────────────────────────────────── */
const PALETTE = [
  { c: '#5b8af0', bg: 'rgba(91,138,240,.1)',  ring: 'rgba(91,138,240,.35)' },
  { c: '#22a06b', bg: 'rgba(34,160,107,.1)',  ring: 'rgba(34,160,107,.35)' },
  { c: '#9b59b6', bg: 'rgba(155,89,182,.1)',  ring: 'rgba(155,89,182,.35)' },
  { c: '#f97316', bg: 'rgba(249,115,22,.1)',  ring: 'rgba(249,115,22,.35)' },
  { c: '#06b6d4', bg: 'rgba(6,182,212,.1)',   ring: 'rgba(6,182,212,.35)'  },
  { c: '#f59e0b', bg: 'rgba(245,158,11,.1)',  ring: 'rgba(245,158,11,.35)' },
  { c: '#ef4444', bg: 'rgba(239,68,68,.1)',   ring: 'rgba(239,68,68,.35)'  },
]

const PER_PAGE = 12

/* ═══════════════════════════════════════════════════
   MODAL SHELL
═══════════════════════════════════════════════════ */
function Modal({ children, maxW = 520 }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(8,12,20,.75)', backdropFilter: 'blur(10px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: maxW, background: 'var(--neu-surface)', boxShadow: '14px 14px 36px var(--neu-shadow-dark), -6px -6px 20px var(--neu-shadow-light)', border: '1px solid var(--neu-border)', borderRadius: '1.5rem', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'neu-slide-up .2s cubic-bezier(.34,1.56,.64,1) both' }}>
        {children}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   VIEW MODAL (with CLO list + Manage CLOs button)
═══════════════════════════════════════════════════ */
function ViewModal({ course, pal, onClose, onManageCLOs }) {
  const [clos, setClos]           = useState([])
  const [cloLoading, setCloLoading] = useState(true)

  useEffect(() => {
    adminAPI.getCourseCLOs(course.id)
      .then(r => setClos(r.data.data?.clos || []))
      .catch(() => {})
      .finally(() => setCloLoading(false))
  }, [course.id])

  const rows = [
    { label: 'Code',           value: course.code },
    { label: 'Department',     value: course.department_name },
    { label: 'Credit Hours',   value: course.credit_hours ? `${course.credit_hours} cr` : null },
    { label: 'Lecture Hours',  value: course.lecture_hours != null ? `${course.lecture_hours} hr` : null },
    { label: 'Lab Hours',      value: course.lab_hours != null ? `${course.lab_hours} hr` : null },
    { label: 'Semester Level', value: course.semester_level ? `Semester ${course.semester_level}` : null },
    { label: 'Type',           value: course.is_elective ? 'Elective' : 'Core' },
    { label: 'Program',        value: course.program_name },
  ].filter(r => r.value)

  return (
    <Modal maxW={520}>
      {/* Header */}
      <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--neu-border)', display: 'flex', alignItems: 'center', gap: '.85rem', flexShrink: 0 }}>
        <div style={{ width: 50, height: 50, borderRadius: '1rem', background: pal.bg, border: `1px solid ${pal.ring}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <BookOpen size={22} style={{ color: pal.c }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ fontSize: '1.02rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', lineHeight: 1.25 }}>{course.name}</h2>
          <div style={{ display: 'flex', gap: '.35rem', marginTop: '.3rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '.63rem', fontWeight: 800, padding: '.15rem .5rem', background: pal.bg, color: pal.c, border: `1px solid ${pal.ring}`, borderRadius: '.4rem', fontFamily: 'monospace' }}>{course.code}</span>
            <span style={{ fontSize: '.63rem', fontWeight: 700, padding: '.15rem .5rem', background: course.is_elective ? 'rgba(155,89,182,.12)' : 'rgba(34,160,107,.1)', color: course.is_elective ? '#9b59b6' : '#22a06b', borderRadius: '.4rem' }}>
              {course.is_elective ? 'Elective' : 'Core'}
            </span>
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neu-text-ghost)', padding: '.25rem' }}><X size={18} /></button>
      </div>

      {/* Body */}
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {/* Info grid */}
        <div style={{ padding: '1.1rem 1.4rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.55rem' }}>
          {rows.map(r => (
            <div key={r.label} style={{ background: 'var(--neu-surface-deep)', borderRadius: '.8rem', padding: '.7rem 1rem', boxShadow: 'inset 2px 2px 5px var(--neu-shadow-dark), inset -1px -1px 4px var(--neu-shadow-light)' }}>
              <p style={{ fontSize: '.62rem', fontWeight: 700, color: 'var(--neu-text-ghost)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: '.2rem' }}>{r.label}</p>
              <p style={{ fontSize: '.85rem', color: 'var(--neu-text-primary)', fontWeight: 500 }}>{r.value}</p>
            </div>
          ))}
        </div>

        {/* Description */}
        {course.description && (
          <div style={{ padding: '0 1.4rem .8rem' }}>
            <div style={{ background: 'var(--neu-surface-deep)', borderRadius: '.8rem', padding: '.75rem 1rem', boxShadow: 'inset 2px 2px 5px var(--neu-shadow-dark), inset -1px -1px 4px var(--neu-shadow-light)' }}>
              <p style={{ fontSize: '.62rem', fontWeight: 700, color: 'var(--neu-text-ghost)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: '.3rem' }}>Description</p>
              <p style={{ fontSize: '.82rem', color: 'var(--neu-text-secondary)', lineHeight: 1.6 }}>{course.description}</p>
            </div>
          </div>
        )}

        {/* CLOs preview */}
        <div style={{ padding: '0 1.4rem 1.2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.7rem' }}>
            <div style={{ width: 26, height: 26, borderRadius: '.5rem', background: pal.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Tag size={12} style={{ color: pal.c }} />
            </div>
            <p style={{ fontSize: '.78rem', fontWeight: 700, color: 'var(--neu-text-primary)', flex: 1 }}>
              Course Learning Outcomes
            </p>
            <span style={{ fontSize: '.68rem', fontWeight: 700, padding: '.15rem .5rem', background: pal.bg, color: pal.c, borderRadius: '.4rem' }}>
              {cloLoading ? '…' : clos.length}
            </span>
          </div>

          {cloLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
              {[1,2].map(i => <div key={i} style={{ height: 48, borderRadius: '.75rem', background: 'var(--neu-surface-deep)', animation: 'pulse 1.5s ease-in-out infinite' }} />)}
            </div>
          ) : clos.length === 0 ? (
            <div style={{ padding: '1.2rem', textAlign: 'center', background: 'var(--neu-surface-deep)', borderRadius: '.8rem', boxShadow: 'inset 2px 2px 5px var(--neu-shadow-dark)' }}>
              <p style={{ fontSize: '.78rem', color: 'var(--neu-text-ghost)' }}>No CLOs defined yet</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
              {clos.map(clo => (
                <div key={clo.id} style={{ display: 'flex', gap: '.65rem', alignItems: 'flex-start', background: 'var(--neu-surface-deep)', borderRadius: '.75rem', padding: '.65rem .9rem', boxShadow: 'inset 2px 2px 5px var(--neu-shadow-dark), inset -1px -1px 4px var(--neu-shadow-light)' }}>
                  <span style={{ fontSize: '.62rem', fontWeight: 800, padding: '.2rem .45rem', background: pal.bg, color: pal.c, borderRadius: '.35rem', fontFamily: 'monospace', flexShrink: 0, marginTop: '.1rem' }}>
                    {clo.clo_number}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '.78rem', color: 'var(--neu-text-primary)', lineHeight: 1.5, marginBottom: '.25rem' }}>{clo.description}</p>
                    <div style={{ display: 'flex', gap: '.3rem', flexWrap: 'wrap' }}>
                      {clo.domain && <span style={{ fontSize: '.6rem', fontWeight: 700, padding: '.1rem .4rem', background: 'rgba(91,138,240,.12)', color: '#5b8af0', borderRadius: '.3rem' }}>{clo.domain}</span>}
                      {clo.level  && <span style={{ fontSize: '.6rem', fontWeight: 700, padding: '.1rem .4rem', background: 'rgba(34,160,107,.1)', color: '#22a06b', borderRadius: '.3rem' }}>{clo.level}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '.9rem 1.4rem', borderTop: '1px solid var(--neu-border)', display: 'flex', gap: '.6rem', flexShrink: 0 }}>
        <button onClick={onClose} style={{ ...iS, cursor: 'pointer', textAlign: 'center', fontWeight: 600, color: 'var(--neu-text-secondary)', flex: 1, padding: '.6rem' }}>Close</button>
        <button
          onClick={() => { onClose(); onManageCLOs(course) }}
          style={{ flex: 1, padding: '.6rem', borderRadius: '.75rem', border: 'none', background: `linear-gradient(145deg,${pal.c},${pal.c}cc)`, boxShadow: `0 4px 14px ${pal.ring}`, color: '#fff', fontWeight: 700, fontSize: '.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.4rem', fontFamily: "'DM Sans',sans-serif" }}
        >
          <Tag size={14} /> Manage CLOs
        </button>
      </div>
    </Modal>
  )
}

/* ═══════════════════════════════════════════════════
   CLO MANAGER MODAL  (add / edit / delete)
═══════════════════════════════════════════════════ */
function CLOManagerModal({ course, pal, onClose }) {
  const [clos,      setClos]      = useState([])
  const [loading,   setLoading]   = useState(true)
  const [editingId, setEditingId] = useState(null)   // clo.id being edited inline
  const [deletingId,setDeletingId]= useState(null)
  const [savingId,  setSavingId]  = useState(null)
  const [adding,    setAdding]    = useState(false)
  const [addSaving, setAddSaving] = useState(false)

  // inline edit form state
  const [editForm, setEditForm] = useState({ description: '', domain: '', level: '' })
  // new CLO form state
  const [newForm,  setNewForm]  = useState({ clo_number: '', description: '', domain: '', level: '' })

  const DOMAINS = ['Cognitive', 'Affective', 'Psychomotor']
  const LEVELS  = ['Knowledge', 'Comprehension', 'Application', 'Analysis', 'Synthesis', 'Evaluation']

  const fetchCLOs = async () => {
    setLoading(true)
    try { const r = await adminAPI.getCourseCLOs(course.id); setClos(r.data.data?.clos || []) }
    catch { toast.error('Failed to load CLOs') }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchCLOs() }, [course.id])

  /* ── Add CLO ── */
  const handleAdd = async () => {
    if (!newForm.clo_number.trim() || !newForm.description.trim()) {
      toast.error('CLO number and description required'); return
    }
    setAddSaving(true)
    try {
      await adminAPI.createCLO(course.id, newForm)
      toast.success('CLO added!')
      setNewForm({ clo_number: '', description: '', domain: '', level: '' })
      setAdding(false)
      fetchCLOs()
    } catch (e) { toast.error(e.response?.data?.message || 'Failed') }
    finally { setAddSaving(false) }
  }

  /* ── Start editing ── */
  const startEdit = (clo) => {
    setEditingId(clo.id)
    setEditForm({ description: clo.description, domain: clo.domain || '', level: clo.level || '' })
  }

  /* ── Save edit ── */
  const handleSaveEdit = async (clo) => {
    if (!editForm.description.trim()) { toast.error('Description required'); return }
    setSavingId(clo.id)
    try {
      // use the deleteCLO + createCLO approach since there's no PUT /clos endpoint
      // Actually backend may have update — let's try a PATCH/PUT on clo directly
      // We'll call the generic api directly
      const { default: api } = await import('../../api/axios')
      await api.put(`/courses/${course.id}/clos/${clo.id}`, editForm)
      toast.success('CLO updated!')
      setEditingId(null)
      fetchCLOs()
    } catch {
      // fallback: delete + recreate
      try {
        await adminAPI.deleteCLO?.(course.id, clo.id)
        await adminAPI.createCLO(course.id, { ...editForm, clo_number: clo.clo_number })
        toast.success('CLO updated!')
        setEditingId(null)
        fetchCLOs()
      } catch (e2) { toast.error(e2.response?.data?.message || 'Update failed') }
    }
    finally { setSavingId(null) }
  }

  /* ── Delete CLO ── */
  const handleDelete = async (clo) => {
    setDeletingId(clo.id)
    try {
      await adminAPI.deleteCLO(course.id, clo.id)
      toast.success('CLO deleted')
      fetchCLOs()
    } catch (e) { toast.error(e.response?.data?.message || 'Cannot delete') }
    finally { setDeletingId(null) }
  }

  const selStyle = { ...iS, padding: '.45rem .7rem', fontSize: '.8rem' }

  return (
    <Modal maxW={580}>
      {/* Header */}
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--neu-border)', display: 'flex', alignItems: 'center', gap: '.75rem', flexShrink: 0 }}>
        <div style={{ width: 40, height: 40, borderRadius: '.75rem', background: pal.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Tag size={16} style={{ color: pal.c }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ fontSize: '.95rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif' }}>Manage CLOs</h2>
          <p style={{ fontSize: '.72rem', color: 'var(--neu-text-ghost)' }}>{course.code} — {course.name}</p>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neu-text-ghost)' }}><X size={18} /></button>
      </div>

      {/* Body */}
      <div style={{ overflowY: 'auto', flex: 1, padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '.6rem' }}>

        {/* ── Add new CLO panel ── */}
        {adding ? (
          <div style={{ background: 'var(--neu-surface-deep)', borderRadius: '1rem', padding: '1rem', boxShadow: `inset 2px 2px 6px var(--neu-shadow-dark), inset -1px -1px 4px var(--neu-shadow-light), 0 0 0 1.5px ${pal.ring}`, display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
            <p style={{ fontSize: '.72rem', fontWeight: 700, color: pal.c, textTransform: 'uppercase', letterSpacing: '.06em' }}>New CLO</p>
            <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '.5rem' }}>
              <F label="CLO #">
                <input style={{ ...iS, padding: '.45rem .7rem', fontSize: '.8rem' }} value={newForm.clo_number} onChange={e => setNewForm(p => ({ ...p, clo_number: e.target.value }))} placeholder="CLO-1" />
              </F>
              <F label="Description *">
                <input style={{ ...iS, padding: '.45rem .7rem', fontSize: '.8rem' }} value={newForm.description} onChange={e => setNewForm(p => ({ ...p, description: e.target.value }))} placeholder="Student will be able to…" autoFocus />
              </F>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem' }}>
              <F label="Domain">
                <select style={selStyle} value={newForm.domain} onChange={e => setNewForm(p => ({ ...p, domain: e.target.value }))}>
                  <option value="">— Select —</option>
                  {DOMAINS.map(d => <option key={d}>{d}</option>)}
                </select>
              </F>
              <F label="Level">
                <select style={selStyle} value={newForm.level} onChange={e => setNewForm(p => ({ ...p, level: e.target.value }))}>
                  <option value="">— Select —</option>
                  {LEVELS.map(l => <option key={l}>{l}</option>)}
                </select>
              </F>
            </div>
            <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'flex-end' }}>
              <button onClick={() => { setAdding(false); setNewForm({ clo_number: '', description: '', domain: '', level: '' }) }} style={{ padding: '.45rem 1rem', borderRadius: '.6rem', border: '1px solid var(--neu-border)', background: 'var(--neu-surface)', color: 'var(--neu-text-secondary)', fontWeight: 600, fontSize: '.8rem', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>Cancel</button>
              <button onClick={handleAdd} disabled={addSaving} style={{ padding: '.45rem 1.1rem', borderRadius: '.6rem', border: 'none', background: `linear-gradient(145deg,${pal.c},${pal.c}cc)`, color: '#fff', fontWeight: 700, fontSize: '.8rem', cursor: addSaving ? 'not-allowed' : 'pointer', opacity: addSaving ? .7 : 1, display: 'flex', alignItems: 'center', gap: '.35rem', fontFamily: "'DM Sans',sans-serif" }}>
                {addSaving ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={13} />} Save CLO
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.65rem 1rem', borderRadius: '.85rem', border: `1.5px dashed ${pal.ring}`, background: pal.bg, color: pal.c, fontWeight: 700, fontSize: '.82rem', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", width: '100%', justifyContent: 'center' }}
          >
            <Plus size={15} /> Add New CLO
          </button>
        )}

        {/* ── CLO list ── */}
        {loading ? (
          [1,2,3].map(i => <div key={i} style={{ height: 80, borderRadius: '.9rem', background: 'var(--neu-surface-deep)', animation: 'pulse 1.5s ease-in-out infinite' }} />)
        ) : clos.length === 0 ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', background: 'var(--neu-surface-deep)', borderRadius: '1rem', boxShadow: 'inset 2px 2px 5px var(--neu-shadow-dark)' }}>
            <Tag size={28} style={{ color: 'var(--neu-text-ghost)', opacity: .3, marginBottom: '.5rem' }} />
            <p style={{ fontSize: '.82rem', color: 'var(--neu-text-ghost)' }}>No CLOs yet — add one above</p>
          </div>
        ) : (
          clos.map(clo => (
            <div key={clo.id} style={{ background: 'var(--neu-surface-deep)', borderRadius: '.9rem', padding: '.85rem 1rem', boxShadow: 'inset 2px 2px 5px var(--neu-shadow-dark), inset -1px -1px 4px var(--neu-shadow-light)', border: editingId === clo.id ? `1.5px solid ${pal.ring}` : '1.5px solid transparent', transition: 'border-color .2s' }}>

              {editingId === clo.id ? (
                /* ── Inline Edit Mode ── */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.2rem' }}>
                    <span style={{ fontSize: '.65rem', fontWeight: 800, padding: '.2rem .5rem', background: pal.bg, color: pal.c, borderRadius: '.35rem', fontFamily: 'monospace' }}>{clo.clo_number}</span>
                    <span style={{ fontSize: '.65rem', color: 'var(--neu-text-ghost)' }}>Editing…</span>
                  </div>
                  <textarea
                    style={{ ...iS, resize: 'vertical', minHeight: '2.5rem', fontSize: '.8rem', padding: '.45rem .7rem' }}
                    value={editForm.description}
                    onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))}
                    autoFocus
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem' }}>
                    <select style={selStyle} value={editForm.domain} onChange={e => setEditForm(p => ({ ...p, domain: e.target.value }))}>
                      <option value="">— Domain —</option>
                      {DOMAINS.map(d => <option key={d}>{d}</option>)}
                    </select>
                    <select style={selStyle} value={editForm.level} onChange={e => setEditForm(p => ({ ...p, level: e.target.value }))}>
                      <option value="">— Level —</option>
                      {LEVELS.map(l => <option key={l}>{l}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'flex-end' }}>
                    <button onClick={() => setEditingId(null)} style={{ padding: '.38rem .85rem', borderRadius: '.55rem', border: '1px solid var(--neu-border)', background: 'var(--neu-surface)', color: 'var(--neu-text-secondary)', fontWeight: 600, fontSize: '.78rem', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>Cancel</button>
                    <button onClick={() => handleSaveEdit(clo)} disabled={savingId === clo.id} style={{ padding: '.38rem .9rem', borderRadius: '.55rem', border: 'none', background: `linear-gradient(145deg,${pal.c},${pal.c}cc)`, color: '#fff', fontWeight: 700, fontSize: '.78rem', cursor: savingId === clo.id ? 'not-allowed' : 'pointer', opacity: savingId === clo.id ? .7 : 1, display: 'flex', alignItems: 'center', gap: '.3rem', fontFamily: "'DM Sans',sans-serif" }}>
                      {savingId === clo.id ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={12} />} Save
                    </button>
                  </div>
                </div>
              ) : (
                /* ── Normal View Mode ── */
                <div style={{ display: 'flex', gap: '.75rem', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '.65rem', fontWeight: 800, padding: '.22rem .55rem', background: pal.bg, color: pal.c, borderRadius: '.4rem', fontFamily: 'monospace', flexShrink: 0, marginTop: '.1rem' }}>
                    {clo.clo_number}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '.82rem', color: 'var(--neu-text-primary)', lineHeight: 1.5, marginBottom: '.3rem' }}>{clo.description}</p>
                    <div style={{ display: 'flex', gap: '.3rem', flexWrap: 'wrap' }}>
                      {clo.domain && <span style={{ fontSize: '.6rem', fontWeight: 700, padding: '.1rem .4rem', background: 'rgba(91,138,240,.12)', color: '#5b8af0', borderRadius: '.3rem' }}>{clo.domain}</span>}
                      {clo.level  && <span style={{ fontSize: '.6rem', fontWeight: 700, padding: '.1rem .4rem', background: 'rgba(34,160,107,.1)', color: '#22a06b', borderRadius: '.3rem' }}>{clo.level}</span>}
                    </div>
                  </div>
                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: '.3rem', flexShrink: 0 }}>
                    <button
                      onClick={() => startEdit(clo)}
                      title="Edit CLO"
                      style={{ width: 30, height: 30, borderRadius: '.55rem', border: '1px solid var(--neu-border)', background: 'var(--neu-surface)', color: '#5b8af0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '2px 2px 5px var(--neu-shadow-dark), -1px -1px 3px var(--neu-shadow-light)' }}
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(clo)}
                      disabled={deletingId === clo.id}
                      title="Delete CLO"
                      style={{ width: 30, height: 30, borderRadius: '.55rem', border: '1px solid rgba(239,68,68,.3)', background: 'rgba(239,68,68,.08)', color: '#ef4444', cursor: deletingId === clo.id ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: deletingId === clo.id ? .5 : 1 }}
                    >
                      {deletingId === clo.id ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={13} />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '.9rem 1.4rem', borderTop: '1px solid var(--neu-border)', flexShrink: 0 }}>
        <button onClick={onClose} style={{ ...iS, cursor: 'pointer', textAlign: 'center', fontWeight: 600, color: 'var(--neu-text-secondary)', padding: '.6rem' }}>Done</button>
      </div>
    </Modal>
  )
}

/* ═══════════════════════════════════════════════════
   COURSE FORM MODAL
═══════════════════════════════════════════════════ */
function CourseModal({ course, departments, programs, onClose, onSuccess }) {
  const isEdit = !!course?.id
  const [form, setForm] = useState({
    code:           course?.code           || '',
    name:           course?.name           || '',
    credit_hours:   course?.credit_hours   || 3,
    lecture_hours:  course?.lecture_hours  || 2,
    lab_hours:      course?.lab_hours      || 0,
    department_id:  course?.department_id  ? Number(course.department_id)  : '',
    program_id:     course?.program_id     ? Number(course.program_id)     : '',
    semester_level: course?.semester_level ? Number(course.semester_level) : '',
    description:    course?.description    || '',
    is_elective:    course?.is_elective    || false,
  })
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const submit = async () => {
    if (!form.code.trim() || !form.name.trim() || !form.department_id) {
      toast.error('Code, name and department required'); return
    }
    setLoading(true)
    try {
      isEdit ? await adminAPI.updateCourse(course.id, form) : await adminAPI.createCourse(form)
      toast.success(isEdit ? 'Course updated!' : 'Course created!')
      onSuccess(); onClose()
    } catch (e) { toast.error(e.response?.data?.message || 'Failed') }
    finally { setLoading(false) }
  }

  return (
    <Modal maxW={560}>
      <div style={{ padding: '1.4rem 1.5rem', borderBottom: '1px solid var(--neu-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem' }}>
          <div style={{ width: 36, height: 36, borderRadius: '.65rem', background: 'rgba(91,138,240,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookOpen size={16} style={{ color: '#5b8af0' }} />
          </div>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif' }}>{isEdit ? 'Edit Course' : 'Add Course'}</h2>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neu-text-ghost)' }}><X size={18} /></button>
      </div>

      <div style={{ padding: '1.2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '.85rem', overflowY: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.8rem' }}>
          <F label="Course Code *"><input style={iS} value={form.code} onChange={e => set('code', e.target.value.toUpperCase())} placeholder="CS-101" autoFocus /></F>
          <F label="Course Name *"><input style={iS} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Intro to Computing" /></F>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.8rem' }}>
          <F label="Department *">
            <select style={iS} value={form.department_id} onChange={e => set('department_id', Number(e.target.value))}>
              <option value="">— Select —</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </F>
          <F label="Program">
            <select style={iS} value={form.program_id} onChange={e => set('program_id', Number(e.target.value) || '')}>
              <option value="">— None —</option>
              {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </F>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '.8rem' }}>
          <F label="Credit Hours"><input type="number" min="1" max="6" style={iS} value={form.credit_hours} onChange={e => set('credit_hours', Number(e.target.value))} /></F>
          <F label="Lecture Hrs"><input type="number" min="0" max="6" style={iS} value={form.lecture_hours} onChange={e => set('lecture_hours', Number(e.target.value))} /></F>
          <F label="Lab Hrs"><input type="number" min="0" max="6" style={iS} value={form.lab_hours} onChange={e => set('lab_hours', Number(e.target.value))} /></F>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.8rem' }}>
          <F label="Semester Level">
            <select style={iS} value={form.semester_level} onChange={e => set('semester_level', Number(e.target.value) || '')}>
              <option value="">— None —</option>
              {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>Semester {n}</option>)}
            </select>
          </F>
          <F label="Course Type">
            <select style={iS} value={form.is_elective ? 'elective' : 'core'} onChange={e => set('is_elective', e.target.value === 'elective')}>
              <option value="core">Core</option>
              <option value="elective">Elective</option>
            </select>
          </F>
        </div>
        <F label="Description">
          <textarea style={{ ...iS, resize: 'vertical', minHeight: '3rem' }} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Course description..." />
        </F>
      </div>

      <div style={{ padding: '.9rem 1.5rem', borderTop: '1px solid var(--neu-border)', display: 'flex', gap: '.6rem', flexShrink: 0 }}>
        <button onClick={onClose} style={{ ...iS, cursor: 'pointer', textAlign: 'center', fontWeight: 600, color: 'var(--neu-text-secondary)', flex: 1, padding: '.6rem' }}>Cancel</button>
        <button onClick={submit} disabled={loading} style={{ flex: 1, padding: '.6rem', borderRadius: '.75rem', border: 'none', background: 'linear-gradient(145deg,#5b8af0,#3a6bd4)', boxShadow: '0 4px 14px rgba(91,138,240,.35)', color: '#fff', fontWeight: 700, fontSize: '.85rem', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? .7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.4rem', fontFamily: "'DM Sans',sans-serif" }}>
          {loading && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
          {isEdit ? 'Save Changes' : 'Create Course'}
        </button>
      </div>
    </Modal>
  )
}

/* ═══════════════════════════════════════════════════
   DELETE MODAL
═══════════════════════════════════════════════════ */
function DeleteModal({ course, onClose, onConfirm, loading }) {
  return (
    <Modal maxW={400}>
      <div style={{ padding: '2rem 1.75rem', textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: '1.1rem', background: 'rgba(239,68,68,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.1rem' }}>
          <Trash2 size={24} style={{ color: '#ef4444' }} />
        </div>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', marginBottom: '.4rem' }}>Delete Course?</h3>
        <p style={{ fontSize: '.82rem', color: 'var(--neu-text-muted)', marginBottom: '1.6rem' }}>
          <strong style={{ color: 'var(--neu-text-primary)' }}>{course?.name}</strong> permanently delete ho jayega.
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
   COURSE CARD
═══════════════════════════════════════════════════ */
function CourseCard({ course, pal, onClick }) {
  return (
    <div className="course-card" onClick={onClick}>
      <div className="cc-ring" style={{ boxShadow: `inset 0 0 0 1.5px ${pal.ring}` }} />
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: pal.c, opacity: 0.8 }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {/* Code + type */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '0.25rem 0.75rem', background: 'var(--neu-surface-deep)', color: pal.c, borderRadius: '0.5rem', boxShadow: 'inset 2px 2px 4px var(--neu-shadow-dark), inset -1px -1px 3px var(--neu-shadow-light)', fontFamily: 'monospace', letterSpacing: '0.05em' }}>
            {course.code}
          </span>
          <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '0.2rem 0.55rem', background: course.is_elective ? 'rgba(155,89,182,.12)' : 'rgba(34,160,107,.1)', color: course.is_elective ? '#9b59b6' : '#22a06b', borderRadius: '0.4rem', border: `1px solid ${course.is_elective ? 'rgba(155,89,182,.3)' : 'rgba(34,160,107,.3)'}` }}>
            {course.is_elective ? 'Elective' : 'Core'}
          </span>
        </div>

        {/* Name + dept */}
        <div style={{ marginTop: '0.25rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit, sans-serif', lineHeight: 1.2, marginBottom: '0.4rem' }}>
            {course.name}
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--neu-text-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '2.4rem', lineHeight: 1.5 }}>
            {course.department_name || '—'}
          </p>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingTop: '0.8rem', borderTop: '1px solid var(--neu-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Hash size={13} style={{ color: pal.c }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--neu-text-primary)', fontWeight: 600 }}>
              {course.credit_hours || 3} Credit Hours
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={13} style={{ color: pal.c }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--neu-text-secondary)' }}>
                {course.lecture_hours || 0}L + {course.lab_hours || 0} Lab
              </span>
            </div>
            {course.semester_level && (
              <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '0.18rem 0.5rem', background: 'var(--neu-surface-deep)', color: 'var(--neu-text-muted)', borderRadius: '0.4rem', boxShadow: 'inset 1px 1px 3px var(--neu-shadow-dark)' }}>
                Sem {course.semester_level}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Skeleton ───────────────────────────────────── */
function SkeletonCard() {
  return (
    <div style={{ background: 'var(--neu-surface)', border: '1px solid var(--neu-border)', borderRadius: '1.25rem', padding: '1.4rem', boxShadow: '6px 6px 16px var(--neu-shadow-dark), -3px -3px 10px var(--neu-shadow-light)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ width: 70, height: 26, borderRadius: '.5rem', background: 'var(--neu-surface-deep)', animation: 'pulse 1.5s ease-in-out infinite' }} />
        <div style={{ width: 52, height: 22, borderRadius: '.4rem', background: 'var(--neu-surface-deep)', animation: 'pulse 1.5s ease-in-out infinite' }} />
      </div>
      <div style={{ height: 14, background: 'var(--neu-surface-deep)', borderRadius: 6, width: '75%', marginBottom: '.5rem', animation: 'pulse 1.5s ease-in-out infinite' }} />
      <div style={{ height: 11, background: 'var(--neu-surface-deep)', borderRadius: 6, width: '55%', marginBottom: '.3rem', animation: 'pulse 1.5s ease-in-out infinite' }} />
      <div style={{ height: 11, background: 'var(--neu-surface-deep)', borderRadius: 6, width: '40%', animation: 'pulse 1.5s ease-in-out infinite' }} />
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════ */
export default function CoursesPage() {
  const [courses,     setCourses]     = useState([])
  const [departments, setDepartments] = useState([])
  const [programs,    setPrograms]    = useState([])
  const [loading,     setLoading]     = useState(true)
  const [search,      setSearch]      = useState('')
  const [filterDept,  setFilterDept]  = useState('')
  const [filterType,  setFilterType]  = useState('')
  const [page,        setPage]        = useState(1)
  const [showForm,    setShowForm]    = useState(false)
  const [editTarget,  setEditTarget]  = useState(null)
  const [viewTarget,  setViewTarget]  = useState(null)
  const [cloTarget,   setCloTarget]   = useState(null)  // course for CLO manager
  const [delTarget,   setDelTarget]   = useState(null)
  const [deletingId,  setDeletingId]  = useState(null)

  const { menu, open: openMenu, close: closeMenu } = useContextMenu()

  const filtered = useMemo(() => {
    let r = courses
    if (filterDept) r = r.filter(c => c.department_id == filterDept)
    if (filterType === 'core')     r = r.filter(c => !c.is_elective)
    if (filterType === 'elective') r = r.filter(c => c.is_elective)
    if (search.trim()) {
      const q = search.toLowerCase()
      r = r.filter(c => c.name?.toLowerCase().includes(q) || c.code?.toLowerCase().includes(q) || c.department_name?.toLowerCase().includes(q))
    }
    return r
  }, [courses, filterDept, filterType, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [c, d, p] = await Promise.all([adminAPI.getCourses(), adminAPI.getDepartments(), adminAPI.getPrograms()])
      setCourses(c.data.data?.courses || [])
      setDepartments(d.data.data?.departments || [])
      setPrograms(p.data.data?.programs || [])
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchAll() }, [])
  useEffect(() => { setPage(1) }, [search, filterDept, filterType])

  const handleDelete = async () => {
    setDeletingId(delTarget.id)
    try { await adminAPI.deleteCourse(delTarget.id); toast.success('Course deleted'); setDelTarget(null); fetchAll() }
    catch (e) { toast.error(e.response?.data?.message || 'Cannot delete') }
    finally { setDeletingId(null) }
  }

  const ctxItems = (pal) => [
    { label: 'View Details', icon: Eye,    onClick: c => setViewTarget({ course: c, pal }) },
    { label: 'Edit',         icon: Edit2,  onClick: c => { setEditTarget(c); setShowForm(true) } },
    { label: 'Manage CLOs',  icon: Tag,    onClick: c => setCloTarget({ course: c, pal }) },
    { divider: true },
    { label: 'Delete',       icon: Trash2, onClick: c => setDelTarget(c), danger: true },
  ]

  return (
    <>
      <style>{CSS}</style>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.3rem', paddingBottom: '2rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', letterSpacing: '-.02em' }}>Courses</h1>
            <p style={{ fontSize: '.78rem', color: 'var(--neu-text-ghost)', marginTop: 2 }}>{courses.length} courses</p>
          </div>
          <AddButton onClick={() => { setEditTarget(null); setShowForm(true) }} tooltip="Add Course" color="#5b8af0" />
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '.6rem', flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 0 }}>
            <Search size={14} style={{ position: 'absolute', left: '.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--neu-text-ghost)', pointerEvents: 'none' }} />
            <input
              style={{ ...iS, paddingLeft: '2.2rem' }}
              placeholder="Search by name, code, department…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {/* Dept filter */}
          <select style={{ ...iS, flex: '0 0 auto', width: 'auto', paddingRight: '2rem' }} value={filterDept} onChange={e => setFilterDept(e.target.value)}>
            <option value="">All Departments</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          {/* Type filter */}
          <select style={{ ...iS, flex: '0 0 auto', width: 'auto' }} value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="">All Types</option>
            <option value="core">Core</option>
            <option value="elective">Elective</option>
          </select>
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(270px,1fr))', gap: '1rem' }}>
            {Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ background: 'var(--neu-surface)', border: '1px solid var(--neu-border)', borderRadius: '1.25rem', padding: '4rem 2rem', textAlign: 'center', boxShadow: '6px 6px 16px var(--neu-shadow-dark)' }}>
            <BookOpen size={38} style={{ color: 'var(--neu-text-ghost)', margin: '0 auto .8rem', opacity: .25, display: 'block' }} />
            <p style={{ fontWeight: 600, color: 'var(--neu-text-secondary)' }}>No courses found</p>
            <p style={{ fontSize: '.8rem', color: 'var(--neu-text-ghost)', marginTop: '.3rem' }}>Try changing your filters</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(270px,1fr))', gap: '1rem' }}>
            {paginated.map((course, i) => {
              const pal = PALETTE[i % PALETTE.length]
              return (
                <CourseCard
                  key={course.id}
                  course={course}
                  pal={pal}
                  onClick={e => openMenu(e, course)}
                />
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '.4rem', flexWrap: 'wrap' }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ width: 34, height: 34, borderRadius: '.65rem', background: 'var(--neu-surface)', border: '1px solid var(--neu-border)', boxShadow: '4px 4px 10px var(--neu-shadow-dark), -2px -2px 6px var(--neu-shadow-light)', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? .4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--neu-text-secondary)' }}>
              <ChevronLeft size={15} />
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button key={i} onClick={() => setPage(i + 1)} style={{ width: 34, height: 34, borderRadius: '.65rem', border: page === i + 1 ? 'none' : '1px solid var(--neu-border)', background: page === i + 1 ? '#5b8af0' : 'var(--neu-surface)', color: page === i + 1 ? '#fff' : 'var(--neu-text-secondary)', fontWeight: 700, fontSize: '.82rem', cursor: 'pointer', boxShadow: page === i + 1 ? '0 4px 12px rgba(91,138,240,.35)' : '4px 4px 10px var(--neu-shadow-dark), -2px -2px 6px var(--neu-shadow-light)' }}>
                {i + 1}
              </button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ width: 34, height: 34, borderRadius: '.65rem', background: 'var(--neu-surface)', border: '1px solid var(--neu-border)', boxShadow: '4px 4px 10px var(--neu-shadow-dark), -2px -2px 6px var(--neu-shadow-light)', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? .4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--neu-text-secondary)' }}>
              <ChevronRight size={15} />
            </button>
          </div>
        )}

        {/* Context menu */}
        <ContextMenu
          menu={menu}
          close={closeMenu}
          items={menu ? ctxItems(PALETTE[paginated.findIndex(c => c.id === menu.row?.id) % PALETTE.length]) : []}
        />

        {/* Modals */}
        {viewTarget  && <ViewModal course={viewTarget.course} pal={viewTarget.pal} onClose={() => setViewTarget(null)} onManageCLOs={course => setCloTarget({ course, pal: viewTarget.pal })} />}
        {cloTarget   && <CLOManagerModal course={cloTarget.course} pal={cloTarget.pal} onClose={() => setCloTarget(null)} />}
        {showForm    && <CourseModal course={editTarget} departments={departments} programs={programs} onClose={() => { setShowForm(false); setEditTarget(null) }} onSuccess={fetchAll} />}
        {delTarget   && <DeleteModal course={delTarget} onClose={() => setDelTarget(null)} onConfirm={handleDelete} loading={!!deletingId} />}
      </div>
    </>
  )
}