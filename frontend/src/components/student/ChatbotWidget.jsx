// ═══════════════════════════════════════════════════════════════
//  ChatbotWidget.jsx  —  Floating AI Chatbot Bubble (Student)
//  → frontend/src/components/student/ChatbotWidget.jsx
//  Drop this inside DashboardLayout for student role only
// ═══════════════════════════════════════════════════════════════
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  BrainCircuit, Send, Loader2, X, Minus, MessageCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { studentAPI } from '../../api/student.api'
import { authStore } from '../../store/authStore'

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

export default function ChatbotWidget() {
  const user      = authStore.getUser()
  const firstName = user?.full_name?.split(' ')[0] || 'there'

  const [open, setOpen]         = useState(false)
  const [minimized, setMin]     = useState(false)
  const [messages, setMessages] = useState([
    { role: 'bot', text: `Hi ${firstName}! 👋 I'm your LMS assistant. Ask me about attendance, fees, results, quizzes, or anything academic.` }
  ])
  const [input, setInput]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSId] = useState(null)
  const [unread, setUnread] = useState(0)

  const endRef  = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (open) { setUnread(0); setTimeout(() => inputRef.current?.focus(), 100) }
  }, [open])

  useEffect(() => {
    if (open && !minimized) endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open, minimized])

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return
    setMessages(p => [...p, { role: 'user', text }])
    setInput('')
    setLoading(true)
    try {
      const res = await studentAPI.sendChatbotMessage({ message: text, session_id: sessionId })
      const d   = res.data.data
      if (d?.session_id) setSId(d.session_id)
      const reply = d?.response || "I couldn't understand that. Please try again."
      setMessages(p => [...p, { role: 'bot', text: reply }])
      if (!open || minimized) setUnread(n => n + 1)
    } catch {
      setMessages(p => [...p, { role: 'bot', text: "Sorry, I'm having trouble right now. Please try again." }])
    } finally { setLoading(false) }
  }

  const handleKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }

  return createPortal(
    <>
      <style>{`
        @keyframes spin      { to { transform: rotate(360deg) } }
        @keyframes chatIn    { from{opacity:0;transform:scale(0.85) translateY(20px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes bounceIn  { 0%{transform:scale(0.7)} 60%{transform:scale(1.1)} 100%{transform:scale(1)} }
        @keyframes blink     { 0%,80%,100%{opacity:0} 40%{opacity:1} }
        .cbot-scroll::-webkit-scrollbar { width: 4px }
        .cbot-scroll::-webkit-scrollbar-thumb { background: var(--neu-border); border-radius: 4px }
        .cbot-scroll::-webkit-scrollbar-track { background: transparent }
      `}</style>

      {/* ── Floating Button ── */}
      {!open && (
        <button
          onClick={() => { setOpen(true); setMin(false) }}
          style={{
            position: 'fixed', bottom: '1.75rem', right: '1.75rem', zIndex: 9999,
            width: 56, height: 56, borderRadius: '50%', border: 'none', cursor: 'pointer',
            background: 'linear-gradient(145deg, #a78bfa, #7c5cdb)',
            boxShadow: '6px 6px 18px var(--neu-shadow-dark), -3px -3px 10px var(--neu-shadow-light), 0 6px 24px rgba(167,139,250,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
            animation: 'bounceIn 0.5s ease',
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1) translateY(-2px)'; e.currentTarget.style.boxShadow = '8px 8px 22px var(--neu-shadow-dark), -4px -4px 12px var(--neu-shadow-light), 0 8px 28px rgba(167,139,250,0.55)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '6px 6px 18px var(--neu-shadow-dark), -3px -3px 10px var(--neu-shadow-light), 0 6px 24px rgba(167,139,250,0.45)' }}
          title="AI Assistant"
        >
          <BrainCircuit size={24} />
          {unread > 0 && (
            <span style={{
              position: 'absolute', top: -4, right: -4,
              width: 20, height: 20, borderRadius: '50%',
              background: '#f87171', color: '#fff',
              fontSize: '0.65rem', fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(248,113,113,0.5)',
              border: '2px solid var(--neu-surface)',
            }}>{unread}</span>
          )}
        </button>
      )}

      {/* ── Chat Window ── */}
      {open && (
        <div style={{
          position: 'fixed', bottom: '1.75rem', right: '1.75rem', zIndex: 9999,
          width: 360,
          animation: 'chatIn 0.3s cubic-bezier(0.34,1.56,0.64,1)',
          display: 'flex', flexDirection: 'column',
          ...neu({ borderRadius: '1.5rem', padding: 0, overflow: 'hidden' }),
          boxShadow: '10px 10px 30px var(--neu-shadow-dark), -5px -5px 15px var(--neu-shadow-light), 0 8px 32px rgba(167,139,250,0.2)',
        }}>

          {/* Header */}
          <div style={{
            padding: '0.9rem 1.1rem',
            background: 'linear-gradient(135deg, #a78bfa22, #7c5cdb11)',
            borderBottom: '1px solid var(--neu-border)',
            display: 'flex', alignItems: 'center', gap: '0.75rem',
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: '0.75rem', flexShrink: 0,
              background: 'linear-gradient(145deg, #a78bfa, #7c5cdb)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '3px 3px 8px var(--neu-shadow-dark), -2px -2px 5px var(--neu-shadow-light), 0 4px 12px rgba(167,139,250,0.35)',
            }}>
              <BrainCircuit size={18} style={{ color: '#fff' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--neu-text-primary)', fontFamily: 'Outfit, sans-serif' }}>LMS Assistant</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3ecf8e', boxShadow: '0 0 5px #3ecf8e88' }} />
                <span style={{ fontSize: '0.65rem', color: 'var(--neu-text-ghost)' }}>Online · Ask me anything</span>
              </div>
            </div>
            {/* Controls */}
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              <button onClick={() => setMin(p => !p)}
                style={{ width: 28, height: 28, borderRadius: '0.5rem', border: 'none', cursor: 'pointer', background: 'var(--neu-surface-deep)', color: 'var(--neu-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '2px 2px 5px var(--neu-shadow-dark), -1px -1px 3px var(--neu-shadow-light)' }}>
                <Minus size={12} />
              </button>
              <button onClick={() => setOpen(false)}
                style={{ width: 28, height: 28, borderRadius: '0.5rem', border: 'none', cursor: 'pointer', background: 'var(--neu-surface-deep)', color: 'var(--neu-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '2px 2px 5px var(--neu-shadow-dark), -1px -1px 3px var(--neu-shadow-light)' }}>
                <X size={12} />
              </button>
            </div>
          </div>

          {/* Messages — hidden when minimized */}
          {!minimized && (
            <>
              <div className="cbot-scroll" style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: 380, minHeight: 200 }}>
                {messages.map((m, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', gap: '0.4rem', alignItems: 'flex-end' }}>
                    {m.role === 'bot' && (
                      <div style={{
                        width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                        background: 'linear-gradient(145deg, #a78bfa, #7c5cdb)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '2px 2px 6px var(--neu-shadow-dark)',
                      }}>
                        <BrainCircuit size={12} style={{ color: '#fff' }} />
                      </div>
                    )}
                    <div style={{
                      maxWidth: '78%', padding: '0.6rem 0.9rem',
                      borderRadius: m.role === 'user' ? '1rem 1rem 0.25rem 1rem' : '1rem 1rem 1rem 0.25rem',
                      fontSize: '0.82rem', lineHeight: 1.55,
                      ...(m.role === 'user' ? {
                        background: 'linear-gradient(145deg, #a78bfa, #7c5cdb)',
                        color: '#fff',
                        boxShadow: '3px 3px 10px var(--neu-shadow-dark), 0 4px 14px rgba(167,139,250,0.35)',
                      } : {
                        background: 'var(--neu-surface)',
                        color: 'var(--neu-text-primary)',
                        boxShadow: '3px 3px 8px var(--neu-shadow-dark), -2px -2px 5px var(--neu-shadow-light)',
                        border: '1px solid var(--neu-border)',
                      }),
                    }}>
                      {m.text}
                    </div>
                  </div>
                ))}

                {/* Typing indicator */}
                {loading && (
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.4rem' }}>
                    <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(145deg, #a78bfa, #7c5cdb)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '2px 2px 6px var(--neu-shadow-dark)' }}>
                      <BrainCircuit size={12} style={{ color: '#fff' }} />
                    </div>
                    <div style={{ ...neuInset({ padding: '0.6rem 0.9rem', borderRadius: '1rem 1rem 1rem 0.25rem' }), display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                      {[0, 0.15, 0.3].map((delay, i) => (
                        <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#a78bfa', animation: `blink 1.2s ${delay}s infinite` }} />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={endRef} />
              </div>

              {/* Input */}
              <div style={{ padding: '0.75rem', borderTop: '1px solid var(--neu-border)', display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                <div style={{ flex: 1, ...neuInset({ borderRadius: '0.875rem', padding: 0 }) }}>
                  <textarea
                    ref={inputRef}
                    rows={1}
                    value={input}
                    onChange={e => { setInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 80) + 'px' }}
                    onKeyDown={handleKey}
                    placeholder="Ask about attendance, fee, results…"
                    style={{
                      width: '100%', background: 'transparent', border: 'none', outline: 'none',
                      resize: 'none', padding: '0.6rem 0.85rem', fontSize: '0.82rem',
                      color: 'var(--neu-text-primary)', fontFamily: "'DM Sans', sans-serif",
                      lineHeight: 1.5, maxHeight: 80, overflow: 'auto', boxSizing: 'border-box',
                    }}
                  />
                </div>
                <button onClick={send} disabled={!input.trim() || loading}
                  style={{
                    width: 38, height: 38, borderRadius: '0.75rem', border: 'none', flexShrink: 0,
                    background: input.trim() && !loading ? 'linear-gradient(145deg, #a78bfa, #7c5cdb)' : 'var(--neu-surface-deep)',
                    color: input.trim() && !loading ? '#fff' : 'var(--neu-text-ghost)',
                    cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: input.trim() && !loading
                      ? '4px 4px 12px var(--neu-shadow-dark), -2px -2px 6px var(--neu-shadow-light), 0 4px 14px rgba(167,139,250,0.35)'
                      : 'inset 2px 2px 5px var(--neu-shadow-dark), inset -1px -1px 3px var(--neu-shadow-light)',
                    transition: 'all 0.15s',
                  }}>
                  {loading ? <Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Send size={15} style={{ transform: 'translateX(1px)' }} />}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>,
    document.body
  )
}