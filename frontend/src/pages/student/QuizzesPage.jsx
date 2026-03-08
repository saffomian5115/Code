// ═══════════════════════════════════════════════════════════════
//  QuizzesPage.jsx  (Student)  —  Neumorphic
//  → frontend/src/pages/student/QuizzesPage.jsx
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect, useCallback, useRef } from 'react'
import {
  PenSquare, Clock, CheckCircle2, AlertTriangle,
  Loader2, X, ChevronRight, Award, ChevronLeft,
  Lock, Play, RotateCcw, Zap,
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
   QUIZ ATTEMPT MODAL
══════════════════════════════════════════════════════════════ */
function QuizAttemptModal({ quiz, onClose, onSuccess }) {
  const [questions,  setQuestions]  = useState([])
  const [answers,    setAnswers]    = useState({})   // { question_id: answer }
  const [currentQ,   setCurrentQ]   = useState(0)
  const [timeLeft,   setTimeLeft]   = useState(null)
  const [phase,      setPhase]      = useState('loading') // loading | attempt | result
  const [result,     setResult]     = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const timerRef = useRef(null)

  /* Start attempt */
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
          // Load existing result
          studentAPI.getMyQuizAttempt(quiz.id)
            .then(r => { setResult(r.data.data); setPhase('result') })
            .catch(() => onClose())
        } else {
          onClose()
        }
      })
  }, [])

  /* Countdown timer */
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
  const timerColor = isUrgent ? '#f26b6b' : timeLeft < 300 ? '#f59e0b' : '#3ecf8e'
  const pct      = total > 0 ? (answered / total) * 100 : 0

  /* ── Loading screen ── */
  if (phase === 'loading') return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ ...neu({ padding: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }) }}>
        <div style={{ ...neuInset({ width: 60, height: 60, borderRadius: '1rem' }), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Loader2 size={26} style={{ color: '#5b8af0', animation: 'spin 0.8s linear infinite' }} />
        </div>
        <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--neu-text-primary)' }}>Starting quiz…</p>
      </div>
    </div>
  )

  /* ── Result screen ── */
  if (phase === 'result') {
    const score      = result?.score ?? result?.percentage ?? 0
    const obtained   = result?.obtained_marks ?? result?.correct_answers ?? 0
    const totalMarks = result?.total_marks ?? quiz.total_marks ?? total
    const passed     = score >= 50
    const scoreColor = score >= 75 ? '#3ecf8e' : score >= 50 ? '#f59e0b' : '#f26b6b'

    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
        <div style={{ ...neu({ padding: 0, overflow: 'hidden', width: '100%', maxWidth: 460 }), animation: 'fadeUp 0.25s ease' }}>

          {/* Colored top banner */}
          <div style={{ height: 6, background: `linear-gradient(90deg, ${scoreColor}, ${scoreColor}66)` }} />

          <div style={{ padding: '2rem 1.75rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
            {/* Score ring */}
            <div style={{ position: 'relative' }}>
              <svg width={130} height={130} style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={65} cy={65} r={55} fill="none" stroke="var(--neu-border)" strokeWidth={10} />
                <circle cx={65} cy={65} r={55} fill="none" stroke={scoreColor} strokeWidth={10}
                  strokeDasharray={`${(score / 100) * 2 * Math.PI * 55} ${2 * Math.PI * 55}`}
                  strokeLinecap="round" style={{ transition: 'stroke-dasharray 1s cubic-bezier(0.34,1.56,0.64,1)' }} />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '1.8rem', fontWeight: 900, color: scoreColor, fontFamily: 'Outfit,sans-serif', lineHeight: 1 }}>
                  {Math.round(score)}%
                </span>
                <span style={{ fontSize: '0.62rem', color: 'var(--neu-text-ghost)', fontWeight: 600 }}>score</span>
              </div>
            </div>

            {/* Title */}
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', marginBottom: '0.25rem' }}>
                {passed ? '🎉 Well done!' : '📚 Keep practicing!'}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--neu-text-ghost)' }}>{quiz.title}</p>
            </div>

            {/* Stats chips */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.65rem', width: '100%' }}>
              {[
                { label: 'Score',    value: `${obtained}/${totalMarks}`, color: scoreColor    },
                { label: 'Questions',value: total,                       color: '#5b8af0'     },
                { label: 'Status',   value: passed ? 'Passed' : 'Failed', color: scoreColor  },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ ...neuInset({ borderRadius: '0.875rem', padding: '0.7rem 0.8rem', textAlign: 'center' }) }}>
                  <p style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.2rem' }}>{label}</p>
                  <p style={{ fontSize: '1rem', fontWeight: 900, color, fontFamily: 'Outfit,sans-serif' }}>{value}</p>
                </div>
              ))}
            </div>

            {/* Feedback */}
            {result?.feedback && (
              <div style={{ ...neuInset({ borderRadius: '0.875rem', padding: '0.85rem 1rem', width: '100%' }), display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <Award size={14} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 2 }} />
                <p style={{ fontSize: '0.78rem', color: 'var(--neu-text-muted)', lineHeight: 1.55 }}>{result.feedback}</p>
              </div>
            )}

            {/* Close button */}
            <button onClick={onClose}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '0.875rem', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: '0.9rem', color: '#fff', background: `linear-gradient(135deg,${scoreColor},${scoreColor}bb)`, boxShadow: `4px 4px 12px ${scoreColor}40, -2px -2px 6px var(--neu-shadow-light)`, transition: 'transform 0.12s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseLeave={e => e.currentTarget.style.transform = ''}>
              Done
            </button>
          </div>
        </div>
      </div>
    )
  }

  /* ── Attempt screen ── */
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ ...neu({ padding: 0, overflow: 'hidden', width: '100%', maxWidth: 620, maxHeight: '92vh', display: 'flex', flexDirection: 'column' }), animation: 'fadeUp 0.2s ease' }}>

        {/* ── Header ── */}
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--neu-border)', display: 'flex', alignItems: 'center', gap: '0.85rem', flexShrink: 0 }}>
          {/* Timer */}
          <div style={{ ...neuInset({ borderRadius: '0.875rem', padding: '0.45rem 0.85rem' }), display: 'flex', alignItems: 'center', gap: '0.45rem', flexShrink: 0 }}>
            <Clock size={14} style={{ color: timerColor }} />
            <span style={{ fontSize: '0.95rem', fontWeight: 900, color: timerColor, fontFamily: 'Outfit,sans-serif', letterSpacing: '0.05em', animation: isUrgent ? 'pulse 1s ease-in-out infinite' : 'none' }}>
              {fmtTimer(timeLeft)}
            </span>
          </div>

          {/* Title */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{quiz.title}</p>
            <p style={{ fontSize: '0.68rem', color: 'var(--neu-text-ghost)' }}>Q{currentQ + 1} of {total} · {answered} answered</p>
          </div>

          {/* Close */}
          <button onClick={onClose} style={{ ...neuInset({ width: 32, height: 32, borderRadius: '0.65rem' }), display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', color: 'var(--neu-text-ghost)', flexShrink: 0 }}>
            <X size={15} />
          </button>
        </div>

        {/* Progress bar */}
        <div style={{ height: 4, background: 'var(--neu-surface-deep)', flexShrink: 0 }}>
          <div style={{ height: '100%', background: `linear-gradient(90deg,#5b8af0,#a78bfa)`, width: `${pct}%`, transition: 'width 0.3s ease', boxShadow: '0 0 8px rgba(91,138,240,0.5)' }} />
        </div>

        {/* ── Question area ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
          {q ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Question text */}
              <div style={{ ...neuInset({ borderRadius: '1rem', padding: '1rem 1.1rem' }) }}>
                <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '0.2rem 0.55rem', borderRadius: '0.5rem', background: 'rgba(91,138,240,0.15)', color: '#5b8af0', flexShrink: 0, marginTop: 1 }}>
                    Q{currentQ + 1}
                  </span>
                  <p style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--neu-text-primary)', lineHeight: 1.55 }}>
                    {q.question_text || q.question}
                  </p>
                </div>
                {q.marks && (
                  <p style={{ fontSize: '0.65rem', color: 'var(--neu-text-ghost)', marginTop: '0.4rem', paddingLeft: '2.5rem' }}>
                    {q.marks} mark{q.marks !== 1 ? 's' : ''}
                  </p>
                )}
              </div>

              {/* Options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {/* MCQ */}
                {(q.question_type === 'mcq' || q.options?.length > 0) &&
                  (q.options || []).map((opt, i) => {
                    const isSelected = answers[q.id] === opt
                    return (
                      <button key={i} onClick={() => setAnswers(p => ({ ...p, [q.id]: opt }))}
                        style={{
                          width: '100%', textAlign: 'left', padding: '0.85rem 1rem',
                          borderRadius: '0.875rem', border: 'none', cursor: 'pointer',
                          fontFamily: "'DM Sans',sans-serif", fontSize: '0.85rem',
                          display: 'flex', alignItems: 'center', gap: '0.75rem',
                          transition: 'all 0.15s',
                          background: isSelected ? 'var(--neu-surface)' : 'var(--neu-surface-deep)',
                          color: isSelected ? '#5b8af0' : 'var(--neu-text-secondary)',
                          fontWeight: isSelected ? 700 : 500,
                          boxShadow: isSelected
                            ? '5px 5px 12px var(--neu-shadow-dark), -3px -3px 8px var(--neu-shadow-light), 0 0 0 2px rgba(91,138,240,0.35)'
                            : 'inset 3px 3px 8px var(--neu-shadow-dark), inset -2px -2px 5px var(--neu-shadow-light)',
                        }}
                        onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--neu-surface)' }}
                        onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'var(--neu-surface-deep)' }}
                      >
                        <span style={{ width: 28, height: 28, borderRadius: '0.55rem', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, background: isSelected ? 'rgba(91,138,240,0.15)' : 'var(--neu-surface)', color: isSelected ? '#5b8af0' : 'var(--neu-text-ghost)', boxShadow: isSelected ? 'none' : 'inset 2px 2px 4px var(--neu-shadow-dark), inset -1px -1px 3px var(--neu-shadow-light)' }}>
                          {String.fromCharCode(65 + i)}
                        </span>
                        {opt}
                        {isSelected && <CheckCircle2 size={15} style={{ marginLeft: 'auto', color: '#5b8af0', flexShrink: 0 }} />}
                      </button>
                    )
                  })
                }

                {/* True/False */}
                {q.question_type === 'true_false' &&
                  ['True', 'False'].map(v => {
                    const isSelected = answers[q.id] === v
                    const col = v === 'True' ? '#3ecf8e' : '#f26b6b'
                    return (
                      <button key={v} onClick={() => setAnswers(p => ({ ...p, [q.id]: v }))}
                        style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '0.875rem', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", fontSize: '0.85rem', fontWeight: 700, transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '0.6rem', background: isSelected ? `${col}18` : 'var(--neu-surface-deep)', color: isSelected ? col : 'var(--neu-text-secondary)', boxShadow: isSelected ? `0 0 0 2px ${col}55, 4px 4px 10px var(--neu-shadow-dark), -2px -2px 6px var(--neu-shadow-light)` : 'inset 3px 3px 8px var(--neu-shadow-dark), inset -2px -2px 5px var(--neu-shadow-light)' }}>
                        <span style={{ fontSize: '1rem' }}>{v === 'True' ? '✓' : '✗'}</span>
                        {v}
                        {isSelected && <CheckCircle2 size={14} style={{ marginLeft: 'auto', color: col }} />}
                      </button>
                    )
                  })
                }

                {/* Short answer */}
                {q.question_type === 'short' && (
                  <textarea rows={3} value={answers[q.id] || ''} onChange={e => setAnswers(p => ({ ...p, [q.id]: e.target.value }))}
                    style={{ width: '100%', ...neuInset({ borderRadius: '0.875rem', padding: '0.75rem 0.9rem' }), fontSize: '0.85rem', color: 'var(--neu-text-primary)', outline: 'none', fontFamily: "'DM Sans',sans-serif", resize: 'none', boxSizing: 'border-box' }}
                    placeholder="Type your answer here…" />
                )}
              </div>
            </div>
          ) : (
            <p style={{ textAlign: 'center', color: 'var(--neu-text-ghost)', padding: '2rem' }}>No questions found</p>
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{ padding: '0.9rem 1.25rem', borderTop: '1px solid var(--neu-border)', display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
          {/* Question dots */}
          <div style={{ flex: 1, display: 'flex', gap: '4px', flexWrap: 'wrap', overflowY: 'hidden', maxHeight: 36 }}>
            {questions.map((qitem, i) => {
              const isAns = !!answers[qitem.id]
              const isCur = i === currentQ
              return (
                <button key={i} onClick={() => setCurrentQ(i)}
                  style={{ width: 28, height: 28, borderRadius: '0.5rem', border: 'none', cursor: 'pointer', fontSize: '0.68rem', fontWeight: 800, fontFamily: 'Outfit,sans-serif', transition: 'all 0.15s', background: isCur ? '#5b8af0' : isAns ? '#3ecf8e' : 'var(--neu-surface-deep)', color: (isCur || isAns) ? '#fff' : 'var(--neu-text-ghost)', boxShadow: isCur ? '3px 3px 8px var(--neu-shadow-dark), -2px -2px 5px var(--neu-shadow-light), 0 2px 8px rgba(91,138,240,0.4)' : 'inset 2px 2px 4px var(--neu-shadow-dark), inset -1px -1px 3px var(--neu-shadow-light)' }}>
                  {i + 1}
                </button>
              )
            })}
          </div>

          {/* Nav buttons */}
          <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
            {currentQ > 0 && (
              <button onClick={() => setCurrentQ(c => c - 1)}
                style={{ ...neuInset({ padding: '0.5rem 0.9rem', borderRadius: '0.75rem' }), border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', fontWeight: 700, color: 'var(--neu-text-secondary)', fontFamily: "'DM Sans',sans-serif" }}>
                <ChevronLeft size={14} /> Prev
              </button>
            )}
            {currentQ < total - 1 ? (
              <button onClick={() => setCurrentQ(c => c + 1)}
                style={{ padding: '0.5rem 0.9rem', borderRadius: '0.75rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', fontWeight: 700, color: '#fff', fontFamily: "'DM Sans',sans-serif", background: 'linear-gradient(135deg,#5b8af0,#3a6bd4)', boxShadow: '3px 3px 9px var(--neu-shadow-dark), -2px -2px 5px var(--neu-shadow-light), 0 2px 8px rgba(91,138,240,0.35)', transition: 'transform 0.12s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
                onMouseLeave={e => e.currentTarget.style.transform = ''}>
                Next <ChevronRight size={14} />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={submitting}
                style={{ padding: '0.5rem 1.1rem', borderRadius: '0.75rem', border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', fontWeight: 700, color: '#fff', fontFamily: "'DM Sans',sans-serif", background: submitting ? 'var(--neu-surface-deep)' : 'linear-gradient(135deg,#3ecf8e,#2eb87d)', boxShadow: submitting ? 'none' : '3px 3px 9px var(--neu-shadow-dark), -2px -2px 5px var(--neu-shadow-light), 0 2px 8px rgba(62,207,142,0.35)', opacity: submitting ? 0.6 : 1, transition: 'transform 0.12s' }}
                onMouseEnter={e => { if (!submitting) e.currentTarget.style.transform = 'scale(1.04)' }}
                onMouseLeave={e => e.currentTarget.style.transform = ''}>
                {submitting
                  ? <><Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} /> Submitting…</>
                  : <><CheckCircle2 size={13} /> Submit Quiz</>
                }
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Quiz Card ──────────────────────────────────────────────── */
function QuizCard({ quiz, attempt, idx, onAttempt }) {
  const [hov, setHov] = useState(false)
  const status = getQuizStatus(quiz, attempt)

  const STATUS_CFG = {
    available:  { color: '#5b8af0', bg: 'rgba(91,138,240,0.13)',  label: 'Available',  icon: Play      },
    completed:  { color: '#3ecf8e', bg: 'rgba(62,207,142,0.13)',  label: 'Completed',  icon: CheckCircle2 },
    upcoming:   { color: '#f59e0b', bg: 'rgba(245,159,11,0.13)',  label: 'Upcoming',   icon: Clock     },
    expired:    { color: '#94a3b8', bg: 'rgba(148,163,184,0.13)', label: 'Expired',    icon: Lock      },
  }
  const st  = STATUS_CFG[status]
  const ac  = st.color
  const StatusIcon = st.icon

  const score    = attempt?.score ?? attempt?.percentage
  const obtained = attempt?.obtained_marks
  const canAttempt = status === 'available'

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ ...neu({ padding: 0, overflow: 'hidden', position: 'relative' }), transition: 'transform 0.22s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s', transform: hov ? 'translateY(-3px)' : '', boxShadow: hov ? `12px 12px 28px var(--neu-shadow-dark), -6px -6px 16px var(--neu-shadow-light), 0 0 0 1.5px ${ac}22` : 'var(--neu-raised)', animation: 'fadeUp 0.28s ease both', animationDelay: idx * 0.07 + 's' }}
    >
      {/* Left accent bar */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: `linear-gradient(180deg,${ac},${ac}55)`, borderRadius: '1.25rem 0 0 1.25rem' }} />

      <div style={{ padding: '1.1rem 1.15rem 1.05rem 1.35rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

        {/* Top row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
          <div style={{ ...neuInset({ width: 44, height: 44, borderRadius: '0.875rem' }), display: 'flex', alignItems: 'center', justifyContent: 'center', color: ac, flexShrink: 0 }}>
            <StatusIcon size={19} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.2rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', lineHeight: 1.3 }}>{quiz.title}</h3>
              {quiz.is_mandatory && (
                <span style={{ fontSize: '0.6rem', fontWeight: 800, padding: '0.1rem 0.45rem', borderRadius: '0.4rem', background: 'rgba(242,107,107,0.12)', color: '#f26b6b', border: '1px solid rgba(242,107,107,0.25)' }}>Mandatory</span>
              )}
            </div>
            {quiz.description && (
              <p style={{ fontSize: '0.75rem', color: 'var(--neu-text-ghost)', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{quiz.description}</p>
            )}
          </div>
          {/* Status badge */}
          <span style={{ fontSize: '0.63rem', fontWeight: 800, padding: '0.22rem 0.6rem', borderRadius: '0.45rem', background: st.bg, color: ac, flexShrink: 0, border: `1px solid ${ac}30`, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <StatusIcon size={10} /> {st.label}
          </span>
        </div>

        {/* Meta row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          {quiz.time_limit_minutes && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--neu-text-ghost)' }}>
              <Clock size={12} />
              <span style={{ fontSize: '0.72rem' }}>{quiz.time_limit_minutes} min</span>
            </div>
          )}
          {quiz.total_marks && (
            <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.1rem 0.5rem', borderRadius: '0.4rem', background: 'var(--neu-surface-deep)', color: 'var(--neu-text-ghost)', boxShadow: 'inset 2px 2px 4px var(--neu-shadow-dark), inset -1px -1px 3px var(--neu-shadow-light)' }}>
              {quiz.total_marks} marks
            </span>
          )}
          {quiz.start_time && (
            <span style={{ fontSize: '0.7rem', color: 'var(--neu-text-ghost)' }}>Opens: {fmtDT(quiz.start_time)}</span>
          )}
          {quiz.end_time && (
            <span style={{ fontSize: '0.7rem', color: status === 'expired' ? '#f26b6b' : 'var(--neu-text-ghost)' }}>
              {status === 'expired' ? '⛔' : '⏰'} Closes: {fmtDT(quiz.end_time)}
            </span>
          )}
        </div>

        {/* Score bar (if completed) */}
        {status === 'completed' && score !== undefined && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
              <span style={{ fontSize: '0.68rem', color: 'var(--neu-text-ghost)', fontWeight: 600 }}>Your Score</span>
              <span style={{ fontSize: '0.68rem', fontWeight: 800, color: score >= 75 ? '#3ecf8e' : score >= 50 ? '#f59e0b' : '#f26b6b' }}>
                {obtained !== undefined ? `${obtained}/${quiz.total_marks} · ` : ''}{Math.round(score)}%
              </span>
            </div>
            <div style={{ ...neuInset({ height: 8, borderRadius: 4, padding: 2 }) }}>
              <div style={{ height: '100%', borderRadius: 4, background: score >= 75 ? 'linear-gradient(90deg,#3ecf8e,#2eb87d)' : score >= 50 ? 'linear-gradient(90deg,#f59e0b,#e08c0f)' : 'linear-gradient(90deg,#f26b6b,#e05555)', width: `${Math.min(100, score)}%`, transition: 'width 0.6s cubic-bezier(0.34,1.56,0.64,1)', boxShadow: `0 1px 4px ${score >= 50 ? '#3ecf8e' : '#f26b6b'}40` }} />
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          {canAttempt ? (
            <button onClick={() => onAttempt(quiz)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 1.1rem', borderRadius: '0.65rem', border: 'none', background: 'linear-gradient(135deg,#5b8af0,#3a6bd4)', color: '#fff', fontSize: '0.75rem', fontWeight: 700, fontFamily: "'DM Sans',sans-serif", cursor: 'pointer', boxShadow: '4px 4px 10px var(--neu-shadow-dark), -2px -2px 6px var(--neu-shadow-light), 0 3px 10px rgba(91,138,240,0.35)', transition: 'transform 0.13s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
              onMouseLeave={e => e.currentTarget.style.transform = ''}>
              <Zap size={13} /> Start Quiz
            </button>
          ) : status === 'completed' ? (
            <span style={{ fontSize: '0.7rem', color: 'var(--neu-text-ghost)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <CheckCircle2 size={13} style={{ color: '#3ecf8e' }} /> Completed
            </span>
          ) : status === 'upcoming' ? (
            <span style={{ fontSize: '0.7rem', color: '#f59e0b', fontWeight: 600 }}>Not yet available</span>
          ) : (
            <span style={{ fontSize: '0.7rem', color: 'var(--neu-text-ghost)' }}>Quiz closed</span>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Main Page ──────────────────────────────────────────────── */
export default function QuizzesPage() {
  const [enrollments,   setEnrollments]   = useState([])
  const [selectedIdx,   setSelectedIdx]   = useState(0)
  const [quizzes,       setQuizzes]       = useState([])
  const [attempts,      setAttempts]      = useState({})   // { quiz_id: attempt }
  const [loading,       setLoading]       = useState(true)
  const [quizLoading,   setQuizLoading]   = useState(false)
  const [attemptModal,  setAttemptModal]  = useState(null) // quiz object
  const [filter,        setFilter]        = useState('all')

  /* Load enrollments */
  useEffect(() => {
    studentAPI.getEnrollments()
      .then(r => setEnrollments((r.data.data?.enrollments || []).filter(e => e.is_approved)))
      .catch(() => toast.error('Failed to load courses'))
      .finally(() => setLoading(false))
  }, [])

  /* Load quizzes + attempts for selected course */
  const fetchQuizzes = useCallback(async () => {
    const enr = enrollments[selectedIdx]
    if (!enr) return
    setQuizLoading(true)
    try {
      const res    = await studentAPI.getOfferingQuizzes(enr.offering_id)
      const qList  = res.data.data?.quizzes || []
      setQuizzes(qList)

      const attMap = {}
      await Promise.all(qList.map(async q => {
        try {
          const r = await studentAPI.getMyQuizAttempt(q.id)
          if (r.data.data) attMap[q.id] = r.data.data
        } catch { /* not attempted */ }
      }))
      setAttempts(attMap)
    } catch {
      toast.error('Failed to load quizzes')
    } finally {
      setQuizLoading(false)
    }
  }, [selectedIdx, enrollments])

  useEffect(() => { fetchQuizzes() }, [selectedIdx, enrollments])

  /* Derived counts */
  const now          = new Date()
  const totalCnt     = quizzes.length
  const availableCnt = quizzes.filter(q => getQuizStatus(q, attempts[q.id]) === 'available').length
  const completedCnt = quizzes.filter(q => getQuizStatus(q, attempts[q.id]) === 'completed').length
  const upcomingCnt  = quizzes.filter(q => getQuizStatus(q, attempts[q.id]) === 'upcoming').length

  const filtered = quizzes.filter(q => {
    const s = getQuizStatus(q, attempts[q.id])
    if (filter === 'available')  return s === 'available'
    if (filter === 'completed')  return s === 'completed'
    if (filter === 'upcoming')   return s === 'upcoming'
    if (filter === 'expired')    return s === 'expired'
    return true
  })

  const FILTERS = [
    { key: 'all',       label: 'All',       count: totalCnt     },
    { key: 'available', label: 'Available', count: availableCnt },
    { key: 'completed', label: 'Completed', count: completedCnt },
    { key: 'upcoming',  label: 'Upcoming',  count: upcomingCnt  },
  ]

  const selectedEnr = enrollments[selectedIdx]

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: '2rem' }}>
      <style>{`
        @keyframes spin   { to { transform: rotate(360deg) } }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
        @keyframes pulse  { 0%,100%{opacity:.6} 50%{opacity:1} }
      `}</style>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '6rem' }}>
          <Loader2 size={30} style={{ color: '#a78bfa', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : enrollments.length === 0 ? (
        <div style={{ ...neu({ padding: '5rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.85rem' }) }}>
          <div style={{ ...neuInset({ width: 64, height: 64, borderRadius: '1.25rem' }), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa' }}>
            <PenSquare size={28} />
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
                  <div style={{ width: 34, height: 34, borderRadius: '0.65rem', flexShrink: 0, background: active ? color : color + '20', color: active ? '#fff' : color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem', fontWeight: 900, fontFamily: 'Outfit,sans-serif', transition: 'all 0.18s', boxShadow: active ? `4px 4px 10px var(--neu-shadow-dark), -2px -2px 6px var(--neu-shadow-light), 0 3px 9px ${color}44` : 'inset 2px 2px 4px var(--neu-shadow-dark), inset -1px -1px 3px var(--neu-shadow-light)' }}>
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

            {/* Page title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ ...neuInset({ width: 44, height: 44, borderRadius: '0.875rem' }), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa' }}>
                <PenSquare size={20} />
              </div>
              <div>
                <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', lineHeight: 1.2 }}>
                  {selectedEnr?.course_name || 'Quizzes'}
                </h1>
                <p style={{ fontSize: '0.73rem', color: 'var(--neu-text-ghost)' }}>
                  {selectedEnr?.course_code}{selectedEnr?.instructor ? ` · ${selectedEnr.instructor}` : ''}
                </p>
              </div>
            </div>

            {quizLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                <Loader2 size={26} style={{ color: '#a78bfa', animation: 'spin 0.8s linear infinite' }} />
              </div>
            ) : (
              <>
                {/* KPI chips */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                  {[
                    { label: 'Total',     value: totalCnt,     color: 'var(--neu-text-primary)' },
                    { label: 'Available', value: availableCnt, color: availableCnt > 0 ? '#5b8af0' : 'var(--neu-text-ghost)' },
                    { label: 'Completed', value: completedCnt, color: '#3ecf8e' },
                    { label: 'Upcoming',  value: upcomingCnt,  color: upcomingCnt > 0 ? '#f59e0b' : 'var(--neu-text-ghost)' },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ ...neuInset({ borderRadius: '0.875rem', padding: '0.8rem 1rem' }), display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <p style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</p>
                      <p style={{ fontSize: '1.4rem', fontWeight: 900, color, fontFamily: 'Outfit,sans-serif', lineHeight: 1 }}>{value}</p>
                    </div>
                  ))}
                </div>

                {/* Filter tabs */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {FILTERS.map(f => {
                    const active = filter === f.key
                    return (
                      <button key={f.key} onClick={() => setFilter(f.key)}
                        style={{ padding: '0.38rem 0.9rem', borderRadius: '0.65rem', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", fontSize: '0.76rem', fontWeight: 700, transition: 'all 0.15s', background: active ? 'var(--neu-surface)' : 'transparent', color: active ? 'var(--neu-text-primary)' : 'var(--neu-text-ghost)', boxShadow: active ? '5px 5px 12px var(--neu-shadow-dark), -3px -3px 8px var(--neu-shadow-light)' : 'none', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        {f.label}
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '0.08rem 0.4rem', borderRadius: '0.35rem', background: active ? 'rgba(167,139,250,0.15)' : 'var(--neu-surface-deep)', color: active ? '#a78bfa' : 'var(--neu-text-ghost)' }}>
                          {f.count}
                        </span>
                      </button>
                    )
                  })}
                </div>

                {/* Quiz list */}
                {filtered.length === 0 ? (
                  <div style={{ ...neu({ padding: '4rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.85rem' }) }}>
                    <div style={{ ...neuInset({ width: 60, height: 60, borderRadius: '1.1rem' }), display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--neu-text-ghost)' }}>
                      <PenSquare size={26} />
                    </div>
                    <p style={{ fontWeight: 700, color: 'var(--neu-text-secondary)', fontSize: '0.95rem' }}>
                      {filter === 'all' ? 'No quizzes yet' : `No ${filter} quizzes`}
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
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
        </div>
      )}

      {/* Quiz Attempt Modal */}
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