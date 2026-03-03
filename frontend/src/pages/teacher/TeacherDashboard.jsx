import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { teacherAPI } from '../../api/teacher.api'
import { authStore } from '../../store/authStore'
import { formatDate, timeAgo } from '../../utils/helpers'
import toast from 'react-hot-toast'
import {
  BookOpen, Users, ClipboardCheck, FileText,
  PenSquare, BarChart2, Bell, ChevronRight,
  AlertTriangle, Clock, CheckCircle2, Loader2,
  TrendingUp, BookMarked
} from 'lucide-react'

// ── Stat Card ──────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color }) {
  const colors = {
    blue:    { bg: 'bg-blue-50',    icon: 'bg-blue-100 text-blue-600',    val: 'text-blue-700' },
    purple:  { bg: 'bg-purple-50',  icon: 'bg-purple-100 text-purple-600', val: 'text-purple-700' },
    emerald: { bg: 'bg-emerald-50', icon: 'bg-emerald-100 text-emerald-600',val: 'text-emerald-700' },
    orange:  { bg: 'bg-orange-50',  icon: 'bg-orange-100 text-orange-600', val: 'text-orange-700' },
  }
  const c = colors[color] || colors.blue
  return (
    <div className={`${c.bg} rounded-2xl p-5 border border-white`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 ${c.icon} rounded-xl flex items-center justify-center`}>
          <Icon size={18} />
        </div>
      </div>
      <p className={`text-2xl font-display font-bold ${c.val}`}>{value ?? '—'}</p>
      <p className="text-slate-600 text-sm font-medium mt-0.5">{label}</p>
      {sub && <p className="text-slate-400 text-xs mt-1">{sub}</p>}
    </div>
  )
}

// ── Quick Action Button ────────────────────────────
function QuickAction({ icon: Icon, label, to, color = 'blue' }) {
  const navigate = useNavigate()
  const colors = {
    blue:   'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20',
    purple: 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/20',
    emerald:'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20',
    orange: 'bg-orange-500 hover:bg-orange-400 shadow-orange-500/20',
  }
  return (
    <button
      onClick={() => navigate(to)}
      className={`flex items-center gap-2.5 px-4 py-2.5 ${colors[color]} text-white text-sm font-semibold rounded-xl transition-colors shadow-md`}
    >
      <Icon size={16} />
      {label}
    </button>
  )
}

// ── Main Dashboard ─────────────────────────────────
export default function TeacherDashboard() {
  const user = authStore.getUser()
  const navigate = useNavigate()
  const [offerings, setOfferings] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [offRes, annRes] = await Promise.all([
          teacherAPI.getMyOfferings(),
          teacherAPI.getAnnouncements(1, 5),
        ])
        setOfferings(offRes.data.data?.offerings || [])
        setAnnouncements(annRes.data.data?.announcements || [])
      } catch { toast.error('Failed to load dashboard') }
      finally { setLoading(false) }
    }
    fetchAll()
  }, [])

  // Computed stats
  const totalStudents = offerings.reduce((s, o) => s + (o.enrolled_count || 0), 0)
  const totalOfferings = offerings.length
  const pendingGrading = offerings.reduce((s, o) => s + (o.pending_grading || 0), 0)

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-800">
            Welcome back, {user?.full_name?.split(' ')[0] || 'Teacher'} 👋
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          <QuickAction icon={ClipboardCheck} label="Mark Attendance" to="/teacher/attendance" color="blue" />
          <QuickAction icon={FileText}       label="Grade Assignment" to="/teacher/assignments" color="purple" />
          <QuickAction icon={PenSquare}      label="Create Quiz" to="/teacher/quizzes" color="emerald" />
          <QuickAction icon={Bell}           label="Announcement" to="/teacher/announcements" color="orange" />
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={BookOpen}      label="Active Courses"   value={totalOfferings} sub="This semester"       color="blue" />
        <StatCard icon={Users}         label="Total Students"   value={totalStudents}  sub="Across all courses"  color="purple" />
        <StatCard icon={ClipboardCheck}label="Sessions Given"   value={offerings.reduce((s,o)=>s+(o.total_sessions||0),0)} sub="Total lectures" color="emerald"/>
        <StatCard icon={AlertTriangle} label="Pending Grading"  value={pendingGrading} sub="Submissions waiting"  color="orange" />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* My Courses — 2/3 */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-display font-bold text-slate-800 text-lg">My Courses</h2>
              <p className="text-slate-400 text-sm">{totalOfferings} active offerings</p>
            </div>
            <button onClick={() => navigate('/teacher/courses')}
              className="flex items-center gap-1 text-blue-600 text-sm font-medium hover:text-blue-700">
              View all <ChevronRight size={16} />
            </button>
          </div>

          {offerings.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen size={36} className="text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No courses assigned this semester</p>
            </div>
          ) : (
            <div className="space-y-3">
              {offerings.slice(0, 5).map(o => (
                <div key={o.id}
                  onClick={() => navigate(`/teacher/attendance?offering=${o.id}`)}
                  className="flex items-center gap-4 p-3.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group border border-transparent hover:border-slate-200">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <BookMarked size={17} className="text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-700 truncate">{o.course_name}</p>
                    <p className="text-xs text-slate-400">
                      Section {o.section} · {o.room_number || 'No room'} · {o.enrolled_count || 0} students
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {(o.pending_submissions > 0) && (
                      <span className="bg-orange-100 text-orange-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                        {o.pending_submissions} pending
                      </span>
                    )}
                    <span className="bg-slate-100 text-slate-500 text-xs px-2.5 py-0.5 rounded-full">
                      {o.total_sessions || 0} sessions
                    </span>
                    <ChevronRight size={15} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Announcements — 1/3 */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-bold text-slate-800 text-lg">Announcements</h2>
            <button onClick={() => navigate('/teacher/announcements')}
              className="text-blue-600 text-xs font-medium hover:text-blue-700">See all</button>
          </div>
          {announcements.length === 0 ? (
            <div className="text-center py-8">
              <Bell size={32} className="text-slate-300 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">No announcements yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {announcements.map(ann => (
                <div key={ann.id} className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
                  onClick={() => navigate('/teacher/announcements')}>
                  <p className="text-sm font-semibold text-slate-700 line-clamp-1">{ann.title}</p>
                  <p className="text-xs text-slate-400 mt-1">{timeAgo(ann.created_at)}</p>
                </div>
              ))}
            </div>
          )}
          <button onClick={() => navigate('/teacher/announcements')}
            className="w-full mt-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
            <Bell size={14} /> New Announcement
          </button>
        </div>
      </div>
    </div>
  )
}
