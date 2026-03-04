import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { studentAPI } from '../../api/student.api'
import { authStore } from '../../store/authStore'
import toast from 'react-hot-toast'
import {
  BookOpen, ClipboardCheck, FileText, PenSquare,
  BarChart2, CreditCard, Bell, BrainCircuit,
  ChevronRight, Loader2, Award, Calendar,
  TrendingUp, TrendingDown, Minus, Star,
  AlertTriangle, CheckCircle2, Zap, MessageSquare,
  ArrowUpRight, Target, Activity
} from 'lucide-react'

const BASE_URL = 'http://127.0.0.1:8000'

// ═══════════════════════════════════════════════
// UNIQUE SVG CHARTS
// ═══════════════════════════════════════════════

// 1. Hexagon Score Badge
function HexScore({ score = 0, label = '', color = '#6366f1' }) {
  const pct = Math.min(score / 100, 1)
  const r = 38, cx = 50, cy = 50
  const circ = 2 * Math.PI * r
  const dash = pct * circ
  const grade = score >= 90 ? 'A+' : score >= 80 ? 'A' : score >= 70 ? 'B' : score >= 60 ? 'C' : 'D'
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth="10" />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
          style={{ transform: 'rotate(-90deg)', transformOrigin: '50px 50px', transition: 'stroke-dasharray 1s ease' }} />
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="22" fontWeight="900" fill="#1e293b">{Math.round(score)}</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize="11" fontWeight="700" fill={color}>{grade}</text>
      </svg>
      <p className="text-xs text-slate-500 font-medium">{label}</p>
    </div>
  )
}

