// ═══════════════════════════════════════════════════════════════
//  MyCoursesPage.jsx  —  Teacher Courses (Card Design like Departments)
//  Left-click context menu, full details modal, no inline buttons
//  Replace: frontend/src/pages/teacher/MyCoursesPage.jsx
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BookOpen, Users, MapPin, Clock, Search,
  Loader2, ClipboardCheck, FileText,
  PenSquare, BarChart2, Eye, X, Calendar,
  GraduationCap, Hash, User,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { teacherAPI } from '../../api/teacher.api'
import { useContextMenu, ContextMenu } from '../../hooks/useContextMenu'

/* ─── CSS ────────────────────────────────────────── */
const CSS = `
  @keyframes spin         { to { transform: rotate(360deg) } }
  @keyframes pulse        { 0%,100%{opacity:1} 50%{opacity:.45} }
  @keyframes neu-slide-up { from{opacity:0;transform:translateY(18px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }

  .course-card {
    background: var(--neu-surface);
    border: 1px solid var(--neu-border);
    border-radius: 1.25rem;
    box-shadow: 6px 6px 16px var(--neu-shadow-dark), -3px -3px 10px var(--neu-shadow-light);
    position: relative;
    overflow: hidden;
    cursor: pointer;
    user-select: none;
    transition: transform .22s ease, box-shadow .22s ease;
  }
  .course-card:hover {
    transform: translateY(-4px);
    box-shadow: 10px 18px 32px var(--neu-shadow-dark), -4px -4px 14px var(--neu-shadow-light);
  }
  .course-card:hover .card-ring {
    opacity: 1;
  }
  .card-ring {
    position: absolute;
    inset: 0;
    border-radius: 1.25rem;
    pointer-events: none;
    opacity: 0;
    transition: opacity .22s ease;
  }
`

/* ─── Shared form input style ────────────────────── */
const iS = {
  width: '100%',
  background: 'var(--neu-surface-deep)',
  boxShadow: 'inset 3px 3px 7px var(--neu-shadow-dark), inset -2px -2px 5px var(--neu-shadow-light)',
  border: '1px solid var(--neu-border)',
  borderRadius: '.75rem',
  padding: '.6rem .9rem',
  fontSize: '.85rem',
  color: 'var(--neu-text-primary)',
  outline: 'none',
  fontFamily: "'DM Sans', sans-serif",
}

/* ─── Accent colors ──────────────────────────────── */
const PALETTE = [
  { c: '#5b8af0', bg: 'rgba(91,138,240,.1)',  ring: 'rgba(91,138,240,.35)' },
  { c: '#22a06b', bg: 'rgba(34,160,107,.1)',  ring: 'rgba(34,160,107,.35)' },
  { c: '#9b59b6', bg: 'rgba(155,89,182,.1)',  ring: 'rgba(155,89,182,.35)' },
  { c: '#f97316', bg: 'rgba(249,115,22,.1)',  ring: 'rgba(249,115,22,.35)'  },
  { c: '#06b6d4', bg: 'rgba(6,182,212,.1)',   ring: 'rgba(6,182,212,.35)'  },
  { c: '#f59e0b', bg: 'rgba(245,158,11,.1)',  ring: 'rgba(245,158,11,.35)' },
]

const fmt12 = t => {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'pm' : 'am'
  return `${h % 12 || 12}:${String(m).padStart(2, '0')}${ampm}`
}

/* ─── Modal shell ────────────────────────────────── */
function Modal({ children, maxW = 500 }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(8,12,20,.7)', backdropFilter: 'blur(10px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: maxW, background: 'var(--neu-surface)', boxShadow: '14px 14px 36px var(--neu-shadow-dark), -6px -6px 20px var(--neu-shadow-light)', border: '1px solid var(--neu-border)', borderRadius: '1.5rem', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'neu-slide-up .2s cubic-bezier(.34,1.56,.64,1) both' }}>
        {children}
      </div>
    </div>
  )
}

