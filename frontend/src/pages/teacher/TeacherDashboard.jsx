import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { teacherAPI } from '../../api/teacher.api'
import { authStore } from '../../store/authStore'
import toast from 'react-hot-toast'
import {
  BookOpen, Users, ClipboardCheck, FileText,
  PenSquare, Bell, ChevronRight, AlertTriangle,
  Clock, CheckCircle2, Loader2, TrendingUp,
  BarChart3, Award, Calendar, Activity,
  ArrowUpRight, Layers, MessageSquare, Star,
  Target, Zap, BookMarked
} from 'lucide-react'

// ─── SVG Mini Charts ──────────────────────────────────────

function AttendanceRing({ pct = 0, size = 80 }) {
  const r = 28, cx = 40, cy = 40
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  const color = pct >= 75 ? '#10b981' : pct >= 60 ? '#f59e0b' : '#ef4444'
  return (
    <svg width={size} height={size} viewBox="0 0 80 80">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth="9" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="9"
        strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
        style={{ transform: 'rotate(-90deg)', transformOrigin: '40px 40px' }} />
      <text x={cx} y={cy + 1} textAnchor="middle" fontSize="12" fontWeight="bold" fill="#1e293b">
        {Math.round(pct)}%
      </text>
      <text x={cx} y={cy + 13} textAnchor="middle" fontSize="7" fill="#94a3b8">attend</text>
    </svg>
  )
}

