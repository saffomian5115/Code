// ═══════════════════════════════════════════════════════════════
//  StudentDashboard.jsx  —  Complete Neumorphic Dashboard
//  → frontend/src/pages/student/StudentDashboard.jsx
//
//  APIs used:
//  • GET /students/me/enrollments
//  • GET /students/me/analytics
//  • GET /announcements?page=1&per_page=4
//  • GET /students/me/vouchers
//  • GET /students/{id}/attendance?offering_id=X  (first approved course)
//  • GET /offerings/{id}/assignments              (first approved course)
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BookOpen, ClipboardCheck, FileText, CreditCard,
  Bell, TrendingUp, TrendingDown, Minus, ChevronRight,
  Loader2, AlertTriangle, CheckCircle2, Clock, Award,
  Sparkles, BarChart3,
} from 'lucide-react'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  Tooltip, CartesianGrid, PieChart, Pie, Cell,
} from 'recharts'
import toast from 'react-hot-toast'
import { studentAPI } from '../../api/student.api'
import { authStore } from '../../store/authStore'

const BASE_URL = 'http://127.0.0.1:8000'

/* ─── Theme helpers ─────────────────────────────────────────── */
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

/* ─── Course accent colors ──────────────────────────────────── */
const COURSE_COLORS = [
  '#5b8af0', '#a78bfa', '#3ecf8e', '#f59e0b',
  '#f87171', '#38bdf8', '#fb923c', '#e879f9',
]
const cc = (i) => COURSE_COLORS[i % COURSE_COLORS.length]

/* ─── Attendance dot colors ─────────────────────────────────── */
const ATTN_COLOR = {
  present: '#3ecf8e',
  absent:  '#f26b6b',
  late:    '#f59e0b',
  excused: '#a78bfa',
}

/* ─── Priority badge config ─────────────────────────────────── */
const PRIORITY_BADGE = {
  urgent: { bg: 'rgba(239,68,68,0.1)',   color: '#ef4444' },
  high:   { bg: 'rgba(249,115,22,0.1)',  color: '#f97316' },
  normal: { bg: 'rgba(91,138,240,0.1)',  color: '#5b8af0' },
  low:    { bg: 'rgba(148,163,184,0.1)', color: '#94a3b8' },
}

/* ─── Helpers ───────────────────────────────────────────────── */
function timeAgo(d) {
  if (!d) return ''
  const s = Math.floor((Date.now() - new Date(d)) / 1000)
  if (s < 60)    return `${s}s ago`
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

function getStudentId(user) {
  return user?.user_id ?? user?.id ?? null
}

/* ─── Section Header ────────────────────────────────────────── */
function SectionHeader({ title, sub, Icon, color, to }) {
  const nav = useNavigate()
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.65rem',
        marginBottom: '1rem',
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: '0.75rem',
          ...neuInset({ borderRadius: '0.75rem' }),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color,
          flexShrink: 0,
        }}
      >
        <Icon size={16} />
      </div>
      <div style={{ flex: 1 }}>
        <p
          style={{
            fontSize: '0.9rem',
            fontWeight: 800,
            color: 'var(--neu-text-primary)',
            fontFamily: 'Outfit, sans-serif',
          }}
        >
          {title}
        </p>
        {sub && (
          <p style={{ fontSize: '0.7rem', color: 'var(--neu-text-ghost)' }}>
            {sub}
          </p>
        )}
      </div>
      {to && (
        <button
          onClick={() => nav(to)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            padding: '0.3rem 0.7rem',
            borderRadius: '0.6rem',
            border: 'none',
            background: `${color}15`,
            color,
            fontSize: '0.72rem',
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
            transition: 'transform 0.12s',
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.transform = 'translateX(2px)')
          }
          onMouseLeave={(e) => (e.currentTarget.style.transform = '')}
        >
          View all <ChevronRight size={11} />
        </button>
      )}
    </div>
  )
}

