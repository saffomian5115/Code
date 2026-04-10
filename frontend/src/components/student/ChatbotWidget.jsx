// ═══════════════════════════════════════════════════════════════
//  ChatbotWidget.jsx  —  Floating AI Chatbot Bubble (Student)
//  → frontend/src/components/student/ChatbotWidget.jsx
//  Drop this inside DashboardLayout for student role only
//  ** Now with full Markdown-like formatting & rich responses **
// ═══════════════════════════════════════════════════════════════
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  BrainCircuit, Send, Loader2, X, Minus, MessageCircle, Copy, Check,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { studentAPI } from '../../api/student.api'
import { authStore } from '../../store/authStore'

/* ─── Neumorphic helpers ────────────────────────────────────── */
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

/* ─── Markdown-like renderer (same as AIAssistantPage) ─────── */
function renderMarkdown(text) {
  if (!text) return []

  const lines = text.split('\n')
  const elements = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (line.trim() === '') {
      elements.push({ type: 'spacer', key: i })
      i++
      continue
    }
    if (line.startsWith('## ')) {
      elements.push({ type: 'h2', content: line.slice(3), key: i })
      i++
      continue
    }
    if (line.startsWith('### ')) {
      elements.push({ type: 'h3', content: line.slice(4), key: i })
      i++
      continue
    }
    if (line.trimStart().startsWith('- ') || line.trimStart().startsWith('* ')) {
      const items = []
      while (i < lines.length && (lines[i].trimStart().startsWith('- ') || lines[i].trimStart().startsWith('* '))) {
        items.push(lines[i].replace(/^\s*[-*]\s/, ''))
        i++
      }
      elements.push({ type: 'ul', items, key: i })
      continue
    }
    if (/^\d+\.\s/.test(line.trimStart())) {
      const items = []
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trimStart())) {
        items.push(lines[i].replace(/^\d+\.\s/, ''))
        i++
      }
      elements.push({ type: 'ol', items, key: i })
      continue
    }
    elements.push({ type: 'p', content: line, key: i })
    i++
  }
  return elements
}

/* ─── Inline formatting: **bold**, *italic*, `code` ─────────── */
function InlineText({ text }) {
  const parts = []
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g
  let last = 0
  let match

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(<span key={last}>{text.slice(last, match.index)}</span>)
    }
    const raw = match[0]
    if (raw.startsWith('**')) {
      parts.push(<strong key={match.index} style={{ fontWeight: 800, color: 'inherit' }}>{raw.slice(2, -2)}</strong>)
    } else if (raw.startsWith('*')) {
      parts.push(<em key={match.index}>{raw.slice(1, -1)}</em>)
    } else if (raw.startsWith('`')) {
      parts.push(
        <code key={match.index} style={{
          background: 'rgba(167,139,250,0.15)',
          color: '#a78bfa',
          padding: '0.1em 0.35em',
          borderRadius: '0.3em',
          fontSize: '0.85em',
          fontFamily: 'monospace',
        }}>{raw.slice(1, -1)}</code>
      )
    }
    last = match.index + raw.length
  }
  if (last < text.length) {
    parts.push(<span key={last}>{text.slice(last)}</span>)
  }
  return <>{parts}</>
}

