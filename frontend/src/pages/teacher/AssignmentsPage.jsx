// ═══════════════════════════════════════════════════════════════
//  AssignmentsPage.jsx  —  Card View (Like Departments Page)
//  Replace: frontend/src/pages/teacher/AssignmentsPage.jsx
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Plus, FileText, Loader2, Calendar, Users, Award, X, Clock,
  AlertCircle, CheckCircle, Upload, Eye, Edit2, Trash2,
  BookOpen, GraduationCap, BarChart3, CircleCheck,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useSearchParams } from 'react-router-dom'
import { teacherAPI } from '../../api/teacher.api'
import { useContextMenu, ContextMenu } from '../../hooks/useContextMenu'
import api from '../../api/axios'
import AddButton from '../../components/ui/AddButton'

// ── CSS for cards ─────────────────────────────────────────────
const CSS = `
  .assign-card {
    background: var(--neu-surface);
    border: 1px solid var(--neu-border);
    border-radius: 1.25rem;
    box-shadow: 6px 6px 16px var(--neu-shadow-dark), -3px -3px 10px var(--neu-shadow-light);
    padding: 1.4rem;
    position: relative;
    overflow: hidden;
    cursor: context-menu;
    user-select: none;
    transition: box-shadow 0.25s ease, border-color 0.25s ease, transform 0.25s ease;
  }
  .assign-card:hover {
    transform: translateY(-4px);
    box-shadow: 10px 18px 32px var(--neu-shadow-dark), -4px -4px 14px var(--neu-shadow-light);
  }
  .assign-card:hover .card-accent-border {
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
  @keyframes spin { to { transform: rotate(360deg) } }
  @keyframes pulse { 0%,100%{opacity:.5} 50%{opacity:1} }
`

// ── Shared styles ─────────────────────────────────────────────
const inputStyle = {
  width: '100%',
  background: 'var(--neu-surface-deep)',
  boxShadow: 'inset 3px 3px 7px var(--neu-shadow-dark), inset -2px -2px 5px var(--neu-shadow-light)',
  border: '1px solid var(--neu-border)',
  borderRadius: '0.75rem',
  padding: '0.6rem 0.9rem',
  fontSize: '0.85rem',
  color: 'var(--neu-text-primary)',
  outline: 'none',
  fontFamily: "'DM Sans', sans-serif",
  boxSizing: 'border-box',
}

const Field = ({ label, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
    <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--neu-text-ghost)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</label>
    {children}
  </div>
)

// ── Colour palette for cards (like departments) ───────────────
const PALETTE = [
  { c: "#5b8af0", bg: "rgba(91,138,240,.1)", ring: "rgba(91,138,240,.35)" },
  { c: "#9b59b6", bg: "rgba(155,89,182,.1)", ring: "rgba(155,89,182,.35)" },
  { c: "#22a06b", bg: "rgba(34,160,107,.1)", ring: "rgba(34,160,107,.35)" },
  { c: "#f97316", bg: "rgba(249,115,22,.1)", ring: "rgba(249,115,22,.35)" },
  { c: "#ef4444", bg: "rgba(239,68,68,.1)", ring: "rgba(239,68,68,.35)" },
  { c: "#f59e0b", bg: "rgba(245,158,11,.1)", ring: "rgba(245,158,11,.35)" },
  { c: "#06b6d4", bg: "rgba(6,182,212,.1)", ring: "rgba(6,182,212,.35)" },
]

// ── Format helpers ────────────────────────────────────────────
const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'
const formatDateTime = (d) => d ? new Date(d).toLocaleString('en-PK', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'
const isOverdue = (d) => d && new Date(d) < new Date()

// ── Modal Shell ───────────────────────────────────────────────
function Modal({ children, maxW = 520, wide }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(8,12,20,.7)', backdropFilter: 'blur(10px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{
        width: '100%', maxWidth: wide ? 780 : maxW,
        background: 'var(--neu-surface)',
        boxShadow: '14px 14px 36px var(--neu-shadow-dark), -6px -6px 20px var(--neu-shadow-light)',
        border: '1px solid var(--neu-border)',
        borderRadius: '1.5rem',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        animation: 'neu-slide-up .2s cubic-bezier(.34,1.56,.64,1) both',
      }}>
        {children}
      </div>
    </div>
  )
}

