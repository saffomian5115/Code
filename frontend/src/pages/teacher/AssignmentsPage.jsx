// ═══════════════════════════════════════════════════════════════
//  AssignmentsPage.jsx  —  Neumorphic + Right-click Context Menu
//  Replace: frontend/src/pages/teacher/AssignmentsPage.jsx
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react'
import {
  Plus, FileText, Eye, Trash2, Loader2,
  Calendar, Users, Award, Upload, X, Clock,
  AlertCircle, CheckCircle, BookOpen,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useSearchParams } from 'react-router-dom'
import { teacherAPI } from '../../api/teacher.api'
import { useContextMenu, ContextMenu } from '../../hooks/useContextMenu'

// ── Shared styles ─────────────────────────────────────────────
const neu = (extra = {}) => ({
  background: 'var(--neu-surface)',
  boxShadow: 'var(--neu-raised)',
  border: '1px solid var(--neu-border)',
  borderRadius: '1.25rem',
  ...extra,
})

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

const thStyle = {
  textAlign: 'left', padding: '0.7rem 1rem',
  fontSize: '0.68rem', fontWeight: 700,
  color: 'var(--neu-text-ghost)',
  textTransform: 'uppercase', letterSpacing: '0.06em',
  borderBottom: '1px solid var(--neu-border)',
  whiteSpace: 'nowrap',
}

const tdStyle = {
  padding: '0.75rem 1rem',
  fontSize: '0.82rem',
  color: 'var(--neu-text-secondary)',
  borderBottom: '1px solid var(--neu-border-inner)',
}

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'
const isOverdue = (d) => d && new Date(d) < new Date()

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
      <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--neu-text-ghost)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</label>
      {children}
    </div>
  )
}

function NeuBtn({ onClick, disabled, loading: isLoading, accent = '#5b8af0', children, style = {} }) {
  return (
    <button onClick={onClick} disabled={disabled || isLoading}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.45rem',
        padding: '0.6rem 1.2rem', borderRadius: '0.875rem', border: 'none',
        background: `linear-gradient(145deg, ${accent}ee, ${accent}bb)`,
        boxShadow: `4px 4px 12px var(--neu-shadow-dark), -2px -2px 6px var(--neu-shadow-light)`,
        color: '#fff', fontSize: '0.8rem', fontWeight: 700,
        fontFamily: "'DM Sans', sans-serif",
        cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
        opacity: disabled || isLoading ? 0.6 : 1,
        transition: 'transform 0.14s',
        ...style,
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.transform = 'translateY(-1px)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = '' }}
    >
      {isLoading && <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} />}
      {children}
    </button>
  )
}

function Modal({ children, onClose, wide }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,14,22,0.6)', backdropFilter: 'blur(8px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ ...neu({ borderRadius: '1.5rem' }), width: '100%', maxWidth: wide ? 780 : 520, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: 'var(--neu-raised-lg)' }}>
        {children}
      </div>
    </div>
  )
}

// ── Create Assignment Modal ───────────────────────────────────
function CreateModal({ offeringId, onClose, onSuccess }) {
  const [form, setForm] = useState({ title: '', description: '', due_date: '', total_marks: 100, allow_late: false })
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.due_date) { toast.error('Title and due date required'); return }
    setLoading(true)
    try {
      await teacherAPI.createAssignment(offeringId, form)
      toast.success('Assignment created!'); onSuccess(); onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create assignment')
    } finally { setLoading(false) }
  }

  return (
    <Modal onClose={onClose}>
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--neu-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif' }}>New Assignment</h2>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neu-text-ghost)' }}><X size={18} /></button>
      </div>
      <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <Field label="Title *"><input value={form.title} onChange={e => set('title', e.target.value)} style={inputStyle} placeholder="Assignment title" /></Field>
        <Field label="Description">
          <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3}
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} placeholder="Assignment details..." />
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <Field label="Due Date *"><input type="datetime-local" value={form.due_date} onChange={e => set('due_date', e.target.value)} style={inputStyle} /></Field>
          <Field label="Total Marks"><input type="number" value={form.total_marks} onChange={e => set('total_marks', e.target.value)} style={inputStyle} min={1} /></Field>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.82rem', color: 'var(--neu-text-secondary)' }}>
          <input type="checkbox" checked={form.allow_late} onChange={e => set('allow_late', e.target.checked)} />
          Allow late submissions
        </label>
      </div>
      <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--neu-border)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
        <button onClick={onClose} style={{ ...inputStyle, width: 'auto', padding: '0.6rem 1.1rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}>Cancel</button>
        <NeuBtn onClick={handleSubmit} loading={loading}><Plus size={14} /> Create</NeuBtn>
      </div>
    </Modal>
  )
}

