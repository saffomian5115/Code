// ═══════════════════════════════════════════════════════════════
//  Sidebar.jsx  —  Vertical Dock | Neumorphic Raised Buttons
//  Replace:  frontend/src/components/layout/Sidebar.jsx
// ═══════════════════════════════════════════════════════════════

import { useRef, useState, useEffect, useCallback } from 'react'
import { NavLink } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { authStore } from '../../store/authStore'
import {
  LayoutDashboard, BookOpen, FileText, BarChart2, CreditCard,
  Bell, MessageSquare, Users, GraduationCap, Building2,
  Calendar, ClipboardCheck, PenSquare, BrainCircuit,Sparkles,
  BookMarked, Layers, Receipt, DoorOpen, LineChart, ScanLine,
} from 'lucide-react'

// ── Nav definitions ───────────────────────────────────────────
const MENUS = {
  student: [
    { label: 'Dashboard',    icon: LayoutDashboard, to: '/student/dashboard' },
    { label: 'My Courses',   icon: BookOpen,        to: '/student/courses' },
    { label: 'Attendance',   icon: ClipboardCheck,  to: '/student/attendance' },
    { label: 'Assignments',  icon: FileText,        to: '/student/assignments' },
    { label: 'Quizzes',      icon: PenSquare,       to: '/student/quizzes' },
    { label: 'Results',      icon: BarChart2,       to: '/student/results' },
    { label: 'Fee',          icon: CreditCard,      to: '/student/fee' },
    { label: 'Announcements',icon: Bell,            to: '/student/announcements' },
    { label: 'Chat',         icon: MessageSquare,   to: '/student/chat' },
    { label: 'AI Assistant', icon: BrainCircuit,    to: '/student/ai' },
    { label: 'Practice Quiz',  icon: Sparkles,        to: '/student/practice-quiz' },
  ],
  teacher: [
    { label: 'Dashboard',    icon: LayoutDashboard, to: '/teacher/dashboard' },
    { label: 'My Courses',   icon: BookOpen,        to: '/teacher/courses' },
    { label: 'Attendance',   icon: ClipboardCheck,  to: '/teacher/attendance' },
    { label: 'Assignments',  icon: FileText,        to: '/teacher/assignments' },
    { label: 'Quizzes',      icon: PenSquare,       to: '/teacher/quizzes' },
    { label: 'Results',      icon: BarChart2,       to: '/teacher/results' },
    { label: 'Announcements',icon: Bell,            to: '/teacher/announcements' },
    { label: 'Chat',         icon: MessageSquare,   to: '/teacher/chat' },
  ],
  admin: [
    { label: 'Dashboard',    icon: LayoutDashboard, to: '/admin/dashboard' },
    { label: 'Students',     icon: GraduationCap,   to: '/admin/students' },
    { label: 'Teachers',     icon: Users,           to: '/admin/teachers' },
    { label: 'Departments',  icon: Building2,       to: '/admin/departments' },
    { label: 'Programs',     icon: BookMarked,      to: '/admin/programs' },
    { label: 'Semesters',    icon: Calendar,        to: '/admin/semesters' },
    { label: 'Courses',      icon: BookOpen,        to: '/admin/courses' },
    { label: 'Offerings',    icon: Layers,          to: '/admin/offerings' },
    { label: 'Enrollments',  icon: ClipboardCheck,  to: '/admin/enrollments' },
    { label: 'Fee Structure',icon: CreditCard,      to: '/admin/fee/structure' },
    { label: 'Fee Vouchers', icon: Receipt,         to: '/admin/fee/vouchers' },
    { label: 'Announcements',icon: Bell,            to: '/admin/announcements' },
    { label: 'Notices',      icon: FileText,        to: '/admin/notices' },
    { label: 'Gates',        icon: DoorOpen,        to: '/admin/gates' },
    { label: 'Attendance',   icon: ScanLine,        to: '/admin/gate-attendance' },
    { label: 'Analytics',    icon: LineChart,       to: '/admin/analytics' },
  ],
}

