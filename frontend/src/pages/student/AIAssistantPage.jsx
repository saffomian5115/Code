// ═══════════════════════════════════════════════════════════════
//  AIAssistantPage.jsx  (Student)  —  Neumorphic
//  → frontend/src/pages/student/AIAssistantPage.jsx
//  Full-page AI Chatbot  (Practice Quiz is now a separate page)
// ═══════════════════════════════════════════════════════════════
import { useState, useRef, useEffect } from 'react'
import {
  BrainCircuit, Send, Loader2, RefreshCw, Sparkles,
} from 'lucide-react'
import { studentAPI } from '../../api/student.api'
import { authStore } from '../../store/authStore'

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

/* ─── Suggested prompts ──────────────────────────────────────── */
const SUGGESTIONS = [
  { icon: '📊', text: 'What is my attendance status?' },
  { icon: '💳', text: 'Check my fee voucher status' },
  { icon: '🎓', text: 'What is my current CGPA?' },
  { icon: '📝', text: 'Show my recent assignment grades' },
]

/* ─── Message bubble ─────────────────────────────────────────── */
function Bubble({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div style={{
      display: 'flex',
      flexDirection: isUser ? 'row-reverse' : 'row',
      alignItems: 'flex-end',
      gap: '0.5rem',
      animation: 'fadeUp 0.22s ease both',
    }}>
      {/* Bot avatar */}
      {!isUser && (
        <div style={{
          width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(145deg, #a78bfa, #7c5cdb)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '3px 3px 8px var(--neu-shadow-dark), -2px -2px 5px var(--neu-shadow-light)',
        }}>
          <BrainCircuit size={14} style={{ color: '#fff' }} />
        </div>
      )}

      <div style={{
        maxWidth: '72%',
        padding: '0.7rem 1rem',
        borderRadius: isUser ? '1.1rem 1.1rem 0.3rem 1.1rem' : '1.1rem 1.1rem 1.1rem 0.3rem',
        fontSize: '0.86rem', lineHeight: 1.6,
        wordBreak: 'break-word', whiteSpace: 'pre-wrap',
        ...(isUser ? {
          background: 'linear-gradient(145deg, #a78bfa, #7c5cdb)',
          color: '#fff',
          boxShadow: '4px 4px 12px var(--neu-shadow-dark), -2px -2px 6px var(--neu-shadow-light), 0 4px 16px rgba(167,139,250,0.35)',
        } : {
          background: 'var(--neu-surface)',
          color: 'var(--neu-text-primary)',
          boxShadow: '4px 4px 10px var(--neu-shadow-dark), -2px -2px 6px var(--neu-shadow-light)',
          border: '1px solid var(--neu-border)',
        }),
      }}>
        {msg.text}
      </div>
    </div>
  )
}

/* ─── Typing indicator ───────────────────────────────────────── */
function TypingDots() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(145deg, #a78bfa, #7c5cdb)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '3px 3px 8px var(--neu-shadow-dark)' }}>
        <BrainCircuit size={14} style={{ color: '#fff' }} />
      </div>
      <div style={{ ...neuInset({ padding: '0.7rem 1rem', borderRadius: '1.1rem 1.1rem 1.1rem 0.3rem' }), display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
        {[0, 0.18, 0.36].map((d, i) => (
          <span key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: '#a78bfa', animation: `blink 1.2s ${d}s infinite` }} />
        ))}
      </div>
    </div>
  )
}

