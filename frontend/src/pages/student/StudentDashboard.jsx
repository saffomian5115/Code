import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { studentAPI } from '../../api/student.api'
import { authStore } from '../../store/authStore'
import { formatDate, timeAgo, getAttendanceColor, formatCurrency } from '../../utils/helpers'
import toast from 'react-hot-toast'
import {
  BookOpen, ClipboardCheck, FileText, PenSquare,
  BarChart2, CreditCard, Bell, TrendingUp,
  AlertTriangle, ChevronRight, Loader2, BrainCircuit,
  Calendar, Award
} from 'lucide-react'

function StatCard({ icon: Icon, label, value, sub, color, onClick }) {
  const colors = {
    blue:    'bg-blue-50 text-blue-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    purple:  'bg-purple-50 text-purple-700',
    orange:  'bg-orange-50 text-orange-700',
    red:     'bg-red-50 text-red-700',
  }
  return (
    <div onClick={onClick} className={`${colors[color]} rounded-2xl p-5 cursor-pointer hover:shadow-sm transition-all`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={18} />
        <span className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</span>
      </div>
      <p className="text-3xl font-display font-bold">{value ?? '—'}</p>
      {sub && <p className="text-xs opacity-60 mt-1">{sub}</p>}
    </div>
  )
}

export default function StudentDashboard() {
  const user = authStore.getUser()
  const navigate = useNavigate()
  const [enrollments, setEnrollments] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [enrRes, annRes] = await Promise.all([
          studentAPI.getEnrollments(),
          studentAPI.getAnnouncements(1),
        ])
        setEnrollments(enrRes.data.data?.enrollments || [])
        setAnnouncements((annRes.data.data?.announcements || []).slice(0, 4))
        // Try analytics (may not exist yet)
        try {
          const aRes = await studentAPI.getAnalytics()
          setAnalytics(aRes.data.data)
        } catch { /* analytics optional */ }
      } catch { toast.error('Failed to load dashboard') }
      finally { setLoading(false) }
    }
    fetchAll()
  }, [])

  const totalCourses = enrollments.length
  const avgAttendance = analytics?.breakdown?.lecture_attendance ?? null
  const aiScore = analytics?.overall_score ?? null
  const atRisk = analytics?.risk_assessment?.at_risk

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-800">
            Welcome, {user?.full_name?.split(' ')[0] || 'Student'} 👋
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        {atRisk && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
            <AlertTriangle size={16} className="text-red-500 flex-shrink-0" />
            <span className="text-sm font-semibold text-red-700">At-Risk: Check your attendance</span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={BookOpen}       label="Courses"     value={totalCourses}                    sub="This semester"        color="blue"    onClick={() => navigate('/student/courses')} />
        <StatCard icon={ClipboardCheck} label="Attendance"  value={avgAttendance ? `${avgAttendance}%` : '—'} sub="Average"  color={avgAttendance < 75 ? 'red' : 'emerald'} onClick={() => navigate('/student/attendance')} />
        <StatCard icon={BrainCircuit}   label="AI Score"    value={aiScore ? aiScore.toFixed(1) : '—'} sub="Performance score" color="purple"  onClick={() => navigate('/student/results')} />
        <StatCard icon={CreditCard}     label="Fee"         value="Check"                           sub="View vouchers"        color="orange"  onClick={() => navigate('/student/fee')} />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* My Courses */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-bold text-slate-800 text-lg">My Courses</h2>
            <button onClick={() => navigate('/student/courses')} className="text-blue-600 text-sm font-medium flex items-center gap-1 hover:text-blue-700">
              View all <ChevronRight size={15} />
            </button>
          </div>
          {enrollments.length === 0 ? (
            <div className="text-center py-10">
              <BookOpen size={36} className="text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">No courses enrolled this semester</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {enrollments.slice(0, 5).map(e => (
                <div key={e.enrollment_id}
                  onClick={() => navigate('/student/attendance')}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group">
                  <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <BookOpen size={15} className="text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-700 truncate text-sm">{e.course_name}</p>
                    <p className="text-xs text-slate-400">{e.course_code} · Sec {e.section} · {e.instructor || 'TBA'}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {e.grade_letter && (
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-lg">{e.grade_letter}</span>
                    )}
                    <span className="text-xs text-slate-400">{e.credit_hours} cr</span>
                    <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-500" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Announcements */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-bold text-slate-800 text-lg">Announcements</h2>
            <button onClick={() => navigate('/student/announcements')} className="text-blue-600 text-xs font-medium">See all</button>
          </div>
          {announcements.length === 0 ? (
            <div className="text-center py-8">
              <Bell size={28} className="text-slate-300 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">No announcements</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {announcements.map(a => {
                const isUrgent = a.priority === 'urgent'
                return (
                  <div key={a.id} className={`p-3 rounded-xl cursor-pointer transition-colors ${isUrgent ? 'bg-red-50 hover:bg-red-100' : 'bg-slate-50 hover:bg-slate-100'}`}
                    onClick={() => navigate('/student/announcements')}>
                    {isUrgent && <span className="text-xs font-bold text-red-600 uppercase tracking-wide">🔴 Urgent</span>}
                    <p className="text-sm font-semibold text-slate-700 line-clamp-1 mt-0.5">{a.title}</p>
                    <p className="text-xs text-slate-400 mt-1">{timeAgo(a.created_at)}</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* AI Score Breakdown */}
      {analytics && (
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <BrainCircuit size={22} />
              <h3 className="font-display font-bold text-lg">AI Performance Score</h3>
            </div>
            <span className="text-4xl font-display font-bold">{analytics.overall_score?.toFixed(1)}</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Attendance',   val: analytics.breakdown?.lecture_attendance },
              { label: 'Assignments',  val: analytics.breakdown?.assignment_consistency },
              { label: 'Quizzes',      val: analytics.breakdown?.quiz_accuracy },
              { label: 'GPA Factor',   val: analytics.breakdown?.gpa_factor },
            ].map(m => (
              <div key={m.label} className="bg-white/10 rounded-xl p-3">
                <p className="text-white/70 text-xs mb-1">{m.label}</p>
                <div className="h-1.5 bg-white/20 rounded-full overflow-hidden mb-1.5">
                  <div className="h-full bg-white rounded-full" style={{ width: `${m.val || 0}%` }} />
                </div>
                <p className="font-bold text-sm">{m.val?.toFixed(1) || '0'}%</p>
              </div>
            ))}
          </div>
          {analytics.risk_assessment?.factors?.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {analytics.risk_assessment.factors.map((f, i) => (
                <span key={i} className="bg-red-400/30 text-white text-xs px-2.5 py-1 rounded-full font-medium">⚠ {f}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}