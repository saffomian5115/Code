// ═══════════════════════════════════════════════════════════════
//  ChatPage.jsx  (Student)  —  Neumorphic
//  → frontend/src/pages/student/ChatPage.jsx
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect, useRef, useCallback } from 'react'
import {
  MessageSquare, Send, Loader2, Users, BookOpen,
  RefreshCw, Hash, Search, Wifi, WifiOff,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { studentAPI } from '../../api/student.api'
import { authStore } from '../../store/authStore'
import { timeAgo } from '../../utils/helpers'

const POLL_MS = 5000

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

/* ─── Color helpers ──────────────────────────────────────────── */
const PALETTE = ['#5b8af0','#a78bfa','#3ecf8e','#f59e0b','#f87171','#38bdf8','#fb923c','#e879f9']
const strHash = (s = '') => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 0)
const getGroupColor  = (name) => PALETTE[Math.abs(strHash(name)) % PALETTE.length]
const getAvatarColor = (name) => PALETTE[Math.abs(strHash(name)) % PALETTE.length]

/* ─── Date divider ───────────────────────────────────────────── */
function DateDivider({ date }) {
  const d = new Date(date)
  const today = new Date()
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
  const label =
    d.toDateString() === today.toDateString()     ? 'Today'
    : d.toDateString() === yesterday.toDateString() ? 'Yesterday'
    : d.toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '0.75rem 0' }}>
      <div style={{ flex: 1, height: 1, background: 'var(--neu-border)' }} />
      <span style={{
        fontSize: '0.65rem', fontWeight: 700, color: 'var(--neu-text-ghost)',
        padding: '0.25rem 0.75rem', borderRadius: '999px',
        background: 'var(--neu-surface-deep)',
        boxShadow: 'inset 2px 2px 5px var(--neu-shadow-dark), inset -1px -1px 3px var(--neu-shadow-light)',
        textTransform: 'uppercase', letterSpacing: '0.06em',
      }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: 'var(--neu-border)' }} />
    </div>
  )
}

/* ─── Message Bubble ─────────────────────────────────────────── */
function MessageBubble({ msg, isOwn, showAvatar, showName, accentColor }) {
  const [hov, setHov] = useState(false)

  if (msg.message_type === 'system') return (
    <div style={{ textAlign: 'center', margin: '0.25rem 0' }}>
      <span style={{
        fontSize: '0.7rem', color: 'var(--neu-text-ghost)',
        background: 'var(--neu-surface-deep)', padding: '0.25rem 0.85rem',
        borderRadius: '999px',
        boxShadow: 'inset 2px 2px 5px var(--neu-shadow-dark), inset -1px -1px 3px var(--neu-shadow-light)',
      }}>{msg.message}</span>
    </div>
  )

  const avatarColor = getAvatarColor(msg.sender_name || '')

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex',
        flexDirection: isOwn ? 'row-reverse' : 'row',
        alignItems: 'flex-end',
        gap: '0.5rem',
        marginBottom: '0.05rem',
        animation: 'fadeUp 0.22s ease both',
      }}>

      {/* Avatar */}
      <div style={{
        width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
        background: isOwn ? 'transparent' : avatarColor,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.7rem', fontWeight: 800, color: '#fff',
        opacity: showAvatar && !isOwn ? 1 : 0,
        boxShadow: showAvatar && !isOwn ? '3px 3px 8px var(--neu-shadow-dark), -2px -2px 5px var(--neu-shadow-light)' : 'none',
        fontFamily: 'Outfit, sans-serif',
      }}>
        {(msg.sender_name || '?')[0].toUpperCase()}
      </div>

      <div style={{ maxWidth: '72%', display: 'flex', flexDirection: 'column', alignItems: isOwn ? 'flex-end' : 'flex-start', gap: '0.15rem' }}>
        {/* Sender name */}
        {showName && !isOwn && (
          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: avatarColor, marginLeft: '0.3rem', letterSpacing: '0.02em' }}>
            {msg.sender_name}
          </span>
        )}

        {/* Bubble */}
        <div style={{
          padding: '0.6rem 0.95rem',
          borderRadius: isOwn ? '1.1rem 1.1rem 0.3rem 1.1rem' : '1.1rem 1.1rem 1.1rem 0.3rem',
          fontSize: '0.84rem', lineHeight: 1.55,
          wordBreak: 'break-word', whiteSpace: 'pre-wrap',
          ...(isOwn ? {
            background: `linear-gradient(145deg, ${accentColor}, ${accentColor}cc)`,
            color: '#fff',
            boxShadow: `4px 4px 12px var(--neu-shadow-dark), -2px -2px 6px var(--neu-shadow-light), 0 4px 16px ${accentColor}44`,
          } : {
            background: 'var(--neu-surface)',
            color: 'var(--neu-text-primary)',
            boxShadow: '4px 4px 10px var(--neu-shadow-dark), -2px -2px 6px var(--neu-shadow-light)',
            border: '1px solid var(--neu-border)',
          }),
          transition: 'box-shadow 0.15s',
        }}>
          {msg.message}
        </div>

        {/* Timestamp */}
        <span style={{
          fontSize: '0.62rem', color: 'var(--neu-text-ghost)',
          marginLeft: isOwn ? 0 : '0.3rem',
          marginRight: isOwn ? '0.3rem' : 0,
          opacity: hov ? 1 : 0,
          transition: 'opacity 0.2s',
        }}>
          {timeAgo(msg.sent_at)}
        </span>
      </div>
    </div>
  )
}