/* ─── Rendered message content ───────────────────────────────── */
function MessageContent({ text, isUser }) {
  const elements = renderMarkdown(text)
  const color = isUser ? 'rgba(255,255,255,0.9)' : 'var(--neu-text-primary)'

  return (
    <div style={{ fontSize: '0.82rem', lineHeight: 1.55, wordBreak: 'break-word' }}>
      {elements.map((el) => {
        if (el.type === 'spacer') {
          return <div key={el.key} style={{ height: '0.3rem' }} />
        }
        if (el.type === 'h2') {
          return (
            <p key={el.key} style={{
              fontWeight: 800, fontSize: '0.85rem',
              color, fontFamily: 'Outfit, sans-serif',
              marginBottom: '0.2rem', marginTop: '0.3rem',
            }}>
              <InlineText text={el.content} />
            </p>
          )
        }
        if (el.type === 'h3') {
          return (
            <p key={el.key} style={{
              fontWeight: 700, fontSize: '0.8rem',
              color, marginBottom: '0.15rem', marginTop: '0.25rem',
            }}>
              <InlineText text={el.content} />
            </p>
          )
        }
        if (el.type === 'ul') {
          return (
            <ul key={el.key} style={{
              paddingLeft: '1rem', margin: '0.15rem 0',
              display: 'flex', flexDirection: 'column', gap: '0.1rem',
            }}>
              {el.items.map((item, idx) => (
                <li key={idx} style={{ color, listStyleType: 'disc' }}>
                  <InlineText text={item} />
                </li>
              ))}
            </ul>
          )
        }
        if (el.type === 'ol') {
          return (
            <ol key={el.key} style={{
              paddingLeft: '1.2rem', margin: '0.15rem 0',
              display: 'flex', flexDirection: 'column', gap: '0.1rem',
            }}>
              {el.items.map((item, idx) => (
                <li key={idx} style={{ color, listStyleType: 'decimal' }}>
                  <InlineText text={item} />
                </li>
              ))}
            </ol>
          )
        }
        return (
          <p key={el.key} style={{ margin: 0, color }}>
            <InlineText text={el.content} />
          </p>
        )
      })}
    </div>
  )
}

/* ─── Copy button (shown on hover) ───────────────────────────── */
function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      const el = document.createElement('textarea')
      el.value = text
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    }
  }

  return (
    <button
      onClick={handleCopy}
      title="Copy message"
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '0.2rem',
        borderRadius: '0.3rem',
        color: copied ? '#3ecf8e' : 'var(--neu-text-ghost)',
        display: 'flex',
        alignItems: 'center',
        opacity: 0,
        transition: 'opacity 0.15s, color 0.15s',
        flexShrink: 0,
      }}
      className="cbot-copy-btn"
    >
      {copied ? <Check size={10} /> : <Copy size={10} />}
    </button>
  )
}

/* ─── Typing indicator with rotating messages (same as AI page) ── */
const LOADING_MESSAGES = [
  "Aapki request process ho rahi hai...",
  "Data fetch kar raha hoon, thoda intezaar karein...",
  "Aapke sawaal ka jawab soch raha hoon...",
  "LMS se relevant information la raha hoon...",
  "Aapko behtareen jawab dene ki koshish kar raha hoon...",
  "AI engine chalu hai, bas thoda sa aur...",
]

function TypingDots() {
  const [displayText, setDisplayText] = useState("")
  const [charIndex, setCharIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const getRandomMessage = () => LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)]
  const [currentMessage, setCurrentMessage] = useState(() => getRandomMessage())

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (charIndex < currentMessage.length) {
          setDisplayText(prev => prev + currentMessage[charIndex])
          setCharIndex(prev => prev + 1)
        } else {
          setIsDeleting(true)
        }
      } else {
        if (charIndex > 0) {
          setDisplayText(prev => prev.slice(0, -1))
          setCharIndex(prev => prev - 1)
        } else {
          setIsDeleting(false)
          setCurrentMessage(getRandomMessage())
        }
      }
    }, isDeleting ? 80 : 120)
    return () => clearTimeout(timeout)
  }, [charIndex, isDeleting, currentMessage])

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.4rem' }}>
      <div style={{
        width: 26, height: 26, borderRadius: '50%',
        background: 'linear-gradient(145deg, #a78bfa, #7c5cdb)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '2px 2px 6px var(--neu-shadow-dark)',
      }}>
        <BrainCircuit size={12} style={{ color: '#fff' }} />
      </div>
      <div style={{
        ...neu({ padding: '0.6rem 0.9rem', borderRadius: '1rem 1rem 1rem 0.25rem' }),
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
      }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--neu-text-primary)' }}>
          {displayText}
        </span>
        <span style={{
          display: 'inline-block',
          width: '2px',
          height: '0.9rem',
          backgroundColor: '#a78bfa',
          animation: 'blinkCursor 1s step-end infinite',
        }} />
      </div>
    </div>
  )
}

