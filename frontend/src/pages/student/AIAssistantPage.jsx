// ═══════════════════════════════════════════════════════════════
//  AIAssistantPage.jsx  (Student)  —  Neumorphic
//  Voice Features: STT, Voice Messages, BROWSER TTS (Web Speech API)
//  NO backend TTS calls
// ═══════════════════════════════════════════════════════════════
import { useState, useRef, useEffect, useCallback } from 'react'
import {
  BrainCircuit, Send, Loader2, RefreshCw, Sparkles, Copy, Check,
  Mic, MicOff, Volume2, VolumeX,
} from 'lucide-react'
import { studentAPI } from '../../api/student.api'
import { authStore } from '../../store/authStore'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1'

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

/* ─── Markdown-like renderer ─────────────────────────────────── */
function renderMarkdown(text) {
  if (!text) return []
  const lines = text.split('\n')
  const elements = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (line.trim() === '') { elements.push({ type: 'spacer', key: i }); i++; continue }
    if (line.startsWith('## ')) { elements.push({ type: 'h2', content: line.slice(3), key: i }); i++; continue }
    if (line.startsWith('### ')) { elements.push({ type: 'h3', content: line.slice(4), key: i }); i++; continue }
    if (line.trimStart().startsWith('- ') || line.trimStart().startsWith('* ')) {
      const items = []
      while (i < lines.length && (lines[i].trimStart().startsWith('- ') || lines[i].trimStart().startsWith('* '))) {
        items.push(lines[i].replace(/^\s*[-*]\s/, '')); i++
      }
      elements.push({ type: 'ul', items, key: i }); continue
    }
    if (/^\d+\.\s/.test(line.trimStart())) {
      const items = []
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trimStart())) {
        items.push(lines[i].replace(/^\d+\.\s/, '')); i++
      }
      elements.push({ type: 'ol', items, key: i }); continue
    }
    elements.push({ type: 'p', content: line, key: i }); i++
  }
  return elements
}

/* ─── Inline formatting ─────────────────────────────────────── */
function InlineText({ text }) {
  const parts = []
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g
  let last = 0, match
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(<span key={last}>{text.slice(last, match.index)}</span>)
    const raw = match[0]
    if (raw.startsWith('**')) parts.push(<strong key={match.index} style={{ fontWeight: 800, color: 'inherit' }}>{raw.slice(2, -2)}</strong>)
    else if (raw.startsWith('*')) parts.push(<em key={match.index}>{raw.slice(1, -1)}</em>)
    else parts.push(
      <code key={match.index} style={{
        background: 'rgba(167,139,250,0.15)',
        color: '#a78bfa',
        padding: '0.1em 0.35em',
        borderRadius: '0.3em',
        fontSize: '0.85em',
        fontFamily: 'monospace',
      }}>{raw.slice(1, -1)}</code>
    )
    last = match.index + raw.length
  }
  if (last < text.length) parts.push(<span key={last}>{text.slice(last)}</span>)
  return <>{parts}</>
}

/* ─── Rendered message content ───────────────────────────────── */
function MessageContent({ text, isUser }) {
  const elements = renderMarkdown(text)
  const color = isUser ? 'rgba(255,255,255,0.9)' : 'var(--neu-text-primary)'
  return (
    <div style={{ fontSize: '0.86rem', lineHeight: 1.65, wordBreak: 'break-word' }}>
      {elements.map((el) => {
        if (el.type === 'spacer') return <div key={el.key} style={{ height: '0.35rem' }} />
        if (el.type === 'h2') return (
          <p key={el.key} style={{ fontWeight: 800, fontSize: '0.9rem', color, fontFamily: 'Outfit, sans-serif', marginBottom: '0.25rem', marginTop: '0.4rem' }}>
            <InlineText text={el.content} />
          </p>
        )
        if (el.type === 'h3') return (
          <p key={el.key} style={{ fontWeight: 700, fontSize: '0.84rem', color, marginBottom: '0.2rem', marginTop: '0.3rem' }}>
            <InlineText text={el.content} />
          </p>
        )
        if (el.type === 'ul') return (
          <ul key={el.key} style={{ paddingLeft: '1.1rem', margin: '0.2rem 0', display: 'flex', flexDirection: 'column', gap: '0.18rem' }}>
            {el.items.map((item, idx) => <li key={idx} style={{ color, listStyleType: 'disc' }}><InlineText text={item} /></li>)}
          </ul>
        )
        if (el.type === 'ol') return (
          <ol key={el.key} style={{ paddingLeft: '1.3rem', margin: '0.2rem 0', display: 'flex', flexDirection: 'column', gap: '0.18rem' }}>
            {el.items.map((item, idx) => <li key={idx} style={{ color, listStyleType: 'decimal' }}><InlineText text={item} /></li>)}
          </ol>
        )
        return <p key={el.key} style={{ margin: 0, color }}><InlineText text={el.content} /></p>
      })}
    </div>
  )
}