/* ─── Main Page ──────────────────────────────────────────────── */
export default function AIAssistantPage() {
  const user      = authStore.getUser()
  const firstName = user?.full_name?.split(' ')[0] || 'there'

  const [messages, setMessages] = useState([
    { role: 'bot', text: `Hi ${firstName}! 👋 I'm your LMS assistant. Ask me about attendance, fees, results, assignments, quizzes, or anything academic.` }
  ])
  const [input, setInput]     = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSId]   = useState(null)

  const endRef   = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = async (text) => {
    const msg = (text || input).trim()
    if (!msg || loading) return
    setMessages(p => [...p, { role: 'user', text: msg }])
    setInput('')
    setLoading(true)
    try {
      const res = await studentAPI.sendChatbotMessage({ message: msg, session_id: sessionId })
      const d   = res.data.data
      if (d?.session_id) setSId(d.session_id)
      setMessages(p => [...p, { role: 'bot', text: d?.response || "I couldn't understand that. Please try again." }])
    } catch {
      setMessages(p => [...p, { role: 'bot', text: "Sorry, I'm having trouble right now. Please try again." }])
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const reset = () => {
    setMessages([{ role: 'bot', text: `Hi ${firstName}! 👋 I'm your LMS assistant. Ask me about attendance, fees, results, assignments, quizzes, or anything academic.` }])
    setInput('')
    setSId(null)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const showSuggestions = messages.length <= 1

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 130px)', minHeight: 500 }}>
      <style>{`
        @keyframes spin    { to { transform: rotate(360deg) } }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
        @keyframes blink   { 0%,80%,100%{opacity:0.15} 40%{opacity:1} }
        .chat-scroll::-webkit-scrollbar { width: 5px }
        .chat-scroll::-webkit-scrollbar-thumb { background: var(--neu-border); border-radius: 5px }
        .chat-scroll::-webkit-scrollbar-track { background: transparent }
        textarea::-webkit-scrollbar { width: 4px }
        textarea::-webkit-scrollbar-thumb { background: var(--neu-border); border-radius: 4px }
      `}</style>

      {/* ── Page title ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ ...neuInset({ width: 44, height: 44, borderRadius: '0.875rem' }), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa' }}>
            <BrainCircuit size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.55rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit, sans-serif', marginBottom: '0.1rem' }}>
              AI Assistant
            </h1>
            <p style={{ fontSize: '0.78rem', color: 'var(--neu-text-ghost)' }}>Ask anything about your academics</p>
          </div>
        </div>

        {/* Reset button */}
        <button onClick={reset}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.5rem 0.9rem', borderRadius: '0.75rem', border: 'none', cursor: 'pointer',
            background: 'var(--neu-surface)',
            boxShadow: '4px 4px 10px var(--neu-shadow-dark), -2px -2px 6px var(--neu-shadow-light)',
            color: 'var(--neu-text-muted)', fontSize: '0.75rem', fontWeight: 600,
            fontFamily: "'DM Sans', sans-serif",
          }}>
          <RefreshCw size={13} /> New Chat
        </button>
      </div>

      {/* ── Chat container ── */}
      <div style={{ ...neu({ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', flex: 1 }) }}>

        {/* Messages */}
        <div className="chat-scroll" style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>

          {messages.map((m, i) => <Bubble key={i} msg={m} />)}
          {loading && <TypingDots />}

          {/* Suggestion chips — only when fresh chat */}
          {showSuggestions && !loading && (
            <div style={{ marginTop: '0.5rem' }}>
              <p style={{ fontSize: '0.7rem', color: 'var(--neu-text-ghost)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.65rem' }}>
                Quick Suggestions
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.55rem' }}>
                {SUGGESTIONS.map((s, i) => (
                  <button key={i} onClick={() => send(s.text)}
                    style={{
                      textAlign: 'left', border: 'none', cursor: 'pointer',
                      padding: '0.7rem 0.9rem', borderRadius: '0.875rem',
                      background: 'var(--neu-surface-deep)',
                      boxShadow: 'inset 3px 3px 7px var(--neu-shadow-dark), inset -2px -2px 5px var(--neu-shadow-light)',
                      color: 'var(--neu-text-secondary)', fontSize: '0.8rem',
                      fontFamily: "'DM Sans', sans-serif", lineHeight: 1.4,
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.boxShadow = '4px 4px 10px var(--neu-shadow-dark), -2px -2px 6px var(--neu-shadow-light)'
                      e.currentTarget.style.background = 'var(--neu-surface)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.boxShadow = 'inset 3px 3px 7px var(--neu-shadow-dark), inset -2px -2px 5px var(--neu-shadow-light)'
                      e.currentTarget.style.background = 'var(--neu-surface-deep)'
                    }}>
                    <span style={{ fontSize: '1rem', flexShrink: 0 }}>{s.icon}</span>
                    <span>{s.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={endRef} />
        </div>

        {/* ── Input bar ── */}
        <div style={{ padding: '0.9rem 1.25rem', borderTop: '1px solid var(--neu-border)', background: 'var(--neu-surface)', display: 'flex', alignItems: 'flex-end', gap: '0.65rem' }}>

          {/* Bot icon */}
          <div style={{ width: 36, height: 36, borderRadius: '0.75rem', flexShrink: 0, background: 'linear-gradient(145deg, #a78bfa, #7c5cdb)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '3px 3px 8px var(--neu-shadow-dark), 0 4px 12px rgba(167,139,250,0.3)' }}>
            <Sparkles size={16} style={{ color: '#fff' }} />
          </div>

          {/* Textarea */}
          <div style={{ flex: 1, ...neuInset({ borderRadius: '1rem', padding: 0 }), display: 'flex', alignItems: 'flex-end' }}>
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={e => {
                setInput(e.target.value)
                e.target.style.height = 'auto'
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
              }}
              onKeyDown={handleKey}
              placeholder="Ask about attendance, fee, results, quizzes…"
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                resize: 'none', padding: '0.7rem 0.95rem',
                fontSize: '0.86rem', color: 'var(--neu-text-primary)',
                fontFamily: "'DM Sans', sans-serif", lineHeight: 1.55,
                maxHeight: 120, overflow: 'auto',
              }}
            />
          </div>

          {/* Send button */}
          <button onClick={() => send()}
            disabled={!input.trim() || loading}
            style={{
              width: 44, height: 44, borderRadius: '0.875rem', border: 'none', flexShrink: 0,
              background: input.trim() && !loading
                ? 'linear-gradient(145deg, #a78bfa, #7c5cdb)'
                : 'var(--neu-surface-deep)',
              boxShadow: input.trim() && !loading
                ? '5px 5px 14px var(--neu-shadow-dark), -3px -3px 8px var(--neu-shadow-light), 0 4px 16px rgba(167,139,250,0.4)'
                : 'inset 3px 3px 7px var(--neu-shadow-dark), inset -2px -2px 5px var(--neu-shadow-light)',
              color: input.trim() && !loading ? '#fff' : 'var(--neu-text-ghost)',
              cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.18s',
            }}
            onMouseEnter={e => { if (input.trim() && !loading) e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)' }}
            onMouseLeave={e => e.currentTarget.style.transform = ''}>
            {loading
              ? <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} />
              : <Send size={18} style={{ transform: 'translateX(1px)' }} />}
          </button>
        </div>

        {/* Hint */}
        <p style={{ textAlign: 'center', fontSize: '0.65rem', color: 'var(--neu-text-ghost)', padding: '0.3rem 0 0.55rem' }}>
          Press{' '}
          <kbd style={{ background: 'var(--neu-surface)', boxShadow: 'var(--neu-raised)', padding: '0.1rem 0.4rem', borderRadius: '0.3rem', fontSize: '0.6rem', fontFamily: 'monospace' }}>Enter</kbd>
          {' '}to send ·{' '}
          <kbd style={{ background: 'var(--neu-surface)', boxShadow: 'var(--neu-raised)', padding: '0.1rem 0.4rem', borderRadius: '0.3rem', fontSize: '0.6rem', fontFamily: 'monospace' }}>Shift+Enter</kbd>
          {' '}for new line
        </p>
      </div>
    </div>
  )
}