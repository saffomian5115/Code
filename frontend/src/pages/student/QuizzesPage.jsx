// ═══════════════════════════════════════════════════════════════
//  QuizzesPage.jsx  (Student)  —  Neumorphic (Enhanced UI)
//  → frontend/src/pages/student/QuizzesPage.jsx
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect, useCallback, useRef } from 'react'
import {
  PenSquare, Clock, CheckCircle2, AlertTriangle,
  Loader2, X, ChevronRight, Award, ChevronLeft,
  Lock, Play, RotateCcw, Zap, ChevronDown, Trophy, 
  Target, Calendar, BookOpen, TrendingUp
} from 'lucide-react'
import toast from 'react-hot-toast'
import { studentAPI } from '../../api/student.api'

/* ─── helpers ────────────────────────────────────────────────── */
const neu = (extra = {}) => ({
  background: 'var(--neu-surface)',
  boxShadow: 'var(--neu-raised)',
  border: '1px solid var(--neu-border)',
  borderRadius: '1.5rem',
  ...extra,
})

const neuInset = (extra = {}) => ({
  background: 'var(--neu-surface-deep)',
  boxShadow: 'inset 4px 4px 10px var(--neu-shadow-dark), inset -3px -3px 7px var(--neu-shadow-light)',
  border: '1px solid var(--neu-border)',
  borderRadius: '1rem',
  ...extra,
})

const PALETTE = ['#5b8af0','#a78bfa','#3ecf8e','#f59e0b','#f87171','#38bdf8','#fb923c','#e879f9']
const cc = (idx) => PALETTE[idx % PALETTE.length]

const fmtDT = (d) => d
  ? new Date(d).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  : '—'

