import { useState, useRef, useEffect } from 'react'
import { studentAPI } from '../../api/student.api'
import { authStore } from '../../store/authStore'
import toast from 'react-hot-toast'
import {
  BrainCircuit, Send, Loader2, PenSquare,
  Sparkles, RefreshCw, ChevronDown, CheckCircle2, X
} from 'lucide-react'

const DIFFICULTY_CFG = {
  easy:   'bg-emerald-100 text-emerald-700',
  medium: 'bg-blue-100 text-blue-700',
  hard:   'bg-red-100 text-red-700',
}

// ── AI Chatbot Component ───────────────────────────
function Chatbot({ enrollments }) {
  const user = authStore.getUser()
  const [messages, setMessages] = useState([
    { role: 'bot', text: `Hi ${user?.full_name?.split(' ')[0] || 'there'}! 👋 I'm your LMS assistant. Ask me about attendance, fees, results, assignments, or anything else.` }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const endRef = useRef(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = async () => {
    const text = input.trim()
    if (!text) return
    setMessages(p => [...p, { role: 'user', text }])
    setInput('')
    setLoading(true)
    try {
      const res = await studentAPI.sendChatbotMessage({
        message: text,
        session_id: sessionId,
      })
      const data = res.data.data
      if (data?.session_id) setSessionId(data.session_id)
      setMessages(p => [...p, { role: 'bot', text: data?.response || 'I couldn\'t understand that. Please try again.' }])
    } catch {
      setMessages(p => [...p, { role: 'bot', text: 'Sorry, I\'m having trouble responding right now. Please try again.' }])
    } finally { setLoading(false) }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 flex flex-col h-[500px]">
      <div className="p-4 border-b border-slate-100 flex items-center gap-3">
        <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center">
          <BrainCircuit size={18} className="text-purple-600" />
        </div>
        <div>
          <p className="font-semibold text-slate-800 text-sm">LMS Assistant</p>
          <p className="text-xs text-slate-400">Ask anything about your academics</p>
        </div>
        <div className="ml-auto w-2 h-2 bg-emerald-400 rounded-full" title="Online" />
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'bot' && (
              <div className="w-7 h-7 bg-purple-100 rounded-full flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                <BrainCircuit size={13} className="text-purple-600" />
              </div>
            )}
            <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${m.role === 'user' ? 'bg-purple-600 text-white rounded-br-sm' : 'bg-slate-100 text-slate-700 rounded-bl-sm'}`}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-purple-100 rounded-full flex items-center justify-center">
              <BrainCircuit size={13} className="text-purple-600" />
            </div>
            <div className="bg-slate-100 rounded-2xl px-4 py-2.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.1s]" />
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>
      <div className="p-4 border-t border-slate-100 flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') send() }}
          placeholder="Ask about attendance, fee, results..."
          className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-400" />
        <button onClick={send} disabled={!input.trim() || loading}
          className="w-10 h-10 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-colors">
          {loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
        </button>
      </div>
    </div>
  )
}

// ── AI Practice Quiz Generator ─────────────────────
function AIQuizGenerator({ enrollments }) {
  const [form, setForm] = useState({ course_id: '', topic: '', difficulty: 'medium', num_questions: 5 })
  const [quiz, setQuiz] = useState(null)
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [phase, setPhase] = useState('setup') // setup | attempt | result
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleGenerate = async () => {
    if (!form.course_id || !form.topic) { toast.error('Select course and enter topic'); return }
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

  const questions = quiz?.questions_generated || []
  const inputCls = "w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"

  if (phase === 'result' && result) return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <CheckCircle2 size={28} className="text-emerald-600" />
        </div>
        <h3 className="font-display font-bold text-xl text-slate-800">Quiz Complete!</h3>
        <p className="text-5xl font-display font-bold text-emerald-600 mt-2">{parseFloat(result.score || 0).toFixed(1)}%</p>
        <p className="text-slate-500 text-sm mt-1">AI Practice Quiz · {form.topic}</p>
      </div>
      {result.feedback && <p className="text-slate-600 text-sm bg-blue-50 rounded-xl p-4 mb-4">{result.feedback}</p>}
      {result.weak_areas_identified?.length > 0 && (
        <div className="bg-orange-50 rounded-xl p-4 mb-4">
          <p className="text-orange-700 font-semibold text-sm mb-2">Areas to improve:</p>
          <div className="flex flex-wrap gap-2">
            {result.weak_areas_identified.map((w, i) => (
              <span key={i} className="text-xs bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full">{w}</span>
            ))}
          </div>
        </div>
      )}
      <button onClick={reset} className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
        <RefreshCw size={15} /> Generate New Quiz
      </button>
    </div>
  )

  if (phase === 'attempt' && quiz) return (
    <div className="bg-white rounded-2xl border border-slate-200">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="font-display font-bold text-slate-800">AI Practice Quiz</h3>
          <p className="text-slate-400 text-sm">{form.topic} · {questions.length} questions</p>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-xl capitalize ${DIFFICULTY_CFG[form.difficulty]}`}>{form.difficulty}</span>
      </div>
      <div className="p-5 space-y-5">
        {questions.map((q, qi) => (
          <div key={qi} className="space-y-2.5">
            <p className="font-medium text-slate-800 text-sm"><span className="text-blue-600 font-bold mr-1">Q{qi + 1}.</span>{q.question || q.question_text}</p>
            <div className="space-y-1.5 ml-4">
              {(q.options || []).map((opt, oi) => (
                <button key={oi} onClick={() => setAnswers(p => ({ ...p, [qi]: opt }))}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl border text-sm transition-all ${answers[qi] === opt ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold' : 'border-slate-200 hover:border-blue-300'}`}>
                  <span className="font-bold mr-1.5 text-slate-400">{String.fromCharCode(65 + oi)}.</span>{opt}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="p-5 border-t border-slate-100 flex gap-3">
        <button onClick={reset} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium rounded-xl text-sm transition-colors flex items-center gap-2">
          <X size={14} /> Cancel
        </button>
        <button onClick={handleSubmit} disabled={loading || Object.keys(answers).length < questions.length}
          className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
          {loading ? <><Loader2 size={15} className="animate-spin" /> Submitting...</> : <><CheckCircle2 size={15} /> Submit Quiz</>}
        </button>
      </div>
    </div>
  )

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
          <Sparkles size={18} className="text-blue-600" />
        </div>
        <div>
          <h3 className="font-display font-bold text-slate-800">AI Practice Quiz</h3>
          <p className="text-slate-400 text-sm">Auto-generate MCQs for any topic</p>
        </div>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-xs text-slate-500 font-medium mb-1.5">Course *</label>
          <select className={inputCls} value={form.course_id} onChange={e => set('course_id', e.target.value)}>
            <option value="">-- Select Course --</option>
            {enrollments.map(e => <option key={e.course_id} value={e.course_id}>{e.course_name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-500 font-medium mb-1.5">Topic *</label>
          <input className={inputCls} value={form.topic} onChange={e => set('topic', e.target.value)} placeholder="e.g. Object Oriented Programming, SQL Joins..." />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-500 font-medium mb-1.5">Difficulty</label>
            <select className={inputCls} value={form.difficulty} onChange={e => set('difficulty', e.target.value)}>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 font-medium mb-1.5">Number of Questions</label>
            <select className={inputCls} value={form.num_questions} onChange={e => set('num_questions', parseInt(e.target.value))}>
              {[3, 5, 7, 10].map(n => <option key={n} value={n}>{n} questions</option>)}
            </select>
          </div>
        </div>
        <button onClick={handleGenerate} disabled={loading || !form.course_id || !form.topic}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm">
          {loading ? <><Loader2 size={15} className="animate-spin" /> Generating...</> : <><Sparkles size={15} /> Generate Quiz with AI</>}
        </button>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────
export default function AIAssistantPage() {
  const [enrollments, setEnrollments] = useState([])
  const [tab, setTab] = useState('chatbot')

  useEffect(() => {
    studentAPI.getEnrollments()
      .then(r => setEnrollments(r.data.data?.enrollments || []))
      .catch(() => {})
  }, [])

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="font-display font-bold text-2xl text-slate-800">AI Assistant</h1>
        <p className="text-slate-400 text-sm mt-0.5">Chatbot support + AI-generated practice quizzes</p>
      </div>

      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {[['chatbot', '🤖 Chatbot'], ['quiz', '✨ Practice Quiz']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'chatbot' && <Chatbot enrollments={enrollments} />}
      {tab === 'quiz'    && <AIQuizGenerator enrollments={enrollments} />}
    </div>
  )
}