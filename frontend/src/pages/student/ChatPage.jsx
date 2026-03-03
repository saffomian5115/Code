// Same pattern as teacher ChatPage — just uses studentAPI instead
import { useState, useEffect, useRef, useCallback } from 'react'
import { studentAPI } from '../../api/student.api'
import { authStore } from '../../store/authStore'
import { timeAgo } from '../../utils/helpers'
import toast from 'react-hot-toast'
import { Send, MessageSquare, Loader2, Users, BookOpen, RefreshCw } from 'lucide-react'

const POLL_INTERVAL = 5000

function MessageBubble({ message, currentUserId }) {
  const isOwn = message.sender_id === currentUserId
  if (message.message_type === 'system') return (
    <div className="text-center">
      <span className="text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-full">{message.message}</span>
    </div>
  )
  return (
    <div className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isOwn && (
        <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 flex-shrink-0 mb-1">
          {message.sender_name?.[0] || '?'}
        </div>
      )}
      <div className={`max-w-[70%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
        {!isOwn && <p className="text-xs text-slate-500 font-medium mb-1 ml-1">{message.sender_name}</p>}
        <div className={`px-4 py-2.5 rounded-2xl text-sm ${isOwn ? 'bg-emerald-600 text-white rounded-br-sm' : 'bg-white border border-slate-200 text-slate-700 rounded-bl-sm'}`}>
          <p className="whitespace-pre-wrap break-words">{message.message}</p>
        </div>
        <p className={`text-xs text-slate-400 mt-1 ${isOwn ? 'mr-1' : 'ml-1'}`}>{timeAgo(message.sent_at)}</p>
      </div>
    </div>
  )
}

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
  const messagesEndRef = useRef(null)
  const pollRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    studentAPI.getChatGroups()
      .then(r => setGroups(r.data.data?.groups || []))
      .catch(() => toast.error('Failed to load groups'))
      .finally(() => setGroupsLoading(false))
  }, [])

  const fetchMessages = useCallback(async (groupId, isInitial = false) => {
    if (!groupId) return
    if (isInitial) setMsgLoading(true)
    try {
      const res = await studentAPI.getChatMessages(groupId)
      setMessages(res.data.data?.messages || [])
    } catch { }
    finally { if (isInitial) setMsgLoading(false) }
  }, [])

  useEffect(() => {
    if (!selectedGroup) return
    fetchMessages(selectedGroup.id, true)
    pollRef.current = setInterval(() => fetchMessages(selectedGroup.id), POLL_INTERVAL)
    return () => clearInterval(pollRef.current)
  }, [selectedGroup])

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || !selectedGroup) return
    setSending(true)
    try {
      await studentAPI.sendMessage(selectedGroup.id, { message: text, message_type: 'text' })
      setInput('')
      await fetchMessages(selectedGroup.id)
      inputRef.current?.focus()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSending(false) }
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-5">
        <h1 className="font-display font-bold text-2xl text-slate-800">Class Chat</h1>
        <p className="text-slate-400 text-sm mt-0.5">Chat with classmates and teachers</p>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex" style={{ height: 'calc(100vh - 220px)' }}>
        {/* Groups */}
        <div className="w-72 flex-shrink-0 border-r border-slate-200 flex flex-col">
          <div className="p-4 border-b border-slate-100">
            <h2 className="font-display font-bold text-slate-800 text-sm">My Chats</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {groupsLoading ? (
              <div className="p-4 space-y-3">{Array.from({length:3}).map((_,i)=>(<div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />))}</div>
            ) : groups.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 px-4 text-center">
                <MessageSquare size={28} className="text-slate-300 mb-2" />
                <p className="text-slate-400 text-sm">No chat groups yet</p>
              </div>
            ) : (
              groups.map(g => (
                <button key={g.id} onClick={() => setSelectedGroup(g)}
                  className={`w-full flex items-center gap-3 p-3.5 border-b border-slate-50 text-left hover:bg-slate-50 transition-colors ${selectedGroup?.id === g.id ? 'bg-emerald-50 border-l-2 border-l-emerald-500' : ''}`}>
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <BookOpen size={16} className="text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700 truncate">{g.name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Users size={10} className="text-slate-400" />
                      <span className="text-xs text-slate-400">{g.member_count || 0} members</span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Messages */}
        {!selectedGroup ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <MessageSquare size={36} className="text-slate-300 mb-3" />
            <p className="font-semibold text-slate-600">Select a chat</p>
            <p className="text-slate-400 text-sm mt-1">Choose a course group to start chatting</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-w-0">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <BookOpen size={15} className="text-emerald-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{selectedGroup.name}</p>
                  <p className="text-xs text-slate-400">{selectedGroup.member_count || 0} members</p>
                </div>
              </div>
              <button onClick={() => fetchMessages(selectedGroup.id)} className="p-2 hover:bg-slate-100 rounded-xl">
                <RefreshCw size={14} className="text-slate-400" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {msgLoading ? (
                <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-emerald-500 w-6 h-6" /></div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageSquare size={32} className="text-slate-300 mb-2" />
                  <p className="text-slate-400 text-sm">No messages yet</p>
                </div>
              ) : (
                messages.map(msg => <MessageBubble key={msg.id} message={msg} currentUserId={currentUserId} />)
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t border-slate-100 flex items-end gap-3">
              <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                placeholder="Type a message..." rows={1}
                style={{ minHeight: '44px', maxHeight: '100px' }}
                className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-400 resize-none" />
              <button onClick={handleSend} disabled={!input.trim() || sending}
                className="w-11 h-11 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-colors flex-shrink-0">
                {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}