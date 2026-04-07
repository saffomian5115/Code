// ═══════════════════════════════════════════════════════════════
//  AssignmentsPage.jsx  (Student)  —  Neumorphic | Fixed & Rebuilt
//  → frontend/src/pages/student/AssignmentsPage.jsx
//
//  Backend-accurate fixes:
//  • No /assignments/{id}/my-submission endpoint exists in backend
//    → Use GET /students/{studentId}/submissions to get all submissions
//    → Build a submissionMap keyed by assignment_id
//  • user_id resolved from authStore safely (user_id || id)
//  • Course dropdown (same pattern as AttendancePage)
//  • Stats: total, pending, submitted, graded, late, missed
//  • Score bars, feedback cards, plagiarism badges
//  • Submit modal with real multipart upload
//  • Status-aware action buttons
//  • Cards grid: 3 per row
//  • Grade overview with ring chart
//  • Course dropdown on right side of header
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect, useCallback, useRef } from 'react'
import {
  FileText, Upload, CheckCircle2, Clock, AlertTriangle,
  Loader2, X, Award, ChevronDown, BookOpen, Hash,
  Calendar, BarChart3, RefreshCw, Paperclip,
  TrendingUp, Star, AlertCircle, Eye,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { studentAPI } from '../../api/student.api'
import { authStore } from '../../store/authStore'

/* ─── theme helpers ────────────────────────────────────────── */
const neu = (extra = {}) => ({
  background: 'var(--neu-surface)',
  boxShadow: 'var(--neu-raised)',
  border: '1px solid var(--neu-border)',
  borderRadius: '1.25rem',
  ...extra,
})
const neuInset = (extra = {}) => ({
  background: 'var(--neu-surface-deep)',
  boxShadow:
    'inset 4px 4px 10px var(--neu-shadow-dark), inset -3px -3px 7px var(--neu-shadow-light)',
  border: '1px solid var(--neu-border)',
  borderRadius: '0.875rem',
  ...extra,
})

/* ─── helpers ──────────────────────────────────────────────── */
function getStudentId(user) {
  return user?.user_id ?? user?.id ?? null
}

const fmt = (d) =>
  d
    ? new Date(d).toLocaleString('en-PK', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : '—'

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString('en-PK', {
        day: 'numeric', month: 'short', year: 'numeric',
      })
    : '—'

function getTimeLeft(due) {
  const diff = new Date(due) - Date.now()
  if (diff <= 0) return null
  const h = Math.floor(diff / 3_600_000)
  const d = Math.floor(h / 24)
  if (d > 1) return `${d} days left`
  if (d === 1) return '1 day left'
  if (h >= 1) return `${h}h left`
  const m = Math.floor(diff / 60_000)
  return `${m}m left`
}

/* ─── Status config ────────────────────────────────────────── */
const STATUS_CFG = {
  submitted: { color: '#5b8af0', bg: 'rgba(91,138,240,0.13)',  icon: CheckCircle2,  label: 'Submitted' },
  graded:    { color: '#3ecf8e', bg: 'rgba(62,207,142,0.13)',  icon: Star,          label: 'Graded'    },
  late:      { color: '#f5a623', bg: 'rgba(245,166,35,0.13)',  icon: Clock,         label: 'Late'      },
  resubmit:  { color: '#a78bfa', bg: 'rgba(167,139,250,0.13)', icon: RefreshCw,     label: 'Resubmit'  },
  pending:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.13)',  icon: Clock,         label: 'Pending'   },
  missed:    { color: '#f26b6b', bg: 'rgba(242,107,107,0.13)', icon: AlertCircle,   label: 'Missed'    },
}

/* ─── KPI chip ─────────────────────────────────────────────── */
function Chip({ label, value, color, sub }) {
  return (
    <div style={{ ...neuInset({ padding: '0.85rem 1rem', borderRadius: '0.875rem' }), display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
      <p style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</p>
      <p style={{ fontSize: '1.45rem', fontWeight: 900, color: color || 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontSize: '0.62rem', color: 'var(--neu-text-ghost)', marginTop: 2 }}>{sub}</p>}
    </div>
  )
}

/* ─── Score progress bar ───────────────────────────────────── */
function ScoreBar({ obtained, total, color }) {
  const pct = total > 0 ? Math.min((obtained / total) * 100, 100) : 0
  const barColor = pct >= 75 ? '#3ecf8e' : pct >= 50 ? '#5b8af0' : '#f26b6b'
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
        <span style={{ fontSize: '0.68rem', color: 'var(--neu-text-ghost)', fontWeight: 600 }}>Score</span>
        <span style={{ fontSize: '0.7rem', fontWeight: 800, color: barColor }}>
          {obtained} / {total} ({Math.round(pct)}%)
        </span>
      </div>
      <div style={{ ...neuInset({ height: 8, borderRadius: 4, padding: 2 }) }}>
        <div style={{
          height: '100%', borderRadius: 4,
          background: `linear-gradient(90deg, ${barColor}, ${barColor}bb)`,
          width: `${pct}%`,
          transition: 'width 0.7s cubic-bezier(0.34,1.56,0.64,1)',
          boxShadow: `0 1px 4px ${barColor}44`,
        }} />
      </div>
    </div>
  )
}

/* ─── Ring Chart Component ─────────────────────────────────── */
function RingChart({ percentage, size = 100, strokeWidth = 8 }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference
  
  const color = percentage >= 75 ? '#3ecf8e' : percentage >= 50 ? '#5b8af0' : '#f26b6b'
  
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--neu-border)"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.7s ease' }}
        />
      </svg>
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center',
      }}>
        <span style={{ fontSize: '1.2rem', fontWeight: 800, color: color, fontFamily: 'Outfit,sans-serif' }}>
          {Math.round(percentage)}%
        </span>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════
   SUBMIT MODAL
