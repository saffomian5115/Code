// ═══════════════════════════════════════════════════════════════
//  PracticeQuizPage.jsx  (Student)  —  Neumorphic
//  → frontend/src/pages/student/PracticeQuizPage.jsx
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect } from 'react'
import {
  Sparkles, Loader2, CheckCircle2, X, RefreshCw,
  BookOpen, ChevronDown, AlertTriangle, Trophy,
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
const iS = {
  width: '100%', background: 'var(--neu-surface-deep)',
  boxShadow: 'inset 3px 3px 7px var(--neu-shadow-dark), inset -2px -2px 5px var(--neu-shadow-light)',
  border: '1px solid var(--neu-border)', borderRadius: '0.75rem',
  padding: '0.65rem 0.9rem', fontSize: '0.85rem',
  color: 'var(--neu-text-primary)', outline: 'none',
  fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box',
  appearance: 'none',
}

const DIFF_CFG = {
  easy:   { color: '#3ecf8e', bg: 'rgba(62,207,142,0.12)',  label: 'Easy'   },
  medium: { color: '#5b8af0', bg: 'rgba(91,138,240,0.12)',  label: 'Medium' },
  hard:   { color: '#f87171', bg: 'rgba(248,113,113,0.12)', label: 'Hard'   },
}

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</label>
      {children}
    </div>
  )
}

