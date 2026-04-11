// ═══════════════════════════════════════════════════════════════
//  QuizzesPage.jsx  —  Teacher Quizzes (Fully Fixed + Working)
//  Replace: frontend/src/pages/teacher/QuizzesPage.jsx
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react'
import {
  Plus, PenSquare, Loader2,
  Calendar, Clock, Users, Award, X,
  BarChart2, Hash, CheckCircle, AlertCircle,
  Trash2, Eye, ChevronDown, ChevronUp,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { teacherAPI } from '../../api/teacher.api'
import { useContextMenu, ContextMenu } from '../../hooks/useContextMenu'
import api from '../../api/axios'
import AddButton from '../../components/ui/AddButton'


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

const formatDate = (d) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })
}
const formatDateTime = (d) => {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-PK', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function Field({ label, children, wide }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', ...(wide ? { gridColumn: 'span 2' } : {}) }}>
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
      onMouseEnter={e => { if (!disabled && !isLoading) e.currentTarget.style.transform = 'translateY(-1px)' }}
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
      <div style={{ ...neu({ borderRadius: '1.5rem' }), width: '100%', maxWidth: wide ? 820 : 580, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: 'var(--neu-raised-lg)' }}>
        {children}
      </div>
    </div>
  )
}

// ── Ring SVG Chart ────────────────────────────────────────────
function RingChart({ value, total, size = 52, label }) {
  const r = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const pct = total > 0 ? Math.min(value / total, 1) : 0
  const dash = pct * circ
  const color = pct >= 0.8 ? '#3ecf8e' : pct >= 0.5 ? '#f5a623' : '#5b8af0'

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--neu-surface-deep)" strokeWidth={6} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={6}
          strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.5s ease' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 800, color, fontFamily: 'Outfit,sans-serif', lineHeight: 1 }}>{value}</span>
        <span style={{ fontSize: '0.55rem', color: 'var(--neu-text-ghost)', lineHeight: 1 }}>/{total}</span>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════
// CREATE QUIZ MODAL — with questions builder
// Backend expects: title, description, total_marks, time_limit_minutes,
//                  start_time, end_time, is_mandatory, shuffle_questions, questions[]
// ════════════════════════════════════════════════════════
const EMPTY_QUESTION = () => ({
  question_text: '', question_type: 'mcq', options: ['', '', '', ''],
  correct_answer: '', marks: 1, difficulty: 'medium',
})

