// ═══════════════════════════════════════════════════════════════
//  CoursesPage.jsx  —  frontend/src/pages/admin/CoursesPage.jsx
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect, useMemo } from 'react'
import {
  Plus, Search, BookOpen, Hash, Clock, Building2,
  Loader2, Edit2, Trash2, Eye, X, Tag, Layers,
  ChevronLeft, ChevronRight,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { adminAPI } from '../../api/admin.api'
import { useContextMenu, ContextMenu } from '../../hooks/useContextMenu'

/* ─── Global CSS ─────────────────────────────────── */
const CSS = `
  .course-card {
    background: var(--neu-surface);
    border: 1px solid var(--neu-border);
    border-radius: 1.25rem;
    box-shadow: 6px 6px 16px var(--neu-shadow-dark), -3px -3px 10px var(--neu-shadow-light);
    padding: 1.35rem;
    position: relative;
    overflow: hidden;
    cursor: context-menu;
    user-select: none;
    transition: transform .22s ease, box-shadow .22s ease;
  }
  .course-card:hover {
    transform: translateY(-4px);
    box-shadow: 10px 18px 30px var(--neu-shadow-dark), -4px -4px 14px var(--neu-shadow-light);
  }
  .course-card:hover .cc-ring { opacity: 1; }
  .cc-ring {
    position: absolute; inset: 0; border-radius: 1.25rem;
    pointer-events: none; opacity: 0;
    transition: opacity .22s ease;
  }
`

/* ─── Shared ─────────────────────────────────────── */
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

/* ─── Modal Shell ────────────────────────────────── */
function Modal({ children, maxW = 520 }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(8,12,20,.7)', backdropFilter: 'blur(10px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: maxW, background: 'var(--neu-surface)', boxShadow: '14px 14px 36px var(--neu-shadow-dark), -6px -6px 20px var(--neu-shadow-light)', border: '1px solid var(--neu-border)', borderRadius: '1.5rem', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'neu-slide-up .2s cubic-bezier(.34,1.56,.64,1) both' }}>
        {children}
      </div>
    </div>
  )
}

/* ─── View Modal ─────────────────────────────────── */
function ViewModal({ course, pal, onClose }) {
  const rows = [
    { label: 'Code',           value: course.code },
    { label: 'Department',     value: course.department_name },
    { label: 'Credit Hours',   value: course.credit_hours ? `${course.credit_hours} cr` : null },
    { label: 'Lecture Hours',  value: course.lecture_hours != null ? `${course.lecture_hours} hr` : null },
    { label: 'Lab Hours',      value: course.lab_hours != null ? `${course.lab_hours} hr` : null },
    { label: 'Semester Level', value: course.semester_level ? `Semester ${course.semester_level}` : null },
    { label: 'Type',           value: course.is_elective ? 'Elective' : 'Core' },
    { label: 'Program',        value: course.program_name },
    { label: 'Description',    value: course.description },
  ].filter(r => r.value)

  return (
    <Modal maxW={480}>
      <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--neu-border)', display: 'flex', alignItems: 'center', gap: '.85rem' }}>
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
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neu-text-ghost)', padding: '.25rem', borderRadius: '.5rem' }}><X size={18} /></button>
      </div>
      <div style={{ padding: '1.1rem 1.4rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.55rem', overflowY: 'auto' }}>
        {rows.map(r => (
          <div key={r.label} style={{ background: 'var(--neu-surface-deep)', borderRadius: '.8rem', padding: '.7rem 1rem', boxShadow: 'inset 2px 2px 5px var(--neu-shadow-dark), inset -1px -1px 4px var(--neu-shadow-light)', gridColumn: r.label === 'Description' ? 'span 2' : 'span 1' }}>
            <p style={{ fontSize: '.62rem', fontWeight: 700, color: 'var(--neu-text-ghost)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: '.2rem' }}>{r.label}</p>
            <p style={{ fontSize: '.85rem', color: 'var(--neu-text-primary)', fontWeight: 500, lineHeight: 1.5 }}>{r.value}</p>
          </div>
        ))}
      </div>
      <div style={{ padding: '.9rem 1.4rem', borderTop: '1px solid var(--neu-border)' }}>
        <button onClick={onClose} style={{ ...iS, cursor: 'pointer', textAlign: 'center', fontWeight: 600, color: 'var(--neu-text-secondary)', padding: '.6rem' }}>Close</button>
      </div>
    </Modal>
  )
}

