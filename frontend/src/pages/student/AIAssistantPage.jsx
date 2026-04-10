// ═══════════════════════════════════════════════════════════════
//  AIAssistantPage.jsx  (Student)  —  Neumorphic
//  → frontend/src/pages/student/AIAssistantPage.jsx
// ═══════════════════════════════════════════════════════════════
import { useState, useRef, useEffect } from 'react'
import {
  BrainCircuit, Send, Loader2, RefreshCw, Sparkles, Copy, Check,
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

/* ─── Markdown-like renderer ─────────────────────────────────── */
function renderMarkdown(text) {
  if (!text) return []

  const lines = text.split('\n')
  const elements = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Empty line
    if (line.trim() === '') {
      elements.push({ type: 'spacer', key: i })
      i++
      continue
    }

    // Heading ##
    if (line.startsWith('## ')) {
      elements.push({ type: 'h2', content: line.slice(3), key: i })
      i++
      continue
    }

    // Heading ###
    if (line.startsWith('### ')) {
      elements.push({ type: 'h3', content: line.slice(4), key: i })
      i++
      continue
    }

    // Bullet list
    if (line.trimStart().startsWith('- ') || line.trimStart().startsWith('* ')) {
      const items = []
      while (
        i < lines.length &&
        (lines[i].trimStart().startsWith('- ') || lines[i].trimStart().startsWith('* '))
      ) {
        items.push(lines[i].replace(/^\s*[-*]\s/, ''))
        i++
      }
      elements.push({ type: 'ul', items, key: i })
      continue
    }

    // Numbered list
    if (/^\d+\.\s/.test(line.trimStart())) {
      const items = []
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trimStart())) {
        items.push(lines[i].replace(/^\d+\.\s/, ''))
        i++
      }
      elements.push({ type: 'ol', items, key: i })
      continue
    }

    // Normal paragraph
    elements.push({ type: 'p', content: line, key: i })
    i++
  }

  return elements
}

/* ─── Inline formatting: **bold**, *italic*, `code` ─────────── */
function InlineText({ text }) {
  const parts = []
  // Split on **bold**, *italic*, `code`
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
  const mutedColor = isUser ? 'rgba(255,255,255,0.75)' : 'var(--neu-text-muted)'

  return (
    <div style={{ fontSize: '0.86rem', lineHeight: 1.65, wordBreak: 'break-word' }}>
      {elements.map((el) => {
        if (el.type === 'spacer') {
          return <div key={el.key} style={{ height: '0.35rem' }} />
        }
        if (el.type === 'h2') {
          return (
            <p key={el.key} style={{
              fontWeight: 800, fontSize: '0.9rem',
              color, fontFamily: 'Outfit, sans-serif',
              marginBottom: '0.25rem', marginTop: '0.4rem',
            }}>
              <InlineText text={el.content} />
            </p>
          )
        }
        if (el.type === 'h3') {
          return (
            <p key={el.key} style={{
              fontWeight: 700, fontSize: '0.84rem',
              color, marginBottom: '0.2rem', marginTop: '0.3rem',
            }}>
              <InlineText text={el.content} />
            </p>
          )
        }
        if (el.type === 'ul') {
          return (
            <ul key={el.key} style={{
              paddingLeft: '1.1rem', margin: '0.2rem 0',
              display: 'flex', flexDirection: 'column', gap: '0.18rem',
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
              paddingLeft: '1.3rem', margin: '0.2rem 0',
              display: 'flex', flexDirection: 'column', gap: '0.18rem',
            }}>
              {el.items.map((item, idx) => (
                <li key={idx} style={{ color, listStyleType: 'decimal' }}>
                  <InlineText text={item} />
                </li>
              ))}
            </ol>
          )
        }
        // paragraph
        return (
          <p key={el.key} style={{ margin: 0, color }}>
            <InlineText text={el.content} />
          </p>
        )
      })}
    </div>
  )
}

