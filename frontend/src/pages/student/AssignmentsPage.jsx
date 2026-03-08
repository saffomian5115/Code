// ═══════════════════════════════════════════════════════════════
//  AssignmentsPage.jsx  (Student)  —  Neumorphic
//  → frontend/src/pages/student/AssignmentsPage.jsx
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect, useCallback } from 'react'
import {
  FileText, Upload, CheckCircle2, Clock,
  AlertTriangle, Loader2, X, ChevronRight, Award,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { studentAPI } from '../../api/student.api'

/* ─── helpers ────────────────────────────────────────────────── */
const neu = (extra = {}) => ({
  background: 'var(--neu-surface)',
  boxShadow: 'var(--neu-raised)',
  border: '1px solid var(--neu-border)',
  borderRadius: '1.25rem',
  ...extra,
})
const neuInset = (extra = {}) => ({
  background: 'var(--neu-surface-deep)',
  boxShadow: 'inset 4px 4px 10px var(--neu-shadow-dark), inset -3px -3px 7px var(--neu-shadow-light)',
  border: '1px solid var(--neu-border)',
  borderRadius: '0.875rem',
  ...extra,
})

const PALETTE = ['#5b8af0','#a78bfa','#3ecf8e','#f59e0b','#f87171','#38bdf8','#fb923c','#e879f9']
const cc = (idx) => PALETTE[idx % PALETTE.length]

const iS = {
  width: '100%',
  background: 'var(--neu-surface-deep)',
  boxShadow: 'inset 4px 4px 10px var(--neu-shadow-dark), inset -3px -3px 7px var(--neu-shadow-light)',
  border: '1px solid var(--neu-border)',
  borderRadius: '0.75rem',
  padding: '0.65rem 0.9rem',
  fontSize: '0.85rem',
  color: 'var(--neu-text-primary)',
  outline: 'none',
  fontFamily: "'DM Sans',sans-serif",
  boxSizing: 'border-box',
}

const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  : '—'

const getTimeLeft = (due) => {
  const diff = new Date(due) - Date.now()
  if (diff <= 0) return null
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(h / 24)
  if (d > 0) return d + 'd left'
  return h + 'h left'
}

/* ─── Submit Modal ───────────────────────────────────────────── */
function SubmitModal({ assignment, sub, onClose, onSuccess }) {
  const [file,    setFile]    = useState(null)
  const [notes,   setNotes]   = useState(sub ? sub.notes || '' : '')
  const [loading, setLoading] = useState(false)
  const isLate = new Date(assignment.due_date) < new Date()

  const handleSubmit = async () => {
    if (assignment.file_required && !file && !sub) {
      toast.error('Please attach a file')
      return
    }
    setLoading(true)
    try {
      const fd = new FormData()
      if (file) fd.append('file', file)
      fd.append('notes', notes)
      await studentAPI.submitAssignment(assignment.id, fd)
      toast.success('Assignment submitted!')
      onSuccess()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ ...neu({ padding: 0, overflow: 'hidden', width: '100%', maxWidth: 480 }), animation: 'fadeUp 0.2s ease' }}>

        {/* Header */}
        <div style={{ padding: '1.25rem 1.4rem', borderBottom: '1px solid var(--neu-border)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', marginBottom: '0.2rem' }}>
              {sub ? 'Resubmit Assignment' : 'Submit Assignment'}
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--neu-text-ghost)' }}>{assignment.title}</p>
          </div>
          <button onClick={onClose} style={{ ...neuInset({ width: 32, height: 32, borderRadius: '0.65rem' }), display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', color: 'var(--neu-text-ghost)', flexShrink: 0 }}>
            <X size={15} />
          </button>
        </div>

        <div style={{ padding: '1.25rem 1.4rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Late warning */}
          {isLate && assignment.allow_late && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.75rem 0.9rem', borderRadius: '0.75rem', background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.3)' }}>
              <AlertTriangle size={15} style={{ color: '#f5a623', flexShrink: 0 }} />
              <p style={{ fontSize: '0.77rem', color: '#f5a623', fontWeight: 600 }}>
                Late submission — {assignment.late_penalty_percent}% penalty applies
              </p>
            </div>
          )}

          {/* File upload zone */}
          <div>
            <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '0.5rem' }}>
              File {(assignment.file_required && !sub) ? '*' : '(optional)'}
            </label>
            <div
              onClick={() => document.getElementById('assgn-file').click()}
              style={{ ...neuInset({ borderRadius: '0.875rem', padding: '1.5rem 1rem' }), textAlign: 'center', cursor: 'pointer', border: file ? '1.5px solid rgba(62,207,142,0.4)' : '1.5px dashed var(--neu-border)' }}
            >
              {file ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <CheckCircle2 size={18} style={{ color: '#3ecf8e' }} />
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#3ecf8e' }}>{file.name}</span>
                </div>
              ) : sub && sub.file_url ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                  <CheckCircle2 size={20} style={{ color: '#3ecf8e' }} />
                  <p style={{ fontSize: '0.78rem', color: '#3ecf8e', fontWeight: 600 }}>File already submitted</p>
                  <p style={{ fontSize: '0.7rem', color: 'var(--neu-text-ghost)' }}>Click to replace</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                  <Upload size={22} style={{ color: 'var(--neu-text-ghost)' }} />
                  <p style={{ fontSize: '0.8rem', color: 'var(--neu-text-muted)' }}>Click to upload</p>
                  <p style={{ fontSize: '0.68rem', color: 'var(--neu-text-ghost)' }}>PDF, DOCX, ZIP supported</p>
                </div>
              )}
              <input id="assgn-file" type="file" style={{ display: 'none' }} accept=".pdf,.doc,.docx,.zip,image/*" onChange={e => setFile(e.target.files[0])} />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '0.5rem' }}>
              Notes (optional)
            </label>
            <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)}
              style={{ ...iS, resize: 'none', borderRadius: '0.875rem', padding: '0.75rem 0.9rem' }}
              placeholder="Any notes for your instructor…" />
          </div>
        </div>

        {/* Footer buttons */}
        <div style={{ padding: '0 1.4rem 1.25rem', display: 'flex', gap: '0.75rem' }}>
          <button onClick={onClose}
            style={{ flex: 1, padding: '0.7rem', borderRadius: '0.75rem', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: '0.85rem', color: 'var(--neu-text-secondary)', background: 'var(--neu-surface)', boxShadow: '4px 4px 9px var(--neu-shadow-dark), -3px -3px 7px var(--neu-shadow-light)', transition: 'transform 0.12s' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(0.98)'}
            onMouseLeave={e => e.currentTarget.style.transform = ''}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading}
            style={{ flex: 1, padding: '0.7rem', borderRadius: '0.75rem', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: '0.85rem', color: '#fff', background: 'linear-gradient(135deg,#3ecf8e,#2eb87d)', boxShadow: loading ? 'none' : '4px 4px 12px rgba(62,207,142,0.35)', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem', transition: 'transform 0.12s' }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'scale(1.02)' }}
            onMouseLeave={e => e.currentTarget.style.transform = ''}>
            {loading
              ? <><Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite' }} /> Submitting…</>
              : <><Upload size={15} /> Submit</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Assignment Card ────────────────────────────────────────── */
function AssignmentCard({ a, sub, idx, onSubmit }) {
  const [hov, setHov] = useState(false)
  const now    = new Date()
  const isPast = new Date(a.due_date) <= now
  const tl     = !isPast ? getTimeLeft(a.due_date) : null

  const status = sub
    ? (sub.status === 'graded' ? 'graded' : 'submitted')
    : (isPast ? 'missed' : 'pending')

  const ST = {
    graded:    { color: '#3ecf8e', bg: 'rgba(62,207,142,0.13)',  label: sub ? 'Graded ' + sub.obtained_marks + '/' + a.total_marks : 'Graded' },
    submitted: { color: '#5b8af0', bg: 'rgba(91,138,240,0.13)',  label: 'Submitted'  },
    missed:    { color: '#f26b6b', bg: 'rgba(242,107,107,0.13)', label: 'Missed'     },
    pending:   { color: '#f59e0b', bg: 'rgba(245,159,11,0.13)',  label: 'Pending'    },
  }
  const st = ST[status]
  const ac = st.color
  const canSubmit = (!isPast || (isPast && a.allow_late)) && status !== 'graded'

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ ...neu({ padding: 0, overflow: 'hidden', position: 'relative' }), transition: 'transform 0.22s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s', transform: hov ? 'translateY(-3px)' : '', boxShadow: hov ? '12px 12px 28px var(--neu-shadow-dark), -6px -6px 16px var(--neu-shadow-light), 0 0 0 1.5px ' + ac + '22' : 'var(--neu-raised)', animation: 'fadeUp 0.28s ease both', animationDelay: idx * 0.07 + 's' }}
    >
      {/* Left accent bar */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: 'linear-gradient(180deg,' + ac + ',' + ac + '55)', borderRadius: '1.25rem 0 0 1.25rem' }} />

      <div style={{ padding: '1.1rem 1.15rem 1.05rem 1.35rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

        {/* Top: icon + title + badge */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
          <div style={{ ...neuInset({ width: 44, height: 44, borderRadius: '0.875rem' }), display: 'flex', alignItems: 'center', justifyContent: 'center', color: ac, flexShrink: 0 }}>
            <FileText size={19} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.2rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', lineHeight: 1.3 }}>{a.title}</h3>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.12rem 0.5rem', borderRadius: '0.4rem', background: 'var(--neu-surface-deep)', color: 'var(--neu-text-ghost)', boxShadow: 'inset 2px 2px 4px var(--neu-shadow-dark), inset -1px -1px 3px var(--neu-shadow-light)' }}>
                {a.total_marks} marks
              </span>
            </div>
            {a.description && (
              <p style={{ fontSize: '0.75rem', color: 'var(--neu-text-ghost)', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                {a.description}
              </p>
            )}
          </div>
          <span style={{ fontSize: '0.63rem', fontWeight: 800, padding: '0.22rem 0.6rem', borderRadius: '0.45rem', background: st.bg, color: ac, flexShrink: 0, border: '1px solid ' + ac + '30', whiteSpace: 'nowrap' }}>
            {st.label}
          </span>
        </div>

        {/* Meta */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: isPast ? '#f26b6b' : 'var(--neu-text-ghost)' }}>
            <Clock size={12} />
            <span style={{ fontSize: '0.72rem', fontWeight: isPast ? 700 : 500 }}>Due: {fmtDate(a.due_date)}</span>
          </div>
          {tl && (
            <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '0.12rem 0.5rem', borderRadius: '0.4rem', background: 'rgba(91,138,240,0.12)', color: '#5b8af0' }}>⏱ {tl}</span>
          )}
          {a.file_required && (
            <span style={{ fontSize: '0.68rem', color: 'var(--neu-text-ghost)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Upload size={11} /> File required
            </span>
          )}
          {a.allow_late && isPast && !sub && (
            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#f5a623' }}>Late accepted ({a.late_penalty_percent}% penalty)</span>
          )}
        </div>

        {/* Feedback */}
        {sub && sub.feedback && (
          <div style={{ ...neuInset({ borderRadius: '0.75rem', padding: '0.65rem 0.85rem' }), display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
            <Award size={13} style={{ color: '#3ecf8e', flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: '0.75rem', color: 'var(--neu-text-muted)', lineHeight: 1.5, fontStyle: 'italic' }}>{sub.feedback}</p>
          </div>
        )}

        {/* Score bar */}
        {status === 'graded' && sub && sub.obtained_marks !== undefined && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
              <span style={{ fontSize: '0.68rem', color: 'var(--neu-text-ghost)', fontWeight: 600 }}>Score</span>
              <span style={{ fontSize: '0.68rem', color: '#3ecf8e', fontWeight: 800 }}>
                {sub.obtained_marks} / {a.total_marks} ({Math.round((sub.obtained_marks / a.total_marks) * 100)}%)
              </span>
            </div>
            <div style={{ ...neuInset({ height: 8, borderRadius: 4, padding: 2 }) }}>
              <div style={{ height: '100%', borderRadius: 4, background: 'linear-gradient(90deg,#3ecf8e,#2eb87d)', width: Math.min(100, (sub.obtained_marks / a.total_marks) * 100) + '%', transition: 'width 0.6s cubic-bezier(0.34,1.56,0.64,1)', boxShadow: '0 1px 4px rgba(62,207,142,0.4)' }} />
            </div>
          </div>
        )}

        {/* Submit button */}
        {canSubmit && (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={() => onSubmit(a, sub || null)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 1rem', borderRadius: '0.65rem', border: 'none', background: sub ? 'linear-gradient(135deg,#5b8af0,#3a6bd4)' : isPast ? 'linear-gradient(135deg,#f5a623,#e08c0f)' : 'linear-gradient(135deg,#3ecf8e,#2eb87d)', color: '#fff', fontSize: '0.75rem', fontWeight: 700, fontFamily: "'DM Sans',sans-serif", cursor: 'pointer', boxShadow: '4px 4px 10px var(--neu-shadow-dark), -2px -2px 6px var(--neu-shadow-light)', transition: 'transform 0.13s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
              onMouseLeave={e => e.currentTarget.style.transform = ''}>
              <Upload size={13} />
              {sub ? 'Resubmit' : isPast ? 'Late Submit' : 'Submit'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Main Page ──────────────────────────────────────────────── */
export default function AssignmentsPage() {
  const [enrollments,  setEnrollments]  = useState([])
  const [selectedIdx,  setSelectedIdx]  = useState(0)
  const [assignments,  setAssignments]  = useState([])
  const [submissions,  setSubmissions]  = useState({})
  const [loading,      setLoading]      = useState(true)
  const [assgnLoading, setAssgnLoading] = useState(false)
  const [submitModal,  setSubmitModal]  = useState(null)
  const [filter,       setFilter]       = useState('all')

  useEffect(() => {
    studentAPI.getEnrollments()
      .then(r => setEnrollments((r.data.data?.enrollments || []).filter(e => e.is_approved)))
      .catch(() => toast.error('Failed to load courses'))
      .finally(() => setLoading(false))
  }, [])

  const fetchAssignments = useCallback(async () => {
    const enr = enrollments[selectedIdx]
    if (!enr) return
    setAssgnLoading(true)
    try {
      const res    = await studentAPI.getOfferingAssignments(enr.offering_id)
      const assgns = res.data.data?.assignments || []
      setAssignments(assgns)
      const submMap = {}
      await Promise.all(assgns.map(async a => {
        try {
          const sr = await studentAPI.getMySubmission(a.id)
          if (sr.data.data?.submission) submMap[a.id] = sr.data.data.submission
        } catch { /* none */ }
      }))
      setSubmissions(submMap)
    } catch {
      toast.error('Failed to load assignments')
    } finally {
      setAssgnLoading(false)
    }
  }, [selectedIdx, enrollments])

  useEffect(() => { fetchAssignments() }, [selectedIdx, enrollments])

  const now          = new Date()
  const totalCount   = assignments.length
  const pendingCnt   = assignments.filter(a => !submissions[a.id] && new Date(a.due_date) > now).length
  const submittedCnt = assignments.filter(a => submissions[a.id]?.status === 'submitted').length
  const gradedCnt    = assignments.filter(a => submissions[a.id]?.status === 'graded').length

  const filtered = assignments.filter(a => {
    const sub    = submissions[a.id]
    const isPast = new Date(a.due_date) <= now
    if (filter === 'pending')   return !sub && !isPast
    if (filter === 'submitted') return sub?.status === 'submitted'
    if (filter === 'graded')    return sub?.status === 'graded'
    if (filter === 'missed')    return !sub && isPast
    return true
  })

  const FILTERS = [
    { key: 'all',       label: 'All',       count: totalCount   },
    { key: 'pending',   label: 'Pending',   count: pendingCnt   },
    { key: 'submitted', label: 'Submitted', count: submittedCnt },
    { key: 'graded',    label: 'Graded',    count: gradedCnt    },
  ]

  const selectedEnr = enrollments[selectedIdx]

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: '2rem' }}>
      <style>{`
        @keyframes spin   { to { transform: rotate(360deg) } }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
        @keyframes pulse  { 0%,100%{opacity:.4} 50%{opacity:.9} }
      `}</style>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '6rem' }}>
          <Loader2 size={30} style={{ color: '#a78bfa', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : enrollments.length === 0 ? (
        <div style={{ ...neu({ padding: '5rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.85rem' }) }}>
          <div style={{ ...neuInset({ width: 64, height: 64, borderRadius: '1.25rem' }), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa' }}>
            <FileText size={28} />
          </div>
          <p style={{ fontWeight: 700, color: 'var(--neu-text-secondary)', fontSize: '1rem' }}>No active enrollments</p>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '1.1rem', alignItems: 'flex-start' }}>

          {/* ══ LEFT SIDEBAR ══ */}
          <div style={{ ...neu({ padding: '0.65rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }), width: 235, flexShrink: 0, position: 'sticky', top: '1rem' }}>
            <p style={{ fontSize: '0.63rem', fontWeight: 800, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '0.09em', padding: '0.35rem 0.5rem 0.2rem' }}>Courses</p>
            {enrollments.map((enr, idx) => {
              const active = idx === selectedIdx
              const color  = cc(idx)
              const init   = (enr.course_code || enr.course_name || '?').slice(0, 2).toUpperCase()
              return (
                <button key={enr.offering_id} onClick={() => setSelectedIdx(idx)}
                  style={{ width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer', padding: '0.65rem 0.75rem', borderRadius: '0.875rem', fontFamily: "'DM Sans',sans-serif", transition: 'all 0.18s', display: 'flex', alignItems: 'center', gap: '0.65rem', background: active ? 'var(--neu-surface)' : 'transparent', boxShadow: active ? '6px 6px 14px var(--neu-shadow-dark), -3px -3px 9px var(--neu-shadow-light)' : 'none' }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--neu-surface-deep)' }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}>
                  <div style={{ width: 34, height: 34, borderRadius: '0.65rem', flexShrink: 0, background: active ? color : color + '20', color: active ? '#fff' : color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem', fontWeight: 900, fontFamily: 'Outfit,sans-serif', transition: 'all 0.18s', boxShadow: active ? '4px 4px 10px var(--neu-shadow-dark), -2px -2px 6px var(--neu-shadow-light), 0 3px 9px ' + color + '44' : 'inset 2px 2px 4px var(--neu-shadow-dark), inset -1px -1px 3px var(--neu-shadow-light)' }}>
                    {init}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '0.76rem', fontWeight: active ? 700 : 600, color: active ? 'var(--neu-text-primary)' : 'var(--neu-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '0.08rem' }}>
                      {enr.course_name}
                    </p>
                    <p style={{ fontSize: '0.62rem', color: 'var(--neu-text-ghost)', fontFamily: 'monospace' }}>{enr.course_code}</p>
                  </div>
                  {active && <ChevronRight size={13} style={{ color, flexShrink: 0 }} />}
                </button>
              )
            })}
          </div>

          {/* ══ RIGHT: Main content ══ */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1rem', animation: 'fadeUp 0.25s ease both' }}>

            {/* Title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ ...neuInset({ width: 44, height: 44, borderRadius: '0.875rem' }), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa' }}>
                <FileText size={20} />
              </div>
              <div>
                <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', lineHeight: 1.2 }}>
                  {selectedEnr ? selectedEnr.course_name : 'Assignments'}
                </h1>
                <p style={{ fontSize: '0.73rem', color: 'var(--neu-text-ghost)' }}>
                  {selectedEnr ? selectedEnr.course_code + (selectedEnr.instructor ? ' · ' + selectedEnr.instructor : '') : ''}
                </p>
              </div>
            </div>

            {assgnLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                <Loader2 size={26} style={{ color: '#a78bfa', animation: 'spin 0.8s linear infinite' }} />
              </div>
            ) : (
              <>
                {/* KPI chips */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                  {[
                    { label: 'Total',     value: totalCount,   color: 'var(--neu-text-primary)' },
                    { label: 'Pending',   value: pendingCnt,   color: pendingCnt > 0 ? '#f59e0b' : 'var(--neu-text-ghost)' },
                    { label: 'Submitted', value: submittedCnt, color: '#5b8af0' },
                    { label: 'Graded',    value: gradedCnt,    color: '#3ecf8e' },
                  ].map(function(item) {
                    return (
                      <div key={item.label} style={{ ...neuInset({ borderRadius: '0.875rem', padding: '0.8rem 1rem' }), display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <p style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{item.label}</p>
                        <p style={{ fontSize: '1.4rem', fontWeight: 900, color: item.color, fontFamily: 'Outfit,sans-serif', lineHeight: 1 }}>{item.value}</p>
                      </div>
                    )
                  })}
                </div>

                {/* Filter tabs */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {FILTERS.map(function(f) {
                    const active = filter === f.key
                    return (
                      <button key={f.key} onClick={() => setFilter(f.key)}
                        style={{ padding: '0.38rem 0.9rem', borderRadius: '0.65rem', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", fontSize: '0.76rem', fontWeight: 700, transition: 'all 0.15s', background: active ? 'var(--neu-surface)' : 'transparent', color: active ? 'var(--neu-text-primary)' : 'var(--neu-text-ghost)', boxShadow: active ? '5px 5px 12px var(--neu-shadow-dark), -3px -3px 8px var(--neu-shadow-light)' : 'none', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        {f.label}
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '0.08rem 0.4rem', borderRadius: '0.35rem', background: active ? 'rgba(91,138,240,0.15)' : 'var(--neu-surface-deep)', color: active ? '#5b8af0' : 'var(--neu-text-ghost)' }}>
                          {f.count}
                        </span>
                      </button>
                    )
                  })}
                </div>

                {/* Cards */}
                {filtered.length === 0 ? (
                  <div style={{ ...neu({ padding: '4rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.85rem' }) }}>
                    <div style={{ ...neuInset({ width: 60, height: 60, borderRadius: '1.1rem' }), display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--neu-text-ghost)' }}>
                      <FileText size={26} />
                    </div>
                    <p style={{ fontWeight: 700, color: 'var(--neu-text-secondary)', fontSize: '0.95rem' }}>
                      {filter === 'all' ? 'No assignments yet' : 'No ' + filter + ' assignments'}
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {filtered.map(function(a, idx) {
                      return (
                        <AssignmentCard
                          key={a.id}
                          a={a}
                          sub={submissions[a.id]}
                          idx={idx}
                          onSubmit={function(assgn, s) { setSubmitModal({ assignment: assgn, sub: s }) }}
                        />
                      )
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {submitModal && (
        <SubmitModal
          assignment={submitModal.assignment}
          sub={submitModal.sub}
          onClose={() => setSubmitModal(null)}
          onSuccess={fetchAssignments}
        />
      )}
    </div>
  )
}