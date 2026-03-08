// ═══════════════════════════════════════════════════════════════
//  Navbar.jsx  —  Neumorphic Top Bar with Dock Magnification
// ═══════════════════════════════════════════════════════════════

import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Menu, Bell, Search, User, LogOut, ChevronDown,
  Megaphone, CheckCheck, Sun, Moon
} from 'lucide-react'
import { authStore } from '../../store/authStore'
import { useTheme } from '../../context/ThemeContext'

const BASE_URL = 'http://127.0.0.1:8000'

// --- Magnification Constants ---
const BASE_SIZE = 38  // Normal button size
const MAX_SIZE = 48   // Expanded size on hover
const DISTANCE = 100  // How far the mouse affects the button

const ROLE_CONFIG = {
  admin:   { accent: '#9b59b6', bg: 'rgba(155,89,182,0.15)', label: 'Administrator' },
  teacher: { accent: '#22a06b', bg: 'rgba(62,207,142,0.15)', label: 'Teacher'       },
  student: { accent: '#5b8af0', bg: 'rgba(91,138,240,0.15)', label: 'Student'       },
}

// --- Reusable Magnified Button Component ---
function MagnifiedButton({ children, onClick, mouseX, isAvatar = false, style = {}, ...props }) {
  const ref = useRef(null)
  const [size, setSize] = useState(BASE_SIZE)

  useEffect(() => {
    if (!ref.current || mouseX === -9999) {
      setSize(BASE_SIZE)
      return
    }
    const rect = ref.current.getBoundingClientRect()
    const center = rect.left + rect.width / 2
    const dist = Math.abs(mouseX - center)
    
    if (dist >= DISTANCE) {
      setSize(BASE_SIZE)
    } else {
      const t = 1 - dist / DISTANCE
      const eased = t * t * (3 - 2 * t) // Smooth step easing
      setSize(BASE_SIZE + (MAX_SIZE - BASE_SIZE) * eased)
    }
  }, [mouseX])

  const buttonStyle = {
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
    transition: 'width 0.1s ease, height 0.1s ease, transform 0.1s ease',
    padding: isAvatar ? '0 0.8rem 0 0.3rem' : '0',
    flexShrink: 0,
    ...style
  }

  return (
    <button ref={ref} onClick={onClick} style={buttonStyle} {...props}>
      {children}
    </button>
  )
}

export default function Navbar({ onToggleSidebar }) {
  const navigate = useNavigate()
  const { isDark, toggleTheme } = useTheme()
  const user = authStore.getUser()
  const role = user?.role || 'student'
  const rc = ROLE_CONFIG[role] || ROLE_CONFIG.student
  const avatarUrl = user?.profile_picture_url ? `${BASE_URL}${user.profile_picture_url}` : null

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [bellOpen, setBellOpen] = useState(false)
  const [mouseX, setMouseX] = useState(-9999)

  const dropdownRef = useRef(null)
  const bellRef = useRef(null)

  // Tracking mouse for magnification
  const handleMouseMove = useCallback((e) => {
    setMouseX(e.clientX)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setMouseX(-9999)
  }, [])

  const handleLogout = () => {
    authStore.clear()
    navigate('/login')
  }

  // Close dropdowns on outside click
  useEffect(() => {
    const clickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false)
      if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false)
    }
    document.addEventListener('mousedown', clickOutside)
    return () => document.removeEventListener('mousedown', clickOutside)
  }, [])

  return (
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
        position: 'relative'
      }}
    >
      {/* Sidebar Toggle with Effect */}
      <MagnifiedButton onClick={onToggleSidebar} mouseX={mouseX}>
        <Menu size={18} />
      </MagnifiedButton>

      {/* Search Bar - No magnification for input */}
      <div style={{
        flex: 1,
        maxWidth: '380px',
        position: 'relative',
        display: 'flex',
        alignItems: 'center'
      }}>
        <Search size={14} style={{ position: 'absolute', left: '1rem', color: 'var(--neu-text-ghost)' }} />
        <input 
          placeholder="Search everything..." 
          style={{
            width: '100%',
            padding: '0.65rem 1rem 0.65rem 2.5rem',
            background: 'var(--neu-surface-deep)',
            border: '1px solid var(--neu-border)',
            borderRadius: '0.85rem',
            boxShadow: 'inset 2px 2px 5px var(--neu-shadow-dark), inset -1px -1px 3px var(--neu-shadow-light)',
            color: 'var(--neu-text-primary)',
            fontSize: '0.85rem',
            outline: 'none'
          }}
        />
      </div>

      {/* Right Side Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginLeft: 'auto' }}>
        
        {/* Theme Toggle */}
        <MagnifiedButton onClick={toggleTheme} mouseX={mouseX}>
          {isDark ? <Sun size={18} style={{ color: '#f59e0b' }} /> : <Moon size={18} style={{ color: '#5b8af0' }} />}
        </MagnifiedButton>

        {/* Notifications */}
        <div ref={bellRef} style={{ position: 'relative' }}>
          <MagnifiedButton onClick={() => setBellOpen(!bellOpen)} mouseX={mouseX}>
            <Bell size={18} />
          </MagnifiedButton>
          
          {bellOpen && (
            <div style={{
              position: 'absolute', top: '110%', right: 0, width: '280px',
              background: 'var(--neu-surface)', borderRadius: '1.25rem',
              border: '1px solid var(--neu-border)', boxShadow: '10px 10px 25px var(--neu-shadow-dark)',
              padding: '1rem', zIndex: 110, animation: 'neu-slide-up 0.2s ease'
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
              overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: rc.accent, fontWeight: 800, fontSize: '0.7rem'
            }}>
              {avatarUrl ? <img src={avatarUrl} alt="U" style={{width:'100%', height:'100%', objectFit:'cover'}} /> : user?.full_name?.[0]}
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
              border: '1px solid var(--neu-border)', boxShadow: '10px 10px 25px var(--neu-shadow-dark)',
              padding: '0.5rem', zIndex: 110, animation: 'neu-slide-up 0.2s ease'
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

      <style>{`
        .nav-dropdown-item {
          width: 100%; display: flex; alignItems: center; gap: 0.75rem;
          padding: 0.75rem 1rem; border: none; background: none;
          border-radius: 0.75rem; cursor: pointer; color: var(--neu-text-secondary);
          font-size: 0.82rem; font-weight: 600; transition: background 0.2s;
        }
        .nav-dropdown-item:hover {
          background: var(--neu-surface-deep);
        }
        @keyframes neu-slide-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </header>
  )
}