════════════════════════════════════════════════════════════ */
function SubmitModal({ assignment, existingSub, onClose, onSuccess }) {
  const [file,    setFile]    = useState(null)
  const [notes,   setNotes]   = useState('')
  const [loading, setLoading] = useState(false)
  const fileRef = useRef(null)

  const isPast    = new Date(assignment.due_date) < new Date()
  const isResubmit = existingSub?.status === 'resubmit'

  const handleSubmit = async () => {
    if (assignment.file_required && !file) {
      toast.error('Please attach a file — it is required for this assignment')
      return
    }
    setLoading(true)
    try {
      const fd = new FormData()
      if (file) fd.append('file', file)
      if (notes.trim()) fd.append('notes', notes)
      await studentAPI.submitAssignment(assignment.id, fd)
      toast.success(isResubmit ? 'Resubmitted successfully!' : 'Assignment submitted!')
      onSuccess()
      onClose()
    } catch (err) {
      const msg = err.response?.data?.message || 'Submission failed'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(7px)',
      zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
    }}>
      <div style={{ ...neu({ padding: 0, overflow: 'hidden', width: '100%', maxWidth: 500 }), animation: 'fadeUp 0.22s ease' }}>

        {/* Header */}
        <div style={{ padding: '1.2rem 1.4rem', borderBottom: '1px solid var(--neu-border)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', marginBottom: '0.2rem' }}>
              {isResubmit ? 'Resubmit Assignment' : existingSub ? 'Update Submission' : 'Submit Assignment'}
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--neu-text-ghost)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {assignment.title}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ ...neuInset({ width: 32, height: 32, borderRadius: '0.65rem' }), display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', color: 'var(--neu-text-ghost)', flexShrink: 0 }}
          >
            <X size={14} />
          </button>
        </div>

        <div style={{ padding: '1.25rem 1.4rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Assignment meta */}
          <div style={{ ...neuInset({ padding: '0.8rem 1rem', borderRadius: '0.875rem' }), display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
            <div>
              <p style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.2rem' }}>Total Marks</p>
              <p style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif' }}>{assignment.total_marks}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.2rem' }}>Due Date</p>
              <p style={{ fontSize: '0.82rem', fontWeight: 700, color: isPast ? '#f26b6b' : 'var(--neu-text-primary)' }}>{fmtDate(assignment.due_date)}</p>
            </div>
          </div>

          {/* Late warning */}
          {isPast && !isResubmit && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.7rem 0.9rem', borderRadius: '0.75rem', background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.3)' }}>
              <AlertTriangle size={14} style={{ color: '#f5a623', flexShrink: 0 }} />
              <p style={{ fontSize: '0.76rem', color: '#f5a623', fontWeight: 600 }}>
                Due date passed — this will be marked as a late submission
              </p>
            </div>
          )}

          {/* File upload */}
          <div>
            <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '0.5rem' }}>
              File {assignment.file_required ? '*' : '(optional)'}
              {assignment.allowed_file_types && (
                <span style={{ fontWeight: 500, color: 'var(--neu-text-ghost)', textTransform: 'none', marginLeft: '0.4rem' }}>
                  ({assignment.allowed_file_types})
                </span>
              )}
            </label>
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                ...neuInset({ borderRadius: '0.875rem', padding: '1.5rem 1rem' }),
                textAlign: 'center', cursor: 'pointer',
                border: file ? '1.5px solid rgba(62,207,142,0.45)' : '1.5px dashed var(--neu-border)',
                transition: 'border 0.18s',
              }}
            >
              {file ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <CheckCircle2 size={18} style={{ color: '#3ecf8e' }} />
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#3ecf8e' }}>{file.name}</span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--neu-text-ghost)' }}>({(file.size / 1024).toFixed(0)} KB)</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                  <Upload size={22} style={{ color: 'var(--neu-text-ghost)' }} />
                  <p style={{ fontSize: '0.8rem', color: 'var(--neu-text-muted)', fontWeight: 600 }}>Click to choose file</p>
                  {assignment.max_file_size && (
                    <p style={{ fontSize: '0.68rem', color: 'var(--neu-text-ghost)' }}>
                      Max size: {assignment.max_file_size} MB
                    </p>
                  )}
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                style={{ display: 'none' }}
                accept={assignment.allowed_file_types || '.pdf,.doc,.docx,.zip'}
                onChange={e => setFile(e.target.files[0] || null)}
              />
            </div>
          </div>

          {/* Notes / remarks */}
          <div>
            <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '0.5rem' }}>
              Notes for instructor (optional)
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add any notes or comments for your instructor…"
              style={{
                width: '100%', resize: 'none', outline: 'none', border: '1px solid var(--neu-border)',
                borderRadius: '0.875rem', padding: '0.75rem 0.9rem',
                background: 'var(--neu-surface-deep)',
                boxShadow: 'inset 3px 3px 7px var(--neu-shadow-dark), inset -2px -2px 5px var(--neu-shadow-light)',
                fontSize: '0.84rem', color: 'var(--neu-text-primary)',
                fontFamily: "'DM Sans',sans-serif", boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '0 1.4rem 1.25rem', display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={onClose}
            style={{ flex: 1, padding: '0.72rem', borderRadius: '0.75rem', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: '0.85rem', color: 'var(--neu-text-secondary)', background: 'var(--neu-surface)', boxShadow: '4px 4px 9px var(--neu-shadow-dark), -3px -3px 7px var(--neu-shadow-light)', transition: 'transform 0.12s' }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(0.98)')}
            onMouseLeave={e => (e.currentTarget.style.transform = '')}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              flex: 1, padding: '0.72rem', borderRadius: '0.75rem', border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: '0.85rem',
              color: '#fff',
              background: loading ? 'var(--neu-surface-deep)' : 'linear-gradient(135deg,#3ecf8e,#2eb87d)',
              boxShadow: loading ? 'none' : '4px 4px 12px rgba(62,207,142,0.35)',
              opacity: loading ? 0.7 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem',
              transition: 'transform 0.12s',
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'scale(1.02)' }}
            onMouseLeave={e => (e.currentTarget.style.transform = '')}
          >
            {loading
              ? <><Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite' }} /> Submitting…</>
              : <><Upload size={15} /> {isResubmit ? 'Resubmit' : 'Submit'}</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════
   ASSIGNMENT CARD (grid compatible)
════════════════════════════════════════════════════════════ */
function AssignmentCard({ assignment: a, submission: sub, idx, onSubmit }) {
  const [hov, setHov] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const now    = new Date()
  const isPast = new Date(a.due_date) <= now
  const tl     = !isPast ? getTimeLeft(a.due_date) : null

  // Determine display status
  let status
  if (sub) {
    status = sub.status   // submitted | graded | late | resubmit
  } else {
    status = isPast ? 'missed' : 'pending'
  }

  const cfg = STATUS_CFG[status] || STATUS_CFG.pending
  const StatusIcon = cfg.icon
  const canSubmit = status !== 'graded' && !(status === 'submitted' && !isPast)

  const scoreObtained = sub?.obtained_marks ?? null
  const scorePct = scoreObtained !== null && a.total_marks
    ? Math.round((scoreObtained / a.total_marks) * 100)
    : null

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        ...neu({ padding: 0, overflow: 'hidden', position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }),
        transition: 'transform 0.22s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s',
        transform: hov ? 'translateY(-3px)' : '',
        boxShadow: hov
          ? `12px 12px 28px var(--neu-shadow-dark), -6px -6px 16px var(--neu-shadow-light), 0 0 0 1.5px ${cfg.color}22`
          : 'var(--neu-raised)',
        animation: 'fadeUp 0.28s ease both',
        animationDelay: idx * 0.04 + 's',
      }}
    >
      {/* Left accent stripe */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: `linear-gradient(180deg,${cfg.color},${cfg.color}55)`, borderRadius: '1.25rem 0 0 1.25rem' }} />

      <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.7rem', flex: 1 }}>

        {/* ── Top row ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.7rem' }}>
          <div style={{ ...neuInset({ width: 40, height: 40, borderRadius: '0.75rem' }), display: 'flex', alignItems: 'center', justifyContent: 'center', color: cfg.color, flexShrink: 0 }}>
            <StatusIcon size={16} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.2rem' }}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', lineHeight: 1.3 }}>
                {a.title}
              </h3>
            </div>
            {a.description && (
              <p style={{ fontSize: '0.68rem', color: 'var(--neu-text-ghost)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {a.description}
              </p>
            )}
          </div>

          {/* Status badge - compact */}
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
            fontSize: '0.55rem', fontWeight: 800, padding: '0.15rem 0.5rem',
            borderRadius: '0.4rem', background: cfg.bg, color: cfg.color,
            border: `1px solid ${cfg.color}30`, flexShrink: 0, whiteSpace: 'nowrap',
          }}>
            <StatusIcon size={9} /> {cfg.label}
          </span>
        </div>

        {/* ── Meta row ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: isPast && !sub ? '#f26b6b' : 'var(--neu-text-ghost)' }}>
            <Calendar size={11} />
            <span style={{ fontSize: '0.65rem', fontWeight: isPast ? 700 : 500 }}>
              {fmtDate(a.due_date)}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--neu-text-ghost)' }}>
            <BarChart3 size={11} />
            <span style={{ fontSize: '0.65rem' }}>{a.total_marks} marks</span>
          </div>
          {tl && (
            <span style={{ fontSize: '0.6rem', fontWeight: 700, padding: '0.1rem 0.4rem', borderRadius: '0.35rem', background: 'rgba(91,138,240,0.12)', color: '#5b8af0', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              <Clock size={9} /> {tl}
            </span>
          )}
        </div>

        {/* File required chip */}
        {a.file_required && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.55rem', fontWeight: 700, padding: '0.1rem 0.4rem', borderRadius: '0.35rem', background: 'rgba(91,138,240,0.1)', color: '#5b8af0', width: 'fit-content' }}>
            <Paperclip size={9} /> File required
          </div>
        )}

        {/* ── Score bar (graded) ── */}
        {status === 'graded' && scoreObtained !== null && (
          <ScoreBar obtained={scoreObtained} total={a.total_marks} />
        )}

        {/* ── Feedback / remarks (expandable) ── */}
        {sub?.feedback && (
          <div>
            <button
              onClick={() => setExpanded(p => !p)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', border: 'none', background: 'none', cursor: 'pointer', padding: '0.15rem 0', color: '#3ecf8e', fontSize: '0.65rem', fontWeight: 700, fontFamily: "'DM Sans',sans-serif" }}
            >
              <Eye size={11} /> {expanded ? 'Hide' : 'Show'} Feedback
            </button>
            {expanded && (
              <div style={{ ...neuInset({ padding: '0.5rem 0.7rem', borderRadius: '0.65rem', marginTop: '0.3rem' }), display: 'flex', alignItems: 'flex-start', gap: '0.4rem', borderLeft: '2px solid #3ecf8e' }}>
                <Award size={11} style={{ color: '#3ecf8e', flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: '0.68rem', color: 'var(--neu-text-secondary)', lineHeight: 1.5, fontStyle: 'italic' }}>
                  {sub.feedback}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Plagiarism badge ── */}
        {sub?.plagiarism_percentage !== null && sub?.plagiarism_percentage !== undefined && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.6rem', fontWeight: 700, color: sub.plagiarism_percentage > 30 ? '#f26b6b' : '#3ecf8e' }}>
              Plagiarism: {sub.plagiarism_percentage.toFixed(1)}%
              {sub.plagiarism_percentage > 30 ? ' ⚠' : ' ✓'}
            </span>
          </div>
        )}

        {/* ── Action row ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.4rem', marginTop: 'auto' }}>
          {canSubmit ? (
            <button
              onClick={() => onSubmit(a, sub || null)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.35rem',
                padding: '0.4rem 0.9rem', borderRadius: '0.6rem', border: 'none', cursor: 'pointer',
                fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: '0.7rem', color: '#fff',
                background: status === 'resubmit'
                  ? 'linear-gradient(135deg,#a78bfa,#7c5cdb)'
                  : isPast
                  ? 'linear-gradient(135deg,#f5a623,#e08c0f)'
                  : 'linear-gradient(135deg,#3ecf8e,#2eb87d)',
                boxShadow: '4px 4px 10px var(--neu-shadow-dark), -2px -2px 6px var(--neu-shadow-light)',
                transition: 'transform 0.13s',
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
              onMouseLeave={e => (e.currentTarget.style.transform = '')}
            >
              <Upload size={12} />
              {status === 'resubmit' ? 'Resubmit' : isPast ? 'Late' : 'Submit'}
            </button>
          ) : status === 'graded' ? (
            <span style={{ fontSize: '0.65rem', color: '#3ecf8e', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <CheckCircle2 size={11} />
              {scorePct !== null ? `${scorePct}%` : 'Graded'}
            </span>
          ) : status === 'submitted' ? (
            <span style={{ fontSize: '0.65rem', color: '#5b8af0', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Clock size={10} /> Awaiting
            </span>
          ) : status === 'late' ? (
            <span style={{ fontSize: '0.65rem', color: '#f5a623', fontWeight: 600 }}>Late</span>
          ) : null}
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════════════════ */
export default function AssignmentsPage() {
  const user      = authStore.getUser()
  const studentId = getStudentId(user)

  const [enrollments,   setEnrollments]   = useState([])
  const [selectedEnr,   setSelectedEnr]   = useState(null)
  const [assignments,   setAssignments]   = useState([])
  const [submissionMap, setSubmissionMap] = useState({})
  const [enrLoading,    setEnrLoading]    = useState(true)
  const [loading,       setLoading]       = useState(false)
  const [submitModal,   setSubmitModal]   = useState(null)
  const [filter,        setFilter]        = useState('all')
  const [dropOpen,      setDropOpen]      = useState(false)

  /* ── load enrollments once ─────────────────────────────── */
  useEffect(() => {
    studentAPI
      .getEnrollments()
      .then(r => {
        const approved = (r.data.data?.enrollments || []).filter(e => e.is_approved)
        setEnrollments(approved)
        if (approved.length) setSelectedEnr(approved[0])
      })
      .catch(() => toast.error('Failed to load enrollments'))
      .finally(() => setEnrLoading(false))
  }, [])

  /* ── load assignments + all submissions when course changes ── */
  const fetchData = useCallback(async () => {
    if (!selectedEnr || !studentId) return
    setLoading(true)
    setAssignments([])
    setSubmissionMap({})
    try {
      const aRes = await studentAPI.getOfferingAssignments(selectedEnr.offering_id)
      const aList = aRes.data.data?.assignments || []
      setAssignments(aList)

      const sRes = await studentAPI.getStudentSubmissions(studentId)
      const allSubs = sRes.data.data?.submissions || []

      const map = {}
      allSubs.forEach(s => {
        if (s.offering_id === selectedEnr.offering_id || !s.offering_id) {
          if (!map[s.assignment_id]) {
            map[s.assignment_id] = s
          }
        }
      })
      setSubmissionMap(map)
    } catch (err) {
      console.error('Assignments fetch error:', err)
      toast.error('Failed to load assignments')
    } finally {
      setLoading(false)
    }
  }, [selectedEnr, studentId])

  useEffect(() => { fetchData() }, [fetchData])

  /* ── close dropdown on outside click ──────────────────── */
  useEffect(() => {
    if (!dropOpen) return
    const close = () => setDropOpen(false)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [dropOpen])

  /* ── derived stats ─────────────────────────────────────── */
  const now = new Date()

  const getStatus = (a) => {
    const sub = submissionMap[a.id]
    if (sub) return sub.status
    return new Date(a.due_date) <= now ? 'missed' : 'pending'
  }

  const counts = {
    total:     assignments.length,
    pending:   assignments.filter(a => getStatus(a) === 'pending').length,
    submitted: assignments.filter(a => getStatus(a) === 'submitted').length,
    graded:    assignments.filter(a => getStatus(a) === 'graded').length,
    late:      assignments.filter(a => getStatus(a) === 'late').length,
    missed:    assignments.filter(a => getStatus(a) === 'missed').length,
    resubmit:  assignments.filter(a => getStatus(a) === 'resubmit').length,
  }

  // Calculate average score for ring chart
  const gradedSubs = assignments
    .filter(a => getStatus(a) === 'graded')
    .map(a => {
      const sub = submissionMap[a.id]
      return sub?.obtained_marks != null && a.total_marks
        ? (sub.obtained_marks / a.total_marks) * 100
        : null
    })
    .filter(v => v !== null)
  const avgScore = gradedSubs.length
    ? Math.round(gradedSubs.reduce((s, v) => s + v, 0) / gradedSubs.length)
    : null

  /* ── filter list ───────────────────────────────────────── */
  const FILTERS = [
    { key: 'all',       label: 'All',        count: counts.total     },
    { key: 'pending',   label: 'Pending',    count: counts.pending   },
    { key: 'submitted', label: 'Submitted',  count: counts.submitted },
    { key: 'graded',    label: 'Graded',     count: counts.graded    },
    { key: 'late',      label: 'Late',       count: counts.late      },
    { key: 'missed',    label: 'Missed',     count: counts.missed    },
  ].filter(f => f.key === 'all' || f.count > 0)

  const filtered = assignments.filter(a => {
    if (filter === 'all') return true
    return getStatus(a) === filter
  })

  const sorted = [...filtered].sort((a, b) => {
    const sA = getStatus(a), sB = getStatus(b)
    const order = { pending: 0, resubmit: 1, submitted: 2, late: 3, graded: 4, missed: 5 }
    if (order[sA] !== order[sB]) return (order[sA] ?? 9) - (order[sB] ?? 9)
    return new Date(a.due_date) - new Date(b.due_date)
  })

  /* ─── render ───────────────────────────────────────────── */
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: '2rem', paddingLeft: '1rem', paddingRight: '1rem' }}>
      <style>{`
        @keyframes spin     { to { transform: rotate(360deg) } }
        @keyframes fadeUp   { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        @keyframes pulse    { 0%,100%{opacity:.4} 50%{opacity:.9} }
        @keyframes slideDown {
          from { opacity:0; transform:translateY(-8px) }
          to   { opacity:1; transform:translateY(0) }
        }
        textarea::placeholder { color: var(--neu-text-ghost); }
        .scroll-x::-webkit-scrollbar { height: 4px }
        .scroll-x::-webkit-scrollbar-thumb { background: var(--neu-border); border-radius: 4px }
      `}</style>

      {/* ── PAGE HEADER with dropdown on right ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ ...neuInset({ width: 44, height: 44, borderRadius: '0.875rem' }), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa' }}>
            <FileText size={20} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.55rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif' }}>
              Assignments
            </h1>
            <p style={{ fontSize: '0.76rem', color: 'var(--neu-text-ghost)' }}>
              Submit, track and review your assignments
            </p>
          </div>
        </div>

        {/* Course Dropdown - on right side */}
        {enrollments.length > 0 && !enrLoading && (
          <div style={{ position: 'relative', zIndex: 20 }}>
            <button
              onClick={e => { e.stopPropagation(); setDropOpen(p => !p) }}
              style={{ ...neu({ padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', border: 'none' }) }}
            >
              <div style={{ ...neuInset({ width: 32, height: 32, borderRadius: '0.65rem', flexShrink: 0 }), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa' }}>
                <BookOpen size={14} />
              </div>
              <div style={{ textAlign: 'left', minWidth: 160 }}>
                <p style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.05rem' }}>
                  Course
                </p>
                <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--neu-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>
                  {selectedEnr
                    ? selectedEnr.course_name?.length > 20 
                      ? selectedEnr.course_name.slice(0, 20) + '…'
                      : selectedEnr.course_name
                    : 'Select'}
                </p>
              </div>
              <ChevronDown size={16} style={{ color: 'var(--neu-text-muted)', flexShrink: 0, transition: 'transform 0.2s', transform: dropOpen ? 'rotate(180deg)' : '' }} />
            </button>

            {dropOpen && (
              <div
                onClick={e => e.stopPropagation()}
                style={{
                  position: 'absolute', top: 'calc(100% + 0.5rem)', right: 0, minWidth: 280,
                  ...neu({ padding: '0.4rem', borderRadius: '1rem' }),
                  boxShadow: '12px 12px 28px var(--neu-shadow-dark), -6px -6px 16px var(--neu-shadow-light)',
                  zIndex: 100, animation: 'slideDown 0.18s ease both',
                  maxHeight: 280, overflowY: 'auto',
                }}
              >
                {enrollments.map(enr => {
                  const active = selectedEnr?.offering_id === enr.offering_id
                  return (
                    <button
                      key={enr.offering_id}
                      onClick={() => { setSelectedEnr(enr); setDropOpen(false); setFilter('all') }}
                      style={{
                        width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer',
                        padding: '0.6rem 0.8rem', borderRadius: '0.75rem',
                        fontFamily: "'DM Sans',sans-serif",
                        background: active ? 'rgba(167,139,250,0.1)' : 'transparent',
                        display: 'flex', alignItems: 'center', gap: '0.6rem',
                        transition: 'background 0.15s',
                        color: active ? '#a78bfa' : 'var(--neu-text-secondary)',
                      }}
                      onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--neu-surface-deep)' }}
                      onMouseLeave={e => { if (!active) e.currentTarget.style.background = active ? 'rgba(167,139,250,0.1)' : 'transparent' }}
                    >
                      <div style={{ width: 28, height: 28, borderRadius: '0.5rem', background: active ? 'rgba(167,139,250,0.15)' : 'var(--neu-surface-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 800, color: active ? '#a78bfa' : 'var(--neu-text-ghost)', fontFamily: 'Outfit,sans-serif', flexShrink: 0 }}>
                        {(enr.course_code || '??').slice(0, 2).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '0.75rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{enr.course_name}</p>
                        <p style={{ fontSize: '0.6rem', color: 'var(--neu-text-ghost)', marginTop: '0.05rem' }}>
                          {enr.course_code}
                        </p>
                      </div>
                      {active && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#a78bfa', flexShrink: 0 }} />}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {enrLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>
          <Loader2 size={30} style={{ color: '#a78bfa', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : enrollments.length === 0 ? (
        <div style={{ ...neu({ padding: '4rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.85rem' }) }}>
          <div style={{ ...neuInset({ width: 60, height: 60, borderRadius: '1.1rem' }), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa' }}>
            <FileText size={26} />
          </div>
          <p style={{ fontWeight: 700, color: 'var(--neu-text-secondary)', fontSize: '1rem' }}>No active enrollments</p>
          <p style={{ fontSize: '0.78rem', color: 'var(--neu-text-ghost)' }}>Enroll in courses to view assignments</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
              <Loader2 size={28} style={{ color: '#a78bfa', animation: 'spin 0.8s linear infinite' }} />
            </div>
          ) : (
            <>
              {/* ── KPI CHIPS (2 rows: chips + ring chart) ── */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.8rem' }}>
                <Chip label="Total"     value={counts.total}     color="var(--neu-text-primary)"                            sub="assignments" />
                <Chip label="Pending"   value={counts.pending}   color={counts.pending > 0 ? '#f59e0b' : 'var(--neu-text-ghost)'}   sub={counts.resubmit > 0 ? `+${counts.resubmit} resubmit` : undefined} />
                <Chip label="Submitted" value={counts.submitted} color="#5b8af0"                                             sub="awaiting grade" />
                <Chip label="Graded"    value={counts.graded}    color="#3ecf8e"                                             sub={avgScore !== null ? `Avg ${avgScore}%` : undefined} />
                <Chip label="Missed"    value={counts.missed}    color={counts.missed > 0 ? '#f26b6b' : 'var(--neu-text-ghost)'}     sub={counts.late > 0 ? `+${counts.late} late` : undefined} />
              </div>

              {/* ── GRADE OVERVIEW with RING CHART ── */}
              {counts.graded > 0 && avgScore !== null && (
                <div style={{ ...neu({ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }) }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ ...neuInset({ width: 40, height: 40, borderRadius: '0.75rem' }), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3ecf8e' }}>
                      <TrendingUp size={18} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif' }}>
                        Grade Overview
                      </h3>
                      <p style={{ fontSize: '0.7rem', color: 'var(--neu-text-ghost)' }}>
                        Based on {counts.graded} graded assignment{counts.graded !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  {/* Ring Chart */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                    <RingChart percentage={avgScore} size={90} strokeWidth={7} />
                    <div>
                      <p style={{ fontSize: '1.8rem', fontWeight: 900, color: avgScore >= 75 ? '#3ecf8e' : avgScore >= 50 ? '#5b8af0' : '#f26b6b', fontFamily: 'Outfit,sans-serif', lineHeight: 1 }}>
                        {avgScore}%
                      </p>
                      <p style={{ fontSize: '0.7rem', color: 'var(--neu-text-ghost)', marginTop: '0.2rem' }}>
                        Overall Average
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ── PENDING WARNING ── */}
              {counts.pending > 0 && (
                <div style={{ ...neu({ padding: '0.8rem 1rem', display: 'flex', alignItems: 'center', gap: '0.7rem', border: '1px solid rgba(245,158,11,0.25)' }) }}>
                  <div style={{ ...neuInset({ width: 32, height: 32, borderRadius: '0.65rem' }), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', flexShrink: 0 }}>
                    <AlertTriangle size={14} />
                  </div>
                  <div>
                    <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f59e0b' }}>
                      {counts.pending} assignment{counts.pending !== 1 ? 's' : ''} pending
                    </p>
                    <p style={{ fontSize: '0.65rem', color: 'var(--neu-text-ghost)', marginTop: '0.05rem' }}>
                      Submit before the due date to avoid late penalties
                    </p>
                  </div>
                </div>
              )}

              {/* ── FILTER TABS ── */}
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {FILTERS.map(f => {
                  const active = filter === f.key
                  const fCfg = STATUS_CFG[f.key]
                  const accentColor = fCfg?.color || '#a78bfa'
                  return (
                    <button
                      key={f.key}
                      onClick={() => setFilter(f.key)}
                      style={{
                        padding: '0.35rem 0.85rem', borderRadius: '0.6rem', border: 'none', cursor: 'pointer',
                        fontFamily: "'DM Sans',sans-serif", fontSize: '0.72rem', fontWeight: 700,
                        transition: 'all 0.15s',
                        background: active ? 'var(--neu-surface)' : 'transparent',
                        color: active ? 'var(--neu-text-primary)' : 'var(--neu-text-ghost)',
                        boxShadow: active ? '5px 5px 12px var(--neu-shadow-dark), -3px -3px 8px var(--neu-shadow-light)' : 'none',
                        display: 'flex', alignItems: 'center', gap: '0.3rem',
                      }}
                    >
                      {f.label}
                      <span style={{
                        fontSize: '0.6rem', fontWeight: 800, padding: '0.06rem 0.35rem',
                        borderRadius: '0.3rem',
                        background: active ? `${accentColor}18` : 'var(--neu-surface-deep)',
                        color: active ? accentColor : 'var(--neu-text-ghost)',
                      }}>
                        {f.count}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* ── ASSIGNMENT CARDS GRID (3 per row) ── */}
              {sorted.length === 0 ? (
                <div style={{ ...neu({ padding: '3rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.7rem' }) }}>
                  <div style={{ ...neuInset({ width: 50, height: 50, borderRadius: '0.9rem' }), display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--neu-text-ghost)' }}>
                    <FileText size={22} />
                  </div>
                  <p style={{ fontWeight: 700, color: 'var(--neu-text-secondary)', fontSize: '0.9rem' }}>
                    {filter === 'all' ? 'No assignments yet for this course' : `No ${filter} assignments`}
                  </p>
                  <p style={{ fontSize: '0.72rem', color: 'var(--neu-text-ghost)' }}>
                    {filter !== 'all' && 'Try switching to "All" to see everything'}
                  </p>
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: '1rem',
                }}>
                  {sorted.map((a, idx) => (
                    <AssignmentCard
                      key={a.id}
                      assignment={a}
                      submission={submissionMap[a.id] || null}
                      idx={idx}
                      onSubmit={(assgn, sub) => setSubmitModal({ assignment: assgn, sub })}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── SUBMIT MODAL ── */}
      {submitModal && (
        <SubmitModal
          assignment={submitModal.assignment}
          existingSub={submitModal.sub}
          onClose={() => setSubmitModal(null)}
          onSuccess={fetchData}
        />
      )}
    </div>
  )
}