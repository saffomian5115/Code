import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell, User, LogOut, ChevronDown,
  Sun, Moon, Search, X, GraduationCap,
  BookOpen, ClipboardCheck, FileText, BarChart2, CreditCard,
  MessageSquare, Users, Building2, Calendar, Layers,
  DoorOpen, LineChart, ScanLine, BookMarked, Receipt,
  PenSquare, BrainCircuit, Sparkles,
} from 'lucide-react'
import { authStore } from '../../store/authStore'
import { useTheme } from '../../context/ThemeContext'

const BASE_URL = import.meta.env.VITE_BASE_URL

const BASE_SIZE = 38
const MAX_SIZE = 48
const DISTANCE = 100

const ROLE_CONFIG = {
  admin:   { accent: '#9b59b6', bg: 'rgba(155,89,182,0.15)', label: 'Administrator' },
  teacher: { accent: '#22a06b', bg: 'rgba(62,207,142,0.15)', label: 'Teacher'       },
  student: { accent: '#5b8af0', bg: 'rgba(91,138,240,0.15)', label: 'Student'       },
}

// ── All searchable items per role ─────────────────────────────
const ALL_ITEMS = {
  admin: [
    { label: 'Dashboard',     icon: LineChart,     to: '/admin/dashboard',      desc: 'Main overview'               },
    { label: 'Students',      icon: GraduationCap, to: '/admin/students',       desc: 'Manage students'             },
    { label: 'Teachers',      icon: Users,         to: '/admin/teachers',       desc: 'Manage teachers'             },
    { label: 'Departments',   icon: Building2,     to: '/admin/departments',    desc: 'Academic departments'        },
    { label: 'Programs',      icon: BookMarked,    to: '/admin/programs',       desc: 'Degree programs'             },
    { label: 'Semesters',     icon: Calendar,      to: '/admin/semesters',      desc: 'Semester management'        },
    { label: 'Courses',       icon: BookOpen,      to: '/admin/courses',        desc: 'Course catalog'              },
    { label: 'Offerings',     icon: Layers,        to: '/admin/offerings',      desc: 'Course offerings & sections' },
    { label: 'Enrollments',   icon: ClipboardCheck,to: '/admin/enrollments',    desc: 'Student enrollments'        },
    { label: 'Fee Structure', icon: CreditCard,    to: '/admin/fee/structure',  desc: 'Fee structure setup'        },
    { label: 'Fee Vouchers',  icon: Receipt,       to: '/admin/fee/vouchers',   desc: 'Fee vouchers & payments'    },
    { label: 'Announcements', icon: Bell,          to: '/admin/announcements',  desc: 'Post announcements'         },
    { label: 'Notices',       icon: FileText,      to: '/admin/notices',        desc: 'Notice board'               },
    { label: 'Gates',         icon: DoorOpen,      to: '/admin/gates',          desc: 'Campus gate management'     },
    { label: 'Gate Attendance',icon: ScanLine,     to: '/admin/gate-attendance',desc: 'Face recognition attendance'},
    { label: 'Analytics',     icon: LineChart,     to: '/admin/analytics',      desc: 'AI student analytics'       },
  ],
  teacher: [
    { label: 'Dashboard',     icon: LineChart,     to: '/teacher/dashboard',    desc: 'Teacher overview'            },
    { label: 'My Courses',    icon: BookOpen,      to: '/teacher/courses',      desc: 'Assigned courses'            },
    { label: 'Attendance',    icon: ClipboardCheck,to: '/teacher/attendance',   desc: 'Mark class attendance'      },
    { label: 'Assignments',   icon: FileText,      to: '/teacher/assignments',  desc: 'Create & grade assignments' },
    { label: 'Quizzes',       icon: PenSquare,     to: '/teacher/quizzes',      desc: 'Manage quizzes'             },
    { label: 'Results',       icon: BarChart2,     to: '/teacher/results',      desc: 'Exam results & grades'      },
    { label: 'Announcements', icon: Bell,          to: '/teacher/announcements',desc: 'View announcements'         },
    { label: 'Notices',       icon: FileText,      to: '/teacher/notices',      desc: 'Notice board'               },
    { label: 'Chat',          icon: MessageSquare, to: '/teacher/chat',         desc: 'Class chat groups'          },
  ],
  student: [
    { label: 'Dashboard',     icon: LineChart,     to: '/student/dashboard',    desc: 'Student overview'            },
    { label: 'My Courses',    icon: BookOpen,      to: '/student/courses',      desc: 'Enrolled courses'            },
    { label: 'Attendance',    icon: ClipboardCheck,to: '/student/attendance',   desc: 'View attendance records'    },
    { label: 'Assignments',   icon: FileText,      to: '/student/assignments',  desc: 'Pending assignments'        },
    { label: 'Quizzes',       icon: PenSquare,     to: '/student/quizzes',      desc: 'Class quizzes'              },
    { label: 'Results',       icon: BarChart2,     to: '/student/results',      desc: 'Exam results & CGPA'        },
    { label: 'Fee',           icon: CreditCard,    to: '/student/fee',          desc: 'Fee vouchers & payments'    },
    { label: 'Announcements', icon: Bell,          to: '/student/announcements',desc: 'University announcements'   },
    { label: 'Notices',       icon: FileText,      to: '/student/notices',      desc: 'Notice board'               },
    { label: 'Chat',          icon: MessageSquare, to: '/student/chat',         desc: 'Course chat groups'         },
    { label: 'AI Assistant',  icon: BrainCircuit,  to: '/student/ai',           desc: 'Ask AI anything'            },
    { label: 'Practice Quiz', icon: Sparkles,      to: '/student/practice-quiz',desc: 'AI-generated practice'     },
    { label: 'Analytics',     icon: BarChart2,     to: '/student/analytics',    desc: 'Student analytics'          },
  ],
}

