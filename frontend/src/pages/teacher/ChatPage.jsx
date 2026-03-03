import { useState, useEffect, useRef, useCallback } from 'react'
import { teacherAPI } from '../../api/teacher.api'
import { authStore } from '../../store/authStore'
import { timeAgo } from '../../utils/helpers'
import toast from 'react-hot-toast'
import {
  Send, MessageSquare, Loader2, Users,
  BookOpen, Trash2, X, RefreshCw
} from 'lucide-react'

const POLL_INTERVAL = 5000 // 5 seconds polling

// ── Message Bubble ─────────────────────────────────
function MessageBubble({ message, currentUserId, onDelete }) {
  const isOwn = message.sender_id === currentUserId
  const isSystem = message.message_type === 'system'

  if (isSystem) return (
    <div className="text-center">
      <span className="text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-full">{message.message}</span>
    </div>
  )

  return (
    <div className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'} group`}>
      {/* Avatar */}
      {!isOwn && (
        <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 flex-shrink-0 mb-1">
          {message.sender_name?.[0] || '?'}
        </div>
      )}

      <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
        {!isOwn && (
          <p className="text-xs text-slate-500 font-medium mb-1 ml-1">{message.sender_name}</p>
        )}
        <div className={`relative px-4 py-2.5 rounded-2xl text-sm ${
          isOwn
            ? 'bg-blue-600 text-white rounded-br-sm'
            : 'bg-white border border-slate-200 text-slate-700 rounded-bl-sm'
        }`}>
          <p className="whitespace-pre-wrap break-words">{message.message}</p>
          {isOwn && (
            <button
              onClick={() => onDelete(message.id)}
              className="absolute -top-2 -left-2 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              title="Delete message"
            >
              <X size={10} />
            </button>
          )}
        </div>
        <p className={`text-xs text-slate-400 mt-1 ${isOwn ? 'mr-1' : 'ml-1'}`}>{timeAgo(message.sent_at)}</p>
      </div>
    </div>
  )
}

