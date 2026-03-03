import { useState, useEffect, useCallback, useRef } from 'react'
import { studentAPI } from '../../api/student.api'
import { formatDateTime } from '../../utils/helpers'
import toast from 'react-hot-toast'
import {
  PenSquare, Clock, CheckCircle2, AlertTriangle,
  Loader2, X, ChevronRight, Award
} from 'lucide-react'

// ── Quiz Attempt Modal ─────────────────────────────
function QuizAttemptModal({ quiz, onClose, onSuccess }) {
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({}) // {question_id: answer}
  const [currentQ, setCurrentQ] = useState(0)
  const [timeLeft, setTimeLeft] = useState(null)
  const [phase, setPhase] = useState('loading') // loading | attempt | result
  const [result, setResult] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    // Start attempt
    studentAPI.startQuizAttempt(quiz.id)
      .then(r => {
        const data = r.data.data
        const qs = data?.questions || quiz.questions || []
        setQuestions(qs)
        const secs = (quiz.time_limit_minutes || 15) * 60
        setTimeLeft(secs)
        setPhase('attempt')
      })
      .catch(err => {
        const msg = err.response?.data?.message || 'Failed to start quiz'
        toast.error(msg)
        // If already completed, try loading result
        if (msg.includes('already completed')) {
          setPhase('result')
        } else {
          onClose()
        }
      })
  }, [])

  // Timer
  useEffect(() => {
    if (phase !== 'attempt' || timeLeft === null) return
    if (timeLeft <= 0) { handleSubmit(); return }
    timerRef.current = setInterval(() => setTimeLeft(t => t - 1), 1000)
    return () => clearInterval(timerRef.current)
  }, [phase, timeLeft])

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

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
    } finally { setSubmitting(false) }
  }

  const q = questions[currentQ]
  const answered = Object.keys(answers).length
  const isUrgent = timeLeft !== null && timeLeft < 120 // last 2 mins

  if (phase === 'loading') return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-3">
        <Loader2 className="animate-spin text-blue-600 w-8 h-8" />
        <p className="text-slate-600 font-medium">Starting quiz...</p>
      </div>
    </div>
  )

  if (phase === 'result') return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-8 text-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Award size={28} className="text-emerald-600" />
        </div>
        <h3 className="font-display font-bold text-2xl text-slate-800 mb-1">Quiz Submitted!</h3>
        {result && (
          <>
            <p className="text-5xl font-display font-bold text-emerald-600 my-4">{parseFloat(result.percentage || 0).toFixed(1)}%</p>
            <p className="text-slate-600 text-sm mb-2">{result.score} / {result.total_marks} marks</p>
          </>
        )}
        <button onClick={onClose} className="w-full mt-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl">Done</button>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-display font-bold text-slate-800">{quiz.title}</h3>
            <p className="text-xs text-slate-400">{answered}/{questions.length} answered</p>
          </div>
          <div className={`flex items-center gap-2 font-mono font-bold text-lg px-4 py-2 rounded-xl ${isUrgent ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-700'}`}>
            <Clock size={16} />
            {timeLeft !== null ? formatTime(timeLeft) : '--:--'}
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-slate-100">
          <div className="h-full bg-blue-500 transition-all" style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }} />
        </div>

        {/* Question */}
        <div className="flex-1 overflow-y-auto p-6">
          {q ? (
            <div>
              <div className="flex items-start gap-3 mb-5">
                <span className="w-7 h-7 bg-blue-100 text-blue-700 text-sm font-bold rounded-lg flex items-center justify-center flex-shrink-0">{currentQ + 1}</span>
                <p className="text-slate-800 font-medium leading-relaxed">{q.question_text}</p>
              </div>
              <div className="space-y-2.5 ml-10">
                {q.question_type === 'mcq' && (q.options || []).map((opt, i) => (
                  <button key={i} onClick={() => setAnswers(p => ({ ...p, [q.id]: opt }))}
                    className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm transition-all ${answers[q.id] === opt ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold' : 'border-slate-200 hover:border-blue-300 text-slate-700'}`}>
                    <span className="font-bold mr-2">{String.fromCharCode(65 + i)}.</span>{opt}
                  </button>
                ))}
                {q.question_type === 'true_false' && ['True', 'False'].map(v => (
                  <button key={v} onClick={() => setAnswers(p => ({ ...p, [q.id]: v }))}
                    className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm transition-all ${answers[q.id] === v ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold' : 'border-slate-200 hover:border-blue-300 text-slate-700'}`}>
                    {v}
                  </button>
                ))}
                {q.question_type === 'short' && (
                  <input value={answers[q.id] || ''} onChange={e => setAnswers(p => ({ ...p, [q.id]: e.target.value }))}
                    placeholder="Your answer..."
                    className="w-full border-2 border-slate-200 focus:border-blue-400 rounded-xl px-4 py-3 text-sm focus:outline-none" />
                )}
              </div>
            </div>
          ) : <p className="text-slate-400 text-center py-8">No questions</p>}
        </div>

        {/* Footer nav */}
        <div className="p-5 border-t border-slate-100 flex items-center justify-between gap-3">
          <div className="flex gap-1 flex-wrap max-w-xs">
            {questions.map((_, i) => (
              <button key={i} onClick={() => setCurrentQ(i)}
                className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors ${i === currentQ ? 'bg-blue-600 text-white' : answers[questions[i]?.id] ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                {i + 1}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {currentQ > 0 && (
              <button onClick={() => setCurrentQ(c => c - 1)} className="px-4 py-2 bg-slate-100 text-slate-600 font-medium rounded-xl text-sm hover:bg-slate-200 transition-colors">Prev</button>
            )}
            {currentQ < questions.length - 1 ? (
              <button onClick={() => setCurrentQ(c => c + 1)} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-xl text-sm hover:bg-blue-500 transition-colors flex items-center gap-1">
                Next <ChevronRight size={14} />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={submitting}
                className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-xl text-sm hover:bg-emerald-500 disabled:opacity-50 transition-colors flex items-center gap-2">
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                Submit Quiz
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────
export default function QuizzesPage() {
  const [enrollments, setEnrollments] = useState([])
  const [selectedOffering, setSelectedOffering] = useState('')
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(true)
  const [attemptModal, setAttemptModal] = useState(null)

  useEffect(() => {
    studentAPI.getEnrollments()
      .then(r => {
        const enr = r.data.data?.enrollments || []
        setEnrollments(enr)
        if (enr.length > 0) setSelectedOffering(String(enr[0].offering_id))
      })
      .finally(() => setLoading(false))
  }, [])

  const fetchQuizzes = useCallback(async () => {
    if (!selectedOffering) return
    try {
      const res = await studentAPI.getOfferingQuizzes(selectedOffering)
      setQuizzes(res.data.data?.quizzes || [])
    } catch { toast.error('Failed to load quizzes') }
  }, [selectedOffering])

  useEffect(() => { fetchQuizzes() }, [selectedOffering])

  const now = new Date()
  const getStatus = (q) => {
    if (q.my_attempt?.status === 'completed') return { label: 'Completed', cls: 'bg-emerald-100 text-emerald-700' }
    if (q.start_time && new Date(q.start_time) > now) return { label: 'Upcoming', cls: 'bg-blue-100 text-blue-700' }
    if (q.end_time && new Date(q.end_time) < now) return { label: 'Expired', cls: 'bg-slate-100 text-slate-500' }
    return { label: 'Available', cls: 'bg-emerald-100 text-emerald-700' }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-800">Quizzes</h1>
          <p className="text-slate-400 text-sm">{quizzes.length} quizzes available</p>
        </div>
        <select value={selectedOffering} onChange={e => setSelectedOffering(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 bg-white min-w-[240px]">
          {enrollments.map(e => <option key={e.offering_id} value={e.offering_id}>{e.course_name}</option>)}
        </select>
      </div>

      {quizzes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-center py-20">
          <PenSquare size={40} className="text-slate-300 mb-3" />
          <p className="font-semibold text-slate-600">No quizzes for this course</p>
        </div>
      ) : (
        <div className="space-y-3">
          {quizzes.map(q => {
            const status = getStatus(q)
            const canAttempt = status.label === 'Available'
            const attempt = q.my_attempt
            return (
              <div key={q.id} className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-sm transition-shadow">
                <div className="flex items-start gap-4">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${canAttempt ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                    <PenSquare size={18} className={canAttempt ? 'text-emerald-600' : 'text-slate-400'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-display font-bold text-slate-800">{q.title}</h3>
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${status.cls}`}>{status.label}</span>
                      {q.is_mandatory && <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Mandatory</span>}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-400 mb-1">
                      <span>{q.total_questions} questions</span>
                      <span>·</span>
                      <span>{q.total_marks} marks</span>
                      <span>·</span>
                      <span><Clock size={10} className="inline mr-0.5" />{q.time_limit_minutes} min</span>
                    </div>
                    {attempt?.status === 'completed' && (
                      <p className="text-sm font-semibold text-emerald-600">
                        Your score: {attempt.score}/{q.total_marks} ({parseFloat(attempt.percentage).toFixed(1)}%)
                      </p>
                    )}
                    {q.start_time && <p className="text-xs text-slate-400">{formatDateTime(q.start_time)} → {q.end_time ? formatDateTime(q.end_time) : '—'}</p>}
                  </div>
                  {canAttempt && (
                    <button onClick={() => setAttemptModal(q)}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-colors flex-shrink-0">
                      Attempt Quiz
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
      {attemptModal && (
        <QuizAttemptModal quiz={attemptModal} onClose={() => setAttemptModal(null)} onSuccess={fetchQuizzes} />
      )}
    </div>
  )
}