/* ─── Course Form Modal ──────────────────────────── */
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
    <Modal maxW={580}>
      <div style={{ padding: '1.4rem 1.5rem', borderBottom: '1px solid var(--neu-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem' }}>
          <div style={{ width: 34, height: 34, borderRadius: '.65rem', background: 'rgba(91,138,240,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><BookOpen size={15} style={{ color: '#5b8af0' }} /></div>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif' }}>{isEdit ? 'Edit Course' : 'Add Course'}</h2>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neu-text-ghost)' }}><X size={18} /></button>
      </div>

      <div style={{ padding: '1.2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '.85rem', overflowY: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.8rem' }}>
          <F label="Course Code *"><input style={iS} value={form.code} onChange={e => set('code', e.target.value.toUpperCase())} placeholder="IT-301" autoFocus /></F>
          <F label="Course Name *"><input style={iS} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Web Technologies" /></F>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '.8rem' }}>
          <F label="Credit Hours">
            <select style={iS} value={form.credit_hours} onChange={e => set('credit_hours', Number(e.target.value))}>
              {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </F>
          <F label="Lecture Hours">
            <select style={iS} value={form.lecture_hours} onChange={e => set('lecture_hours', Number(e.target.value))}>
              {[0,1,2,3,4].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </F>
          <F label="Lab Hours">
            <select style={iS} value={form.lab_hours} onChange={e => set('lab_hours', Number(e.target.value))}>
              {[0,1,2,3].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </F>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.8rem' }}>
          <F label="Department *">
            <select style={iS} value={form.department_id} onChange={e => set('department_id', Number(e.target.value))}>
              <option value="">— Select Department —</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </F>
          <F label="Program">
            <select style={iS} value={form.program_id} onChange={e => set('program_id', Number(e.target.value))}>
              <option value="">— Select Program —</option>
              {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </F>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.8rem' }}>
          <F label="Semester Level">
            <select style={iS} value={form.semester_level} onChange={e => set('semester_level', Number(e.target.value))}>
              <option value="">— Any —</option>
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

      <div style={{ padding: '.9rem 1.5rem', borderTop: '1px solid var(--neu-border)', display: 'flex', gap: '.6rem' }}>
        <button onClick={onClose} style={{ ...iS, cursor: 'pointer', textAlign: 'center', fontWeight: 600, color: 'var(--neu-text-secondary)', flex: 1, padding: '.6rem' }}>Cancel</button>
        <button onClick={submit} disabled={loading} style={{ flex: 1, padding: '.6rem', borderRadius: '.75rem', border: 'none', background: 'linear-gradient(145deg,#5b8af0,#3a6bd4)', boxShadow: '0 4px 14px rgba(91,138,240,.35)', color: '#fff', fontWeight: 700, fontSize: '.85rem', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? .7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.4rem', fontFamily: "'DM Sans',sans-serif" }}>
          {loading && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
          {isEdit ? 'Save Changes' : 'Create Course'}
        </button>
      </div>
    </Modal>
  )
}

/* ─── Delete Modal ───────────────────────────────── */
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

/* ─── Course Card ────────────────────────────────── */
function CourseCard({ course, pal, onContextMenu }) {
  return (
    <div className="course-card" onContextMenu={onContextMenu}>
      <div className="cc-ring" style={{ boxShadow: `inset 0 0 0 1.5px ${pal.ring}` }} />
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, borderRadius: '1.25rem 1.25rem 0 0', background: `linear-gradient(90deg,${pal.c},${pal.c}44,transparent)` }} />

      {/* header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ width: 44, height: 44, borderRadius: '.875rem', background: pal.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <BookOpen size={20} style={{ color: pal.c }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '.3rem' }}>
          <span style={{ fontSize: '.63rem', fontWeight: 800, padding: '.18rem .55rem', background: pal.bg, color: pal.c, border: `1px solid ${pal.ring}`, borderRadius: '.4rem', fontFamily: 'monospace' }}>{course.code}</span>
          <span style={{ fontSize: '.6rem', fontWeight: 700, padding: '.15rem .45rem', background: course.is_elective ? 'rgba(155,89,182,.12)' : 'rgba(34,160,107,.1)', color: course.is_elective ? '#9b59b6' : '#22a06b', borderRadius: '.35rem' }}>
            {course.is_elective ? 'Elective' : 'Core'}
          </span>
        </div>
      </div>

      {/* name */}
      <h3 style={{ fontSize: '.93rem', fontWeight: 700, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', lineHeight: 1.3, marginBottom: '.2rem' }}>{course.name}</h3>
      {course.department_name && (
        <p style={{ fontSize: '.72rem', color: 'var(--neu-text-ghost)', marginBottom: '.8rem', display: 'flex', alignItems: 'center', gap: '.3rem' }}>
          <Building2 size={10} />{course.department_name}
        </p>
      )}

      {/* stats */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '.7rem', paddingTop: '.7rem', borderTop: '1px solid var(--neu-border)', flexWrap: 'wrap' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '.3rem', fontSize: '.71rem', color: 'var(--neu-text-muted)', fontWeight: 500 }}>
          <Hash size={11} style={{ color: 'var(--neu-text-ghost)' }} />{course.credit_hours || 3} cr
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '.3rem', fontSize: '.71rem', color: 'var(--neu-text-muted)', fontWeight: 500 }}>
          <Clock size={11} style={{ color: 'var(--neu-text-ghost)' }} />{course.lecture_hours || 0}L + {course.lab_hours || 0}Lab
        </span>
        {course.semester_level && (
          <span style={{ marginLeft: 'auto', fontSize: '.68rem', fontWeight: 700, padding: '.12rem .45rem', background: 'var(--neu-surface-deep)', color: 'var(--neu-text-muted)', borderRadius: '.4rem' }}>
            Sem {course.semester_level}
          </span>
        )}
      </div>
      <span style={{ position: 'absolute', bottom: '.5rem', right: '.7rem', fontSize: '.58rem', color: 'var(--neu-text-ghost)', opacity: .4, pointerEvents: 'none' }}>⊞ right-click</span>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div style={{ background: 'var(--neu-surface)', border: '1px solid var(--neu-border)', borderRadius: '1.25rem', padding: '1.35rem', boxShadow: '6px 6px 16px var(--neu-shadow-dark)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ width: 44, height: 44, borderRadius: '.875rem', background: 'var(--neu-surface-deep)', animation: 'pulse 1.5s infinite' }} />
        <div style={{ width: 52, height: 22, borderRadius: '.4rem', background: 'var(--neu-surface-deep)', animation: 'pulse 1.5s infinite' }} />
      </div>
      <div style={{ height: 13, background: 'var(--neu-surface-deep)', borderRadius: 6, width: '70%', marginBottom: '.5rem', animation: 'pulse 1.5s infinite' }} />
      <div style={{ height: 10, background: 'var(--neu-surface-deep)', borderRadius: 6, width: '45%', animation: 'pulse 1.5s infinite' }} />
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
            <p style={{ fontSize: '.78rem', color: 'var(--neu-text-ghost)', marginTop: 2 }}>{courses.length} courses in curriculum</p>
          </div>
          <button onClick={() => { setEditTarget(null); setShowForm(true) }} style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.65rem 1.25rem', background: 'linear-gradient(145deg,#5b8af0,#3a6bd4)', boxShadow: '0 4px 16px rgba(91,138,240,.38), 6px 6px 14px var(--neu-shadow-dark), -3px -3px 8px var(--neu-shadow-light)', border: '1px solid rgba(255,255,255,.18)', borderRadius: '.9rem', color: '#fff', fontWeight: 700, fontSize: '.82rem', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>
            <Plus size={16} /> Add Course
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 300 }}>
            <Search size={14} style={{ position: 'absolute', left: '.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--neu-text-ghost)', pointerEvents: 'none' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search courses…" style={{ ...iS, paddingLeft: '2.25rem' }} />
          </div>
          <select value={filterDept} onChange={e => setFilterDept(e.target.value)} style={{ ...iS, width: 'auto', minWidth: 170 }}>
            <option value="">All Departments</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ ...iS, width: 'auto', minWidth: 130 }}>
            <option value="">Core + Elective</option>
            <option value="core">Core only</option>
            <option value="elective">Elective only</option>
          </select>
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: '1rem' }}>
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : paginated.length === 0 ? (
          <div style={{ background: 'var(--neu-surface)', border: '1px solid var(--neu-border)', borderRadius: '1.25rem', padding: '4rem 2rem', textAlign: 'center', boxShadow: '6px 6px 16px var(--neu-shadow-dark)' }}>
            <BookOpen size={38} style={{ color: 'var(--neu-text-ghost)', margin: '0 auto .8rem', opacity: .25, display: 'block' }} />
            <p style={{ fontWeight: 600, color: 'var(--neu-text-secondary)' }}>{search || filterDept || filterType ? 'No courses match' : 'No courses yet'}</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: '1rem' }}>
            {paginated.map((course, i) => {
              const pal = PALETTE[((page - 1) * PER_PAGE + i) % PALETTE.length]
              return <CourseCard key={course.id} course={course} pal={pal} onContextMenu={e => openMenu(e, course)} />
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.6rem' }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ width: 34, height: 34, borderRadius: '.65rem', background: 'var(--neu-surface)', border: '1px solid var(--neu-border)', boxShadow: '4px 4px 10px var(--neu-shadow-dark), -2px -2px 6px var(--neu-shadow-light)', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? .4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--neu-text-secondary)' }}>
              <ChevronLeft size={15} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i} onClick={() => setPage(i + 1)} style={{ width: 34, height: 34, borderRadius: '.65rem', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '.82rem', fontFamily: "'DM Sans',sans-serif", background: page === i + 1 ? 'linear-gradient(145deg,#5b8af0,#3a6bd4)' : 'var(--neu-surface)', color: page === i + 1 ? '#fff' : 'var(--neu-text-secondary)', boxShadow: page === i + 1 ? '0 4px 12px rgba(91,138,240,.35)' : '4px 4px 10px var(--neu-shadow-dark), -2px -2px 6px var(--neu-shadow-light)' }}>
                {i + 1}
              </button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ width: 34, height: 34, borderRadius: '.65rem', background: 'var(--neu-surface)', border: '1px solid var(--neu-border)', boxShadow: '4px 4px 10px var(--neu-shadow-dark), -2px -2px 6px var(--neu-shadow-light)', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? .4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--neu-text-secondary)' }}>
              <ChevronRight size={15} />
            </button>
          </div>
        )}

        {/* Context menu */}
        <ContextMenu menu={menu} close={closeMenu} items={menu ? ctxItems(PALETTE[paginated.findIndex(c => c.id === menu.row?.id) % PALETTE.length]) : []} />

        {/* Modals */}
        {viewTarget && <ViewModal course={viewTarget.course} pal={viewTarget.pal} onClose={() => setViewTarget(null)} />}
        {showForm   && <CourseModal course={editTarget} departments={departments} programs={programs} onClose={() => { setShowForm(false); setEditTarget(null) }} onSuccess={fetchAll} />}
        {delTarget  && <DeleteModal course={delTarget} onClose={() => setDelTarget(null)} onConfirm={handleDelete} loading={!!deletingId} />}
      </div>
    </>
  )
}