/* ─── Voice Message Bubble ──────────────────────────────────── */
function VoiceMessageBubble({ duration }) {
  const bars = [4, 7, 10, 13, 9, 14, 8, 12, 10, 6, 11, 7]
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.6rem',
      padding: '0.55rem 0.85rem',
      minWidth: 160,
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
        background: 'rgba(255,255,255,0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Mic size={13} style={{ color: '#fff' }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flex: 1 }}>
        {bars.map((h, i) => (
          <div
            key={i}
            style={{
              width: 3,
              height: `${h}px`,
              borderRadius: '2px',
              background: 'rgba(255,255,255,0.85)',
              animation: `waveBar 0.8s ease-in-out ${i * 0.06}s infinite alternate`,
            }}
          />
        ))}
      </div>
      <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.8)', flexShrink: 0, fontFamily: 'monospace' }}>
        {duration || '0:00'}
      </span>
    </div>
  )
}

/* ─── Browser TTS hook (Web Speech API) ──────────────────────── */
// NO backend call - uses browser's native speech synthesis
function useBrowserTTS() {
  const [speaking, setSpeaking] = useState(false)
  const [speakingId, setSpeakingId] = useState(null)
  const utteranceRef = useRef(null)

  const stopCurrent = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    setSpeaking(false)
    setSpeakingId(null)
  }, [])

  const speak = useCallback((text, id) => {
    // If same message is speaking, stop it
    if (speakingId === id && speaking) {
      stopCurrent()
      return
    }
    
    stopCurrent()

    // Clean markdown for TTS
    const clean = text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`(.*?)`/g, '$1')
      .replace(/^#{1,3}\s/gm, '')
      .replace(/^[-*]\s/gm, '')
      .replace(/^\d+\.\s/gm, '')
      .replace(/\n+/g, ' ')
      .trim()
      .slice(0, 800)

    if (!clean) return

    // Check if browser supports speech synthesis
    if (!window.speechSynthesis) {
      console.warn('Browser does not support Web Speech API')
      return
    }

    const utterance = new SpeechSynthesisUtterance(clean)
    utteranceRef.current = utterance
    
    // Set language to Urdu
    utterance.lang = 'ur-PK'
    
    // Try to find a Urdu voice for better pronunciation
    const voices = window.speechSynthesis.getVoices()
    const urduVoice = voices.find(voice => voice.lang.includes('ur') || voice.lang.includes('urd'))
    if (urduVoice) {
      utterance.voice = urduVoice
    }
    
    // Optional settings for better clarity
    utterance.rate = 0.9
    utterance.pitch = 1.0
    utterance.volume = 1.0

    utterance.onstart = () => {
      setSpeaking(true)
      setSpeakingId(id)
    }
    
    utterance.onend = () => {
      setSpeaking(false)
      setSpeakingId(null)
    }
    
    utterance.onerror = (event) => {
      console.warn('TTS Error:', event)
      setSpeaking(false)
      setSpeakingId(null)
    }

    window.speechSynthesis.speak(utterance)
  }, [speaking, speakingId, stopCurrent])

  useEffect(() => {
    // Load voices (some browsers need this to populate voice list)
    if (window.speechSynthesis) {
      window.speechSynthesis.getVoices()
    }
    return () => stopCurrent()
  }, [stopCurrent])

  return { speak, stop: stopCurrent, speaking, speakingId, ttsLoading: false }
}

