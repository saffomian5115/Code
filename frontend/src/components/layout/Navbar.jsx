import { useState, useRef, useEffect, useCallback, forwardRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell, User, LogOut, ChevronDown,
  Sun, Moon, Search, GraduationCap,
  BookOpen, ClipboardCheck, FileText, BarChart2, CreditCard,
  MessageSquare, Users, Building2, Calendar, Layers,
  DoorOpen, LineChart, ScanLine, BookMarked, Receipt,
  PenSquare, BrainCircuit, Sparkles, Megaphone, PenLine,
  AlertCircle, CheckCircle2,
} from 'lucide-react'
import { authStore } from '../../store/authStore'
import { useTheme } from '../../context/ThemeContext'
import api from '../../api/axios'

const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://127.0.0.1:8000'
const BASE_SIZE = 38
const MAX_SIZE = 48
const DISTANCE = 100

const ROLE_CONFIG = {
  admin:   { accent: '#9b59b6', bg: 'rgba(155,89,182,0.15)', label: 'Administrator' },
  teacher: { accent: '#22a06b', bg: 'rgba(62,207,142,0.15)', label: 'Teacher'       },
  student: { accent: '#5b8af0', bg: 'rgba(91,138,240,0.15)', label: 'Student'       },
}

// ── Notification type config ──────────────────────────────────
const NOTIF_CFG = {
  announcement: { color: '#f97316', bg: 'rgba(249,115,22,0.12)',  icon: Megaphone,    label: 'Announcement' },
  quiz:         { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', icon: PenLine,      label: 'Quiz'         },
  assignment:   { color: '#5b8af0', bg: 'rgba(91,138,240,0.12)',  icon: FileText,     label: 'Assignment'   },
  fee:          { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   icon: CreditCard,   label: 'Fee'          },
  result:       { color: '#3ecf8e', bg: 'rgba(62,207,142,0.12)', icon: CheckCircle2, label: 'Result'       },
  notice:       { color: '#94a3b8', bg: 'rgba(148,163,184,0.12)',icon: AlertCircle,  label: 'Notice'       },
}

// ── localStorage read tracking ────────────────────────────────
const STORAGE_KEY = 'lms_read_notifs'
function getReadIds() {
  try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) }
  catch { return new Set() }
}
function persistReadIds(ids) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]))
}