/* ─── Copy button ────────────────────────────────────────────── */
function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // fallback
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
        padding: '0.25rem',
        borderRadius: '0.4rem',
        color: copied ? '#3ecf8e' : 'var(--neu-text-ghost)',
        display: 'flex',
        alignItems: 'center',
        opacity: 0,
        transition: 'opacity 0.15s, color 0.15s',
        flexShrink: 0,
      }}
      className="copy-btn"
    >
      {copied
        ? <Check size={12} />
        : <Copy size={12} />
      }
    </button>
  )
}

/* ─── Suggested prompts ──────────────────────────────────────── */
const SUGGESTIONS = [
  { icon: '📊', text: 'Meri attendance kitni hai?' },
  { icon: '💳', text: 'Mera fee voucher status kya hai?' },
  { icon: '🎓', text: 'Mera CGPA batao' },
  { icon: '📝', text: 'Meri enrolled courses batao' },
  { icon: '📐', text: 'OOP kya hota hai? Explain karo' },
  { icon: '🔢', text: 'Binary search algorithm samjhao' },
]

/* ─── Message bubble ─────────────────────────────────────────── */
function Bubble({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div
      className="msg-bubble"
      style={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        alignItems: 'flex-end',
        gap: '0.5rem',
        animation: 'fadeUp 0.22s ease both',
      }}
    >
      {/* Bot avatar */}
      {!isUser && (
        <div style={{
          width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(145deg, #a78bfa, #7c5cdb)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '3px 3px 8px var(--neu-shadow-dark), -2px -2px 5px var(--neu-shadow-light)',
          alignSelf: 'flex-end',
        }}>
          <BrainCircuit size={14} style={{ color: '#fff' }} />
        </div>
      )}

      {/* Bubble */}
      <div style={{
        maxWidth: '75%',
        padding: '0.75rem 1rem',
        borderRadius: isUser ? '1.1rem 1.1rem 0.3rem 1.1rem' : '0.3rem 1.1rem 1.1rem 1.1rem',
        position: 'relative',
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
        <MessageContent text={msg.text} isUser={isUser} />

        {/* Copy button — shows on hover via CSS */}
        {!isUser && (
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginTop: '0.3rem',
          }}>
            <CopyBtn text={msg.text} />
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Typing indicator ───────────────────────────────────────── */
// Typewriter loading messages - random rotation
const LOADING_MESSAGES = [
  "Aapki request process ho rahi hai...",
  "Data fetch kar raha hoon, thoda intezaar karein...",
  "Aapke sawaal ka jawab soch raha hoon...",
  "LMS se relevant information la raha hoon...",
  "Aapko behtareen jawab dene ki koshish kar raha hoon...",
  "AI engine chalu hai, bas thoda sa aur...",
  "Aapke liye kuch helpful tayar kar raha hoon...",
  "Perfect response likh raha hoon, rukiye...",
]

function TypingDots() {
  const [displayText, setDisplayText] = useState("")
  const [messageIndex, setMessageIndex] = useState(0)
  const [charIndex, setCharIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)

  // Random message selection on cycle complete
  const getRandomMessage = () => {
    const randomIndex = Math.floor(Math.random() * LOADING_MESSAGES.length)
    return LOADING_MESSAGES[randomIndex]
  }

  const [currentMessage, setCurrentMessage] = useState(() => getRandomMessage())

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        // Typing
        if (charIndex < currentMessage.length) {
          setDisplayText(prev => prev + currentMessage[charIndex])
          setCharIndex(prev => prev + 1)
        } else {
          // After typing complete, wait then start deleting
          setIsDeleting(true)
        }
      } else {
        // Deleting
        if (charIndex > 0) {
          setDisplayText(prev => prev.slice(0, -1))
          setCharIndex(prev => prev - 1)
        } else {
          // After deleting complete, pick new random message
          setIsDeleting(false)
          const newMessage = getRandomMessage()
          setCurrentMessage(newMessage)
        }
      }
    }, isDeleting ? 80 : 120) // Deleting faster than typing

    return () => clearTimeout(timeout)
  }, [charIndex, isDeleting, currentMessage])

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', animation: 'fadeUp 0.22s ease both' }}>
      {/* Avatar - same as bot */}
      <div style={{
        width: 30, height: 30, borderRadius: '50%',
        background: 'linear-gradient(145deg, #a78bfa, #7c5cdb)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '3px 3px 8px var(--neu-shadow-dark)',
        flexShrink: 0,
      }}>
        <BrainCircuit size={14} style={{ color: '#fff' }} />
      </div>

      {/* Typewriter bubble */}
      <div style={{
        ...neu({ 
          padding: '0.75rem 1rem', 
          borderRadius: '0.3rem 1.1rem 1.1rem 1.1rem',
          background: 'var(--neu-surface)',
        }),
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
      }}>
        <span style={{
          fontSize: '0.85rem',
          color: 'var(--neu-text-primary)',
          fontFamily: "'DM Sans', sans-serif",
        }}>
          {displayText}
        </span>
        <span style={{
          display: 'inline-block',
          width: '2px',
          height: '1.1rem',
          backgroundColor: '#a78bfa',
          animation: 'blinkCursor 1s step-end infinite',
          marginLeft: '2px',
        }} />
      </div>
    </div>
  )
}