function CreateQuizModal({ offeringId, onClose, onSuccess }) {
  const [form, setForm] = useState({
    title: '', description: '',
    total_marks: 20,
    time_limit_minutes: 30,
    start_time: '',
    end_time: '',
    is_mandatory: true,
    shuffle_questions: false,
  })
  const [questions, setQuestions] = useState([EMPTY_QUESTION()])
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1) // 1 = details, 2 = questions
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const [showAIGen, setShowAIGen] = useState(false)


  const addQuestion = () => setQuestions(p => [...p, EMPTY_QUESTION()])
  const removeQuestion = (i) => setQuestions(p => p.filter((_, idx) => idx !== i))
  const updateQ = (i, k, v) => setQuestions(p => { const q = [...p]; q[i] = { ...q[i], [k]: v }; return q })
  const updateOption = (qi, oi, v) => setQuestions(p => {
    const q = [...p]; const opts = [...q[qi].options]; opts[oi] = v; q[qi] = { ...q[qi], options: opts }; return q
  })

  // Auto-calculate total_marks from questions
  const calcTotal = () => questions.reduce((s, q) => s + (parseInt(q.marks) || 1), 0)

  const handleAIQuestions = (aiQuestions, formData) => {
  // Convert AI format → quiz question format
  const converted = aiQuestions.map(q => ({
    question_text: q.question || q.question_text || '',
    question_type: 'mcq',
    options: q.options || ['', '', '', ''],
    correct_answer: q.correct_answer || '',
    marks: 1,
    difficulty: formData.difficulty === 'mixed' ? 'medium' : formData.difficulty,
  }))
  setQuestions(converted)
  setStep(2)  // Jump to questions review step
  toast.success(`${converted.length} AI questions generated! Review and edit before saving.`)
}

  const handleSubmit = async () => {
    if (!form.title.trim()) { toast.error('Title required'); return }
    if (questions.some(q => !q.question_text.trim())) { toast.error('All questions need text'); return }
    if (questions.some(q => !q.correct_answer.trim())) { toast.error('All questions need correct answer'); return }

    setLoading(true)
    try {
      const payload = {
        ...form,
        total_marks: calcTotal(),
        offering_id: parseInt(offeringId),
        questions: questions.map(q => ({
          question_text: q.question_text,
          question_type: q.question_type,
          options: q.question_type === 'mcq' ? q.options.filter(o => o.trim()) : [],
          correct_answer: q.correct_answer,
          marks: parseInt(q.marks) || 1,
          difficulty: q.difficulty,
        })),
      }
      if (!payload.start_time) delete payload.start_time
      if (!payload.end_time) delete payload.end_time

      await api.post(`/offerings/${offeringId}/quizzes`, payload)
      toast.success('Quiz created successfully!')
      onSuccess(); onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create quiz')
    } finally { setLoading(false) }
  }

  return (
    <Modal onClose={onClose} wide>
      {/* Header */}
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--neu-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif' }}>
            Create Quiz — Step {step}/2
          </h2>
          <p style={{ fontSize: '0.72rem', color: 'var(--neu-text-ghost)', marginTop: '0.1rem' }}>
            {step === 1 ? 'Quiz details & schedule' : `${questions.length} question(s) · ${calcTotal()} total marks`}
          </p>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neu-text-ghost)' }}><X size={18} /></button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>

        {step === 1 ? (
          <>
            <Field label="Title *">
              <input value={form.title} onChange={e => set('title', e.target.value)} style={inputStyle} placeholder="Quiz title" autoFocus />
            </Field>
            <Field label="Description">
              <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2}
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} placeholder="Optional description..." />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <Field label="Time Limit (minutes)">
                <input type="number" value={form.time_limit_minutes} onChange={e => set('time_limit_minutes', Number(e.target.value))} min={5} style={inputStyle} />
              </Field>
              <Field label="Start Time (optional)">
                <input type="datetime-local" value={form.start_time} onChange={e => set('start_time', e.target.value)} style={inputStyle} />
              </Field>
              <Field label="End Time (optional)">
                <input type="datetime-local" value={form.end_time} onChange={e => set('end_time', e.target.value)} style={inputStyle} />
              </Field>
            </div>
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.82rem', color: 'var(--neu-text-secondary)' }}>
                <input type="checkbox" checked={form.is_mandatory} onChange={e => set('is_mandatory', e.target.checked)} />
                Mandatory
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.82rem', color: 'var(--neu-text-secondary)' }}>
                <input type="checkbox" checked={form.shuffle_questions} onChange={e => set('shuffle_questions', e.target.checked)} />
                Shuffle questions
              </label>
            </div>
          </>
        ) : (
          /* Step 2 — Questions builder */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {questions.map((q, qi) => (
              <div key={qi} style={{ ...neu({ borderRadius: '0.875rem', padding: '1rem' }), background: 'var(--neu-surface-deep)', boxShadow: 'inset 3px 3px 7px var(--neu-shadow-dark), inset -2px -2px 5px var(--neu-shadow-light)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#5b8af0', background: 'rgba(91,138,240,0.12)', padding: '0.2rem 0.6rem', borderRadius: '0.4rem' }}>
                    Q{qi + 1}
                  </span>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <select value={q.question_type} onChange={e => updateQ(qi, 'question_type', e.target.value)}
                      style={{ ...inputStyle, width: 'auto', padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>
                      <option value="mcq">MCQ</option>
                      <option value="true_false">True/False</option>
                      <option value="short">Short Answer</option>
                    </select>
                    <select value={q.difficulty} onChange={e => updateQ(qi, 'difficulty', e.target.value)}
                      style={{ ...inputStyle, width: 'auto', padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                    <input type="number" value={q.marks} onChange={e => updateQ(qi, 'marks', e.target.value)} min={1}
                      style={{ ...inputStyle, width: 65, padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                      placeholder="Marks" />
                    {questions.length > 1 && (
                      <button onClick={() => removeQuestion(qi)}
                        style={{ background: 'rgba(242,107,107,0.12)', border: 'none', color: '#f26b6b', borderRadius: '0.5rem', width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <X size={13} />
                      </button>
                    )}
                  </div>
                </div>

                <textarea value={q.question_text} onChange={e => updateQ(qi, 'question_text', e.target.value)} rows={2}
                  style={{ ...inputStyle, resize: 'vertical', marginBottom: '0.6rem', lineHeight: 1.5 }}
                  placeholder={`Question ${qi + 1} text...`} />

                {q.question_type === 'mcq' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', marginBottom: '0.6rem' }}>
                    {q.options.map((opt, oi) => (
                      <input key={oi} value={opt} onChange={e => updateOption(qi, oi, e.target.value)}
                        style={{ ...inputStyle, padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
                        placeholder={`Option ${String.fromCharCode(65 + oi)}`} />
                    ))}
                  </div>
                )}

                {q.question_type === 'true_false' && (
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.6rem' }}>
                    {['true', 'false'].map(v => (
                      <button key={v} onClick={() => updateQ(qi, 'correct_answer', v)}
                        style={{ padding: '0.4rem 1rem', borderRadius: '0.6rem', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem', background: q.correct_answer === v ? (v === 'true' ? '#3ecf8e' : '#f26b6b') : 'var(--neu-surface)', color: q.correct_answer === v ? '#fff' : 'var(--neu-text-muted)', boxShadow: '3px 3px 7px var(--neu-shadow-dark)', textTransform: 'capitalize' }}>
                        {v}
                      </button>
                    ))}
                  </div>
                )}

                <div>
                  <label style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '0.3rem' }}>
                    Correct Answer *
                  </label>
                  {q.question_type === 'mcq' ? (
                    <select value={q.correct_answer} onChange={e => updateQ(qi, 'correct_answer', e.target.value)}
                      style={{ ...inputStyle, padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}>
                      <option value="">-- Select correct option --</option>
                      {q.options.filter(o => o.trim()).map((opt, oi) => (
                        <option key={oi} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : q.question_type === 'true_false' ? (
                    <input value={q.correct_answer} readOnly style={{ ...inputStyle, padding: '0.45rem 0.75rem', fontSize: '0.8rem', opacity: 0.7 }}
                      placeholder="Select True or False above" />
                  ) : (
                    <input value={q.correct_answer} onChange={e => updateQ(qi, 'correct_answer', e.target.value)}
                      style={{ ...inputStyle, padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
                      placeholder="Expected answer..." />
                  )}
                </div>
              </div>
            ))}

            
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={addQuestion} style={{ padding: '0.6rem', borderRadius: '0.875rem', border: `2px dashed var(--neu-border)`, background: 'none', color: '#5b8af0', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontFamily: "'DM Sans',sans-serif", transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(91,138,240,0.08)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                <Plus size={14} /> Add Question
              </button>
              <button onClick={() => setShowAIGen(true)}
                style={{ padding: '0.6rem 1rem', borderRadius: '0.875rem', border: 'none', cursor: 'pointer',
                  background: 'linear-gradient(145deg,#a78bfa,#7c5cdb)', color: '#fff',
                  fontSize: '0.8rem', fontWeight: 700, fontFamily: "'DM Sans',sans-serif",
                  boxShadow: '4px 4px 10px var(--neu-shadow-dark), 0 4px 14px rgba(167,139,250,0.35)',
                  display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                ✨ AI Generate
              </button>
            </div>
            {showAIGen && (
  <AIGenerateModal
    onClose={() => setShowAIGen(false)}
    onQuestionsReady={handleAIQuestions}
  />
)}
          </div>
        )}
      </div>

      <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--neu-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--neu-text-ghost)' }}>
          {step === 2 && `${questions.length} questions · ${calcTotal()} total marks`}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {step === 2 && (
            <button onClick={() => setStep(1)} style={{ ...inputStyle, width: 'auto', padding: '0.6rem 1.1rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}>
              ← Back
            </button>
          )}
          <button onClick={onClose} style={{ ...inputStyle, width: 'auto', padding: '0.6rem 1.1rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}>Cancel</button>
          {step === 1 ? (
            <NeuBtn onClick={() => { if (!form.title.trim()) { toast.error('Title required'); return } setStep(2) }} accent='#34d399'>
              Next: Add Questions →
            </NeuBtn>
          ) : (
            <NeuBtn onClick={handleSubmit} loading={loading} accent='#34d399'>
              <PenSquare size={14} /> Create Quiz
            </NeuBtn>
          )}
        </div>
      </div>
    </Modal>
  )
}

function AIGenerateModal({ offeringId, onClose, onQuestionsReady }) {
const [form, setForm] = useState({ 
  topic: '', difficulty: 'medium', num_questions: 5, context: '', customCount: '' 
})
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  

  const handleGenerate = async () => {
    if (!form.topic.trim()) { toast.error('Topic required'); return }
    setLoading(true)
    try {
      // Use the same Gemini endpoint as student practice quiz
      const res = await api.post('/ai-quiz/generate', {
        course_id: 0,  // not tied to a specific course
        topic: form.topic.trim(),
        difficulty: form.difficulty === 'mixed' ? 'medium' : form.difficulty,
        num_questions: form.num_questions,
        // Pass context in topic string if provided
        ...(form.context.trim() && { topic: `${form.topic.trim()}. Context: ${form.context.trim()}` })
      })
      const questions = res.data.data?.questions || res.data.data?.questions_generated || []
      if (!questions.length) throw new Error('No questions generated')
      onQuestionsReady(questions, form)
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Generation failed')
    } finally { setLoading(false) }
  }

  return (
    <Modal onClose={onClose}>
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--neu-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif' }}>
            ✨ Generate Questions with AI
          </h2>
          <p style={{ fontSize: '0.72rem', color: 'var(--neu-text-ghost)', marginTop: '0.1rem' }}>Powered by Google Gemini</p>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neu-text-ghost)' }}><X size={18} /></button>
      </div>

      <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Field label="Topic *">
          <textarea value={form.topic} onChange={e => set('topic', e.target.value)} rows={2}
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
            placeholder="e.g. Object Oriented Programming, SQL Joins, Photosynthesis..." autoFocus />
        </Field>

        <Field label="Difficulty">
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {['easy','medium','hard','mixed'].map(d => (
              <button key={d} onClick={() => set('difficulty', d)}
                style={{ padding: '0.4rem 1rem', borderRadius: '0.65rem', border: 'none', cursor: 'pointer',
                  fontWeight: 700, fontSize: '0.78rem', textTransform: 'capitalize',
                  background: form.difficulty === d ? 'linear-gradient(145deg,#a78bfa,#7c5cdb)' : 'var(--neu-surface-deep)',
                  color: form.difficulty === d ? '#fff' : 'var(--neu-text-muted)',
                  boxShadow: form.difficulty === d ? '3px 3px 8px var(--neu-shadow-dark)' : 'inset 2px 2px 5px var(--neu-shadow-dark)' }}>
                {d}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Number of Questions (max 50)">
  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
    {[3, 5, 7, 10].map(n => (
      <button key={n} onClick={() => { set('num_questions', n); set('customCount', '') }}
        style={{
          padding: '0.4rem 1rem', borderRadius: '0.65rem', border: 'none', cursor: 'pointer',
          fontWeight: 700, fontSize: '0.82rem',
          background: form.num_questions === n && !form.customCount
            ? 'linear-gradient(145deg,#5b8af0,#3a6bd4)' : 'var(--neu-surface-deep)',
          color: form.num_questions === n && !form.customCount ? '#fff' : 'var(--neu-text-muted)',
          boxShadow: form.num_questions === n && !form.customCount
            ? '3px 3px 8px var(--neu-shadow-dark)' : 'inset 2px 2px 5px var(--neu-shadow-dark)',
        }}>
        {n}
      </button>
    ))}

    {/* Custom number input */}
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
      <input
        type="number"
        min={1}
        max={50}
        value={form.customCount || ''}
        onChange={e => {
          const val = Math.min(50, Math.max(1, parseInt(e.target.value) || ''))
          set('customCount', e.target.value)
          if (val) set('num_questions', val)
        }}
        placeholder="Custom"
        style={{
          ...inputStyle,
          width: 90,
          padding: '0.4rem 0.65rem',
          border: form.customCount ? '1.5px solid #5b8af0' : '1px solid var(--neu-border)',
        }}
      />
      <span style={{ fontSize: '0.7rem', color: 'var(--neu-text-ghost)' }}>max 50</span>
    </div>
  </div>
</Field>

        <Field label="Extra context for AI (optional)">
          <textarea value={form.context} onChange={e => set('context', e.target.value)} rows={2}
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
            placeholder="e.g. Focus on Chapter 3, include code examples, theory only..." />
        </Field>
      </div>

      <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--neu-border)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
        <button onClick={onClose} style={{ ...inputStyle, width: 'auto', padding: '0.6rem 1.1rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}>Cancel</button>
        <NeuBtn onClick={handleGenerate} loading={loading} accent='#a78bfa'>
          {loading ? 'Generating…' : '✨ Generate Questions'}
        </NeuBtn>
      </div>
    </Modal>
  )
}

// ════════════════════════════════════════════════════════
// QUIZ DETAIL MODAL — view questions + edit info
// ════════════════════════════════════════════════════════
function QuizDetailModal({ quiz, onClose }) {
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/quizzes/${quiz.id}`)
      .then(r => setDetail(r.data.data))
      .catch(() => toast.error('Failed to load quiz details'))
      .finally(() => setLoading(false))
  }, [quiz.id])

  const DIFF_COLOR = { easy: '#3ecf8e', medium: '#f5a623', hard: '#f26b6b' }

  return (
    <Modal onClose={onClose} wide>
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--neu-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif' }}>{quiz.title}</h2>
          <p style={{ fontSize: '0.72rem', color: 'var(--neu-text-ghost)', marginTop: '0.1rem' }}>
            {quiz.total_questions} questions · {quiz.total_marks} marks · {quiz.time_limit_minutes} min
          </p>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neu-text-ghost)' }}><X size={18} /></button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
            <Loader2 size={24} style={{ color: '#34d399', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : !detail ? (
          <p style={{ color: 'var(--neu-text-ghost)', textAlign: 'center', padding: '2rem' }}>Failed to load</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {/* Meta */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
              {[
                { label: 'Start Time', value: detail.start_time ? formatDateTime(detail.start_time) : 'Any time' },
                { label: 'End Time',   value: detail.end_time   ? formatDateTime(detail.end_time)   : 'No limit' },
                { label: 'Mandatory',  value: detail.is_mandatory ? 'Yes' : 'No' },
              ].map(m => (
                <div key={m.label} style={{ background: 'var(--neu-surface-deep)', borderRadius: '0.75rem', padding: '0.65rem 0.9rem', boxShadow: 'inset 2px 2px 5px var(--neu-shadow-dark), inset -1px -1px 4px var(--neu-shadow-light)' }}>
                  <p style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>{m.label}</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--neu-text-primary)', fontWeight: 500 }}>{m.value}</p>
                </div>
              ))}
            </div>

            {/* Questions */}
            <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Questions</p>
            {(detail.questions || []).map((q, i) => (
              <div key={q.id || i} style={{ ...neu({ borderRadius: '0.875rem', padding: '0.9rem 1.1rem' }), background: 'var(--neu-surface-deep)', boxShadow: 'inset 2px 2px 5px var(--neu-shadow-dark), inset -1px -1px 4px var(--neu-shadow-light)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                    <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: '0.35rem', background: 'rgba(91,138,240,0.12)', color: '#5b8af0' }}>Q{i + 1}</span>
                    <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: '0.35rem', background: `${DIFF_COLOR[q.difficulty] || '#94a3b8'}18`, color: DIFF_COLOR[q.difficulty] || '#94a3b8', textTransform: 'capitalize' }}>{q.difficulty}</span>
                    <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: '0.35rem', background: 'rgba(62,207,142,0.1)', color: '#3ecf8e' }}>{q.marks} mark{q.marks > 1 ? 's' : ''}</span>
                  </div>
                </div>
                <p style={{ fontSize: '0.83rem', color: 'var(--neu-text-primary)', marginBottom: '0.5rem', lineHeight: 1.5 }}>{q.question_text}</p>
                {q.options && q.options.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem', marginBottom: '0.5rem' }}>
                    {q.options.map((opt, oi) => (
                      <div key={oi} style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', borderRadius: '0.4rem', background: opt === q.correct_answer ? 'rgba(62,207,142,0.12)' : 'var(--neu-surface)', color: opt === q.correct_answer ? '#3ecf8e' : 'var(--neu-text-secondary)', border: opt === q.correct_answer ? '1px solid rgba(62,207,142,0.3)' : '1px solid var(--neu-border)', fontWeight: opt === q.correct_answer ? 700 : 400 }}>
                        {String.fromCharCode(65 + oi)}. {opt}
                        {opt === q.correct_answer && ' ✓'}
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ fontSize: '0.72rem', color: '#3ecf8e', fontWeight: 700 }}>
                  Correct: {q.correct_answer}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={{ padding: '0.9rem 1.5rem', borderTop: '1px solid var(--neu-border)' }}>
        <button onClick={onClose} style={{ ...inputStyle, cursor: 'pointer', textAlign: 'center', fontWeight: 600, color: 'var(--neu-text-secondary)', padding: '0.6rem' }}>Close</button>
      </div>
    </Modal>
  )
}

// ════════════════════════════════════════════════════════
// RESULTS MODAL — view attempts/results
// ════════════════════════════════════════════════════════
function ResultsModal({ quiz, onClose }) {
  const [attempts, setAttempts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/quizzes/${quiz.id}/attempts`)
      .then(r => setAttempts(r.data.data?.attempts || []))
      .catch(() => toast.error('Failed to load results'))
      .finally(() => setLoading(false))
  }, [quiz.id])

  const avgScore = attempts.length
    ? (attempts.reduce((s, a) => s + (parseFloat(a.percentage) || 0), 0) / attempts.length).toFixed(1)
    : '—'

  const passed = attempts.filter(a => parseFloat(a.percentage) >= 50).length

  return (
    <Modal onClose={onClose} wide>
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--neu-border)', display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <RingChart value={passed} total={attempts.length || 1} size={52} />
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif' }}>{quiz.title} — Results</h2>
            <p style={{ fontSize: '0.72rem', color: 'var(--neu-text-ghost)', marginTop: '0.1rem' }}>
              {attempts.length} attempts · Avg: {avgScore}% · {passed} passed
            </p>
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neu-text-ghost)' }}><X size={18} /></button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2.5rem' }}>
            <Loader2 size={24} style={{ color: '#34d399', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : attempts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--neu-text-ghost)' }}>
            <BarChart2 size={32} style={{ opacity: 0.2, marginBottom: '0.75rem', display: 'block', margin: '0 auto 0.75rem' }} />
            <p style={{ fontSize: '0.88rem', fontWeight: 600 }}>No attempts yet</p>
            <p style={{ fontSize: '0.78rem', marginTop: '0.3rem' }}>Students haven't attempted this quiz yet</p>
          </div>
        ) : (
          <>
            {/* Stats bar */}
            <div style={{ padding: '0.85rem 1.5rem', display: 'flex', gap: '1rem', borderBottom: '1px solid var(--neu-border)', flexWrap: 'wrap' }}>
              {[
                { label: 'Total Attempts', value: attempts.length, color: '#5b8af0' },
                { label: 'Avg Score',      value: `${avgScore}%`,  color: '#f5a623' },
                { label: 'Passed (≥50%)',  value: passed,           color: '#3ecf8e' },
                { label: 'Failed (<50%)',  value: attempts.length - passed, color: '#f26b6b' },
              ].map(s => (
                <div key={s.label} style={{ background: 'var(--neu-surface-deep)', borderRadius: '0.75rem', padding: '0.6rem 1rem', boxShadow: 'inset 2px 2px 5px var(--neu-shadow-dark), inset -1px -1px 4px var(--neu-shadow-light)', flex: 1, minWidth: 100 }}>
                  <p style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>{s.label}</p>
                  <p style={{ fontSize: '1.25rem', fontWeight: 800, color: s.color, fontFamily: 'Outfit,sans-serif' }}>{s.value}</p>
                </div>
              ))}
            </div>

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
                  {attempts.map((a, i) => {
                    const pct = parseFloat(a.percentage) || 0
                    const color = pct >= 75 ? '#3ecf8e' : pct >= 50 ? '#f5a623' : '#f26b6b'
                    const timeTaken = a.start_time && a.end_time
                      ? Math.round((new Date(a.end_time) - new Date(a.start_time)) / 60000) + ' min'
                      : '—'
                    return (
                      <tr key={a.id || i}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--neu-surface-deep)'}
                        onMouseLeave={e => e.currentTarget.style.background = ''}
                        style={{ transition: 'background 0.12s' }}
                      >
                        <td style={{ ...tdStyle, color: 'var(--neu-text-ghost)' }}>{i + 1}</td>
                        <td style={{ ...tdStyle, fontWeight: 600, color: 'var(--neu-text-primary)' }}>{a.student_name}</td>
                        <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: '0.75rem' }}>{a.roll_number || '—'}</td>
                        <td style={{ ...tdStyle, fontWeight: 800, color: 'var(--neu-text-primary)' }}>
                          {parseFloat(a.score).toFixed(1)}/{a.total_marks}
                        </td>
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: 50, height: 5, borderRadius: 99, background: 'var(--neu-surface-deep)', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99 }} />
                            </div>
                            <span style={{ fontWeight: 700, color, fontSize: '0.8rem' }}>{pct.toFixed(1)}%</span>
                          </div>
                        </td>
                        
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <div style={{ padding: '0.9rem 1.5rem', borderTop: '1px solid var(--neu-border)' }}>
        <button onClick={onClose} style={{ ...inputStyle, cursor: 'pointer', textAlign: 'center', fontWeight: 600, color: 'var(--neu-text-secondary)', padding: '0.6rem' }}>Close</button>
      </div>
    </Modal>
  )
}

// ════════════════════════════════════════════════════════
// QUIZ CARD — beautiful with ring chart
// ════════════════════════════════════════════════════════
function QuizCard({ quiz, attempts, onClick }) {
  const [hovered, setHovered] = useState(false)

  const now = new Date()
  const start = quiz.start_time ? new Date(quiz.start_time) : null
  const end   = quiz.end_time   ? new Date(quiz.end_time)   : null

  const isLive    = start && end ? now >= start && now <= end : !start && !end ? true : false
  const isUpcoming = start && now < start
  const isEnded   = end && now > end

  const { label: statusLabel, color: statusColor, bg: statusBg } = isLive
    ? { label: 'Live',     color: '#3ecf8e', bg: 'rgba(62,207,142,0.12)' }
    : isUpcoming
    ? { label: 'Upcoming', color: '#5b8af0', bg: 'rgba(91,138,240,0.12)' }
    : { label: 'Ended',    color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' }

  const attemptCount = typeof attempts === 'number' ? attempts : (quiz.total_attempts || 0)

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...neu({ padding: 0, overflow: 'hidden', cursor: 'pointer', position: 'relative' }),
        transition: 'transform 0.2s, box-shadow 0.2s',
        transform: hovered ? 'translateY(-3px)' : '',
        boxShadow: hovered ? '12px 12px 28px var(--neu-shadow-dark), -8px -8px 18px var(--neu-shadow-light)' : 'var(--neu-raised)',
      }}
    >
      {/* Top accent */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${statusColor}, ${statusColor}88)`, width: '100%' }} />

      <div style={{ padding: '1.2rem 1.35rem 1.35rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
        {/* Ring chart */}
        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
          <RingChart value={attemptCount} total={Math.max(attemptCount, 1)} size={56} />
          <span style={{ fontSize: '0.58rem', color: 'var(--neu-text-ghost)', fontWeight: 600 }}>attempts</span>
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <h3 style={{ fontSize: '0.93rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
              {quiz.title}
            </h3>
            <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '0.15rem 0.5rem', background: statusBg, color: statusColor, borderRadius: '0.4rem', flexShrink: 0 }}>
              {isLive && <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#3ecf8e', marginRight: '0.3rem', boxShadow: '0 0 5px #3ecf8e', verticalAlign: 'middle' }}></span>}
              {statusLabel}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--neu-text-ghost)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Hash size={11} />{quiz.total_questions} questions
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--neu-text-ghost)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Award size={11} />{quiz.total_marks} marks
            </span>
            {quiz.time_limit_minutes && (
              <span style={{ fontSize: '0.72rem', color: 'var(--neu-text-ghost)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Clock size={11} />{quiz.time_limit_minutes} min
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {quiz.start_time && (
              <span style={{ fontSize: '0.68rem', fontWeight: 600, padding: '0.18rem 0.55rem', borderRadius: '0.4rem', background: 'rgba(91,138,240,0.08)', color: '#5b8af0', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Calendar size={10} />Start: {formatDateTime(quiz.start_time)}
              </span>
            )}
            {quiz.end_time && (
              <span style={{ fontSize: '0.68rem', fontWeight: 600, padding: '0.18rem 0.55rem', borderRadius: '0.4rem', background: 'rgba(242,107,107,0.08)', color: '#f26b6b', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Clock size={10} />End: {formatDateTime(quiz.end_time)}
              </span>
            )}
            {quiz.is_mandatory && (
              <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '0.18rem 0.55rem', borderRadius: '0.4rem', background: 'rgba(245,166,35,0.1)', color: '#f5a623' }}>
                Mandatory
              </span>
            )}
            <span style={{ fontSize: '0.68rem', fontWeight: 600, padding: '0.18rem 0.55rem', borderRadius: '0.4rem', background: 'rgba(148,163,184,0.1)', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Users size={10} />{attemptCount} attempted
            </span>
          </div>
        </div>
      </div>

      <span style={{ position: 'absolute', bottom: '0.5rem', right: '0.75rem', fontSize: '0.58rem', color: 'var(--neu-text-ghost)', opacity: hovered ? 0.6 : 0.2, transition: 'opacity 0.2s', pointerEvents: 'none' }}>
        click for options
      </span>
    </div>
  )
}

// ════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════
export default function QuizzesPage() {
  const [offerings, setOfferings] = useState([])
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(false)
  const [filterOffering, setFilterOffering] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [resultsModal, setResultsModal] = useState(null)
  const [detailModal, setDetailModal] = useState(null)
  const { menu, open: openMenu, close: closeMenu } = useContextMenu()

  useEffect(() => {
    teacherAPI.getMyOfferings().then(r => {
      const offs = r.data.data?.offerings || []
      setOfferings(offs)
      if (offs.length) setFilterOffering(String(offs[0].id))
    }).catch(() => toast.error('Failed to load offerings'))
  }, [])

  const fetchQuizzes = useCallback(async () => {
    if (!filterOffering) return
    setLoading(true)
    try {
      const res = await api.get(`/offerings/${filterOffering}/quizzes`)
      setQuizzes(res.data.data?.quizzes || [])
    } catch { toast.error('Failed to load quizzes') }
    finally { setLoading(false) }
  }, [filterOffering])

  useEffect(() => { fetchQuizzes() }, [fetchQuizzes])

  // ── DELETE quiz — backend endpoint add karna hoga ──────────
  const handleDelete = async (quiz) => {
    if (!window.confirm(`Delete "${quiz.title}"? Students' attempts will also be deleted.`)) return
    try {
      await api.delete(`/quizzes/${quiz.id}`)
      toast.success('Quiz deleted')
      fetchQuizzes()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete quiz')
    }
  }

  // Left-click context menu items
  const ctxItems = (quiz) => [
    {
      label: 'View Questions',
      icon: Eye,
      onClick: q => setDetailModal(q),
    },
    {
      label: 'View Results',
      icon: BarChart2,
      onClick: q => setResultsModal(q),
    },
    { divider: true },
    {
      label: 'Delete Quiz',
      icon: Trash2,
      danger: true,
      onClick: q => handleDelete(q),
    },
  ]

  const selectStyle = {
    ...inputStyle, width: 'auto', minWidth: 260, cursor: 'pointer',
  }

  return (
    <div style={{ maxWidth: 980, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: '2rem' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.55rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', marginBottom: '0.2rem' }}>Quizzes</h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--neu-text-ghost)' }}>
            {quizzes.length} quizzes · {quizzes.reduce((s, q) => s + (q.total_attempts || 0), 0)} total attempts
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <select value={filterOffering} onChange={e => setFilterOffering(e.target.value)} style={selectStyle}>
            {offerings.map(o => <option key={o.id} value={o.id}>{o.course_name} — Sec {o.section}</option>)}
          </select>
          
          <AddButton onClick={() => setShowCreate(true)} tooltip="Create Quiz" color="#5b8af0" />

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
          <NeuBtn onClick={() => setShowCreate(true)} accent='#34d399' style={{ marginTop: '0.25rem' }}>
            <Plus size={14} /> Create First Quiz
          </NeuBtn>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
          {quizzes.map(q => (
            <QuizCard
              key={q.id}
              quiz={q}
              attempts={q.total_attempts || 0}
              onClick={e => openMenu(e, q)}
            />
          ))}
        </div>
      )}

      {showCreate && (
        <CreateQuizModal
          offeringId={filterOffering}
          onClose={() => setShowCreate(false)}
          onSuccess={fetchQuizzes}
        />
      )}
      {resultsModal && (
        <ResultsModal
          quiz={resultsModal}
          onClose={() => setResultsModal(null)}
        />
      )}
      {detailModal && (
        <QuizDetailModal
          quiz={detailModal}
          onClose={() => setDetailModal(null)}
        />
      )}

      <ContextMenu menu={menu} close={closeMenu} items={menu ? ctxItems(menu.row) : []} />
    </div>
  )
}