/* ─── Group item in sidebar ──────────────────────────────────── */
function GroupItem({ group, active, onClick }) {
  const color = getGroupColor(group.name || '')
  const init  = (group.name || '?').slice(0, 2).toUpperCase()

  return (
    <button onClick={onClick}
      style={{
        width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer',
        padding: '0.7rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.7rem',
        fontFamily: "'DM Sans', sans-serif", borderRadius: '0.875rem',
        background: active ? 'var(--neu-surface)' : 'transparent',
        boxShadow: active ? '5px 5px 13px var(--neu-shadow-dark), -3px -3px 8px var(--neu-shadow-light)' : 'none',
        transition: 'all 0.16s',
        borderLeft: active ? `3px solid ${color}` : '3px solid transparent',
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--neu-surface-deep)' }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}>

      {/* Avatar */}
      <div style={{
        width: 38, height: 38, borderRadius: '0.75rem', flexShrink: 0,
        background: active ? color : `${color}20`,
        color: active ? '#fff' : color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 800, fontSize: '0.8rem', fontFamily: 'Outfit, sans-serif',
        boxShadow: active
          ? `3px 3px 9px var(--neu-shadow-dark), -2px -2px 5px var(--neu-shadow-light)`
          : 'inset 2px 2px 5px var(--neu-shadow-dark), inset -1px -1px 3px var(--neu-shadow-light)',
        transition: 'all 0.16s',
      }}>
        {init}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--neu-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {group.name}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.15rem' }}>
          <Users size={10} style={{ color: 'var(--neu-text-ghost)' }} />
          <span style={{ fontSize: '0.68rem', color: 'var(--neu-text-ghost)' }}>
            {group.member_count || 0} members
          </span>
        </div>
      </div>
    </button>
  )
}

/* ─── Main Page ──────────────────────────────────────────────── */
export default function ChatPage() {
  const user          = authStore.getUser()
  const currentUserId = user?.user_id

  const [groups, setGroups]           = useState([])
  const [groupsLoading, setGLd]       = useState(true)
  const [selected, setSelected]       = useState(null)
  const [messages, setMessages]       = useState([])
  const [msgLoading, setMsgLd]        = useState(false)
  const [input, setInput]             = useState('')
  const [sending, setSending]         = useState(false)
  const [online, setOnline]           = useState(true)
  const [searchQ, setSearchQ]         = useState('')

  const endRef    = useRef(null)
  const pollRef   = useRef(null)
  const inputRef  = useRef(null)

  /* Load groups */
  useEffect(() => {
    studentAPI.getChatGroups()
      .then(r => setGroups(r.data.data?.groups || []))
      .catch(() => toast.error('Failed to load groups'))
      .finally(() => setGLd(false))
  }, [])

  /* Fetch messages */
  const fetchMessages = useCallback(async (gid, init = false) => {
    if (!gid) return
    if (init) setMsgLd(true)
    try {
      const res  = await studentAPI.getChatMessages(gid)
      const msgs = res.data.data?.messages || []
      setMessages(msgs)
      setOnline(true)
    } catch { setOnline(false) }
    finally { if (init) setMsgLd(false) }
  }, [])

  /* Poll on group select */
  useEffect(() => {
    clearInterval(pollRef.current)
    if (!selected) return
    fetchMessages(selected.id, true)
    pollRef.current = setInterval(() => fetchMessages(selected.id), POLL_MS)
    return () => clearInterval(pollRef.current)
  }, [selected])

  /* Auto scroll */
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  /* Send */
  const handleSend = async () => {
    const text = input.trim()
    if (!text || !selected || sending) return
    setSending(true)
    const optimistic = {
      id: `opt_${Date.now()}`, message: text,
      sender_id: currentUserId, sender_name: user?.full_name || 'You',
      sent_at: new Date().toISOString(), message_type: 'text', _optimistic: true,
    }
    setMessages(p => [...p, optimistic])
    setInput('')
    try {
      await studentAPI.sendMessage(selected.id, { message: text, message_type: 'text' })
      await fetchMessages(selected.id)
      inputRef.current?.focus()
    } catch (err) {
      setMessages(p => p.filter(m => m.id !== optimistic.id))
      setInput(text)
      toast.error(err.response?.data?.message || 'Failed to send')
    } finally { setSending(false) }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  /* Group messages by date */
  const groupedMessages = messages.reduce((acc, msg, idx) => {
    const prevDate = idx > 0 ? new Date(messages[idx - 1].sent_at).toDateString() : null
    const thisDate = new Date(msg.sent_at).toDateString()
    if (thisDate !== prevDate) acc.push({ type: 'divider', date: msg.sent_at, id: `d_${msg.sent_at}` })
    acc.push(msg)
    return acc
  }, [])

  const visibleGroups  = groups.filter(g => !searchQ || g.name?.toLowerCase().includes(searchQ.toLowerCase()))
  const selectedColor  = selected ? getGroupColor(selected.name || '') : '#5b8af0'

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <style>{`
        @keyframes spin   { to { transform: rotate(360deg) } }
        @keyframes fadeUp { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.5} }
        textarea::-webkit-scrollbar { width: 4px }
        textarea::-webkit-scrollbar-thumb { background: var(--neu-shadow-dark); border-radius: 4px }
        .msg-scroll::-webkit-scrollbar { width: 5px }
        .msg-scroll::-webkit-scrollbar-thumb { background: var(--neu-border); border-radius: 5px }
        .msg-scroll::-webkit-scrollbar-track { background: transparent }
      `}</style>

      {/* ── Page title ── */}
      <div style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.55rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit, sans-serif', marginBottom: '0.2rem' }}>
          Class Chat
        </h1>
        <p style={{ fontSize: '0.8rem', color: 'var(--neu-text-ghost)' }}>Chat with classmates and teachers</p>
      </div>

      {/* ── Main container ── */}
      <div style={{
        ...neu({ padding: 0, overflow: 'hidden', display: 'flex' }),
        height: 'calc(100vh - 200px)', minHeight: 520,
      }}>

        {/* ════ LEFT: Group Sidebar ════ */}
        <div style={{
          width: 270, flexShrink: 0, display: 'flex', flexDirection: 'column',
          borderRight: '1px solid var(--neu-border)',
          background: 'var(--neu-surface-deep)',
        }}>
          {/* Sidebar header */}
          <div style={{ padding: '1rem 0.85rem 0.65rem', borderBottom: '1px solid var(--neu-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.7rem' }}>
              <div style={{
                width: 30, height: 30, borderRadius: '0.6rem', flexShrink: 0,
                background: 'rgba(91,138,240,0.12)', color: '#5b8af0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: 'inset 2px 2px 5px var(--neu-shadow-dark), inset -1px -1px 3px var(--neu-shadow-light)',
              }}>
                <MessageSquare size={14} />
              </div>
              <p style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit, sans-serif' }}>
                My Chats
              </p>
              {!online && (
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <WifiOff size={12} style={{ color: '#f87171' }} />
                  <span style={{ fontSize: '0.62rem', color: '#f87171', fontWeight: 700 }}>Offline</span>
                </div>
              )}
            </div>

            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search size={12} style={{ position: 'absolute', left: '0.7rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--neu-text-ghost)', pointerEvents: 'none' }} />
              <input
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                placeholder="Search groups…"
                style={{
                  ...neuInset({ borderRadius: '0.65rem', padding: '0.5rem 0.75rem 0.5rem 2rem' }),
                  width: '100%', fontSize: '0.78rem', color: 'var(--neu-text-primary)',
                  outline: 'none', border: '1px solid var(--neu-border)',
                  fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Group list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem 0.5rem' }} className="msg-scroll">
            {groupsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} style={{ height: 54, borderRadius: '0.875rem', background: 'var(--neu-surface)', margin: '0.3rem 0', animation: 'pulse 1.5s infinite' }} />
              ))
            ) : visibleGroups.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 120, gap: '0.5rem' }}>
                <MessageSquare size={24} style={{ color: 'var(--neu-text-ghost)' }} />
                <p style={{ fontSize: '0.78rem', color: 'var(--neu-text-ghost)', textAlign: 'center' }}>
                  {searchQ ? 'No groups found' : 'No chat groups yet'}
                </p>
              </div>
            ) : visibleGroups.map(g => (
              <GroupItem key={g.id} group={g} active={selected?.id === g.id} onClick={() => setSelected(g)} />
            ))}
          </div>

          {/* Footer */}
          <div style={{ padding: '0.6rem 0.85rem', borderTop: '1px solid var(--neu-border)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: online ? '#3ecf8e' : '#f87171', boxShadow: online ? '0 0 6px #3ecf8e88' : '0 0 6px #f8717188' }} />
            <span style={{ fontSize: '0.68rem', color: 'var(--neu-text-ghost)', fontWeight: 600 }}>
              {online ? 'Connected' : 'Reconnecting…'}
            </span>
          </div>
        </div>

        {/* ════ RIGHT: Messages ════ */}
        {!selected ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '2rem' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '1.25rem',
              background: 'rgba(91,138,240,0.1)',
              boxShadow: 'inset 4px 4px 10px var(--neu-shadow-dark), inset -3px -3px 7px var(--neu-shadow-light)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5b8af0',
            }}>
              <MessageSquare size={28} />
            </div>
            <p style={{ fontWeight: 700, color: 'var(--neu-text-secondary)', fontSize: '0.95rem' }}>Select a chat</p>
            <p style={{ fontSize: '0.78rem', color: 'var(--neu-text-ghost)', textAlign: 'center' }}>
              Choose a course group from the sidebar to start chatting
            </p>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

            {/* Chat header */}
            <div style={{
              padding: '0.85rem 1.1rem', borderBottom: '1px solid var(--neu-border)',
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              background: 'var(--neu-surface)',
            }}>
              <div style={{
                width: 38, height: 38, borderRadius: '0.75rem', flexShrink: 0,
                background: selectedColor, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: '0.8rem', fontFamily: 'Outfit, sans-serif',
                boxShadow: `3px 3px 9px var(--neu-shadow-dark), -2px -2px 5px var(--neu-shadow-light), 0 4px 12px ${selectedColor}44`,
              }}>
                {(selected.name || '?').slice(0, 2).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--neu-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'Outfit, sans-serif' }}>
                  {selected.name}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Users size={10} style={{ color: 'var(--neu-text-ghost)' }} />
                  <span style={{ fontSize: '0.68rem', color: 'var(--neu-text-ghost)' }}>{selected.member_count || 0} members</span>
                </div>
              </div>

              {/* Refresh */}
              <button onClick={() => fetchMessages(selected.id, true)}
                style={{
                  width: 34, height: 34, borderRadius: '0.65rem', border: 'none', cursor: 'pointer',
                  background: 'var(--neu-surface-deep)', color: 'var(--neu-text-muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '3px 3px 8px var(--neu-shadow-dark), -2px -2px 5px var(--neu-shadow-light)',
                }}>
                <RefreshCw size={14} />
              </button>
            </div>

            {/* Messages area */}
            <div className="msg-scroll" style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.1rem', display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
              {msgLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '0.5rem' }}>
                  <Loader2 size={26} style={{ color: selectedColor, animation: 'spin 0.8s linear infinite' }} />
                  <p style={{ fontSize: '0.75rem', color: 'var(--neu-text-ghost)' }}>Loading messages…</p>
                </div>
              ) : messages.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '0.6rem' }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: '1rem',
                    background: `${selectedColor}15`,
                    boxShadow: 'inset 3px 3px 8px var(--neu-shadow-dark), inset -2px -2px 5px var(--neu-shadow-light)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Hash size={22} style={{ color: selectedColor }} />
                  </div>
                  <p style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--neu-text-secondary)' }}>No messages yet</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--neu-text-ghost)' }}>Be the first to say something!</p>
                </div>
              ) : (
                groupedMessages.map((item, idx) => {
                  if (item.type === 'divider') return <DateDivider key={item.id} date={item.date} />
                  const isOwn    = item.sender_id === currentUserId
                  const prev     = messages[messages.indexOf(item) - 1]
                  const next     = messages[messages.indexOf(item) + 1]
                  const showAvatar = !next || next.sender_id !== item.sender_id || next.message_type === 'system'
                  const showName   = !prev || prev.sender_id !== item.sender_id || prev.message_type === 'system'
                  return (
                    <MessageBubble
                      key={item.id || idx}
                      msg={item}
                      isOwn={isOwn}
                      showAvatar={showAvatar}
                      showName={showName}
                      accentColor={selectedColor}
                    />
                  )
                })
              )}
              <div ref={endRef} />
            </div>

            {/* Input bar */}
            <div style={{
              padding: '0.85rem 1.1rem', borderTop: '1px solid var(--neu-border)',
              background: 'var(--neu-surface)', display: 'flex', alignItems: 'flex-end', gap: '0.65rem',
            }}>
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
                  placeholder={`Message ${selected.name}…`}
                  style={{
                    flex: 1, background: 'transparent', border: 'none', outline: 'none',
                    resize: 'none', padding: '0.7rem 0.95rem',
                    fontSize: '0.85rem', color: 'var(--neu-text-primary)',
                    fontFamily: "'DM Sans', sans-serif", lineHeight: 1.55,
                    maxHeight: 120, overflow: 'auto',
                  }}
                />
              </div>

              {/* Send button */}
              <button onClick={handleSend} disabled={!input.trim() || sending}
                style={{
                  width: 44, height: 44, borderRadius: '0.875rem', border: 'none', flexShrink: 0,
                  background: input.trim() && !sending
                    ? `linear-gradient(145deg, ${selectedColor}, ${selectedColor}cc)`
                    : 'var(--neu-surface-deep)',
                  boxShadow: input.trim() && !sending
                    ? `5px 5px 14px var(--neu-shadow-dark), -3px -3px 8px var(--neu-shadow-light), 0 4px 16px ${selectedColor}44`
                    : 'inset 3px 3px 7px var(--neu-shadow-dark), inset -2px -2px 5px var(--neu-shadow-light)',
                  color: input.trim() && !sending ? '#fff' : 'var(--neu-text-ghost)',
                  cursor: input.trim() && !sending ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.18s',
                }}
                onMouseEnter={e => { if (input.trim() && !sending) e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)' }}
                onMouseLeave={e => e.currentTarget.style.transform = ''}>
                {sending
                  ? <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} />
                  : <Send size={18} style={{ transform: 'translateX(1px)' }} />}
              </button>
            </div>

            {/* Hint */}
            <p style={{ textAlign: 'center', fontSize: '0.65rem', color: 'var(--neu-text-ghost)', padding: '0.35rem 0 0.5rem' }}>
              Press{' '}
              <kbd style={{ background: 'var(--neu-surface)', boxShadow: 'var(--neu-raised)', padding: '0.1rem 0.4rem', borderRadius: '0.3rem', fontSize: '0.6rem', fontFamily: 'monospace' }}>Enter</kbd>
              {' '}to send ·{' '}
              <kbd style={{ background: 'var(--neu-surface)', boxShadow: 'var(--neu-raised)', padding: '0.1rem 0.4rem', borderRadius: '0.3rem', fontSize: '0.6rem', fontFamily: 'monospace' }}>Shift+Enter</kbd>
              {' '}for new line
            </p>
          </div>
        )}
      </div>
    </div>
  )
}