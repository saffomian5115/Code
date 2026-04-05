// ═══════════════════════════════════════════════════════════════
//  AttendancePage.jsx  (Student)  —  Neumorphic | Fixed & Rebuilt
//  → frontend/src/pages/student/AttendancePage.jsx
//
//  Fixes:
//  • user_id resolved correctly from authStore (user.user_id || user.id)
//  • Course dropdown instead of sidebar (cleaner UX)
//  • Correct API call: getAttendance(studentId, offeringId)
//  • Real summary data rendered (percentage, total, attended)
//  • Weekly trend built from actual session records
//  • Dot grid from real session statuses
//  • Full session log table
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect } from 'react'
import {
  ClipboardCheck, Loader2, AlertTriangle,
  Calendar, BarChart3, ChevronDown,
  BookOpen, TrendingUp, TrendingDown,
  Minus, Hash, Clock,
} from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts'
import toast from 'react-hot-toast'
import { studentAPI } from '../../api/student.api'
import { authStore } from '../../store/authStore'

/* ─── theme helpers ────────────────────────────────────────── */
const neu = (extra = {}) => ({
  background: 'var(--neu-surface)',
  boxShadow: 'var(--neu-raised)',
  border: '1px solid var(--neu-border)',
  borderRadius: '1.25rem',
  ...extra,
})
const neuInset = (extra = {}) => ({
  background: 'var(--neu-surface-deep)',
  boxShadow:
    'inset 4px 4px 10px var(--neu-shadow-dark), inset -3px -3px 7px var(--neu-shadow-light)',
  border: '1px solid var(--neu-border)',
  borderRadius: '0.875rem',
  ...extra,
})

/* ─── Status colours ───────────────────────────────────────── */
const STATUS = {
  present: { color: '#3ecf8e', bg: 'rgba(62,207,142,0.14)',  label: 'Present' },
  absent:  { color: '#f26b6b', bg: 'rgba(242,107,107,0.14)', label: 'Absent'  },
  late:    { color: '#f5a623', bg: 'rgba(245,166,35,0.14)',  label: 'Late'    },
  excused: { color: '#a78bfa', bg: 'rgba(167,139,250,0.14)', label: 'Excused' },
}

const DOT_COLOR = {
  present: '#3ecf8e',
  absent:  '#f26b6b',
  late:    '#f5a623',
  excused: '#a78bfa',
}

const fmt = (d) =>
  d
    ? new Date(d).toLocaleDateString('en-PK', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '—'

/* ─── helpers ──────────────────────────────────────────────── */
function getStudentId(user) {
  // authStore may use user_id or id depending on login response
  return user?.user_id ?? user?.id ?? null
}

/* ─── Circular Ring ────────────────────────────────────────── */
function Ring({ pct = 0, color = '#5b8af0', size = 120, stroke = 11 }) {
  const r    = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const dash = Math.min(pct / 100, 1) * circ
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--neu-border)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(0.34,1.56,0.64,1)' }}
        />
      </svg>
      <div
        style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        <span style={{ fontSize: '1.55rem', fontWeight: 900, color, fontFamily: 'Outfit,sans-serif', lineHeight: 1 }}>
          {Math.round(pct)}%
        </span>
        <span style={{ fontSize: '0.6rem', color: 'var(--neu-text-ghost)', fontWeight: 600, marginTop: 3 }}>
          attendance
        </span>
      </div>
    </div>
  )
}