// ── Submissions Modal ─────────────────────────────────────────
function SubmissionsModal({ assignment, onClose, onRefresh }) {
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [gradeModal, setGradeModal] = useState(null)

  const loadSubmissions = useCallback(async () => {
    setLoading(true)
    try { const res = await teacherAPI.getAssignmentSubmissions(assignment.id); setSubmissions(res.data.data?.submissions || []) }
    catch { toast.error('Failed to load submissions') }
    finally { setLoading(false) }
  }, [assignment.id])

  useEffect(() => { loadSubmissions() }, [])

  return (
    <Modal onClose={onClose} wide>
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--neu-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif' }}>{assignment.title}</h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--neu-text-ghost)', marginTop: '0.15rem' }}>{submissions.length} submissions · {assignment.total_marks} marks</p>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neu-text-ghost)' }}><X size={18} /></button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2.5rem' }}><Loader2 size={24} style={{ color: '#5b8af0', animation: 'spin 0.8s linear infinite' }} /></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Student', 'Roll No', 'Submitted At', 'Status', 'Marks', 'Plagiarism', 'Action'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {submissions.length === 0 ? (
                  <tr><td colSpan={7} style={{ ...tdStyle, textAlign: 'center', padding: '2.5rem', color: 'var(--neu-text-ghost)' }}>No submissions yet</td></tr>
                ) : submissions.map(s => (
                  <tr key={s.id}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--neu-surface-deep)'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}
                    style={{ transition: 'background 0.12s' }}
                  >
                    <td style={{ ...tdStyle, fontWeight: 600, color: 'var(--neu-text-primary)' }}>{s.student_name}</td>
                    <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: '0.75rem' }}>{s.roll_number}</td>
                    <td style={{ ...tdStyle, fontSize: '0.75rem' }}>{formatDate(s.submitted_at)}</td>
                    <td style={tdStyle}>
                      <span style={{ background: s.is_late ? 'rgba(245,166,35,0.12)' : 'rgba(62,207,142,0.12)', color: s.is_late ? '#f5a623' : '#3ecf8e', fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: '0.4rem' }}>
                        {s.is_late ? 'Late' : 'On time'}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      {s.status === 'graded'
                        ? <span style={{ fontWeight: 800, color: 'var(--neu-text-primary)' }}>{s.marks_obtained}/{assignment.total_marks}</span>
                        : <span style={{ color: 'var(--neu-text-ghost)' }}>—</span>}
                    </td>
                    <td style={tdStyle}>
                      {s.plagiarism_percentage != null
                        ? <span style={{ fontWeight: 700, color: s.plagiarism_percentage > 30 ? '#f26b6b' : '#f5a623', fontSize: '0.8rem' }}>{s.plagiarism_percentage}%</span>
                        : <span style={{ color: 'var(--neu-text-ghost)' }}>—</span>}
                    </td>
                    <td style={tdStyle}>
                      <button onClick={() => setGradeModal(s)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.35rem',
                          padding: '0.4rem 0.8rem', borderRadius: '0.6rem', border: 'none',
                          background: 'rgba(167,139,250,0.12)', color: '#a78bfa',
                          fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer',
                          fontFamily: "'DM Sans', sans-serif",
                        }}>
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
      {gradeModal && <GradeModal submission={gradeModal} totalMarks={assignment.total_marks} onClose={() => setGradeModal(null)} onSuccess={() => { loadSubmissions(); onRefresh() }} />}
    </Modal>
  )
}