/* ─── Result Screen ──────────────────────────────────────────── */
function ResultScreen({ result, topic, onReset }) {
  const score = parseFloat(result.score || 0)
  const color = score >= 80 ? '#3ecf8e' : score >= 50 ? '#5b8af0' : '#f87171'
  const emoji = score >= 80 ? '🏆' : score >= 50 ? '👍' : '📚'

  return (
    <div style={{ ...neu({ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', alignItems: 'center', textAlign: 'center' }) }}>
      {/* Trophy */}
      <div style={{ ...neuInset({ width: 72, height: 72, borderRadius: '1.25rem' }), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
        {emoji}
      </div>

      <div>
        <p style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit, sans-serif' }}>Quiz Complete!</p>
        <p style={{ fontSize: '0.78rem', color: 'var(--neu-text-ghost)', marginTop: '0.2rem' }}>AI Practice · {topic}</p>
      </div>

      {/* Score ring */}
      <div style={{ position: 'relative', width: 110, height: 110 }}>
        <svg width="110" height="110" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="55" cy="55" r="44" fill="none" stroke="var(--neu-border)" strokeWidth="8" />
          <circle cx="55" cy="55" r="44" fill="none" stroke={color} strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${(score / 100) * 2 * Math.PI * 44} ${2 * Math.PI * 44}`}
            style={{ transition: 'stroke-dasharray 1s ease' }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '1.6rem', fontWeight: 900, color, fontFamily: 'Outfit, sans-serif', lineHeight: 1 }}>{score.toFixed(0)}%</span>
          <span style={{ fontSize: '0.6rem', color: 'var(--neu-text-ghost)', fontWeight: 600, textTransform: 'uppercase' }}>Score</span>
        </div>
      </div>

      {/* Feedback */}
      {result.feedback && (
        <div style={{ ...neuInset({ padding: '0.9rem 1.1rem', borderRadius: '0.875rem', width: '100%', boxSizing: 'border-box' }), textAlign: 'left' }}>
          <p style={{ fontSize: '0.82rem', color: 'var(--neu-text-secondary)', lineHeight: 1.6 }}>{result.feedback}</p>
        </div>
      )}

      {/* Weak areas */}
      {result.weak_areas_identified?.length > 0 && (
        <div style={{ width: '100%', textAlign: 'left' }}>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <AlertTriangle size={12} /> Areas to Improve
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {result.weak_areas_identified.map((w, i) => (
              <span key={i} style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.25rem 0.65rem', borderRadius: '0.5rem', background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}>
                {w}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Reset button */}
      <button onClick={onReset}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 2rem',
          borderRadius: '0.875rem', border: 'none', cursor: 'pointer',
          background: 'linear-gradient(145deg, #5b8af0, #3a6bd4)',
          boxShadow: '5px 5px 14px var(--neu-shadow-dark), -3px -3px 8px var(--neu-shadow-light), 0 4px 16px rgba(91,138,240,0.35)',
          color: '#fff', fontWeight: 700, fontSize: '0.85rem', fontFamily: "'DM Sans', sans-serif",
        }}>
        <RefreshCw size={15} /> Generate New Quiz
      </button>
    </div>
  )
}

/* ─── Quiz Attempt Screen ────────────────────────────────────── */
function QuizAttempt({ quiz, form, answers, setAnswers, onSubmit, onCancel, loading }) {
  const questions = quiz?.questions_generated || []
  const answered  = Object.keys(answers).length
  const dc        = DIFF_CFG[form.difficulty] || DIFF_CFG.medium

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Header */}
      <div style={{ ...neu({ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }) }}>
        <div>
          <p style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--neu-text-primary)', fontFamily: 'Outfit, sans-serif' }}>
            AI Practice Quiz
          </p>
          <p style={{ fontSize: '0.72rem', color: 'var(--neu-text-ghost)', marginTop: '0.15rem' }}>
            {form.topic} · {questions.length} questions
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '0.25rem 0.65rem', borderRadius: '0.5rem', background: dc.bg, color: dc.color }}>
            {dc.label}
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--neu-text-ghost)' }}>
            {answered}/{questions.length} answered
          </span>
        </div>
      </div>

      {/* Questions */}
      {questions.map((q, qi) => {
        const opts = q.options || []
        return (
          <div key={qi} style={{ ...neu({ padding: '1.1rem 1.25rem' }) }}>
            <p style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--neu-text-primary)', marginBottom: '0.85rem', lineHeight: 1.5 }}>
              <span style={{ color: '#5b8af0', fontWeight: 900, marginRight: '0.35rem', fontFamily: 'Outfit, sans-serif' }}>Q{qi + 1}.</span>
              {q.question || q.question_text}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {opts.map((opt, oi) => {
                const selected = answers[qi] === opt
                return (
                  <button key={oi} onClick={() => setAnswers(p => ({ ...p, [qi]: opt }))}
                    style={{
                      width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer',
                      padding: '0.65rem 1rem', borderRadius: '0.75rem',
                      fontFamily: "'DM Sans', sans-serif", fontSize: '0.84rem',
                      display: 'flex', alignItems: 'center', gap: '0.65rem',
                      background: selected ? 'rgba(91,138,240,0.1)' : 'var(--neu-surface-deep)',
                      color: selected ? '#5b8af0' : 'var(--neu-text-secondary)',
                      boxShadow: selected
                        ? '4px 4px 10px var(--neu-shadow-dark), -2px -2px 6px var(--neu-shadow-light), inset 0 0 0 1.5px #5b8af0'
                        : 'inset 3px 3px 7px var(--neu-shadow-dark), inset -2px -2px 5px var(--neu-shadow-light)',
                      fontWeight: selected ? 700 : 400,
                      transition: 'all 0.15s',
                    }}>
                    <span style={{
                      width: 24, height: 24, borderRadius: '0.4rem', flexShrink: 0,
                      background: selected ? '#5b8af0' : 'var(--neu-surface)',
                      color: selected ? '#fff' : 'var(--neu-text-ghost)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.7rem', fontWeight: 800,
                      boxShadow: selected ? '0 2px 8px rgba(91,138,240,0.4)' : '2px 2px 5px var(--neu-shadow-dark), -1px -1px 3px var(--neu-shadow-light)',
                      transition: 'all 0.15s',
                    }}>
                      {String.fromCharCode(65 + oi)}
                    </span>
                    {opt}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Action row */}
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button onClick={onCancel}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.7rem 1.25rem',
            borderRadius: '0.875rem', border: 'none', cursor: 'pointer',
            background: 'var(--neu-surface)', color: 'var(--neu-text-muted)', fontWeight: 600, fontSize: '0.82rem',
            boxShadow: '4px 4px 10px var(--neu-shadow-dark), -2px -2px 6px var(--neu-shadow-light)',
            fontFamily: "'DM Sans', sans-serif",
          }}>
          <X size={14} /> Cancel
        </button>
        <button onClick={onSubmit}
          disabled={loading || answered < questions.length}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            padding: '0.7rem 1.25rem', borderRadius: '0.875rem', border: 'none',
            cursor: loading || answered < questions.length ? 'not-allowed' : 'pointer',
            background: answered === questions.length
              ? 'linear-gradient(145deg, #3ecf8e, #2eb87d)'
              : 'var(--neu-surface-deep)',
            color: answered === questions.length ? '#fff' : 'var(--neu-text-ghost)',
            fontWeight: 700, fontSize: '0.85rem',
            boxShadow: answered === questions.length
              ? '5px 5px 14px var(--neu-shadow-dark), -3px -3px 8px var(--neu-shadow-light), 0 4px 16px rgba(62,207,142,0.35)'
              : 'inset 3px 3px 7px var(--neu-shadow-dark), inset -2px -2px 5px var(--neu-shadow-light)',
            opacity: answered < questions.length ? 0.55 : 1,
            transition: 'all 0.18s',
            fontFamily: "'DM Sans', sans-serif",
          }}>
          {loading ? <Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite' }} /> : <CheckCircle2 size={15} />}
          {loading ? 'Submitting…' : `Submit Quiz (${answered}/${questions.length})`}
        </button>
      </div>
    </div>
  )
}

/* ─── Main Page ──────────────────────────────────────────────── */
export default function PracticeQuizPage() {
  const [enrollments, setEnrollments] = useState([])
  const [enrLoading, setEnrLoading]   = useState(true)
  const [form, setForm]               = useState({ course_id: '', topic: '', difficulty: 'medium', num_questions: 5 })
  const [quiz, setQuiz]               = useState(null)
  const [answers, setAnswers]         = useState({})
  const [result, setResult]           = useState(null)
  const [loading, setLoading]         = useState(false)
  const [phase, setPhase]             = useState('setup') // setup | attempt | result
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  useEffect(() => {
    studentAPI.getEnrollments()
      .then(r => setEnrollments((r.data.data?.enrollments || []).filter(e => e.is_approved)))
      .catch(() => toast.error('Failed to load courses'))
      .finally(() => setEnrLoading(false))
  }, [])

  const handleGenerate = async () => {
    if (!form.course_id || !form.topic.trim()) { toast.error('Select a course and enter a topic'); return }
    setLoading(true)
    try {
      const res = await studentAPI.generateAIQuiz(form)
      setQuiz(res.data.data)
      setAnswers({})
      setPhase('attempt')
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to generate quiz') }
    finally { setLoading(false) }
  }

  const handleSubmit = async () => {
    if (!quiz) return
    setLoading(true)
    try {
      const res = await studentAPI.submitAIQuiz({ ai_quiz_id: quiz.id, answers })
      setResult(res.data.data)
      setPhase('result')
    } catch (err) { toast.error(err.response?.data?.message || 'Submission failed') }
    finally { setLoading(false) }
  }

  const reset = () => { setQuiz(null); setAnswers({}); setResult(null); setPhase('setup') }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', paddingBottom: '2rem' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div style={{ ...neuInset({ width: 44, height: 44, borderRadius: '0.875rem' }), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa' }}>
          <Sparkles size={20} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit, sans-serif' }}>
            AI Practice Quiz
          </h1>
          <p style={{ fontSize: '0.78rem', color: 'var(--neu-text-ghost)' }}>Auto-generate MCQs for any topic using AI</p>
        </div>
      </div>

      {phase === 'result' && result && <ResultScreen result={result} topic={form.topic} onReset={reset} />}

      {phase === 'attempt' && quiz && (
        <QuizAttempt quiz={quiz} form={form} answers={answers} setAnswers={setAnswers} onSubmit={handleSubmit} onCancel={reset} loading={loading} />
      )}

      {phase === 'setup' && (
        <div style={{ ...neu({ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }) }}>
          {/* Icon header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--neu-border)' }}>
            <div style={{ ...neuInset({ width: 40, height: 40, borderRadius: '0.875rem' }), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa' }}>
              <Sparkles size={18} />
            </div>
            <div>
              <p style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--neu-text-primary)' }}>Generate a Quiz</p>
              <p style={{ fontSize: '0.72rem', color: 'var(--neu-text-ghost)' }}>Select your course and topic to get AI-generated MCQs</p>
            </div>
          </div>

          {/* Course */}
          <Field label="Course *">
            <div style={{ position: 'relative' }}>
              <select value={form.course_id} onChange={e => set('course_id', e.target.value)} style={iS} disabled={enrLoading}>
                <option value="">— Select Course —</option>
                {enrollments.map(e => <option key={e.course_id} value={e.course_id}>{e.course_name}</option>)}
              </select>
              <ChevronDown size={14} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--neu-text-ghost)', pointerEvents: 'none' }} />
            </div>
          </Field>

          {/* Topic */}
          <Field label="Topic *">
            <input
              value={form.topic}
              onChange={e => set('topic', e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleGenerate() }}
              placeholder="e.g. Object Oriented Programming, SQL Joins, React Hooks..."
              style={iS}
            />
          </Field>

          {/* Difficulty + Count */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <Field label="Difficulty">
              <div style={{ position: 'relative' }}>
                <select value={form.difficulty} onChange={e => set('difficulty', e.target.value)} style={iS}>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
                <ChevronDown size={14} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--neu-text-ghost)', pointerEvents: 'none' }} />
              </div>
            </Field>
            <Field label="Questions">
              <div style={{ position: 'relative' }}>
                <select value={form.num_questions} onChange={e => set('num_questions', parseInt(e.target.value))} style={iS}>
                  {[3, 5, 7, 10].map(n => <option key={n} value={n}>{n} Questions</option>)}
                </select>
                <ChevronDown size={14} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--neu-text-ghost)', pointerEvents: 'none' }} />
              </div>
            </Field>
          </div>

          {/* Difficulty badge preview */}
          {form.difficulty && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--neu-text-ghost)' }}>Selected:</span>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '0.2rem 0.6rem', borderRadius: '0.5rem', background: DIFF_CFG[form.difficulty]?.bg, color: DIFF_CFG[form.difficulty]?.color }}>
                {DIFF_CFG[form.difficulty]?.label} · {form.num_questions} Questions
              </span>
            </div>
          )}

          {/* Generate button */}
          <button onClick={handleGenerate}
            disabled={loading || !form.course_id || !form.topic.trim()}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.55rem',
              padding: '0.85rem', borderRadius: '0.875rem', border: 'none', marginTop: '0.25rem',
              cursor: loading || !form.course_id || !form.topic.trim() ? 'not-allowed' : 'pointer',
              background: form.course_id && form.topic.trim() && !loading
                ? 'linear-gradient(145deg, #a78bfa, #7c5cdb)'
                : 'var(--neu-surface-deep)',
              color: form.course_id && form.topic.trim() && !loading ? '#fff' : 'var(--neu-text-ghost)',
              fontWeight: 700, fontSize: '0.88rem', fontFamily: "'DM Sans', sans-serif",
              boxShadow: form.course_id && form.topic.trim() && !loading
                ? '5px 5px 14px var(--neu-shadow-dark), -3px -3px 8px var(--neu-shadow-light), 0 4px 20px rgba(167,139,250,0.4)'
                : 'inset 3px 3px 7px var(--neu-shadow-dark), inset -2px -2px 5px var(--neu-shadow-light)',
              opacity: (!form.course_id || !form.topic.trim()) && !loading ? 0.6 : 1,
              transition: 'all 0.18s',
            }}>
            {loading
              ? <><Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Generating…</>
              : <><Sparkles size={16} /> Generate Quiz with AI</>}
          </button>
        </div>
      )}
    </div>
  )
}