// ── Magnified Button ──────────────────────────────────────────
function MagnifiedButton({ children, onClick, mouseX, isAvatar = false, style = {}, title, ...props }) {
  const ref = useRef(null)
  const [size, setSize] = useState(BASE_SIZE)

  useEffect(() => {
    if (!ref.current || mouseX === -9999) { setSize(BASE_SIZE); return }
    const rect = ref.current.getBoundingClientRect()
    const center = rect.left + rect.width / 2
    const dist = Math.abs(mouseX - center)
    if (dist >= DISTANCE) { setSize(BASE_SIZE); return }
    const t = 1 - dist / DISTANCE
    const eased = t * t * (3 - 2 * t)
    setSize(BASE_SIZE + (MAX_SIZE - BASE_SIZE) * eased)
  }, [mouseX])

  return (
    <button
      ref={ref}
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
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: 'var(--neu-text-secondary)',
        transition: 'width 0.1s ease, height 0.1s ease',
        padding: isAvatar ? '0 0.8rem 0 0.3rem' : '0',
        flexShrink: 0,
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  )
}

// ── Search Dropdown (appears below search icon) ───────────────────────────────────
function SearchDropdown({ open, onClose, role, anchorRef }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [selected, setSelected] = useState(0)
  const inputRef = useRef(null)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()

  const allItems = ALL_ITEMS[role] || []

  // Filter results based on query
  useEffect(() => {
    if (!open) return

    if (!query.trim()) {
      setResults(allItems.slice(0, 6))
      setSelected(0)
      return
    }
    const q = query.toLowerCase()
    const filtered = allItems.filter(
      item =>
        item.label.toLowerCase().includes(q) ||
        item.desc.toLowerCase().includes(q)
    )
    setResults(filtered.slice(0, 8))
    setSelected(0)
  }, [query, role, open])

  // Focus input when dropdown opens
  useEffect(() => {
    if (open) {
      setQuery('')
      setResults(allItems.slice(0, 6))
      setSelected(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open, role])

  // Handle click outside
  useEffect(() => {
    if (!open) return

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) &&
          anchorRef.current && !anchorRef.current.contains(e.target)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open, onClose, anchorRef])

  const handleSelect = useCallback((item) => {
    navigate(item.to)
    onClose()
  }, [navigate, onClose])

  const handleKey = useCallback((e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelected(s => Math.min(s + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelected(s => Math.max(s - 1, 0))
    } else if (e.key === 'Enter') {
      if (results[selected]) handleSelect(results[selected])
    } else if (e.key === 'Escape') {
      onClose()
    }
  }, [results, selected, handleSelect, onClose])

  if (!open) return null

  return (
    <div
      ref={dropdownRef}
      style={{
        position: 'absolute',
        top: 'calc(100% + 8px)',
        right: 0,
        width: '380px',
        background: 'var(--neu-surface)',
        borderRadius: '1rem',
        border: '1px solid var(--neu-border)',
        boxShadow: '10px 10px 25px var(--neu-shadow-dark), -5px -5px 15px var(--neu-shadow-light)',
        overflow: 'hidden',
        zIndex: 110,
        animation: 'neu-slide-up 0.2s ease',
      }}
    >
      {/* Search Input */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.9rem 1.1rem',
        borderBottom: '1px solid var(--neu-border)',
      }}>
        <Search size={17} style={{ color: 'var(--neu-text-ghost)', flexShrink: 0 }} />
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
            fontSize: '0.9rem',
            color: 'var(--neu-text-primary)',
            fontFamily: "'DM Sans', sans-serif",
          }}
        />
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
          flexShrink: 0,
        }}>
         
        </div>
      </div>

      {/* Results */}
      <div style={{ maxHeight: 360, overflowY: 'auto', padding: '0.4rem' }}>
        {results.length === 0 ? (
          <div style={{
            padding: '2rem',
            textAlign: 'center',
            color: 'var(--neu-text-ghost)',
            fontSize: '0.82rem',
          }}>
            No results for "{query}"
          </div>
        ) : (
          results.map((item, i) => {
            const Icon = item.icon
            const isActive = i === selected
            return (
              <div
                key={item.to}
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setSelected(i)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '0.875rem',
                  cursor: 'pointer',
                  background: isActive ? 'var(--neu-surface-deep)' : 'transparent',
                  boxShadow: isActive
                    ? 'inset 3px 3px 7px var(--neu-shadow-dark), inset -2px -2px 5px var(--neu-shadow-light)'
                    : 'none',
                  transition: 'background 0.1s, box-shadow 0.1s',
                }}
              >
                <div style={{
                  width: 34,
                  height: 34,
                  borderRadius: '0.65rem',
                  background: isActive ? 'var(--neu-surface)' : 'var(--neu-surface-deep)',
                  boxShadow: isActive
                    ? '3px 3px 8px var(--neu-shadow-dark), -2px -2px 5px var(--neu-shadow-light)'
                    : 'inset 2px 2px 5px var(--neu-shadow-dark)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  color: isActive ? 'var(--neu-accent)' : 'var(--neu-text-ghost)',
                  transition: 'all 0.1s',
                }}>
                  <Icon size={15} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: 'var(--neu-text-primary)',
                    margin: 0,
                    fontFamily: "'DM Sans', sans-serif",
                  }}>
                    {item.label}
                  </p>
                  <p style={{
                    fontSize: '0.72rem',
                    color: 'var(--neu-text-ghost)',
                    margin: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {item.desc}
                  </p>
                </div>
                
              </div>
            )
          })
        )}
      </div>

      
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
  const avatarUrl = user?.profile_picture_url ? `${BASE_URL}${user.profile_picture_url}` : null

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [bellOpen, setBellOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [mouseX, setMouseX] = useState(-9999)

  const dropdownRef = useRef(null)
  const bellRef = useRef(null)
  const searchBtnRef = useRef(null) // Reference for search button

  const handleMouseMove = useCallback((e) => setMouseX(e.clientX), [])
  const handleMouseLeave = useCallback(() => setMouseX(-9999), [])

  const handleLogout = () => {
    authStore.clear()
    navigate('/login')
  }

  // Keyboard shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Close dropdowns on Escape
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setDropdownOpen(false)
        setBellOpen(false)
        setSearchOpen(false)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <>
      <header
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          height: '65px',
          background: 'var(--neu-surface)',
          borderBottom: '1px solid var(--neu-border)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 1.5rem',
          gap: '1rem',
          zIndex: 100,
          position: 'relative',
        }}
      >
        {/* ── Left: Sidebar Toggle + Brand ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={onToggleSidebar}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '0.85rem',
              background: 'var(--neu-surface)',
              boxShadow: '4px 4px 10px var(--neu-shadow-dark), -2px -2px 8px var(--neu-shadow-light)',
              border: '1px solid var(--neu-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--neu-text-secondary)',
              flexShrink: 0,
              padding: 0,
            }}
          >
            {/* Hamburger icon */}
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="2" y="4" width="14" height="1.5" rx="0.75" fill="currentColor"/>
              <rect x="2" y="8.25" width="14" height="1.5" rx="0.75" fill="currentColor"/>
              <rect x="2" y="12.5" width="14" height="1.5" rx="0.75" fill="currentColor"/>
            </svg>
          </button>

          {/* Brand Name */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            userSelect: 'none',
          }}>
            
            <div onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <p style={{
                fontSize: '1.25rem',
                fontWeight: 900,
                color: 'var(--neu-text-primary)',
                fontFamily: 'Outfit, sans-serif',
                lineHeight: 1,
                letterSpacing: '-0.01em',
                whiteSpace: 'nowrap',
              }}>
                AI-Driven Smart LMS
              </p>
              
            </div>
          </div>
        </div>

        {/* ── Right Side Actions ── */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginLeft: 'auto' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <MagnifiedButton
            onClick={() => setSearchOpen(!searchOpen)}
            mouseX={mouseX}
            title="Search (Ctrl+K)"
          >
            <Search size={17} />
          </MagnifiedButton>
          

          {/* Search Dropdown */}
          <SearchDropdown
            open={searchOpen}
            onClose={() => setSearchOpen(false)}
            role={role}
            anchorRef={searchBtnRef}
          />
        

          {/* Theme Toggle */}
          <MagnifiedButton onClick={toggleTheme} mouseX={mouseX} title="Toggle theme">
            {isDark
              ? <Sun size={18} style={{ color: '#f59e0b' }} />
              : <Moon size={18} style={{ color: '#5b8af0' }} />
            }
          </MagnifiedButton>

          {/* Notifications */}
          <div ref={bellRef} style={{ position: 'relative' }}>
            <MagnifiedButton onClick={() => setBellOpen(!bellOpen)} mouseX={mouseX} title="Notifications">
              <Bell size={18} />
            </MagnifiedButton>
            {bellOpen && (
              <div style={{
                position: 'absolute', top: '110%', right: 0, width: '280px',
                background: 'var(--neu-surface)', borderRadius: '1.25rem',
                border: '1px solid var(--neu-border)',
                boxShadow: '10px 10px 25px var(--neu-shadow-dark), -5px -5px 15px var(--neu-shadow-light)',
                padding: '1rem', zIndex: 110, animation: 'neu-slide-up 0.2s ease',
              }}>
                <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--neu-text-primary)' }}>Notifications</p>
                <div style={{ height: '1px', background: 'var(--neu-border)', margin: '0.5rem 0' }} />
                <p style={{ fontSize: '0.75rem', color: 'var(--neu-text-ghost)', textAlign: 'center', padding: '1rem' }}>No new alerts</p>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <MagnifiedButton
              onClick={() => setDropdownOpen(!dropdownOpen)}
              mouseX={mouseX}
              isAvatar={true}
            >
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                background: rc.bg, border: `1.5px solid ${rc.accent}55`,
                overflow: 'hidden', display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: rc.accent, fontWeight: 800, fontSize: '0.7rem',
              }}>
                {avatarUrl
                  ? <img src={avatarUrl} alt="U" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : user?.full_name?.[0]
                }
              </div>
              <div style={{ marginLeft: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--neu-text-primary)' }}>
                  {user?.full_name?.split(' ')[0]}
                </span>
                <ChevronDown size={12} style={{ color: 'var(--neu-text-ghost)' }} />
              </div>
            </MagnifiedButton>

            {dropdownOpen && (
              <div style={{
                position: 'absolute', top: '110%', right: 0, width: '180px',
                background: 'var(--neu-surface)', borderRadius: '1rem',
                border: '1px solid var(--neu-border)',
                boxShadow: '10px 10px 25px var(--neu-shadow-dark), -5px -5px 15px var(--neu-shadow-light)',
                padding: '0.5rem', zIndex: 110, animation: 'neu-slide-up 0.2s ease',
              }}>
                <button
                  onClick={() => { setDropdownOpen(false); navigate(`/${role}/profile`) }}
                  className="nav-dropdown-item"
                >
                  <User size={14} /> Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="nav-dropdown-item"
                  style={{ color: '#ef4444' }}
                >
                  <LogOut size={14} /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <style>{`
        .nav-dropdown-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          border: none;
          background: none;
          border-radius: 0.75rem;
          cursor: pointer;
          color: var(--neu-text-secondary);
          font-size: 0.82rem;
          font-weight: 600;
          transition: background 0.2s;
        }
        .nav-dropdown-item:hover {
          background: var(--neu-surface-deep);
        }
        @keyframes neu-slide-up {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  )
}