function MiniBarChart({ bars = [], height = 56 }) {
  if (!bars.length) return null
  const max = Math.max(...bars.map(b => b.v), 1)
  const w = 160
  const bw = Math.floor(w / bars.length) - 3
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" style={{ height }}>
      {bars.map((bar, i) => {
        const bh = Math.max(3, (bar.v / max) * (height - 14))
        const x = i * (w / bars.length) + 1
        return (
          <g key={i}>
            <rect x={x} y={height - bh - 12} width={bw} height={bh} rx="2"
              fill={bar.color || '#6366f1'} opacity={0.85} />
            <text x={x + bw / 2} y={height - 1} textAnchor="middle" fontSize="7" fill="#94a3b8">
              {bar.l}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function SparkLine({ values = [], color = '#6366f1', height = 36 }) {
  if (values.length < 2) return null
  const max = Math.max(...values, 1), min = Math.min(...values)
  const range = max - min || 1
  const w = 100, h = height
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w
    const y = h - ((v - min) / range) * (h - 6) - 3
    return `${x},${y}`
  }).join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }}>
      <defs>
        <linearGradient id="tsg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${pts} ${w},${h}`} fill="url(#tsg)" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function HBar({ label, value, max, color }) {
  const pct = max ? Math.min((value / max) * 100, 100) : 0
  return (
    <div className="flex items-center gap-2.5">
      <p className="text-xs text-slate-500 w-28 truncate flex-shrink-0">{label}</p>
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <p className="text-xs font-bold text-slate-700 w-8 text-right flex-shrink-0">{value}</p>
    </div>
  )
}

// ─── Section Header ───────────────────────────────────────
function SH({ title, sub, icon: Icon, to }) {
  const nav = useNavigate()
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2.5">
        {Icon && <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center">
          <Icon size={14} className="text-slate-600" />
        </div>}
        <div>
          <h2 className="text-slate-800 font-bold text-sm">{title}</h2>
          {sub && <p className="text-slate-400 text-xs">{sub}</p>}
        </div>
      </div>
      {to && (
        <button onClick={() => nav(to)}
          className="flex items-center gap-1 text-purple-600 text-xs font-semibold hover:text-purple-700 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg transition-colors">
          View all <ChevronRight size={12} />
        </button>
      )}
    </div>
  )
}

// ─── Course Card ──────────────────────────────────────────
function CourseCard({ offering, onClick }) {
  const colors = [
    { from: 'from-violet-500', to: 'to-purple-700' },
    { from: 'from-blue-500',   to: 'to-blue-700' },
    { from: 'from-emerald-500',to: 'to-emerald-700' },
    { from: 'from-rose-500',   to: 'to-pink-700' },
    { from: 'from-amber-500',  to: 'to-orange-600' },
  ]
  const c = colors[offering.id % colors.length]
  const enrolled = offering.enrolled_count || 0
  const pending  = offering.pending_grading || 0

  return (
    <div onClick={onClick}
      className="bg-white rounded-2xl border border-slate-100 overflow-hidden cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all group">
      <div className={`bg-gradient-to-br ${c.from} ${c.to} p-4`}>
        <div className="flex items-start justify-between">
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
            <BookOpen size={18} className="text-white" />
          </div>
          <span className="text-white/80 text-xs font-mono bg-white/10 px-2 py-0.5 rounded-lg">
            {offering.course_code || offering.section || 'SEC'}
          </span>
        </div>
        <p className="text-white font-bold text-sm mt-3 line-clamp-2 leading-snug">
          {offering.course_name || 'Course'}
        </p>
      </div>
      <div className="p-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-slate-500 text-xs">
          <Users size={12} />
          <span>{enrolled} students</span>
        </div>
        {pending > 0 && (
          <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">
            {pending} pending
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────
export default function TeacherDashboard() {
  const user     = authStore.getUser()
  const navigate = useNavigate()

  const [offerings, setOfferings]     = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [allData, setAllData]         = useState(null)  // aggregated across offerings
  const [loading, setLoading]         = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [offRes, annRes] = await Promise.all([
          teacherAPI.getMyOfferings(),
          teacherAPI.getAnnouncements(1),
        ])
        const offs = offRes.data.data?.offerings || []
        setOfferings(offs)
        setAnnouncements((annRes.data.data?.announcements || []).slice(0, 4))

        // Fetch per-offering data in parallel (assignments + quizzes + attendance)
        if (offs.length > 0) {
          const perOffering = await Promise.allSettled(
            offs.map(o => Promise.all([
              teacherAPI.getOfferingAssignments(o.id).catch(() => ({ data: { data: { assignments: [] } } })),
              teacherAPI.getOfferingQuizzes(o.id).catch(() => ({ data: { data: { quizzes: [] } } })),
              teacherAPI.getShortAttendance(o.id).catch(() => ({ data: { data: { students: [] } } })),
              teacherAPI.getOfferingSessions(o.id).catch(() => ({ data: { data: { sessions: [] } } })),
            ]))
          )

          let totalAssignments = 0, pendingGrading = 0, totalQuizzes = 0
          let shortStudents = 0, totalSessions = 0
          const offeringDetails = []

          perOffering.forEach((res, i) => {
            if (res.status === 'fulfilled') {
              const [aRes, qRes, saRes, sesRes] = res.value
              const assignments = aRes.data?.data?.assignments || []
              const quizzes     = qRes.data?.data?.quizzes || []
              const shortAttn   = saRes.data?.data?.students || []
              const sessions    = sesRes.data?.data?.sessions || []

              totalAssignments += assignments.length
              pendingGrading   += assignments.filter(a => a.pending_count > 0).length
              totalQuizzes     += quizzes.length
              shortStudents    += shortAttn.length
              totalSessions    += sessions.length

              offeringDetails.push({
                id: offs[i].id,
                name: offs[i].course_name,
                enrolled: offs[i].enrolled_count || 0,
                shortCount: shortAttn.length,
                assignCount: assignments.length,
                quizCount: quizzes.length,
                sessionCount: sessions.length,
              })
            }
          })

          setAllData({ totalAssignments, pendingGrading, totalQuizzes, shortStudents, totalSessions, offeringDetails })
        }
      } catch (err) {
        console.error(err)
        toast.error('Failed to load dashboard')
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
      <p className="text-slate-400 text-sm">Loading your dashboard...</p>
    </div>
  )

  const firstName       = user?.full_name?.split(' ')[0] || 'Teacher'
  const totalStudents   = offerings.reduce((s, o) => s + (o.enrolled_count || 0), 0)
  const totalOfferings  = offerings.length
  const { totalAssignments = 0, pendingGrading = 0, totalQuizzes = 0,
          shortStudents = 0, totalSessions = 0, offeringDetails = [] } = allData || {}

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const today = new Date().toLocaleDateString('en-PK', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })

  // Bar chart: students per offering
  const courseBars = offeringDetails.slice(0, 5).map((o, i) => ({
    v: o.enrolled,
    l: (o.name || '').slice(0, 4),
    color: ['#8b5cf6','#3b82f6','#10b981','#f59e0b','#ef4444'][i % 5]
  }))

  // Attendance short data for bar chart
  const shortBars = offeringDetails.slice(0, 5).map((o, i) => ({
    v: o.shortCount,
    l: (o.name || '').slice(0, 4),
    color: o.shortCount > 3 ? '#ef4444' : o.shortCount > 0 ? '#f59e0b' : '#10b981'
  }))

  // Spark trend (simulated based on total sessions)
  const sessionTrend = [
    totalSessions * 0.4, totalSessions * 0.55, totalSessions * 0.65,
    totalSessions * 0.75, totalSessions * 0.85, totalSessions * 0.92, totalSessions
  ]

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-8" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* ── Welcome Banner ───────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-700 via-violet-700 to-indigo-800 rounded-2xl p-6 text-white">
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-purple-200 text-sm font-medium">{greeting} 👋</p>
            <h1 className="text-2xl font-black mt-0.5">{firstName}</h1>
            <p className="text-purple-200 text-xs mt-1 flex items-center gap-1.5">
              <Calendar size={12} /> {today}
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate('/teacher/attendance')}
              className="flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors backdrop-blur-sm border border-white/20">
              <ClipboardCheck size={14} /> Mark Attendance
            </button>
            <button onClick={() => navigate('/teacher/assignments')}
              className="flex items-center gap-2 bg-white text-purple-700 hover:bg-purple-50 text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors">
              <FileText size={14} /> Grade Work
            </button>
          </div>
        </div>
        {/* Decorative circles */}
        <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/5 rounded-full" />
        <div className="absolute -right-16 top-4 w-48 h-48 bg-white/5 rounded-full" />
        <div className="absolute right-24 -bottom-12 w-32 h-32 bg-white/5 rounded-full" />
      </div>

      {/* ── KPI Cards ────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            icon: BookOpen, label: 'My Courses', value: totalOfferings,
            sub: 'This semester', color: 'bg-violet-50 border-violet-100',
            val: 'text-violet-700', ico: 'bg-violet-100 text-violet-600',
            to: '/teacher/courses'
          },
          {
            icon: Users, label: 'Total Students', value: totalStudents,
            sub: 'Across all courses', color: 'bg-blue-50 border-blue-100',
            val: 'text-blue-700', ico: 'bg-blue-100 text-blue-600',
            to: '/teacher/courses'
          },
          {
            icon: ClipboardCheck, label: 'Sessions Held', value: totalSessions,
            sub: 'Lecture sessions', color: 'bg-emerald-50 border-emerald-100',
            val: 'text-emerald-700', ico: 'bg-emerald-100 text-emerald-600',
            to: '/teacher/attendance'
          },
          {
            icon: AlertTriangle, label: 'Short Attendance', value: shortStudents,
            sub: 'Students below 75%', color: shortStudents > 0 ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100',
            val: shortStudents > 0 ? 'text-red-600' : 'text-slate-600',
            ico: shortStudents > 0 ? 'bg-red-100 text-red-500' : 'bg-slate-100 text-slate-400',
            to: '/teacher/attendance'
          },
        ].map(card => {
          const Ic = card.icon
          return (
            <div key={card.label} onClick={() => navigate(card.to)}
              className={`${card.color} border rounded-2xl p-4 cursor-pointer hover:shadow-sm hover:-translate-y-0.5 transition-all`}>
              <div className={`w-9 h-9 ${card.ico} rounded-xl flex items-center justify-center mb-3`}>
                <Ic size={17} />
              </div>
              <p className={`text-2xl font-black ${card.val}`}>{card.value}</p>
              <p className="text-slate-600 text-sm font-semibold mt-0.5">{card.label}</p>
              <p className="text-slate-400 text-xs mt-0.5">{card.sub}</p>
            </div>
          )
        })}
      </div>

      {/* ── Row 2: Charts ────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Students per course bar */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <SH title="Students per Course" sub="Enrollment distribution" icon={BarChart3} to="/teacher/courses" />
          {courseBars.length > 0 ? (
            <>
              <MiniBarChart bars={courseBars} height={64} />
              <div className="mt-3 space-y-2">
                {offeringDetails.slice(0, 3).map((o, i) => (
                  <HBar key={o.id} label={o.name} value={o.enrolled}
                    max={Math.max(...offeringDetails.map(x => x.enrolled), 1)}
                    color={['#8b5cf6','#3b82f6','#10b981'][i % 3]} />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-slate-400 text-sm">No courses yet</div>
          )}
        </div>

        {/* Session trend sparkline */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <SH title="Session Activity" sub="Lectures conducted" icon={Activity} to="/teacher/attendance" />
          <div className="flex items-end justify-between mb-2">
            <p className="text-3xl font-black text-slate-800">{totalSessions}</p>
            <div className="flex items-center gap-1 text-emerald-600 text-xs font-semibold">
              <ArrowUpRight size={14} /> Active
            </div>
          </div>
          <SparkLine values={sessionTrend} color="#8b5cf6" height={44} />
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="bg-purple-50 rounded-xl p-2.5 text-center">
              <p className="text-lg font-black text-purple-700">{totalAssignments}</p>
              <p className="text-xs text-slate-500">Assignments</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-2.5 text-center">
              <p className="text-lg font-black text-blue-700">{totalQuizzes}</p>
              <p className="text-xs text-slate-500">Quizzes</p>
            </div>
          </div>
        </div>

        {/* Short attendance per course */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <SH title="Attendance Alerts" sub="Students below 75%" icon={AlertTriangle} to="/teacher/attendance" />
          {shortStudents === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <CheckCircle2 size={36} className="text-emerald-400 mb-2" />
              <p className="text-emerald-600 font-bold text-sm">All Good!</p>
              <p className="text-slate-400 text-xs mt-1">No students in shortage</p>
            </div>
          ) : (
            <>
              <MiniBarChart bars={shortBars} height={64} />
              <div className="mt-3 space-y-2">
                {offeringDetails.filter(o => o.shortCount > 0).slice(0, 4).map(o => (
                  <div key={o.id} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                    <p className="text-xs font-semibold text-slate-700 truncate flex-1">{o.name}</p>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ml-2 flex-shrink-0
                      ${o.shortCount > 3 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                      {o.shortCount} students
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Row 3: My Courses ────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
        <SH title="My Courses" sub={`${totalOfferings} active this semester`} icon={Layers} to="/teacher/courses" />
        {offerings.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <BookOpen size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No courses assigned yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {offerings.map(o => (
              <CourseCard key={o.id} offering={o} onClick={() => navigate('/teacher/courses')} />
            ))}
          </div>
        )}
      </div>

      {/* ── Row 4: Pending Tasks + Announcements ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Pending grading tasks */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <SH title="Pending Tasks" sub="Needs your attention" icon={Target} />
          <div className="space-y-3">
            {[
              {
                icon: FileText, label: 'Assignments to Grade', value: pendingGrading,
                color: pendingGrading > 0 ? 'text-amber-600' : 'text-emerald-600',
                bg: pendingGrading > 0 ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200',
                icolor: pendingGrading > 0 ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600',
                to: '/teacher/assignments', urgent: pendingGrading > 0
              },
              {
                icon: Users, label: 'Students in Short Attendance', value: shortStudents,
                color: shortStudents > 0 ? 'text-red-600' : 'text-emerald-600',
                bg: shortStudents > 0 ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200',
                icolor: shortStudents > 0 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600',
                to: '/teacher/attendance', urgent: shortStudents > 0
              },
              {
                icon: PenSquare, label: 'Active Quizzes', value: totalQuizzes,
                color: 'text-blue-600',
                bg: 'bg-blue-50 border-blue-100',
                icolor: 'bg-blue-100 text-blue-600',
                to: '/teacher/quizzes', urgent: false
              },
            ].map(task => {
              const Ic = task.icon
              return (
                <div key={task.label} onClick={() => navigate(task.to)}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer hover:shadow-sm transition-all ${task.bg}`}>
                  <div className={`w-9 h-9 ${task.icolor} rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <Ic size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-700 text-sm font-semibold">{task.label}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xl font-black ${task.color}`}>{task.value}</span>
                    {task.urgent && task.value > 0 && (
                      <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Quick action buttons */}
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2">
            {[
              { label: 'New Session', icon: ClipboardCheck, to: '/teacher/attendance', color: 'bg-slate-900 text-white' },
              { label: 'Create Quiz', icon: PenSquare, to: '/teacher/quizzes', color: 'bg-purple-600 text-white' },
            ].map(btn => {
              const Ic = btn.icon
              return (
                <button key={btn.label} onClick={() => navigate(btn.to)}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-colors hover:opacity-90 ${btn.color}`}>
                  <Ic size={14} /> {btn.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Announcements */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <SH title="Announcements" sub="Recent notices" icon={Bell} to="/teacher/announcements" />
          {announcements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400">
              <Bell size={32} className="mb-2 opacity-30" />
              <p className="text-sm">No announcements yet</p>
              <button onClick={() => navigate('/teacher/announcements')}
                className="mt-3 text-xs text-purple-600 font-semibold hover:underline">
                Create one →
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {announcements.map(ann => {
                const pColors = {
                  urgent: 'bg-red-100 text-red-700',
                  high:   'bg-orange-100 text-orange-700',
                  normal: 'bg-blue-100 text-blue-700',
                  low:    'bg-slate-100 text-slate-500',
                }
                const timeAgo = (dateStr) => {
                  const diff = Date.now() - new Date(dateStr)
                  const h = Math.floor(diff / 3600000)
                  const d = Math.floor(diff / 86400000)
                  return d > 0 ? `${d}d ago` : h > 0 ? `${h}h ago` : 'Just now'
                }
                return (
                  <div key={ann.id} className="flex gap-3 py-2.5 border-b border-slate-50 last:border-0">
                    <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bell size={13} className="text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <p className="text-sm font-semibold text-slate-800 truncate">{ann.title}</p>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${pColors[ann.priority] || pColors.normal}`}>
                          {ann.priority}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-slate-400 line-clamp-1 flex-1">{ann.content}</p>
                        <span className="text-xs text-slate-300 flex-shrink-0">{timeAgo(ann.created_at)}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Quick Actions Bar ────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 to-violet-950 rounded-2xl p-5">
        <p className="text-white/70 text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
          <Zap size={13} className="text-violet-400" /> Quick Actions
        </p>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {[
            { label: 'Mark Attendance', icon: ClipboardCheck, to: '/teacher/attendance', color: 'text-blue-400 bg-blue-400/10' },
            { label: 'Grade Assignments', icon: FileText, to: '/teacher/assignments', color: 'text-amber-400 bg-amber-400/10' },
            { label: 'Create Quiz', icon: PenSquare, to: '/teacher/quizzes', color: 'text-violet-400 bg-violet-400/10' },
            { label: 'Enter Results', icon: BarChart3, to: '/teacher/results', color: 'text-emerald-400 bg-emerald-400/10' },
            { label: 'Announcement', icon: Bell, to: '/teacher/announcements', color: 'text-pink-400 bg-pink-400/10' },
            { label: 'Chat', icon: MessageSquare, to: '/teacher/chat', color: 'text-cyan-400 bg-cyan-400/10' },
          ].map(action => {
            const Ic = action.icon
            return (
              <button key={action.label} onClick={() => navigate(action.to)}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${action.color} group-hover:scale-110 transition-transform`}>
                  <Ic size={16} />
                </div>
                <span className="text-white/60 text-xs font-medium group-hover:text-white transition-colors text-center leading-tight">
                  {action.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

    </div>
  )
}