// ── Grade Modal ───────────────────────────────────────────────
function GradeModal({ submission, totalMarks, onClose, onSuccess }) {
  const [marks, setMarks] = useState(submission.marks_obtained || '')
  const [feedback, setFeedback] = useState(submission.feedback || '')
  const [loading, setLoading] = useState(false)

  const handleGrade = async () => {
    if (marks === '' || isNaN(marks)) { toast.error('Enter valid marks'); return }
    setLoading(true)
    try {
      await teacherAPI.gradeSubmission(submission.id, { marks_obtained: parseFloat(marks), feedback })
      toast.success('Graded!'); onSuccess(); onClose()
    } catch { toast.error('Failed to grade') }
    finally { setLoading(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,14,22,0.7)', backdropFilter: 'blur(8px)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ ...neu({ borderRadius: '1.5rem' }), width: '100%', maxWidth: 400 }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--neu-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif' }}>Grade: {submission.student_name}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neu-text-ghost)' }}><X size={18} /></button>
        </div>
        <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <Field label={`Marks (out of ${totalMarks})`}>
            <input type="number" value={marks} onChange={e => setMarks(e.target.value)} min={0} max={totalMarks} style={inputStyle} />
          </Field>
          <Field label="Feedback">
            <textarea value={feedback} onChange={e => setFeedback(e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Feedback for student..." />
          </Field>
        </div>
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--neu-border)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button onClick={onClose} style={{ ...inputStyle, width: 'auto', padding: '0.6rem 1.1rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}>Cancel</button>
          <NeuBtn onClick={handleGrade} loading={loading} accent='#a78bfa'><Award size={14} /> Save Grade</NeuBtn>
        </div>
      </div>
    </div>
  )
}

// ── Assignment Group (upcoming / overdue) ─────────────────────
function AssignmentGroup({ title, icon: Icon, color, bg, assignments, onRightClick, onViewSubmissions }) {
  if (assignments.length === 0) return null
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <Icon size={14} style={{ color }} />
        <span style={{ fontSize: '0.78rem', fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{title} ({assignments.length})</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {assignments.map(a => (
          <div key={a.id}
            onContextMenu={e => onRightClick(e, a)}
            style={{
              ...neu({ borderRadius: '0.875rem', padding: '0.9rem 1.1rem' }),
              display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'context-menu',
              transition: 'transform 0.15s, box-shadow 0.15s', position: 'relative',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(3px)'; e.currentTarget.style.boxShadow = '10px 10px 24px var(--neu-shadow-dark), -6px -6px 14px var(--neu-shadow-light)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'var(--neu-raised)' }}
          >
            <div style={{ width: 36, height: 36, borderRadius: '0.65rem', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: 'inset 2px 2px 4px var(--neu-shadow-dark), inset -1px -1px 3px var(--neu-shadow-light)' }}>
              <FileText size={16} style={{ color }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif' }}>{a.title}</p>
              <p style={{ fontSize: '0.72rem', color: 'var(--neu-text-ghost)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.15rem' }}>
                <Calendar size={11} />Due: {formatDate(a.due_date)} · {a.total_marks} marks
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
              <span style={{ background: 'rgba(91,138,240,0.1)', color: '#5b8af0', fontSize: '0.72rem', fontWeight: 700, padding: '0.25rem 0.6rem', borderRadius: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Upload size={11} /> {a.submission_count || 0}
              </span>
              {a.pending_count > 0 && (
                <span style={{ background: 'rgba(245,166,35,0.12)', color: '#f5a623', fontSize: '0.72rem', fontWeight: 700, padding: '0.25rem 0.6rem', borderRadius: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Clock size={11} /> {a.pending_count} pending
                </span>
              )}
              <button onClick={() => onViewSubmissions(a)}
                style={{
                  padding: '0.4rem 0.8rem', borderRadius: '0.6rem', border: 'none',
                  background: 'var(--neu-surface-deep)', color: 'var(--neu-text-secondary)',
                  fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer',
                  boxShadow: '3px 3px 7px var(--neu-shadow-dark), -1px -1px 4px var(--neu-shadow-light)',
                  display: 'flex', alignItems: 'center', gap: '0.35rem',
                  fontFamily: "'DM Sans', sans-serif",
                }}>
                <Eye size={12} /> Submissions
              </button>
            </div>
            <span style={{ position: 'absolute', bottom: '0.4rem', right: '0.6rem', fontSize: '0.55rem', color: 'var(--neu-text-ghost)', opacity: 0.35 }}>⊞</span>
          </div>
        ))}
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
  const { menu, open: openMenu, close: closeMenu } = useContextMenu()

  useEffect(() => {
    teacherAPI.getMyOfferings()
      .then(r => {
        const offs = r.data.data?.offerings || []
        setOfferings(offs)
        if (!selectedOffering && offs.length > 0) setSelectedOffering(String(offs[0].id))
      })
      .catch(() => toast.error('Failed to load offerings'))
  }, [])

  const fetchAssignments = useCallback(async () => {
    if (!selectedOffering) return
    setLoading(true)
    try {
      const res = await teacherAPI.getOfferingAssignments(selectedOffering)
      setAssignments(res.data.data?.assignments || [])
    } catch { toast.error('Failed to load assignments') }
    finally { setLoading(false) }
  }, [selectedOffering])

  useEffect(() => { fetchAssignments() }, [selectedOffering])

  const now = new Date()
  const upcoming = assignments.filter(a => new Date(a.due_date) > now)
  const overdue  = assignments.filter(a => new Date(a.due_date) <= now)

  const ctxItems = (a) => [
    { label: 'View Submissions', icon: Eye, onClick: x => setViewSubmissions(x) },
    { divider: true },
    { label: 'Delete', icon: Trash2, danger: true, onClick: async (x) => {
      if (!confirm('Delete this assignment?')) return
      try { await teacherAPI.deleteAssignment(x.id); toast.success('Deleted'); fetchAssignments() }
      catch { toast.error('Failed to delete') }
    }},
  ]

  const selectStyle = {
    background: 'var(--neu-surface-deep)',
    boxShadow: 'inset 3px 3px 7px var(--neu-shadow-dark), inset -2px -2px 5px var(--neu-shadow-light)',
    border: '1px solid var(--neu-border)',
    borderRadius: '0.75rem', padding: '0.6rem 0.9rem',
    fontSize: '0.85rem', color: 'var(--neu-text-primary)', outline: 'none',
    cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
    minWidth: 260,
  }

  return (
    <div style={{ maxWidth: 980, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: '2rem' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.55rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', marginBottom: '0.2rem' }}>Assignments</h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--neu-text-ghost)' }}>{assignments.length} assignments created</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <select value={selectedOffering} onChange={e => setSelectedOffering(e.target.value)} style={selectStyle}>
            {offerings.map(o => <option key={o.id} value={o.id}>{o.course_name} — Sec {o.section}</option>)}
          </select>
          <NeuBtn onClick={() => setShowCreate(true)} disabled={!offerings.length}><Plus size={14} /> New Assignment</NeuBtn>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Loader2 size={28} style={{ color: '#5b8af0', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : assignments.length === 0 ? (
        <div style={{ ...neu({ padding: '3.5rem 2rem' }), display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 56, height: 56, borderRadius: '1rem', background: 'rgba(167,139,250,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 3px 3px 7px var(--neu-shadow-dark), inset -2px -2px 5px var(--neu-shadow-light)' }}>
            <FileText size={24} style={{ color: '#a78bfa' }} />
          </div>
          <p style={{ fontWeight: 700, color: 'var(--neu-text-secondary)', fontSize: '0.93rem' }}>No assignments yet</p>
          <p style={{ fontSize: '0.8rem', color: 'var(--neu-text-ghost)' }}>Create your first assignment for this course</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <AssignmentGroup
            title="Upcoming" icon={Clock} color='#3ecf8e' bg='rgba(62,207,142,0.1)'
            assignments={upcoming} onRightClick={openMenu} onViewSubmissions={setViewSubmissions}
          />
          <AssignmentGroup
            title="Past Due" icon={AlertCircle} color='#f26b6b' bg='rgba(242,107,107,0.1)'
            assignments={overdue} onRightClick={openMenu} onViewSubmissions={setViewSubmissions}
          />
        </div>
      )}

      {showCreate && <CreateModal offeringId={selectedOffering} onClose={() => setShowCreate(false)} onSuccess={fetchAssignments} />}
      {viewSubmissions && <SubmissionsModal assignment={viewSubmissions} onClose={() => setViewSubmissions(null)} onRefresh={fetchAssignments} />}
      <ContextMenu menu={menu} close={closeMenu} items={menu ? ctxItems(menu.row) : []} />
    </div>
  )
}