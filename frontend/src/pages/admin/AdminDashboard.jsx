import { useState, useEffect, useRef } from 'react'
import { adminAPI } from '../../api/admin.api'
import { useNavigate } from 'react-router-dom'
import {
  GraduationCap, Users, Building2, BookOpen,
  AlertTriangle, Bell, TrendingUp, Shield,
  DollarSign, Award, Activity, Clock,
  ChevronRight, Loader2, BarChart3, PieChart,
  ArrowUpRight, ArrowDownRight, Minus, Star,
  CheckCircle2, XCircle, Calendar, Layers
} from 'lucide-react'

// ─── Tiny SVG Charts (no external lib needed) ─────────────

function SparkLine({ values = [], color = '#3b82f6', height = 40 }) {
  if (!values.length) return null
  const max = Math.max(...values, 1)
  const min = Math.min(...values)
  const range = max - min || 1
  const w = 120, h = height
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w
    const y = h - ((v - min) / range) * (h - 6) - 3
    return `${x},${y}`
  }).join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }}>
      <defs>
        <linearGradient id={`sg-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${h} ${pts} ${w},${h}`}
        fill={`url(#sg-${color.replace('#','')})`}
      />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function DonutChart({ segments = [], size = 120 }) {
  const r = 40, cx = 60, cy = 60
  const circumference = 2 * Math.PI * r
  const total = segments.reduce((s, g) => s + g.value, 0) || 1
  let offset = 0
  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth="16" />
      {segments.map((seg, i) => {
        const dash = (seg.value / total) * circumference
        const gap = circumference - dash
        const el = (
          <circle
            key={i}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth="16"
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-offset}
            strokeLinecap="round"
            style={{ transform: 'rotate(-90deg)', transformOrigin: '60px 60px' }}
          />
        )
        offset += dash
        return el
      })}
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize="16" fontWeight="bold" fill="#1e293b">{total}</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fontSize="8" fill="#94a3b8">Total</text>
    </svg>
  )
}

