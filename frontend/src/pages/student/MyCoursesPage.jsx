// ═══════════════════════════════════════════════════════════════
//  MyCoursesPage.jsx  (Student)  —  Departments-style cards
//  Left-click → context menu  |  All functions backend-accurate
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect, useMemo } from 'react'
import {
  BookOpen, Search, GraduationCap, Clock,
  Hash, Layers, BarChart2, ClipboardCheck,
  FileText, PenSquare, ChevronRight,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { studentAPI } from '../../api/student.api'
import { useContextMenu, ContextMenu } from '../../hooks/useContextMenu'

/* ─── CSS injected once ──────────────────────────── */
const CSS = `
  .course-card {
    background: var(--neu-surface);
    border: 1px solid var(--neu-border);
    border-radius: 1.25rem;
    box-shadow: 6px 6px 16px var(--neu-shadow-dark), -3px -3px 10px var(--neu-shadow-light);
    padding: 0;
    position: relative;
    overflow: hidden;
    cursor: pointer;
    user-select: none;
    transition:
      box-shadow 0.25s ease,
      transform 0.25s ease;
  }
  .course-card:hover {
    transform: translateY(-4px);
    box-shadow:
      10px 18px 32px var(--neu-shadow-dark),
      -4px -4px 14px var(--neu-shadow-light);
  }
  .course-card:hover .card-hover-ring {
    opacity: 1;
  }
  .card-hover-ring {
    position: absolute;
    inset: 0;
    border-radius: 1.25rem;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.25s ease;
  }
  @keyframes spin { to { transform: rotate(360deg) } }
  @keyframes pulse { 0%,100%{opacity:.4} 50%{opacity:.85} }
  @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
`

/* ─── Accent palette (same as DepartmentsPage) ───── */
const PALETTE = [
  { c: '#5b8af0', bg: 'rgba(91,138,240,.1)',  ring: 'rgba(91,138,240,.35)' },
  { c: '#9b59b6', bg: 'rgba(155,89,182,.1)',  ring: 'rgba(155,89,182,.35)' },
  { c: '#22a06b', bg: 'rgba(34,160,107,.1)',  ring: 'rgba(34,160,107,.35)' },
  { c: '#f97316', bg: 'rgba(249,115,22,.1)',  ring: 'rgba(249,115,22,.35)' },
  { c: '#ef4444', bg: 'rgba(239,68,68,.1)',   ring: 'rgba(239,68,68,.35)'  },
  { c: '#f59e0b', bg: 'rgba(245,158,11,.1)',  ring: 'rgba(245,158,11,.35)' },
  { c: '#06b6d4', bg: 'rgba(6,182,212,.1)',   ring: 'rgba(6,182,212,.35)'  },
  { c: '#e879f9', bg: 'rgba(232,121,249,.1)', ring: 'rgba(232,121,249,.35)'},
]

/* ─── Skeleton card ──────────────────────────────── */
function SkeletonCard() {
  return (
    <div style={{
      background: 'var(--neu-surface)',
      border: '1px solid var(--neu-border)',
      borderRadius: '1.25rem',
      padding: '1.4rem',
      boxShadow: '6px 6px 16px var(--neu-shadow-dark), -3px -3px 10px var(--neu-shadow-light)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ width: 48, height: 22, borderRadius: '.4rem', background: 'var(--neu-surface-deep)', animation: 'pulse 1.5s ease-in-out infinite' }} />
        <div style={{ width: 60, height: 22, borderRadius: '.4rem', background: 'var(--neu-surface-deep)', animation: 'pulse 1.5s ease-in-out infinite' }} />
      </div>
      <div style={{ height: 15, background: 'var(--neu-surface-deep)', borderRadius: 6, width: '70%', marginBottom: '.6rem', animation: 'pulse 1.5s ease-in-out infinite' }} />
      <div style={{ height: 11, background: 'var(--neu-surface-deep)', borderRadius: 6, width: '90%', marginBottom: '.3rem', animation: 'pulse 1.5s ease-in-out infinite' }} />
      <div style={{ height: 11, background: 'var(--neu-surface-deep)', borderRadius: 6, width: '55%', animation: 'pulse 1.5s ease-in-out infinite' }} />
    </div>
  )
}

/* ─── Course Card ─────────────────────────────────── */
function CourseCard({ enr, pal, idx, onClick }) {
  const approved = enr.is_approved
  const code     = enr.course_code || ''
  const name     = enr.course_name || 'Unnamed Course'

  return (
    <div
      className="course-card"
      onClick={onClick}
      style={{ animationDelay: `${idx * 0.05}s`, animation: 'fadeUp 0.3s ease both' }}
    >
      {/* hover ring */}
      <div className="card-hover-ring" style={{ boxShadow: `inset 0 0 0 1.5px ${pal.ring}` }} />

      {/* top accent stripe */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: 4, background: pal.c, opacity: 0.85,
      }} />

      <div style={{ padding: '1.4rem', display: 'flex', flexDirection: 'column', gap: '.75rem' }}>

        {/* Code badge + status */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{
            fontSize: '.72rem', fontWeight: 800,
            padding: '.22rem .65rem',
            background: 'var(--neu-surface-deep)',
            color: pal.c,
            borderRadius: '.5rem',
            boxShadow: 'inset 2px 2px 4px var(--neu-shadow-dark), inset -1px -1px 3px var(--neu-shadow-light)',
            fontFamily: 'monospace', letterSpacing: '.04em',
          }}>
            {code || '—'}
          </span>
          <span style={{
            fontSize: '.65rem', fontWeight: 800,
            padding: '.18rem .55rem',
            borderRadius: '.4rem',
            background: approved ? 'rgba(62,207,142,.12)' : 'rgba(245,166,35,.12)',
            color: approved ? '#3ecf8e' : '#f5a623',
            border: `1px solid ${approved ? 'rgba(62,207,142,.28)' : 'rgba(245,166,35,.28)'}`,
            letterSpacing: '.02em',
          }}>
            {approved ? '✓ Active' : '⏳ Pending'}
          </span>
        </div>

        {/* Course name + description placeholder */}
        <div style={{ marginTop: '.1rem' }}>
          <h3 style={{
            fontSize: '1.05rem', fontWeight: 800,
            color: 'var(--neu-text-primary)',
            fontFamily: 'Outfit, sans-serif',
            lineHeight: 1.25, marginBottom: '.35rem',
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {name}
          </h3>
          {/* Empty height to keep cards uniform height */}
          <div style={{ minHeight: '1.2rem' }} />
        </div>

        {/* Meta row */}
        <div style={{
          paddingTop: '.75rem',
          borderTop: '1px solid var(--neu-border)',
          display: 'flex', flexDirection: 'column', gap: '.45rem',
        }}>
          {enr.instructor && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '.45rem' }}>
              <GraduationCap size={13} style={{ color: pal.c, flexShrink: 0 }} />
              <span style={{
                fontSize: '.75rem', fontWeight: 600,
                color: 'var(--neu-text-primary)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {enr.instructor}
              </span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            {enr.section && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '.35rem' }}>
                <Hash size={12} style={{ color: pal.c }} />
                <span style={{ fontSize: '.73rem', color: 'var(--neu-text-secondary)' }}>Section {enr.section}</span>
              </div>
            )}
            {enr.credit_hours && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '.35rem' }}>
                <Clock size={12} style={{ color: pal.c }} />
                <span style={{ fontSize: '.73rem', color: 'var(--neu-text-secondary)' }}>{enr.credit_hours} cr hrs</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════ */
export default function MyCoursesPage() {
  const [enrollments, setEnrollments] = useState([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const navigate = useNavigate()
  const { menu, open: openMenu, close: closeMenu } = useContextMenu()

  useEffect(() => {
    studentAPI.getEnrollments()
      .then(r => setEnrollments(r.data.data?.enrollments || []))
      .catch(() => toast.error('Failed to load courses'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    if (!search.trim()) return enrollments
    const q = search.toLowerCase()
    return enrollments.filter(e =>
      e.course_name?.toLowerCase().includes(q) ||
      e.course_code?.toLowerCase().includes(q) ||
      e.instructor?.toLowerCase().includes(q) ||
      e.section?.toLowerCase().includes(q)
    )
  }, [enrollments, search])

  const approved = enrollments.filter(e => e.is_approved)
  const pending  = enrollments.filter(e => !e.is_approved)

  /* Context menu items — all functions correct per backend */
  const ctxItems = (enr) => [
    {
      label: 'Course Details',
      icon: BookOpen,
      onClick: () => navigate(`/student/courses/${enr.offering_id}`),
    },
    {
      label: 'Attendance',
      icon: ClipboardCheck,
      onClick: () => navigate('/student/attendance'),
    },
    {
      label: 'Assignments',
      icon: FileText,
      onClick: () => navigate('/student/assignments'),
    },
    {
      label: 'Quizzes',
      icon: PenSquare,
      onClick: () => navigate('/student/quizzes'),
    },
    {
      label: 'Results',
      icon: BarChart2,
      onClick: () => navigate('/student/results'),
    },
  ]

  const iS = {
    background: 'var(--neu-surface-deep)',
    boxShadow: 'inset 3px 3px 7px var(--neu-shadow-dark), inset -2px -2px 5px var(--neu-shadow-light)',
    border: '1px solid var(--neu-border)',
    borderRadius: '.75rem',
    padding: '.6rem .9rem',
    fontSize: '.85rem',
    color: 'var(--neu-text-primary)',
    outline: 'none',
    fontFamily: "'DM Sans', sans-serif",
    width: '100%',
    boxSizing: 'border-box',
  }

  return (
    <>
      <style>{CSS}</style>

      <div style={{
        maxWidth: 1100, margin: '0 auto',
        display: 'flex', flexDirection: 'column', gap: '1.3rem',
        paddingBottom: '2rem',
      }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.7rem', marginBottom: '.2rem' }}>
              <div style={{
                width: 38, height: 38, borderRadius: '.875rem',
                background: 'var(--neu-surface-deep)',
                boxShadow: 'inset 3px 3px 7px var(--neu-shadow-dark), inset -2px -2px 5px var(--neu-shadow-light)',
                border: '1px solid var(--neu-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5b8af0',
              }}>
                <Layers size={17} />
              </div>
              <h1 style={{
                fontSize: '1.45rem', fontWeight: 800,
                color: 'var(--neu-text-primary)',
                fontFamily: 'Outfit, sans-serif', letterSpacing: '-.02em',
              }}>
                My Courses
              </h1>
            </div>
            <p style={{ fontSize: '.78rem', color: 'var(--neu-text-ghost)', marginLeft: '.2rem' }}>
              {loading ? '…' : `${enrollments.length} enrollments this semester`}
            </p>
          </div>

          {/* Status pills */}
          {!loading && (
            <div style={{ display: 'flex', gap: '.55rem' }}>
              {[
                { label: `${approved.length} Active`, color: '#3ecf8e', bg: 'rgba(62,207,142,.1)', border: 'rgba(62,207,142,.28)' },
                { label: `${pending.length} Pending`, color: '#f5a623', bg: 'rgba(245,166,35,.1)',  border: 'rgba(245,166,35,.28)'  },
              ].map(({ label, color, bg, border }) => (
                <span key={label} style={{
                  fontSize: '.75rem', fontWeight: 700,
                  padding: '.38rem .85rem',
                  borderRadius: '.65rem',
                  background: bg, color,
                  border: `1px solid ${border}`,
                  boxShadow: '4px 4px 9px var(--neu-shadow-dark), -2px -2px 6px var(--neu-shadow-light)',
                }}>
                  {label}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ── Search ── */}
        <div style={{ position: 'relative', maxWidth: 340 }}>
          <Search size={14} style={{
            position: 'absolute', left: '.85rem', top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--neu-text-ghost)', pointerEvents: 'none',
          }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, code, instructor…"
            style={{ ...iS, paddingLeft: '2.25rem' }}
          />
        </div>

        {/* Hint */}
        {!loading && filtered.length > 0 && (
          <p style={{ fontSize: '.72rem', color: 'var(--neu-text-ghost)', marginTop: '-.6rem' }}>
            Click on a card to see options
          </p>
        )}

        {/* ── Cards grid ── */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(270px,1fr))', gap: '1rem' }}>
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            background: 'var(--neu-surface)',
            border: '1px solid var(--neu-border)',
            borderRadius: '1.25rem',
            padding: '4rem 2rem',
            textAlign: 'center',
            boxShadow: '6px 6px 16px var(--neu-shadow-dark), -3px -3px 10px var(--neu-shadow-light)',
          }}>
            <BookOpen size={38} style={{
              color: 'var(--neu-text-ghost)',
              margin: '0 auto .8rem',
              opacity: 0.25, display: 'block',
            }} />
            <p style={{ fontWeight: 600, color: 'var(--neu-text-secondary)', fontSize: '.9rem' }}>
              {search ? 'No courses match your search' : 'No courses enrolled yet'}
            </p>
            <p style={{ fontSize: '.78rem', color: 'var(--neu-text-ghost)', marginTop: '.35rem' }}>
              {search ? 'Try a different keyword' : 'Contact admin to enroll in courses'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(270px,1fr))', gap: '1rem' }}>
            {filtered.map((enr, idx) => {
              const pal = PALETTE[idx % PALETTE.length]
              return (
                <CourseCard
                  key={enr.offering_id}
                  enr={enr}
                  pal={pal}
                  idx={idx}
                  onClick={e => openMenu(e, enr)}
                />
              )
            })}
          </div>
        )}

        {/* ── Context Menu ── */}
        <ContextMenu
          menu={menu}
          close={closeMenu}
          items={menu ? ctxItems(menu.row) : []}
        />
      </div>
    </>
  )
}