// ── Ring SVG Chart (Compact) ──────────────────────────────────
function RingChart({ submitted, total, size = 48 }) {
  const r = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const pct = total > 0 ? submitted / total : 0
  const dash = pct * circ
  const color = pct >= 1 ? '#3ecf8e' : pct >= 0.5 ? '#f5a623' : '#5b8af0'

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--neu-surface-deep)" strokeWidth={5} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={5} strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round" style={{ transition: 'stroke-dasharray 0.5s ease' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '0.7rem', fontWeight: 800, color, fontFamily: 'Outfit,sans-serif', lineHeight: 1 }}>{submitted}</span>
        <span style={{ fontSize: '0.5rem', color: 'var(--neu-text-ghost)', lineHeight: 1 }}>/{total}</span>
      </div>
    </div>
  )
}

// ── Assignment Card (Like DeptCard) ───────────────────────────
function AssignmentCard({ assignment, pal, onClick, onContextMenu }) {
  const overdue = isOverdue(assignment.due_date)
  const totalSubs = assignment.total_submissions ?? assignment.submission_count ?? 0
  const gradedSubs = assignment.graded_count ?? 0
  const pendingSubs = totalSubs - gradedSubs
  const enrolledCount = assignment.total_enrolled || totalSubs || 1

  const statusColor = overdue ? '#f26b6b' : '#3ecf8e'
  const statusBg = overdue ? 'rgba(242,107,107,0.12)' : 'rgba(62,207,142,0.12)'
  const statusLabel = overdue ? 'Past Due' : 'Active'

  return (
    <div className="assign-card" onContextMenu={onContextMenu} onClick={onClick} style={{ cursor: 'pointer' }}>
      {/* Hover accent ring */}
      <div className="card-accent-border" style={{ boxShadow: `inset 0 0 0 1.5px ${pal.ring}` }} />

      {/* Top accent stripe */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: pal.c, opacity: 0.8 }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {/* Header: Status Badge & Ring Chart */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{
            fontSize: '0.65rem', fontWeight: 800, padding: '0.2rem 0.7rem',
            background: statusBg, color: statusColor, borderRadius: '0.5rem',
            letterSpacing: '0.03em',
          }}>
            {statusLabel}
          </span>
          <RingChart submitted={totalSubs} total={enrolledCount} size={44} />
        </div>

        {/* Main Info: Title & Marks */}
        <div style={{ marginTop: '0.25rem' }}>
          <h3 style={{
            fontSize: '1rem', fontWeight: 800, color: 'var(--neu-text-primary)',
            fontFamily: 'Outfit, sans-serif', lineHeight: 1.3, marginBottom: '0.4rem',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {assignment.title}
          </h3>

          {/* Description (if exists) */}
          {assignment.description && (
            <p style={{
              fontSize: '0.75rem', color: 'var(--neu-text-secondary)',
              lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '2.2rem',
            }}>
              {assignment.description}
            </p>
          )}
          {!assignment.description && <div style={{ minHeight: '2.2rem' }} />}
        </div>

        {/* Footer: Meta Info */}
        <div style={{
          display: 'flex', flexDirection: 'column', gap: '0.5rem',
          paddingTop: '0.8rem', borderTop: '1px solid var(--neu-border)',
          marginTop: '0.2rem',
        }}>
          {/* Due Date */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={13} style={{ color: pal.c }} />
            <span style={{ fontSize: '0.72rem', color: 'var(--neu-text-primary)', fontWeight: 500 }}>
              Due: {formatDate(assignment.due_date)}
            </span>
          </div>

          {/* Marks & Weightage */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Award size={13} style={{ color: pal.c }} />
            <span style={{ fontSize: '0.72rem', color: 'var(--neu-text-secondary)' }}>
              {assignment.total_marks} marks
              {assignment.weightage_percent > 0 && ` · ${assignment.weightage_percent}% weight`}
            </span>
          </div>

          {/* Submission Stats */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.2rem' }}>
            <span style={{
              fontSize: '0.65rem', fontWeight: 700, padding: '0.15rem 0.5rem',
              borderRadius: '0.4rem', background: 'rgba(91,138,240,0.1)', color: '#5b8af0',
              display: 'flex', alignItems: 'center', gap: '0.25rem',
            }}>
              <Upload size={9} /> {totalSubs} submitted
            </span>
            {gradedSubs > 0 && (
              <span style={{
                fontSize: '0.65rem', fontWeight: 700, padding: '0.15rem 0.5rem',
                borderRadius: '0.4rem', background: 'rgba(62,207,142,0.1)', color: '#3ecf8e',
                display: 'flex', alignItems: 'center', gap: '0.25rem',
              }}>
                <CheckCircle size={9} /> {gradedSubs} graded
              </span>
            )}
            {pendingSubs > 0 && (
              <span style={{
                fontSize: '0.65rem', fontWeight: 700, padding: '0.15rem 0.5rem',
                borderRadius: '0.4rem', background: 'rgba(245,166,35,0.1)', color: '#f5a623',
                display: 'flex', alignItems: 'center', gap: '0.25rem',
              }}>
                <Clock size={9} /> {pendingSubs} pending
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right-click hint */}
      <span style={{
        position: 'absolute', bottom: '0.5rem', right: '0.75rem',
        fontSize: '0.55rem', color: 'var(--neu-text-ghost)', opacity: 0.3,
        transition: 'opacity 0.2s', pointerEvents: 'none',
      }}>
        right-click
      </span>
    </div>
  )
}

// ── Skeleton Card ─────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{
      background: 'var(--neu-surface)', border: '1px solid var(--neu-border)',
      borderRadius: '1.25rem', padding: '1.4rem',
      boxShadow: '6px 6px 16px var(--neu-shadow-dark), -3px -3px 10px var(--neu-shadow-light)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ width: 60, height: 24, borderRadius: '0.5rem', background: 'var(--neu-surface-deep)', animation: 'pulse 1.5s ease-in-out infinite' }} />
        <div style={{ width: 44, height: 44, borderRadius: '0.875rem', background: 'var(--neu-surface-deep)', animation: 'pulse 1.5s ease-in-out infinite' }} />
      </div>
      <div style={{ height: 16, background: 'var(--neu-surface-deep)', borderRadius: 6, width: '85%', marginBottom: '0.5rem', animation: 'pulse 1.5s ease-in-out infinite' }} />
      <div style={{ height: 12, background: 'var(--neu-surface-deep)', borderRadius: 6, width: '95%', marginBottom: '0.3rem', animation: 'pulse 1.5s ease-in-out infinite' }} />
      <div style={{ height: 12, background: 'var(--neu-surface-deep)', borderRadius: 6, width: '60%', animation: 'pulse 1.5s ease-in-out infinite' }} />
    </div>
  )
}

// ── Create Assignment Modal ───────────────────────────────────
function CreateModal({ offeringId, onClose, onSuccess }) {
  const [form, setForm] = useState({
    title: '', description: '', due_date: '',
    total_marks: 100, weightage_percent: 0,
    file_required: true, allowed_file_types: '.pdf,.docx,.zip',
    max_file_size: 10,
  })
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.due_date) { toast.error('Title and due date required'); return }
    setLoading(true)
    try {
      await api.post(`/offerings/${offeringId}/assignments`, form)
      toast.success('Assignment created!'); onSuccess(); onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create assignment')
    } finally { setLoading(false) }
  }

  return (
    <Modal maxW={520}>
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--neu-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{ width: 34, height: 34, borderRadius: '.65rem', background: 'rgba(155,89,182,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText size={15} style={{ color: '#9b59b6' }} />
          </div>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif' }}>New Assignment</h2>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neu-text-ghost)' }}><X size={18} /></button>
      </div>
      <div style={{ padding: '1.2rem 1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <Field label="Title *"><input value={form.title} onChange={e => set('title', e.target.value)} style={inputStyle} placeholder="Assignment title" autoFocus /></Field>
        <Field label="Description">
          <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3}
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} placeholder="Assignment details..." />
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <Field label="Due Date *"><input type="datetime-local" value={form.due_date} onChange={e => set('due_date', e.target.value)} style={inputStyle} /></Field>
          <Field label="Total Marks"><input type="number" value={form.total_marks} onChange={e => set('total_marks', Number(e.target.value))} style={inputStyle} min={1} /></Field>
          <Field label="Weightage %"><input type="number" value={form.weightage_percent} onChange={e => set('weightage_percent', Number(e.target.value))} style={inputStyle} min={0} max={100} /></Field>
          <Field label="Max File Size (MB)"><input type="number" value={form.max_file_size} onChange={e => set('max_file_size', Number(e.target.value))} style={inputStyle} min={1} /></Field>
        </div>
        <Field label="Allowed File Types"><input value={form.allowed_file_types} onChange={e => set('allowed_file_types', e.target.value)} style={inputStyle} placeholder=".pdf,.docx,.zip" /></Field>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.82rem', color: 'var(--neu-text-secondary)' }}>
          <input type="checkbox" checked={form.file_required} onChange={e => set('file_required', e.target.checked)} />
          File submission required
        </label>
      </div>
      <div style={{ padding: '0.9rem 1.5rem', borderTop: '1px solid var(--neu-border)', display: 'flex', gap: '0.6rem' }}>
        <button onClick={onClose} style={{ ...inputStyle, width: 'auto', padding: '0.6rem 1.1rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem', flex: 1 }}>Cancel</button>
        <button onClick={handleSubmit} disabled={loading} style={{
          flex: 1, padding: '0.6rem', borderRadius: '0.75rem', border: 'none',
          background: 'linear-gradient(145deg,#9b59b6,#7d3c98)',
          boxShadow: '0 4px 14px rgba(155,89,182,.35)', color: '#fff',
          fontWeight: 700, fontSize: '0.85rem', cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
        }}>
          {loading && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
          Create
        </button>
      </div>
    </Modal>
  )
}

// ── Submissions Modal ─────────────────────────────────────────
function SubmissionsModal({ assignment, onClose }) {
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [gradeModal, setGradeModal] = useState(null)

  const loadSubmissions = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get(`/assignments/${assignment.id}/submissions`)
      setSubmissions(res.data.data?.submissions || [])
    } catch { toast.error('Failed to load submissions') }
    finally { setLoading(false) }
  }, [assignment.id])

  useEffect(() => { loadSubmissions() }, [loadSubmissions])

  const graded = submissions.filter(s => s.status === 'graded').length
  const pending = submissions.filter(s => s.status !== 'graded').length

  return (
    <Modal wide>
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--neu-border)', display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <RingChart submitted={graded} total={submissions.length || 1} size={52} />
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif' }}>{assignment.title}</h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--neu-text-ghost)', marginTop: '0.15rem' }}>
              {submissions.length} submissions · {graded} graded · {pending} pending
            </p>
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neu-text-ghost)' }}><X size={18} /></button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2.5rem' }}><Loader2 size={24} style={{ color: '#5b8af0', animation: 'spin 0.8s linear infinite' }} /></div>
        ) : submissions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--neu-text-ghost)' }}>
            <Upload size={32} style={{ opacity: 0.2, marginBottom: '0.75rem', display: 'block', margin: '0 auto 0.75rem' }} />
            <p style={{ fontSize: '0.88rem', fontWeight: 600 }}>No submissions yet</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>{['Student', 'Roll No', 'Submitted At', 'Status', 'Marks', 'Action'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '0.7rem 1rem', fontSize: '0.68rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--neu-border)' }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {submissions.map(s => (
                  <tr key={s.id} style={{ transition: 'background 0.12s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--neu-surface-deep)'} onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.82rem', color: 'var(--neu-text-primary)', fontWeight: 600, borderBottom: '1px solid var(--neu-border-inner)' }}>{s.full_name || s.student_name}</td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', color: 'var(--neu-text-secondary)', fontFamily: 'monospace', borderBottom: '1px solid var(--neu-border-inner)' }}>{s.roll_number}</td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', color: 'var(--neu-text-secondary)', borderBottom: '1px solid var(--neu-border-inner)' }}>{formatDateTime(s.submission_date || s.submitted_at)}</td>
                    <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--neu-border-inner)' }}>
                      <span style={{ background: s.status === 'graded' ? 'rgba(62,207,142,0.12)' : s.status === 'late' ? 'rgba(245,166,35,0.12)' : 'rgba(91,138,240,0.12)', color: s.status === 'graded' ? '#3ecf8e' : s.status === 'late' ? '#f5a623' : '#5b8af0', fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: '0.4rem', textTransform: 'capitalize' }}>{s.status}</span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.82rem', color: 'var(--neu-text-primary)', fontWeight: 600, borderBottom: '1px solid var(--neu-border-inner)' }}>
                      {s.obtained_marks != null ? `${s.obtained_marks}/${assignment.total_marks}` : '—'}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--neu-border-inner)' }}>
                      <button onClick={() => setGradeModal(s)} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.8rem', borderRadius: '0.6rem', border: 'none', background: 'rgba(167,139,250,0.12)', color: '#a78bfa', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}>
                        <Award size={12} /> {s.status === 'graded' ? 'Update' : 'Grade'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {gradeModal && (
        <GradeModal submission={gradeModal} totalMarks={assignment.total_marks} onClose={() => setGradeModal(null)} onSuccess={loadSubmissions} />
      )}
    </Modal>
  )
}

