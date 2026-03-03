import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { teacherAPI } from '../../api/teacher.api'
import { formatTime } from '../../utils/helpers'
import toast from 'react-hot-toast'
import {
  BookOpen, Users, ClipboardCheck, FileText,
  PenSquare, BarChart2, Loader2, ChevronRight,
  Clock, MapPin, Calendar, BookMarked
} from 'lucide-react'

const DAYS_SHORT = { monday:'Mon', tuesday:'Tue', wednesday:'Wed', thursday:'Thu', friday:'Fri', saturday:'Sat' }

// ── Course Card ────────────────────────────────────
function CourseCard({ offering, onNavigate }) {
  const schedule = offering.schedule || offering.schedule_json || []
  const scheduleText = schedule.slice(0,2).map(s =>
    `${DAYS_SHORT[s.day] || s.day} ${formatTime(s.start_time)}`
  ).join(' · ')

  const utilizationPct = offering.max_students
    ? Math.round(((offering.enrolled_count || 0) / offering.max_students) * 100)
    : 0

  const utilColor = utilizationPct >= 90 ? 'bg-red-400' : utilizationPct >= 70 ? 'bg-orange-400' : 'bg-emerald-400'

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-md transition-all group">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <BookMarked size={20} className="text-blue-600" />
        </div>
        <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2.5 py-1 rounded-xl">
          Sec {offering.section}
        </span>
      </div>

      {/* Course Info */}
      <div className="mb-4">
        <h3 className="font-display font-bold text-slate-800 text-base leading-snug mb-1">{offering.course_name}</h3>
        <p className="text-xs text-blue-600 font-mono font-semibold">{offering.course_code}</p>
      </div>

      {/* Meta */}
      <div className="space-y-1.5 mb-4">
        {scheduleText && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Clock size={11} className="text-slate-400 flex-shrink-0" />
            <span>{scheduleText}</span>
          </div>
        )}
        {offering.room_number && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <MapPin size={11} className="text-slate-400 flex-shrink-0" />
            <span>Room {offering.room_number}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Calendar size={11} className="text-slate-400 flex-shrink-0" />
          <span>{offering.semester_name}</span>
        </div>
      </div>

      {/* Enrollment Bar */}
      <div className="mb-5">
        <div className="flex justify-between text-xs text-slate-500 mb-1.5">
          <span className="flex items-center gap-1"><Users size={10} /> {offering.enrolled_count || 0} students</span>
          <span>{utilizationPct}% full</span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className={`h-full ${utilColor} rounded-full transition-all`} style={{ width: `${utilizationPct}%` }} />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { icon: ClipboardCheck, label: 'Attendance', path: `/teacher/attendance?offering=${offering.id}`, color: 'bg-blue-50 text-blue-600 hover:bg-blue-100' },
          { icon: FileText,       label: 'Assignments', path: `/teacher/assignments?offering=${offering.id}`, color: 'bg-purple-50 text-purple-600 hover:bg-purple-100' },
          { icon: PenSquare,      label: 'Quizzes',    path: `/teacher/quizzes?offering=${offering.id}`, color: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' },
          { icon: BarChart2,      label: 'Results',    path: `/teacher/results?offering=${offering.id}`, color: 'bg-orange-50 text-orange-600 hover:bg-orange-100' },
        ].map(btn => {
          const Icon = btn.icon
          return (
            <button key={btn.label} onClick={() => onNavigate(btn.path)}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-colors ${btn.color}`}>
              <Icon size={13} /> {btn.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────
export default function MyCoursesPage() {
  const [offerings, setOfferings] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    teacherAPI.getMyOfferings()
      .then(r => setOfferings(r.data.data?.offerings || []))
      .catch(() => toast.error('Failed to load courses'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="font-display font-bold text-2xl text-slate-800">My Courses</h1>
        <p className="text-slate-400 text-sm mt-0.5">{offerings.length} courses assigned this semester</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse space-y-4">
              <div className="w-12 h-12 bg-slate-100 rounded-xl" />
              <div className="h-4 bg-slate-100 rounded-lg w-2/3" />
              <div className="h-3 bg-slate-100 rounded-lg w-1/3" />
              <div className="grid grid-cols-2 gap-2">
                {Array.from({length:4}).map((_,j)=><div key={j} className="h-8 bg-slate-100 rounded-xl" />)}
              </div>
            </div>
          ))}
        </div>
      ) : offerings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-center py-24">
          <BookOpen size={48} className="text-slate-300 mb-4" />
          <p className="font-display font-bold text-slate-600 text-lg">No courses assigned</p>
          <p className="text-slate-400 text-sm mt-1">Contact admin to assign course offerings</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {offerings.map(o => (
            <CourseCard key={o.id} offering={o} onNavigate={navigate} />
          ))}
        </div>
      )}
    </div>
  )
}