/* ─── Circular Progress Ring ────────────────────────────────── */
function Ring({ pct = 0, color = '#5b8af0', size = 80, stroke = 7, label, sub }) {
  const r    = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const dash = (Math.min(pct, 100) / 100) * circ
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.35rem',
      }}
    >
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--neu-border)"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(0.34,1.56,0.64,1)' }}
          />
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              fontSize: '1rem',
              fontWeight: 800,
              color: 'var(--neu-text-primary)',
              fontFamily: 'Outfit, sans-serif',
              lineHeight: 1,
            }}
          >
            {Math.round(pct)}%
          </span>
        </div>
      </div>
      {label && (
        <p
          style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            color: 'var(--neu-text-secondary)',
            textAlign: 'center',
          }}
        >
          {label}
        </p>
      )}
      {sub && (
        <p
          style={{
            fontSize: '0.65rem',
            color: 'var(--neu-text-ghost)',
            textAlign: 'center',
          }}
        >
          {sub}
        </p>
      )}
    </div>
  )
}

/* ─── KPI Card ──────────────────────────────────────────────── */
function KpiCard({ label, value, icon: Icon, color, sub, onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        ...neu({
          padding: '1.1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.55rem',
          cursor: onClick ? 'pointer' : 'default',
        }),
        transition: 'transform 0.2s, box-shadow 0.2s',
        transform: hov ? 'translateY(-3px)' : '',
        boxShadow: hov
          ? '12px 12px 26px var(--neu-shadow-dark), -8px -8px 16px var(--neu-shadow-light)'
          : 'var(--neu-raised)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: '0.875rem',
            ...neuInset({ borderRadius: '0.875rem' }),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color,
          }}
        >
          <Icon size={17} />
        </div>
        {sub !== undefined && (
          <span
            style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              padding: '0.2rem 0.55rem',
              background: `${color}15`,
              color,
              borderRadius: '0.5rem',
            }}
          >
            {sub}
          </span>
        )}
      </div>
      <div>
        <p
          style={{
            fontSize: '1.5rem',
            fontWeight: 900,
            color: 'var(--neu-text-primary)',
            fontFamily: 'Outfit, sans-serif',
            lineHeight: 1,
          }}
        >
          {value}
        </p>
        <p
          style={{
            fontSize: '0.72rem',
            color: 'var(--neu-text-ghost)',
            marginTop: '0.2rem',
          }}
        >
          {label}
        </p>
      </div>
    </div>
  )
}

/* ─── Attendance Dot Grid ───────────────────────────────────── */
function AttendanceDots({ records }) {
  if (!records.length)
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '1.5rem',
          color: 'var(--neu-text-ghost)',
          fontSize: '0.8rem',
        }}
      >
        No attendance records yet
      </div>
    )

  const last28 = records.slice(-28)

  return (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '5px',
        }}
      >
        {last28.map((r, i) => {
          const status = r.status || 'default'
          const color  = ATTN_COLOR[status] || 'var(--neu-border)'
          return (
            <div
              key={i}
              title={`${r.session_date || ''}: ${status}`}
              style={{
                aspectRatio: '1',
                borderRadius: '4px',
                background:
                  status === 'default' ? 'var(--neu-surface-deep)' : color,
                boxShadow:
                  status !== 'default'
                    ? `inset 2px 2px 5px rgba(0,0,0,0.15), 0 1px 3px ${color}55`
                    : 'inset 2px 2px 5px var(--neu-shadow-dark), inset -1px -1px 3px var(--neu-shadow-light)',
                transition: 'transform 0.12s',
                cursor: 'default',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = 'scale(1.2)')
              }
              onMouseLeave={(e) => (e.currentTarget.style.transform = '')}
            />
          )
        })}
      </div>
      <div
        style={{
          display: 'flex',
          gap: '0.85rem',
          marginTop: '0.85rem',
          flexWrap: 'wrap',
        }}
      >
        {[
          ['#3ecf8e', 'Present'],
          ['#f26b6b', 'Absent'],
          ['#f59e0b', 'Late'],
          ['#a78bfa', 'Excused'],
        ].map(([c, l]) => (
          <div
            key={l}
            style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: '2px',
                background: c,
              }}
            />
            <span
              style={{
                fontSize: '0.65rem',
                color: 'var(--neu-text-ghost)',
                fontWeight: 600,
              }}
            >
              {l}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Custom Tooltips ───────────────────────────────────────── */
function RadarTip({ active, payload }) {
  if (!active || !payload?.length) return null
  const { subject, A } = payload[0]?.payload || {}
  return (
    <div
      style={{
        ...neu({ padding: '0.45rem 0.75rem', borderRadius: '0.65rem' }),
        fontSize: '0.75rem',
        color: 'var(--neu-text-primary)',
      }}
    >
      <b>{subject}</b>: {Math.round(A)}%
    </div>
  )
}

function AreaTip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div
      style={{
        ...neu({ padding: '0.45rem 0.75rem', borderRadius: '0.65rem' }),
        fontSize: '0.75rem',
        color: 'var(--neu-text-primary)',
      }}
    >
      <b>{label}</b>: {Math.round(payload[0]?.value)}%
    </div>
  )
}

