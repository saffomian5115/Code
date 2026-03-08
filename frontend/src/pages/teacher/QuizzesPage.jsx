// ═══════════════════════════════════════════════════════════════
//  QuizzesPage.jsx  —  Neumorphic + Right-click Context Menu
//  Replace: frontend/src/pages/teacher/QuizzesPage.jsx
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react'
import {
  Plus, PenSquare, Eye, Trash2, Loader2,
  Calendar, Clock, Users, Award, X, CheckCircle,
  BarChart2, Hash,
} from 'lucide-react'
import toast from 'react-hot-toast'
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

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

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
      <div style={{ ...neu({ borderRadius: '1.5rem' }), width: '100%', maxWidth: wide ? 720 : 520, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: 'var(--neu-raised-lg)' }}>
        {children}
      </div>
    </div>
  )
}

// ── Create Quiz Modal ─────────────────────────────────────────
function CreateQuizModal({ offeringId, onClose, onSuccess }) {
  const [form, setForm] = useState({ title: '', description: '', scheduled_at: '', duration_minutes: 30, total_marks: 20, quiz_type: 'mcq', instructions: '' })
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.scheduled_at) { toast.error('Title and schedule required'); return }
    setLoading(true)
    try {
      await teacherAPI.createQuiz(offeringId, form)
      toast.success('Quiz created!'); onSuccess(); onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create quiz')
    } finally { setLoading(false) }
  }

  return (
    <Modal onClose={onClose}>
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--neu-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif' }}>Create Quiz</h2>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neu-text-ghost)' }}><X size={18} /></button>
      </div>
      <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <Field label="Title *"><input value={form.title} onChange={e => set('title', e.target.value)} style={inputStyle} placeholder="Quiz title" /></Field>
        <Field label="Description">
          <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2}
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} placeholder="Quiz description..." />
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <Field label="Scheduled At *"><input type="datetime-local" value={form.scheduled_at} onChange={e => set('scheduled_at', e.target.value)} style={inputStyle} /></Field>
          <Field label="Duration (mins)"><input type="number" value={form.duration_minutes} onChange={e => set('duration_minutes', e.target.value)} min={5} style={inputStyle} /></Field>
          <Field label="Total Marks"><input type="number" value={form.total_marks} onChange={e => set('total_marks', e.target.value)} min={1} style={inputStyle} /></Field>
          <Field label="Type">
            <select value={form.quiz_type} onChange={e => set('quiz_type', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
              {['mcq', 'short_answer', 'mixed'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Instructions">
          <textarea value={form.instructions} onChange={e => set('instructions', e.target.value)} rows={2}
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} placeholder="Instructions for students..." />
        </Field>
      </div>
      <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--neu-border)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
        <button onClick={onClose} style={{ ...inputStyle, width: 'auto', padding: '0.6rem 1.1rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}>Cancel</button>
        <NeuBtn onClick={handleSubmit} loading={loading} accent='#34d399'><Plus size={14} /> Create Quiz</NeuBtn>
      </div>
    </Modal>
  )
}

// ── Quiz Results Modal ────────────────────────────────────────
function ResultsModal({ quiz, onClose }) {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    teacherAPI.getQuizResults(quiz.id)
      .then(r => setResults(r.data.data?.results || []))
      .catch(() => toast.error('Failed to load results'))
      .finally(() => setLoading(false))
  }, [quiz.id])

  const totalMarks = quiz.total_marks || 20
  const avg = results.length ? (results.reduce((s, r) => s + (r.score || 0), 0) / results.length).toFixed(1) : '—'

  return (
    <Modal onClose={onClose} wide>
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--neu-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif' }}>{quiz.title} — Results</h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--neu-text-ghost)', marginTop: '0.15rem' }}>{results.length} submissions · Avg: {avg}/{totalMarks}</p>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neu-text-ghost)' }}><X size={18} /></button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2.5rem' }}><Loader2 size={24} style={{ color: '#34d399', animation: 'spin 0.8s linear infinite' }} /></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['#', 'Student', 'Roll No', 'Score', 'Percentage'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.length === 0 ? (
                  <tr><td colSpan={5} style={{ ...tdStyle, textAlign: 'center', padding: '2.5rem', color: 'var(--neu-text-ghost)' }}>No submissions yet</td></tr>
                ) : results.map((r, idx) => {
                  const pct = ((r.score / totalMarks) * 100).toFixed(1)
                  const color = pct >= 75 ? '#3ecf8e' : pct >= 50 ? '#5b8af0' : '#f26b6b'
                  return (
                    <tr key={r.student_id}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--neu-surface-deep)'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}
                      style={{ transition: 'background 0.12s' }}
                    >
                      <td style={{ ...tdStyle, color: 'var(--neu-text-ghost)' }}>{idx + 1}</td>
                      <td style={{ ...tdStyle, fontWeight: 600, color: 'var(--neu-text-primary)' }}>{r.student_name}</td>
                      <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: '0.75rem' }}>{r.roll_number}</td>
                      <td style={{ ...tdStyle, fontWeight: 800, color: 'var(--neu-text-primary)' }}>{r.score}/{totalMarks}</td>
                      <td style={tdStyle}>
                        <span style={{ fontWeight: 700, color, fontSize: '0.82rem' }}>{pct}%</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Modal>
  )
}

