import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, Bell, Search, User, LogOut, ChevronDown, CheckCheck, AlertCircle, Info, Megaphone } from 'lucide-react'
import { authStore } from '../../store/authStore'
import { studentAPI } from '../../api/student.api'
import { teacherAPI } from '../../api/teacher.api'

const ROLE_COLOR = {
  admin:   'bg-purple-500',
  teacher: 'bg-emerald-500',
  student: 'bg-blue-500',
}

const BASE_URL = 'http://127.0.0.1:8000'

const PRIORITY_STYLE = {
  urgent: { bg: 'bg-red-50 border-l-red-400',    dot: 'bg-red-500',    icon: '🔴' },
  high:   { bg: 'bg-orange-50 border-l-orange-400', dot: 'bg-orange-500', icon: '🟠' },
  normal: { bg: 'bg-blue-50 border-l-blue-400',   dot: 'bg-blue-500',   icon: '🔵' },
  low:    { bg: 'bg-slate-50 border-l-slate-300',  dot: 'bg-slate-400',  icon: '⚪' },
}

// localStorage se read IDs manage karna
const STORAGE_KEY = 'lms_read_notifications'
const getReadIds = () => {
  try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) }
  catch { return new Set() }
}
const saveReadIds = (ids) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]))
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function Navbar({ onToggleSidebar }) {
  const navigate = useNavigate()
  const [user, setUser] = useState(authStore.getUser())
  useEffect(() => {
    const handleStorageChange = () => {
      setUser(authStore.getUser())
    }
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('profileUpdated', handleStorageChange) // custom event
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('profileUpdated', handleStorageChange)
    }
  }, [])
  const role = user?.role || 'student'

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [bellOpen, setBellOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [loadingNotifs, setLoadingNotifs] = useState(false)
  const [readIds, setReadIds] = useState(getReadIds)

  const dropdownRef = useRef(null)
  const bellRef = useRef(null)

  // unread count
  const unreadCount = notifications.filter(n => !readIds.has(n.id)).length

  // Fetch announcements
  const fetchNotifications = async () => {
    setLoadingNotifs(true)
    try {
      let res
      if (role === 'student') {
        res = await studentAPI.getAnnouncements(1)
        const list = res.data.data?.announcements || []
        setNotifications(list.slice(0, 8))
      } else {
        // teacher or admin — use teacherAPI
        res = await teacherAPI.getAnnouncements(1)
        const list = res.data.data?.announcements || []
        setNotifications(list.slice(0, 8))
      }
    } catch {
      // silent fail — notifications optional hain
    } finally {
      setLoadingNotifs(false)
    }
  }

  // Bell open hone par fetch
  useEffect(() => {
    if (bellOpen) fetchNotifications()
  }, [bellOpen])

  // Outside click → close dropdowns
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false)
      if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = () => {
    authStore.clear()
    navigate('/login')
  }

  const handleProfile = () => {
    setDropdownOpen(false)
    navigate(`/${role}/profile`)
  }

  const markAllRead = () => {
    const allIds = new Set([...readIds, ...notifications.map(n => n.id)])
    setReadIds(allIds)
    saveReadIds(allIds)
  }

  const markOneRead = (id) => {
    const updated = new Set([...readIds, id])
    setReadIds(updated)
    saveReadIds(updated)
  }

  const handleViewAll = () => {
    markAllRead()
    setBellOpen(false)
    navigate(`/${role}/announcements`)
  }

  const avatarUrl = user?.profile_picture_url
    ? `${BASE_URL}${user.profile_picture_url}`
    : null

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6 gap-4 flex-shrink-0 z-40">
      {/* Toggle */}
      <button onClick={onToggleSidebar} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
        <Menu size={20} />
      </button>

      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-9 pr-4 py-2 bg-slate-100 rounded-xl text-sm text-slate-600 placeholder-slate-400 focus:outline-none focus:bg-slate-200 transition-colors"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 ml-auto">

        {/* ── Bell Icon ── */}
        <div className="relative" ref={bellRef}>
          <button
            onClick={() => setBellOpen(p => !p)}
            className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {bellOpen && (
            <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Bell size={16} className="text-slate-600" />
                  <span className="font-display font-bold text-slate-800 text-sm">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                  >
                    <CheckCheck size={13} />
                    Mark all read
                  </button>
                )}
              </div>

              {/* List */}
              <div className="max-h-[380px] overflow-y-auto">
                {loadingNotifs ? (
                  <div className="flex items-center justify-center py-10">
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mb-3">
                      <Bell size={22} className="text-slate-400" />
                    </div>
                    <p className="text-slate-600 font-semibold text-sm">No notifications</p>
                    <p className="text-slate-400 text-xs mt-1">You're all caught up!</p>
                  </div>
                ) : (
                  notifications.map(notif => {
                    const isUnread = !readIds.has(notif.id)
                    const ps = PRIORITY_STYLE[notif.priority] || PRIORITY_STYLE.normal
                    return (
                      <div
                        key={notif.id}
                        onClick={() => markOneRead(notif.id)}
                        className={`flex items-start gap-3 px-4 py-3 border-l-4 border-b border-slate-50 cursor-pointer transition-colors hover:bg-slate-50 ${ps.bg} ${isUnread ? 'opacity-100' : 'opacity-70'}`}
                      >
                        {/* Unread indicator */}
                        <div className="flex-shrink-0 mt-1">
                          {isUnread
                            ? <span className={`w-2.5 h-2.5 rounded-full block ${ps.dot}`} />
                            : <span className="w-2.5 h-2.5 rounded-full block bg-slate-200" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm font-semibold text-slate-800 line-clamp-1 ${isUnread ? 'font-bold' : ''}`}>
                              {notif.title}
                            </p>
                            <span className="text-[10px] text-slate-400 flex-shrink-0 mt-0.5">
                              {timeAgo(notif.created_at)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{notif.content}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] capitalize text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
                              {notif.priority}
                            </span>
                            {notif.target_type && (
                              <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full capitalize">
                                {notif.target_type}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="px-4 py-3 border-t border-slate-100">
                  <button
                    onClick={handleViewAll}
                    className="w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <Megaphone size={14} />
                    View All Announcements
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Avatar + Name + Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(p => !p)}
            className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-slate-100 transition-colors"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="avatar" className="w-8 h-8 rounded-lg object-cover" />
            ) : (
              <div className={`w-8 h-8 ${ROLE_COLOR[role]} rounded-lg flex items-center justify-center text-white font-bold text-sm`}>
                {user?.full_name?.[0]?.toUpperCase() || '?'}
              </div>
            )}
            <div className="text-left hidden sm:block">
              <p className="text-sm font-semibold text-slate-700 leading-tight">{user?.full_name || 'User'}</p>
              <p className="text-xs text-slate-400 capitalize">{role}</p>
            </div>
            <ChevronDown size={14} className={`text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50">
              <button onClick={handleProfile} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                <User size={16} className="text-slate-400" />
                My Profile
              </button>
              <div className="my-1 border-t border-slate-100" />
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                <LogOut size={16} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}