/* ─── KPI chip ─────────────────────────────────────────────── */
function Chip({ label, value, color, sub }) {
  return (
    <div style={{ ...neuInset({ padding: '0.9rem 1rem', borderRadius: '0.875rem' }), display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
      <p style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</p>
      <p style={{ fontSize: '1.5rem', fontWeight: 900, color: color || 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', lineHeight: 1 }}>
        {value}
      </p>
      {sub && <p style={{ fontSize: '0.65rem', color: 'var(--neu-text-ghost)', marginTop: 2 }}>{sub}</p>}
    </div>
  )
}

/* ─── Dot Grid (last 35 sessions) ─────────────────────────── */
function DotGrid({ sessions }) {
  const last = sessions.slice(-35)
  if (!last.length)
    return (
      <p style={{ fontSize: '0.78rem', color: 'var(--neu-text-ghost)', textAlign: 'center', padding: '1.25rem 0' }}>
        No sessions recorded yet
      </p>
    )
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 5 }}>
        {last.map((s, i) => {
          const c = DOT_COLOR[s.status] || 'var(--neu-border)'
          return (
            <div
              key={i}
              title={`${fmt(s.session_date)} — ${s.status}`}
              style={{
                aspectRatio: '1', borderRadius: 5,
                background: c,
                boxShadow: c !== 'var(--neu-border)'
                  ? `inset 2px 2px 4px rgba(0,0,0,0.15), 0 1px 4px ${c}55`
                  : 'inset 2px 2px 5px var(--neu-shadow-dark), inset -1px -1px 3px var(--neu-shadow-light)',
                transition: 'transform 0.12s',
                cursor: 'default',
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.4)')}
              onMouseLeave={e => (e.currentTarget.style.transform = '')}
            />
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: '0.85rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
        {Object.entries(STATUS).map(([k, v]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: v.color }} />
            <span style={{ fontSize: '0.64rem', color: 'var(--neu-text-ghost)', fontWeight: 600 }}>{v.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Area chart tooltip ───────────────────────────────────── */
function AreaTip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ ...neu({ padding: '0.4rem 0.75rem', borderRadius: '0.65rem' }), fontSize: '0.73rem', color: 'var(--neu-text-primary)' }}>
      <b>{label}</b>: {Math.round(payload[0]?.value)}%
    </div>
  )
}

/* ─── Build weekly trend from sessions ─────────────────────── */
function buildTrend(sessions) {
  if (sessions.length < 2) return []
  const map = {}
  sessions.forEach(s => {
    if (!s.session_date) return
    const d  = new Date(s.session_date)
    const wk = `W${Math.ceil(d.getDate() / 7)} (${d.toLocaleString('default', { month: 'short' })})`
    if (!map[wk]) map[wk] = { t: 0, p: 0 }
    map[wk].t++
    if (s.status === 'present' || s.status === 'late') map[wk].p++
  })
  return Object.entries(map).map(([week, v]) => ({
    week,
    pct: v.t > 0 ? Math.round((v.p / v.t) * 100) : 0,
  }))
}

/* ─── Count status breakdown ───────────────────────────────── */
function countStatuses(sessions) {
  const out = { present: 0, absent: 0, late: 0, excused: 0 }
  sessions.forEach(s => { if (out[s.status] !== undefined) out[s.status]++ })
  return out
}

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════ */
export default function AttendancePage() {
  const user      = authStore.getUser()
  const studentId = getStudentId(user)   // works with user_id OR id

  const [enrollments,  setEnrollments]  = useState([])
  const [selectedEnr,  setSelectedEnr]  = useState(null)
  const [sessions,     setSessions]     = useState([])
  const [summary,      setSummary]      = useState(null)
  const [enrLoading,   setEnrLoading]   = useState(true)
  const [sessLoading,  setSessLoading]  = useState(false)
  const [dropOpen,     setDropOpen]     = useState(false)

  /* ── load approved enrollments ─────────────────────────── */
  useEffect(() => {
    studentAPI
      .getEnrollments()
      .then(r => {
        const all = r.data.data?.enrollments || []
        const approved = all.filter(e => e.is_approved)
        setEnrollments(approved)
        if (approved.length) setSelectedEnr(approved[0])
      })
      .catch(() => toast.error('Failed to load enrollments'))
      .finally(() => setEnrLoading(false))
  }, [])

  /* ── load attendance when course changes ───────────────── */
  useEffect(() => {
    if (!selectedEnr || !studentId) return
    setSessLoading(true)
    setSessions([])
    setSummary(null)

    studentAPI
      .getAttendance(studentId, selectedEnr.offering_id)
      .then(r => {
        const d = r.data?.data || {}
        setSessions(d.records || [])
        setSummary(d.summary || null)
      })
      .catch(err => {
        console.error('Attendance fetch error:', err)
        toast.error('Failed to load attendance data')
      })
      .finally(() => setSessLoading(false))
  }, [selectedEnr, studentId])

  /* ── close dropdown on outside click ──────────────────── */
  useEffect(() => {
    if (!dropOpen) return
    const close = () => setDropOpen(false)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [dropOpen])

  /* ── derived values ────────────────────────────────────── */
  const pct       = parseFloat(summary?.percentage       || 0)
  const attended  = summary?.attended_classes            || 0
  const total     = summary?.total_classes               || 0
  const absent    = total - attended
  const isShort   = pct > 0 && pct < 75
  const needMore  = isShort ? Math.max(0, Math.ceil(total * 0.75 - attended)) : 0
  const minReq    = parseFloat(summary?.min_required     || 75)
  const pctColor  = pct >= 75 ? '#3ecf8e' : pct >= 60 ? '#f5a623' : '#f26b6b'
  const trendData = buildTrend(sessions)
  const counts    = countStatuses(sessions)

  const TrendIcon = pct >= 75
    ? TrendingUp
    : pct > 0
    ? TrendingDown
    : Minus

  /* ── course label ──────────────────────────────────────── */
  const courseLabel = selectedEnr
    ? `${selectedEnr.course_name}${selectedEnr.course_code ? ' (' + selectedEnr.course_code + ')' : ''}`
    : 'Select a course'

  /* ═══════════ RENDER ═══════════ */
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', paddingBottom: '2rem' }}>
      <style>{`
        @keyframes spin    { to { transform: rotate(360deg) } }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        @keyframes pulse   { 0%,100%{opacity:.4} 50%{opacity:.9} }
        @keyframes slideDown {
          from { opacity:0; transform:translateY(-8px) }
          to   { opacity:1; transform:translateY(0) }
        }
        .sess-row:hover { background: var(--neu-surface-deep) !important; }
        .scroll-x::-webkit-scrollbar { height: 4px }
        .scroll-x::-webkit-scrollbar-thumb { background: var(--neu-border); border-radius: 4px }
      `}</style>

      {/* ── PAGE HEADER ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div style={{ ...neuInset({ width: 44, height: 44, borderRadius: '0.875rem' }), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3ecf8e' }}>
          <ClipboardCheck size={20} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.55rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif' }}>
            Attendance
          </h1>
          <p style={{ fontSize: '0.76rem', color: 'var(--neu-text-ghost)' }}>
            Track your lecture attendance per course
          </p>
        </div>
      </div>

      {enrLoading ? (
        /* ── skeleton ── */
        <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>
          <Loader2 size={30} style={{ color: '#3ecf8e', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : enrollments.length === 0 ? (
        /* ── empty state ── */
        <div style={{ ...neu({ padding: '4rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.85rem' }) }}>
          <div style={{ ...neuInset({ width: 60, height: 60, borderRadius: '1.1rem' }), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3ecf8e' }}>
            <ClipboardCheck size={26} />
          </div>
          <p style={{ fontWeight: 700, color: 'var(--neu-text-secondary)', fontSize: '1rem' }}>
            No active enrollments
          </p>
          <p style={{ fontSize: '0.78rem', color: 'var(--neu-text-ghost)' }}>
            Enroll in courses to see your attendance
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem', animation: 'fadeUp 0.25s ease both' }}>

          {/* ── COURSE DROPDOWN ── */}
          <div style={{ position: 'relative', zIndex: 20 }}>
            <button
              onClick={e => { e.stopPropagation(); setDropOpen(p => !p) }}
              style={{
                ...neu({ padding: '0.85rem 1.1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', border: 'none', width: '100%', textAlign: 'left' }),
                transition: 'box-shadow 0.18s',
              }}
            >
              {/* Course icon */}
              <div style={{ ...neuInset({ width: 38, height: 38, borderRadius: '0.75rem', flexShrink: 0 }), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3ecf8e' }}>
                <BookOpen size={16} />
              </div>

              <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                <p style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.1rem' }}>
                  Selected Course
                </p>
                <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--neu-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {courseLabel}
                </p>
              </div>

              {selectedEnr && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                  {selectedEnr.instructor && (
                    <span style={{ fontSize: '0.7rem', color: 'var(--neu-text-ghost)', display: 'none' }}>
                      {selectedEnr.instructor}
                    </span>
                  )}
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: '0.45rem', background: 'rgba(62,207,142,0.12)', color: '#3ecf8e' }}>
                    {enrollments.length} courses
                  </span>
                </div>
              )}

              <ChevronDown
                size={18}
                style={{ color: 'var(--neu-text-muted)', flexShrink: 0, transition: 'transform 0.2s', transform: dropOpen ? 'rotate(180deg)' : '' }}
              />
            </button>

            {/* Dropdown menu */}
            {dropOpen && (
              <div
                onClick={e => e.stopPropagation()}
                style={{
                  position: 'absolute', top: 'calc(100% + 0.5rem)', left: 0, right: 0,
                  ...neu({ padding: '0.4rem', borderRadius: '1rem' }),
                  boxShadow: '12px 12px 28px var(--neu-shadow-dark), -6px -6px 16px var(--neu-shadow-light)',
                  zIndex: 100, animation: 'slideDown 0.18s ease both',
                  maxHeight: 300, overflowY: 'auto',
                }}
              >
                {enrollments.map((enr, idx) => {
                  const active = selectedEnr?.offering_id === enr.offering_id
                  return (
                    <button
                      key={enr.offering_id}
                      onClick={() => { setSelectedEnr(enr); setDropOpen(false) }}
                      style={{
                        width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer',
                        padding: '0.7rem 0.9rem', borderRadius: '0.75rem',
                        fontFamily: "'DM Sans',sans-serif",
                        background: active ? 'rgba(62,207,142,0.1)' : 'transparent',
                        display: 'flex', alignItems: 'center', gap: '0.65rem',
                        transition: 'background 0.15s',
                        color: active ? '#3ecf8e' : 'var(--neu-text-secondary)',
                      }}
                      onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--neu-surface-deep)' }}
                      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
                    >
                      <div style={{ width: 32, height: 32, borderRadius: '0.6rem', background: active ? 'rgba(62,207,142,0.15)' : 'var(--neu-surface-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem', fontWeight: 800, color: active ? '#3ecf8e' : 'var(--neu-text-ghost)', fontFamily: 'Outfit,sans-serif', flexShrink: 0 }}>
                        {(enr.course_code || '??').slice(0, 2).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '0.82rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {enr.course_name}
                        </p>
                        <p style={{ fontSize: '0.64rem', color: 'var(--neu-text-ghost)', marginTop: '0.1rem' }}>
                          {enr.course_code}{enr.instructor ? ' · ' + enr.instructor : ''}
                        </p>
                      </div>
                      {active && (
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3ecf8e', flexShrink: 0, boxShadow: '0 0 6px #3ecf8e88' }} />
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* ── ATTENDANCE CONTENT ── */}
          {sessLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
              <Loader2 size={28} style={{ color: '#3ecf8e', animation: 'spin 0.8s linear infinite' }} />
            </div>
          ) : !summary && sessions.length === 0 ? (
            <div style={{ ...neu({ padding: '3.5rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }) }}>
              <div style={{ ...neuInset({ width: 54, height: 54, borderRadius: '1rem' }), display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--neu-text-ghost)' }}>
                <Calendar size={22} />
              </div>
              <p style={{ fontWeight: 700, color: 'var(--neu-text-secondary)', fontSize: '0.9rem' }}>
                No attendance data yet
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--neu-text-ghost)' }}>
                Sessions will appear once your teacher marks attendance
              </p>
            </div>
          ) : (
            <>
              {/* ── ROW 1: Ring + KPI chips ── */}
              <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr 1fr 1fr', gap: '0.85rem', alignItems: 'stretch' }}>

                {/* Ring card */}
                <div style={{ ...neu({ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }) }}>
                  <Ring pct={pct} color={pctColor} size={120} stroke={11} />
                </div>

                <Chip
                  label="Attended"
                  value={attended}
                  color="#3ecf8e"
                  sub={`out of ${total} sessions`}
                />
                <Chip
                  label="Absent"
                  value={absent}
                  color={absent > 0 ? '#f26b6b' : 'var(--neu-text-ghost)'}
                  sub={counts.excused > 0 ? `${counts.excused} excused` : undefined}
                />
                <Chip
                  label="Late"
                  value={counts.late}
                  color={counts.late > 0 ? '#f5a623' : 'var(--neu-text-ghost)'}
                />
                <Chip
                  label={needMore > 0 ? 'Need More' : 'Status'}
                  value={needMore > 0 ? `${needMore} more` : '✓ Good'}
                  color={needMore > 0 ? '#f59e0b' : '#3ecf8e'}
                  sub={`Min required: ${minReq}%`}
                />
              </div>

              {/* ── SHORT ATTENDANCE WARNING ── */}
              {isShort && (
                <div style={{
                  ...neu({
                    padding: '0.9rem 1.1rem',
                    borderRadius: '0.875rem',
                    border: '1px solid rgba(242,107,107,0.3)',
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                  }),
                }}>
                  <div style={{ ...neuInset({ width: 38, height: 38, borderRadius: '0.75rem' }), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f26b6b', flexShrink: 0 }}>
                    <AlertTriangle size={16} />
                  </div>
                  <div>
                    <p style={{ fontSize: '0.85rem', fontWeight: 800, color: '#f26b6b' }}>
                      Short Attendance Warning
                    </p>
                    <p style={{ fontSize: '0.73rem', color: 'var(--neu-text-ghost)', marginTop: '0.1rem' }}>
                      Your attendance is {pct.toFixed(1)}% — you need at least {minReq}%.
                      Attend {needMore} more class{needMore !== 1 ? 'es' : ''} to meet the requirement.
                    </p>
                  </div>
                </div>
              )}

              {/* ── ROW 2: Dot grid + Trend chart ── */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.9rem' }}>

                {/* Dot grid */}
                <div style={{ ...neu({ padding: '1.25rem' }) }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <Calendar size={14} style={{ color: '#3ecf8e' }} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif' }}>
                      Session Grid
                    </span>
                    <span style={{ marginLeft: 'auto', fontSize: '0.65rem', color: 'var(--neu-text-ghost)' }}>
                      Last 35 sessions
                    </span>
                  </div>
                  <DotGrid sessions={sessions} />
                </div>

                {/* Trend chart */}
                <div style={{ ...neu({ padding: '1.25rem' }) }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <BarChart3 size={14} style={{ color: '#5b8af0' }} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif' }}>
                      Weekly Trend
                    </span>
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <TrendIcon size={13} style={{ color: pctColor }} />
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, color: pctColor }}>
                        {pct >= 75 ? 'On track' : 'Needs attention'}
                      </span>
                    </div>
                  </div>

                  {trendData.length > 1 ? (
                    <ResponsiveContainer width="100%" height={150}>
                      <AreaChart data={trendData} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
                        <defs>
                          <linearGradient id="attGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor={pctColor} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={pctColor} stopOpacity={0}   />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--neu-border)" vertical={false} />
                        <XAxis
                          dataKey="week"
                          tick={{ fill: 'var(--neu-text-ghost)', fontSize: 9, fontFamily: "'DM Sans'" }}
                          axisLine={false} tickLine={false}
                        />
                        <YAxis
                          domain={[0, 100]}
                          tick={{ fill: 'var(--neu-text-ghost)', fontSize: 9 }}
                          axisLine={false} tickLine={false}
                        />
                        <Tooltip content={<AreaTip />} />
                        <Area
                          type="monotone" dataKey="pct"
                          stroke={pctColor} strokeWidth={2.5}
                          fill="url(#attGrad)"
                          dot={{ fill: pctColor, r: 3 }}
                          activeDot={{ r: 5 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <p style={{ fontSize: '0.78rem', color: 'var(--neu-text-ghost)', textAlign: 'center' }}>
                        Not enough data yet.<br />Attend more sessions to see your trend.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* ── STATUS BREAKDOWN ── */}
              <div style={{ ...neu({ padding: '1.25rem' }) }}>
                <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', marginBottom: '0.9rem' }}>
                  Status Breakdown
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.65rem' }}>
                  {Object.entries(STATUS).map(([key, cfg]) => {
                    const count = counts[key] || 0
                    const barW  = total > 0 ? Math.round((count / total) * 100) : 0
                    return (
                      <div key={key} style={{ ...neuInset({ padding: '0.8rem 0.9rem', borderRadius: '0.875rem', borderLeft: `3px solid ${cfg.color}` }) }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: cfg.color, textTransform: 'capitalize' }}>{cfg.label}</span>
                          <span style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif' }}>{count}</span>
                        </div>
                        <div style={{ height: 5, borderRadius: '9999px', background: 'var(--neu-border)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${barW}%`, background: cfg.color, borderRadius: '9999px', transition: 'width 0.7s ease' }} />
                        </div>
                        <p style={{ fontSize: '0.62rem', color: 'var(--neu-text-ghost)', marginTop: '0.25rem' }}>{barW}% of total</p>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* ── SESSION LOG TABLE ── */}
              <div style={{ ...neu({ padding: 0, overflow: 'hidden' }) }}>
                {/* Table header */}
                <div style={{ padding: '0.9rem 1.25rem', borderBottom: '1px solid var(--neu-border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Hash size={15} style={{ color: '#5b8af0' }} />
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif' }}>
                    Session Log
                  </span>
                  <span style={{ marginLeft: 'auto', fontSize: '0.68rem', fontWeight: 600, color: 'var(--neu-text-ghost)' }}>
                    {sessions.length} sessions
                  </span>
                </div>

                <div className="scroll-x" style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
                    <thead>
                      <tr style={{ background: 'var(--neu-surface-deep)' }}>
                        {['#', 'Date', 'Topic', 'Type', 'Status', 'Remarks'].map(h => (
                          <th key={h} style={{
                            textAlign: 'left', padding: '0.6rem 1rem',
                            fontSize: '0.63rem', fontWeight: 800,
                            color: 'var(--neu-text-ghost)',
                            textTransform: 'uppercase', letterSpacing: '0.07em',
                            borderBottom: '1px solid var(--neu-border)',
                            whiteSpace: 'nowrap',
                          }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sessions.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', fontSize: '0.82rem', color: 'var(--neu-text-ghost)' }}>
                            No session records found
                          </td>
                        </tr>
                      ) : (
                        /* Show newest first */
                        [...sessions].reverse().map((s, i) => {
                          const cfg = STATUS[s.status] || { color: 'var(--neu-text-ghost)', bg: 'var(--neu-surface-deep)', label: s.status || '—' }
                          return (
                            <tr
                              key={i}
                              className="sess-row"
                              style={{ transition: 'background 0.12s' }}
                            >
                              <td style={{ padding: '0.65rem 1rem', fontSize: '0.68rem', color: 'var(--neu-text-ghost)', borderBottom: '1px solid var(--neu-border)', fontFamily: 'monospace' }}>
                                {sessions.length - i}
                              </td>
                              <td style={{ padding: '0.65rem 1rem', fontSize: '0.82rem', fontWeight: 600, color: 'var(--neu-text-primary)', borderBottom: '1px solid var(--neu-border)', whiteSpace: 'nowrap' }}>
                                {fmt(s.session_date)}
                              </td>
                              <td style={{ padding: '0.65rem 1rem', fontSize: '0.8rem', color: 'var(--neu-text-secondary)', borderBottom: '1px solid var(--neu-border)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {s.topic || <span style={{ color: 'var(--neu-text-ghost)', fontStyle: 'italic' }}>No topic</span>}
                              </td>
                              <td style={{ padding: '0.65rem 1rem', borderBottom: '1px solid var(--neu-border)' }}>
                                <span style={{ ...neuInset({ display: 'inline-block', padding: '0.18rem 0.55rem', borderRadius: '0.4rem' }), fontSize: '0.66rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'capitalize' }}>
                                  {s.session_type || 'lecture'}
                                </span>
                              </td>
                              <td style={{ padding: '0.65rem 1rem', borderBottom: '1px solid var(--neu-border)' }}>
                                <span style={{
                                  display: 'inline-flex', alignItems: 'center', gap: '0.28rem',
                                  background: cfg.bg, color: cfg.color,
                                  fontSize: '0.7rem', fontWeight: 700,
                                  padding: '0.22rem 0.6rem', borderRadius: '0.45rem',
                                }}>
                                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
                                  {cfg.label}
                                </span>
                              </td>
                              <td style={{ padding: '0.65rem 1rem', fontSize: '0.74rem', color: 'var(--neu-text-ghost)', borderBottom: '1px solid var(--neu-border)' }}>
                                {s.remarks || '—'}
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </>
          )}
        </div>
      )}
    </div>
  )
}