const ROLE_CONFIG = {
  admin:   { accent: '#9b59b6' },
  teacher: { accent: '#22a06b' },
  student: { accent: '#5b8af0' },
}

// ── Sizes & constants ─────────────────────────────────────────
const BASE_SIZE  = 44
const MAX_SIZE   = 60
const DISTANCE   = 130
const BTN_RADIUS = 13   // soft square — premium feel

// ── Portal Tooltip ────────────────────────────────────────────
// Rendered directly into document.body → never clipped by overflow:hidden
function PortalTooltip({ label, anchorRef, visible }) {
  const [pos, setPos] = useState(null)

  useEffect(() => {
    if (!visible || !anchorRef.current) { setPos(null); return }
    const r = anchorRef.current.getBoundingClientRect()
    setPos({ top: r.top + r.height / 2, left: r.right + 10 })
  }, [visible, anchorRef])

  if (!visible || !pos) return null

  return createPortal(
    <div style={{
      position: 'fixed',
      top:  pos.top,
      left: pos.left,
      transform: 'translateY(-50%)',
      zIndex: 99999,
      pointerEvents: 'none',
      display: 'flex',
      alignItems: 'center',
      gap: 0,
      animation: 'neu-fade-in 0.1s ease both',
    }}>
      {/* Arrow */}
      <div style={{
        width: 0, height: 0,
        borderTop: '5px solid transparent',
        borderBottom: '5px solid transparent',
        borderRight: `6px solid var(--neu-border)`,
        flexShrink: 0,
      }} />
      {/* Label pill */}
      <div style={{
        background: 'var(--neu-surface)',
        boxShadow: 'var(--neu-raised-md)',
        border: '1px solid var(--neu-border)',
        color: 'var(--neu-text-primary)',
        fontSize: '0.71rem',
        fontWeight: 600,
        padding: '0.28rem 0.65rem',
        borderRadius: '0.5rem',
        whiteSpace: 'nowrap',
        letterSpacing: '0.03em',
      }}>
        {label}
      </div>
    </div>,
    document.body
  )
}

