import { useState, useEffect } from 'react'
import { adminAPI } from '../../api/admin.api'
import {
  GraduationCap, Users, Building2, BookOpen,
  AlertTriangle, Bell, TrendingUp, Calendar,
  ChevronRight, Loader2, AlertCircle
} from 'lucide-react'

// ── Small reusable components ──────────────────────

function StatCard({ icon: Icon, label, value, sub, color }) {
  const colors = {
    blue:   { bg: 'bg-blue-50',   icon: 'bg-blue-600',   text: 'text-blue-600' },
    purple: { bg: 'bg-purple-50', icon: 'bg-purple-600', text: 'text-purple-600' },
    emerald:{ bg: 'bg-emerald-50',icon: 'bg-emerald-600',text: 'text-emerald-600' },
    orange: { bg: 'bg-orange-50', icon: 'bg-orange-500', text: 'text-orange-500' },
  }
  const c = colors[color] || colors.blue

  return (
    <div className={`${c.bg} rounded-2xl p-5 flex items-center gap-4`}>
      <div className={`${c.icon} w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-slate-500 text-sm">{label}</p>
        <p className={`${c.text} text-2xl font-display font-bold`}>{value}</p>
        {sub && <p className="text-slate-400 text-xs mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

const PRIORITY_CONFIG = {
  urgent: { bg: 'bg-red-100',    text: 'text-red-700',    label: 'Urgent' },
  high:   { bg: 'bg-orange-100', text: 'text-orange-700', label: 'High' },
  normal: { bg: 'bg-blue-100',   text: 'text-blue-700',   label: 'Normal' },
  low:    { bg: 'bg-slate-100',  text: 'text-slate-600',  label: 'Low' },
}

function PriorityBadge({ priority }) {
  const c = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.normal
  return (
    <span className={`${c.bg} ${c.text} text-xs font-semibold px-2.5 py-0.5 rounded-full`}>
      {c.label}
    </span>
  )
}

const RISK_CONFIG = {
  high:   { bg: 'bg-red-100',    text: 'text-red-700',    dot: 'bg-red-500' },
  medium: { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' },
  low:    { bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-500' },
}

function RiskBadge({ level }) {
  const c = RISK_CONFIG[level] || RISK_CONFIG.low
  return (
    <span className={`${c.bg} ${c.text} text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 w-fit`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {level?.charAt(0).toUpperCase() + level?.slice(1)}
    </span>
  )
}

function SectionHeader({ title, sub, linkTo }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h2 className="text-slate-800 font-display font-bold text-lg">{title}</h2>
        {sub && <p className="text-slate-400 text-sm">{sub}</p>}
      </div>
      {linkTo && (
        <button className="flex items-center gap-1 text-blue-600 text-sm font-medium hover:text-blue-700 transition-colors">
          View all <ChevronRight size={16} />
        </button>
      )}
    </div>
  )
}

// ── Main Dashboard ─────────────────────────────────

export default function AdminDashboard() {
  const [data, setData] = useState({
    students: null, teachers: null, departments: null,
    semester: null, announcements: null, atRisk: null,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [s, t, d, sem, ann] = await Promise.all([
          adminAPI.getStudents(1, 10),
          adminAPI.getTeachers(),
          adminAPI.getDepartments(),
          adminAPI.getActiveSemester(),
          adminAPI.getAnnouncements(),
        ])

        const semId = sem.data.data?.id
        const risk = semId ? await adminAPI.getAtRiskStudents(semId) : null

        setData({
          students:      s.data.data,
          teachers:      t.data.data,
          departments:   d.data.data,
          semester:      sem.data.data,
          announcements: ann.data.data,
          atRisk:        risk?.data?.data || null,
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
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
    </div>
  )

  const { students, teachers, departments, semester, announcements, atRisk } = data

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-800">Admin Dashboard</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {semester
              ? `${semester.name} — ${semester.start_date} to ${semester.end_date}`
              : 'No active semester'}
          </p>
        </div>
        {semester && (
          <div className="bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl flex items-center gap-2">
            <Calendar size={16} className="text-emerald-600" />
            <span className="text-emerald-700 font-semibold text-sm">{semester.name}</span>
            <span className="bg-emerald-200 text-emerald-700 text-xs px-2 py-0.5 rounded-full">Active</span>
          </div>
        )}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={GraduationCap}
          label="Total Students"
          value={students?.pagination?.total || 0}
          sub="Enrolled this semester"
          color="blue"
        />
        <StatCard
          icon={Users}
          label="Total Teachers"
          value={teachers?.pagination?.total || teachers?.teachers?.length || 0}
          sub="Active faculty"
          color="purple"
        />
        <StatCard
          icon={Building2}
          label="Departments"
          value={departments?.departments?.length || 0}
          sub="Academic departments"
          color="emerald"
        />
        <StatCard
          icon={AlertTriangle}
          label="At-Risk Students"
          value={atRisk?.at_risk_count || 0}
          sub="Need attention"
          color="orange"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Announcements — 2/3 width */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6">
          <SectionHeader
            title="Recent Announcements"
            sub={`${announcements?.pagination?.total || 0} total`}
            linkTo="/admin/announcements"
          />
          <div className="space-y-3">
            {announcements?.announcements?.slice(0, 5).map(ann => (
              <div key={ann.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bell size={14} className="text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-slate-700 font-medium text-sm truncate">{ann.title}</p>
                    <PriorityBadge priority={ann.priority} />
                  </div>
                  <p className="text-slate-400 text-xs mt-1 line-clamp-1">{ann.content}</p>
                  <p className="text-slate-300 text-xs mt-1">
                    {ann.created_by_name || 'Admin'} · {ann.target_type}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* At-Risk + Departments — 1/3 width */}
        <div className="space-y-6">

          {/* At-Risk Students */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <SectionHeader
              title="At-Risk Students"
              sub={`${atRisk?.at_risk_count || 0} need attention`}
              linkTo="/admin/students"
            />
            {atRisk?.students?.length ? (
              <div className="space-y-3">
                {atRisk.students.map(s => (
                  <div key={s.student_id} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0 text-slate-600 font-bold text-xs">
                      {s.full_name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-700 text-sm font-medium truncate">{s.full_name}</p>
                      <p className="text-slate-400 text-xs">{s.roll_number} · Score: {s.academic_score}</p>
                    </div>
                    <RiskBadge level={s.risk_level} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 rounded-xl p-3">
                <TrendingUp size={16} />
                <span className="text-sm font-medium">All students on track!</span>
              </div>
            )}
          </div>

          {/* Departments */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <SectionHeader title="Departments" linkTo="/admin/departments" />
            <div className="space-y-2">
              {departments?.departments?.map(dept => (
                <div key={dept.id} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
                      <BookOpen size={12} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-slate-700 text-sm font-medium">{dept.name}</p>
                      <p className="text-slate-400 text-xs">{dept.code}</p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">
                    {dept.total_programs} programs
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Recent Students */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <SectionHeader
          title="Recent Students"
          sub={`Showing ${students?.students?.length} of ${students?.pagination?.total}`}
          linkTo="/admin/students"
        />
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                {['Student', 'Roll Number', 'Email', 'Phone', 'Status'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider pb-3 pr-4">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {students?.students?.map(s => (
                <tr key={s.user_id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center text-blue-700 font-bold text-xs flex-shrink-0">
                        {s.full_name[0]}
                      </div>
                      <span className="text-slate-700 text-sm font-medium">{s.full_name}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-slate-500 text-sm font-mono">{s.roll_number}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-slate-400 text-sm">{s.email}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-slate-500 text-sm">{s.phone}</span>
                  </td>
                  <td className="py-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      s.is_active
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {s.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}