/* ─── STT hook (Speech to Text) ─────────────────────────────── */
function useSTT({ onFinalResult, onError }) {
  const [listening, setListening] = useState(false)
  const recogRef = useRef(null)
  const isSupported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

  const start = useCallback(() => {
    if (!isSupported) { onError?.('Speech recognition is not supported in this browser.'); return }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const recog = new SR()
    recog.lang = 'en-US'
    recog.continuous = false
    recog.interimResults = false
    recog.maxAlternatives = 1

    recog.onstart = () => setListening(true)
    recog.onresult = (e) => {
      const transcript = e.results[0]?.[0]?.transcript?.trim()
      if (transcript) onFinalResult?.(transcript)
    }
    recog.onerror = (e) => {
      setListening(false)
      if (e.error !== 'aborted') onError?.(`Voice error: ${e.error}`)
    }
    recog.onend = () => setListening(false)
    recogRef.current = recog
    recog.start()
  }, [isSupported, onFinalResult, onError])

  const stop = useCallback(() => {
    recogRef.current?.stop()
    setListening(false)
  }, [])

  useEffect(() => () => recogRef.current?.abort(), [])

  return { start, stop, listening, isSupported }
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
      {copied ? <Check size={12} /> : <Copy size={12} />}
    </button>
  )
}

/* ─── Speak button (per bot message) ───────────────────────── */
function SpeakBtn({ text, msgId, tts }) {
  const { speak, stop, speaking, speakingId, ttsLoading } = tts
  const isThis = speakingId === msgId
  const isThisSpeaking = isThis && speaking

  return (
    <button
      onClick={() => speak(text, msgId)}
      title={isThisSpeaking ? 'Stop' : 'Read aloud (Browser TTS)'}
      className="speak-btn"
      style={{
        background: 'none', border: 'none', cursor: 'pointer',
        padding: '0.25rem', borderRadius: '0.4rem',
        color: isThisSpeaking ? '#a78bfa' : 'var(--neu-text-ghost)',
        display: 'flex', alignItems: 'center',
        opacity: isThisSpeaking ? 1 : 0,
        transition: 'opacity 0.15s, color 0.15s',
        flexShrink: 0,
        animation: isThisSpeaking ? 'speakPulse 1.2s ease-in-out infinite' : 'none',
      }}
    >
      {isThisSpeaking ? <VolumeX size={12} /> : <Volume2 size={12} />}
    </button>
  )
}

/* ─── Format recording duration ─────────────────────────────── */
function formatDur(ms) {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  return `${m}:${String(s % 60).padStart(2, '0')}`
}

/* ─── Typing indicator ───────────────────────────────────────── */
const LOADING_MSGS = [
  'Thoda sabr rakho, magic ho raha hai...',
  'Data ke samundar mein tair raha hoon...',
  'Code ke jungle mein jawab dhoondh raha hoon...',
  'AI apni chai sip kar raha hai...',
  'Perfect response ke liye dimag garam ho raha hai...',
  'Thoda ruk jao, ideas download ho rahe hain...',
  'Server se signals pakad raha hoon...',
  'Jawab ko polish kar raha hoon, shine zaroori hai...',
]


function TypingDots() {
  const [txt, setTxt] = useState('')
  const [ci, setCi] = useState(0)
  const [del, setDel] = useState(false)
  const getRnd = () => LOADING_MSGS[Math.floor(Math.random() * LOADING_MSGS.length)]
  const [cur, setCur] = useState(getRnd)
  useEffect(() => {
    const t = setTimeout(() => {
      if (!del) {
        if (ci < cur.length) { setTxt(p => p + cur[ci]); setCi(p => p + 1) }
        else setDel(true)
      } else {
        if (ci > 0) { setTxt(p => p.slice(0, -1)); setCi(p => p - 1) }
        else { setDel(false); setCur(getRnd()) }
      }
    }, del ? 80 : 120)
    return () => clearTimeout(t)
  }, [ci, del, cur])
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', animation: 'fadeUp 0.22s ease both' }}>
      <div style={{
        width: 30, height: 30, borderRadius: '50%',
        background: 'linear-gradient(145deg, #a78bfa, #7c5cdb)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '3px 3px 8px var(--neu-shadow-dark)',
        flexShrink: 0,
      }}>
        <BrainCircuit size={14} style={{ color: '#fff' }} />
      </div>
      <div style={{
        ...neu({ padding: '0.75rem 1rem', borderRadius: '0.3rem 1.1rem 1.1rem 1.1rem' }),
        display: 'flex', alignItems: 'center', gap: '0.5rem',
      }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--neu-text-primary)' }}>{txt}</span>
        <span style={{ display: 'inline-block', width: '2px', height: '1.1rem', backgroundColor: '#a78bfa', animation: 'blinkCursor 1s step-end infinite' }} />
      </div>
    </div>
  )
}

