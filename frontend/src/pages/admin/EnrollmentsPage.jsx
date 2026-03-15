// ═══════════════════════════════════════════════════════════════
//  EnrollmentsPage.jsx  —  frontend/src/pages/admin/EnrollmentsPage.jsx
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect, useCallback } from 'react'
import {
  Users, Search, Loader2, X,
  XCircle, Award, Eye,
  BookOpen, TrendingDown, GraduationCap, AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import AddButton from '../../components/ui/AddButton'
import { adminAPI } from '../../api/admin.api'
import { useContextMenu, ContextMenu } from '../../hooks/useContextMenu'

/* ═══════════════════════════════════════════════════
   CSS
═══════════════════════════════════════════════════ */
const CSS = `
  @keyframes spin    { to { transform: rotate(360deg) } }
  @keyframes slideUp { from{opacity:0;transform:translateY(14px) scale(.97)} to{opacity:1;transform:none} }

  .enr-row {
    display: grid;
    grid-template-columns: 2.2fr 110px 120px 110px;
    align-items: center;
    gap: .6rem;
    padding: .75rem 1rem;
    border-radius: .9rem;
    border: 1px solid transparent;
    border-left: 3px solid transparent;
    transition: background .14s, border-color .14s, transform .18s;
    cursor: pointer;
    user-select: none;
  }
  .enr-row:hover {
    background: var(--neu-surface-deep);
    border-color: var(--neu-border);
    transform: translateX(3px);
  }
  .enr-row.s-dropped { opacity: .7; }

  .enr-header {
    display: grid;
    grid-template-columns: 2.2fr 110px 120px 110px;
    gap: .6rem;
    padding: .25rem 1rem;
    font-size: .6rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .07em;
    color: var(--neu-text-ghost);
  }

  .stat-pill {
    display: flex; align-items: center; gap: .6rem;
    padding: .75rem 1rem;
    border-radius: .85rem;
    background: var(--neu-surface);
    box-shadow: 3px 3px 8px var(--neu-shadow-dark), -2px -2px 6px var(--neu-shadow-light);
    flex: 1 1 110px; min-width: 100px;
  }
`

/* ═══════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════ */
const formatDate = d => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })
}

const STATUS_CFG = {
  enrolled:  { label: 'Enrolled',  bg: 'rgba(91,138,240,.13)',  c: '#5b8af0' },
  dropped:   { label: 'Dropped',   bg: 'rgba(248,113,113,.13)', c: '#f87171' },
  completed: { label: 'Completed', bg: 'rgba(34,160,107,.13)',  c: '#22a06b' },
  failed:    { label: 'Failed',    bg: 'rgba(251,146,60,.13)',  c: '#fb923c' },
}

const STAT_DEFS = [
  { key: 'enrolled',  label: 'Enrolled',  Icon: BookOpen,      color: '#5b8af0', rgba: '91,138,240'  },
  { key: 'completed', label: 'Completed', Icon: GraduationCap, color: '#22a06b', rgba: '34,160,107'  },
  { key: 'dropped',   label: 'Dropped',   Icon: TrendingDown,  color: '#f87171', rgba: '248,113,113' },
  { key: 'failed',    label: 'Failed',    Icon: AlertCircle,   color: '#fb923c', rgba: '251,146,60'  },
]

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

/* ═══════════════════════════════════════════════════
   LOCAL UI PRIMITIVES  (same inline pattern as StudentsPage / TeachersPage)
═══════════════════════════════════════════════════ */
function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '.35rem' }}>
      <label style={{ fontSize: '.68rem', fontWeight: 700, color: 'var(--neu-text-ghost)', letterSpacing: '.06em', textTransform: 'uppercase' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function Modal({ children, maxW = 520 }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,14,22,0.6)', backdropFilter: 'blur(8px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: maxW, background: 'var(--neu-surface)', boxShadow: '14px 14px 36px var(--neu-shadow-dark), -6px -6px 20px var(--neu-shadow-light)', border: '1px solid var(--neu-border)', borderRadius: '1.5rem', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'slideUp .22s cubic-bezier(.34,1.56,.64,1) both' }}>
        {children}
      </div>
    </div>
  )
}