// ── Time ago helper ───────────────────────────────────────────
function timeAgo(d) {
  if (!d) return ''
  const s = Math.floor((Date.now() - new Date(d)) / 1000)
  if (s < 60)    return `${s}s ago`
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

// ── Searchable items ──────────────────────────────────────────
const ALL_ITEMS = {
  admin: [
    { label: 'Dashboard',      icon: LineChart,     to: '/admin/dashboard',       desc: 'Main overview'               },
    { label: 'Students',       icon: GraduationCap, to: '/admin/students',        desc: 'Manage students'             },
    { label: 'Teachers',       icon: Users,         to: '/admin/teachers',        desc: 'Manage teachers'             },
    { label: 'Departments',    icon: Building2,     to: '/admin/departments',     desc: 'Academic departments'        },
    { label: 'Programs',       icon: BookMarked,    to: '/admin/programs',        desc: 'Degree programs'             },
    { label: 'Semesters',      icon: Calendar,      to: '/admin/semesters',       desc: 'Semester management'         },
    { label: 'Courses',        icon: BookOpen,      to: '/admin/courses',         desc: 'Course catalog'              },
    { label: 'Offerings',      icon: Layers,        to: '/admin/offerings',       desc: 'Course offerings & sections' },
    { label: 'Enrollments',    icon: ClipboardCheck,to: '/admin/enrollments',     desc: 'Student enrollments'         },
    { label: 'Fee Structure',  icon: CreditCard,    to: '/admin/fee/structure',   desc: 'Fee structure setup'         },
    { label: 'Fee Vouchers',   icon: Receipt,       to: '/admin/fee/vouchers',    desc: 'Fee vouchers & payments'     },
    { label: 'Announcements',  icon: Bell,          to: '/admin/announcements',   desc: 'Post announcements'          },
    { label: 'Notices',        icon: FileText,      to: '/admin/notices',         desc: 'Notice board'                },
    { label: 'Gates',          icon: DoorOpen,      to: '/admin/gates',           desc: 'Campus gate management'      },
    { label: 'Gate Attendance',icon: ScanLine,      to: '/admin/gate-attendance', desc: 'Face recognition attendance' },
    { label: 'Analytics',      icon: LineChart,     to: '/admin/analytics',       desc: 'AI student analytics'        },
  ],
  teacher: [
    { label: 'Dashboard',     icon: LineChart,     to: '/teacher/dashboard',    desc: 'Teacher overview'            },
    { label: 'My Courses',    icon: BookOpen,      to: '/teacher/courses',      desc: 'Assigned courses'            },
    { label: 'Attendance',    icon: ClipboardCheck,to: '/teacher/attendance',   desc: 'Mark class attendance'       },
    { label: 'Assignments',   icon: FileText,      to: '/teacher/assignments',  desc: 'Create & grade assignments'  },
    { label: 'Quizzes',       icon: PenSquare,     to: '/teacher/quizzes',      desc: 'Manage quizzes'              },
    { label: 'Results',       icon: BarChart2,     to: '/teacher/results',      desc: 'Exam results & grades'       },
    { label: 'Announcements', icon: Bell,          to: '/teacher/announcements',desc: 'View announcements'          },
    { label: 'Notices',       icon: FileText,      to: '/teacher/notices',      desc: 'Notice board'                },
    { label: 'Chat',          icon: MessageSquare, to: '/teacher/chat',         desc: 'Class chat groups'           },
  ],
  student: [
    { label: 'Dashboard',     icon: LineChart,     to: '/student/dashboard',    desc: 'Student overview'            },
    { label: 'My Courses',    icon: BookOpen,      to: '/student/courses',      desc: 'Enrolled courses'            },
    { label: 'Attendance',    icon: ClipboardCheck,to: '/student/attendance',   desc: 'View attendance records'     },
    { label: 'Assignments',   icon: FileText,      to: '/student/assignments',  desc: 'Pending assignments'         },
    { label: 'Quizzes',       icon: PenSquare,     to: '/student/quizzes',      desc: 'Class quizzes'               },
    { label: 'Results',       icon: BarChart2,     to: '/student/results',      desc: 'Exam results & CGPA'         },
    { label: 'Fee',           icon: CreditCard,    to: '/student/fee',          desc: 'Fee vouchers & payments'     },
    { label: 'Announcements', icon: Bell,          to: '/student/announcements',desc: 'University announcements'    },
    { label: 'Notices',       icon: FileText,      to: '/student/notices',      desc: 'Notice board'                },
    { label: 'Chat',          icon: MessageSquare, to: '/student/chat',         desc: 'Course chat groups'          },
    { label: 'AI Assistant',  icon: BrainCircuit,  to: '/student/ai',           desc: 'Ask AI anything'             },
    { label: 'Practice Quiz', icon: Sparkles,      to: '/student/practice-quiz',desc: 'AI-generated practice'      },
    
  ],
}

// ── Notification fetcher ──────────────────────────────────────
async function fetchNotifications(role) {
  const items = []
  const now = Date.now()
  const WEEK = 7 * 24 * 60 * 60 * 1000

  // Announcements — all roles
  try {
    const r = await api.get('/announcements?page=1&per_page=10')
    const anns = r?.data?.data?.announcements || []
    anns.forEach(a => {
      if (now - new Date(a.created_at) < WEEK) {
        items.push({
          id: `ann_${a.id}`,
          type: 'announcement',
          title: a.title,
          body: (a.content || '').slice(0, 85) + ((a.content || '').length > 85 ? '…' : ''),
          time: a.created_at,
          to: `/${role}/announcements`,
          priority: a.priority,
          urgent: a.priority === 'urgent' || a.priority === 'high',
        })
      }
    })
  } catch (_) {}

  // Notices — all roles
  try {
    const r = await api.get('/notices?page=1&per_page=5')
    const notices = r?.data?.data?.notices || []
    notices.forEach(n => {
      if (now - new Date(n.posted_at) < WEEK) {
        items.push({
          id: `notice_${n.id}`,
          type: 'notice',
          title: n.title,
          body: (n.content || '').slice(0, 85) + ((n.content || '').length > 85 ? '…' : ''),
          time: n.posted_at,
          to: `/${role}/notices`,
        })
      }
    })
  } catch (_) {}

  // Student specific
  if (role === 'student') {
    try {
      const enrR = await api.get('/students/me/enrollments')
      const enrollments = (enrR?.data?.data?.enrollments || []).filter(e => e.is_approved).slice(0, 4)

      for (const enr of enrollments) {
        // Assignments due in 3 days
        try {
          const aR = await api.get(`/offerings/${enr.offering_id}/assignments`)
          const assignments = aR?.data?.data?.assignments || []
          assignments.forEach(a => {
            const due = new Date(a.due_date)
            const diff = due - new Date()
            if (diff > 0 && diff < 3 * 24 * 60 * 60 * 1000) {
              items.push({
                id: `assign_due_${a.id}`,
                type: 'assignment',
                title: `Assignment Due: ${a.title}`,
                body: `${enr.course_name} · Due ${due.toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}`,
                time: a.due_date,
                to: '/student/assignments',
                urgent: diff < 24 * 60 * 60 * 1000,
              })
            }
          })
        } catch (_) {}

        // Active quizzes
        try {
          const qR = await api.get(`/offerings/${enr.offering_id}/quizzes`)
          const quizzes = qR?.data?.data?.quizzes || []
          quizzes.forEach(q => {
            const start = q.start_time ? new Date(q.start_time) : null
            const end = q.end_time ? new Date(q.end_time) : null
            const isActive = (!start || start <= new Date()) && (!end || end > new Date())
            const isRecent = !start || (now - start < WEEK)
            if (isActive && isRecent) {
              items.push({
                id: `quiz_active_${q.id}`,
                type: 'quiz',
                title: `Quiz Active: ${q.title}`,
                body: `${enr.course_name} · ${q.total_questions} questions · ${q.total_marks} marks`,
                time: q.start_time || new Date().toISOString(),
                to: '/student/quizzes',
              })
            }
          })
        } catch (_) {}
      }

      // Overdue fees
      try {
        const fR = await api.get('/students/me/vouchers')
        const vouchers = fR?.data?.data?.vouchers || []
        vouchers.filter(v => v.status === 'overdue').forEach(v => {
          items.push({
            id: `fee_overdue_${v.id}`,
            type: 'fee',
            title: 'Fee Payment Overdue',
            body: `Voucher ${v.voucher_number} · Rs ${Number(v.amount).toLocaleString()}`,
            time: v.due_date,
            to: '/student/fee',
            urgent: true,
          })
        })
      } catch (_) {}
    } catch (_) {}
  }

  // Teacher specific — pending submissions
  if (role === 'teacher') {
    try {
      const offR = await api.get('/teachers/me/offerings')
      const offerings = offR?.data?.data?.offerings || []
      for (const off of offerings.slice(0, 3)) {
        try {
          const aR = await api.get(`/offerings/${off.id}/assignments`)
          const assignments = aR?.data?.data?.assignments || []
          for (const a of assignments.slice(0, 4)) {
            try {
              const sR = await api.get(`/assignments/${a.id}/submissions`)
              const subs = sR?.data?.data?.submissions || []
              const pending = subs.filter(s => s.status === 'submitted' || s.status === 'late')
              if (pending.length > 0) {
                items.push({
                  id: `grade_pending_${a.id}`,
                  type: 'assignment',
                  title: `${pending.length} Submission${pending.length > 1 ? 's' : ''} Need Grading`,
                  body: `${a.title} · ${off.course_name}`,
                  time: new Date().toISOString(),
                  to: '/teacher/assignments',
                })
              }
            } catch (_) {}
          }
        } catch (_) {}
      }
    } catch (_) {}
  }

  // Deduplicate + sort by time desc
  const seen = new Set()
  return items
    .filter(n => { if (seen.has(n.id)) return false; seen.add(n.id); return true })
    .sort((a, b) => new Date(b.time) - new Date(a.time))
    .slice(0, 25)
}

// ── Magnified Button ──────────────────────────────────────────
const MagnifiedButton = forwardRef(({ children, onClick, mouseX, isAvatar = false, style = {}, title, ...props }, ref) => {
  const localRef = useRef(null)
  const [size, setSize] = useState(BASE_SIZE)

  useEffect(() => {
    if (!localRef.current || mouseX === -9999) { setSize(BASE_SIZE); return }
    const rect = localRef.current.getBoundingClientRect()
    const center = rect.left + rect.width / 2
    const dist = Math.abs(mouseX - center)
    if (dist >= DISTANCE) { setSize(BASE_SIZE); return }
    const t = 1 - dist / DISTANCE
    const eased = t * t * (3 - 2 * t)
    setSize(BASE_SIZE + (MAX_SIZE - BASE_SIZE) * eased)
  }, [mouseX])

  return (
    <button
      ref={(node) => {
        localRef.current = node
        if (ref) {
          if (typeof ref === 'function') ref(node)
          else ref.current = node
        }
      }}
      onClick={onClick}
      title={title}
      style={{
        width: isAvatar ? 'auto' : `${size}px`,
        height: `${size}px`,
        minWidth: isAvatar ? 'auto' : `${size}px`,
        borderRadius: isAvatar ? '2rem' : '0.85rem',
        background: 'var(--neu-surface)',
        boxShadow: '4px 4px 10px var(--neu-shadow-dark), -2px -2px 8px var(--neu-shadow-light)',
        border: '1px solid var(--neu-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', color: 'var(--neu-text-secondary)',
        transition: 'width 0.1s ease, height 0.1s ease',
        padding: isAvatar ? '0 0.8rem 0 0.3rem' : '0',
        flexShrink: 0, position: 'relative', ...style,
      }}
      {...props}
    >
      {children}
    </button>
  )
})

// ── Search Overlay (Dropdown version - opens below icon) ──────────────────
function SearchOverlay({ open, onClose, role, anchorRef }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [selected, setSelected] = useState(0)
  const inputRef = useRef(null)
  const navigate = useNavigate()
  const allItems = ALL_ITEMS[role] || []
  const [position, setPosition] = useState({ top: 0, right: 0 })

  // Calculate position relative to search icon
  useEffect(() => {
    if (open && anchorRef?.current) {
      const rect = anchorRef.current.getBoundingClientRect()
      setPosition({
        top: rect.bottom + 8,  // 8px gap below icon
        right: window.innerWidth - rect.right  // Align to right edge of icon
      })
    }
  }, [open, anchorRef])

  useEffect(() => {
    if (open) {
      setQuery(''); setResults(allItems.slice(0, 6)); setSelected(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open, role])

  useEffect(() => {
    if (!query.trim()) { setResults(allItems.slice(0, 6)); setSelected(0); return }
    const q = query.toLowerCase()
    setResults(allItems.filter(i => i.label.toLowerCase().includes(q) || i.desc.toLowerCase().includes(q)).slice(0, 8))
    setSelected(0)
  }, [query, role])

  const handleSelect = useCallback((item) => { navigate(item.to); onClose() }, [navigate, onClose])
  const handleKey = useCallback((e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)) }
    else if (e.key === 'Enter' && results[selected]) handleSelect(results[selected])
    else if (e.key === 'Escape') onClose()
  }, [results, selected, handleSelect, onClose])

  // Click outside to close
  const dropdownRef = useRef(null)
  useEffect(() => {
    function handleClickOutside(e) {
      if (open && dropdownRef.current && !dropdownRef.current.contains(e.target) && 
          anchorRef?.current && !anchorRef.current.contains(e.target)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open, onClose, anchorRef])

  if (!open) return null

  return (
    <div 
      ref={dropdownRef}
      style={{ 
        position: 'fixed',
        top: position.top,
        right: position.right,
        zIndex: 9999,
        width: 400,
      }}
    >
      <style>{`@keyframes searchIn{from{opacity:0;transform:scale(.95) translateY(-10px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>
      <div 
        style={{ 
          width: '100%', 
          background: 'var(--neu-surface)', 
          borderRadius: '1rem', 
          border: '1px solid var(--neu-border)', 
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2), 0 8px 10px -6px rgba(0,0,0,0.1)',
          overflow: 'hidden', 
          animation: 'searchIn 0.2s cubic-bezier(0.34,1.56,0.64,1)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderBottom: '1px solid var(--neu-border)' }}>
          <Search size={16} style={{ color: 'var(--neu-text-ghost)', flexShrink: 0 }} />
          <input 
            ref={inputRef} 
            value={query} 
            onChange={e => setQuery(e.target.value)} 
            onKeyDown={handleKey} 
            placeholder="Search pages, features..." 
            style={{ 
              flex: 1, 
              background: 'transparent', 
              border: 'none', 
              outline: 'none', 
              fontSize: '0.85rem', 
              color: 'var(--neu-text-primary)', 
              fontFamily: "'DM Sans', sans-serif" 
            }} 
            autoFocus
          />
          <kbd style={{ 
            fontSize: '0.65rem', 
            padding: '0.2rem 0.4rem', 
            background: 'var(--neu-surface-deep)', 
            borderRadius: '0.3rem',
            color: 'var(--neu-text-ghost)',
            fontFamily: 'monospace'
          }}>
            ESC
          </kbd>
        </div>
        
        <div style={{ maxHeight: 360, overflowY: 'auto', padding: '0.4rem' }}>
          {results.length === 0
            ? <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--neu-text-ghost)', fontSize: '0.82rem' }}>No results for "{query}"</div>
            : results.map((item, i) => {
              const Icon = item.icon; const isActive = i === selected
              return (
                <div 
                  key={item.to} 
                  onClick={() => handleSelect(item)} 
                  onMouseEnter={() => setSelected(i)}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.75rem', 
                    padding: '0.6rem 0.8rem', 
                    borderRadius: '0.75rem', 
                    cursor: 'pointer', 
                    background: isActive ? 'var(--neu-surface-deep)' : 'transparent', 
                    transition: 'background 0.1s' 
                  }}
                >
                  <div style={{ 
                    width: 32, 
                    height: 32, 
                    borderRadius: '0.6rem', 
                    background: 'var(--neu-surface-deep)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    flexShrink: 0, 
                    color: isActive ? 'var(--neu-accent)' : 'var(--neu-text-ghost)' 
                  }}>
                    <Icon size={14} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--neu-text-primary)', margin: 0 }}>{item.label}</p>
                    <p style={{ fontSize: '0.7rem', color: 'var(--neu-text-ghost)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.desc}</p>
                  </div>
                </div>
              )
            })}
        </div>
      </div>
    </div>
  )
}

// ── Notification Panel ────────────────────────────────────────
function NotificationPanel({ notifications, readIds, onMarkRead, onMarkAllRead, onNavigate, loading }) {
  const unreadCount = notifications.filter(n => !readIds.has(n.id)).length
  return (
    <div style={{ width: 360, background: 'var(--neu-surface)', borderRadius: '1.25rem', border: '1px solid var(--neu-border)', boxShadow: '12px 12px 30px var(--neu-shadow-dark), -6px -6px 18px var(--neu-shadow-light)', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '0.9rem 1.1rem', borderBottom: '1px solid var(--neu-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <p style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit, sans-serif', margin: 0 }}>Notifications</p>
          {unreadCount > 0 && (
            <span style={{ fontSize: '0.62rem', fontWeight: 800, padding: '0.1rem 0.5rem', background: '#ef4444', color: '#fff', borderRadius: '99px', minWidth: 18, textAlign: 'center' }}>{unreadCount}</span>
          )}
        </div>
        {unreadCount > 0 && (
          <button onClick={onMarkAllRead} style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--neu-accent)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", padding: '0.2rem 0.4rem', borderRadius: '0.35rem' }}>
            Mark all read
          </button>
        )}
      </div>

      {/* Body */}
      <div style={{ maxHeight: 400, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.75rem' }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{ height: 64, borderRadius: '0.75rem', background: 'var(--neu-surface-deep)', animation: 'shimmer 1.4s ease-in-out infinite', animationDelay: `${i * 0.12}s` }} />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: '2.5rem 1rem', textAlign: 'center' }}>
            <div style={{ width: 44, height: 44, borderRadius: '0.875rem', background: 'var(--neu-surface-deep)', boxShadow: 'inset 3px 3px 7px var(--neu-shadow-dark), inset -2px -2px 5px var(--neu-shadow-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem', color: 'var(--neu-text-ghost)' }}>
              <Bell size={20} />
            </div>
            <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--neu-text-secondary)', margin: 0 }}>All caught up!</p>
            <p style={{ fontSize: '0.72rem', color: 'var(--neu-text-ghost)', marginTop: '0.25rem' }}>No notifications in the last 7 days</p>
          </div>
        ) : (
          <div style={{ padding: '0.4rem' }}>
            {notifications.map((notif) => {
              const isRead = readIds.has(notif.id)
              const cfg = NOTIF_CFG[notif.type] || NOTIF_CFG.notice
              const Icon = cfg.icon
              return (
                <div
                  key={notif.id}
                  onClick={() => { onMarkRead([notif.id]); onNavigate(notif.to) }}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', padding: '0.7rem 0.75rem', borderRadius: '0.875rem', cursor: 'pointer', background: isRead ? 'transparent' : `${cfg.color}09`, marginBottom: '0.1rem', transition: 'background 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--neu-surface-deep)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = isRead ? 'transparent' : `${cfg.color}09` }}
                >
                  <div style={{ width: 34, height: 34, borderRadius: '0.65rem', background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={14} style={{ color: cfg.color }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.35rem', marginBottom: '0.15rem' }}>
                      <p style={{ fontSize: '0.78rem', fontWeight: isRead ? 600 : 800, color: 'var(--neu-text-primary)', margin: 0, lineHeight: 1.35, flex: 1 }}>{notif.title}</p>
                      {notif.urgent && !isRead && (
                        <span style={{ fontSize: '0.55rem', fontWeight: 800, padding: '0.1rem 0.35rem', background: 'rgba(239,68,68,0.15)', color: '#ef4444', borderRadius: '0.3rem', flexShrink: 0, whiteSpace: 'nowrap' }}>Urgent</span>
                      )}
                    </div>
                    {notif.body && (
                      <p style={{ fontSize: '0.7rem', color: 'var(--neu-text-ghost)', margin: 0, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{notif.body}</p>
                    )}
                    <p style={{ fontSize: '0.62rem', color: 'var(--neu-text-ghost)', margin: '0.2rem 0 0', opacity: 0.75 }}>{timeAgo(notif.time)}</p>
                  </div>
                  {!isRead && (
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.color, flexShrink: 0, marginTop: '0.4rem', boxShadow: `0 0 5px ${cfg.color}88` }} />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {notifications.length > 0 && (
        <div style={{ padding: '0.55rem', borderTop: '1px solid var(--neu-border)', textAlign: 'center' }}>
          <span style={{ fontSize: '0.65rem', color: 'var(--neu-text-ghost)' }}>
            {notifications.length} notification{notifications.length !== 1 ? 's' : ''} · last 7 days
          </span>
        </div>
      )}
    </div>
  )
}

// ── Main Navbar ───────────────────────────────────────────────
export default function Navbar({ onToggleSidebar }) {
  const navigate = useNavigate()
  const { isDark, toggleTheme } = useTheme()
  const user = authStore.getUser()
  const role = user?.role || 'student'
  const rc = ROLE_CONFIG[role] || ROLE_CONFIG.student
  const avatarUrl = user?.profile_picture_url
    ? user.profile_picture_url.startsWith('http') ? user.profile_picture_url : `${BASE_URL}${user.profile_picture_url}`
    : null

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [bellOpen, setBellOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [mouseX, setMouseX] = useState(-9999)

  // Notifications
  const [notifications, setNotifications] = useState([])
  const [readIds, setReadIds] = useState(() => getReadIds())
  const [notifLoading, setNotifLoading] = useState(false)
  const [notifFetched, setNotifFetched] = useState(false)

  const dropdownRef = useRef(null)
  const bellRef = useRef(null)
  const searchButtonRef = useRef(null)  // Ref for search button

  const unreadCount = notifications.filter(n => !readIds.has(n.id)).length

  const loadNotifications = useCallback(async (silent = false) => {
    if (!user) return
    if (!silent) setNotifLoading(true)
    try {
      const items = await fetchNotifications(role)
      setNotifications(items)
      setNotifFetched(true)
    } catch (_) {}
    finally { if (!silent) setNotifLoading(false) }
  }, [role, user])

  // Load on bell open (first time)
  useEffect(() => {
    if (bellOpen && !notifFetched) loadNotifications()
  }, [bellOpen, notifFetched, loadNotifications])

  // Silent background poll every 2 min
  useEffect(() => {
    if (!user) return
    // Initial silent load after 3s
    const t = setTimeout(() => loadNotifications(true), 10000)
    const interval = setInterval(() => loadNotifications(true), 2 * 60 * 1000)
    return () => { clearTimeout(t); clearInterval(interval) }
  }, [loadNotifications])

  const handleMarkRead = useCallback((ids) => {
    const next = new Set(readIds)
    ids.forEach(id => next.add(id))
    persistReadIds(next)
    setReadIds(next)
  }, [readIds])

  const handleMarkAllRead = useCallback(() => {
    const next = new Set(readIds)
    notifications.forEach(n => next.add(n.id))
    persistReadIds(next)
    setReadIds(next)
  }, [readIds, notifications])

  // ── Outside click — properly closes all dropdowns ──────────
  useEffect(() => {
    function onMouseDown(e) {
      if (bellOpen && bellRef.current && !bellRef.current.contains(e.target)) {
        setBellOpen(false)
      }
      if (dropdownOpen && dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    function onKeyDown(e) {
      if (e.key === 'Escape') {
        setBellOpen(false)
        setDropdownOpen(false)
        setSearchOpen(false)
      }
    }
    // mousedown fires before click, so dropdowns close cleanly
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [bellOpen, dropdownOpen])

  // Ctrl+K
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const handleMouseMove = useCallback((e) => setMouseX(e.clientX), [])
  const handleMouseLeave = useCallback(() => setMouseX(-9999), [])
  const handleLogout = () => { authStore.clear(); navigate('/login') }

  return (
    <>
      <header
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ height: '65px', background: 'var(--neu-surface)', borderBottom: '1px solid var(--neu-border)', display: 'flex', alignItems: 'center', padding: '0 1.5rem', gap: '1rem', zIndex: 100, position: 'relative' }}
      >
        {/* ── Left ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Hamburger */}
          <button onClick={onToggleSidebar} style={{ width: 38, height: 38, borderRadius: '0.85rem', background: 'var(--neu-surface)', boxShadow: '4px 4px 10px var(--neu-shadow-dark), -2px -2px 8px var(--neu-shadow-light)', border: '1px solid var(--neu-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--neu-text-secondary)', flexShrink: 0, padding: 0 }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="2" y="4" width="14" height="1.5" rx="0.75" fill="currentColor"/>
              <rect x="2" y="8.25" width="14" height="1.5" rx="0.75" fill="currentColor"/>
              <rect x="2" y="12.5" width="14" height="1.5" rx="0.75" fill="currentColor"/>
            </svg>
          </button>

          {/* Brand with Role Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', userSelect: 'none' }}>
            <div>
              <p style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--neu-text-primary)', fontFamily: 'Outfit, sans-serif', lineHeight: 1, letterSpacing: '-0.01em', whiteSpace: 'nowrap', margin: 0 }}>AI-Driven Smart LMS</p>
            </div>
            
            {/* Role Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.2rem 0.65rem',
              borderRadius: '99px',
              background: rc.bg,
              border: `1px solid ${rc.accent}40`,
              fontSize: '0.7rem',
              fontWeight: 700,
              color: rc.accent,
              letterSpacing: '0.01em',
              textTransform: 'uppercase',
              backdropFilter: 'blur(2px)',
            }}>
              <span style={{ 
                width: 6, 
                height: 6, 
                borderRadius: '50%', 
                background: rc.accent,
                display: 'inline-block',
                boxShadow: `0 0 6px ${rc.accent}`
              }} />
              {rc.label}
            </div>
          </div>
        </div>

        {/* ── Right ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginLeft: 'auto' }} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>

          {/* Search */}
          <MagnifiedButton 
            ref={searchButtonRef}
            onClick={() => setSearchOpen(true)} 
            mouseX={mouseX} 
            title="Search (Ctrl+K)"
          >
            <Search size={17} />
          </MagnifiedButton>

          {/* Theme */}
          <MagnifiedButton onClick={toggleTheme} mouseX={mouseX} title="Toggle theme">
            {isDark ? <Sun size={18} style={{ color: '#f59e0b' }} /> : <Moon size={18} style={{ color: '#5b8af0' }} />}
          </MagnifiedButton>

          {/* Bell */}
          <div ref={bellRef} style={{ position: 'relative' }}>
            <MagnifiedButton onClick={() => setBellOpen(prev => !prev)} mouseX={mouseX} title="Notifications">
              <Bell size={18} />
              {unreadCount > 0 && (
                <span style={{ position: 'absolute', top: 7, right: 7, width: 8, height: 8, borderRadius: '50%', background: '#ef4444', border: '1.5px solid var(--neu-surface)', animation: 'notifPulse 2s ease-in-out infinite' }} />
              )}
            </MagnifiedButton>

            {bellOpen && (
              <div style={{ position: 'absolute', top: 'calc(100% + 10px)', right: 0, zIndex: 200, animation: 'neuSlideUp 0.2s ease' }}>
                <NotificationPanel
                  notifications={notifications}
                  readIds={readIds}
                  onMarkRead={handleMarkRead}
                  onMarkAllRead={handleMarkAllRead}
                  onNavigate={(to) => { navigate(to); setBellOpen(false) }}
                  loading={notifLoading}
                />
              </div>
            )}
          </div>

          {/* User dropdown */}
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <MagnifiedButton onClick={() => setDropdownOpen(prev => !prev)} mouseX={mouseX} isAvatar>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: rc.bg, border: `1.5px solid ${rc.accent}55`, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', color: rc.accent, fontWeight: 800, fontSize: '0.7rem' }}>
                {avatarUrl ? <img src={avatarUrl} alt="U" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : user?.full_name?.[0]}
              </div>
              <div style={{ marginLeft: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--neu-text-primary)' }}>{user?.full_name?.split(' ')[0]}</span>
                <ChevronDown size={12} style={{ color: 'var(--neu-text-ghost)', transition: 'transform 0.2s', transform: dropdownOpen ? 'rotate(180deg)' : '' }} />
              </div>
            </MagnifiedButton>

            {dropdownOpen && (
              <div style={{ position: 'absolute', top: '110%', right: 0, width: 180, background: 'var(--neu-surface)', borderRadius: '1rem', border: '1px solid var(--neu-border)', boxShadow: '10px 10px 25px var(--neu-shadow-dark), -5px -5px 15px var(--neu-shadow-light)', padding: '0.5rem', zIndex: 110, animation: 'neuSlideUp 0.2s ease' }}>
                <button onClick={() => { setDropdownOpen(false); navigate(`/${role}/profile`) }} className="nav-dropdown-item"><User size={14} /> Profile</button>
                <button onClick={handleLogout} className="nav-dropdown-item" style={{ color: '#ef4444' }}><LogOut size={14} /> Logout</button>
              </div>
            )}
          </div>
        </div>
      </header>

      <SearchOverlay 
        open={searchOpen} 
        onClose={() => setSearchOpen(false)} 
        role={role}
        anchorRef={searchButtonRef}
      />

      <style>{`
        .nav-dropdown-item {
          width: 100%; display: flex; align-items: center; gap: 0.75rem;
          padding: 0.75rem 1rem; border: none; background: none;
          border-radius: 0.75rem; cursor: pointer; color: var(--neu-text-secondary);
          font-size: 0.82rem; font-weight: 600; transition: background 0.2s;
          font-family: 'DM Sans', sans-serif;
        }
        .nav-dropdown-item:hover { background: var(--neu-surface-deep); }
        @keyframes neuSlideUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes notifPulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.5); }
          50% { box-shadow: 0 0 0 4px rgba(239,68,68,0); }
        }
        @keyframes shimmer { 0%,100%{opacity:0.4} 50%{opacity:0.75} }
      `}</style>
    </>
  )
}