const fmtTimer = (secs) => {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/* ─── Quiz status helper ─────────────────────────────────────── */
const getQuizStatus = (quiz, attempt) => {
  const now   = new Date()
  const start = quiz.start_time ? new Date(quiz.start_time) : null
  const end   = quiz.end_time   ? new Date(quiz.end_time)   : null
  if (attempt?.status === 'completed') return 'completed'
  if (end   && now > end)   return 'expired'
  if (start && now < start) return 'upcoming'
  return 'available'
}

/* ══════════════════════════════════════════════════════════════
   QUIZ ATTEMPT MODAL (Enhanced)
══════════════════════════════════════════════════════════════ */
function QuizAttemptModal({ quiz, onClose, onSuccess }) {
  const [questions,  setQuestions]  = useState([])
  const [answers,    setAnswers]    = useState({})
  const [currentQ,   setCurrentQ]   = useState(0)
  const [timeLeft,   setTimeLeft]   = useState(null)
  const [phase,      setPhase]      = useState('loading')
  const [result,     setResult]     = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    studentAPI.startQuizAttempt(quiz.id)
      .then(r => {
        const data = r.data.data || {}
        const qs   = data.questions || quiz.questions || []
        setQuestions(qs)
        setTimeLeft((quiz.time_limit_minutes || 15) * 60)
        setPhase('attempt')
      })
      .catch(err => {
        const msg = err.response?.data?.message || 'Failed to start quiz'
        toast.error(msg)
        if (msg.toLowerCase().includes('already')) {
          studentAPI.getMyQuizAttempt(quiz.id)
            .then(r => { setResult(r.data.data); setPhase('result') })
            .catch(() => onClose())
        } else {
          onClose()
        }
      })
  }, [])

  useEffect(() => {
    if (phase !== 'attempt' || timeLeft === null) return
    if (timeLeft <= 0) { handleSubmit(); return }
    timerRef.current = setInterval(() => setTimeLeft(t => t - 1), 1000)
    return () => clearInterval(timerRef.current)
  }, [phase, timeLeft])

  const handleSubmit = async () => {
    clearInterval(timerRef.current)
    setSubmitting(true)
    try {
      const res = await studentAPI.submitQuizAttempt(quiz.id, answers)
      setResult(res.data.data)
      setPhase('result')
      onSuccess()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed')
      setSubmitting(false)
    }
  }

  const q        = questions[currentQ]
  const answered = Object.keys(answers).length
  const total    = questions.length
  const isUrgent = timeLeft !== null && timeLeft < 120
  const timerColor = isUrgent ? '#f87171' : timeLeft < 300 ? '#f59e0b' : '#3ecf8e'
  const pct      = total > 0 ? (answered / total) * 100 : 0

  if (phase === 'loading') return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ ...neu({ padding: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }) }}>
        <div style={{ ...neuInset({ width: 70, height: 70, borderRadius: '1.25rem' }), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Loader2 size={30} style={{ color: '#5b8af0', animation: 'spin 0.8s linear infinite' }} />
        </div>
        <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--neu-text-primary)' }}>Preparing your quiz...</p>
      </div>
    </div>
  )

  if (phase === 'result') {
    const score      = result?.percentage ?? 0
    const obtained   = result?.score ?? 0
    const totalMarks = result?.total_marks ?? quiz.total_marks ?? total
    const passed     = score >= 50
    const scoreColor = score >= 75 ? '#3ecf8e' : score >= 50 ? '#f59e0b' : '#f87171'
    
    const getGrade = () => {
      if (score >= 90) return { letter: 'A+', emoji: '🏆' }
      if (score >= 80) return { letter: 'A', emoji: '🎯' }
      if (score >= 70) return { letter: 'B+', emoji: '👍' }
      if (score >= 60) return { letter: 'B', emoji: '📚' }
      if (score >= 50) return { letter: 'C', emoji: '📖' }
      return { letter: 'F', emoji: '💪' }
    }
    const grade = getGrade()
 
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
        <div style={{ ...neu({ padding: 0, overflow: 'hidden', width: '100%', maxWidth: 500 }), animation: 'fadeUp 0.3s ease' }}>
 
          <div style={{ height: 8, background: `linear-gradient(90deg, ${scoreColor}, ${scoreColor}66)` }} />
 
          <div style={{ padding: '2rem 1.75rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ position: 'relative' }}>
              <svg width={140} height={140} style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={70} cy={70} r={60} fill="none" stroke="var(--neu-border)" strokeWidth={10} />
                <circle cx={70} cy={70} r={60} fill="none" stroke={scoreColor} strokeWidth={10}
                  strokeDasharray={`${(score / 100) * 2 * Math.PI * 60} ${2 * Math.PI * 60}`}
                  strokeLinecap="round" style={{ transition: 'stroke-dasharray 1s cubic-bezier(0.34,1.56,0.64,1)' }} />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '2rem', fontWeight: 900, color: scoreColor, fontFamily: 'Outfit,sans-serif', lineHeight: 1 }}>
                  {Math.round(score)}%
                </span>
                <span style={{ fontSize: '0.65rem', color: 'var(--neu-text-ghost)', fontWeight: 600 }}>Score</span>
              </div>
            </div>
 
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', marginBottom: '0.25rem' }}>
                {grade.emoji} {grade.letter} Grade
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--neu-text-ghost)', marginTop: '0.25rem' }}>{quiz.title}</p>
            </div>
 
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', width: '100%' }}>
              <div style={{ ...neuInset({ borderRadius: '1rem', padding: '0.85rem', textAlign: 'center' }) }}>
                <p style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.3rem' }}>Score</p>
                <p style={{ fontSize: '1.25rem', fontWeight: 900, color: scoreColor, fontFamily: 'Outfit,sans-serif' }}>{obtained}/{totalMarks}</p>
              </div>
              <div style={{ ...neuInset({ borderRadius: '1rem', padding: '0.85rem', textAlign: 'center' }) }}>
                <p style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.3rem' }}>Questions</p>
                <p style={{ fontSize: '1.25rem', fontWeight: 900, color: '#5b8af0', fontFamily: 'Outfit,sans-serif' }}>{total}</p>
              </div>
            </div>
 
            {result?.feedback && (
              <div style={{ ...neuInset({ borderRadius: '1rem', padding: '0.9rem 1rem', width: '100%' }), display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                <Award size={16} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 2 }} />
                <p style={{ fontSize: '0.8rem', color: 'var(--neu-text-muted)', lineHeight: 1.55 }}>{result.feedback}</p>
              </div>
            )}
 
            <button onClick={onClose}
              style={{ width: '100%', padding: '0.85rem', borderRadius: '1rem', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: '0.95rem', color: '#fff', background: `linear-gradient(135deg,${scoreColor},${scoreColor}cc)`, boxShadow: `4px 4px 14px ${scoreColor}40, -2px -2px 6px var(--neu-shadow-light)`, transition: 'transform 0.12s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseLeave={e => e.currentTarget.style.transform = ''}>
              Done
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ ...neu({ padding: 0, overflow: 'hidden', width: '100%', maxWidth: 680, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }), animation: 'fadeUp 0.2s ease' }}>

        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--neu-border)', display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
          <div style={{ ...neuInset({ borderRadius: '1rem', padding: '0.5rem 1rem' }), display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
            <Clock size={16} style={{ color: timerColor }} />
            <span style={{ fontSize: '1rem', fontWeight: 900, color: timerColor, fontFamily: 'Outfit,sans-serif', letterSpacing: '0.05em', animation: isUrgent ? 'pulse 1s ease-in-out infinite' : 'none' }}>
              {fmtTimer(timeLeft)}
            </span>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{quiz.title}</p>
            <p style={{ fontSize: '0.7rem', color: 'var(--neu-text-ghost)' }}>Question {currentQ + 1} of {total} · {answered} answered</p>
          </div>

          <button onClick={onClose} style={{ ...neuInset({ width: 36, height: 36, borderRadius: '0.75rem' }), display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', color: 'var(--neu-text-ghost)', flexShrink: 0 }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ height: 5, background: 'var(--neu-surface-deep)', flexShrink: 0 }}>
          <div style={{ height: '100%', background: `linear-gradient(90deg,#5b8af0,#a78bfa)`, width: `${pct}%`, transition: 'width 0.3s ease', boxShadow: '0 0 10px rgba(91,138,240,0.5)' }} />
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          {q ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ ...neuInset({ borderRadius: '1.25rem', padding: '1.25rem' }) }}>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '0.25rem 0.6rem', borderRadius: '0.6rem', background: 'rgba(91,138,240,0.15)', color: '#5b8af0', flexShrink: 0 }}>
                    Q{currentQ + 1}
                  </span>
                  <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--neu-text-primary)', lineHeight: 1.55 }}>
                    {q.question_text || q.question}
                  </p>
                </div>
                {q.marks && (
                  <p style={{ fontSize: '0.7rem', color: 'var(--neu-text-ghost)', marginTop: '0.5rem', paddingLeft: '2.75rem' }}>
                    {q.marks} mark{q.marks !== 1 ? 's' : ''}
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {(q.question_type === 'mcq' || q.options?.length > 0) &&
                  (q.options || []).map((opt, i) => {
                    const isSelected = answers[q.id] === opt
                    return (
                      <button key={i} onClick={() => setAnswers(p => ({ ...p, [q.id]: opt }))}
                        style={{
                          width: '100%', textAlign: 'left', padding: '1rem 1.25rem',
                          borderRadius: '1rem', border: 'none', cursor: 'pointer',
                          fontFamily: "'DM Sans',sans-serif", fontSize: '0.9rem',
                          display: 'flex', alignItems: 'center', gap: '0.85rem',
                          transition: 'all 0.15s',
                          background: isSelected ? 'var(--neu-surface)' : 'var(--neu-surface-deep)',
                          color: isSelected ? '#5b8af0' : 'var(--neu-text-secondary)',
                          fontWeight: isSelected ? 700 : 500,
                          boxShadow: isSelected
                            ? '5px 5px 12px var(--neu-shadow-dark), -3px -3px 8px var(--neu-shadow-light), 0 0 0 2px rgba(91,138,240,0.3)'
                            : 'inset 3px 3px 8px var(--neu-shadow-dark), inset -2px -2px 5px var(--neu-shadow-light)',
                        }}
                        onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--neu-surface)' }}
                        onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'var(--neu-surface-deep)' }}
                      >
                        <span style={{ width: 32, height: 32, borderRadius: '0.7rem', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800, background: isSelected ? 'rgba(91,138,240,0.15)' : 'var(--neu-surface)', color: isSelected ? '#5b8af0' : 'var(--neu-text-ghost)', boxShadow: isSelected ? 'none' : 'inset 2px 2px 4px var(--neu-shadow-dark), inset -1px -1px 3px var(--neu-shadow-light)' }}>
                          {String.fromCharCode(65 + i)}
                        </span>
                        {opt}
                        {isSelected && <CheckCircle2 size={16} style={{ marginLeft: 'auto', color: '#5b8af0', flexShrink: 0 }} />}
                      </button>
                    )
                  })
                }

                {q.question_type === 'true_false' &&
                  ['True', 'False'].map(v => {
                    const isSelected = answers[q.id] === v
                    const col = v === 'True' ? '#3ecf8e' : '#f87171'
                    return (
                      <button key={v} onClick={() => setAnswers(p => ({ ...p, [q.id]: v }))}
                        style={{ width: '100%', padding: '1rem 1.25rem', borderRadius: '1rem', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", fontSize: '0.9rem', fontWeight: 700, transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '0.7rem', background: isSelected ? `${col}15` : 'var(--neu-surface-deep)', color: isSelected ? col : 'var(--neu-text-secondary)', boxShadow: isSelected ? `0 0 0 2px ${col}40, 4px 4px 10px var(--neu-shadow-dark), -2px -2px 6px var(--neu-shadow-light)` : 'inset 3px 3px 8px var(--neu-shadow-dark), inset -2px -2px 5px var(--neu-shadow-light)' }}>
                        <span style={{ fontSize: '1.1rem' }}>{v === 'True' ? '✓' : '✗'}</span>
                        {v}
                        {isSelected && <CheckCircle2 size={15} style={{ marginLeft: 'auto', color: col }} />}
                      </button>
                    )
                  })
                }

                {q.question_type === 'short' && (
                  <textarea rows={3} value={answers[q.id] || ''} onChange={e => setAnswers(p => ({ ...p, [q.id]: e.target.value }))}
                    style={{ width: '100%', ...neuInset({ borderRadius: '1rem', padding: '0.85rem 1rem' }), fontSize: '0.9rem', color: 'var(--neu-text-primary)', outline: 'none', fontFamily: "'DM Sans',sans-serif", resize: 'none', boxSizing: 'border-box' }}
                    placeholder="Type your answer here…" />
                )}
              </div>
            </div>
          ) : (
            <p style={{ textAlign: 'center', color: 'var(--neu-text-ghost)', padding: '3rem' }}>No questions found</p>
          )}
        </div>

        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--neu-border)', display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
          <div style={{ flex: 1, display: 'flex', gap: '6px', flexWrap: 'wrap', overflowY: 'hidden', maxHeight: 40 }}>
            {questions.map((qitem, i) => {
              const isAns = !!answers[qitem.id]
              const isCur = i === currentQ
              return (
                <button key={i} onClick={() => setCurrentQ(i)}
                  style={{ width: 32, height: 32, borderRadius: '0.6rem', border: 'none', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 800, fontFamily: 'Outfit,sans-serif', transition: 'all 0.15s', background: isCur ? '#5b8af0' : isAns ? '#3ecf8e' : 'var(--neu-surface-deep)', color: (isCur || isAns) ? '#fff' : 'var(--neu-text-ghost)', boxShadow: isCur ? '3px 3px 8px var(--neu-shadow-dark), -2px -2px 5px var(--neu-shadow-light), 0 2px 8px rgba(91,138,240,0.4)' : 'inset 2px 2px 4px var(--neu-shadow-dark), inset -1px -1px 3px var(--neu-shadow-light)' }}>
                  {i + 1}
                </button>
              )
            })}
          </div>

          <div style={{ display: 'flex', gap: '0.65rem', flexShrink: 0 }}>
            {currentQ > 0 && (
              <button onClick={() => setCurrentQ(c => c - 1)}
                style={{ ...neuInset({ padding: '0.55rem 1rem', borderRadius: '0.85rem' }), border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--neu-text-secondary)', fontFamily: "'DM Sans',sans-serif" }}>
                <ChevronLeft size={15} /> Prev
              </button>
            )}
            {currentQ < total - 1 ? (
              <button onClick={() => setCurrentQ(c => c + 1)}
                style={{ padding: '0.55rem 1rem', borderRadius: '0.85rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', fontWeight: 700, color: '#fff', fontFamily: "'DM Sans',sans-serif", background: 'linear-gradient(135deg,#5b8af0,#3a6bd4)', boxShadow: '3px 3px 9px var(--neu-shadow-dark), -2px -2px 5px var(--neu-shadow-light), 0 2px 8px rgba(91,138,240,0.35)', transition: 'transform 0.12s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
                onMouseLeave={e => e.currentTarget.style.transform = ''}>
                Next <ChevronRight size={15} />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={submitting}
                style={{ padding: '0.55rem 1.25rem', borderRadius: '0.85rem', border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 700, color: '#fff', fontFamily: "'DM Sans',sans-serif", background: submitting ? 'var(--neu-surface-deep)' : 'linear-gradient(135deg,#3ecf8e,#2eb87d)', boxShadow: submitting ? 'none' : '3px 3px 9px var(--neu-shadow-dark), -2px -2px 5px var(--neu-shadow-light), 0 2px 8px rgba(62,207,142,0.35)', opacity: submitting ? 0.6 : 1, transition: 'transform 0.12s' }}
                onMouseEnter={e => { if (!submitting) e.currentTarget.style.transform = 'scale(1.04)' }}
                onMouseLeave={e => e.currentTarget.style.transform = ''}>
                {submitting
                  ? <><Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> Submitting…</>
                  : <><CheckCircle2 size={14} /> Submit Quiz</>
                }
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Enhanced Quiz Card ──────────────────────────────────────────────── */
function QuizCard({ quiz, attempt, idx, onAttempt }) {
  const [hov, setHov] = useState(false)
  const status = getQuizStatus(quiz, attempt)

  const STATUS_CFG = {
    available:  { color: '#5b8af0', bg: 'rgba(91,138,240,0.1)', label: 'Available', icon: Zap, action: true },
    completed:  { color: '#3ecf8e', bg: 'rgba(62,207,142,0.1)', label: 'Completed', icon: CheckCircle2, action: false },
    upcoming:   { color: '#f59e0b', bg: 'rgba(245,159,11,0.1)', label: 'Upcoming', icon: Clock, action: false },
    expired:    { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', label: 'Expired', icon: Lock, action: false },
  }
  const st = STATUS_CFG[status]
  const ac = st.color
  const StatusIcon = st.icon

  const score = attempt?.percentage
  const canAttempt = status === 'available'

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ 
        ...neu({ padding: 0, overflow: 'hidden' }), 
        transition: 'transform 0.25s ease, box-shadow 0.2s', 
        transform: hov ? 'translateY(-4px)' : '', 
        boxShadow: hov ? `16px 16px 32px var(--neu-shadow-dark), -8px -8px 20px var(--neu-shadow-light), 0 0 0 2px ${ac}30` : 'var(--neu-raised)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg, ${ac}, ${ac}80)` }} />

      <div style={{ padding: '1rem' }}>
        {/* Title Row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
            <div style={{ ...neuInset({ width: 40, height: 40, borderRadius: '0.75rem' }), display: 'flex', alignItems: 'center', justifyContent: 'center', color: ac, flexShrink: 0 }}>
              <StatusIcon size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', lineHeight: 1.3 }}>{quiz.title}</h3>
              {quiz.is_mandatory && (
                <span style={{ fontSize: '0.55rem', fontWeight: 800, padding: '0.1rem 0.4rem', borderRadius: '0.35rem', background: 'rgba(248,113,113,0.1)', color: '#f87171', display: 'inline-block', marginTop: '0.2rem' }}>Required</span>
              )}
            </div>
          </div>
          <span style={{ fontSize: '0.6rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '0.4rem', background: st.bg, color: ac, flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <StatusIcon size={9} /> {st.label}
          </span>
        </div>

        {/* Description */}
        {quiz.description && (
          <p style={{ fontSize: '0.7rem', color: 'var(--neu-text-ghost)', marginBottom: '0.5rem', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{quiz.description}</p>
        )}

        {/* Meta Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
          {quiz.time_limit_minutes && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--neu-text-ghost)' }}>
              <Clock size={11} />
              <span style={{ fontSize: '0.65rem' }}>{quiz.time_limit_minutes}m</span>
            </div>
          )}
          {quiz.total_marks && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--neu-text-ghost)' }}>
              <Target size={11} />
              <span style={{ fontSize: '0.65rem' }}>{quiz.total_marks} marks</span>
            </div>
          )}
        </div>

        {/* Score Bar (if completed) */}
        {status === 'completed' && score !== undefined && (
          <div style={{ marginBottom: '0.6rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '0.6rem', color: 'var(--neu-text-ghost)' }}>Score</span>
              <span style={{ fontSize: '0.65rem', fontWeight: 800, color: score >= 75 ? '#3ecf8e' : score >= 50 ? '#f59e0b' : '#f87171' }}>
                {Math.round(score)}%
              </span>
            </div>
            <div style={{ ...neuInset({ height: 6, borderRadius: 3, padding: 1 }) }}>
              <div style={{ height: '100%', borderRadius: 3, background: score >= 75 ? '#3ecf8e' : score >= 50 ? '#f59e0b' : '#f87171', width: `${Math.min(100, score)}%` }} />
            </div>
          </div>
        )}

        {/* Action Button */}
        <div style={{ marginTop: '0.5rem' }}>
          {canAttempt ? (
            <button onClick={() => onAttempt(quiz)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.45rem', borderRadius: '0.7rem', border: 'none', background: 'linear-gradient(135deg,#5b8af0,#3a6bd4)', color: '#fff', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}>
              <Play size={12} /> Start Quiz
            </button>
          ) : status === 'completed' ? (
            <div style={{ textAlign: 'center', fontSize: '0.65rem', color: '#3ecf8e', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
              <CheckCircle2 size={12} /> Completed
            </div>
          ) : status === 'upcoming' ? (
            <div style={{ textAlign: 'center', fontSize: '0.65rem', color: '#f59e0b' }}>Coming Soon</div>
          ) : (
            <div style={{ textAlign: 'center', fontSize: '0.65rem', color: 'var(--neu-text-ghost)' }}>Closed</div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Main Page with Dropdown ──────────────────────────────────────────────── */
export default function QuizzesPage() {
  const [enrollments,   setEnrollments]   = useState([])
  const [selectedId,    setSelectedId]    = useState(null)
  const [quizzes,       setQuizzes]       = useState([])
  const [attempts,      setAttempts]      = useState({})
  const [loading,       setLoading]       = useState(true)
  const [quizLoading,   setQuizLoading]   = useState(false)
  const [attemptModal,  setAttemptModal]  = useState(null)
  const [filter,        setFilter]        = useState('all')
  const [dropdownOpen,  setDropdownOpen]  = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    studentAPI.getEnrollments()
      .then(r => {
        const approved = (r.data.data?.enrollments || []).filter(e => e.is_approved)
        setEnrollments(approved)
        if (approved.length > 0) setSelectedId(approved[0].offering_id)
      })
      .catch(() => toast.error('Failed to load courses'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchQuizzes = useCallback(async () => {
    if (!selectedId) return
    setQuizLoading(true)
    try {
      const res    = await studentAPI.getOfferingQuizzes(selectedId)
      const qList  = res.data.data?.quizzes || []
      setQuizzes(qList)

      const attMap = {}
      await Promise.all(qList.map(async q => {
        try {
          const r = await studentAPI.getMyQuizAttempt(q.id)
          if (r.data.data) attMap[q.id] = r.data.data
        } catch { }
      }))
      setAttempts(attMap)
    } catch {
      toast.error('Failed to load quizzes')
    } finally {
      setQuizLoading(false)
    }
  }, [selectedId])

  useEffect(() => { fetchQuizzes() }, [selectedId, fetchQuizzes])

  const now = new Date()
  const totalCnt = quizzes.length
  const availableCnt = quizzes.filter(q => getQuizStatus(q, attempts[q.id]) === 'available').length
  const completedCnt = quizzes.filter(q => getQuizStatus(q, attempts[q.id]) === 'completed').length
  const upcomingCnt = quizzes.filter(q => getQuizStatus(q, attempts[q.id]) === 'upcoming').length

  const filtered = quizzes.filter(q => {
    const s = getQuizStatus(q, attempts[q.id])
    if (filter === 'available') return s === 'available'
    if (filter === 'completed') return s === 'completed'
    if (filter === 'upcoming') return s === 'upcoming'
    if (filter === 'expired') return s === 'expired'
    return true
  })

  const FILTERS = [
    { key: 'all', label: 'All', count: totalCnt, icon: BookOpen },
    { key: 'available', label: 'Available', count: availableCnt, icon: Zap },
    { key: 'completed', label: 'Completed', count: completedCnt, icon: Trophy },
    { key: 'upcoming', label: 'Upcoming', count: upcomingCnt, icon: Calendar },
  ]

  const selectedCourse = enrollments.find(e => e.offering_id === selectedId)

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '1rem 1rem 2rem' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }
        @keyframes pulse { 0%,100%{opacity:0.6} 50%{opacity:1} }
      `}</style>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <div style={{ ...neuInset({ padding: '1.5rem', borderRadius: '1.5rem' }), display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <Loader2 size={32} style={{ color: '#a78bfa', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ color: 'var(--neu-text-ghost)', fontSize: '0.85rem' }}>Loading your courses...</p>
          </div>
        </div>
      ) : enrollments.length === 0 ? (
        <div style={{ ...neu({ padding: '5rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }), textAlign: 'center' }}>
          <div style={{ ...neuInset({ width: 80, height: 80, borderRadius: '1.5rem' }), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa' }}>
            <BookOpen size={34} />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--neu-text-primary)' }}>No Active Courses</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--neu-text-ghost)' }}>You don't have any approved enrollments yet.</p>
        </div>
      ) : (
        <div style={{ animation: 'fadeUp 0.3s ease' }}>
          {/* Course Selector Dropdown */}
          {/* Header with Dropdown on Right */}
<div style={{  marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
  {/* Left side - Title */}
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
    <div style={{ ...neuInset({ width: 48, height: 48, borderRadius: '1rem' }), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa' }}>
      <PenSquare size={22} />
    </div>
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif' }}>Quizzes</h1>
      <p style={{ fontSize: '0.7rem', color: 'var(--neu-text-ghost)' }}>Test your knowledge and track your progress</p>
    </div>
  </div>

  {/* Right side - Course Dropdown */}
  <div ref={dropdownRef} style={{ position: 'relative', minWidth: 260 }}>
    <button
      onClick={() => setDropdownOpen(!dropdownOpen)}
      style={{
        ...neu({ padding: '0.7rem 1.25rem' }),
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        border: 'none',
        cursor: 'pointer',
        fontFamily: "'DM Sans',sans-serif",
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {selectedCourse && (
          <>
            
            <div style={{ textAlign: 'left' }}>
              <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--neu-text-primary)' }}>{selectedCourse.course_name}</p>
              <p style={{ fontSize: '0.65rem', color: 'var(--neu-text-ghost)' }}>{selectedCourse.course_code}</p>
            </div>
          </>
        )}
      </div>
      <ChevronDown size={16} style={{ color: 'var(--neu-text-ghost)', transition: 'transform 0.2s', transform: dropdownOpen ? 'rotate(180deg)' : 'none' }} />
    </button>

    {dropdownOpen && (
      <div style={{ ...neu({ padding: '0.5rem', marginTop: '0.5rem' }), position: 'absolute', top: '100%', right: 0, width: 280, zIndex: 20 }}>
        {enrollments.map((enr, idx) => {
          const active = enr.offering_id === selectedId
          const color = cc(idx)
          return (
            <button
              key={enr.offering_id}
              onClick={() => {
                setSelectedId(enr.offering_id)
                setDropdownOpen(false)
              }}
              style={{
                width: '100%',
                textAlign: 'left',
                border: 'none',
                cursor: 'pointer',
                padding: '0.6rem 0.8rem',
                borderRadius: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.7rem',
                background: active ? 'var(--neu-surface)' : 'transparent',
                boxShadow: active ? '6px 6px 14px var(--neu-shadow-dark), -3px -3px 9px var(--neu-shadow-light)' : 'none',
                marginBottom: idx !== enrollments.length - 1 ? '0.25rem' : 0
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--neu-surface-deep)' }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
            >
              
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '0.75rem', fontWeight: active ? 700 : 600, color: active ? 'var(--neu-text-primary)' : 'var(--neu-text-secondary)' }}>{enr.course_name}</p>
                <p style={{ fontSize: '0.6rem', color: 'var(--neu-text-ghost)' }}>{enr.course_code}</p>
              </div>
              {active && <ChevronRight size={12} style={{ color }} />}
            </button>
          )
        })}
      </div>
    )}
  </div>
</div>


          {quizLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
              <Loader2 size={28} style={{ color: '#a78bfa', animation: 'spin 0.8s linear infinite' }} />
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.85rem', marginBottom: '1.75rem' }}>
                {[
                  { label: 'Total Quizzes', value: totalCnt, color: '#a78bfa', icon: BookOpen },
                  { label: 'Available', value: availableCnt, color: '#5b8af0', icon: Zap },
                  { label: 'Completed', value: completedCnt, color: '#3ecf8e', icon: Trophy },
                  { label: 'Upcoming', value: upcomingCnt, color: '#f59e0b', icon: Calendar },
                ].map(({ label, value, color, icon: Icon }) => (
                  <div key={label} style={{ ...neuInset({ borderRadius: '1rem', padding: '0.9rem 1rem' }) }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <p style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</p>
                      <Icon size={16} style={{ color }} />
                    </div>
                    <p style={{ fontSize: '1.6rem', fontWeight: 900, color, fontFamily: 'Outfit,sans-serif', lineHeight: 1 }}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Filter Tabs */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                {FILTERS.map(f => {
                  const active = filter === f.key
                  const Icon = f.icon
                  return (
                    <button key={f.key} onClick={() => setFilter(f.key)}
                      style={{
                        padding: '0.45rem 1rem',
                        borderRadius: '0.85rem',
                        border: 'none',
                        cursor: 'pointer',
                        fontFamily: "'DM Sans',sans-serif",
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        transition: 'all 0.15s',
                        background: active ? 'var(--neu-surface)' : 'transparent',
                        color: active ? 'var(--neu-text-primary)' : 'var(--neu-text-ghost)',
                        boxShadow: active ? '5px 5px 12px var(--neu-shadow-dark), -3px -3px 8px var(--neu-shadow-light)' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.45rem'
                      }}
                    >
                      <Icon size={14} />
                      {f.label}
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '0.1rem 0.45rem',
                        borderRadius: '0.4rem',
                        background: active ? 'rgba(167,139,250,0.12)' : 'var(--neu-surface-deep)',
                        color: active ? '#a78bfa' : 'var(--neu-text-ghost)'
                      }}>
                        {f.count}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Quiz List */}
              {/* Quiz List - 3 Cards per row */}
{filtered.length === 0 ? (
  <div style={{ ...neu({ padding: '4rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }), textAlign: 'center' }}>
    <div style={{ ...neuInset({ width: 70, height: 70, borderRadius: '1.25rem' }), display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--neu-text-ghost)' }}>
      <PenSquare size={28} />
    </div>
    <p style={{ fontWeight: 700, color: 'var(--neu-text-secondary)', fontSize: '1rem' }}>
      {filter === 'all' ? 'No quizzes available yet' : `No ${filter} quizzes`}
    </p>
  </div>
) : (
  <div style={{ 
    display: 'grid', 
    gridTemplateColumns: 'repeat(3, 1fr)', 
    gap: '1rem'
  }}>
    {filtered.map((q, idx) => (
      <QuizCard
        key={q.id}
        quiz={q}
        attempt={attempts[q.id]}
        idx={idx}
        onAttempt={setAttemptModal}
      />
    ))}
  </div>
)}
            </>
          )}
        </div>
      )}

      {attemptModal && (
        <QuizAttemptModal
          quiz={attemptModal}
          onClose={() => setAttemptModal(null)}
          onSuccess={fetchQuizzes}
        />
      )}
    </div>
  )
}