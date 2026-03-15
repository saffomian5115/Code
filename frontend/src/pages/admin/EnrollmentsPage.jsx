// ═══════════════════════════════════════════════════════════════
//  EnrollmentsPage.jsx  —  frontend/src/pages/admin/EnrollmentsPage.jsx
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  Users, Plus, Search, Loader2, X, BookOpen,
  CheckCircle2, XCircle, Award, Eye, GraduationCap,
  ListFilter, UserCheck, UserX,
} from 'lucide-react'
import toast from 'react-hot-toast'
import AddButton from '../../components/ui/AddButton'
import { adminAPI } from '../../api/admin.api'
import { formatDate } from '../../utils/helpers'
import { useContextMenu, ContextMenu } from '../../hooks/useContextMenu'

/* ─── CSS ─────────────────────────────────────────── */
const CSS = `
  @keyframes spin    { to { transform: rotate(360deg) } }
  @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.45} }
  @keyframes slideUp { from{opacity:0;transform:translateY(14px) scale(.97)} to{opacity:1;transform:none} }
  @keyframes tipIn   { from{opacity:0;transform:translateX(-4px)} to{opacity:1;transform:none} }

  .enr-row {
    display: grid;
    grid-template-columns: 2.2fr 110px 130px 110px;
    align-items: center;
    gap: .6rem;
    padding: .75rem 1rem;
    border-radius: .9rem;
    border: 1px solid transparent;
    border-left: 3px solid transparent;
    transition: background .14s, border-color .14s, transform .18s;
    cursor: pointer;
    position: relative;
    user-select: none;
  }
  .enr-row:hover {
    background: var(--neu-surface-deep);
    border-color: var(--neu-border);
    transform: translateX(3px);
  }
  .enr-row.s-enrolled  { border-left-color: #5b8af0 !important; }
  .enr-row.s-dropped   { border-left-color: #ef4444 !important; opacity: .7; }
  .enr-row.s-completed { border-left-color: #22a06b !important; }
  .enr-row.s-failed    { border-left-color: #f97316 !important; opacity: .8; }
  .enr-hint {
    position: absolute; right: 14px; bottom: 6px;
    font-size: .56rem; color: var(--neu-text-ghost);
    opacity: 0; transition: opacity .2s; pointer-events: none;
  }
  .enr-row:hover .enr-hint { opacity: .4; }
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

const STATUS_CFG = {
  enrolled:  { label: 'Enrolled',  c: '#5b8af0', bg: 'rgba(91,138,240,.12)'  },
  dropped:   { label: 'Dropped',   c: '#ef4444', bg: 'rgba(239,68,68,.12)'   },
  completed: { label: 'Completed', c: '#22a06b', bg: 'rgba(34,160,107,.12)'  },
  failed:    { label: 'Failed',    c: '#f97316', bg: 'rgba(249,115,22,.12)'   },
}

// normalize status field — backend may send 'status' or 'enrollment_status'
const getStatus = (e) => e.enrollment_status || e.status || 'enrolled'

/* ─── Dock Filter Pills — icons + portal tooltip ─── */
const BASE_W = 44, MAX_W = 56, DIST = 140
const PILLS = [
  { key: '',          label: 'All',       icon: ListFilter,    color: '#5b8af0' },
  { key: 'enrolled',  label: 'Enrolled',  icon: UserCheck,     color: '#5b8af0' },
  { key: 'completed', label: 'Completed', icon: GraduationCap, color: '#22a06b' },
  { key: 'dropped',   label: 'Dropped',   icon: UserX,         color: '#ef4444' },
]

function DockPill({ pill, isActive, count, mouseX, onClick }) {
  const ref = useRef(null)
  const [size, setSize]       = useState(BASE_W)
  const [showTip, setShowTip] = useState(false)
  const [tipPos, setTipPos]   = useState({ x: 0, y: 0 })
  const Icon = pill.icon

  useEffect(() => {
    if (!ref.current || mouseX === -9999) { setSize(BASE_W); return }
    const rect   = ref.current.getBoundingClientRect()
    const center = rect.left + rect.width / 2
    const dist   = Math.abs(mouseX - center)
    if (dist >= DIST) { setSize(BASE_W); return }
    const t     = 1 - dist / DIST
    const eased = t * t * (3 - 2 * t)
    setSize(BASE_W + (MAX_W - BASE_W) * eased)
  }, [mouseX])

  const onEnter = () => {
    if (!ref.current) return
    const r = ref.current.getBoundingClientRect()
    setTipPos({ x: r.left + r.width / 2, y: r.bottom + 8 })
    setShowTip(true)
  }

  return (
    <>
      <button
        ref={ref}
        onClick={onClick}
        onMouseEnter={onEnter}
        onMouseLeave={() => setShowTip(false)}
        style={{
          width: size, height: size, borderRadius: '.75rem',
          border: isActive ? 'none' : '1px solid var(--neu-border)',
          background: isActive
            ? `linear-gradient(145deg,${pill.color},${pill.color}cc)`
            : 'var(--neu-surface)',
          color: isActive ? '#fff' : 'var(--neu-text-secondary)',
          cursor: 'pointer', position: 'relative', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: isActive
            ? `0 4px 14px ${pill.color}44, 4px 4px 10px var(--neu-shadow-dark)`
            : '4px 4px 10px var(--neu-shadow-dark), -2px -2px 6px var(--neu-shadow-light)',
          transition: 'width .1s ease, height .1s ease, background .15s, box-shadow .15s',
        }}
      >
        <Icon size={Math.round(size * 0.4)} style={{ pointerEvents: 'none' }} />
        {count > 0 && (
          <span style={{
            position: 'absolute', top: -4, right: -4,
            fontSize: '.55rem', fontWeight: 800, lineHeight: 1,
            padding: '.12rem .32rem', borderRadius: '.35rem',
            background: isActive ? '#fff' : pill.color,
            color: isActive ? pill.color : '#fff',
            fontFamily: "'DM Sans',sans-serif", pointerEvents: 'none',
          }}>{count}</span>
        )}
      </button>

      {showTip && createPortal(
        <div style={{
          position: 'fixed', left: tipPos.x, top: tipPos.y,
          transform: 'translateX(-50%)', pointerEvents: 'none', zIndex: 99999,
          background: 'var(--neu-surface)', border: '1px solid var(--neu-border)',
          borderRadius: '.5rem', padding: '.28rem .65rem',
          fontSize: '.7rem', fontWeight: 700, color: 'var(--neu-text-primary)',
          boxShadow: '4px 4px 12px var(--neu-shadow-dark)',
          whiteSpace: 'nowrap', animation: 'tipIn .1s ease both',
        }}>
          {pill.label}{count > 0 ? ` (${count})` : ''}
        </div>,
        document.body
      )}
    </>
  )
}

function DockPills({ active, setActive, counts }) {
  const [mouseX, setMouseX] = useState(-9999)
  const allCount = Object.values(counts).reduce((a, b) => a + b, 0)
  return (
    <div
      onMouseMove={e => setMouseX(e.clientX)}
      onMouseLeave={() => setMouseX(-9999)}
      style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}
    >
      {PILLS.map(p => (
        <DockPill
          key={p.key} pill={p}
          isActive={active === p.key}
          count={p.key === '' ? allCount : (counts[p.key] || 0)}
          mouseX={mouseX}
          onClick={() => setActive(p.key)}
        />
      ))}
    </div>
  )
}

/* ─── Modal Shell ────────────────────────────────── */
function Modal({ children, maxW = 500 }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(8,12,20,.72)', backdropFilter: 'blur(10px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: maxW, background: 'var(--neu-surface)', boxShadow: '14px 14px 36px var(--neu-shadow-dark), -6px -6px 20px var(--neu-shadow-light)', border: '1px solid var(--neu-border)', borderRadius: '1.5rem', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'slideUp .2s cubic-bezier(.34,1.56,.64,1) both' }}>
        {children}
      </div>
    </div>
  )
}
function MHead({ icon: Icon, title, sub, onClose, iconColor = '#5b8af0' }) {
  return (
    <div style={{ padding: '1.35rem 1.5rem', borderBottom: '1px solid var(--neu-border)', display: 'flex', alignItems: 'center', gap: '.75rem' }}>
      <div style={{ width: 36, height: 36, borderRadius: '.7rem', background: `${iconColor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={16} style={{ color: iconColor }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h2 style={{ fontSize: '.95rem', fontWeight: 700, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif' }}>{title}</h2>
        {sub && <p style={{ fontSize: '.72rem', color: 'var(--neu-text-ghost)', marginTop: 1 }}>{sub}</p>}
      </div>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neu-text-ghost)', padding: '.25rem', borderRadius: '.5rem' }}><X size={18} /></button>
    </div>
  )
}
function MFoot({ onClose, onConfirm, confirmLabel, confirmColor, loading }) {
  return (
    <div style={{ padding: '.9rem 1.5rem', borderTop: '1px solid var(--neu-border)', display: 'flex', gap: '.6rem' }}>
      <button onClick={onClose} style={{ ...iS, cursor: 'pointer', textAlign: 'center', fontWeight: 600, color: 'var(--neu-text-secondary)', flex: 1, padding: '.6rem' }}>Cancel</button>
      <button onClick={onConfirm} disabled={loading} style={{ flex: 1, padding: '.6rem', borderRadius: '.75rem', border: 'none', background: confirmColor || 'linear-gradient(145deg,#5b8af0,#3a6bd4)', color: '#fff', fontWeight: 700, fontSize: '.85rem', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? .7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.4rem', fontFamily: "'DM Sans',sans-serif" }}>
        {loading && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}{confirmLabel}
      </button>
    </div>
  )
}

/* ─── View Modal ─────────────────────────────────── */
function ViewModal({ enrollment: e, onClose }) {
  const status = getStatus(e)
  const sc     = STATUS_CFG[status] || STATUS_CFG.enrolled
  const tile   = { background: 'var(--neu-surface-deep)', borderRadius: '.8rem', padding: '.7rem 1rem', boxShadow: 'inset 2px 2px 5px var(--neu-shadow-dark), inset -1px -1px 4px var(--neu-shadow-light)' }
  const rows   = [
    { label: 'Student',        value: e.full_name },
    { label: 'Roll Number',    value: e.roll_number },
    { label: 'Enrolled On',    value: formatDate(e.enrollment_date) },
    { label: 'Approved',       value: e.is_approved ? '✓ Yes' : '⏳ Pending' },
    { label: 'Grade',          value: e.grade_letter || '—' },
    { label: 'GPA Points',     value: e.gpa_points != null ? e.gpa_points : '—' },
    { label: 'Marks Obtained', value: e.marks_obtained != null ? e.marks_obtained : '—' },
  ]
  return (
    <Modal maxW={460}>
      <MHead icon={Eye} title="Enrollment Detail" sub={e.full_name} onClose={onClose} />
      <div style={{ padding: '1.1rem 1.4rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem', overflowY: 'auto' }}>
        {rows.map(r => (
          <div key={r.label} style={tile}>
            <p style={{ fontSize: '.6rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.2rem' }}>{r.label}</p>
            <p style={{ fontSize: '.86rem', fontWeight: 600, color: 'var(--neu-text-primary)' }}>{String(r.value)}</p>
          </div>
        ))}
        <div style={{ ...tile, gridColumn: 'span 2' }}>
          <p style={{ fontSize: '.6rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.3rem' }}>Status</p>
          <span style={{ fontSize: '.72rem', fontWeight: 800, padding: '.25rem .7rem', background: sc.bg, color: sc.c, borderRadius: '.45rem', display: 'inline-block', textTransform: 'capitalize' }}>{sc.label}</span>
        </div>
      </div>
      <div style={{ padding: '.9rem 1.4rem', borderTop: '1px solid var(--neu-border)' }}>
        <button onClick={onClose} style={{ ...iS, cursor: 'pointer', textAlign: 'center', fontWeight: 600, color: 'var(--neu-text-secondary)', padding: '.65rem' }}>Close</button>
      </div>
    </Modal>
  )
}

/* ─── Grade Modal ────────────────────────────────── */
const GPA_MAP = { 'A+':4.0,'A':4.0,'A-':3.67,'B+':3.33,'B':3.0,'B-':2.67,'C+':2.33,'C':2.0,'C-':1.67,'D+':1.33,'D':1.0,'F':0.0 }
const GRADES  = ['A+','A','A-','B+','B','B-','C+','C','C-','D+','D','F']

function GradeModal({ enrollment, onClose, onSuccess }) {
  const [form, setForm]       = useState({ grade_letter: enrollment.grade_letter || '', marks_obtained: enrollment.marks_obtained || '', gpa_points: enrollment.gpa_points || '' })
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const pickGrade = (g) => { set('grade_letter', g); set('gpa_points', GPA_MAP[g] ?? '') }

  const submit = async () => {
    if (!form.grade_letter) { toast.error('Grade required'); return }
    setLoading(true)
    try {
      await adminAPI.gradeEnrollment(enrollment.enrollment_id, {
        grade_letter:   form.grade_letter,
        grade_points:   parseFloat(form.gpa_points) || GPA_MAP[form.grade_letter] || 0,
        marks_obtained: form.marks_obtained || undefined,
      })
      toast.success('Grade saved!'); onSuccess(); onClose()
    } catch (e) { toast.error(e.response?.data?.message || 'Failed') }
    finally { setLoading(false) }
  }

  return (
    <Modal maxW={420}>
      <MHead icon={Award} title="Enter / Update Grade" sub={enrollment.full_name} onClose={onClose} iconColor="#22a06b" />
      <div style={{ padding: '1.2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
        <F label="Grade *">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.4rem' }}>
            {GRADES.map(g => {
              const active = form.grade_letter === g
              const color  = g === 'F' ? '#ef4444' : '#22a06b'
              return (
                <button key={g} onClick={() => pickGrade(g)} style={{ width: 42, height: 42, borderRadius: '.7rem', border: active ? 'none' : '1.5px solid var(--neu-border)', background: active ? color : 'var(--neu-surface-deep)', color: active ? '#fff' : 'var(--neu-text-secondary)', fontWeight: 800, fontSize: '.82rem', cursor: 'pointer', boxShadow: active ? `0 3px 10px ${color}55` : '3px 3px 7px var(--neu-shadow-dark)', transition: 'all .14s', fontFamily: "'DM Sans',sans-serif" }}>
                  {g}
                </button>
              )
            })}
          </div>
        </F>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
          <F label="Marks Obtained">
            <input style={iS} type="number" placeholder="e.g. 85" value={form.marks_obtained} onChange={e => set('marks_obtained', e.target.value)} />
          </F>
          <F label="GPA Points (auto)">
            <input style={{ ...iS, opacity: .7 }} type="number" step=".01" value={form.gpa_points} onChange={e => set('gpa_points', e.target.value)} />
          </F>
        </div>
        {form.grade_letter && (
          <div style={{ background: 'rgba(34,160,107,.08)', border: '1px solid rgba(34,160,107,.25)', borderRadius: '.75rem', padding: '.6rem 1rem', fontSize: '.8rem', color: '#22a06b', fontWeight: 600 }}>
            Grade <strong>{form.grade_letter}</strong> = <strong>{GPA_MAP[form.grade_letter]}</strong> GPA points
          </div>
        )}
      </div>
      <MFoot onClose={onClose} onConfirm={submit} confirmLabel="Save Grade" confirmColor="linear-gradient(145deg,#22a06b,#1a7d54)" loading={loading} />
    </Modal>
  )
}

/* ─── Drop Confirm Modal ─────────────────────────── */
function DropModal({ enrollment, onClose, onConfirm, loading }) {
  return (
    <Modal maxW={380}>
      <div style={{ padding: '2rem 1.75rem', textAlign: 'center' }}>
        <div style={{ width: 52, height: 52, borderRadius: '1rem', background: 'rgba(239,68,68,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
          <XCircle size={22} style={{ color: '#ef4444' }} />
        </div>
        <h3 style={{ fontSize: '.95rem', fontWeight: 700, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', marginBottom: '.4rem' }}>Drop Student?</h3>
        <p style={{ fontSize: '.82rem', color: 'var(--neu-text-muted)', marginBottom: '1.5rem' }}>
          <strong style={{ color: 'var(--neu-text-primary)' }}>{enrollment?.full_name}</strong> ko is course se drop karna chahte hain?
        </p>
        <div style={{ display: 'flex', gap: '.6rem' }}>
          <button onClick={onClose} style={{ ...iS, cursor: 'pointer', textAlign: 'center', fontWeight: 600, color: 'var(--neu-text-secondary)', flex: 1, padding: '.6rem' }}>Cancel</button>
          <button onClick={onConfirm} disabled={loading} style={{ flex: 1, padding: '.6rem', borderRadius: '.75rem', border: 'none', background: 'linear-gradient(145deg,#f26b6b,#d94f4f)', color: '#fff', fontWeight: 700, fontSize: '.85rem', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? .7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.4rem', fontFamily: "'DM Sans',sans-serif" }}>
            {loading && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}Drop
          </button>
        </div>
      </div>
    </Modal>
  )
}

/* ─── Enroll Modal ───────────────────────────────── */
function EnrollModal({ students, offerings, onClose, onSuccess }) {
  const [form, setForm]       = useState({ student_id: '', offering_id: '' })
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const submit = async () => {
    if (!form.student_id || !form.offering_id) { toast.error('Both fields required'); return }
    setLoading(true)
    try { await adminAPI.enrollStudent(form); toast.success('Student enrolled!'); onSuccess(); onClose() }
    catch (e) { toast.error(e.response?.data?.message || 'Failed') }
    finally { setLoading(false) }
  }

  return (
    <Modal maxW={440}>
      <MHead icon={Plus} title="Enroll Student" onClose={onClose} />
      <div style={{ padding: '1.2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
        <F label="Student *">
          <select style={iS} value={form.student_id} onChange={e => set('student_id', e.target.value)}>
            <option value="">— Select Student —</option>
            {students.map(s => <option key={s.user_id} value={s.user_id}>{s.full_name} ({s.roll_number})</option>)}
          </select>
        </F>
        <F label="Course Offering *">
          <select style={iS} value={form.offering_id} onChange={e => set('offering_id', e.target.value)}>
            <option value="">— Select Offering —</option>
            {offerings.map(o => (
              <option key={o.id} value={o.id}>
                {o.course_name} — Sec {o.section}{o.semester_name ? ` · ${o.semester_name}` : ''}
              </option>
            ))}
          </select>
        </F>
      </div>
      <MFoot onClose={onClose} onConfirm={submit} confirmLabel="Enroll" loading={loading} />
    </Modal>
  )
}

/* ─── Enrollment Row — no own useContextMenu ─────── */
function EnrollRow({ e, onRowClick, actionLoading }) {
  const status = getStatus(e)
  const sc     = STATUS_CFG[status] || STATUS_CFG.enrolled
  return (
    <div className={`enr-row s-${status}`} onClick={ev => onRowClick(ev, e)}>
      {/* Student */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem', minWidth: 0 }}>
        <div style={{ width: 34, height: 34, borderRadius: '.7rem', background: sc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 800, fontSize: '.84rem', color: sc.c, fontFamily: 'Outfit,sans-serif' }}>
          {e.full_name?.[0]?.toUpperCase() || '?'}
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: '.85rem', fontWeight: 600, color: 'var(--neu-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.full_name}</p>
          <p style={{ fontSize: '.65rem', color: 'var(--neu-text-ghost)', fontFamily: 'monospace' }}>{e.roll_number}</p>
        </div>
      </div>
      {/* Status */}
      <span style={{ fontSize: '.66rem', fontWeight: 800, padding: '.22rem .6rem', background: sc.bg, color: sc.c, borderRadius: '.45rem', display: 'inline-block', textTransform: 'capitalize', whiteSpace: 'nowrap' }}>{sc.label}</span>
      {/* Grade + GPA */}
      {e.grade_letter
        ? <span style={{ fontSize: '.78rem', fontWeight: 800, padding: '.22rem .65rem', background: 'rgba(34,160,107,.12)', color: '#22a06b', borderRadius: '.45rem', fontFamily: 'Outfit,sans-serif', display: 'inline-block', whiteSpace: 'nowrap' }}>
            {e.grade_letter} <span style={{ fontSize: '.62rem', opacity: .7 }}>({e.gpa_points ?? '—'})</span>
          </span>
        : <span style={{ fontSize: '.72rem', color: 'var(--neu-text-ghost)', opacity: .5 }}>—</span>
      }
      {/* Date / loader */}
      <span style={{ fontSize: '.7rem', color: 'var(--neu-text-ghost)', display: 'flex', alignItems: 'center', gap: '.3rem' }}>
        {actionLoading === e.enrollment_id
          ? <Loader2 size={13} style={{ color: '#5b8af0', animation: 'spin 1s linear infinite' }} />
          : formatDate(e.enrollment_date)
        }
      </span>
      <span className="enr-hint">click for options</span>
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════ */
export default function EnrollmentsPage() {
  const [enrollments,    setEnrollments]    = useState([])
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

  // ── ONE context menu for entire page — no multi-render ──
  const { menu, open: openMenu, close: closeMenu } = useContextMenu()

  useEffect(() => {
    adminAPI.getStudents(1, 500).then(r => setStudents(r.data.data?.students || []))
    adminAPI.getOfferings().then(r  => setOfferings(r.data.data?.offerings   || []))
  }, [])

  const fetchEnrollments = useCallback(async () => {
    if (!filterOffering) return
    setLoading(true)
    try {
      const res = await adminAPI.getOfferingStudents(filterOffering)
      setEnrollments(res.data.data?.students || [])
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }, [filterOffering])

  useEffect(() => { setEnrollments([]); if (filterOffering) fetchEnrollments() }, [filterOffering])

  const handleApprove = async (enr) => {
    setActionLoading(enr.enrollment_id)
    try { await adminAPI.approveEnrollment(enr.enrollment_id, {}); toast.success('Approved!'); fetchEnrollments() }
    catch (e) { toast.error(e.response?.data?.message || 'Failed') }
    finally { setActionLoading(null) }
  }

  const handleDrop = async () => {
    if (!dropModal) return
    setActionLoading(dropModal.enrollment_id)
    try { await adminAPI.dropEnrollment(dropModal.enrollment_id, { reason: 'Admin drop' }); toast.success('Dropped!'); setDropModal(null); fetchEnrollments() }
    catch (e) { toast.error(e.response?.data?.message || 'Failed') }
    finally { setActionLoading(null) }
  }

  // build context menu items from clicked row
  const buildItems = (e) => {
    if (!e) return []
    const status = getStatus(e)
    return [
      { label: 'View Details',                               icon: Eye,          onClick: () => setViewModal(e) },
      ...(status === 'enrolled' || status === 'completed' ? [
        { label: e.grade_letter ? 'Update Grade' : 'Enter Grade', icon: Award,  onClick: () => setGradeModal(e) },
      ] : []),
      ...(!e.is_approved && status === 'enrolled' ? [
        { label: 'Approve',                                  icon: CheckCircle2, onClick: () => handleApprove(e) },
      ] : []),
      { divider: true },
      ...(status === 'enrolled' ? [
        { label: 'Drop Student',                             icon: XCircle,      onClick: () => setDropModal(e), danger: true },
      ] : []),
    ]
  }

  const filtered = enrollments
    .filter(e => !filterStatus || getStatus(e) === filterStatus)
    .filter(e => {
      if (!search) return true
      const q = search.toLowerCase()
      return e.full_name?.toLowerCase().includes(q) || e.roll_number?.toLowerCase().includes(q)
    })

  const statusCounts = enrollments.reduce((acc, e) => {
    const s = getStatus(e); acc[s] = (acc[s] || 0) + 1; return acc
  }, {})

  return (
    <>
      <style>{CSS}</style>
      <div style={{ maxWidth: 1080, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.3rem', paddingBottom: '2rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.7rem' }}>
            <div style={{ width: 42, height: 42, borderRadius: '.9rem', background: 'rgba(91,138,240,.12)', boxShadow: '5px 5px 14px var(--neu-shadow-dark), -3px -3px 10px var(--neu-shadow-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={20} style={{ color: '#5b8af0' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', letterSpacing: '-.02em' }}>Enrollments</h1>
              <p style={{ fontSize: '.78rem', color: 'var(--neu-text-ghost)', marginTop: 2 }}>Manage enrollments, grades &amp; status</p>
            </div>
          </div>
          <AddButton onClick={() => setShowCreate(true)} tooltip="Enroll Student" color="#5b8af0" />

        </div>

        {/* Filters */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '.75rem', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 280px', minWidth: 220 }}>
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
          <div style={{ flex: '0 1 220px', minWidth: 160, position: 'relative' }}>
            <label style={{ fontSize: '.62rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: '.3rem' }}>Search</label>
            <Search size={13} style={{ position: 'absolute', bottom: 11, left: 10, color: 'var(--neu-text-ghost)', pointerEvents: 'none' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Name or roll no…" style={{ ...iS, paddingLeft: '2rem' }} />
          </div>
        </div>

        {/* Dock Pills */}
        {filterOffering && (
          <DockPills active={filterStatus} setActive={setFilterStatus} counts={statusCounts} />
        )}

        {/* Table */}
        <div style={{ background: 'var(--neu-surface)', border: '1px solid var(--neu-border)', borderRadius: '1.25rem', overflow: 'hidden', boxShadow: '6px 6px 16px var(--neu-shadow-dark), -3px -3px 10px var(--neu-shadow-light)' }}>
          {!filterOffering ? (
            <div style={{ padding: '6rem 2rem', textAlign: 'center' }}>
              <BookOpen size={42} style={{ color: 'var(--neu-text-ghost)', opacity: .15, display: 'block', margin: '0 auto .9rem' }} />
              <p style={{ fontWeight: 600, color: 'var(--neu-text-secondary)', fontSize: '.95rem' }}>Select a course offering above</p>
              <p style={{ fontSize: '.78rem', color: 'var(--neu-text-ghost)', marginTop: '.3rem' }}>to view and manage enrollments</p>
            </div>
          ) : (
            <>
              <div style={{ padding: '.55rem 1rem', borderBottom: '1px solid var(--neu-border)', background: 'var(--neu-surface-deep)', display: 'grid', gridTemplateColumns: '2.2fr 110px 130px 110px', gap: '.6rem', alignItems: 'center' }}>
                {['Student', 'Status', 'Grade / GPA', 'Enrolled On'].map(h => (
                  <span key={h} style={{ fontSize: '.6rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{h}</span>
                ))}
              </div>

              <div style={{ padding: '.4rem .5rem', display: 'flex', flexDirection: 'column', gap: '.12rem', minHeight: 200 }}>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} style={{ height: 54, background: 'var(--neu-surface-deep)', borderRadius: '.85rem', animation: 'pulse 1.5s infinite', border: '1px solid var(--neu-border)' }} />
                  ))
                ) : filtered.length === 0 ? (
                  <div style={{ padding: '4rem', textAlign: 'center' }}>
                    <Users size={30} style={{ color: 'var(--neu-text-ghost)', opacity: .15, display: 'block', margin: '0 auto .7rem' }} />
                    <p style={{ color: 'var(--neu-text-secondary)', fontWeight: 600 }}>
                      {enrollments.length === 0 ? 'No students enrolled yet' : 'No results match filter'}
                    </p>
                  </div>
                ) : filtered.map(e => (
                  <EnrollRow
                    key={e.enrollment_id || e.student_id}
                    e={e}
                    onRowClick={(ev, row) => openMenu(ev, row)}
                    actionLoading={actionLoading}
                  />
                ))}
              </div>

              {filtered.length > 0 && (
                <div style={{ padding: '.65rem 1rem', borderTop: '1px solid var(--neu-border)', background: 'var(--neu-surface-deep)', display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                  <span style={{ fontSize: '.72rem', color: 'var(--neu-text-ghost)' }}>{filtered.length} records</span>
                  {Object.entries(statusCounts).map(([st, cnt]) => {
                    const sc = STATUS_CFG[st]; if (!sc) return null
                    return <span key={st} style={{ display: 'flex', alignItems: 'center', gap: '.3rem', fontSize: '.72rem', fontWeight: 700, color: sc.c }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: sc.c, display: 'inline-block' }} />{cnt} {sc.label}</span>
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Single ContextMenu */}
        <ContextMenu menu={menu} close={closeMenu} items={buildItems(menu?.row)} />

        {/* Modals */}
        {showEnroll && <EnrollModal students={students} offerings={offerings} onClose={() => setShowEnroll(false)} onSuccess={fetchEnrollments} />}
        {gradeModal && <GradeModal enrollment={gradeModal} onClose={() => setGradeModal(null)} onSuccess={fetchEnrollments} />}
        {viewModal  && <ViewModal  enrollment={viewModal}  onClose={() => setViewModal(null)} />}
        {dropModal  && <DropModal  enrollment={dropModal}  onClose={() => setDropModal(null)} onConfirm={handleDrop} loading={actionLoading === dropModal?.enrollment_id} />}
      </div>
    </>
  )
}