/* ─── View Details Modal ─────────────────────────── */
function ViewModal({ offering, pal, onClose, onNavigate }) {
  const [students, setStudents] = useState([])
  const [loadingStudents, setLoadingStudents] = useState(true)

  useEffect(() => {
    teacherAPI.getOfferingStudents(offering.id)
      .then(r => setStudents(r.data.data?.students || []))
      .catch(() => {})
      .finally(() => setLoadingStudents(false))
  }, [offering.id])

  const enrolled = offering.enrolled_count || offering.enrolled_students || 0
  const max = offering.max_students || 0
  const pct = max ? Math.round((enrolled / max) * 100) : 0
  const fillColor = pct >= 90 ? '#ef4444' : pct >= 70 ? '#f97316' : '#22a06b'
  const schedule = offering.schedule_json || offering.schedule || []

  const actions = [
    { label: 'Mark Attendance', icon: ClipboardCheck, color: '#5b8af0', path: `/teacher/attendance?offering=${offering.id}` },
    { label: 'Assignments',     icon: FileText,        color: '#a78bfa', path: `/teacher/assignments?offering=${offering.id}` },
    { label: 'Quizzes',         icon: PenSquare,        color: '#34d399', path: `/teacher/quizzes?offering=${offering.id}` },
    { label: 'Results',         icon: BarChart2,        color: '#f59e0b', path: `/teacher/results?offering=${offering.id}` },
  ]

  return (
    <Modal maxW={540}>
      {/* Header */}
      <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--neu-border)', display: 'flex', alignItems: 'center', gap: '.85rem' }}>
        <div style={{ width: 50, height: 50, borderRadius: '1rem', background: pal.bg, border: `1px solid ${pal.ring}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <BookOpen size={22} style={{ color: pal.c }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ fontSize: '1.02rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', lineHeight: 1.25 }}>{offering.course_name}</h2>
          <div style={{ display: 'flex', gap: '.35rem', marginTop: '.3rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '.63rem', fontWeight: 800, padding: '.15rem .5rem', background: pal.bg, color: pal.c, border: `1px solid ${pal.ring}`, borderRadius: '.4rem', fontFamily: 'monospace' }}>{offering.course_code}</span>
            <span style={{ fontSize: '.63rem', fontWeight: 700, padding: '.15rem .5rem', background: 'rgba(91,138,240,.1)', color: '#5b8af0', borderRadius: '.4rem' }}>Section {offering.section}</span>
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neu-text-ghost)', padding: '.25rem', borderRadius: '.5rem' }}><X size={18} /></button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Info grid */}
        <div style={{ padding: '1rem 1.4rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem' }}>
          {[
            { label: 'Semester',     value: offering.semester_name },
            { label: 'Room Number',  value: offering.room_number || '—' },
            { label: 'Max Students', value: String(max) },
            { label: 'Enrolled',     value: `${enrolled} / ${max}` },
          ].map(r => (
            <div key={r.label} style={{ background: 'var(--neu-surface-deep)', borderRadius: '.8rem', padding: '.7rem 1rem', boxShadow: 'inset 2px 2px 5px var(--neu-shadow-dark), inset -1px -1px 4px var(--neu-shadow-light)' }}>
              <p style={{ fontSize: '.62rem', fontWeight: 700, color: 'var(--neu-text-ghost)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: '.2rem' }}>{r.label}</p>
              <p style={{ fontSize: '.85rem', color: 'var(--neu-text-primary)', fontWeight: 500 }}>{r.value}</p>
            </div>
          ))}

          {/* Capacity bar */}
          <div style={{ gridColumn: 'span 2', background: 'var(--neu-surface-deep)', borderRadius: '.8rem', padding: '.7rem 1rem', boxShadow: 'inset 2px 2px 5px var(--neu-shadow-dark), inset -1px -1px 4px var(--neu-shadow-light)' }}>
            <p style={{ fontSize: '.62rem', fontWeight: 700, color: 'var(--neu-text-ghost)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: '.5rem' }}>Capacity ({pct}%)</p>
            <div style={{ height: 7, background: 'var(--neu-border)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: fillColor, borderRadius: 99 }} />
            </div>
          </div>

          {/* Schedule */}
          {schedule.length > 0 && (
            <div style={{ gridColumn: 'span 2', background: 'var(--neu-surface-deep)', borderRadius: '.8rem', padding: '.7rem 1rem', boxShadow: 'inset 2px 2px 5px var(--neu-shadow-dark), inset -1px -1px 4px var(--neu-shadow-light)' }}>
              <p style={{ fontSize: '.62rem', fontWeight: 700, color: 'var(--neu-text-ghost)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: '.5rem' }}>Schedule</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.3rem' }}>
                {schedule.map((s, i) => (
                  <div key={i} style={{ display: 'flex', gap: '.5rem', alignItems: 'center', fontSize: '.8rem', color: 'var(--neu-text-secondary)' }}>
                    <span style={{ textTransform: 'capitalize', fontWeight: 600, color: pal.c, minWidth: 80 }}>{s.day}</span>
                    <span>{fmt12(s.start_time)} – {fmt12(s.end_time)}</span>
                    {s.room && <span style={{ color: 'var(--neu-text-ghost)' }}>• {s.room}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Enrolled students list */}
          <div style={{ gridColumn: 'span 2', background: 'var(--neu-surface-deep)', borderRadius: '.8rem', padding: '.7rem 1rem', boxShadow: 'inset 2px 2px 5px var(--neu-shadow-dark), inset -1px -1px 4px var(--neu-shadow-light)' }}>
            <p style={{ fontSize: '.62rem', fontWeight: 700, color: 'var(--neu-text-ghost)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: '.5rem' }}>
              Enrolled Students ({students.length})
            </p>
            {loadingStudents ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.5rem 0', color: 'var(--neu-text-ghost)', fontSize: '.78rem' }}>
                <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Loading…
              </div>
            ) : students.length === 0 ? (
              <p style={{ fontSize: '.78rem', color: 'var(--neu-text-ghost)' }}>No students enrolled yet</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.3rem', maxHeight: 160, overflowY: 'auto' }}>
                {students.map((s, i) => (
                  <div key={s.student_id || i} style={{ display: 'flex', alignItems: 'center', gap: '.6rem', padding: '.35rem .6rem', background: 'var(--neu-surface)', borderRadius: '.6rem' }}>
                    <div style={{ width: 26, height: 26, borderRadius: '.5rem', background: `${pal.c}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <User size={12} style={{ color: pal.c }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '.78rem', fontWeight: 600, color: 'var(--neu-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.full_name}</p>
                      <p style={{ fontSize: '.65rem', color: 'var(--neu-text-ghost)' }}>{s.roll_number}</p>
                    </div>
                    <span style={{ fontSize: '.6rem', fontWeight: 700, padding: '.1rem .4rem', borderRadius: '.3rem', background: s.status === 'enrolled' ? 'rgba(34,160,107,.12)' : 'rgba(245,158,11,.1)', color: s.status === 'enrolled' ? '#22a06b' : '#f59e0b' }}>
                      {s.status || 'enrolled'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick action buttons */}
        <div style={{ padding: '0 1.4rem 1.2rem' }}>
          <p style={{ fontSize: '.62rem', fontWeight: 700, color: 'var(--neu-text-ghost)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: '.6rem' }}>Quick Actions</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem' }}>
            {actions.map(({ label, icon: Icon, color, path }) => (
              <button key={label} onClick={() => { onClose(); onNavigate(path) }}
                style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.6rem .85rem', borderRadius: '.75rem', border: `1px solid ${color}30`, background: `${color}0f`, color, fontSize: '.78rem', fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", transition: 'background .15s' }}
                onMouseEnter={e => e.currentTarget.style.background = `${color}1c`}
                onMouseLeave={e => e.currentTarget.style.background = `${color}0f`}
              >
                <Icon size={13} /> {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: '.9rem 1.4rem', borderTop: '1px solid var(--neu-border)' }}>
        <button onClick={onClose} style={{ ...iS, cursor: 'pointer', textAlign: 'center', fontWeight: 600, color: 'var(--neu-text-secondary)', padding: '.6rem' }}>Close</button>
      </div>
    </Modal>
  )
}

/* ─── Skeleton Card ──────────────────────────────── */
function SkeletonCard() {
  return (
    <div style={{ background: 'var(--neu-surface)', border: '1px solid var(--neu-border)', borderRadius: '1.25rem', overflow: 'hidden', boxShadow: '6px 6px 16px var(--neu-shadow-dark)' }}>
      <div style={{ height: 4, background: 'var(--neu-surface-deep)' }} />
      <div style={{ padding: '1.2rem 1.35rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: '.875rem', background: 'var(--neu-surface-deep)', animation: 'pulse 1.5s infinite' }} />
          <div style={{ width: 52, height: 22, borderRadius: '.4rem', background: 'var(--neu-surface-deep)', animation: 'pulse 1.5s infinite' }} />
        </div>
        <div style={{ height: 12, background: 'var(--neu-surface-deep)', borderRadius: 6, width: '65%', marginBottom: '.5rem', animation: 'pulse 1.5s infinite' }} />
        <div style={{ height: 10, background: 'var(--neu-surface-deep)', borderRadius: 6, width: '45%', marginBottom: '1rem', animation: 'pulse 1.5s infinite' }} />
        <div style={{ height: 6, background: 'var(--neu-surface-deep)', borderRadius: 99, animation: 'pulse 1.5s infinite' }} />
      </div>
    </div>
  )
}

/* ─── Course Card ────────────────────────────────── */
function CourseCard({ offering, pal, onClick }) {
  const enrolled = offering.enrolled_count || offering.enrolled_students || 0
  const max = offering.max_students || 0
  const pct = max ? Math.round((enrolled / max) * 100) : 0
  const fillColor = pct >= 90 ? '#ef4444' : pct >= 70 ? '#f97316' : '#22a06b'
  const schedule = offering.schedule_json || offering.schedule || []
  const firstSlot = schedule[0]

  return (
    <div className="course-card" onClick={onClick}>
      {/* Accent stripe top */}
      <div style={{ height: 4, background: pal.c, width: '100%' }} />

      {/* Hover ring */}
      <div className="card-ring" style={{ boxShadow: `inset 0 0 0 1.5px ${pal.ring}` }} />

      <div style={{ padding: '1.2rem 1.35rem 1.35rem' }}>
        {/* Top: icon + section badge */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: '.875rem', background: pal.bg, border: `1px solid ${pal.ring}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <BookOpen size={20} style={{ color: pal.c }} />
          </div>
          <span style={{ fontSize: '.65rem', fontWeight: 800, padding: '.2rem .6rem', background: 'rgba(91,138,240,.1)', color: '#5b8af0', border: '1px solid rgba(91,138,240,.25)', borderRadius: '.45rem', letterSpacing: '.03em' }}>
            SEC {offering.section}
          </span>
        </div>

        {/* Course code badge */}
        <div style={{ marginBottom: '.4rem' }}>
          <span style={{ fontSize: '.62rem', fontWeight: 800, fontFamily: 'monospace', padding: '.15rem .55rem', background: pal.bg, color: pal.c, border: `1px solid ${pal.ring}`, borderRadius: '.4rem' }}>
            {offering.course_code}
          </span>
        </div>

        {/* Course name */}
        <p style={{ fontSize: '.95rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', lineHeight: 1.3, marginBottom: '.3rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '2.5rem' }}>
          {offering.course_name}
        </p>

        {/* Semester */}
        <p style={{ fontSize: '.75rem', color: 'var(--neu-text-ghost)', marginBottom: '.85rem', display: 'flex', alignItems: 'center', gap: '.3rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <Calendar size={11} style={{ flexShrink: 0 }} />
          {offering.semester_name || '—'}
        </p>

        {/* Capacity bar */}
        <div style={{ marginBottom: '.8rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.3rem' }}>
            <span style={{ fontSize: '.65rem', color: 'var(--neu-text-ghost)', fontWeight: 600 }}>Students</span>
            <span style={{ fontSize: '.65rem', fontWeight: 700, color: fillColor }}>{enrolled}/{max}</span>
          </div>
          <div style={{ height: 5, background: 'var(--neu-border)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: fillColor, borderRadius: 99, transition: 'width .4s ease' }} />
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '.75rem', borderTop: '1px solid var(--neu-border)', flexWrap: 'wrap', gap: '.3rem' }}>
          {firstSlot && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '.3rem', fontSize: '.68rem', color: 'var(--neu-text-ghost)' }}>
              <Clock size={10} />
              <span style={{ textTransform: 'capitalize' }}>{firstSlot.day?.slice(0, 3)} {fmt12(firstSlot.start_time)}</span>
            </div>
          )}
          {offering.room_number && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '.3rem', fontSize: '.68rem', color: 'var(--neu-text-ghost)' }}>
              <MapPin size={10} />
              <span>{offering.room_number}</span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '.3rem', fontSize: '.68rem', color: 'var(--neu-text-ghost)' }}>
            <Users size={10} />
            <span>{enrolled} enrolled</span>
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
  const [offerings, setOfferings] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [viewTarget, setViewTarget] = useState(null)
  const navigate = useNavigate()
  const { menu, open: openMenu, close: closeMenu } = useContextMenu()

  useEffect(() => {
    teacherAPI.getMyOfferings()
      .then(r => setOfferings(r.data.data?.offerings || []))
      .catch(() => toast.error('Failed to load courses'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    if (!search.trim()) return offerings
    const q = search.toLowerCase()
    return offerings.filter(o =>
      o.course_name?.toLowerCase().includes(q) ||
      o.course_code?.toLowerCase().includes(q) ||
      o.semester_name?.toLowerCase().includes(q) ||
      o.section?.toLowerCase().includes(q)
    )
  }, [offerings, search])

  const totalStudents = offerings.reduce((s, o) => s + (o.enrolled_count || o.enrolled_students || 0), 0)

  const ctxItems = (pal) => [
    { label: 'View Details',    icon: Eye,          onClick: (o) => setViewTarget({ offering: o, pal }) },
    { label: 'Mark Attendance', icon: ClipboardCheck, onClick: (o) => navigate(`/teacher/attendance?offering=${o.id}`) },
    { label: 'Assignments',     icon: FileText,      onClick: (o) => navigate(`/teacher/assignments?offering=${o.id}`) },
    { label: 'Quizzes',         icon: PenSquare,      onClick: (o) => navigate(`/teacher/quizzes?offering=${o.id}`) },
    { label: 'Results',         icon: BarChart2,      onClick: (o) => navigate(`/teacher/results?offering=${o.id}`) },
  ]

  return (
    <>
      <style>{CSS}</style>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.3rem', paddingBottom: '2rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '.75rem' }}>
          <div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', letterSpacing: '-.02em' }}>
              My Courses
            </h1>
            <p style={{ fontSize: '.78rem', color: 'var(--neu-text-ghost)', marginTop: 2 }}>
              {offerings.length} course{offerings.length !== 1 ? 's' : ''} · {totalStudents} total students
            </p>
          </div>

          {/* KPI pill */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '.5rem',
            padding: '.55rem 1rem',
            background: 'var(--neu-surface)',
            boxShadow: 'var(--neu-raised)',
            border: '1px solid var(--neu-border)',
            borderRadius: '.875rem',
          }}>
            <GraduationCap size={15} style={{ color: '#5b8af0' }} />
            <span style={{ fontSize: '.8rem', fontWeight: 700, color: 'var(--neu-text-primary)' }}>
              {totalStudents} students
            </span>
          </div>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', maxWidth: 360 }}>
          <Search size={14} style={{ position: 'absolute', left: '.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--neu-text-ghost)', pointerEvents: 'none' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by course, code, section…"
            style={{ ...iS, paddingLeft: '2.25rem' }}
          />
        </div>

        {/* Cards grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(270px,1fr))', gap: '1rem' }}>
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ background: 'var(--neu-surface)', border: '1px solid var(--neu-border)', borderRadius: '1.25rem', padding: '4rem 2rem', textAlign: 'center', boxShadow: '6px 6px 16px var(--neu-shadow-dark)' }}>
            <BookOpen size={38} style={{ color: 'var(--neu-text-ghost)', margin: '0 auto .8rem', opacity: .25, display: 'block' }} />
            <p style={{ fontWeight: 600, color: 'var(--neu-text-secondary)', fontSize: '.9rem' }}>
              {search ? 'No courses match your search' : 'No courses assigned yet'}
            </p>
            <p style={{ fontSize: '.78rem', color: 'var(--neu-text-ghost)', marginTop: '.35rem' }}>
              {search ? 'Try a different keyword' : 'Contact admin to get courses assigned'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(270px,1fr))', gap: '1rem' }}>
            {filtered.map((o, i) => {
              const pal = PALETTE[i % PALETTE.length]
              return (
                <CourseCard
                  key={o.id}
                  offering={o}
                  pal={pal}
                  onClick={e => openMenu(e, o)}
                />
              )
            })}
          </div>
        )}

        {/* Context menu */}
        <ContextMenu
          menu={menu}
          close={closeMenu}
          items={menu ? ctxItems(PALETTE[filtered.findIndex(o => o.id === menu.row?.id) % PALETTE.length]) : []}
        />

        {/* View Details Modal */}
        {viewTarget && (
          <ViewModal
            offering={viewTarget.offering}
            pal={viewTarget.pal}
            onClose={() => setViewTarget(null)}
            onNavigate={navigate}
          />
        )}
      </div>
    </>
  )
}