function ModalHead({ title, icon: Icon, color = '#5b8af0', onClose }) {
  const rgbaMap = { '#5b8af0': '91,138,240', '#22a06b': '34,160,107', '#f87171': '248,113,113', '#9b59b6': '155,89,182' }
  const rgba = rgbaMap[color] || '91,138,240'
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.1rem 1.4rem .8rem', borderBottom: '1px solid var(--neu-border)', flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
        <div style={{ width: 34, height: 34, borderRadius: '.65rem', background: `rgba(${rgba},.13)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {Icon && <Icon size={16} style={{ color }} />}
        </div>
        <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif' }}>{title}</span>
      </div>
      <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: '.55rem', border: '1px solid var(--neu-border)', background: 'var(--neu-surface-deep)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--neu-text-ghost)' }}>
        <X size={14} />
      </button>
    </div>
  )
}

function ModalBody({ children }) {
  return (
    <div style={{ padding: '1rem 1.4rem', display: 'flex', flexDirection: 'column', gap: '.9rem', overflowY: 'auto' }}>
      {children}
    </div>
  )
}

function ModalFoot({ onClose, onConfirm, confirmLabel = 'Confirm', loading = false, danger = false }) {
  const confirmColor = danger ? '#ef4444' : '#5b8af0'
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '.6rem', padding: '.9rem 1.4rem 1.1rem', borderTop: '1px solid var(--neu-border)', flexShrink: 0 }}>
      <button onClick={onClose} style={{ padding: '.5rem 1.1rem', borderRadius: '.65rem', border: '1px solid var(--neu-border)', background: 'var(--neu-surface-deep)', color: 'var(--neu-text-secondary)', fontSize: '.82rem', fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>
        Cancel
      </button>
      {onConfirm && (
        <button onClick={onConfirm} disabled={loading} style={{ padding: '.5rem 1.2rem', borderRadius: '.65rem', border: 'none', background: confirmColor, color: '#fff', fontSize: '.82rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? .7 : 1, display: 'flex', alignItems: 'center', gap: '.4rem', fontFamily: "'DM Sans',sans-serif" }}>
          {loading && <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />}
          {confirmLabel}
        </button>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   STATS BAR
═══════════════════════════════════════════════════ */
function StatsBar({ counts }) {
  return (
    <div style={{ display: 'flex', gap: '.65rem', flexWrap: 'wrap' }}>
      {STAT_DEFS.map(({ key, label, Icon, color, rgba }) => (
        <div key={key} className="stat-pill">
          <div style={{ width: 30, height: 30, borderRadius: '.55rem', background: `rgba(${rgba},.13)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon size={14} style={{ color }} />
          </div>
          <div>
            <p style={{ fontSize: '1.05rem', fontWeight: 900, color, fontFamily: 'Outfit,sans-serif', lineHeight: 1 }}>{counts[key] ?? 0}</p>
            <p style={{ fontSize: '.6rem', color: 'var(--neu-text-ghost)', fontWeight: 600, marginTop: 1 }}>{label}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   ENROLL MODAL
═══════════════════════════════════════════════════ */
function EnrollModal({ students, offerings, onClose, onDone }) {
  const [studentId,  setStudentId]  = useState('')
  const [offeringId, setOfferingId] = useState('')
  const [loading,    setLoading]    = useState(false)

  const submit = async () => {
    if (!studentId || !offeringId) return toast.error('Select student and offering')
    setLoading(true)
    try {
      await adminAPI.enrollStudent({ student_id: +studentId, offering_id: +offeringId })
      toast.success('Student enrolled!')
      onDone()
      onClose()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Enrollment failed')
    } finally { setLoading(false) }
  }

  return (
    <Modal>
      <ModalHead title="Enroll Student" icon={Users} onClose={onClose} />
      <ModalBody>
        <Field label="Student">
          <select style={iS} value={studentId} onChange={e => setStudentId(e.target.value)}>
            <option value="">— Select Student —</option>
            {students.map(s => (
              <option key={s.user_id} value={s.user_id}>
                {s.full_name} ({s.roll_number})
              </option>
            ))}
          </select>
        </Field>
        <Field label="Course Offering">
          <select style={iS} value={offeringId} onChange={e => setOfferingId(e.target.value)}>
            <option value="">— Select Offering —</option>
            {offerings.map(o => (
              <option key={o.id} value={o.id}>
                {o.course_name} — Sec {o.section}{o.semester_name ? ` · ${o.semester_name}` : ''}
              </option>
            ))}
          </select>
        </Field>
      </ModalBody>
      <ModalFoot onClose={onClose} onConfirm={submit} confirmLabel="Enroll" loading={loading} />
    </Modal>
  )
}

/* ═══════════════════════════════════════════════════
   GRADE MODAL
═══════════════════════════════════════════════════ */
const GRADES = [
  { l: 'A+', p: 4.0 }, { l: 'A', p: 4.0 }, { l: 'A-', p: 3.7 },
  { l: 'B+', p: 3.3 }, { l: 'B', p: 3.0 }, { l: 'B-', p: 2.7 },
  { l: 'C+', p: 2.3 }, { l: 'C', p: 2.0 }, { l: 'C-', p: 1.7 },
  { l: 'D',  p: 1.0 }, { l: 'F', p: 0.0 },
]

function GradeModal({ enrollment: e, onClose, onDone }) {
  const [letter,  setLetter]  = useState(e.grade_letter || '')
  const [points,  setPoints]  = useState(e.gpa_points ?? '')
  const [loading, setLoading] = useState(false)

  const pickGrade = (gl) => {
    const found = GRADES.find(g => g.l === gl)
    setLetter(gl)
    if (found) setPoints(found.p)
  }

  const submit = async () => {
    if (!letter || points === '') return toast.error('Select a grade')
    setLoading(true)
    try {
      await adminAPI.gradeEnrollment(e.enrollment_id, { grade_letter: letter, grade_points: +points })
      toast.success('Grade saved!')
      onDone()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save grade')
    } finally { setLoading(false) }
  }

  return (
    <Modal>
      <ModalHead title={e.grade_letter ? 'Update Grade' : 'Enter Grade'} icon={Award} color="#22a06b" onClose={onClose} />
      <ModalBody>
        <p style={{ fontSize: '.82rem', color: 'var(--neu-text-secondary)' }}>
          <strong>{e.full_name}</strong> &mdash; {e.roll_number}
        </p>
        <Field label="Grade Letter">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.4rem' }}>
            {GRADES.map(g => (
              <button key={g.l} onClick={() => pickGrade(g.l)} style={{
                padding: '.3rem .6rem', borderRadius: '.5rem',
                border: `1.5px solid ${letter === g.l ? '#5b8af0' : 'var(--neu-border)'}`,
                background: letter === g.l ? 'rgba(91,138,240,.15)' : 'var(--neu-surface-deep)',
                color: letter === g.l ? '#5b8af0' : 'var(--neu-text-secondary)',
                fontWeight: 700, fontSize: '.78rem', cursor: 'pointer', fontFamily: 'Outfit,sans-serif',
              }}>
                {g.l}
              </button>
            ))}
          </div>
        </Field>
        <Field label="GPA Points (0.0 – 4.0)">
          <input style={iS} type="number" step="0.1" min="0" max="4"
            value={points} onChange={e => setPoints(e.target.value)} placeholder="e.g. 3.7" />
        </Field>
      </ModalBody>
      <ModalFoot onClose={onClose} onConfirm={submit} confirmLabel="Save Grade" loading={loading} />
    </Modal>
  )
}

/* ═══════════════════════════════════════════════════
   VIEW MODAL
═══════════════════════════════════════════════════ */
function ViewModal({ enrollment: e, onClose }) {
  const sc   = STATUS_CFG[e.status] || STATUS_CFG.enrolled
  const tile = { background: 'var(--neu-surface-deep)', borderRadius: '.75rem', padding: '.6rem .95rem', boxShadow: 'inset 2px 2px 5px var(--neu-shadow-dark), inset -1px -1px 4px var(--neu-shadow-light)' }
  const rows = [
    { label: 'Student',     value: e.full_name },
    { label: 'Roll Number', value: e.roll_number },
    { label: 'Enrolled On', value: formatDate(e.enrollment_date) },
    { label: 'Status',      value: <span style={{ fontWeight: 700, color: sc.c }}>{sc.label}</span> },
    { label: 'Grade',       value: e.grade_letter || '—' },
    { label: 'GPA Points',  value: e.gpa_points != null ? e.gpa_points : '—' },
    ...(e.advisor_remarks ? [{ label: 'Drop Reason', value: e.advisor_remarks }] : []),
  ]
  return (
    <Modal>
      <ModalHead title="Enrollment Details" icon={Eye} onClose={onClose} />
      <ModalBody>
        {rows.map(r => (
          <div key={r.label} style={{ ...tile, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '.68rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '.05em', whiteSpace: 'nowrap' }}>{r.label}</span>
            <span style={{ fontSize: '.82rem', color: 'var(--neu-text-primary)', fontWeight: 500, textAlign: 'right' }}>{r.value}</span>
          </div>
        ))}
      </ModalBody>
      <div style={{ padding: '.9rem 1.4rem 1.1rem', borderTop: '1px solid var(--neu-border)', display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={onClose} style={{ padding: '.5rem 1.4rem', borderRadius: '.65rem', border: '1px solid var(--neu-border)', background: 'var(--neu-surface-deep)', color: 'var(--neu-text-secondary)', fontSize: '.82rem', fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>
          Close
        </button>
      </div>
    </Modal>
  )
}

/* ═══════════════════════════════════════════════════
   DROP MODAL
═══════════════════════════════════════════════════ */
function DropModal({ enrollment: e, onClose, onDone }) {
  const [reason,  setReason]  = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    setLoading(true)
    try {
      await adminAPI.dropEnrollment(e.enrollment_id, { reason: reason || 'Admin drop' })
      toast.success('Student dropped!')
      onDone()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    } finally { setLoading(false) }
  }

  return (
    <Modal maxW={420}>
      <ModalHead title="Drop Student" icon={XCircle} color="#f87171" onClose={onClose} />
      <ModalBody>
        <p style={{ fontSize: '.85rem', color: 'var(--neu-text-secondary)', lineHeight: 1.5 }}>
          Drop <strong>{e.full_name}</strong> from this course?
          This can be undone by re-enrolling.
        </p>
        <Field label="Reason (optional)">
          <input style={iS} value={reason} onChange={ev => setReason(ev.target.value)} placeholder="Enter reason…" />
        </Field>
      </ModalBody>
      <ModalFoot onClose={onClose} onConfirm={submit} confirmLabel="Drop Student" loading={loading} danger />
    </Modal>
  )
}

/* ═══════════════════════════════════════════════════
   ENROLLMENT ROW
═══════════════════════════════════════════════════ */
function EnrollRow({ e, onRowClick, actionLoading }) {
  const sc = STATUS_CFG[e.status] || STATUS_CFG.enrolled
  return (
    <div
      className={`enr-row s-${e.status}`}
      onClick={ev => onRowClick(ev, e)}
      style={{ borderLeftColor: sc.c }}
    >
      {/* Student */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem', minWidth: 0 }}>
        <div style={{ width: 34, height: 34, borderRadius: '.65rem', background: sc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 800, fontSize: '.84rem', color: sc.c, fontFamily: 'Outfit,sans-serif' }}>
          {e.full_name?.[0]?.toUpperCase() || '?'}
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: '.85rem', fontWeight: 600, color: 'var(--neu-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.full_name}</p>
          <p style={{ fontSize: '.65rem', color: 'var(--neu-text-ghost)', fontFamily: 'monospace' }}>{e.roll_number}</p>
        </div>
      </div>

      {/* Status badge */}
      <span style={{ fontSize: '.66rem', fontWeight: 800, padding: '.22rem .55rem', background: sc.bg, color: sc.c, borderRadius: '.45rem', display: 'inline-block', textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
        {sc.label}
      </span>

      {/* Grade */}
      {e.grade_letter
        ? <span style={{ fontSize: '.78rem', fontWeight: 800, padding: '.22rem .6rem', background: 'rgba(34,160,107,.12)', color: '#22a06b', borderRadius: '.45rem', fontFamily: 'Outfit,sans-serif', display: 'inline-block', whiteSpace: 'nowrap' }}>
            {e.grade_letter} <span style={{ fontSize: '.62rem', opacity: .7 }}>({e.gpa_points ?? '—'})</span>
          </span>
        : <span style={{ fontSize: '.72rem', color: 'var(--neu-text-ghost)', opacity: .5 }}>—</span>
      }

      {/* Date / spinner */}
      <span style={{ fontSize: '.7rem', color: 'var(--neu-text-ghost)', display: 'flex', alignItems: 'center', gap: '.3rem' }}>
        {actionLoading === e.enrollment_id
          ? <Loader2 size={13} style={{ color: '#5b8af0', animation: 'spin 1s linear infinite' }} />
          : formatDate(e.enrollment_date)
        }
      </span>
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════ */
export default function EnrollmentsPage() {
  const [enrollments,    setEnrollments]    = useState([])
  const [counts,         setCounts]         = useState({})
  const [students,       setStudents]       = useState([])
  const [offerings,      setOfferings]      = useState([])
  const [loading,        setLoading]        = useState(false)
  const [search,         setSearch]         = useState('')
  const [filterStatus,   setFilterStatus]   = useState('')
  const [filterOffering, setFilterOffering] = useState('')
  const [showEnroll,     setShowEnroll]     = useState(false)
  const [gradeModal,     setGradeModal]     = useState(null)
  const [viewModal,      setViewModal]      = useState(null)
  const [dropModal,      setDropModal]      = useState(null)
  const [actionLoading,  setActionLoading]  = useState(null)

  const { menu, open: openMenu, close: closeMenu } = useContextMenu()

  useEffect(() => {
    adminAPI.getStudents(1, 500).then(r => setStudents(r.data.data?.students || []))
    adminAPI.getOfferings().then(r => setOfferings(r.data.data?.offerings || []))
  }, [])

  const fetchEnrollments = useCallback(async () => {
    if (!filterOffering) return
    setLoading(true)
    try {
      const res = await adminAPI.getOfferingStudents(filterOffering)
      const d   = res.data.data
      setEnrollments(d?.students || [])
      setCounts(d?.counts || {})
    } catch { toast.error('Failed to load enrollments') }
    finally   { setLoading(false) }
  }, [filterOffering])

  useEffect(() => {
    setEnrollments([])
    setCounts({})
    if (filterOffering) fetchEnrollments()
  }, [filterOffering])

  // Context menu — no approve button anywhere
  const ctxItems = (e) => [
    { label: 'View Details', icon: Eye,  onClick: () => setViewModal(e) },
    ...(e.status === 'enrolled' ? [
      { label: e.grade_letter ? 'Update Grade' : 'Enter Grade', icon: Award, onClick: () => setGradeModal(e) },
    ] : []),
    ...(e.status === 'dropped' ? [
      { label: 'Re-enroll Student', icon: CheckCircle2, onClick: () => handleReEnroll(e) },
    ] : []),
    { divider: true },
    ...(e.status === 'enrolled' ? [
      { label: 'Drop Student', icon: XCircle, onClick: () => setDropModal(e), danger: true },
    ] : []),
  ]

  const handleRowClick = (ev, e) => openMenu(ev, e)

  const handleReEnroll = async (e) => {
    setActionLoading(e.enrollment_id)
    try {
      await adminAPI.enrollStudent({ student_id: e.student_id, offering_id: parseInt(filterOffering) })
      toast.success('Student re-enrolled!')
      fetchEnrollments()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Re-enroll failed')
    } finally { setActionLoading(null) }
  }

  const filtered = enrollments
    .filter(e => !filterStatus || e.status === filterStatus)
    .filter(e => {
      if (!search) return true
      const q = search.toLowerCase()
      return e.full_name?.toLowerCase().includes(q) || e.roll_number?.toLowerCase().includes(q)
    })

  const selectedOffering = offerings.find(o => String(o.id) === String(filterOffering))

  return (
    <>
      <style>{CSS}</style>
      <div style={{ maxWidth: 1080, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.3rem', paddingBottom: '2rem' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.7rem' }}>
            <div style={{ width: 42, height: 42, borderRadius: '.9rem', background: 'rgba(91,138,240,.12)', boxShadow: '5px 5px 14px var(--neu-shadow-dark), -3px -3px 10px var(--neu-shadow-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={20} style={{ color: '#5b8af0' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', letterSpacing: '-.02em' }}>Enrollments</h1>
              <p style={{ fontSize: '.78rem', color: 'var(--neu-text-ghost)', marginTop: 2 }}>
                {selectedOffering
                  ? `${selectedOffering.course_name} — Section ${selectedOffering.section}`
                  : 'Select a course offering to manage enrollments'}
              </p>
            </div>
          </div>
          <AddButton onClick={() => setShowEnroll(true)} tooltip="Enroll Student" color="#5b8af0" />
        </div>

        {/* ── Filters ── */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '.75rem', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 280px', minWidth: 200 }}>
            <label style={{ fontSize: '.62rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: '.3rem' }}>Course Offering</label>
            <select style={iS} value={filterOffering} onChange={e => { setFilterOffering(e.target.value); setFilterStatus('') }}>
              <option value="">— Select a Course Offering —</option>
              {offerings.map(o => (
                <option key={o.id} value={o.id}>
                  {o.course_name} — Sec {o.section}{o.semester_name ? ` · ${o.semester_name}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div style={{ flex: '0 1 150px', minWidth: 120 }}>
            <label style={{ fontSize: '.62rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: '.3rem' }}>Status</label>
            <select style={iS} value={filterStatus} onChange={e => setFilterStatus(e.target.value)} disabled={!filterOffering}>
              <option value="">All Statuses</option>
              <option value="enrolled">Enrolled</option>
              <option value="dropped">Dropped</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <div style={{ flex: '1 1 200px', minWidth: 150 }}>
            <label style={{ fontSize: '.62rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: '.3rem' }}>Search</label>
            <div style={{ position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: '.65rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--neu-text-ghost)', pointerEvents: 'none' }} />
              <input style={{ ...iS, paddingLeft: '2rem' }} placeholder="Name or roll number…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
        </div>

        {/* ── Stats Bar ── */}
        {filterOffering && !loading && Object.keys(counts).length > 0 && (
          <StatsBar counts={counts} />
        )}

        {/* ── List ── */}
        {!filterOffering ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--neu-text-ghost)' }}>
            <Users size={44} style={{ opacity: .18, marginBottom: '.75rem', display: 'block', margin: '0 auto .75rem' }} />
            <p style={{ fontSize: '.88rem' }}>Select a course offering above to view enrollments</p>
          </div>
        ) : loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: '#5b8af0' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--neu-text-ghost)', fontSize: '.88rem' }}>
            No students found{filterStatus ? ` with status "${filterStatus}"` : ''}.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
            <div className="enr-header">
              <span>Student</span>
              <span>Status</span>
              <span>Grade</span>
              <span>Enrolled</span>
            </div>
            {filtered.map(e => (
              <EnrollRow key={e.enrollment_id} e={e} onRowClick={handleRowClick} actionLoading={actionLoading} />
            ))}
          </div>
        )}

      </div>

      {/* Context Menu */}
      <ContextMenu menu={menu} close={closeMenu} items={menu ? ctxItems(menu.row) : []} />

      {/* Modals */}
      {showEnroll && <EnrollModal students={students} offerings={offerings} onClose={() => setShowEnroll(false)} onDone={fetchEnrollments} />}
      {gradeModal && <GradeModal  enrollment={gradeModal} onClose={() => setGradeModal(null)} onDone={fetchEnrollments} />}
      {viewModal  && <ViewModal   enrollment={viewModal}  onClose={() => setViewModal(null)} />}
      {dropModal  && <DropModal   enrollment={dropModal}  onClose={() => setDropModal(null)} onDone={fetchEnrollments} />}
    </>
  )
}