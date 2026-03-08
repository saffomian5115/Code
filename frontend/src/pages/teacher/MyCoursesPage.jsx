// ═══════════════════════════════════════════════════════════════
//  MyCoursesPage.jsx  —  Neumorphic + Right-click Context Menu
//  Replace: frontend/src/pages/teacher/MyCoursesPage.jsx
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react'
import {
  BookOpen, Users, ClipboardCheck, FileText,
  PenSquare, BarChart2, Loader2, Hash,
  MapPin, Clock, GraduationCap, Eye,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { teacherAPI } from '../../api/teacher.api'
import { useContextMenu, ContextMenu } from '../../hooks/useContextMenu'

// ── Shared Neu helpers ────────────────────────────────────────
const neu = (extra = {}) => ({
  background: 'var(--neu-surface)',
  boxShadow: 'var(--neu-raised)',
  border: '1px solid var(--neu-border)',
  borderRadius: '1.25rem',
  ...extra,
})

const neuBtn = (accent = '#5b8af0', extra = {}) => ({
  display: 'flex', alignItems: 'center', gap: '0.45rem',
  padding: '0.5rem 1rem',
  borderRadius: '0.75rem',
  border: 'none',
  background: `linear-gradient(145deg, ${accent}ee, ${accent}cc)`,
  boxShadow: `4px 4px 10px var(--neu-shadow-dark), -2px -2px 6px var(--neu-shadow-light)`,
  color: '#fff',
  fontSize: '0.75rem', fontWeight: 700,
  fontFamily: "'DM Sans', sans-serif",
  cursor: 'pointer',
  transition: 'transform 0.15s, box-shadow 0.15s',
  ...extra,
})

const ACCENT_MAP = {
  attendance:  { color: '#5b8af0', bg: 'rgba(91,138,240,0.12)'  },
  assignments: { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  quizzes:     { color: '#34d399', bg: 'rgba(52,211,153,0.12)'  },
  results:     { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)'  },
}

// ── Course Card ───────────────────────────────────────────────
function CourseCard({ offering, onNavigate, onRightClick }) {
  const [hovered, setHovered] = useState(false)
  const enrolled = offering.enrolled_count || 0
  const cap = offering.capacity || enrolled || 1
  const pct = Math.min(100, Math.round((enrolled / cap) * 100))
  const barColor = pct >= 90 ? '#f26b6b' : pct >= 70 ? '#f5a623' : '#3ecf8e'

  const actions = [
    { key: 'attendance',  label: 'Attendance',  icon: ClipboardCheck, path: `/teacher/attendance?offering=${offering.id}` },
    { key: 'assignments', label: 'Assignments', icon: FileText,        path: `/teacher/assignments?offering=${offering.id}` },
    { key: 'quizzes',    label: 'Quizzes',     icon: PenSquare,       path: `/teacher/quizzes?offering=${offering.id}` },
    { key: 'results',    label: 'Results',     icon: BarChart2,       path: `/teacher/results?offering=${offering.id}` },
  ]

  return (
    <div
      onContextMenu={e => onRightClick(e, offering)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...neu(),
        padding: '1.35rem',
        cursor: 'context-menu',
        transition: 'transform 0.2s, box-shadow 0.2s',
        transform: hovered ? 'translateY(-3px)' : 'none',
        boxShadow: hovered
          ? '12px 12px 28px var(--neu-shadow-dark), -8px -8px 18px var(--neu-shadow-light)'
          : 'var(--neu-raised)',
        position: 'relative',
        display: 'flex', flexDirection: 'column', gap: '1rem',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
        <div style={{
          width: 44, height: 44, borderRadius: '0.875rem', flexShrink: 0,
          background: 'rgba(91,138,240,0.12)', color: '#5b8af0',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: 'inset 2px 2px 5px var(--neu-shadow-dark), inset -1px -1px 4px var(--neu-shadow-light)',
        }}>
          <BookOpen size={20} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontSize: '0.93rem', fontWeight: 700, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', lineHeight: 1.3, marginBottom: '0.2rem' }}>
            {offering.course_name}
          </h3>
          <p style={{ fontSize: '0.72rem', color: 'var(--neu-text-ghost)', fontFamily: 'monospace' }}>
            {offering.course_code}
          </p>
        </div>
        <span style={{
          fontSize: '0.65rem', fontWeight: 700,
          padding: '0.2rem 0.55rem', borderRadius: '0.4rem',
          background: 'rgba(91,138,240,0.12)', color: '#5b8af0',
        }}>
          Sec {offering.section || '—'}
        </span>
      </div>

      {/* Meta */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        {offering.semester_name && (
          <span style={{ fontSize: '0.72rem', color: 'var(--neu-text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Clock size={11} style={{ color: 'var(--neu-text-ghost)' }} />
            {offering.semester_name}
          </span>
        )}
        {offering.room_number && (
          <span style={{ fontSize: '0.72rem', color: 'var(--neu-text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <MapPin size={11} style={{ color: 'var(--neu-text-ghost)' }} />
            Room {offering.room_number}
          </span>
        )}
      </div>

      {/* Enrollment bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--neu-text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Users size={11} /> {enrolled} students
          </span>
          <span style={{ fontSize: '0.7rem', color: 'var(--neu-text-ghost)' }}>{pct}% enrolled</span>
        </div>
        <div style={{
          height: '6px', borderRadius: '999px',
          boxShadow: 'inset 2px 2px 4px var(--neu-shadow-dark), inset -1px -1px 3px var(--neu-shadow-light)',
          background: 'var(--neu-surface-deep)',
          overflow: 'hidden',
        }}>
          <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: '999px', transition: 'width 0.4s ease' }} />
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
        {actions.map(({ key, label, icon: Icon, path }) => {
          const { color, bg } = ACCENT_MAP[key]
          return (
            <button key={key} onClick={() => onNavigate(path)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
                padding: '0.55rem 0.5rem',
                borderRadius: '0.75rem', border: 'none',
                background: bg, color,
                fontSize: '0.72rem', fontWeight: 700,
                fontFamily: "'DM Sans', sans-serif",
                cursor: 'pointer',
                boxShadow: '2px 2px 6px var(--neu-shadow-dark), -1px -1px 4px var(--neu-shadow-light)',
                transition: 'transform 0.14s, box-shadow 0.14s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)'; e.currentTarget.style.boxShadow = '4px 4px 10px var(--neu-shadow-dark), -2px -2px 6px var(--neu-shadow-light)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '2px 2px 6px var(--neu-shadow-dark), -1px -1px 4px var(--neu-shadow-light)' }}
            >
              <Icon size={12} /> {label}
            </button>
          )
        })}
      </div>

      {/* Right-click hint */}
      <span style={{ position: 'absolute', bottom: '0.5rem', right: '0.75rem', fontSize: '0.58rem', color: 'var(--neu-text-ghost)', opacity: 0.4, pointerEvents: 'none' }}>
        ⊞ right-click
      </span>
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{ ...neu(), padding: '1.35rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {[44, 20, 14, 32].map((h, i) => (
        <div key={i} style={{ height: h, borderRadius: '0.75rem', background: 'var(--neu-surface-deep)', boxShadow: 'inset 2px 2px 5px var(--neu-shadow-dark), inset -1px -1px 4px var(--neu-shadow-light)', animation: 'pulse 1.4s ease-in-out infinite', opacity: 0.7 }} />
      ))}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────
export default function MyCoursesPage() {
  const [offerings, setOfferings] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { menu, open: openMenu, close: closeMenu } = useContextMenu()

  useEffect(() => {
    teacherAPI.getMyOfferings()
      .then(r => setOfferings(r.data.data?.offerings || []))
      .catch(() => toast.error('Failed to load courses'))
      .finally(() => setLoading(false))
  }, [])

  const ctxItems = (offering) => [
    { label: 'Mark Attendance', icon: ClipboardCheck, onClick: o => navigate(`/teacher/attendance?offering=${o.id}`) },
    { label: 'Assignments',     icon: FileText,        onClick: o => navigate(`/teacher/assignments?offering=${o.id}`) },
    { label: 'Quizzes',         icon: PenSquare,       onClick: o => navigate(`/teacher/quizzes?offering=${o.id}`) },
    { label: 'Results',         icon: BarChart2,       onClick: o => navigate(`/teacher/results?offering=${o.id}`) },
    { divider: true },
    { label: 'View Details',    icon: Eye,             onClick: o => navigate(`/teacher/attendance?offering=${o.id}`) },
  ]

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '2rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.55rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', marginBottom: '0.2rem' }}>
            My Courses
          </h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--neu-text-ghost)' }}>
            {offerings.length} course{offerings.length !== 1 ? 's' : ''} assigned this semester
          </p>
        </div>

        {/* KPI pill */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.55rem 1rem',
          ...neu({ borderRadius: '0.875rem', boxShadow: 'var(--neu-raised)' }),
        }}>
          <GraduationCap size={16} style={{ color: '#5b8af0' }} />
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--neu-text-primary)' }}>
            {offerings.reduce((s, o) => s + (o.enrolled_count || 0), 0)} total students
          </span>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.1rem' }}>
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : offerings.length === 0 ? (
        <div style={{ ...neu(), padding: '4rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: 56, height: 56, borderRadius: '1rem',
            background: 'rgba(91,138,240,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'inset 3px 3px 7px var(--neu-shadow-dark), inset -2px -2px 5px var(--neu-shadow-light)',
          }}>
            <BookOpen size={24} style={{ color: '#5b8af0' }} />
          </div>
          <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--neu-text-secondary)' }}>No courses assigned</p>
          <p style={{ fontSize: '0.8rem', color: 'var(--neu-text-ghost)' }}>Contact admin to get courses assigned</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.1rem' }}>
          {offerings.map(o => (
            <CourseCard
              key={o.id}
              offering={o}
              onNavigate={navigate}
              onRightClick={openMenu}
            />
          ))}
        </div>
      )}

      <ContextMenu menu={menu} close={closeMenu} items={menu ? ctxItems(menu.row) : []} />
    </div>
  )
}