/* ─── Suggested prompts (compact for widget) ──────────────────── */
const SUGGESTIONS = [
  { icon: '📊', text: 'Meri attendance?' },
  { icon: '💳', text: 'Fee voucher status?' },
  { icon: '🎓', text: 'Mera CGPA?' },
  { icon: '📝', text: 'Enrolled courses?' },
]

/* ─── Main Widget Component ──────────────────────────────────── */
export default function ChatbotWidget() {
  const user = authStore.getUser()
  const firstName = user?.full_name?.split(' ')[0] || user?.full_name || 'there'

  const [open, setOpen] = useState(false)
  const [minimized, setMin] = useState(false)
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text: `Assalam o Alaikum ${firstName}! 👋\n\nMain **LMS Assistant** hoon. Mujhse pooch sakte ho:\n- 📊 Apni **attendance** aur **CGPA**\n- 💳 **Fee vouchers** ka status\n- 📚 **Courses** aur subjects ke topics\n\nKya poochna hai?`
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSId] = useState(null)
  const [unread, setUnread] = useState(0)

  const endRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (open) {
      setUnread(0)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  useEffect(() => {
    if (open && !minimized) endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open, minimized])

  const send = async (textOverride) => {
    const text = (textOverride || input).trim()
    if (!text || loading) return
    setMessages(p => [...p, { role: 'user', text }])
    setInput('')
    setLoading(true)
    try {
      const res = await studentAPI.sendChatbotMessage({ message: text, session_id: sessionId })
      const d = res.data.data
      if (d?.session_id) setSId(d.session_id)
      const reply = d?.response || "Samajh nahi aaya. Dobara try karein."
      setMessages(p => [...p, { role: 'bot', text: reply }])
      if (!open || minimized) setUnread(n => n + 1)
    } catch {
      setMessages(p => [...p, { role: 'bot', text: "Sorry, abhi AI service se connection nahi ho raha. Thodi der baad try karein." }])
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const resetChat = () => {
    setMessages([{
      role: 'bot',
      text: `Assalam o Alaikum ${firstName}! 👋\n\nMain **LMS Assistant** hoon. Mujhse pooch sakte ho:\n- 📊 Apni **attendance** aur **CGPA**\n- 💳 **Fee vouchers** ka status\n- 📚 **Courses** aur subjects ke topics\n\nKya poochna hai?`
    }])
    setSId(null)
    setInput('')
    setUnread(0)
  }

  const showSuggestions = messages.length <= 1 && !loading

  return createPortal(
    <>
      <style>{`
        @keyframes spin      { to { transform: rotate(360deg) } }
        @keyframes chatIn    { from{opacity:0;transform:scale(0.85) translateY(20px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes bounceIn  { 0%{transform:scale(0.7)} 60%{transform:scale(1.1)} 100%{transform:scale(1)} }
        @keyframes blinkCursor { 0%,100%{opacity:1} 50%{opacity:0} }
        .cbot-scroll::-webkit-scrollbar { width: 4px }
        .cbot-scroll::-webkit-scrollbar-thumb { background: var(--neu-border); border-radius: 4px }
        .cbot-scroll::-webkit-scrollbar-track { background: transparent }
        .cbot-msg:hover .cbot-copy-btn { opacity: 1 !important; }
        .cbot-send-btn:active { transform: scale(0.96); }
      `}</style>

      {/* Floating Button */}
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

      {/* Chat Window */}
      {open && (
        <div style={{
          position: 'fixed', bottom: '1.75rem', right: '1.75rem', zIndex: 9999,
          width: 380,
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
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              <button onClick={() => setMin(p => !p)}
                style={{ width: 28, height: 28, borderRadius: '0.5rem', border: 'none', cursor: 'pointer', background: 'var(--neu-surface-deep)', color: 'var(--neu-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '2px 2px 5px var(--neu-shadow-dark), -1px -1px 3px var(--neu-shadow-light)' }}>
                <Minus size={12} />
              </button>
              <button onClick={() => { setOpen(false); setMin(false) }}
                style={{ width: 28, height: 28, borderRadius: '0.5rem', border: 'none', cursor: 'pointer', background: 'var(--neu-surface-deep)', color: 'var(--neu-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '2px 2px 5px var(--neu-shadow-dark), -1px -1px 3px var(--neu-shadow-light)' }}>
                <X size={12} />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          {!minimized && (
            <>
              <div className="cbot-scroll" style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: 400, minHeight: 280 }}>
                {messages.map((m, idx) => (
                  <div key={idx} className="cbot-msg" style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', gap: '0.4rem', alignItems: 'flex-end' }}>
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
                      <MessageContent text={m.text} isUser={m.role === 'user'} />
                      {m.role === 'bot' && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.2rem' }}>
                          <CopyBtn text={m.text} />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {loading && <TypingDots />}

                {/* Suggestions */}
                {showSuggestions && (
                  <div style={{ marginTop: '0.3rem' }}>
                    <p style={{ fontSize: '0.65rem', color: 'var(--neu-text-ghost)', fontWeight: 600, marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
                      Quick Suggestions
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.45rem' }}>
                      {SUGGESTIONS.map((s, i) => (
                        <button
                          key={i}
                          onClick={() => send(s.text)}
                          style={{
                            textAlign: 'left', border: 'none', cursor: 'pointer',
                            padding: '0.5rem 0.7rem', borderRadius: '0.75rem',
                            background: 'var(--neu-surface-deep)',
                            boxShadow: 'inset 2px 2px 5px var(--neu-shadow-dark), inset -1px -1px 3px var(--neu-shadow-light)',
                            color: 'var(--neu-text-secondary)', fontSize: '0.7rem',
                            fontFamily: "'DM Sans', sans-serif", lineHeight: 1.3,
                            display: 'flex', alignItems: 'center', gap: '0.4rem',
                            transition: 'all 0.1s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '3px 3px 7px var(--neu-shadow-dark), -2px -2px 5px var(--neu-shadow-light)' }}
                          onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'inset 2px 2px 5px var(--neu-shadow-dark), inset -1px -1px 3px var(--neu-shadow-light)' }}
                        >
                          <span style={{ fontSize: '0.9rem' }}>{s.icon}</span>
                          <span>{s.text}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div ref={endRef} />
              </div>

              {/* Input Area */}
              <div style={{ padding: '0.75rem', borderTop: '1px solid var(--neu-border)', display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                <div style={{ flex: 1, ...neuInset({ borderRadius: '0.875rem', padding: 0 }) }}>
                  <textarea
                    ref={inputRef}
                    rows={1}
                    value={input}
                    onChange={e => { setInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 80) + 'px' }}
                    onKeyDown={handleKey}
                    placeholder="Attendance, fee, CGPA, ya koi subject…"
                    style={{
                      width: '100%', background: 'transparent', border: 'none', outline: 'none',
                      resize: 'none', padding: '0.6rem 0.85rem', fontSize: '0.82rem',
                      color: 'var(--neu-text-primary)', fontFamily: "'DM Sans', sans-serif",
                      lineHeight: 1.5, maxHeight: 80, overflow: 'auto', boxSizing: 'border-box',
                    }}
                  />
                </div>
                <button onClick={() => send()} disabled={!input.trim() || loading}
                  className="cbot-send-btn"
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

              {/* Hint */}
              <div style={{ padding: '0.2rem 0.75rem 0.6rem', textAlign: 'center' }}>
                <p style={{ fontSize: '0.55rem', color: 'var(--neu-text-ghost)', margin: 0 }}>
                  Press <kbd style={{ background: 'var(--neu-surface)', boxShadow: 'var(--neu-raised)', padding: '0.05rem 0.3rem', borderRadius: '0.2rem', fontSize: '0.5rem' }}>Enter</kbd> to send · <kbd style={{ background: 'var(--neu-surface)', boxShadow: 'var(--neu-raised)', padding: '0.05rem 0.3rem', borderRadius: '0.2rem', fontSize: '0.5rem' }}>Shift+Enter</kbd> new line
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </>,
    document.body
  )
}