// ── Single Dock Item ──────────────────────────────────────────
function DockItem({ label, icon: Icon, to, mouseY, accentColor }) {
  const wrapRef  = useRef(null)
  const [size,    setSize]    = useState(BASE_SIZE)
  const [showTip, setShowTip] = useState(false)

  // Magnification — smooth eased interpolation
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const rect   = el.getBoundingClientRect()
    const center = rect.top + rect.height / 2
    const dist   = Math.abs(mouseY - center)
    if (dist >= DISTANCE) { setSize(BASE_SIZE); return }
    const t = 1 - dist / DISTANCE
    const eased = t * t * (3 - 2 * t)   // smoothstep
    setSize(BASE_SIZE + (MAX_SIZE - BASE_SIZE) * eased)
  }, [mouseY])

  const radius = BTN_RADIUS + (size - BASE_SIZE) * 0.25

  return (
    <div
      ref={wrapRef}
      style={{ position: 'relative', display: 'flex', justifyContent: 'center', flexShrink: 0 }}
      onMouseEnter={() => setShowTip(true)}
      onMouseLeave={() => setShowTip(false)}
    >
      <NavLink
        to={to}
        style={({ isActive }) => ({
          width:  `${size}px`,
          height: `${size}px`,
          borderRadius: `${radius}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          cursor: 'pointer',
          textDecoration: 'none',
          // ── Neumorphic raised (NOT physical press) ──────────
          background: isActive
            ? `linear-gradient(145deg, ${accentColor}28, ${accentColor}10)`
            : 'linear-gradient(145deg, var(--neu-surface), var(--neu-surface-deep))',
          boxShadow: isActive
            ? `5px 5px 12px var(--neu-shadow-dark), -3px -3px 8px var(--neu-shadow-light), inset 0 1px 0 rgba(255,255,255,0.5)`
            : `5px 5px 12px var(--neu-shadow-dark), -3px -3px 8px var(--neu-shadow-light), inset 0 1px 0 rgba(255,255,255,0.6)`,
          border: `1px solid ${isActive ? accentColor + '35' : 'var(--neu-border)'}`,
          color: isActive ? accentColor : 'var(--neu-text-muted)',
          transition: [
            'width 0.14s cubic-bezier(0.34,1.56,0.64,1)',
            'height 0.14s cubic-bezier(0.34,1.56,0.64,1)',
            'border-radius 0.14s ease',
            'box-shadow 0.2s ease',
            'background 0.2s ease',
            'color 0.2s ease',
          ].join(', '),
        })}
      >
        {({ isActive }) => (
          <Icon
            size={Math.round(size * 0.42)}
            style={{
              color: isActive ? accentColor : 'var(--neu-text-muted)',
              transition: 'color 0.2s ease',
              flexShrink: 0,
              pointerEvents: 'none',
            }}
          />
        )}
      </NavLink>

      {/* Portal tooltip — never clipped */}
      <PortalTooltip label={label} anchorRef={wrapRef} visible={showTip} />
    </div>
  )
}

// ── Main Sidebar ──────────────────────────────────────────────
export default function Sidebar({ isOpen }) {
  const user   = authStore.getUser()
  const role   = user?.role || 'student'
  const menus  = MENUS[role] || []
  const accent = ROLE_CONFIG[role]?.accent || '#5b8af0'

  const [mouseY, setMouseY] = useState(-9999)
  const onMove  = useCallback((e) => setMouseY(e.clientY), [])
  const onLeave = useCallback(() => setMouseY(-9999), [])

  return (
    <aside style={{
      width: isOpen ? '76px' : '0',
      flexShrink: 0,
      overflow: 'visible',        // ← tooltips must escape
      transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
      position: 'relative',
      zIndex: 40,
    }}>
      {isOpen && (
        <div
          onMouseMove={onMove}
          onMouseLeave={onLeave}
          style={{
            width: '76px',
            height: '100vh',
            position: 'sticky',
            top: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            paddingTop: '1rem',
            paddingBottom: '1rem',
            gap: '8px',
            background: 'var(--neu-surface)',
            boxShadow: '4px 0 20px var(--neu-shadow-dark), -1px 0 4px var(--neu-shadow-light)',
            borderRight: '1px solid var(--neu-border)',
            overflow: 'visible',  // ← same here
          }}
        >
          {/* ── Logo tile ── */}
          <div style={{
            width:  `${BASE_SIZE}px`,
            height: `${BASE_SIZE}px`,
            borderRadius: `${BTN_RADIUS}px`,
            background: `linear-gradient(145deg, ${accent}ee, ${accent}99)`,
            boxShadow: [
              '5px 5px 12px var(--neu-shadow-dark)',
              '-3px -3px 8px var(--neu-shadow-light)',
              `0 0 18px ${accent}40`,
              'inset 0 1px 2px rgba(255,255,255,0.3)',
            ].join(', '),
            border: '1px solid rgba(255,255,255,0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <GraduationCap size={Math.round(BASE_SIZE * 0.44)} style={{ color: '#fff' }} />
          </div>

          {/* Divider */}
          <div style={{
            width: '30px', height: '1px', flexShrink: 0,
            background: 'linear-gradient(to right, transparent, var(--neu-border-inner), transparent)',
          }} />

          {/* ── Nav items ── */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'visible',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            width: '100%',
            scrollbarWidth: 'none',
          }}>
            {menus.map(item => (
              <DockItem
                key={item.to}
                {...item}
                mouseY={mouseY}
                accentColor={accent}
              />
            ))}
          </div>
        </div>
      )}
    </aside>
  )
}