/* ─── Build weekly trend from session records ───────────────── */
function buildTrend(sessions) {
  if (!sessions.length) return []
  const map = {}
  sessions.forEach((s) => {
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

/* ═══════════════════════════════════════════════════════════════
   MAIN DASHBOARD
═══════════════════════════════════════════════════════════════ */
export default function StudentDashboard() {
  const user      = authStore.getUser()
  const navigate  = useNavigate()
  const studentId = getStudentId(user)

  const [enrollments,   setEnrollments]   = useState([])
  const [analytics,     setAnalytics]     = useState(null)
  const [announcements, setAnnouncements] = useState([])
  const [vouchers,      setVouchers]      = useState(null)
  const [attnRecords,   setAttnRecords]   = useState([])
  const [attnSummary,   setAttnSummary]   = useState(null)
  const [assignments,   setAssignments]   = useState([])
  const [submissions,   setSubmissions]   = useState([])
  const [loading,       setLoading]       = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        // ── 1. Parallel primary calls ──
        const [enrRes, annRes, vouchRes] = await Promise.all([
          studentAPI.getEnrollments(),
          studentAPI.getAnnouncements(1),
          studentAPI.getMyVouchers().catch(() => null),
        ])

        const enrs = enrRes.data.data?.enrollments || []
        setEnrollments(enrs)
        setAnnouncements(
          (annRes.data.data?.announcements || []).slice(0, 4)
        )
        if (vouchRes) setVouchers(vouchRes.data.data)

        // ── 2. Analytics (can fail gracefully) ──
        try {
          const ar = await studentAPI.getAnalytics()
          setAnalytics(ar.data.data)
        } catch (_) {}

        // ── 3. First approved course — attendance + assignments ──
        const firstApproved = enrs.find((e) => e.is_approved) || enrs[0]
        if (firstApproved && studentId) {
          const [atRes, asRes] = await Promise.allSettled([
            studentAPI.getAttendance(studentId, firstApproved.offering_id),
            studentAPI.getOfferingAssignments(firstApproved.offering_id),
          ])
          if (atRes.status === 'fulfilled') {
            const d = atRes.value.data?.data || {}
            setAttnRecords(d.records || [])
            setAttnSummary(d.summary || null)
          }
          if (asRes.status === 'fulfilled') {
            setAssignments(asRes.value.data?.data?.assignments || [])
          }
          // submissions for pending count
          if (studentId) {
            try {
              const sr = await studentAPI.getStudentSubmissions(studentId)
              setSubmissions(sr.data.data?.submissions || [])
            } catch (_) {}
          }
        }
      } catch (err) {
        toast.error('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [studentId])

  if (loading)
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '16rem',
          gap: '0.75rem',
        }}
      >
        <div
          style={{
            ...neuInset({ width: 56, height: 56, borderRadius: '1rem' }),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Loader2
            size={24}
            style={{ color: '#5b8af0', animation: 'spin 0.8s linear infinite' }}
          />
        </div>
        <p style={{ fontSize: '0.82rem', color: 'var(--neu-text-ghost)' }}>
          Loading your dashboard…
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )

  /* ── Derived values ─────────────────────────────────────────── */
  const firstName  = user?.full_name|| 'Student'
  const today = new Date().toLocaleDateString('en-PK', { weekday: 'long', day: 'numeric', month: 'long' })
  const avatarUrl  = user?.profile_picture_url
    ? `${BASE_URL}${user.profile_picture_url}`
    : null

  const hour     = new Date().getHours()
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  // Analytics breakdown
  const breakdown    = analytics?.score_breakdown || {}
  const lectureAttn  = breakdown.lecture_attendance    ?? 0
  const assignConst  = breakdown.assignment_consistency ?? 0
  const quizAccuracy = breakdown.quiz_accuracy         ?? 0
  const gpaFactor    = breakdown.gpa_factor            ?? 0
  const campusPres   = breakdown.campus_presence       ?? 0
  const trend        = analytics?.trend_direction      ?? 'stable'
  const acScore      = analytics?.academic_score       ?? 0

  // Fee
  const voucherList  = vouchers?.vouchers || []
  const totalDue     = vouchers?.fee_summary?.total_due || 0
  const overdueCount = vouchers?.fee_summary?.overdue_vouchers || 0

  // Assignments
  const submittedIds = new Set(submissions.map((s) => s.assignment_id))
  const now          = new Date()
  const pendingCount = assignments.filter(
    (a) => !submittedIds.has(a.id) && new Date(a.due_date) > now
  ).length
  const gradedCount  = submissions.filter((s) => s.status === 'graded').length

  // Attendance
  const attnPct = attnSummary
    ? parseFloat(attnSummary.percentage || 0)
    : lectureAttn

  const last28     = attnRecords.slice(-28)
  const presentN   = last28.filter((r) => r.status === 'present').length
  const attnColor  =
    attnPct >= 75 ? '#3ecf8e' : attnPct >= 60 ? '#f59e0b' : '#f26b6b'

  // Chart data
  const radarData = [
    { subject: 'Attendance',  A: lectureAttn  },
    { subject: 'Assignments', A: assignConst  },
    { subject: 'Quizzes',     A: quizAccuracy },
    { subject: 'GPA',         A: gpaFactor    },
    { subject: 'Campus',      A: campusPres   },
  ]

  const trendData = buildTrend(attnRecords)

  const pieData = assignments.length > 0
    ? [
        { name: 'Pending',   value: pendingCount,                                fill: '#f59e0b' },
        { name: 'Graded',    value: gradedCount,                                 fill: '#3ecf8e' },
        { name: 'Submitted', value: assignments.length - pendingCount - gradedCount, fill: '#5b8af0' },
      ].filter((d) => d.value > 0)
    : []

  const TrendIcon =
    trend === 'improving'
      ? TrendingUp
      : trend === 'declining'
      ? TrendingDown
      : Minus
  const trendColor =
    trend === 'improving'
      ? '#3ecf8e'
      : trend === 'declining'
      ? '#f26b6b'
      : '#94a3b8'

  return (
    <div
      style={{
        maxWidth: 1200,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        paddingBottom: '2rem',
      }}
    >
      <style>{`
        @keyframes spin    { to { transform: rotate(360deg) } }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
      `}</style>

      {/* ══ GREETING BANNER ════════════════════════════════════ */}
      <div
        style={{
          ...neu({
            padding: '1.4rem 1.6rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem',
            overflow: 'hidden',
            position: 'relative',
          }),
        }}
      >
        {/* Background glow */}
        <div
          style={{
            position: 'absolute',
            right: -40,
            top: -40,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: 'rgba(91,138,240,0.07)',
            pointerEvents: 'none',
          }}
        />

        {/* Avatar */}
        <div
          style={{
            width: 58,
            height: 58,
            borderRadius: '1rem',
            flexShrink: 0,
            overflow: 'hidden',
            boxShadow:
              '6px 6px 16px var(--neu-shadow-dark), -4px -4px 10px var(--neu-shadow-light)',
            background: 'linear-gradient(145deg,#5b8af0,#3a6bd4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <span
              style={{
                fontSize: '1.4rem',
                fontWeight: 800,
                color: '#fff',
                fontFamily: 'Outfit, sans-serif',
              }}
            >
              {(user?.full_name || 'S')[0]}
            </span>
          )}
        </div>

        <div style={{ flex: 1 }}>
          <p
            style={{
              fontSize: '0.75rem',
              color: 'var(--neu-text-ghost)',
              marginBottom: '0.15rem',
            }}
          >
            {greeting} 👋
          </p>
          <h1
            style={{
              fontSize: '1.35rem',
              fontWeight: 800,
              color: 'var(--neu-text-primary)',
              fontFamily: 'Outfit, sans-serif',
              lineHeight: 1.2,
            }}
          >
            {firstName}
          </h1>
          <p
            style={{
              fontSize: '0.72rem',
              color: 'var(--neu-text-ghost)',
              marginTop: '0.15rem',
            }}
          >
            {today}
          </p>
        </div>

        {/* Academic Score pill */}
        {acScore > 0 && (
          <div
            style={{
              ...neuInset({
                borderRadius: '1rem',
                padding: '0.7rem 1.1rem',
              }),
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.2rem',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <Award size={14} style={{ color: '#f59e0b' }} />
              <span
                style={{
                  fontSize: '1.3rem',
                  fontWeight: 900,
                  color: 'var(--neu-text-primary)',
                  fontFamily: 'Outfit, sans-serif',
                }}
              >
                {Math.round(acScore)}
              </span>
            </div>
            <span
              style={{
                fontSize: '0.62rem',
                color: 'var(--neu-text-ghost)',
                fontWeight: 600,
              }}
            >
              Academic Score
            </span>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.2rem',
              }}
            >
              <TrendIcon size={11} style={{ color: trendColor }} />
              <span
                style={{
                  fontSize: '0.62rem',
                  color: trendColor,
                  fontWeight: 700,
                  textTransform: 'capitalize',
                }}
              >
                {trend}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ══ KPI ROW ════════════════════════════════════════════ */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '0.9rem',
        }}
      >
        <KpiCard
          label="Enrolled Courses"
          value={enrollments.length}
          icon={BookOpen}
          color="#5b8af0"
          sub={`${enrollments.filter((e) => e.is_approved).length} active`}
          onClick={() => navigate('/student/courses')}
        />
        <KpiCard
          label="Attendance"
          value={`${Math.round(attnPct)}%`}
          icon={ClipboardCheck}
          color={attnColor}
          sub={attnPct < 75 ? '⚠ Low' : '✓ Good'}
          onClick={() => navigate('/student/attendance')}
        />
        <KpiCard
          label="Assignments Due"
          value={pendingCount}
          icon={FileText}
          color={pendingCount > 0 ? '#f59e0b' : '#3ecf8e'}
          sub={`${gradedCount} graded`}
          onClick={() => navigate('/student/assignments')}
        />
        <KpiCard
          label="Fee Due"
          value={
            totalDue > 0
              ? `Rs ${(totalDue / 1000).toFixed(0)}k`
              : 'Clear'
          }
          icon={CreditCard}
          color={totalDue > 0 ? '#f26b6b' : '#3ecf8e'}
          sub={overdueCount > 0 ? `${overdueCount} overdue` : 'All paid'}
          onClick={() => navigate('/student/fee')}
        />
      </div>

      {/* ══ ROW 2 — Charts ═════════════════════════════════════ */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '0.9rem',
        }}
      >
        {/* Performance Radar */}
        <div style={{ ...neu({ padding: '1.25rem' }) }}>
          <SectionHeader
            title="Performance"
            sub="Score breakdown"
            Icon={Award}
            color="#5b8af0"
          />
          {radarData.some((d) => d.A > 0) ? (
            <ResponsiveContainer width="100%" height={190}>
              <RadarChart data={radarData} margin={{ top: 0, right: 20, bottom: 0, left: 20 }}>
                <PolarGrid stroke="var(--neu-border)" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{
                    fill: 'var(--neu-text-ghost)',
                    fontSize: 10,
                    fontFamily: "'DM Sans'",
                  }}
                />
                <Radar
                  name="Score"
                  dataKey="A"
                  stroke="#5b8af0"
                  fill="#5b8af0"
                  fillOpacity={0.18}
                  strokeWidth={2}
                  dot={{ fill: '#5b8af0', r: 3 }}
                />
                <Tooltip content={<RadarTip />} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div
              style={{
                height: 190,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <p
                style={{
                  fontSize: '0.78rem',
                  color: 'var(--neu-text-ghost)',
                  textAlign: 'center',
                }}
              >
                No analytics data yet
              </p>
            </div>
          )}
        </div>

        {/* Attendance Trend */}
        <div style={{ ...neu({ padding: '1.25rem' }) }}>
          <SectionHeader
            title="Attendance Trend"
            sub="Weekly breakdown"
            Icon={TrendingUp}
            color="#3ecf8e"
          />
          {trendData.length > 1 ? (
            <ResponsiveContainer width="100%" height={190}>
              <AreaChart
                data={trendData}
                margin={{ top: 5, right: 5, bottom: 0, left: -20 }}
              >
                <defs>
                  <linearGradient id="attnGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3ecf8e" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#3ecf8e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--neu-border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="week"
                  tick={{
                    fill: 'var(--neu-text-ghost)',
                    fontSize: 9,
                    fontFamily: "'DM Sans'",
                  }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: 'var(--neu-text-ghost)', fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<AreaTip />} />
                <Area
                  type="monotone"
                  dataKey="pct"
                  stroke="#3ecf8e"
                  strokeWidth={2.5}
                  fill="url(#attnGrad)"
                  dot={{ fill: '#3ecf8e', r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div
              style={{
                height: 190,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <p
                style={{
                  fontSize: '0.78rem',
                  color: 'var(--neu-text-ghost)',
                  textAlign: 'center',
                }}
              >
                Attend more sessions to see trend
              </p>
            </div>
          )}
        </div>

        {/* Quick Stats — Ring + Donut */}
        <div
          style={{
            ...neu({
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }),
          }}
        >
          <SectionHeader
            title="Quick Stats"
            sub="Attendance & Assignments"
            Icon={ClipboardCheck}
            color="#a78bfa"
          />
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-around',
              flex: 1,
            }}
          >
            {/* Attendance Ring */}
            <Ring
              pct={attnPct}
              color={attnColor}
              size={90}
              stroke={8}
              label="Attendance"
              sub={`${presentN}/${last28.length} sessions`}
            />

            {/* Assignment Donut */}
            {pieData.length > 0 ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <ResponsiveContainer width={90} height={90}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      innerRadius={26}
                      outerRadius={40}
                      paddingAngle={3}
                      strokeWidth={0}
                    >
                      {pieData.map((d, i) => (
                        <Cell key={i} fill={d.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v, n) => [v, n]}
                      contentStyle={{
                        background: 'var(--neu-surface)',
                        border: '1px solid var(--neu-border)',
                        borderRadius: '0.6rem',
                        fontSize: '0.72rem',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div
                  style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}
                >
                  {pieData.map((d) => (
                    <div
                      key={d.name}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                      }}
                    >
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '2px',
                          background: d.fill,
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          fontSize: '0.62rem',
                          color: 'var(--neu-text-ghost)',
                        }}
                      >
                        {d.name}:{' '}
                        <b style={{ color: 'var(--neu-text-primary)' }}>
                          {d.value}
                        </b>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.3rem',
                }}
              >
                <CheckCircle2 size={36} style={{ color: '#3ecf8e' }} />
                <p
                  style={{
                    fontSize: '0.72rem',
                    color: 'var(--neu-text-ghost)',
                    textAlign: 'center',
                  }}
                >
                  No assignments yet
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══ ROW 3 — Attendance Grid + Announcements ════════════ */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.9rem',
        }}
      >
        {/* Attendance Dot Grid */}
        <div style={{ ...neu({ padding: '1.25rem' }) }}>
          <SectionHeader
            title="Attendance Grid"
            sub="Last 28 sessions"
            Icon={ClipboardCheck}
            color="#3ecf8e"
            to="/student/attendance"
          />
          <AttendanceDots records={attnRecords} />
        </div>

        {/* Announcements */}
        <div style={{ ...neu({ padding: '1.25rem' }) }}>
          <SectionHeader
            title="Announcements"
            sub="Latest notices"
            Icon={Bell}
            color="#f97316"
            to="/student/announcements"
          />
          {announcements.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '1.5rem',
                color: 'var(--neu-text-ghost)',
              }}
            >
              <Bell size={28} style={{ opacity: 0.3 }} />
              <p style={{ fontSize: '0.8rem' }}>No announcements</p>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.55rem',
              }}
            >
              {announcements.map((ann) => {
                const pb =
                  PRIORITY_BADGE[ann.priority] || PRIORITY_BADGE.normal
                return (
                  <div
                    key={ann.id}
                    style={{
                      ...neuInset({
                        borderRadius: '0.875rem',
                        padding: '0.75rem 0.9rem',
                      }),
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.25rem',
                      borderLeft: `3px solid ${pb.color}`,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.62rem',
                          fontWeight: 700,
                          padding: '0.1rem 0.45rem',
                          background: pb.bg,
                          color: pb.color,
                          borderRadius: '0.35rem',
                          flexShrink: 0,
                          textTransform: 'capitalize',
                        }}
                      >
                        {ann.priority}
                      </span>
                      <p
                        style={{
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          color: 'var(--neu-text-primary)',
                          flex: 1,
                          fontFamily: 'Outfit, sans-serif',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {ann.title}
                      </p>
                    </div>
                    <p
                      style={{
                        fontSize: '0.72rem',
                        color: 'var(--neu-text-muted)',
                        lineHeight: 1.5,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {ann.content}
                    </p>
                    <p
                      style={{
                        fontSize: '0.65rem',
                        color: 'var(--neu-text-ghost)',
                      }}
                    >
                      {timeAgo(ann.created_at)}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ══ ROW 4 — My Courses ═════════════════════════════════ */}
      <div style={{ ...neu({ padding: '1.25rem' }) }}>
        <SectionHeader
          title="My Courses"
          sub={`${enrollments.length} enrolled`}
          Icon={BookOpen}
          color="#5b8af0"
          to="/student/courses"
        />
        {enrollments.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '2rem',
              color: 'var(--neu-text-ghost)',
            }}
          >
            <BookOpen
              size={32}
              style={{ opacity: 0.3, marginBottom: '0.5rem' }}
            />
            <p style={{ fontSize: '0.8rem' }}>No courses enrolled yet</p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '0.7rem',
            }}
          >
            {enrollments.slice(0, 6).map((enr, i) => {
              const color = cc(i)
              return (
                <div
                  key={enr.offering_id}
                  onClick={() =>
                    navigate(`/student/courses`)
                  }
                  style={{
                    ...neuInset({
                      borderRadius: '1rem',
                      padding: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem',
                      transition: 'transform 0.15s',
                    }),
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.transform = 'translateY(-2px)')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.transform = '')
                  }
                >
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: '0.75rem',
                      background: `linear-gradient(145deg,${color},${color}aa)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      fontFamily: 'Outfit, sans-serif',
                      flexShrink: 0,
                      boxShadow: `4px 4px 10px var(--neu-shadow-dark), -2px -2px 6px var(--neu-shadow-light), 0 2px 8px ${color}44`,
                    }}
                  >
                    {(enr.course_code || enr.course_name || '?')
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        color: 'var(--neu-text-primary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {enr.course_name}
                    </p>
                    <p
                      style={{
                        fontSize: '0.68rem',
                        color: 'var(--neu-text-ghost)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {enr.course_code}
                    </p>
                  </div>
                  <span
                    style={{
                      fontSize: '0.6rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.45rem',
                      borderRadius: '0.4rem',
                      background: enr.is_approved
                        ? 'rgba(62,207,142,0.12)'
                        : 'rgba(245,158,11,0.12)',
                      color: enr.is_approved ? '#3ecf8e' : '#f59e0b',
                      flexShrink: 0,
                    }}
                  >
                    {enr.is_approved ? '✓' : '…'}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ══ Fee Alert Bar — conditional ════════════════════════ */}
      {(totalDue > 0 || overdueCount > 0) && (
        <div
          onClick={() => navigate('/student/fee')}
          style={{
            ...neu({
              padding: '1rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.85rem',
              cursor: 'pointer',
              border: '1px solid rgba(242,107,107,0.3)',
            }),
            transition: 'transform 0.15s',
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.transform = 'translateY(-1px)')
          }
          onMouseLeave={(e) => (e.currentTarget.style.transform = '')}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '0.875rem',
              background: 'rgba(242,107,107,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#f26b6b',
              flexShrink: 0,
              boxShadow:
                'inset 2px 2px 6px var(--neu-shadow-dark), inset -1px -1px 4px var(--neu-shadow-light)',
            }}
          >
            <AlertTriangle size={18} />
          </div>
          <div style={{ flex: 1 }}>
            <p
              style={{
                fontSize: '0.85rem',
                fontWeight: 700,
                color: '#f26b6b',
              }}
            >
              {overdueCount > 0 ? 'Fee Payment Overdue' : 'Fee Dues Pending'}
            </p>
            <p
              style={{
                fontSize: '0.73rem',
                color: 'var(--neu-text-ghost)',
              }}
            >
              {overdueCount > 0
                ? `${overdueCount} voucher${overdueCount > 1 ? 's' : ''} overdue · `
                : ''}
              Rs {totalDue.toLocaleString()} total due
            </p>
          </div>
          <ChevronRight
            size={16}
            style={{ color: '#f26b6b', flexShrink: 0 }}
          />
        </div>
      )}

      {/* ══ AI Assistant CTA ════════════════════════════════════ */}
      <div
        onClick={() => navigate('/student/ai')}
        style={{
          ...neu({
            padding: '1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem',
            cursor: 'pointer',
            border: '1px solid rgba(167,139,250,0.2)',
          }),
          transition: 'transform 0.15s',
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.transform = 'translateY(-1px)')
        }
        onMouseLeave={(e) => (e.currentTarget.style.transform = '')}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: '0.875rem',
            background: 'linear-gradient(145deg,#a78bfa,#7c5cdb)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            flexShrink: 0,
            boxShadow:
              '4px 4px 10px var(--neu-shadow-dark), -2px -2px 6px var(--neu-shadow-light), 0 3px 12px rgba(167,139,250,0.35)',
          }}
        >
          <Sparkles size={18} />
        </div>
        <div style={{ flex: 1 }}>
          <p
            style={{
              fontSize: '0.85rem',
              fontWeight: 700,
              color: 'var(--neu-text-primary)',
            }}
          >
            AI Assistant
          </p>
          <p
            style={{
              fontSize: '0.73rem',
              color: 'var(--neu-text-ghost)',
            }}
          >
            Ask about attendance, fee, results, quizzes & more
          </p>
        </div>
        <ChevronRight
          size={16}
          style={{ color: '#a78bfa', flexShrink: 0 }}
        />
      </div>
    </div>
  )
}