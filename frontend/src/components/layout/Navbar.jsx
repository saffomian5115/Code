// ═══════════════════════════════════════════════════════════════
//  Navbar.jsx  —  Neumorphic Top Bar
//  Replace:  frontend/src/components/layout/Navbar.jsx
// ═══════════════════════════════════════════════════════════════

import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Menu, Bell, Search, User, LogOut, ChevronDown,
  Megaphone, CheckCheck,
} from 'lucide-react'
import { authStore } from '../../store/authStore'
import { studentAPI } from '../../api/student.api'
import { teacherAPI } from '../../api/teacher.api'
import { useTheme } from '../../context/ThemeContext'

const BASE_URL = 'http://127.0.0.1:8000'

const ROLE_CONFIG = {
  admin:   { accent: '#9b59b6', bg: 'rgba(155,89,182,0.15)', label: 'Administrator' },
  teacher: { accent: '#22a06b', bg: 'rgba(62,207,142,0.15)', label: 'Teacher'       },
  student: { accent: '#5b8af0', bg: 'rgba(91,138,240,0.15)', label: 'Student'       },
}

const PRIORITY_DOT = {
  urgent: '#ef4444',
  high:   '#f97316',
  normal: '#5b8af0',
  low:    '#94a3b8',
}

const STORAGE_KEY = 'lms_read_notifications'
const getReadIds  = () => { try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { return new Set() } }
const saveReadIds = (ids) => { localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids])) }

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
  const navigate  = useNavigate()
  const { isDark, toggleTheme } = useTheme()
  const user      = authStore.getUser()
  const role      = user?.role || 'student'
  const rc        = ROLE_CONFIG[role] || ROLE_CONFIG.student
  const avatarUrl = user?.profile_picture_url ? `${BASE_URL}${user.profile_picture_url}` : null

  const [dropdownOpen,  setDropdownOpen]  = useState(false)
  const [bellOpen,      setBellOpen]      = useState(false)
  const [notifications, setNotifications] = useState([])
  const [loadingNotifs, setLoadingNotifs] = useState(false)
  const [readIds,       setReadIds]       = useState(getReadIds)

  const dropdownRef = useRef(null)
  const bellRef     = useRef(null)

  const unreadCount = notifications.filter(n => !readIds.has(n.id)).length

  const fetchNotifications = async () => {
    setLoadingNotifs(true)
    try {
      const fn  = role === 'student' ? studentAPI.getAnnouncements : teacherAPI.getAnnouncements
      const res = await fn(1)
      const list = res.data.data?.announcements || []
      setNotifications(list.slice(0, 8))
    } catch { /* silent */ } finally { setLoadingNotifs(false) }
  }

  useEffect(() => { if (bellOpen) fetchNotifications() }, [bellOpen])

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false)
      if (bellRef.current    && !bellRef.current.contains(e.target))    setBellOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout  = () => { authStore.clear(); navigate('/login') }
  const handleProfile = () => { setDropdownOpen(false); navigate(`/${role}/profile`) }
  const markAllRead   = () => { const s = new Set([...readIds, ...notifications.map(n => n.id)]); setReadIds(s); saveReadIds(s) }
  const markOneRead   = (id) => { const s = new Set([...readIds, id]); setReadIds(s); saveReadIds(s) }
  const handleViewAll = () => { markAllRead(); setBellOpen(false); navigate(`/${role}/announcements`) }

  // ── Shared neumorphic icon button style ──────────────────
  const neuIconBtn = {
    background: 'linear-gradient(145deg, var(--neu-surface), var(--neu-surface-deep))',
    boxShadow: '5px 5px 12px var(--neu-shadow-dark), -3px -3px 8px var(--neu-shadow-light), inset 0 1px 0 rgba(255,255,255,0.6)',
    border: '1px solid var(--neu-border)',
    borderRadius: '0.75rem',
    width: '2.2rem', height: '2.2rem',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer',
    color: 'var(--neu-text-secondary)',
    transition: 'box-shadow 0.18s ease, color 0.15s ease, transform 0.15s ease',
    flexShrink: 0,
  }

  const applyPress   = (e) => { e.currentTarget.style.boxShadow = 'inset 4px 4px 8px var(--neu-shadow-dark), inset -2px -2px 6px var(--neu-shadow-light)'; e.currentTarget.style.transform = 'scale(0.96)' }
  const releasePress = (e) => { e.currentTarget.style.boxShadow = neuIconBtn.boxShadow; e.currentTarget.style.transform = 'scale(1)' }

  return (
    <header style={{
      height: '60px',
      background: 'var(--neu-surface)',
      borderBottom: '1px solid var(--neu-border)',
      boxShadow: '0 2px 12px var(--neu-shadow-dark), 0 -1px 0 var(--neu-shadow-light)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 1.25rem',
      gap: '0.75rem',
      flexShrink: 0,
      zIndex: 30,
      transition: 'background 0.35s ease',
    }}>

      {/* ── Toggle sidebar ── */}
      <button
        onClick={onToggleSidebar}
        style={neuIconBtn}
        onMouseEnter={e => { e.currentTarget.style.boxShadow = '6px 6px 14px var(--neu-shadow-dark), -4px -4px 10px var(--neu-shadow-light)'; e.currentTarget.style.color = 'var(--neu-accent)' }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = neuIconBtn.boxShadow; e.currentTarget.style.color = 'var(--neu-text-secondary)' }}
        onMouseDown={applyPress}
        onMouseUp={releasePress}
      >
        <Menu size={16} />
      </button>

      {/* ── Search bar ── */}
      <div className="neu-search" style={{ flex: 1, maxWidth: '400px' }}>
        <Search size={14} style={{ color: 'var(--neu-text-ghost)', flexShrink: 0 }} />
        <input placeholder="Search..." />
      </div>

      {/* ── Right side ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginLeft: 'auto' }}>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          style={{ ...neuIconBtn, fontSize: '0.85rem' }}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = '6px 6px 14px var(--neu-shadow-dark), -4px -4px 10px var(--neu-shadow-light)' }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = neuIconBtn.boxShadow; e.currentTarget.style.transform = 'scale(1)' }}
          onMouseDown={applyPress}
          onMouseUp={releasePress}
          title={isDark ? 'Light Mode' : 'Dark Mode'}
        >
          {isDark ? '☀️' : '🌙'}
        </button>

        {/* Bell */}
        <div ref={bellRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setBellOpen(p => !p)}
            style={{ ...neuIconBtn, position: 'relative' }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '6px 6px 14px var(--neu-shadow-dark), -4px -4px 10px var(--neu-shadow-light)'; e.currentTarget.style.color = 'var(--neu-accent)' }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = neuIconBtn.boxShadow; e.currentTarget.style.color = 'var(--neu-text-secondary)'; e.currentTarget.style.transform = 'scale(1)' }}
            onMouseDown={applyPress}
            onMouseUp={releasePress}
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: '-2px', right: '-2px',
                minWidth: '16px', height: '16px',
                background: 'var(--neu-danger)',
                color: '#fff',
                fontSize: '9px', fontWeight: 800,
                borderRadius: '9999px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 3px',
                border: '1.5px solid var(--neu-surface)',
              }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notification dropdown */}
          {bellOpen && (
            <div className="neu-card" style={{
              position: 'absolute', right: 0, top: 'calc(100% + 10px)',
              width: '340px',
              borderRadius: '1.25rem',
              overflow: 'hidden',
              animation: 'neu-slide-up 0.22s cubic-bezier(0.34,1.56,0.64,1) both',
              zIndex: 200,
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '1rem 1.25rem 0.75rem',
                borderBottom: '1px solid var(--neu-border-inner)',
              }}>
                <h3 className="neu-heading" style={{ fontSize: '0.9rem' }}>Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.3rem',
                      fontSize: '0.72rem', fontWeight: 600,
                      color: 'var(--neu-accent)', background: 'none', border: 'none', cursor: 'pointer',
                    }}
                  >
                    <CheckCheck size={13} /> Mark all read
                  </button>
                )}
              </div>

              <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                {loadingNotifs ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--neu-text-ghost)', fontSize: '0.85rem' }}>
                    Loading...
                  </div>
                ) : notifications.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--neu-text-ghost)', fontSize: '0.85rem' }}>
                    No notifications
                  </div>
                ) : notifications.map(notif => {
                  const isUnread = !readIds.has(notif.id)
                  const dot = PRIORITY_DOT[notif.priority] || PRIORITY_DOT.normal
                  return (
                    <div
                      key={notif.id}
                      onClick={() => markOneRead(notif.id)}
                      style={{
                        display: 'flex', gap: '0.75rem',
                        padding: '0.85rem 1.25rem',
                        borderBottom: '1px solid var(--neu-border-inner)',
                        cursor: 'pointer',
                        opacity: isUnread ? 1 : 0.6,
                        transition: 'background 0.15s',
                        background: isUnread ? 'var(--neu-surface-deep)' : 'transparent',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--neu-surface-deep)'}
                      onMouseLeave={e => e.currentTarget.style.background = isUnread ? 'var(--neu-surface-deep)' : 'transparent'}
                    >
                      <span style={{
                        width: '8px', height: '8px', borderRadius: '50%',
                        background: dot, flexShrink: 0, marginTop: '5px',
                      }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                          <p style={{
                            fontSize: '0.82rem', fontWeight: isUnread ? 700 : 500,
                            color: 'var(--neu-text-primary)',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            {notif.title}
                          </p>
                          <span style={{ fontSize: '0.68rem', color: 'var(--neu-text-ghost)', flexShrink: 0, marginTop: '1px' }}>
                            {timeAgo(notif.created_at)}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--neu-text-muted)', marginTop: '2px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {notif.content}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>

              {notifications.length > 0 && (
                <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid var(--neu-border-inner)' }}>
                  <button
                    onClick={handleViewAll}
                    className="neu-btn neu-btn-accent"
                    style={{ width: '100%', padding: '0.6rem', fontSize: '0.8rem', gap: '0.4rem' }}
                  >
                    <Megaphone size={13} /> View All Announcements
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Avatar + Dropdown ── */}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setDropdownOpen(p => !p)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.6rem',
              padding: '0.3rem 0.7rem 0.3rem 0.3rem',
              background: 'linear-gradient(145deg, var(--neu-surface), var(--neu-surface-deep))',
              boxShadow: '5px 5px 12px var(--neu-shadow-dark), -3px -3px 8px var(--neu-shadow-light), inset 0 1px 0 rgba(255,255,255,0.6)',
              border: '1px solid var(--neu-border)',
              borderRadius: '9999px',
              cursor: 'pointer',
              transition: 'box-shadow 0.18s ease, transform 0.15s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '6px 6px 14px var(--neu-shadow-dark), -4px -4px 10px var(--neu-shadow-light)' }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = '5px 5px 12px var(--neu-shadow-dark), -3px -3px 8px var(--neu-shadow-light), inset 0 1px 0 rgba(255,255,255,0.6)'; e.currentTarget.style.transform = 'scale(1)' }}
            onMouseDown={e => { e.currentTarget.style.boxShadow = 'inset 4px 4px 8px var(--neu-shadow-dark), inset -2px -2px 6px var(--neu-shadow-light)'; e.currentTarget.style.transform = 'scale(0.97)' }}
            onMouseUp={e => { e.currentTarget.style.boxShadow = '5px 5px 12px var(--neu-shadow-dark), -3px -3px 8px var(--neu-shadow-light), inset 0 1px 0 rgba(255,255,255,0.6)'; e.currentTarget.style.transform = 'scale(1)' }}
          >
            {/* Avatar circle */}
            <div style={{
              width: '1.85rem', height: '1.85rem', borderRadius: '50%',
              background: rc.bg,
              border: `1.5px solid ${rc.accent}44`,
              overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              color: rc.accent,
              fontFamily: "'Outfit',sans-serif",
              fontWeight: 800, fontSize: '0.75rem',
            }}>
              {avatarUrl
                ? <img src={avatarUrl} alt="av" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span>{user?.full_name?.[0]?.toUpperCase() || '?'}</span>
              }
            </div>
            <div style={{ textAlign: 'left' }}>
              <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--neu-text-primary)', lineHeight: 1.2, whiteSpace: 'nowrap' }}>
                {user?.full_name?.split(' ')[0] || 'User'}
              </p>
              <p style={{ fontSize: '0.65rem', color: 'var(--neu-text-muted)', textTransform: 'capitalize' }}>{role}</p>
            </div>
            <ChevronDown size={12} style={{
              color: 'var(--neu-text-ghost)',
              transform: dropdownOpen ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s ease',
            }} />
          </button>

          {/* Dropdown menu */}
          {dropdownOpen && (
            <div className="neu-card-sm" style={{
              position: 'absolute', right: 0, top: 'calc(100% + 10px)',
              width: '170px',
              borderRadius: '1rem',
              padding: '0.4rem',
              animation: 'neu-slide-up 0.22s cubic-bezier(0.34,1.56,0.64,1) both',
              zIndex: 200,
              overflow: 'visible',
            }}>
              {[
                { icon: User,   label: 'My Profile', action: handleProfile, color: 'var(--neu-text-secondary)' },
                { icon: LogOut, label: 'Logout',     action: handleLogout,  color: 'var(--neu-danger)' },
              ].map(({ icon: Icon, label, action, color }) => (
                <button
                  key={label}
                  onClick={action}
                  style={{
                    width: '100%',
                    display: 'flex', alignItems: 'center', gap: '0.6rem',
                    padding: '0.6rem 0.75rem',
                    borderRadius: '0.75rem',
                    border: 'none', background: 'none', cursor: 'pointer',
                    color,
                    fontSize: '0.82rem', fontWeight: 600,
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--neu-surface-deep)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <Icon size={14} /> {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}