/* ─── Suggested prompts ──────────────────────────────────────── */
const SUGGESTIONS = [
  { icon: '📊', text: 'what is my attendance?' },
  { icon: '💳', text: 'what is the status of my fee voucher?' },
  { icon: '🎓', text: 'what is my CGPA?' },
  { icon: '📝', text: 'what courses am I enrolled in?' },
  { icon: '📐', text: 'what is OOP? Explain it.' },
  { icon: '🔢', text: 'explain the binary search algorithm.' },
]

/* ─── Message bubble ─────────────────────────────────────────── */
function Bubble({ msg, tts }) {
  const isUser = msg.role === 'user'

  if (isUser && msg.isVoice) {
    return (
      <div
        className="msg-bubble"
        style={{
          display: 'flex',
          flexDirection: 'row-reverse',
          alignItems: 'flex-end',
          gap: '0.5rem',
          animation: 'fadeUp 0.22s ease both',
        }}
      >
        <div style={{
          borderRadius: '1.1rem 1.1rem 0.3rem 1.1rem',
          background: 'linear-gradient(145deg, #a78bfa, #7c5cdb)',
          boxShadow: '4px 4px 12px var(--neu-shadow-dark), -2px -2px 6px var(--neu-shadow-light), 0 4px 16px rgba(167,139,250,0.35)',
          overflow: 'hidden',
        }}>
          <VoiceMessageBubble duration={msg.duration} />
        </div>
      </div>
    )
  }

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

        {!isUser && (
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.1rem',
            marginTop: '0.3rem',
          }}>
            <SpeakBtn text={msg.text} msgId={msg.id} tts={tts} />
            <CopyBtn text={msg.text} />
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Main Page ──────────────────────────────────────────────── */
export default function AIAssistantPage() {
  const user = authStore.getUser()
  const firstName = user?.full_name?.split(' ')[0] || user?.full_name || 'there'
  const WELCOME = `Hi ${firstName}!\n\nI'm your **LMS Assistant**. You can ask me about:\n- 📊 Your **attendance** and **CGPA**\n- 💳 The status of your **fee vouchers**\n- 📚 **Courses** and subject topics\n- 📝 Assignments and quizzes information\n\nWhat would you like to know?`

  const [messages, setMessages] = useState([{
    id: 'welcome',
    role: 'bot',
    text: WELCOME,
    isVoice: false,
  }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSId] = useState(null)

  const [recDuration, setRecDuration] = useState(0)
  const recStartRef = useRef(null)
  const recTimerRef = useRef(null)

  const msgCounter = useRef(0)
  const nextId = () => { msgCounter.current += 1; return `m${msgCounter.current}` }

  const tts = useBrowserTTS()  // ← Using browser TTS, no backend

  const stt = useSTT({
    onFinalResult: useCallback((transcript) => {
      const dur = recStartRef.current ? Date.now() - recStartRef.current : 0
      setRecDuration(dur)
      clearInterval(recTimerRef.current)
      recStartRef.current = null
      sendVoiceMessage(transcript, dur)
    }, []),
    onError: useCallback((err) => console.warn('[STT]', err), []),
  })

  const endRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendTextMessage = useCallback(async (text) => {
    const msg = (text || input).trim()
    if (!msg || loading) return
    tts.stop()
    const id = nextId()
    setMessages(p => [...p, { id, role: 'user', text: msg, isVoice: false }])
    setInput('')
    setLoading(true)
    try {
      const res = await studentAPI.sendChatbotMessage({ message: msg, session_id: sessionId })
      const d = res.data.data
      if (d?.session_id) setSId(d.session_id)
      const reply = d?.response || 'Samajh nahi aaya. Dobara try karein.'
      const botId = nextId()
      setMessages(p => [...p, { id: botId, role: 'bot', text: reply, isVoice: false }])
    } catch {
      setMessages(p => [...p, { id: nextId(), role: 'bot', text: 'Sorry, abhi AI service se connection nahi ho raha. Thodi der baad try karein.', isVoice: false }])
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [input, loading, sessionId, tts])

  const sendVoiceMessage = useCallback(async (transcript, durationMs) => {
    if (!transcript || loading) return
    tts.stop()

    const userMsgId = nextId()
    const durStr = formatDur(durationMs || 0)
    setMessages(p => [...p, {
      id: userMsgId,
      role: 'user',
      text: transcript,
      isVoice: true,
      duration: durStr,
    }])
    setLoading(true)

    try {
      const res = await studentAPI.sendChatbotMessage({ message: transcript, session_id: sessionId })
      const d = res.data.data
      if (d?.session_id) setSId(d.session_id)
      const reply = d?.response || 'Samajh nahi aaya. Dobara try karein.'
      const botId = nextId()
      setMessages(p => [...p, { id: botId, role: 'bot', text: reply, isVoice: false }])
      // Auto-play response using browser TTS
      setTimeout(() => tts.speak(reply, botId), 400)
    } catch {
      setMessages(p => [...p, { id: nextId(), role: 'bot', text: 'Sorry, abhi AI service se connection nahi ho raha. Thodi der baad try karein.', isVoice: false }])
    } finally {
      setLoading(false)
    }
  }, [loading, sessionId, tts])

  const handleMic = () => {
    if (stt.listening) {
      stt.stop()
      clearInterval(recTimerRef.current)
      recStartRef.current = null
      return
    }
    tts.stop()
    recStartRef.current = Date.now()
    recTimerRef.current = setInterval(() => {
      setRecDuration(Date.now() - recStartRef.current)
    }, 100)
    stt.start()
  }

  useEffect(() => () => clearInterval(recTimerRef.current), [])

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendTextMessage() }
  }

  const reset = () => {
    tts.stop()
    stt.stop()
    clearInterval(recTimerRef.current)
    recStartRef.current = null
    setMessages([{
      id: 'welcome',
      role: 'bot',
      text: WELCOME,
      isVoice: false,
    }])
    setInput('')
    setSId(null)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const showSuggestions = messages.length <= 1 && !loading

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
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes fadeUp { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
        @keyframes blinkCursor { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes speakPulse { 0%,100%{opacity:1} 50%{opacity:0.35} }
        @keyframes micPulse { 0%{box-shadow:0 0 0 0 rgba(248,113,113,0.6)} 70%{box-shadow:0 0 0 10px rgba(248,113,113,0)} 100%{box-shadow:0 0 0 0 rgba(248,113,113,0)} }
        @keyframes waveBar { from{transform:scaleY(0.4)} to{transform:scaleY(1)} }
        @keyframes recBlink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .chat-scroll::-webkit-scrollbar { width: 5px }
        .chat-scroll::-webkit-scrollbar-thumb { background: var(--neu-border); border-radius: 5px }
        .chat-scroll::-webkit-scrollbar-track { background: transparent }
        textarea::-webkit-scrollbar { width: 4px }
        textarea::-webkit-scrollbar-thumb { background: var(--neu-border); border-radius: 4px }
        .msg-bubble:hover .copy-btn { opacity: 1 !important; }
        .msg-bubble:hover .speak-btn { opacity: 1 !important; }
        .suggestion-chip:hover {
          box-shadow: 4px 4px 10px var(--neu-shadow-dark), -2px -2px 6px var(--neu-shadow-light) !important;
          background: var(--neu-surface) !important;
          transform: translateY(-1px);
        }
        .send-btn:hover:not(:disabled) { transform: translateY(-2px) scale(1.05); }
        .new-chat-btn:hover { transform: translateY(-1px); }
      `}</style>

      {/* Page title */}
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
              {stt.listening ? '🎤 Recording...' : tts.speaking ? '🔊 Speaking...' : 'LMS data, subjects, assignments — sab kuch poochho'}
            </p>
          </div>
        </div>

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

      {/* Chat container */}
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
          {messages.map((m, i) => <Bubble key={m.id || i} msg={m} tts={tts} />)}
          {loading && <TypingDots />}

          {/* Recording indicator */}
          {stt.listening && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.6rem',
              padding: '0.5rem 0.8rem', marginLeft: 'auto', width: 'auto',
              background: 'rgba(248,113,113,0.1)',
              borderRadius: '2rem',
              alignSelf: 'flex-end',
            }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f87171', animation: 'recBlink 0.8s ease-in-out infinite' }} />
              <span style={{ fontSize: '0.7rem', color: '#f87171', fontWeight: 600 }}>Recording...</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--neu-text-ghost)', fontFamily: 'monospace' }}>{formatDur(recDuration)}</span>
            </div>
          )}

          {/* Suggestions */}
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
                    onClick={() => sendTextMessage(s.text)}
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

        {/* Input bar */}
        <div style={{
          padding: '0.9rem 1.25rem',
          borderTop: '1px solid var(--neu-border)',
          background: 'var(--neu-surface)',
          display: 'flex', alignItems: 'flex-end', gap: '0.65rem',
        }}>

          {/* Bot/Recording icon */}
          <div style={{
            width: 36, height: 36, borderRadius: '0.75rem', flexShrink: 0,
            background: stt.listening
              ? 'linear-gradient(145deg, #f87171, #e05252)'
              : 'linear-gradient(145deg, #a78bfa, #7c5cdb)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '3px 3px 8px var(--neu-shadow-dark), 0 4px 12px rgba(167,139,250,0.3)',
            transition: 'all 0.15s',
            animation: stt.listening ? 'micPulse 1.2s ease-in-out infinite' : 'none',
          }}>
            {stt.listening ? <MicOff size={16} style={{ color: '#fff' }} /> : <Sparkles size={16} style={{ color: '#fff' }} />}
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
              placeholder={stt.listening ? 'Listening...' : 'Attendance, fee, CGPA, ya koi bhi subject topic poochho…'}
              disabled={stt.listening}
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                resize: 'none', padding: '0.7rem 0.95rem',
                fontSize: '0.86rem', color: 'var(--neu-text-primary)',
                fontFamily: "'DM Sans', sans-serif", lineHeight: 1.55,
                maxHeight: 120, overflow: 'auto',
                opacity: stt.listening ? 0.4 : 1,
                cursor: stt.listening ? 'not-allowed' : 'text',
              }}
            />
          </div>

          {/* Mic button */}
          {stt.isSupported && (
            <button
              onClick={handleMic}
              disabled={loading}
              title={stt.listening ? 'Stop recording' : 'Voice input'}
              className="send-btn"
              style={{
                width: 44, height: 44, borderRadius: '0.875rem',
                border: 'none', flexShrink: 0,
                background: stt.listening
                  ? 'linear-gradient(145deg, #f87171, #e05252)'
                  : 'var(--neu-surface)',
                color: stt.listening ? '#fff' : 'var(--neu-text-secondary)',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: stt.listening
                  ? '4px 4px 12px var(--neu-shadow-dark), 0 4px 14px rgba(248,113,113,0.4)'
                  : '4px 4px 10px var(--neu-shadow-dark), -2px -2px 6px var(--neu-shadow-light)',
                transition: 'all 0.15s',
                animation: stt.listening ? 'micPulse 1.2s ease-in-out infinite' : 'none',
                opacity: loading ? 0.5 : 1,
              }}
            >
              {stt.listening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
          )}

          {/* Send button */}
          <button
            onClick={() => sendTextMessage()}
            disabled={!input.trim() || loading || stt.listening}
            className="send-btn"
            style={{
              width: 44, height: 44, borderRadius: '0.875rem',
              border: 'none', flexShrink: 0,
              background: input.trim() && !loading && !stt.listening
                ? 'linear-gradient(145deg, #a78bfa, #7c5cdb)'
                : 'var(--neu-surface-deep)',
              boxShadow: input.trim() && !loading && !stt.listening
                ? '5px 5px 14px var(--neu-shadow-dark), -3px -3px 8px var(--neu-shadow-light), 0 4px 16px rgba(167,139,250,0.4)'
                : 'inset 3px 3px 7px var(--neu-shadow-dark), inset -2px -2px 5px var(--neu-shadow-light)',
              color: input.trim() && !loading && !stt.listening ? '#fff' : 'var(--neu-text-ghost)',
              cursor: input.trim() && !loading && !stt.listening ? 'pointer' : 'not-allowed',
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
          {stt.isSupported && ' · 🎤 mic for voice · 🔊 browser TTS'}
        </p>
      </div>
    </div>
  )
}