// ── Quiz Card ─────────────────────────────────────────────────
function QuizCard({ quiz, onRightClick, onViewResults }) {
  const [hovered, setHovered] = useState(false)
  const now = new Date()
  const scheduledAt = new Date(quiz.scheduled_at)
  const endAt = new Date(scheduledAt.getTime() + (quiz.duration_minutes || 0) * 60000)
  const isLive = now >= scheduledAt && now <= endAt
  const isDone = now > endAt
  const isPending = now < scheduledAt

  const statusCfg = isLive
    ? { label: 'Live', color: '#3ecf8e', bg: 'rgba(62,207,142,0.12)' }
    : isDone
    ? { label: 'Completed', color: 'var(--neu-text-ghost)', bg: 'var(--neu-surface-deep)' }
    : { label: 'Upcoming', color: '#5b8af0', bg: 'rgba(91,138,240,0.12)' }

  return (
    <div
      onContextMenu={e => onRightClick(e, quiz)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...neu({ padding: '1.1rem 1.25rem', position: 'relative', cursor: 'context-menu' }),
        transition: 'transform 0.18s, box-shadow 0.18s',
        transform: hovered ? 'translateY(-2px)' : '',
        boxShadow: hovered ? '12px 12px 28px var(--neu-shadow-dark), -8px -8px 18px var(--neu-shadow-light)' : 'var(--neu-raised)',
        display: 'flex', alignItems: 'center', gap: '1rem',
      }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: '0.875rem', flexShrink: 0,
        background: 'rgba(52,211,153,0.1)', color: '#34d399',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: 'inset 2px 2px 5px var(--neu-shadow-dark), inset -1px -1px 4px var(--neu-shadow-light)',
      }}>
        <PenSquare size={20} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif' }}>{quiz.title}</h3>
          <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.15rem 0.5rem', background: statusCfg.bg, color: statusCfg.color, borderRadius: '0.35rem' }}>
            {statusCfg.label}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.71rem', color: 'var(--neu-text-ghost)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Calendar size={11} />{formatDate(quiz.scheduled_at)}
          </span>
          <span style={{ fontSize: '0.71rem', color: 'var(--neu-text-ghost)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Clock size={11} />{quiz.duration_minutes} mins
          </span>
          <span style={{ fontSize: '0.71rem', color: 'var(--neu-text-ghost)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Hash size={11} />{quiz.total_marks} marks
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
        <span style={{ background: 'rgba(91,138,240,0.1)', color: '#5b8af0', fontSize: '0.72rem', fontWeight: 700, padding: '0.25rem 0.6rem', borderRadius: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <Users size={11} /> {quiz.submission_count || 0}
        </span>
        {(isDone || isLive) && (
          <button onClick={() => onViewResults(quiz)}
            style={{
              padding: '0.4rem 0.8rem', borderRadius: '0.6rem', border: 'none',
              background: 'rgba(52,211,153,0.1)', color: '#34d399',
              fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer',
              boxShadow: '3px 3px 7px var(--neu-shadow-dark), -1px -1px 4px var(--neu-shadow-light)',
              display: 'flex', alignItems: 'center', gap: '0.35rem',
              fontFamily: "'DM Sans', sans-serif",
            }}>
            <BarChart2 size={12} /> Results
          </button>
        )}
      </div>
      <span style={{ position: 'absolute', bottom: '0.4rem', right: '0.6rem', fontSize: '0.55rem', color: 'var(--neu-text-ghost)', opacity: 0.35 }}>⊞</span>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────
export default function QuizzesPage() {
  const [offerings, setOfferings] = useState([])
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterOffering, setFilterOffering] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [resultsModal, setResultsModal] = useState(null)
  const { menu, open: openMenu, close: closeMenu } = useContextMenu()

  useEffect(() => {
    teacherAPI.getMyOfferings().then(r => {
      const offs = r.data.data?.offerings || []
      setOfferings(offs)
      if (offs.length) setFilterOffering(String(offs[0].id))
    })
  }, [])

  useEffect(() => {
    if (!filterOffering) return
    setLoading(true)
    teacherAPI.getOfferingQuizzes(filterOffering)
      .then(r => setQuizzes(r.data.data?.quizzes || []))
      .catch(() => toast.error('Failed to load quizzes'))
      .finally(() => setLoading(false))
  }, [filterOffering])

  const fetchQuizzes = () => {
    if (!filterOffering) return
    setLoading(true)
    teacherAPI.getOfferingQuizzes(filterOffering)
      .then(r => setQuizzes(r.data.data?.quizzes || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  const ctxItems = (quiz) => [
    { label: 'View Results', icon: BarChart2, onClick: q => setResultsModal(q) },
    { divider: true },
    { label: 'Delete', icon: Trash2, danger: true, onClick: async (q) => {
      if (!confirm('Delete this quiz?')) return
      try { await teacherAPI.deleteQuiz(q.id); toast.success('Deleted'); fetchQuizzes() }
      catch { toast.error('Failed to delete') }
    }},
  ]

  const selectStyle = {
    background: 'var(--neu-surface-deep)',
    boxShadow: 'inset 3px 3px 7px var(--neu-shadow-dark), inset -2px -2px 5px var(--neu-shadow-light)',
    border: '1px solid var(--neu-border)',
    borderRadius: '0.75rem', padding: '0.6rem 0.9rem',
    fontSize: '0.85rem', color: 'var(--neu-text-primary)', outline: 'none',
    cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", minWidth: 260,
  }

  return (
    <div style={{ maxWidth: 980, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: '2rem' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.55rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', marginBottom: '0.2rem' }}>Quizzes</h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--neu-text-ghost)' }}>{quizzes.length} quizzes created</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <select value={filterOffering} onChange={e => setFilterOffering(e.target.value)} style={selectStyle}>
            {offerings.map(o => <option key={o.id} value={o.id}>{o.course_name} — Sec {o.section}</option>)}
          </select>
          <NeuBtn onClick={() => setShowCreate(true)} disabled={!offerings.length} accent='#34d399'><Plus size={14} /> Create Quiz</NeuBtn>
        </div>
      </div>

      {/* Quiz list */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Loader2 size={28} style={{ color: '#34d399', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : quizzes.length === 0 ? (
        <div style={{ ...neu({ padding: '3.5rem 2rem' }), display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 56, height: 56, borderRadius: '1rem', background: 'rgba(52,211,153,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 3px 3px 7px var(--neu-shadow-dark), inset -2px -2px 5px var(--neu-shadow-light)' }}>
            <PenSquare size={24} style={{ color: '#34d399' }} />
          </div>
          <p style={{ fontWeight: 700, color: 'var(--neu-text-secondary)', fontSize: '0.93rem' }}>No quizzes yet</p>
          <p style={{ fontSize: '0.8rem', color: 'var(--neu-text-ghost)' }}>Create your first quiz for this course</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
          {quizzes.map(q => (
            <QuizCard key={q.id} quiz={q} onRightClick={openMenu} onViewResults={setResultsModal} />
          ))}
        </div>
      )}

      {showCreate && <CreateQuizModal offeringId={filterOffering} onClose={() => setShowCreate(false)} onSuccess={fetchQuizzes} />}
      {resultsModal && <ResultsModal quiz={resultsModal} onClose={() => setResultsModal(null)} />}
      <ContextMenu menu={menu} close={closeMenu} items={menu ? ctxItems(menu.row) : []} />
    </div>
  )
}