// 2. Stacked Area Chart (attendance trend)
function AreaChart({ data = [], color = '#10b981', height = 70 }) {
  if (data.length < 2) return (
    <div className="flex items-center justify-center h-16 text-slate-300 text-xs">No data</div>
  )
  const max = Math.max(...data, 100)
  const w = 240, h = height
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - (v / max) * (h - 8) - 4
    return `${x},${y}`
  }).join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }}>
      <defs>
        <linearGradient id="areag" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${pts} ${w},${h}`} fill="url(#areag)" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round" />
      {/* Dots on data points */}
      {data.map((v, i) => {
        const x = (i / (data.length - 1)) * w
        const y = h - (v / max) * (h - 8) - 4
        return <circle key={i} cx={x} cy={y} r="3" fill={color} />
      })}
    </svg>
  )
}

// 3. Radar / Spider Chart
function RadarChart({ metrics = [], size = 160 }) {
  if (!metrics.length) return null
  const cx = size / 2, cy = size / 2, r = size * 0.38
  const n = metrics.length
  const angles = metrics.map((_, i) => (i * 2 * Math.PI) / n - Math.PI / 2)

  const outerPts = angles.map(a => ({
    x: cx + r * Math.cos(a),
    y: cy + r * Math.sin(a),
  }))

  const valuePts = metrics.map((m, i) => ({
    x: cx + r * (m.value / 100) * Math.cos(angles[i]),
    y: cy + r * (m.value / 100) * Math.sin(angles[i]),
  }))

  const outerPath = outerPts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z'
  const valuePath = valuePts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z'

  // Grid rings
  const rings = [0.25, 0.5, 0.75, 1]

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Grid rings */}
      {rings.map((ring, ri) => {
        const ringPts = angles.map(a => `${ri === 0 ? 'M' : 'L'}${cx + r * ring * Math.cos(a)},${cy + r * ring * Math.sin(a)}`)
        return <path key={ri} d={ringPts.join(' ') + 'Z'} fill="none" stroke="#e2e8f0" strokeWidth="1" />
      })}
      {/* Spokes */}
      {outerPts.map((p, i) => (
        <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#e2e8f0" strokeWidth="1" />
      ))}
      {/* Value area */}
      <path d={valuePath} fill="#6366f1" fillOpacity="0.15" stroke="#6366f1" strokeWidth="2" />
      {/* Value dots */}
      {valuePts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#6366f1" />
      ))}
      {/* Labels */}
      {metrics.map((m, i) => {
        const labelR = r + 14
        const lx = cx + labelR * Math.cos(angles[i])
        const ly = cy + labelR * Math.sin(angles[i])
        return (
          <text key={i} x={lx} y={ly + 3} textAnchor="middle" fontSize="7.5"
            fontWeight="600" fill="#64748b">{m.label}</text>
        )
      })}
    </svg>
  )
}

// 4. Segmented Progress Bar (assignments status)
function SegmentBar({ segments = [], height = 12 }) {
  const total = segments.reduce((s, g) => s + g.value, 0) || 1
  return (
    <div className="w-full flex gap-0.5 rounded-full overflow-hidden" style={{ height }}>
      {segments.map((seg, i) => (
        <div key={i} style={{ width: `${(seg.value / total) * 100}%`, backgroundColor: seg.color }}
          title={`${seg.label}: ${seg.value}`} />
      ))}
    </div>
  )
}

// 5. Bubble / Dot Grid (attendance calendar-style)
function AttendanceGrid({ records = [] }) {
  const last28 = records.slice(-28)
  if (!last28.length) return (
    <div className="text-slate-300 text-xs text-center py-4">No records yet</div>
  )
  const colors = { present: '#10b981', absent: '#ef4444', late: '#f59e0b', excused: '#6366f1' }
  return (
    <div className="flex flex-wrap gap-1">
      {last28.map((r, i) => (
        <div key={i} title={`${r.status} — ${r.session_date}`}
          className="w-5 h-5 rounded-md flex-shrink-0 cursor-pointer hover:scale-110 transition-transform"
          style={{ backgroundColor: colors[r.status] || '#e2e8f0' }} />
      ))}
    </div>
  )
}

// 6. Horizontal stacked bar (fee breakdown)
function FeeBar({ paid = 0, pending = 0, overdue = 0 }) {
  const total = paid + pending + overdue || 1
  return (
    <div className="space-y-2">
      <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
        <div style={{ width: `${(paid / total) * 100}%` }} className="bg-emerald-400" />
        <div style={{ width: `${(pending / total) * 100}%` }} className="bg-amber-400" />
        <div style={{ width: `${(overdue / total) * 100}%` }} className="bg-red-400" />
      </div>
      <div className="flex items-center gap-4 text-xs">
        {[['#10b981', 'Paid', paid], ['#f59e0b', 'Pending', pending], ['#ef4444', 'Overdue', overdue]].map(([c, l, v]) => (
          <div key={l} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c }} />
            <span className="text-slate-500">{l}</span>
            <span className="font-bold text-slate-700">{v}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════
// SECTION HEADER
// ═══════════════════════════════════════════════
function SH({ title, sub, icon: Icon, to, color = 'text-slate-600 bg-slate-100' }) {
  const nav = useNavigate()
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2.5">
        {Icon && <div className={`w-7 h-7 ${color} rounded-lg flex items-center justify-center`}>
          <Icon size={14} />
        </div>}
        <div>
          <h2 className="text-slate-800 font-bold text-sm">{title}</h2>
          {sub && <p className="text-slate-400 text-xs">{sub}</p>}
        </div>
      </div>
      {to && (
        <button onClick={() => nav(to)}
          className="flex items-center gap-1 text-indigo-600 text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors">
          View all <ChevronRight size={12} />
        </button>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════════
export default function StudentDashboard() {
  const user     = authStore.getUser()
  const navigate = useNavigate()

  const [enrollments,    setEnrollments]    = useState([])
  const [analytics,      setAnalytics]      = useState(null)
  const [announcements,  setAnnouncements]  = useState([])
  const [vouchers,       setVouchers]       = useState(null)
  const [attendanceData, setAttendanceData] = useState([])
  const [assignments,    setAssignments]    = useState([])
  const [loading,        setLoading]        = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [enrRes, annRes, vouchRes] = await Promise.all([
          studentAPI.getEnrollments(),
          studentAPI.getAnnouncements(1),
          studentAPI.getMyVouchers().catch(() => null),
        ])

        const enrs = enrRes.data.data?.enrollments || []
        setEnrollments(enrs)
        setAnnouncements((annRes.data.data?.announcements || []).slice(0, 4))
        if (vouchRes) setVouchers(vouchRes.data.data)

        // Analytics (optional)
        try {
          const aRes = await studentAPI.getAnalytics()
          setAnalytics(aRes.data.data)
        } catch (_) {}

        // Attendance for first offering + assignments
        if (enrs.length > 0 && user?.user_id) {
          const firstOffId = enrs[0].offering_id
          const [atRes, asRes] = await Promise.allSettled([
            studentAPI.getAttendance(user.user_id, firstOffId),
            studentAPI.getOfferingAssignments(firstOffId),
          ])
          if (atRes.status === 'fulfilled') {
            setAttendanceData(atRes.value.data?.data?.records || [])
          }
          if (asRes.status === 'fulfilled') {
            setAssignments(asRes.value.data?.data?.assignments || [])
          }
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
      <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      <p className="text-slate-400 text-sm">Loading your dashboard...</p>
    </div>
  )

  // ── Derived values ───────────────────────────────────
  const firstName    = user?.full_name?.split(' ')[0] || 'Student'
  const totalCourses = enrollments.length
  const rollNum      = user?.roll_number || '—'

  const academicScore    = analytics?.academic_score ?? 0
  const consistencyIndex = analytics?.consistency_index ?? 0
  const engagementLevel  = analytics?.engagement_level ?? 'medium'
  const trendDirection   = analytics?.trend_direction ?? 'stable'
  const classRank        = analytics?.class_rank
  const breakdown        = analytics?.score_breakdown || {}
  const recommendations  = analytics?.recommendations || []
  const riskPrediction   = analytics?.risk_prediction || {}

  const lectureAttn   = breakdown.lecture_attendance   ?? 0
  const campusPresence= breakdown.campus_presence      ?? 0
  const assignConst   = breakdown.assignment_consistency ?? 0
  const quizAccuracy  = breakdown.quiz_accuracy        ?? 0
  const gpaFactor     = breakdown.gpa_factor           ?? 0

  // Voucher stats
  const voucherList = vouchers?.vouchers || []
  const paidFee     = voucherList.filter(v => v.status === 'paid').length
  const pendingFee  = voucherList.filter(v => v.status === 'unpaid').length
  const overdueFee  = voucherList.filter(v => v.status === 'overdue').length
  const totalDue    = vouchers?.summary?.total_due || 0
  const totalPaid   = vouchers?.summary?.total_paid || 0

  // Attendance records for grid
  const attnRecords = attendanceData.slice(-28)

  // Assignment stats
  const totalAssign   = assignments.length
  const submitted     = assignments.filter(a => a.my_submission).length
  const graded        = assignments.filter(a => a.my_submission?.status === 'graded').length
  const pending       = totalAssign - submitted

  // Radar chart metrics
  const radarMetrics = [
    { label: 'Lecture', value: lectureAttn },
    { label: 'Campus',  value: campusPresence },
    { label: 'Tasks',   value: assignConst },
    { label: 'Quizzes', value: quizAccuracy },
    { label: 'GPA',     value: gpaFactor },
  ]

  // Attendance trend (simulate 7-week trend from current value)
  const attnTrend = lectureAttn > 0
    ? [lectureAttn * 0.7, lectureAttn * 0.78, lectureAttn * 0.83, lectureAttn * 0.88, lectureAttn * 0.92, lectureAttn * 0.97, lectureAttn]
    : []

  const trendIcon   = trendDirection === 'improving' ? TrendingUp :
                      trendDirection === 'declining' ? TrendingDown : Minus
  const TrendIcon   = trendIcon
  const trendColor  = trendDirection === 'improving' ? 'text-emerald-600' :
                      trendDirection === 'declining' ? 'text-red-500' : 'text-slate-400'

  const hour     = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const today    = new Date().toLocaleDateString('en-PK', { weekday: 'long', day: 'numeric', month: 'long' })

  const avatarUrl = user?.profile_picture_url ? `${BASE_URL}${user.profile_picture_url}` : null

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-8" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* ── Hero Banner ──────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-6 text-white">
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            {avatarUrl ? (
              <img src={avatarUrl} alt={firstName}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-white/30 flex-shrink-0" />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-white text-2xl font-black flex-shrink-0">
                {firstName[0]}
              </div>
            )}
            <div>
              <p className="text-indigo-200 text-sm">{greeting} 👋</p>
              <h1 className="text-2xl font-black leading-tight">{firstName}</h1>
              <p className="text-indigo-200 text-xs mt-0.5 flex items-center gap-1.5">
                <span className="bg-white/15 px-2 py-0.5 rounded-md font-mono">{rollNum}</span>
                <span>•</span>
                <Calendar size={11} /> {today}
              </p>
            </div>
          </div>

          {/* Right stats */}
          <div className="flex items-center gap-3 flex-wrap">
            {classRank && (
              <div className="bg-white/15 backdrop-blur rounded-xl px-4 py-2.5 text-center border border-white/20">
                <p className="text-2xl font-black">#{classRank}</p>
                <p className="text-indigo-200 text-xs">Class Rank</p>
              </div>
            )}
            <div className="bg-white/15 backdrop-blur rounded-xl px-4 py-2.5 text-center border border-white/20">
              <p className="text-2xl font-black">{totalCourses}</p>
              <p className="text-indigo-200 text-xs">Courses</p>
            </div>
            <div className={`backdrop-blur rounded-xl px-4 py-2.5 text-center border border-white/20 ${
              engagementLevel === 'high' ? 'bg-emerald-500/30' :
              engagementLevel === 'medium' ? 'bg-amber-500/20' : 'bg-red-500/20'}`}>
              <p className="text-sm font-black capitalize">{engagementLevel}</p>
              <p className="text-indigo-200 text-xs">Engagement</p>
            </div>
          </div>
        </div>

        {/* Risk alert banner */}
        {riskPrediction?.at_risk && (
          <div className="mt-4 bg-red-500/20 border border-red-400/30 rounded-xl p-3 flex items-center gap-2 relative z-10">
            <AlertTriangle size={15} className="text-red-300 flex-shrink-0" />
            <p className="text-red-100 text-xs font-semibold">
              AI Alert: {riskPrediction.factors?.slice(0, 2).join(' • ')}
            </p>
            <button onClick={() => navigate('/student/ai')}
              className="ml-auto text-red-200 text-xs font-bold hover:text-white flex-shrink-0">
              Get Help →
            </button>
          </div>
        )}

        {/* Decorative circles */}
        <div className="absolute -right-10 -top-10 w-44 h-44 bg-white/5 rounded-full" />
        <div className="absolute -right-20 top-8 w-56 h-56 bg-white/5 rounded-full" />
        <div className="absolute right-32 -bottom-16 w-36 h-36 bg-white/5 rounded-full" />
      </div>

      {/* ── Row 1: Score Cards + Trend ───────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Academic Score Gauges */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <SH title="Academic Score" sub="AI-powered analysis" icon={BrainCircuit}
            color="text-indigo-600 bg-indigo-50" to="/student/ai" />
          <div className="flex items-center justify-around">
            <HexScore score={academicScore} label="Overall" color="#6366f1" />
            <HexScore score={consistencyIndex} label="Consistency" color="#10b981" />
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
            <div className={`flex items-center gap-1.5 text-xs font-semibold ${trendColor}`}>
              <TrendIcon size={14} />
              <span className="capitalize">{trendDirection}</span>
            </div>
            {recommendations.length > 0 && (
              <p className="text-xs text-slate-400 line-clamp-1 flex-1 ml-3 text-right">
                {recommendations[0]?.message}
              </p>
            )}
          </div>
        </div>

        {/* Radar Chart — score breakdown */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <SH title="Performance Radar" sub="Score breakdown" icon={Activity}
            color="text-violet-600 bg-violet-50" />
          {academicScore > 0 ? (
            <div className="flex items-center justify-center">
              <RadarChart metrics={radarMetrics} size={170} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-slate-400">
              <BrainCircuit size={32} className="mb-2 opacity-30" />
              <p className="text-sm">No analytics yet</p>
              <button onClick={() => navigate('/student/ai')}
                className="mt-2 text-xs text-indigo-600 font-semibold hover:underline">
                Calculate →
              </button>
            </div>
          )}
        </div>

        {/* Attendance area chart */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <SH title="Attendance Trend" sub={enrollments[0]?.course_name || 'First course'}
            icon={ClipboardCheck} color="text-emerald-600 bg-emerald-50" to="/student/attendance" />
          <div className="flex items-end gap-3 mb-3">
            <p className="text-3xl font-black text-slate-800">{Math.round(lectureAttn)}%</p>
            <div className={`flex items-center gap-1 text-xs font-semibold mb-1
              ${lectureAttn >= 75 ? 'text-emerald-600' : 'text-red-500'}`}>
              {lectureAttn >= 75 ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
              {lectureAttn >= 75 ? 'On track' : 'At risk'}
            </div>
          </div>
          {attnTrend.length > 0 ? (
            <AreaChart data={attnTrend} color={lectureAttn >= 75 ? '#10b981' : '#ef4444'} height={68} />
          ) : (
            <div className="h-16 flex items-center justify-center text-slate-300 text-xs">
              Attend classes to see trend
            </div>
          )}
          {/* Threshold line label */}
          <p className="text-xs text-slate-400 mt-1 text-right">75% minimum required</p>
        </div>
      </div>

      {/* ── Row 2: Assignments + Fee + Attendance Grid ────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Assignments segmented bar */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <SH title="Assignments" sub={enrollments[0]?.course_name || ''}
            icon={FileText} color="text-amber-600 bg-amber-50" to="/student/assignments" />

          {totalAssign > 0 ? (
            <>
              <div className="flex items-end gap-2 mb-3">
                <p className="text-3xl font-black text-slate-800">{totalAssign}</p>
                <p className="text-slate-400 text-sm mb-1">total</p>
              </div>
              <SegmentBar
                segments={[
                  { value: graded,    color: '#10b981', label: 'Graded' },
                  { value: submitted - graded, color: '#6366f1', label: 'Submitted' },
                  { value: pending,   color: '#f59e0b', label: 'Pending' },
                ]}
                height={14}
              />
              <div className="mt-3 grid grid-cols-3 gap-2">
                {[
                  { label: 'Graded', value: graded, color: 'bg-emerald-100 text-emerald-700' },
                  { label: 'Submitted', value: submitted - graded, color: 'bg-indigo-100 text-indigo-700' },
                  { label: 'Pending', value: pending, color: pending > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500' },
                ].map(s => (
                  <div key={s.label} className={`${s.color} rounded-xl p-2 text-center`}>
                    <p className="text-lg font-black">{s.value}</p>
                    <p className="text-xs opacity-70">{s.label}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <FileText size={28} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No assignments yet</p>
            </div>
          )}
        </div>

        {/* Fee horizontal bar */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <SH title="Fee Status" sub="Current semester"
            icon={CreditCard} color="text-rose-600 bg-rose-50" to="/student/fee" />
          {voucherList.length > 0 ? (
            <>
              <div className="flex items-end gap-2 mb-4">
                <p className="text-3xl font-black text-slate-800">
                  Rs {Math.round(totalPaid / 1000)}k
                </p>
                <p className="text-slate-400 text-sm mb-1">paid</p>
              </div>
              <FeeBar paid={paidFee} pending={pendingFee} overdue={overdueFee} />
              {overdueFee > 0 && (
                <div className="mt-3 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-2.5">
                  <AlertTriangle size={14} className="text-red-500 flex-shrink-0" />
                  <p className="text-red-700 text-xs font-semibold">
                    {overdueFee} overdue voucher{overdueFee > 1 ? 's' : ''} — pay now to avoid fine
                  </p>
                </div>
              )}
              {totalDue > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <p className="text-xs text-slate-500">Total Due</p>
                  <p className="text-sm font-black text-rose-600">Rs {totalDue.toLocaleString()}</p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <CreditCard size={28} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No vouchers found</p>
            </div>
          )}
        </div>

        {/* Attendance dot grid (last 28 sessions) */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <SH title="Attendance Grid" sub="Last 28 sessions — dot per class"
            icon={Calendar} color="text-teal-600 bg-teal-50" to="/student/attendance" />
          <AttendanceGrid records={attnRecords} />
          {attnRecords.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-2">
              {[
                ['#10b981', 'Present'], ['#ef4444', 'Absent'],
                ['#f59e0b', 'Late'], ['#6366f1', 'Excused'],
              ].map(([color, label]) => (
                <div key={label} className="flex items-center gap-1 text-xs text-slate-500">
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
                  {label}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Row 3: My Courses + Announcements ────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Enrolled courses */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <SH title="My Courses" sub={`${totalCourses} enrolled this semester`}
            icon={BookOpen} color="text-blue-600 bg-blue-50" to="/student/courses" />
          {enrollments.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <BookOpen size={28} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No courses enrolled</p>
            </div>
          ) : (
            <div className="space-y-2">
              {enrollments.slice(0, 5).map((enr, i) => {
                const colors = ['#6366f1','#3b82f6','#10b981','#f59e0b','#ef4444']
                const color = colors[i % colors.length]
                return (
                  <div key={enr.offering_id}
                    onClick={() => navigate(`/student/courses/${enr.offering_id}`)}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors group">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-black flex-shrink-0"
                      style={{ backgroundColor: color }}>
                      {(enr.course_code || enr.course_name || '?').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{enr.course_name}</p>
                      <p className="text-xs text-slate-400 truncate">
                        {enr.course_code} • {enr.instructor || 'Instructor'}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0
                      ${enr.is_approved ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {enr.is_approved ? 'Approved' : 'Pending'}
                    </span>
                    <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-500 flex-shrink-0" />
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Announcements */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <SH title="Announcements" sub="Latest notices"
            icon={Bell} color="text-orange-600 bg-orange-50" to="/student/announcements" />
          {announcements.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Bell size={28} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No announcements</p>
            </div>
          ) : (
            <div className="space-y-3">
              {announcements.map(ann => {
                const pMap = {
                  urgent: 'bg-red-100 text-red-700',
                  high:   'bg-orange-100 text-orange-700',
                  normal: 'bg-blue-100 text-blue-700',
                  low:    'bg-slate-100 text-slate-500',
                }
                const diffMs  = Date.now() - new Date(ann.created_at)
                const diffH   = Math.floor(diffMs / 3600000)
                const diffD   = Math.floor(diffMs / 86400000)
                const timeStr = diffD > 0 ? `${diffD}d ago` : diffH > 0 ? `${diffH}h ago` : 'Just now'
                return (
                  <div key={ann.id} className="flex gap-3 py-2.5 border-b border-slate-50 last:border-0">
                    <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bell size={13} className="text-orange-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <p className="text-sm font-semibold text-slate-800 truncate">{ann.title}</p>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${pMap[ann.priority] || pMap.normal}`}>
                          {ann.priority}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-slate-400 line-clamp-1 flex-1">{ann.content}</p>
                        <span className="text-xs text-slate-300 flex-shrink-0">{timeStr}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── AI Recommendations strip ─────────────────────── */}
      {recommendations.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-950 to-violet-950 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <BrainCircuit size={16} className="text-indigo-400" />
            <p className="text-white font-bold text-sm">AI Recommendations</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {recommendations.slice(0, 3).map((rec, i) => {
              const pColor = rec.priority === 'high' ? 'border-red-500/40 bg-red-500/10' :
                             rec.priority === 'medium' ? 'border-amber-500/40 bg-amber-500/10' :
                             'border-white/10 bg-white/5'
              const dot = rec.priority === 'high' ? 'bg-red-400' :
                          rec.priority === 'medium' ? 'bg-amber-400' : 'bg-emerald-400'
              return (
                <div key={i} className={`rounded-xl p-3 border ${pColor}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${dot} mb-2`} />
                  <p className="text-white/80 text-xs leading-relaxed">{rec.message}</p>
                </div>
              )
            })}
          </div>
          <button onClick={() => navigate('/student/ai')}
            className="mt-3 flex items-center gap-1.5 text-indigo-300 text-xs font-semibold hover:text-white transition-colors">
            <Zap size={12} /> Chat with AI Assistant for personalized help
          </button>
        </div>
      )}

      {/* ── Quick Actions ─────────────────────────────────── */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {[
          { label: 'Courses',     icon: BookOpen,       to: '/student/courses',      color: 'bg-blue-50 text-blue-600 border-blue-100' },
          { label: 'Attendance',  icon: ClipboardCheck, to: '/student/attendance',   color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
          { label: 'Assignments', icon: FileText,       to: '/student/assignments',  color: 'bg-amber-50 text-amber-600 border-amber-100' },
          { label: 'Quizzes',     icon: PenSquare,      to: '/student/quizzes',      color: 'bg-violet-50 text-violet-600 border-violet-100' },
          { label: 'Fee',         icon: CreditCard,     to: '/student/fee',          color: 'bg-rose-50 text-rose-600 border-rose-100' },
          { label: 'AI Chat',     icon: BrainCircuit,   to: '/student/ai',           color: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
        ].map(action => {
          const Ic = action.icon
          return (
            <button key={action.label} onClick={() => navigate(action.to)}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border cursor-pointer hover:shadow-sm hover:-translate-y-0.5 transition-all ${action.color}`}>
              <Ic size={20} />
              <span className="text-xs font-semibold">{action.label}</span>
            </button>
          )
        })}
      </div>

    </div>
  )
}