/* ─── Main Page ──────────────────────────────────────────────── */
export default function AIAssistantPage() {
  const user      = authStore.getUser()
  const firstName = user?.full_name?.split(' ')[0] || user?.full_name || 'there'

  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text: `Assalam o Alaikum ${firstName}! 👋\n\nMain **LMS Assistant** hoon. Mujhse pooch sakte ho:\n- 📊 Apni **attendance** aur **CGPA**\n- 💳 **Fee vouchers** ka status\n- 📚 **Courses** aur subjects ke topics\n- 📝 Assignments aur quizzes ki info\n\nKya poochna hai?`,
    }
  ])
  const [input, setInput]     = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSId]   = useState(null)

  const endRef    = useRef(null)
  const inputRef  = useRef(null)

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
      setMessages(p => [...p, {
        role: 'bot',
        text: d?.response || "Samajh nahi aaya. Dobara try karein.",
      }])
    } catch {
      setMessages(p => [...p, {
        role: 'bot',
        text: "Sorry, abhi AI service se connection nahi ho raha. Thodi der baad try karein.",
      }])
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const reset = () => {
    setMessages([{
      role: 'bot',
      text: `Assalam o Alaikum ${firstName}! 👋\n\nMain **LMS Assistant** hoon. Mujhse pooch sakte ho:\n- 📊 Apni **attendance** aur **CGPA**\n- 💳 **Fee vouchers** ka status\n- 📚 **Courses** aur subjects ke topics\n- 📝 Assignments aur quizzes ki info\n\nKya poochna hai?`,
    }])
    setInput('')
    setSId(null)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const showSuggestions = messages.length <= 1

  return (
    <div style={{
      maxWidth: 820,
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 130px)',
      minHeight: 500,
    }}>
      <style>{`
        @keyframes spin    { to { transform: rotate(360deg) } }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
        @keyframes blink   { 0%,80%,100%{opacity:0.15} 40%{opacity:1} }
        .chat-scroll::-webkit-scrollbar { width: 5px }
        .chat-scroll::-webkit-scrollbar-thumb { background: var(--neu-border); border-radius: 5px }
        .chat-scroll::-webkit-scrollbar-track { background: transparent }
        textarea::-webkit-scrollbar { width: 4px }
        textarea::-webkit-scrollbar-thumb { background: var(--neu-border); border-radius: 4px }
        .msg-bubble:hover .copy-btn { opacity: 1 !important; }
        .suggestion-chip:hover {
          box-shadow: 4px 4px 10px var(--neu-shadow-dark), -2px -2px 6px var(--neu-shadow-light) !important;
          background: var(--neu-surface) !important;
          transform: translateY(-1px);
        }
        .send-btn:hover:not(:disabled) { transform: translateY(-2px) scale(1.05); }
        .new-chat-btn:hover { transform: translateY(-1px); }
      `}</style>

      {/* ── Page title ── */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: '1.25rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            ...neuInset({ width: 46, height: 46, borderRadius: '0.875rem' }),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#a78bfa',
          }}>
            <BrainCircuit size={22} />
          </div>
          <div>
            <h1 style={{
              fontSize: '1.55rem', fontWeight: 800,
              color: 'var(--neu-text-primary)',
              fontFamily: 'Outfit, sans-serif', marginBottom: '0.1rem',
            }}>
              AI Assistant
            </h1>
            <p style={{ fontSize: '0.78rem', color: 'var(--neu-text-ghost)' }}>
              LMS data, subjects, assignments — sab kuch poochho
            </p>
          </div>
        </div>

        {/* Reset button */}
        <button
          onClick={reset}
          className="new-chat-btn"
          style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.5rem 0.9rem', borderRadius: '0.75rem',
            border: 'none', cursor: 'pointer',
            background: 'var(--neu-surface)',
            boxShadow: '4px 4px 10px var(--neu-shadow-dark), -2px -2px 6px var(--neu-shadow-light)',
            color: 'var(--neu-text-muted)', fontSize: '0.75rem', fontWeight: 600,
            fontFamily: "'DM Sans', sans-serif",
            transition: 'transform 0.15s',
          }}
        >
          <RefreshCw size={13} /> New Chat
        </button>
      </div>

      {/* ── Chat container ── */}
      <div style={{
        ...neu({ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', flex: 1 }),
      }}>

        {/* Messages */}
        <div
          className="chat-scroll"
          style={{
            flex: 1, overflowY: 'auto',
            padding: '1.25rem 1.5rem',
            display: 'flex', flexDirection: 'column', gap: '1rem',
          }}
        >
          {messages.map((m, i) => <Bubble key={i} msg={m} />)}
          {loading && <TypingDots />}

          {/* Suggestion chips */}
          {showSuggestions && !loading && (
            <div style={{ marginTop: '0.5rem' }}>
              <p style={{
                fontSize: '0.7rem', color: 'var(--neu-text-ghost)', fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.65rem',
              }}>
                Quick Suggestions
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.55rem' }}>
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => send(s.text)}
                    className="suggestion-chip"
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
                  >
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
        <div style={{
          padding: '0.9rem 1.25rem',
          borderTop: '1px solid var(--neu-border)',
          background: 'var(--neu-surface)',
          display: 'flex', alignItems: 'flex-end', gap: '0.65rem',
        }}>

          {/* Bot icon */}
          <div style={{
            width: 36, height: 36, borderRadius: '0.75rem', flexShrink: 0,
            background: 'linear-gradient(145deg, #a78bfa, #7c5cdb)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '3px 3px 8px var(--neu-shadow-dark), 0 4px 12px rgba(167,139,250,0.3)',
          }}>
            <Sparkles size={16} style={{ color: '#fff' }} />
          </div>

          {/* Textarea */}
          <div style={{
            flex: 1,
            ...neuInset({ borderRadius: '1rem', padding: 0 }),
            display: 'flex', alignItems: 'flex-end',
          }}>
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
              placeholder="Attendance, fee, CGPA, ya koi bhi subject topic poochho…"
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
          <button
            onClick={() => send()}
            disabled={!input.trim() || loading}
            className="send-btn"
            style={{
              width: 44, height: 44, borderRadius: '0.875rem',
              border: 'none', flexShrink: 0,
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
          >
            {loading
              ? <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} />
              : <Send size={18} style={{ transform: 'translateX(1px)' }} />
            }
          </button>
        </div>

        {/* Hint */}
        <p style={{
          textAlign: 'center', fontSize: '0.65rem',
          color: 'var(--neu-text-ghost)',
          padding: '0.3rem 0 0.55rem',
        }}>
          Press{' '}
          <kbd style={{
            background: 'var(--neu-surface)', boxShadow: 'var(--neu-raised)',
            padding: '0.1rem 0.4rem', borderRadius: '0.3rem',
            fontSize: '0.6rem', fontFamily: 'monospace',
          }}>Enter</kbd>
          {' '}to send ·{' '}
          <kbd style={{
            background: 'var(--neu-surface)', boxShadow: 'var(--neu-raised)',
            padding: '0.1rem 0.4rem', borderRadius: '0.3rem',
            fontSize: '0.6rem', fontFamily: 'monospace',
          }}>Shift+Enter</kbd>
          {' '}for new line
        </p>
      </div>
    </div>
  )
}