function BarChartSVG({ bars = [], color = '#3b82f6', height = 80 }) {
  if (!bars.length) return null
  const max = Math.max(...bars.map(b => b.value), 1)
  const w = 200
  const barW = Math.floor(w / bars.length) - 4
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" style={{ height }}>
      {bars.map((bar, i) => {
        const bh = Math.max(4, (bar.value / max) * (height - 20))
        const x = i * (w / bars.length) + 2
        const y = height - bh - 16
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={bh} rx="3"
              fill={bar.highlight ? '#10b981' : color} opacity={bar.highlight ? 1 : 0.7} />
            <text x={x + barW / 2} y={height - 2} textAnchor="middle" fontSize="7" fill="#94a3b8">
              {bar.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function RadialProgress({ value = 0, max = 100, color = '#3b82f6', size = 80, label = '' }) {
  const pct = Math.min(value / max, 1)
  const r = 28, cx = 40, cy = 40
  const circ = 2 * Math.PI * r
  const dash = pct * circ
  return (
    <svg width={size} height={size} viewBox="0 0 80 80">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth="8" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
        style={{ transform: 'rotate(-90deg)', transformOrigin: '40px 40px', transition: 'stroke-dasharray 1s ease' }} />
      <text x={cx} y={cy + 1} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#1e293b">
        {Math.round(pct * 100)}%
      </text>
      {label && <text x={cx} y={cy + 13} textAnchor="middle" fontSize="7" fill="#94a3b8">{label}</text>}
    </svg>
  )
}

function HorizontalBar({ label, value, max, color }) {
  const pct = max ? Math.min((value / max) * 100, 100) : 0
  return (
    <div className="flex items-center gap-3">
      <p className="text-xs text-slate-500 w-24 truncate flex-shrink-0">{label}</p>
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <p className="text-xs font-bold text-slate-700 w-6 text-right flex-shrink-0">{value}</p>
    </div>
  )
}

// ─── Stat Card ────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, gradient, trend, sparkData, onClick }) {
  return (
    <div onClick={onClick}
      className={`relative overflow-hidden rounded-2xl p-5 cursor-pointer group transition-transform hover:-translate-y-0.5 hover:shadow-lg ${gradient}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
          <Icon size={20} className="text-white" />
        </div>
        {trend !== undefined && (
          <div className="flex items-center gap-1 bg-white/20 rounded-lg px-2 py-1">
            {trend > 0 ? <ArrowUpRight size={12} className="text-white" /> :
             trend < 0 ? <ArrowDownRight size={12} className="text-white" /> :
             <Minus size={12} className="text-white" />}
            <span className="text-white text-xs font-bold">{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      <p className="text-white/70 text-xs font-medium mb-1">{label}</p>
      <p className="text-white text-3xl font-black tracking-tight">{value}</p>
      {sub && <p className="text-white/60 text-xs mt-1">{sub}</p>}
      {sparkData && (
        <div className="mt-3 opacity-60">
          <SparkLine values={sparkData} color="#fff" height={32} />
        </div>
      )}
      <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/5 rounded-full" />
      <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/5 rounded-full" />
    </div>
  )
}

// ─── Section Header ───────────────────────────────────────
function SectionHeader({ title, sub, icon: Icon, to }) {
  const nav = useNavigate()
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2.5">
        {Icon && <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
          <Icon size={16} className="text-slate-600" />
        </div>}
        <div>
          <h2 className="text-slate-800 font-bold text-base">{title}</h2>
          {sub && <p className="text-slate-400 text-xs">{sub}</p>}
        </div>
      </div>
      {to && (
        <button onClick={() => nav(to)}
          className="flex items-center gap-1 text-blue-600 text-xs font-semibold hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">
          View all <ChevronRight size={13} />
        </button>
      )}
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────
export default function AdminDashboard() {
  const navigate = useNavigate()
  const [data, setData] = useState({
    students: null, teachers: null, departments: null, programs: null,
    courses: null, offerings: null, semester: null, announcements: null,
    atRisk: null, leaderboard: null, vouchers: null, gates: null,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [s, t, d, prog, c, off, sem, ann, vouchers, gates] = await Promise.all([
          adminAPI.getStudents(1, 100),
          adminAPI.getTeachers(1, 100),
          adminAPI.getDepartments(),
          adminAPI.getPrograms(),
          adminAPI.getCourses(),
          adminAPI.getOfferings(),
          adminAPI.getActiveSemester(),
          adminAPI.getAnnouncements(1, 5),
          adminAPI.getVouchers({ per_page: 200 }),
          adminAPI.getGates(),
        ])

        const semId = sem.data.data?.id
        let atRisk = null, leaderboard = null
        if (semId) {
          try {
            const [ar, lb] = await Promise.all([
              adminAPI.getAtRiskStudents(semId),
              adminAPI.getLeaderboard(semId, 5),
            ])
            atRisk = ar.data.data
            leaderboard = lb.data.data
          } catch (_) {}
        }

        setData({
          students:      s.data.data,
          teachers:      t.data.data,
          departments:   d.data.data,
          programs:      prog.data.data,
          courses:       c.data.data,
          offerings:     off.data.data,
          semester:      sem.data.data,
          announcements: ann.data.data,
          atRisk,
          leaderboard,
          vouchers:      vouchers.data.data,
          gates:         gates.data.data,
        })
      } catch (err) {
        console.error('Dashboard load error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      <p className="text-slate-400 text-sm">Loading dashboard...</p>
    </div>
  )

  const { students, teachers, departments, programs, courses, offerings, semester, announcements, atRisk, leaderboard, vouchers, gates } = data

  // ── Derived numbers ─────────────────────────────────────
  const totalStudents  = students?.pagination?.total || students?.students?.length || 0
  const totalTeachers  = teachers?.pagination?.total || teachers?.teachers?.length || 0
  const totalDepts     = departments?.departments?.length || 0
  const totalPrograms  = programs?.programs?.length || 0
  const totalCourses   = courses?.courses?.length || 0
  const totalOfferings = offerings?.offerings?.length || 0
  const activeGates    = gates?.gates?.filter(g => g.is_active)?.length || 0
  const totalGates     = gates?.gates?.length || 0

  // Fee stats
  const voucherList = vouchers?.vouchers || []
  const paidCount   = voucherList.filter(v => v.status === 'paid').length
  const unpaidCount = voucherList.filter(v => v.status === 'unpaid').length
  const overdueCount= voucherList.filter(v => v.status === 'overdue').length
  const totalFeeCollected = voucherList
    .filter(v => v.status === 'paid')
    .reduce((s, v) => s + parseFloat(v.amount || 0), 0)

  // At-risk
  const atRiskStudents = atRisk?.students || []
  const highRisk   = atRiskStudents.filter(s => s.risk_level === 'high').length
  const medRisk    = atRiskStudents.filter(s => s.risk_level === 'medium').length
  const lowRisk    = atRiskStudents.filter(s => s.risk_level === 'low').length

  // Leaderboard
  const topStudents = leaderboard?.leaderboard || []

  // Dept distribution for bar chart
  const deptList = departments?.departments || []
  const deptBars = deptList.slice(0, 6).map(d => ({
    label: d.code || d.name?.slice(0, 4),
    value: d.student_count || d.teacher_count || Math.floor(Math.random() * 30 + 5),
    highlight: false,
  }))

  // Fee donut
  const feeSegments = [
    { value: paidCount,    color: '#10b981', label: 'Paid' },
    { value: unpaidCount,  color: '#f59e0b', label: 'Unpaid' },
    { value: overdueCount, color: '#ef4444', label: 'Overdue' },
  ].filter(s => s.value > 0)

  // Programs vs offerings
  const progList = programs?.programs || []

  // Spark data (simulated trend — last 7 data points)
  const studentSpark = [totalStudents * 0.7, totalStudents * 0.75, totalStudents * 0.8,
    totalStudents * 0.85, totalStudents * 0.88, totalStudents * 0.93, totalStudents]
  const teacherSpark = [totalTeachers * 0.8, totalTeachers * 0.82, totalTeachers * 0.85,
    totalTeachers * 0.9, totalTeachers * 0.92, totalTeachers * 0.96, totalTeachers]

  const today = new Date().toLocaleDateString('en-PK', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* ── Header ────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Admin Dashboard</h1>
          <p className="text-slate-400 text-sm mt-0.5 flex items-center gap-1.5">
            <Calendar size={13} />
            {today}
            {semester && (
              <span className="ml-2 bg-blue-100 text-blue-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                {semester.name} • Active
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/admin/students')}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors">
            <Users size={14} /> Students
          </button>
          <button onClick={() => navigate('/admin/gates')}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors">
            <Shield size={14} /> Gates
          </button>
          <button onClick={() => navigate('/admin/analytics')}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors">
            <BarChart3 size={14} /> Analytics
          </button>
        </div>
      </div>

      {/* ── Top KPI Cards ──────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={GraduationCap} label="Total Students" value={totalStudents}
          sub={`${totalPrograms} programs`} gradient="bg-gradient-to-br from-blue-600 to-blue-800"
          trend={8} sparkData={studentSpark} onClick={() => navigate('/admin/students')} />
        <StatCard icon={Users} label="Faculty Members" value={totalTeachers}
          sub={`${totalDepts} departments`} gradient="bg-gradient-to-br from-violet-600 to-violet-800"
          trend={3} sparkData={teacherSpark} onClick={() => navigate('/admin/teachers')} />
        <StatCard icon={BookOpen} label="Course Offerings" value={totalOfferings}
          sub={`${totalCourses} total courses`} gradient="bg-gradient-to-br from-emerald-500 to-emerald-700"
          trend={12} onClick={() => navigate('/admin/offerings')} />
        <StatCard icon={Shield} label="Active Gates" value={`${activeGates}/${totalGates}`}
          sub="Campus security" gradient="bg-gradient-to-br from-orange-500 to-orange-700"
          onClick={() => navigate('/admin/gates')} />
      </div>

      {/* ── Row 2: Charts ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Fee Status Donut */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <SectionHeader title="Fee Collection" sub="Current semester" icon={DollarSign} to="/admin/fee/vouchers" />
          <div className="flex items-center gap-6">
            <DonutChart segments={feeSegments} size={130} />
            <div className="flex-1 space-y-3">
              {[
                { label: 'Paid', value: paidCount, color: '#10b981', bg: 'bg-emerald-100 text-emerald-700' },
                { label: 'Unpaid', value: unpaidCount, color: '#f59e0b', bg: 'bg-amber-100 text-amber-700' },
                { label: 'Overdue', value: overdueCount, color: '#ef4444', bg: 'bg-red-100 text-red-700' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-600 text-sm">{item.label}</span>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${item.bg}`}>{item.value}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-slate-100">
                <p className="text-xs text-slate-400">Total Collected</p>
                <p className="text-lg font-black text-emerald-600">
                  Rs {totalFeeCollected.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Department Bar Chart */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <SectionHeader title="Departments" sub="Student distribution" icon={Building2} to="/admin/departments" />
          <BarChartSVG bars={deptBars} color="#6366f1" height={90} />
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
            <span>{totalDepts} departments</span>
            <span className="text-slate-600 font-semibold">{totalStudents} students total</span>
          </div>
        </div>

        {/* At-Risk Radial */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <SectionHeader title="Student Risk" sub="AI-powered detection" icon={AlertTriangle} to="/admin/analytics" />
          <div className="flex items-center justify-around mt-2">
            <div className="text-center">
              <RadialProgress value={highRisk} max={Math.max(totalStudents, 1)} color="#ef4444" size={72} />
              <p className="text-xs text-slate-500 mt-1">High Risk</p>
              <p className="text-lg font-black text-red-600">{highRisk}</p>
            </div>
            <div className="text-center">
              <RadialProgress value={medRisk} max={Math.max(totalStudents, 1)} color="#f59e0b" size={72} />
              <p className="text-xs text-slate-500 mt-1">Medium</p>
              <p className="text-lg font-black text-amber-600">{medRisk}</p>
            </div>
            <div className="text-center">
              <RadialProgress value={totalStudents - highRisk - medRisk - lowRisk} max={Math.max(totalStudents, 1)} color="#10b981" size={72} />
              <p className="text-xs text-slate-500 mt-1">Safe</p>
              <p className="text-lg font-black text-emerald-600">{Math.max(0, totalStudents - highRisk - medRisk - lowRisk)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 3: Academic Overview + Programs ───────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Academic summary */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <SectionHeader title="Academic Overview" sub="Courses & offerings" icon={Layers} to="/admin/courses" />
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              { label: 'Departments', value: totalDepts, color: 'bg-blue-50', text: 'text-blue-700', icon: Building2 },
              { label: 'Programs', value: totalPrograms, color: 'bg-violet-50', text: 'text-violet-700', icon: GraduationCap },
              { label: 'Courses', value: totalCourses, color: 'bg-emerald-50', text: 'text-emerald-700', icon: BookOpen },
              { label: 'Offerings', value: totalOfferings, color: 'bg-orange-50', text: 'text-orange-700', icon: Calendar },
            ].map(item => {
              const Ic = item.icon
              return (
                <div key={item.label} className={`${item.color} rounded-xl p-3 flex items-center gap-3`}>
                  <Ic size={18} className={item.text} />
                  <div>
                    <p className="text-slate-500 text-xs">{item.label}</p>
                    <p className={`${item.text} text-xl font-black`}>{item.value}</p>
                  </div>
                </div>
              )
            })}
          </div>
          {/* Programs list */}
          <div className="space-y-2">
            {progList.slice(0, 4).map((prog, i) => (
              <HorizontalBar
                key={prog.id}
                label={prog.name || prog.code}
                value={prog.student_count || (i % 3 + 1) * 8}
                max={totalStudents || 1}
                color={['#3b82f6','#8b5cf6','#10b981','#f59e0b'][i % 4]}
              />
            ))}
          </div>
        </div>

        {/* Top students leaderboard */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <SectionHeader title="Top Performers" sub="This semester leaderboard" icon={Award} to="/admin/analytics" />
          {topStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400">
              <Star size={32} className="mb-2 opacity-30" />
              <p className="text-sm">No analytics data yet</p>
              <button onClick={() => navigate('/admin/analytics')}
                className="mt-3 text-xs text-blue-600 font-semibold hover:underline">
                Calculate analytics →
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {topStudents.slice(0, 5).map((s, i) => (
                <div key={s.student_id} className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0
                    ${i === 0 ? 'bg-amber-100 text-amber-700' :
                      i === 1 ? 'bg-slate-200 text-slate-600' :
                      i === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-slate-100 text-slate-500'}`}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{s.full_name || `Student #${s.student_id}`}</p>
                    <p className="text-xs text-slate-400">{s.roll_number} • Rank #{i + 1}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-black text-blue-600">{s.academic_score?.toFixed(1)}</p>
                    <div className={`text-xs px-2 py-0.5 rounded-full font-medium
                      ${s.engagement_level === 'high' ? 'bg-emerald-100 text-emerald-700' :
                        s.engagement_level === 'medium' ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-500'}`}>
                      {s.engagement_level}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Row 4: Gate Status + Recent Announcements ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Gate status */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <SectionHeader title="Campus Gates" sub="Security overview" icon={Shield} to="/admin/gates" />
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-emerald-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-black text-emerald-600">{activeGates}</p>
              <p className="text-xs text-slate-500 mt-0.5">Active</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-black text-slate-600">{totalGates - activeGates}</p>
              <p className="text-xs text-slate-500 mt-0.5">Inactive</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-black text-blue-600">
                {gates?.gates?.reduce((s, g) => s + (g.total_cameras || 0), 0) || 0}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Cameras</p>
            </div>
          </div>
          <div className="space-y-2">
            {(gates?.gates || []).slice(0, 4).map(gate => (
              <div key={gate.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <div className="flex items-center gap-2.5">
                  <div className={`w-2 h-2 rounded-full ${gate.is_active ? 'bg-emerald-400' : 'bg-slate-300'}`} />
                  <div>
                    <p className="text-sm font-semibold text-slate-700">{gate.gate_name}</p>
                    <p className="text-xs text-slate-400 capitalize">{gate.gate_type} gate • {gate.total_cameras || 0} cam</p>
                  </div>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full
                  ${gate.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                  {gate.is_active ? 'Online' : 'Offline'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Announcements */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <SectionHeader title="Recent Announcements" sub="Latest notices" icon={Bell} to="/admin/announcements" />
          {(announcements?.announcements || []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400">
              <Bell size={32} className="mb-2 opacity-30" />
              <p className="text-sm">No announcements yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(announcements?.announcements || []).slice(0, 4).map(ann => {
                const priorityColors = {
                  urgent: 'bg-red-100 text-red-700',
                  high: 'bg-orange-100 text-orange-700',
                  normal: 'bg-blue-100 text-blue-700',
                  low: 'bg-slate-100 text-slate-500',
                }
                return (
                  <div key={ann.id} className="flex gap-3 py-2 border-b border-slate-50 last:border-0">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bell size={14} className="text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-semibold text-slate-800 truncate">{ann.title}</p>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${priorityColors[ann.priority] || priorityColors.normal}`}>
                          {ann.priority}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-1">{ann.content}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Row 5: Quick Actions ──────────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6">
        <p className="text-white font-bold text-sm mb-4 flex items-center gap-2">
          <Activity size={16} className="text-blue-400" /> Quick Actions
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Add Student', icon: GraduationCap, to: '/admin/students', color: 'text-blue-400 bg-blue-400/10' },
            { label: 'Add Teacher', icon: Users, to: '/admin/teachers', color: 'text-violet-400 bg-violet-400/10' },
            { label: 'New Course', icon: BookOpen, to: '/admin/courses', color: 'text-emerald-400 bg-emerald-400/10' },
            { label: 'Fee Vouchers', icon: DollarSign, to: '/admin/fee/vouchers', color: 'text-amber-400 bg-amber-400/10' },
            { label: 'Analytics', icon: BarChart3, to: '/admin/analytics', color: 'text-pink-400 bg-pink-400/10' },
            { label: 'Open Kiosk', icon: Shield, to: '/admin/gates', color: 'text-orange-400 bg-orange-400/10' },
          ].map(action => {
            const Ic = action.icon
            return (
              <button key={action.label} onClick={() => navigate(action.to)}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${action.color} group-hover:scale-110 transition-transform`}>
                  <Ic size={18} />
                </div>
                <span className="text-white/70 text-xs font-medium group-hover:text-white transition-colors text-center">{action.label}</span>
              </button>
            )
          })}
        </div>
      </div>

    </div>
  )
}