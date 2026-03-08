// ═══════════════════════════════════════════════════════════════
//  DepartmentsPage.jsx  —  frontend/src/pages/admin/DepartmentsPage.jsx
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect, useMemo } from 'react'
import {
  Plus, Search, Building2, BookOpen, User,
  Loader2, Edit2, Trash2, Eye, X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { adminAPI } from '../../api/admin.api'
import { useContextMenu, ContextMenu } from '../../hooks/useContextMenu'

/* ─── CSS injected once ──────────────────────────── */
const CSS = `
  .dept-card {
    background: var(--neu-surface);
    border: 1px solid var(--neu-border);
    border-radius: 1.25rem;
    box-shadow: 6px 6px 16px var(--neu-shadow-dark), -3px -3px 10px var(--neu-shadow-light);
    padding: 1.4rem;
    position: relative;
    overflow: hidden;
    cursor: context-menu;
    user-select: none;
    transition:
      box-shadow 0.25s ease,
      border-color 0.25s ease,
      transform 0.25s ease;
  }
  .dept-card:hover {
    transform: translateY(-4px);
    box-shadow:
      10px 18px 32px var(--neu-shadow-dark),
      -4px -4px 14px var(--neu-shadow-light);
  }
  .dept-card:hover .card-accent-border {
    opacity: 1;
  }
  .card-accent-border {
    position: absolute;
    inset: 0;
    border-radius: 1.25rem;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.25s ease;
  }
`

/* ─── Shared form input style ────────────────────── */
const iS = {
  width: '100%',
  background: 'var(--neu-surface-deep)',
  boxShadow: 'inset 3px 3px 7px var(--neu-shadow-dark), inset -2px -2px 5px var(--neu-shadow-light)',
  border: '1px solid var(--neu-border)',
  borderRadius: '.75rem',
  padding: '.6rem .9rem',
  fontSize: '.85rem',
  color: 'var(--neu-text-primary)',
  outline: 'none',
  fontFamily: "'DM Sans', sans-serif",
}

const Field = ({ label, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '.35rem' }}>
    <label style={{ fontSize: '.68rem', fontWeight: 700, color: 'var(--neu-text-ghost)', letterSpacing: '.06em', textTransform: 'uppercase' }}>{label}</label>
    {children}
  </div>
)

/* ─── Accent colours per card ────────────────────── */
const PALETTE = [
  { c: '#5b8af0', bg: 'rgba(91,138,240,.1)',  ring: 'rgba(91,138,240,.35)'  },
  { c: '#9b59b6', bg: 'rgba(155,89,182,.1)',  ring: 'rgba(155,89,182,.35)'  },
  { c: '#22a06b', bg: 'rgba(34,160,107,.1)',  ring: 'rgba(34,160,107,.35)'  },
  { c: '#f97316', bg: 'rgba(249,115,22,.1)',  ring: 'rgba(249,115,22,.35)'  },
  { c: '#ef4444', bg: 'rgba(239,68,68,.1)',   ring: 'rgba(239,68,68,.35)'   },
  { c: '#f59e0b', bg: 'rgba(245,158,11,.1)',  ring: 'rgba(245,158,11,.35)'  },
  { c: '#06b6d4', bg: 'rgba(6,182,212,.1)',   ring: 'rgba(6,182,212,.35)'   },
]

/* ─── Modal shell ────────────────────────────────── */
function Modal({ children, maxW = 420 }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(8,12,20,.7)', backdropFilter: 'blur(10px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: maxW, background: 'var(--neu-surface)', boxShadow: '14px 14px 36px var(--neu-shadow-dark), -6px -6px 20px var(--neu-shadow-light)', border: '1px solid var(--neu-border)', borderRadius: '1.5rem', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'neu-slide-up .2s cubic-bezier(.34,1.56,.64,1) both' }}>
        {children}
      </div>
    </div>
  )
}