// ── Group Selector ─────────────────────────────────
function GroupSelector({ groups, selectedGroup, onSelect, loading }) {
  return (
    <div className="w-72 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col h-full">
      <div className="p-4 border-b border-slate-100">
        <h2 className="font-display font-bold text-slate-800">Class Chats</h2>
        <p className="text-slate-400 text-xs mt-0.5">{groups.length} groups</p>
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse flex items-center gap-3 p-3">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-slate-100 rounded-lg w-2/3" />
                  <div className="h-2.5 bg-slate-100 rounded-lg w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center px-4">
            <MessageSquare size={32} className="text-slate-300 mb-2" />
            <p className="text-slate-500 text-sm font-medium">No chat groups</p>
            <p className="text-slate-400 text-xs mt-1">Groups auto-created with offerings</p>
          </div>
        ) : (
          groups.map(g => (
            <button key={g.id} onClick={() => onSelect(g)}
              className={`w-full flex items-center gap-3 p-3.5 transition-colors hover:bg-slate-50 border-b border-slate-50 text-left ${selectedGroup?.id === g.id ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''}`}>
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <BookOpen size={16} className="text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-700 truncate">{g.name}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Users size={10} className="text-slate-400" />
                  <span className="text-xs text-slate-400">{g.member_count || 0} members</span>
                </div>
              </div>
              {g.unread_count > 0 && (
                <span className="bg-blue-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {g.unread_count}
                </span>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────
export default function ChatPage() {
  const user = authStore.getUser()
  const currentUserId = user?.user_id

  const [groups, setGroups] = useState([])
  const [groupsLoading, setGroupsLoading] = useState(true)
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [messages, setMessages] = useState([])
  const [msgLoading, setMsgLoading] = useState(false)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [lastMessageId, setLastMessageId] = useState(null)

  const messagesEndRef = useRef(null)
  const pollRef = useRef(null)
  const inputRef = useRef(null)

  // ── Load groups ────────────────────────────────
  useEffect(() => {
    teacherAPI.getChatGroups()
      .then(r => setGroups(r.data.data?.groups || []))
      .catch(() => toast.error('Failed to load chat groups'))
      .finally(() => setGroupsLoading(false))
  }, [])

  // ── Load messages + start polling ─────────────
  const fetchMessages = useCallback(async (groupId, isInitial = false) => {
    if (!groupId) return
    if (isInitial) setMsgLoading(true)
    try {
      const res = await teacherAPI.getChatMessages(groupId)
      const newMsgs = res.data.data?.messages || []
      setMessages(newMsgs)
      if (newMsgs.length > 0) setLastMessageId(newMsgs[newMsgs.length - 1]?.id)
    } catch { /* silent on polling errors */ }
    finally { if (isInitial) setMsgLoading(false) }
  }, [])

  useEffect(() => {
    if (!selectedGroup) return

    // Initial load
    fetchMessages(selectedGroup.id, true)

    // Start polling
    pollRef.current = setInterval(() => {
      fetchMessages(selectedGroup.id, false)
    }, POLL_INTERVAL)

    return () => clearInterval(pollRef.current)
  }, [selectedGroup])

  // ── Auto scroll ────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Send message ───────────────────────────────
  const handleSend = async () => {
    const text = input.trim()
    if (!text || !selectedGroup) return
    setSending(true)
    try {
      await teacherAPI.sendMessage(selectedGroup.id, { message: text, message_type: 'text' })
      setInput('')
      await fetchMessages(selectedGroup.id, false)
      inputRef.current?.focus()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to send') }
    finally { setSending(false) }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const handleDelete = async (messageId) => {
    try {
      await teacherAPI.deleteMessage(messageId)
      setMessages(prev => prev.filter(m => m.id !== messageId))
      toast.success('Message deleted')
    } catch { toast.error('Failed to delete') }
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-5">
        <h1 className="font-display font-bold text-2xl text-slate-800">Class Chat</h1>
        <p className="text-slate-400 text-sm mt-0.5">Real-time communication with students</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex" style={{ height: 'calc(100vh - 220px)' }}>
        {/* Left — Group list */}
        <GroupSelector
          groups={groups}
          selectedGroup={selectedGroup}
          onSelect={setSelectedGroup}
          loading={groupsLoading}
        />

        {/* Right — Messages */}
        {!selectedGroup ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
              <MessageSquare size={28} className="text-slate-400" />
            </div>
            <p className="font-display font-bold text-slate-600 text-lg">Select a chat group</p>
            <p className="text-slate-400 text-sm mt-1">Choose a course chat from the left to start messaging</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-w-0">
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
                  <BookOpen size={16} className="text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{selectedGroup.name}</p>
                  <p className="text-xs text-slate-400">{selectedGroup.member_count || 0} members · Polling every 5s</p>
                </div>
              </div>
              <button onClick={() => fetchMessages(selectedGroup.id, false)}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors" title="Refresh">
                <RefreshCw size={15} className="text-slate-400" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {msgLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="animate-spin text-blue-600 w-6 h-6" />
                    <p className="text-slate-400 text-sm">Loading messages...</p>
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageSquare size={36} className="text-slate-300 mb-3" />
                  <p className="text-slate-500 font-medium">No messages yet</p>
                  <p className="text-slate-400 text-sm">Be the first to say something!</p>
                </div>
              ) : (
                messages.map(msg => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    currentUserId={currentUserId}
                    onDelete={handleDelete}
                  />
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-slate-100">
              <div className="flex items-end gap-3">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message... (Enter to send, Shift+Enter for newline)"
                  rows={1}
                  style={{ minHeight: '44px', maxHeight: '120px' }}
                  className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-blue-400 transition-all resize-none"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || sending}
                  className="w-11 h-11 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-colors flex-shrink-0 shadow-sm shadow-blue-600/20"
                >
                  {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-1.5 ml-1">As teacher, you can delete any message by hovering over it</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
