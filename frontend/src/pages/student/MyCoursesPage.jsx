// ═══════════════════════════════════════════════════════════════
//  MyCoursesPage.jsx  (Student)  —  Neumorphic
//  → frontend/src/pages/student/MyCoursesPage.jsx
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect } from 'react'
import {
  BookOpen, GraduationCap, Hash, Clock,
  ClipboardCheck, FileText, ChevronRight,
  Layers, BarChart2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { studentAPI } from '../../api/student.api'
import { useContextMenu, ContextMenu } from '../../hooks/useContextMenu'

/* ─── theme helpers ──────────────────────────────────────────── */
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

const PALETTE = ['#5b8af0','#a78bfa','#3ecf8e','#f59e0b','#f87171','#38bdf8','#fb923c','#e879f9']
const cc = (idx) => PALETTE[idx % PALETTE.length]

/* ─── Skeleton ───────────────────────────────────────────────── */
function Skeleton() {
  return (
    <div style={{ ...neu({ padding: '1.4rem', display: 'flex', flexDirection: 'column', gap: '1rem' }) }}>
      <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
        <div style={{ width: 52, height: 52, borderRadius: '0.875rem', background: 'var(--neu-surface-deep)', animation: 'pulse 1.5s ease-in-out infinite', flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ height: 14, borderRadius: '0.5rem', background: 'var(--neu-surface-deep)', animation: 'pulse 1.5s ease-in-out 0.1s infinite' }} />
          <div style={{ height: 11, borderRadius: '0.5rem', background: 'var(--neu-surface-deep)', width: '60%', animation: 'pulse 1.5s ease-in-out 0.2s infinite' }} />
        </div>
      </div>
      <div style={{ height: 1, background: 'var(--neu-border)' }} />
      <div style={{ height: 12, borderRadius: '0.5rem', background: 'var(--neu-surface-deep)', width: '80%', animation: 'pulse 1.5s ease-in-out 0.15s infinite' }} />
      <div style={{ height: 12, borderRadius: '0.5rem', background: 'var(--neu-surface-deep)', width: '50%', animation: 'pulse 1.5s ease-in-out 0.25s infinite' }} />
    </div>
  )
}

/* ─── Course Card ────────────────────────────────────────────── */
function CourseCard({ enr, idx, onCtx, navigate }) {
  const [hov, setHov] = useState(false)
  const color    = cc(idx)
  const code     = enr.course_code  || ''
  const name     = enr.course_name  || 'Unnamed Course'
  const initials = (code.slice(0, 3) || name.slice(0, 2)).toUpperCase()
  const approved = enr.is_approved

  return (
    <div
      onContextMenu={e => onCtx(e, enr)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        ...neu({
          padding: 0, overflow: 'hidden', position: 'relative',
          cursor: 'context-menu', display: 'flex', flexDirection: 'column',
        }),
        transition: 'transform 0.22s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s',
        transform: hov ? 'translateY(-5px)' : '',
        boxShadow: hov
          ? `16px 16px 36px var(--neu-shadow-dark), -8px -8px 22px var(--neu-shadow-light), 0 0 0 1.5px ${color}30`
          : 'var(--neu-raised)',
        animation: `fadeUp 0.3s ease both`,
        animationDelay: `${idx * 0.06}s`,
      }}
    >
      {/* Left accent bar */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
        background: `linear-gradient(180deg, ${color}, ${color}55)`,
        borderRadius: '1.25rem 0 0 1.25rem',
      }} />

      <div style={{ padding: '1.3rem 1.25rem 1.2rem 1.45rem', display: 'flex', flexDirection: 'column', gap: '0.9rem', flex: 1 }}>

        {/* ── Header row ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>

          {/* Avatar */}
          <div style={{
            width: 52, height: 52, borderRadius: '0.875rem', flexShrink: 0,
            background: `linear-gradient(145deg, ${color}f0, ${color}88)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: '0.85rem', fontWeight: 900,
            fontFamily: 'Outfit, sans-serif', letterSpacing: '0.03em',
            boxShadow: `5px 5px 14px var(--neu-shadow-dark), -3px -3px 8px var(--neu-shadow-light), 0 4px 12px ${color}40`,
          }}>
            {initials}
          </div>

          {/* Title + code */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{
              fontSize: '0.9rem', fontWeight: 800, color: 'var(--neu-text-primary)',
              fontFamily: 'Outfit, sans-serif', lineHeight: 1.35, marginBottom: '0.3rem',
              display: '-webkit-box', WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
              {name}
            </h3>
            {code && (
              <span style={{
                display: 'inline-block', fontSize: '0.67rem', fontWeight: 700,
                fontFamily: 'monospace', color, background: `${color}18`,
                padding: '0.12rem 0.5rem', borderRadius: '0.4rem',
                border: `1px solid ${color}25`,
              }}>
                {code}
              </span>
            )}
          </div>

          {/* Status badge */}
          <div style={{
            flexShrink: 0, marginTop: '0.1rem',
            fontSize: '0.6rem', fontWeight: 800,
            padding: '0.22rem 0.55rem', borderRadius: '0.45rem',
            background: approved ? 'rgba(62,207,142,0.12)' : 'rgba(245,166,35,0.12)',
            color: approved ? '#3ecf8e' : '#f5a623',
            border: `1px solid ${approved ? 'rgba(62,207,142,0.28)' : 'rgba(245,166,35,0.28)'}`,
            letterSpacing: '0.03em',
          }}>
            {approved ? '✓ Active' : '⏳ Pending'}
          </div>
        </div>

        {/* ── Divider ── */}
        <div style={{ height: 1, background: 'var(--neu-border)', margin: '0 0.1rem' }} />

        {/* ── Meta info ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          {enr.instructor && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ ...neuInset({ width: 22, height: 22, borderRadius: '0.45rem' }), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <GraduationCap size={11} style={{ color: 'var(--neu-text-ghost)' }} />
              </div>
              <span style={{ fontSize: '0.73rem', color: 'var(--neu-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {enr.instructor}
              </span>
            </div>
          )}
          <div style={{ display: 'flex', gap: '1.2rem', flexWrap: 'wrap' }}>
            {enr.section && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Hash size={11} style={{ color: 'var(--neu-text-ghost)' }} />
                <span style={{ fontSize: '0.7rem', color: 'var(--neu-text-ghost)' }}>Section {enr.section}</span>
              </div>
            )}
            {enr.credit_hours && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Clock size={11} style={{ color: 'var(--neu-text-ghost)' }} />
                <span style={{ fontSize: '0.7rem', color: 'var(--neu-text-ghost)' }}>{enr.credit_hours} cr hrs</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
          <button
            onClick={e => { e.stopPropagation(); navigate(`/student/courses/${enr.offering_id}`) }}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.35rem',
              padding: '0.42rem 0.9rem', borderRadius: '0.65rem',
              border: 'none', background: `${color}18`, color,
              fontSize: '0.72rem', fontWeight: 700,
              fontFamily: "'DM Sans', sans-serif", cursor: 'pointer',
              boxShadow: `3px 3px 8px var(--neu-shadow-dark), -2px -2px 5px var(--neu-shadow-light)`,
              transition: 'transform 0.13s, box-shadow 0.13s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateX(3px)'
              e.currentTarget.style.boxShadow = `5px 5px 12px var(--neu-shadow-dark), -3px -3px 7px var(--neu-shadow-light)`
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = ''
              e.currentTarget.style.boxShadow = `3px 3px 8px var(--neu-shadow-dark), -2px -2px 5px var(--neu-shadow-light)`
            }}
          >
            Open <ChevronRight size={13} />
          </button>

          {/* Right-click hint — fades in on hover */}
          <span style={{
            fontSize: '0.58rem', color: 'var(--neu-text-ghost)',
            opacity: hov ? 0.55 : 0.18, transition: 'opacity 0.25s',
            userSelect: 'none', pointerEvents: 'none',
          }}>
            right-click for more
          </span>
        </div>
      </div>
    </div>
  )
}

/* ─── Main Page ──────────────────────────────────────────────── */
export default function MyCoursesPage() {
  const [enrollments, setEnrollments] = useState([])
  const [loading, setLoading]         = useState(true)
  const navigate = useNavigate()
  const { menu, open: openCtx, close: closeCtx } = useContextMenu()

  useEffect(() => {
    studentAPI.getEnrollments()
      .then(r => setEnrollments(r.data.data?.enrollments || []))
      .catch(() => toast.error('Failed to load courses'))
      .finally(() => setLoading(false))
  }, [])

  const approved = enrollments.filter(e => e.is_approved)
  const pending  = enrollments.filter(e => !e.is_approved)

  /* Context menu items — receives the right-clicked enrollment */
  const ctxItems = (enr) => [
    {
      label: 'Course Details',
      icon:  BookOpen,
      onClick: () => navigate(`/student/courses/${enr.offering_id}`),
    },
    {
      label: 'Attendance',
      icon:  ClipboardCheck,
      onClick: () => navigate('/student/attendance'),
    },
    {
      label: 'Assignments',
      icon:  FileText,
      onClick: () => navigate('/student/assignments'),
    },
    {
      label: 'Results',
      icon:  BarChart2,
      onClick: () => navigate('/student/results'),
    },
  ]

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '2rem' }}>
      <style>{`
        @keyframes pulse  { 0%,100%{opacity:.4} 50%{opacity:.85} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }
      `}</style>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', marginBottom: '0.25rem' }}>
            <div style={{ ...neuInset({ width: 42, height: 42, borderRadius: '0.875rem' }), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5b8af0' }}>
              <Layers size={19} />
            </div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit, sans-serif' }}>
              My Courses
            </h1>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--neu-text-ghost)', marginLeft: '0.25rem' }}>
            {loading ? '…' : `${enrollments.length} enrollments this semester`}
          </p>
        </div>

        {/* Stat pills */}
        {!loading && (
          <div style={{ display: 'flex', gap: '0.55rem' }}>
            {[
              { label: `${approved.length} Active`,  color: '#3ecf8e', bg: 'rgba(62,207,142,0.1)'  },
              { label: `${pending.length} Pending`,  color: '#f5a623', bg: 'rgba(245,166,35,0.1)'  },
            ].map(({ label, color, bg }) => (
              <span key={label} style={{
                fontSize: '0.75rem', fontWeight: 700, padding: '0.42rem 0.9rem',
                borderRadius: '0.65rem', background: bg, color,
                border: '1px solid var(--neu-border)',
                boxShadow: '4px 4px 9px var(--neu-shadow-dark), -2px -2px 6px var(--neu-shadow-light)',
              }}>
                {label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Grid ── */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(295px, 1fr))', gap: '1rem' }}>
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} />)}
        </div>
      ) : enrollments.length === 0 ? (
        <div style={{ ...neu({ padding: '5rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.85rem' }) }}>
          <div style={{ ...neuInset({ width: 64, height: 64, borderRadius: '1.25rem' }), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5b8af0' }}>
            <BookOpen size={28} />
          </div>
          <p style={{ fontWeight: 700, color: 'var(--neu-text-secondary)', fontSize: '1rem' }}>No courses enrolled yet</p>
          <p style={{ fontSize: '0.8rem', color: 'var(--neu-text-ghost)' }}>Contact admin to enroll in courses</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(295px, 1fr))', gap: '1rem' }}>
          {enrollments.map((enr, idx) => (
            <CourseCard key={enr.offering_id} enr={enr} idx={idx} onCtx={openCtx} navigate={navigate} />
          ))}
        </div>
      )}

      {/* Context Menu */}
      <ContextMenu menu={menu} close={closeCtx} items={menu ? ctxItems(menu.row) : []} />
    </div>
  )
}