/* ─── View Modal ─────────────────────────────────── */
function ViewModal({ dept, pal, onClose }) {
  const rows = [
    { label: 'Code',            value: dept.code },
    { label: 'Head of Dept',    value: dept.hod_name },
    { label: 'Total Programs',  value: dept.total_programs != null ? `${dept.total_programs}` : null },
    { label: 'Description',     value: dept.description, wide: true },
  ].filter(r => r.value)

  return (
    <Modal maxW={440}>
      {/* Header */}
      <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--neu-border)', display: 'flex', alignItems: 'center', gap: '.85rem' }}>
        <div style={{ width: 50, height: 50, borderRadius: '1rem', background: pal.bg, border: `1px solid ${pal.ring}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Building2 size={22} style={{ color: pal.c }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', lineHeight: 1.25 }}>{dept.name}</h2>
          <span style={{ display: 'inline-block', marginTop: '.25rem', fontSize: '.65rem', fontWeight: 800, padding: '.15rem .55rem', background: pal.bg, color: pal.c, border: `1px solid ${pal.ring}`, borderRadius: '.4rem', fontFamily: 'monospace' }}>{dept.code}</span>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neu-text-ghost)', padding: '.25rem', borderRadius: '.5rem' }}>
          <X size={18} />
        </button>
      </div>

      {/* Info rows */}
      <div style={{ padding: '1.1rem 1.4rem', display: 'flex', flexDirection: 'column', gap: '.55rem', overflowY: 'auto' }}>
        {rows.map(r => (
          <div key={r.label} style={{ background: 'var(--neu-surface-deep)', borderRadius: '.8rem', padding: '.75rem 1rem', boxShadow: 'inset 2px 2px 5px var(--neu-shadow-dark), inset -1px -1px 4px var(--neu-shadow-light)' }}>
            <p style={{ fontSize: '.62rem', fontWeight: 700, color: 'var(--neu-text-ghost)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: '.2rem' }}>{r.label}</p>
            <p style={{ fontSize: '.85rem', color: 'var(--neu-text-primary)', fontWeight: 500, lineHeight: 1.5 }}>{r.value}</p>
          </div>
        ))}
        {rows.length === 0 && (
          <p style={{ textAlign: 'center', color: 'var(--neu-text-ghost)', fontSize: '.85rem', padding: '1.5rem' }}>No additional details</p>
        )}
      </div>

      <div style={{ padding: '.9rem 1.4rem', borderTop: '1px solid var(--neu-border)' }}>
        <button onClick={onClose} style={{ ...iS, cursor: 'pointer', textAlign: 'center', fontWeight: 600, color: 'var(--neu-text-secondary)', padding: '.6rem' }}>Close</button>
      </div>
    </Modal>
  )
}

/* ─── Create / Edit Modal ────────────────────────── */
function DeptModal({ dept, teachers, onClose, onSuccess }) {
  const isEdit = !!dept?.id
  const [form, setForm] = useState({
    name: dept?.name || '', code: dept?.code || '',
    description: dept?.description || '', head_of_department: dept?.head_of_department || '',
  })
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const submit = async () => {
    if (!form.name.trim() || !form.code.trim()) { toast.error('Name and code required'); return }
    setLoading(true)
    try {
      isEdit ? await adminAPI.updateDepartment(dept.id, form) : await adminAPI.createDepartment(form)
      toast.success(isEdit ? 'Department updated!' : 'Department created!')
      onSuccess(); onClose()
    } catch (e) { toast.error(e.response?.data?.message || 'Failed') }
    finally { setLoading(false) }
  }

  return (
    <Modal maxW={480}>
      <div style={{ padding: '1.4rem 1.5rem', borderBottom: '1px solid var(--neu-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem' }}>
          <div style={{ width: 34, height: 34, borderRadius: '.65rem', background: 'rgba(91,138,240,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building2 size={15} style={{ color: '#5b8af0' }} />
          </div>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif' }}>{isEdit ? 'Edit Department' : 'Add Department'}</h2>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neu-text-ghost)' }}><X size={18} /></button>
      </div>

      <div style={{ padding: '1.2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '.85rem', overflowY: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.8rem' }}>
          <Field label="Department Name *"><input style={iS} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Information Technology" autoFocus /></Field>
          <Field label="Code *"><input style={iS} value={form.code} onChange={e => set('code', e.target.value.toUpperCase())} placeholder="IT" maxLength={10} /></Field>
        </div>
        <Field label="Description">
          <textarea style={{ ...iS, resize: 'vertical', minHeight: '3.5rem' }} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Department description..." />
        </Field>
        <Field label="Head of Department">
          <select style={iS} value={form.head_of_department} onChange={e => set('head_of_department', e.target.value)}>
            <option value="">— Select HOD —</option>
            {teachers.map(t => <option key={t.user_id} value={t.user_id}>{t.full_name}</option>)}
          </select>
        </Field>
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

/* ─── Delete Confirm Modal ───────────────────────── */
function DeleteModal({ dept, onClose, onConfirm, loading }) {
  return (
    <Modal maxW={400}>
      <div style={{ padding: '2rem 1.75rem', textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: '1.1rem', background: 'rgba(239,68,68,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.1rem' }}>
          <Trash2 size={24} style={{ color: '#ef4444' }} />
        </div>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', marginBottom: '.4rem' }}>Delete Department?</h3>
        <p style={{ fontSize: '.82rem', color: 'var(--neu-text-muted)', marginBottom: '.4rem' }}>
          <strong style={{ color: 'var(--neu-text-primary)' }}>{dept?.name}</strong> permanently delete ho jayega.
        </p>
        <p style={{ fontSize: '.75rem', color: '#ef4444', marginBottom: '1.6rem' }}>Linked programs bhi remove ho jayenge.</p>
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

/* ─── Updated Dept Card ──────────────────────────────────── */
function DeptCard({ dept, pal, onContextMenu }) {
  return (
    <div className="dept-card" onContextMenu={onContextMenu}>
      {/* Hover accent ring */}
      <div className="card-accent-border" style={{ boxShadow: `inset 0 0 0 1.5px ${pal.ring}` }} />

      {/* Top accent stripe - subtle indicator */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: pal.c, opacity: 0.8 }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        
        {/* Header: Code Badge & Counter */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ 
            fontSize: '0.75rem', 
            fontWeight: 800, 
            padding: '0.25rem 0.75rem', 
            background: 'var(--neu-surface-deep)', 
            color: pal.c, 
            borderRadius: '0.5rem', 
            boxShadow: 'inset 2px 2px 4px var(--neu-shadow-dark), inset -1px -1px 3px var(--neu-shadow-light)',
            fontFamily: 'monospace',
            letterSpacing: '0.05em'
          }}>
            {dept.code}
          </span>
          
        </div>

        {/* Main Info: Department Name */}
        <div style={{ marginTop: '0.25rem' }}>
          <h3 style={{ 
            fontSize: '1.1rem', 
            fontWeight: 800, 
            color: 'var(--neu-text-primary)', 
            fontFamily: 'Outfit, sans-serif', 
            lineHeight: 1.2,
            marginBottom: '0.4rem'
          }}>
            {dept.name}
          </h3>
          
          {dept.description ? (
            <p style={{ 
              fontSize: '0.8rem', 
              color: 'var(--neu-text-secondary)', // Improved contrast from ghost to secondary
              lineHeight: 1.5, 
              display: '-webkit-box', 
              WebkitLineClamp: 2, 
              WebkitBoxOrient: 'vertical', 
              overflow: 'hidden',
              minHeight: '2.4rem'
            }}>
              {dept.description}
            </p>
          ) : (
            <div style={{ minHeight: '2.4rem' }} />
          )}
        </div>

        {/* Footer: Meta Info with better icons and contrast */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '0.5rem', 
          paddingTop: '0.8rem', 
          borderTop: '1px solid var(--neu-border)',
          marginTop: '0.4rem'
        }}>
          {/* HOD Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={13} style={{ color: pal.c }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--neu-text-primary)', fontWeight: 600 }}>
              {dept.hod_name || 'No HOD assigned'}
            </span>
          </div>

          {/* Programs Count */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookOpen size={13} style={{ color: pal.c }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--neu-text-secondary)' }}>
              {dept.total_programs || 0} Programs
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Skeleton card ──────────────────────────────── */
function SkeletonCard() {
  return (
    <div style={{ background: 'var(--neu-surface)', border: '1px solid var(--neu-border)', borderRadius: '1.25rem', padding: '1.4rem', boxShadow: '6px 6px 16px var(--neu-shadow-dark), -3px -3px 10px var(--neu-shadow-light)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ width: 44, height: 44, borderRadius: '.875rem', background: 'var(--neu-surface-deep)', animation: 'pulse 1.5s ease-in-out infinite' }} />
        <div style={{ width: 48, height: 22, borderRadius: '.4rem', background: 'var(--neu-surface-deep)', animation: 'pulse 1.5s ease-in-out infinite' }} />
      </div>
      <div style={{ height: 14, background: 'var(--neu-surface-deep)', borderRadius: 6, width: '70%', marginBottom: '.5rem', animation: 'pulse 1.5s ease-in-out infinite' }} />
      <div style={{ height: 11, background: 'var(--neu-surface-deep)', borderRadius: 6, width: '90%', marginBottom: '.3rem', animation: 'pulse 1.5s ease-in-out infinite' }} />
      <div style={{ height: 11, background: 'var(--neu-surface-deep)', borderRadius: 6, width: '60%', animation: 'pulse 1.5s ease-in-out infinite' }} />
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════ */
export default function DepartmentsPage() {
  const [departments, setDepartments] = useState([])
  const [teachers,    setTeachers]    = useState([])
  const [loading,     setLoading]     = useState(true)
  const [search,      setSearch]      = useState('')
  const [viewTarget,  setViewTarget]  = useState(null)   // { dept, pal }
  const [editTarget,  setEditTarget]  = useState(null)   // dept obj or null (new)
  const [showForm,    setShowForm]    = useState(false)
  const [delTarget,   setDelTarget]   = useState(null)
  const [deletingId,  setDeletingId]  = useState(null)

  const { menu, open: openMenu, close: closeMenu } = useContextMenu()

  const filtered = useMemo(() => {
    if (!search.trim()) return departments
    const q = search.toLowerCase()
    return departments.filter(d =>
      d.name?.toLowerCase().includes(q) ||
      d.code?.toLowerCase().includes(q) ||
      d.description?.toLowerCase().includes(q) ||
      d.hod_name?.toLowerCase().includes(q)
    )
  }, [departments, search])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [d, t] = await Promise.all([adminAPI.getDepartments(), adminAPI.getTeachers(1, 100)])
      setDepartments(d.data.data?.departments || [])
      setTeachers(t.data.data?.teachers || [])
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchAll() }, [])

  const handleDelete = async () => {
    setDeletingId(delTarget.id)
    try {
      await adminAPI.deleteDepartment(delTarget.id)
      toast.success('Department deleted')
      setDelTarget(null)
      fetchAll()
    } catch (e) { toast.error(e.response?.data?.message || 'Cannot delete') }
    finally { setDeletingId(null) }
  }

  // ctx items need access to pal at time of right-click
  const ctxItems = (pal) => [
    {
      label: 'View Details', icon: Eye,
      onClick: d => setViewTarget({ dept: d, pal }),
    },
    {
      label: 'Edit', icon: Edit2,
      onClick: d => { setEditTarget(d); setShowForm(true) },
    },
    { divider: true },
    {
      label: 'Delete', icon: Trash2,
      onClick: d => setDelTarget(d), danger: true,
    },
  ]

  return (
    <>
      <style>{CSS}</style>

      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.3rem', paddingBottom: '2rem' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', letterSpacing: '-.02em' }}>Departments</h1>
            <p style={{ fontSize: '.78rem', color: 'var(--neu-text-ghost)', marginTop: 2 }}>{departments.length} academic departments</p>
          </div>
          <button
            onClick={() => { setEditTarget(null); setShowForm(true) }}
            style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.65rem 1.25rem', background: 'linear-gradient(145deg,#5b8af0,#3a6bd4)', boxShadow: '0 4px 16px rgba(91,138,240,.38), 6px 6px 14px var(--neu-shadow-dark), -3px -3px 8px var(--neu-shadow-light)', border: '1px solid rgba(255,255,255,.18)', borderRadius: '.9rem', color: '#fff', fontWeight: 700, fontSize: '.82rem', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}
          >
            <Plus size={16} /> Add Department
          </button>
        </div>

        {/* ── Search ── */}
        <div style={{ position: 'relative', maxWidth: 340 }}>
          <Search size={14} style={{ position: 'absolute', left: '.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--neu-text-ghost)', pointerEvents: 'none' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, code, HOD…" style={{ ...iS, paddingLeft: '2.25rem' }} />
        </div>

        {/* ── Cards grid ── */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(270px,1fr))', gap: '1rem' }}>
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ background: 'var(--neu-surface)', border: '1px solid var(--neu-border)', borderRadius: '1.25rem', padding: '4rem 2rem', textAlign: 'center', boxShadow: '6px 6px 16px var(--neu-shadow-dark), -3px -3px 10px var(--neu-shadow-light)' }}>
            <Building2 size={38} style={{ color: 'var(--neu-text-ghost)', margin: '0 auto .8rem', opacity: .25, display: 'block' }} />
            <p style={{ fontWeight: 600, color: 'var(--neu-text-secondary)', fontSize: '.9rem' }}>{search ? 'No departments match your search' : 'No departments yet'}</p>
            <p style={{ fontSize: '.78rem', color: 'var(--neu-text-ghost)', marginTop: '.35rem' }}>{search ? 'Try a different keyword' : 'Create your first department'}</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(270px,1fr))', gap: '1rem' }}>
            {filtered.map((dept, i) => {
              const pal = PALETTE[i % PALETTE.length]
              return (
                <DeptCard
                  key={dept.id}
                  dept={dept}
                  pal={pal}
                  onContextMenu={e => openMenu(e, dept)}
                />
              )
            })}
          </div>
        )}

        {/* ── Context menu ── */}
        <ContextMenu
          menu={menu}
          close={closeMenu}
          items={menu ? ctxItems(PALETTE[filtered.findIndex(d => d.id === menu.row?.id) % PALETTE.length]) : []}
        />

        {/* ── Modals ── */}
        {viewTarget && <ViewModal dept={viewTarget.dept} pal={viewTarget.pal} onClose={() => setViewTarget(null)} />}
        {showForm   && <DeptModal dept={editTarget} teachers={teachers} onClose={() => { setShowForm(false); setEditTarget(null) }} onSuccess={fetchAll} />}
        {delTarget  && <DeleteModal dept={delTarget} onClose={() => setDelTarget(null)} onConfirm={handleDelete} loading={!!deletingId} />}
      </div>
    </>
  )
}