// ── Grade Modal ───────────────────────────────────────────────
function GradeModal({ submission, totalMarks, onClose, onSuccess }) {
  const [marks, setMarks] = useState(submission.obtained_marks != null ? String(submission.obtained_marks) : '')
  const [feedback, setFeedback] = useState(submission.feedback || '')
  const [loading, setLoading] = useState(false)

  const handleGrade = async () => {
    if (marks === '' || isNaN(marks)) { toast.error('Enter valid marks'); return }
    if (Number(marks) > totalMarks) { toast.error(`Marks cannot exceed ${totalMarks}`); return }
    setLoading(true)
    try {
      await api.patch(`/submissions/${submission.id}/grade`, { obtained_marks: parseFloat(marks), feedback, status: 'graded' })
      toast.success('Graded successfully!'); onSuccess(); onClose()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to grade') }
    finally { setLoading(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,14,22,0.7)', backdropFilter: 'blur(8px)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: 'var(--neu-surface)', boxShadow: 'var(--neu-raised)', border: '1px solid var(--neu-border)', borderRadius: '1.5rem', width: '100%', maxWidth: 400 }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--neu-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif' }}>Grade: {submission.full_name || submission.student_name}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neu-text-ghost)' }}><X size={18} /></button>
        </div>
        <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <Field label={`Marks (out of ${totalMarks})`}>
            <input type="number" value={marks} onChange={e => setMarks(e.target.value)} min={0} max={totalMarks} style={inputStyle} autoFocus />
          </Field>
          <Field label="Feedback">
            <textarea value={feedback} onChange={e => setFeedback(e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Feedback for student..." />
          </Field>
        </div>
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--neu-border)', display: 'flex', gap: '0.75rem' }}>
          <button onClick={onClose} style={{ ...inputStyle, width: 'auto', padding: '0.6rem 1.1rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem', flex: 1 }}>Cancel</button>
          <button onClick={handleGrade} disabled={loading} style={{
            flex: 1, padding: '0.6rem', borderRadius: '0.75rem', border: 'none',
            background: 'linear-gradient(145deg,#a78bfa,#8b5cf6)', boxShadow: '0 4px 14px rgba(167,139,250,.35)',
            color: '#fff', fontWeight: 700, fontSize: '0.85rem', cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
          }}>
            {loading && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
            Save Grade
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────
export default function AssignmentsPage() {
  const [searchParams] = useSearchParams()
  const [offerings, setOfferings] = useState([])
  const [selectedOffering, setSelectedOffering] = useState(searchParams.get('offering') || '')
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [viewSubmissions, setViewSubmissions] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const { menu, open: openMenu, close: closeMenu } = useContextMenu()

  // Fetch offerings
  useEffect(() => {
    teacherAPI.getMyOfferings()
      .then(r => {
        const offs = r.data.data?.offerings || []
        setOfferings(offs)
        if (!selectedOffering && offs.length > 0) setSelectedOffering(String(offs[0].id))
      })
      .catch(() => toast.error('Failed to load offerings'))
  }, [])

  // Fetch assignments with submission counts
  const fetchAssignments = useCallback(async () => {
    if (!selectedOffering) return
    setLoading(true)
    try {
      const res = await api.get(`/offerings/${selectedOffering}/assignments`)
      const list = res.data.data?.assignments || []
      const withCounts = await Promise.all(list.map(async (a) => {
        try {
          const subRes = await api.get(`/assignments/${a.id}/submissions`)
          const subs = subRes.data.data?.submissions || []
          return { ...a, total_submissions: subs.length, graded_count: subs.filter(s => s.status === 'graded').length }
        } catch { return { ...a, total_submissions: 0, graded_count: 0 } }
      }))
      setAssignments(withCounts)
    } catch { toast.error('Failed to load assignments') }
    finally { setLoading(false) }
  }, [selectedOffering])

  useEffect(() => { fetchAssignments() }, [selectedOffering])

  // Delete assignment
  const handleDelete = async (assignment) => {
    if (!window.confirm(`Delete "${assignment.title}"? This cannot be undone.`)) return
    setDeletingId(assignment.id)
    try {
      await api.delete(`/assignments/${assignment.id}`)
      toast.success('Assignment deleted')
      fetchAssignments()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete assignment')
    } finally { setDeletingId(null) }
  }

  // Context menu items
  const ctxItems = (assignment, pal) => [
    { label: 'View Submissions', icon: Users, onClick: (a) => setViewSubmissions(a) },
    { divider: true },
    { label: 'Delete', icon: Trash2, danger: true, onClick: (a) => handleDelete(a) },
  ]

  // Filter assignments by status
  const now = new Date()
  const upcoming = assignments.filter(a => new Date(a.due_date) > now)
  const overdue = assignments.filter(a => new Date(a.due_date) <= now)

  const selectStyle = { ...inputStyle, width: 'auto', minWidth: 260, cursor: 'pointer' }

  // Get palette for assignment
  const getPalette = (index) => PALETTE[index % PALETTE.length]

  return (
    <>
      <style>{CSS}</style>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.3rem', paddingBottom: '2rem' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', letterSpacing: '-.02em' }}>
              Assignments
            </h1>
            <p style={{ fontSize: '.78rem', color: 'var(--neu-text-ghost)', marginTop: 2 }}>
              {assignments.length} assignments · {assignments.reduce((s, a) => s + (a.total_submissions || 0), 0)} total submissions
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <select value={selectedOffering} onChange={e => setSelectedOffering(e.target.value)} style={selectStyle}>
              {offerings.map(o => <option key={o.id} value={o.id}>{o.course_name} — Sec {o.section}</option>)}
            </select>
            <AddButton onClick={() => setShowCreate(true)} tooltip="New Assignment" color="#9b59b6" />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '1rem' }}>
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : assignments.length === 0 ? (
          <div style={{
            background: 'var(--neu-surface)', border: '1px solid var(--neu-border)',
            borderRadius: '1.25rem', padding: '4rem 2rem', textAlign: 'center',
            boxShadow: '6px 6px 16px var(--neu-shadow-dark), -3px -3px 10px var(--neu-shadow-light)',
          }}>
            <FileText size={38} style={{ color: 'var(--neu-text-ghost)', margin: '0 auto .8rem', opacity: 0.25, display: 'block' }} />
            <p style={{ fontWeight: 600, color: 'var(--neu-text-secondary)', fontSize: '.9rem' }}>No assignments yet</p>
            <p style={{ fontSize: '.78rem', color: 'var(--neu-text-ghost)', marginTop: '.35rem' }}>Create your first assignment for this course</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Active Assignments */}
            {upcoming.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <CircleCheck size={14} style={{ color: '#3ecf8e' }} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#3ecf8e', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Active ({upcoming.length})</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '1rem' }}>
                  {upcoming.map((a, idx) => (
                    <AssignmentCard
                      key={a.id}
                      assignment={a}
                      pal={getPalette(idx)}
                      onClick={(e) => openMenu(e, a)}
                      onContextMenu={(e) => openMenu(e, a)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Past Due Assignments */}
            {overdue.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <AlertCircle size={14} style={{ color: '#f26b6b' }} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f26b6b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Past Due ({overdue.length})</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '1rem' }}>
                  {overdue.map((a, idx) => (
                    <AssignmentCard
                      key={a.id}
                      assignment={a}
                      pal={getPalette(upcoming.length + idx)}
                      onClick={(e) => openMenu(e, a)}
                      onContextMenu={(e) => openMenu(e, a)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modals */}
        {showCreate && <CreateModal offeringId={selectedOffering} onClose={() => setShowCreate(false)} onSuccess={fetchAssignments} />}
        {viewSubmissions && <SubmissionsModal assignment={viewSubmissions} onClose={() => setViewSubmissions(null)} />}

        {/* Context Menu */}
        <ContextMenu
          menu={menu}
          close={closeMenu}
          items={menu ? ctxItems(menu.row, getPalette(assignments.findIndex(a => a.id === menu.row?.id))) : []}
        />
      </div>
    </>
  )
}