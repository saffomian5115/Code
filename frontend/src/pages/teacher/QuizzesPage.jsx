import { useState, useEffect, useCallback } from 'react'
import { teacherAPI } from '../../api/teacher.api'
import { formatDate, formatDateTime } from '../../utils/helpers'
import toast from 'react-hot-toast'
import {
  Plus, Award, BarChart2, Loader2, X, Trash2,
  CheckCircle2, Clock, Users, ChevronDown, Eye
} from 'lucide-react'

const DIFFICULTY_COLORS = {
  easy:   'bg-emerald-100 text-emerald-700',
  medium: 'bg-orange-100 text-orange-700',
  hard:   'bg-red-100 text-red-700',
}

// ── Empty Question Template ────────────────────────
const emptyQuestion = () => ({
  question_text: '', question_type: 'mcq',
  options: ['', '', '', ''], correct_answer: '',
  marks: 1, difficulty: 'medium', explanation: '',
})

// ── Question Editor ────────────────────────────────
function QuestionEditor({ q, idx, onChange, onRemove }) {
  const set = (k, v) => onChange(idx, { ...q, [k]: v })
  const setOption = (oi, val) => {
    const opts = [...q.options]; opts[oi] = val; onChange(idx, { ...q, options: opts })
  }
  const inputCls = "w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 transition-all"

  return (
    <div className="border border-slate-200 rounded-2xl p-4 space-y-3 bg-slate-50/50">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">Q{idx + 1}</span>
        <button onClick={() => onRemove(idx)} className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors">
          <Trash2 size={14} />
        </button>
      </div>
      <textarea value={q.question_text} onChange={e => set('question_text', e.target.value)} rows={2}
        placeholder="Enter question text..." className={`${inputCls} resize-none`} />
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="block text-xs text-slate-500 mb-1">Type</label>
          <select value={q.question_type} onChange={e => set('question_type', e.target.value)} className={inputCls}>
            <option value="mcq">MCQ</option>
            <option value="true_false">True/False</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Marks</label>
          <input type="number" min={1} max={10} value={q.marks} onChange={e => set('marks', parseInt(e.target.value))} className={inputCls} />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Difficulty</label>
          <select value={q.difficulty} onChange={e => set('difficulty', e.target.value)} className={inputCls}>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </div>

      {/* Options */}
      {q.question_type === 'mcq' ? (
        <div className="space-y-2">
          <label className="block text-xs text-slate-500 font-medium">Options (mark correct with ✓)</label>
          {(q.options || ['', '', '', '']).map((opt, oi) => (
            <div key={oi} className="flex items-center gap-2">
              <button onClick={() => set('correct_answer', opt || `Option ${oi + 1}`)}
                className={`w-6 h-6 rounded-full border-2 flex-shrink-0 transition-all ${q.correct_answer === opt && opt ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 hover:border-emerald-400'}`}>
                {q.correct_answer === opt && opt && <span className="text-white text-xs flex items-center justify-center w-full h-full">✓</span>}
              </button>
              <input value={opt} onChange={e => setOption(oi, e.target.value)}
                placeholder={`Option ${oi + 1}`} className={inputCls} />
            </div>
          ))}
        </div>
      ) : (
        <div>
          <label className="block text-xs text-slate-500 mb-1">Correct Answer</label>
          <div className="flex gap-3">
            {['True', 'False'].map(ans => (
              <button key={ans} onClick={() => set('correct_answer', ans)}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold border-2 transition-colors ${q.correct_answer === ans ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                {ans}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="block text-xs text-slate-500 mb-1">Explanation (optional)</label>
        <input value={q.explanation} onChange={e => set('explanation', e.target.value)}
          placeholder="Explain the correct answer..." className={inputCls} />
      </div>
    </div>
  )
}

// ── Create Quiz Modal ──────────────────────────────
function CreateQuizModal({ offerings, onClose, onSuccess }) {
  const [step, setStep] = useState(1) // 1=info, 2=questions
  const [form, setForm] = useState({
    offering_id: offerings[0]?.id || '',
    title: '', description: '',
    time_limit_minutes: 15,
    start_time: '', end_time: '',
    is_mandatory: true, shuffle_questions: false,
    questions: [emptyQuestion()],
  })
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const addQuestion = () => setForm(p => ({ ...p, questions: [...p.questions, emptyQuestion()] }))
  const removeQuestion = (i) => setForm(p => ({ ...p, questions: p.questions.filter((_, idx) => idx !== i) }))
  const updateQuestion = (i, q) => setForm(p => { const qs = [...p.questions]; qs[i] = q; return { ...p, questions: qs } })

  const totalMarks = form.questions.reduce((s, q) => s + (q.marks || 1), 0)

  const handleSubmit = async () => {
    if (!form.offering_id || !form.title) { toast.error('Select offering and add title'); return }
    if (form.questions.some(q => !q.question_text || !q.correct_answer)) {
      toast.error('All questions must have text and correct answer'); return
    }
    setLoading(true)
    try {
      await teacherAPI.createQuiz(form.offering_id, {
        title: form.title, description: form.description,
        total_marks: totalMarks,
        time_limit_minutes: form.time_limit_minutes,
        start_time: form.start_time || null, end_time: form.end_time || null,
        is_mandatory: form.is_mandatory, shuffle_questions: form.shuffle_questions,
        questions: form.questions,
      })
      toast.success('Quiz created successfully!')
      onSuccess(); onClose()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create quiz') }
    finally { setLoading(false) }
  }

  const inputCls = "w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 transition-all text-slate-700"

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-display font-bold text-lg text-slate-800">Create New Quiz</h3>
            <div className="flex items-center gap-2 mt-1">
              {[1, 2].map(s => (
                <div key={s} className="flex items-center gap-1">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= s ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>{s}</div>
                  <span className={`text-xs ${step === s ? 'text-blue-600 font-semibold' : 'text-slate-400'}`}>{s === 1 ? 'Info' : 'Questions'}</span>
                  {s < 2 && <div className={`w-6 h-px ${step > s ? 'bg-blue-600' : 'bg-slate-200'}`} />}
                </div>
              ))}
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl"><X size={18} className="text-slate-500" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {step === 1 ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-500 font-medium mb-1.5">Course Offering *</label>
                <select className={inputCls} value={form.offering_id} onChange={e => set('offering_id', parseInt(e.target.value))}>
                  {offerings.map(o => <option key={o.id} value={o.id}>{o.course_name} — Sec {o.section}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-500 font-medium mb-1.5">Quiz Title *</label>
                <input className={inputCls} value={form.title} onChange={e => set('title', e.target.value)} placeholder="Quiz 1 — HTML Basics" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 font-medium mb-1.5">Description</label>
                <textarea className={inputCls} rows={2} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Quiz instructions..." />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Time Limit (min)</label>
                  <input className={inputCls} type="number" min={5} value={form.time_limit_minutes} onChange={e => set('time_limit_minutes', parseInt(e.target.value))} />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Start Time</label>
                  <input className={inputCls} type="datetime-local" value={form.start_time} onChange={e => set('start_time', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">End Time</label>
                  <input className={inputCls} type="datetime-local" value={form.end_time} onChange={e => set('end_time', e.target.value)} />
                </div>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_mandatory} onChange={e => set('is_mandatory', e.target.checked)} className="w-4 h-4 rounded text-blue-600" />
                  <span className="text-sm text-slate-600">Mandatory</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.shuffle_questions} onChange={e => set('shuffle_questions', e.target.checked)} className="w-4 h-4 rounded text-blue-600" />
                  <span className="text-sm text-slate-600">Shuffle Questions</span>
                </label>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-700">{form.questions.length} Questions · {totalMarks} Total Marks</p>
                </div>
                <button onClick={addQuestion} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl text-sm font-semibold transition-colors">
                  <Plus size={14} /> Add Question
                </button>
              </div>
              {form.questions.map((q, i) => (
                <QuestionEditor key={i} q={q} idx={i} onChange={updateQuestion} onRemove={removeQuestion} />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 pt-0 flex gap-3 border-t border-slate-100">
          {step === 1 ? (
            <>
              <button onClick={onClose} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium rounded-xl transition-colors">Cancel</button>
              <button onClick={() => setStep(2)}
                disabled={!form.title || !form.offering_id}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors">
                Next: Add Questions →
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setStep(1)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium rounded-xl transition-colors">← Back</button>
              <button onClick={handleSubmit} disabled={loading}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
                {loading ? <><Loader2 size={16} className="animate-spin" /> Creating...</> : `Create Quiz (${totalMarks} marks)`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Results Modal ──────────────────────────────────
function ResultsModal({ quizId, quizTitle, totalMarks, onClose }) {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    teacherAPI.getQuizAttempts(quizId)
      .then(r => setResults(r.data.data?.attempts || []))
      .catch(() => toast.error('Failed to load results'))
      .finally(() => setLoading(false))
  }, [quizId])

  const stats = results.length ? {
    avg: (results.reduce((s, r) => s + r.percentage, 0) / results.length).toFixed(1),
    highest: Math.max(...results.map(r => r.percentage)).toFixed(1),
    lowest: Math.min(...results.map(r => r.percentage)).toFixed(1),
    passed: results.filter(r => r.percentage >= 50).length,
  } : null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h3 className="font-display font-bold text-lg text-slate-800">Quiz Results</h3>
            <p className="text-slate-400 text-sm">{quizTitle} · {totalMarks} marks</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl"><X size={18} className="text-slate-500" /></button>
        </div>
        {loading ? <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-600 w-6 h-6" /></div> : (
          <>
            {stats && (
              <div className="px-6 py-4 border-b border-slate-100 grid grid-cols-4 gap-3">
                {[
                  { label: 'Avg', val: `${stats.avg}%` },
                  { label: 'Highest', val: `${stats.highest}%` },
                  { label: 'Lowest', val: `${stats.lowest}%` },
                  { label: 'Passed', val: `${stats.passed}/${results.length}` },
                ].map(s => (
                  <div key={s.label} className="text-center p-2 bg-slate-50 rounded-xl">
                    <p className="text-slate-400 text-xs">{s.label}</p>
                    <p className="font-display font-bold text-slate-800">{s.val}</p>
                  </div>
                ))}
              </div>
            )}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {results.length === 0 ? (
                <p className="text-center py-8 text-slate-400">No attempts yet</p>
              ) : results.map(r => (
                <div key={r.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-700 text-xs font-bold">{r.student_name?.[0] || '?'}</div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-700 text-sm">{r.student_name}</p>
                    <p className="text-xs text-slate-400 font-mono">{r.roll_number}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-800 text-sm">{r.score}/{totalMarks}</p>
                    <p className={`text-xs font-semibold ${r.percentage >= 75 ? 'text-emerald-600' : r.percentage >= 50 ? 'text-blue-500' : 'text-red-500'}`}>{r.percentage?.toFixed(1)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        <div className="p-6 pt-0">
          <button onClick={onClose} className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium rounded-xl transition-colors">Close</button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────
export default function QuizzesPage() {
  const [offerings, setOfferings] = useState([])
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterOffering, setFilterOffering] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [resultsModal, setResultsModal] = useState(null)

  useEffect(() => {
    teacherAPI.getMyOfferings().then(r => {
      const offs = r.data.data?.offerings || []
      setOfferings(offs)
      if (offs.length) { setFilterOffering(String(offs[0].id)) }
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-800">Quizzes</h1>
          <p className="text-slate-400 text-sm mt-0.5">{quizzes.length} quizzes created</p>
        </div>
        <button onClick={() => setShowCreate(true)} disabled={!offerings.length}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm">
          <Plus size={16} /> Create Quiz
        </button>
      </div>

      {/* Filter */}
      <select value={filterOffering} onChange={e => setFilterOffering(e.target.value)}
        className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-600 focus:outline-none bg-white min-w-[240px]">
        {offerings.map(o => <option key={o.id} value={o.id}>{o.course_name} — Sec {o.section}</option>)}
      </select>

      {/* Quiz List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse space-y-3">
            <div className="h-4 bg-slate-100 rounded w-2/3" /><div className="h-3 bg-slate-100 rounded w-1/2" />
          </div>)}
        </div>
      ) : quizzes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-center py-20">
          <Award size={40} className="text-slate-300 mb-3" />
          <p className="font-semibold text-slate-600">No quizzes created yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quizzes.map(q => {
            const now = new Date()
            const start = q.start_time ? new Date(q.start_time) : null
            const end = q.end_time ? new Date(q.end_time) : null
            const isActive = (!start || now >= start) && (!end || now <= end)
            const isEnded  = end && now > end
            return (
              <div key={q.id} className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isActive ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                    <Award size={18} className={isActive ? 'text-emerald-600' : 'text-slate-400'} />
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${isEnded ? 'bg-slate-100 text-slate-500' : isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                    {isEnded ? 'Ended' : isActive ? 'Active' : 'Upcoming'}
                  </span>
                </div>
                <h3 className="font-display font-bold text-slate-800 mb-1">{q.title}</h3>
                <div className="space-y-1 mb-4">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Clock size={11} /> {q.time_limit_minutes} min</span>
                    <span>·</span>
                    <span>{q.total_questions} questions</span>
                    <span>·</span>
                    <span>{q.total_marks} marks</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <Users size={11} /> {q.total_attempts || 0} attempts
                  </div>
                </div>
                <button onClick={() => setResultsModal(q)}
                  className="w-full py-2 bg-slate-100 hover:bg-purple-50 text-slate-600 hover:text-purple-700 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                  <BarChart2 size={14} /> View Results
                </button>
              </div>
            )
          })}
        </div>
      )}

      {showCreate && offerings.length > 0 && (
        <CreateQuizModal offerings={offerings} onClose={() => setShowCreate(false)} onSuccess={() => filterOffering && teacherAPI.getOfferingQuizzes(filterOffering).then(r => setQuizzes(r.data.data?.quizzes || []))} />
      )}
      {resultsModal && (
        <ResultsModal quizId={resultsModal.id} quizTitle={resultsModal.title} totalMarks={resultsModal.total_marks} onClose={() => setResultsModal(null)} />
      )}
    </div>
  )
}
