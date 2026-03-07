// ═══════════════════════════════════════════════════════════════
//  EnrollmentsPage.jsx  —  frontend/src/pages/admin/EnrollmentsPage.jsx
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect, useCallback } from 'react'
import {
  Users, Plus, Search, Loader2, X, BookOpen,
  CheckCircle2, XCircle, Award, Eye,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { adminAPI } from '../../api/admin.api'
import { formatDate } from '../../utils/helpers'
import { useContextMenu, ContextMenu } from '../../hooks/useContextMenu'

/* ─── CSS ─────────────────────────────────────────── */
const CSS = `
  .enr-row {
    display: grid;
    grid-template-columns: 2fr 100px 110px 80px 80px 70px 44px;
    align-items: center;
    gap: .6rem;
    padding: .7rem 1rem;
    border-radius: .85rem;
    border: 1px solid transparent;
    transition: background .14s ease, border-color .14s ease, transform .18s ease;
    position: relative;
    cursor: default;
  }
  .enr-row:hover {
    background: var(--neu-surface-deep);
    border-color: var(--neu-border);
    transform: translateX(3px);
  }
  .enr-row .rc-hint {
    position: absolute; right: 10px; bottom: 5px;
    font-size: .58rem; color: var(--neu-text-ghost);
    opacity: 0; transition: opacity .2s; pointer-events: none; font-family: monospace;
  }
  .enr-row:hover .rc-hint { opacity: .35; }
  .enr-row.status-enrolled  { border-left: 3px solid #5b8af0 !important; }
  .enr-row.status-dropped   { border-left: 3px solid #ef4444 !important; opacity: .65; }
  .enr-row.status-completed { border-left: 3px solid #22a06b !important; }
  .enr-row.status-withdrawn { border-left: 3px solid #94a3b8 !important; opacity: .65; }

  .filter-pill {
    padding: .32rem .85rem;
    border-radius: .6rem;
    border: 1.5px solid var(--neu-border);
    background: var(--neu-surface-deep);
    font-size: .75rem; font-weight: 700; cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    box-shadow: 3px 3px 7px var(--neu-shadow-dark), -1px -1px 4px var(--neu-shadow-light);
    transition: all .16s ease;
    color: var(--neu-text-muted);
  }
  .filter-pill.active-all      { background:#5b8af0; color:#fff; border-color:#5b8af0; box-shadow:0 3px 12px rgba(91,138,240,.35); }
  .filter-pill.active-enrolled { background:#5b8af0; color:#fff; border-color:#5b8af0; box-shadow:0 3px 12px rgba(91,138,240,.3); }
  .filter-pill.active-dropped  { background:#ef4444; color:#fff; border-color:#ef4444; box-shadow:0 3px 12px rgba(239,68,68,.3); }
  .filter-pill.active-completed{ background:#22a06b; color:#fff; border-color:#22a06b; box-shadow:0 3px 12px rgba(34,160,107,.3); }
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
  enrolled:  { c: '#5b8af0', bg: 'rgba(91,138,240,.1)',  label: 'Enrolled'  },
  dropped:   { c: '#ef4444', bg: 'rgba(239,68,68,.1)',   label: 'Dropped'   },
  completed: { c: '#22a06b', bg: 'rgba(34,160,107,.1)',  label: 'Completed' },
  withdrawn: { c: '#94a3b8', bg: 'rgba(148,163,184,.1)', label: 'Withdrawn' },
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
function MHead({ icon: Icon, title, sub, onClose, iconColor = '#5b8af0' }) {
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
function MFoot({ onClose, onConfirm, confirmLabel, confirmColor = 'linear-gradient(145deg,#5b8af0,#3a6bd4)', loading }) {
  return (
    <div style={{ padding: '.9rem 1.5rem', borderTop: '1px solid var(--neu-border)', display: 'flex', gap: '.6rem' }}>
      <button onClick={onClose} style={{ ...iS, cursor: 'pointer', textAlign: 'center', fontWeight: 600, color: 'var(--neu-text-secondary)', flex: 1, padding: '.65rem', boxShadow: 'none' }}>Cancel</button>
      <button onClick={onConfirm} disabled={loading} style={{ flex: 1, padding: '.65rem', borderRadius: '.75rem', border: 'none', background: confirmColor, boxShadow: '0 4px 14px rgba(91,138,240,.3)', color: '#fff', fontWeight: 700, fontSize: '.85rem', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? .7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.4rem', fontFamily: "'DM Sans',sans-serif" }}>
        {loading && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}{confirmLabel}
      </button>
    </div>
  )
}

/* ─── View Modal ─────────────────────────────────── */
function ViewModal({ enrollment, onClose }) {
  const e = enrollment
  const sc = STATUS_CFG[e.enrollment_status] || STATUS_CFG.enrolled
  const tile = { background: 'var(--neu-surface-deep)', borderRadius: '.8rem', padding: '.7rem 1rem', boxShadow: 'inset 2px 2px 5px var(--neu-shadow-dark), inset -1px -1px 4px var(--neu-shadow-light)' }
  return (
    <Modal onClose={onClose}>
      <MHead icon={Eye} title="Enrollment Detail" sub={e.full_name} onClose={onClose} />
      <div style={{ padding: '1.1rem 1.4rem', display: 'flex', flexDirection: 'column', gap: '.5rem', overflowY: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem' }}>
          {[
            { label: 'Student',        value: e.full_name },
            { label: 'Roll Number',    value: e.roll_number },
            { label: 'Enrolled On',    value: formatDate(e.enrollment_date) },
            { label: 'Status',         value: e.enrollment_status },
            { label: 'Approved',       value: e.is_approved ? 'Yes ✓' : 'Pending' },
            { label: 'Grade',          value: e.grade_letter || 'Not graded' },
            { label: 'GPA Points',     value: e.gpa_points ?? '—' },
            { label: 'Marks Obtained', value: e.marks_obtained ?? '—' },
          ].map(r => (
            <div key={r.label} style={tile}>
              <p style={{ fontSize: '.62rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.2rem' }}>{r.label}</p>
              <p style={{ fontSize: '.88rem', fontWeight: 600, color: 'var(--neu-text-primary)' }}>{String(r.value)}</p>
            </div>
          ))}
        </div>
        <div style={tile}>
          <p style={{ fontSize: '.62rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.3rem' }}>Status Badge</p>
          <span style={{ fontSize: '.72rem', fontWeight: 800, padding: '.25rem .7rem', background: sc.bg, color: sc.c, borderRadius: '.45rem', display: 'inline-block', textTransform: 'capitalize' }}>{sc.label}</span>
        </div>
      </div>
      <div style={{ padding: '.9rem 1.4rem', borderTop: '1px solid var(--neu-border)' }}>
        <button onClick={onClose} style={{ ...iS, cursor: 'pointer', textAlign: 'center', fontWeight: 600, color: 'var(--neu-text-secondary)', padding: '.65rem', boxShadow: 'none' }}>Close</button>
      </div>
    </Modal>
  )
}

/* ─── Enroll Modal ───────────────────────────────── */
function EnrollModal({ students, offerings, onClose, onSuccess }) {
  const [form,    setForm]    = useState({ student_id: '', offering_id: '' })
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const submit = async () => {
    if (!form.student_id || !form.offering_id) { toast.error('All fields required'); return }
    setLoading(true)
    try { await adminAPI.enrollStudent(form); toast.success('Student enrolled!'); onSuccess(); onClose() }
    catch (e) { toast.error(e.response?.data?.message || 'Failed') }
    finally { setLoading(false) }
  }

  return (
    <Modal onClose={onClose}>
      <MHead icon={Plus} title="Enroll Student" onClose={onClose} />
      <div style={{ padding: '1.2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '.8rem' }}>
        <F label="Student *">
          <select style={iS} value={form.student_id} onChange={e => set('student_id', e.target.value)}>
            <option value="">— Select Student —</option>
            {students.map(s => <option key={s.user_id} value={s.user_id}>{s.full_name} ({s.roll_number})</option>)}
          </select>
        </F>
        <F label="Course Offering *">
          <select style={iS} value={form.offering_id} onChange={e => set('offering_id', e.target.value)}>
            <option value="">— Select Offering —</option>
            {offerings.map(o => <option key={o.id} value={o.id}>{o.course_name} — Sec {o.section} ({o.teacher_name})</option>)}
          </select>
        </F>
      </div>
      <MFoot onClose={onClose} onConfirm={submit} confirmLabel="Enroll Student" loading={loading} />
    </Modal>
  )
}

/* ─── Grade Modal ────────────────────────────────── */
function GradeModal({ enrollment, onClose, onSuccess }) {
  const [form,    setForm]    = useState({ grade_letter: enrollment.grade_letter || '', marks_obtained: enrollment.marks_obtained || '', gpa_points: enrollment.gpa_points || '' })
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const GRADE_OPTS = ['A+','A','A-','B+','B','B-','C+','C','C-','D+','D','F']

  const submit = async () => {
    if (!form.grade_letter) { toast.error('Grade required'); return }
    setLoading(true)
    try { await adminAPI.gradeEnrollment(enrollment.enrollment_id, form); toast.success('Grade saved!'); onSuccess(); onClose() }
    catch (e) { toast.error(e.response?.data?.message || 'Failed') }
    finally { setLoading(false) }
  }

  return (
    <Modal onClose={onClose} maxW={420}>
      <MHead icon={Award} title="Enter Grade" sub={enrollment.full_name} onClose={onClose} iconColor="#22a06b" />
      <div style={{ padding: '1.2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
        {/* Grade picker */}
        <F label="Grade Letter *">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.4rem' }}>
            {GRADE_OPTS.map(g => {
              const active = form.grade_letter === g
              const isF = g === 'F'
              return (
                <button key={g} onClick={() => set('grade_letter', g)} style={{ width: 40, height: 40, borderRadius: '.65rem', border: active ? 'none' : '1.5px solid var(--neu-border)', background: active ? (isF ? '#ef4444' : '#22a06b') : 'var(--neu-surface-deep)', color: active ? '#fff' : 'var(--neu-text-muted)', fontWeight: 800, fontSize: '.82rem', cursor: 'pointer', boxShadow: active ? `0 3px 10px ${isF ? 'rgba(239,68,68,.35)' : 'rgba(34,160,107,.35)'}` : '3px 3px 7px var(--neu-shadow-dark), -1px -1px 4px var(--neu-shadow-light)', transition: 'all .14s', fontFamily: "'DM Sans',sans-serif" }}>
                  {g}
                </button>
              )
            })}
          </div>
        </F>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
          <F label="Marks Obtained"><input style={iS} type="number" placeholder="e.g. 85" value={form.marks_obtained} onChange={e => set('marks_obtained', e.target.value)} /></F>
          <F label="GPA Points"><input style={iS} type="number" step=".01" placeholder="e.g. 3.7" value={form.gpa_points} onChange={e => set('gpa_points', e.target.value)} /></F>
        </div>
      </div>
      <MFoot onClose={onClose} onConfirm={submit} confirmLabel="Save Grade" confirmColor="linear-gradient(145deg,#22a06b,#1a7d54)" loading={loading} />
    </Modal>
  )
}

/* ─── Enrollment Row ─────────────────────────────── */
function EnrollRow({ e, onView, onGrade, onApprove, onDrop, actionLoading }) {
  const sc = STATUS_CFG[e.enrollment_status] || STATUS_CFG.enrolled
  const { onContextMenu, menuState, closeMenu } = useContextMenu()

  const menuItems = [
    { label: 'View Details', icon: Eye, onClick: () => onView(e) },
    ...(!e.is_approved && e.enrollment_status === 'enrolled' ? [{ label: 'Approve', icon: CheckCircle2, onClick: () => onApprove(e) }] : []),
    ...(e.enrollment_status === 'enrolled' ? [{ label: 'Enter Grade', icon: Award, onClick: () => onGrade(e) }] : []),
    { divider: true },
    ...(e.enrollment_status === 'enrolled' ? [{ label: 'Drop Student', icon: XCircle, onClick: () => onDrop(e), danger: true }] : []),
  ]

  return (
    <>
      <div className={`enr-row status-${e.enrollment_status}`} onContextMenu={onContextMenu}>
        {/* Student */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem', minWidth: 0 }}>
          <div style={{ width: 32, height: 32, borderRadius: '.65rem', background: sc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 800, fontSize: '.82rem', color: sc.c, fontFamily: 'Outfit,sans-serif' }}>
            {e.full_name?.[0]?.toUpperCase() || '?'}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: '.84rem', fontWeight: 600, color: 'var(--neu-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.full_name}</p>
            <p style={{ fontSize: '.64rem', color: 'var(--neu-text-ghost)', fontFamily: 'monospace' }}>{e.roll_number}</p>
          </div>
        </div>

        {/* Date */}
        <span style={{ fontSize: '.72rem', color: 'var(--neu-text-ghost)' }}>{formatDate(e.enrollment_date)}</span>

        {/* Status */}
        <span style={{ fontSize: '.65rem', fontWeight: 800, padding: '.2rem .55rem', background: sc.bg, color: sc.c, borderRadius: '.4rem', display: 'inline-block', textTransform: 'capitalize' }}>{sc.label}</span>

        {/* Approved */}
        {e.is_approved
          ? <span style={{ display: 'flex', alignItems: 'center', gap: '.3rem', fontSize: '.7rem', fontWeight: 700, color: '#22a06b' }}><CheckCircle2 size={12} />Yes</span>
          : <span style={{ display: 'flex', alignItems: 'center', gap: '.3rem', fontSize: '.7rem', color: '#f97316' }}><XCircle size={12} />Pending</span>}

        {/* Grade */}
        {e.grade_letter
          ? <span style={{ fontSize: '.75rem', fontWeight: 800, padding: '.2rem .55rem', background: 'rgba(34,160,107,.1)', color: '#22a06b', borderRadius: '.4rem', display: 'inline-block', fontFamily: 'Outfit,sans-serif' }}>{e.grade_letter}</span>
          : <span style={{ fontSize: '.7rem', color: 'var(--neu-text-ghost)', opacity: .5 }}>—</span>}

        {/* GPA */}
        <span style={{ fontSize: '.75rem', fontWeight: 700, color: 'var(--neu-text-muted)', fontFamily: 'Outfit,sans-serif' }}>{e.gpa_points ?? '—'}</span>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          {actionLoading === e.enrollment_id
            ? <Loader2 size={15} style={{ color: '#5b8af0', animation: 'spin 1s linear infinite' }} />
            : (
              <div style={{ display: 'flex', gap: '.25rem' }}>
                {!e.is_approved && e.enrollment_status === 'enrolled' && (
                  <button onClick={() => onApprove(e)} title="Approve" style={{ width: 28, height: 28, borderRadius: '.5rem', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--neu-text-ghost)', transition: 'all .14s' }}
                    onMouseEnter={e2 => e2.currentTarget.style.color='#22a06b'}
                    onMouseLeave={e2 => e2.currentTarget.style.color='var(--neu-text-ghost)'}>
                    <CheckCircle2 size={15} />
                  </button>
                )}
                {e.enrollment_status === 'enrolled' && (
                  <button onClick={() => onGrade(e)} title="Grade" style={{ width: 28, height: 28, borderRadius: '.5rem', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--neu-text-ghost)', transition: 'all .14s' }}
                    onMouseEnter={e2 => e2.currentTarget.style.color='#5b8af0'}
                    onMouseLeave={e2 => e2.currentTarget.style.color='var(--neu-text-ghost)'}>
                    <Award size={15} />
                  </button>
                )}
              </div>
            )
          }
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
export default function EnrollmentsPage() {
  const [enrollments,     setEnrollments]     = useState([])
  const [students,        setStudents]        = useState([])
  const [offerings,       setOfferings]       = useState([])
  const [loading,         setLoading]         = useState(false)
  const [search,          setSearch]          = useState('')
  const [filterStatus,    setFilterStatus]    = useState('')
  const [filterOffering,  setFilterOffering]  = useState('')
  const [showEnroll,      setShowEnroll]      = useState(false)
  const [gradeModal,      setGradeModal]      = useState(null)
  const [viewModal,       setViewModal]       = useState(null)
  const [actionLoading,   setActionLoading]   = useState(null)

  useEffect(() => {
    adminAPI.getStudents(1, 200).then(r => setStudents(r.data.data?.students || []))
    adminAPI.getSemesters().then(r => {
      const sems = r.data.data?.semesters || []
      const active = sems.find(s => s.is_active)
      if (active) adminAPI.getOfferings({ semester_id: active.id }).then(r2 => setOfferings(r2.data.data?.offerings || []))
    })
  }, [])

  const fetchEnrollments = useCallback(async () => {
    if (!filterOffering) return
    setLoading(true)
    try {
      const res = await adminAPI.getOfferingStudents(filterOffering)
      setEnrollments(res.data.data?.students || [])
    } catch { toast.error('Failed to load enrollments') }
    finally { setLoading(false) }
  }, [filterOffering])

  useEffect(() => { if (filterOffering) fetchEnrollments() }, [filterOffering])

  const handleApprove = async (enrollment) => {
    setActionLoading(enrollment.enrollment_id)
    try { await adminAPI.approveEnrollment(enrollment.enrollment_id, {}); toast.success('Approved!'); fetchEnrollments() }
    catch (e) { toast.error(e.response?.data?.message || 'Failed') }
    finally { setActionLoading(null) }
  }

  const handleDrop = async (enrollment) => {
    if (!window.confirm(`Drop ${enrollment.full_name} from this course?`)) return
    setActionLoading(enrollment.enrollment_id)
    try { await adminAPI.dropEnrollment(enrollment.enrollment_id, { reason: 'Admin drop' }); toast.success('Dropped!'); fetchEnrollments() }
    catch (e) { toast.error(e.response?.data?.message || 'Failed') }
    finally { setActionLoading(null) }
  }

  const filtered = enrollments
    .filter(e => !search || e.full_name?.toLowerCase().includes(search.toLowerCase()) || e.roll_number?.toLowerCase().includes(search.toLowerCase()))
    .filter(e => !filterStatus || e.enrollment_status === filterStatus)

  const statusCounts = enrollments.reduce((acc, e) => { acc[e.enrollment_status] = (acc[e.enrollment_status] || 0) + 1; return acc }, {})

  return (
    <>
      <style>{CSS}</style>
      <div style={{ maxWidth: 1080, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.3rem', paddingBottom: '2rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.7rem' }}>
            <div style={{ width: 42, height: 42, borderRadius: '.9rem', background: 'linear-gradient(145deg,rgba(91,138,240,.18),rgba(91,138,240,.08))', boxShadow: '5px 5px 14px var(--neu-shadow-dark), -3px -3px 10px var(--neu-shadow-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={20} style={{ color: '#5b8af0' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', letterSpacing: '-.02em' }}>Enrollments</h1>
              <p style={{ fontSize: '.78rem', color: 'var(--neu-text-ghost)', marginTop: 2 }}>Manage course enrollments and grades</p>
            </div>
          </div>
          <button onClick={() => setShowEnroll(true)} style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.6rem 1.2rem', background: 'linear-gradient(145deg,#5b8af0,#3a6bd4)', boxShadow: '0 4px 14px rgba(91,138,240,.35), 5px 5px 12px var(--neu-shadow-dark)', borderRadius: '.85rem', border: 'none', color: '#fff', fontWeight: 700, fontSize: '.82rem', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>
            <Plus size={15} />Enroll Student
          </button>
        </div>

        {/* Filters row */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '.75rem', flexWrap: 'wrap' }}>
          {/* Offering select */}
          <div style={{ flex: '1 1 260px', minWidth: 220 }}>
            <label style={{ fontSize: '.62rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: '.3rem' }}>Course Offering</label>
            <select style={iS} value={filterOffering} onChange={e => { setFilterOffering(e.target.value); setEnrollments([]) }}>
              <option value="">— Select a Course Offering —</option>
              {offerings.map(o => <option key={o.id} value={o.id}>{o.course_name} — Sec {o.section} ({o.enrolled_count || 0} students)</option>)}
            </select>
          </div>

          {/* Search */}
          <div style={{ flex: '0 1 200px', minWidth: 160, position: 'relative' }}>
            <label style={{ fontSize: '.62rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: '.3rem' }}>Search</label>
            <Search size={13} style={{ position: 'absolute', bottom: 11, left: 10, color: 'var(--neu-text-ghost)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Name or roll no…" style={{ ...iS, paddingLeft: '2rem' }} />
          </div>

          {/* Status pills */}
          <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap', paddingBottom: '.05rem' }}>
            {[
              { key: '',          label: 'All',       count: enrollments.length },
              { key: 'enrolled',  label: 'Enrolled',  count: statusCounts.enrolled  || 0 },
              { key: 'dropped',   label: 'Dropped',   count: statusCounts.dropped   || 0 },
              { key: 'completed', label: 'Completed', count: statusCounts.completed || 0 },
            ].map(p => (
              <button key={p.key} onClick={() => setFilterStatus(p.key)}
                className={`filter-pill ${filterStatus === p.key ? `active-${p.key || 'all'}` : ''}`}>
                {p.label} {p.count > 0 && <span style={{ opacity: .75, marginLeft: '.25rem', fontSize: '.62rem' }}>{p.count}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Main card */}
        <div style={{ background: 'var(--neu-surface)', border: '1px solid var(--neu-border)', borderRadius: '1.25rem', overflow: 'hidden', boxShadow: '6px 6px 16px var(--neu-shadow-dark), -3px -3px 10px var(--neu-shadow-light)' }}>

          {!filterOffering ? (
            <div style={{ padding: '6rem 2rem', textAlign: 'center' }}>
              <BookOpen size={42} style={{ color: 'var(--neu-text-ghost)', opacity: .15, display: 'block', margin: '0 auto .9rem' }} />
              <p style={{ fontWeight: 600, color: 'var(--neu-text-secondary)', fontSize: '.95rem' }}>Select a course offering above</p>
              <p style={{ fontSize: '.78rem', color: 'var(--neu-text-ghost)', marginTop: '.3rem' }}>to view and manage enrollments</p>
            </div>
          ) : (
            <>
              {/* Table header */}
              <div style={{ padding: '.55rem 1rem', borderBottom: '1px solid var(--neu-border)', background: 'var(--neu-surface-deep)', display: 'grid', gridTemplateColumns: '2fr 100px 110px 80px 80px 70px 44px', gap: '.6rem', alignItems: 'center' }}>
                {['Student', 'Enrolled', 'Status', 'Approved', 'Grade', 'GPA', 'Act'].map(h => (
                  <span key={h} style={{ fontSize: '.6rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{h}</span>
                ))}
              </div>

              {/* Rows */}
              <div style={{ padding: '.4rem .5rem', display: 'flex', flexDirection: 'column', gap: '.15rem', minHeight: 200 }}>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} style={{ height: 52, background: 'var(--neu-surface-deep)', borderRadius: '.85rem', animation: 'pulse 1.5s infinite', border: '1px solid var(--neu-border)' }} />
                  ))
                ) : filtered.length === 0 ? (
                  <div style={{ padding: '4rem', textAlign: 'center' }}>
                    <Users size={30} style={{ color: 'var(--neu-text-ghost)', opacity: .15, display: 'block', margin: '0 auto .7rem' }} />
                    <p style={{ color: 'var(--neu-text-secondary)', fontWeight: 600 }}>No enrollments found</p>
                  </div>
                ) : filtered.map(e => (
                  <EnrollRow
                    key={e.enrollment_id || e.student_id}
                    e={e}
                    onView={setViewModal}
                    onGrade={setGradeModal}
                    onApprove={handleApprove}
                    onDrop={handleDrop}
                    actionLoading={actionLoading}
                  />
                ))}
              </div>

              {/* Footer stats */}
              {filtered.length > 0 && (
                <div style={{ padding: '.65rem 1rem', borderTop: '1px solid var(--neu-border)', background: 'var(--neu-surface-deep)', display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                  <span style={{ fontSize: '.72rem', color: 'var(--neu-text-ghost)' }}>{filtered.length} records</span>
                  {Object.entries(statusCounts).map(([st, cnt]) => {
                    const sc = STATUS_CFG[st]
                    if (!sc) return null
                    return <span key={st} style={{ display: 'flex', alignItems: 'center', gap: '.3rem', fontSize: '.72rem', fontWeight: 700, color: sc.c }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: sc.c, display: 'inline-block' }} />{cnt} {sc.label}</span>
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Modals */}
        {showEnroll  && <EnrollModal students={students} offerings={offerings} onClose={() => setShowEnroll(false)} onSuccess={fetchEnrollments} />}
        {gradeModal  && <GradeModal enrollment={gradeModal} onClose={() => setGradeModal(null)} onSuccess={fetchEnrollments} />}
        {viewModal   && <ViewModal enrollment={viewModal} onClose={() => setViewModal(null)} />}
      </div>
    </>
  )
}