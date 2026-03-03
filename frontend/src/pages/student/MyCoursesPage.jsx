import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { studentAPI } from '../../api/student.api'
import { formatTime } from '../../utils/helpers'
import toast from 'react-hot-toast'
import { BookOpen, Clock, MapPin, Loader2, ChevronRight } from 'lucide-react'

const GRADE_COLORS = {
  'A+': 'text-emerald-600 bg-emerald-100', 'A': 'text-emerald-600 bg-emerald-100',
  'A-': 'text-emerald-500 bg-emerald-50',  'B+': 'text-blue-600 bg-blue-100',
  'B':  'text-blue-500 bg-blue-50',        'B-': 'text-blue-400 bg-blue-50',
  'C+': 'text-yellow-600 bg-yellow-100',   'C':  'text-yellow-500 bg-yellow-50',
  'D':  'text-orange-600 bg-orange-100',   'F':  'text-red-600 bg-red-100',
}
const DAYS_SHORT = { monday:'Mon', tuesday:'Tue', wednesday:'Wed', thursday:'Thu', friday:'Fri', saturday:'Sat' }

export default function MyCoursesPage() {
  const [enrollments, setEnrollments] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    studentAPI.getEnrollments()
      .then(r => setEnrollments(r.data.data?.enrollments || []))
      .catch(() => toast.error('Failed to load courses'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="font-display font-bold text-2xl text-slate-800">My Courses</h1>
        <p className="text-slate-400 text-sm mt-0.5">{enrollments.length} courses enrolled this semester</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse space-y-3">
              <div className="w-12 h-12 bg-slate-100 rounded-xl" />
              <div className="h-4 bg-slate-100 rounded w-2/3" />
              <div className="h-3 bg-slate-100 rounded w-full" />
            </div>
          ))}
        </div>
      ) : enrollments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-center py-20">
          <BookOpen size={40} className="text-slate-300 mb-3" />
          <p className="font-semibold text-slate-600">No courses enrolled</p>
          <p className="text-slate-400 text-sm">Contact admin to enroll in courses</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {enrollments.map(e => {
            const schedule = e.schedule || []
            const schedText = schedule.slice(0,2).map(s => `${DAYS_SHORT[s.day] || s.day} ${formatTime(s.start_time)}`).join(' · ')
            const gradeColor = GRADE_COLORS[e.grade_letter] || 'text-slate-600 bg-slate-100'
            return (
              <div key={e.enrollment_id} className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <BookOpen size={20} className="text-emerald-600" />
                  </div>
                  {e.grade_letter && (
                    <span className={`text-sm font-bold px-2.5 py-1 rounded-xl ${gradeColor}`}>{e.grade_letter}</span>
                  )}
                </div>
                <h3 className="font-display font-bold text-slate-800 text-base mb-1 leading-snug">{e.course_name}</h3>
                <p className="text-xs text-emerald-600 font-mono font-semibold mb-3">{e.course_code}</p>
                <div className="space-y-1.5 text-xs text-slate-500">
                  {schedText && (
                    <div className="flex items-center gap-1.5"><Clock size={11} className="text-slate-400" />{schedText}</div>
                  )}
                  {e.room_number && (
                    <div className="flex items-center gap-1.5"><MapPin size={11} className="text-slate-400" />Room {e.room_number}</div>
                  )}
                  {e.instructor && (
                    <p className="text-slate-400">{e.instructor}</p>
                  )}
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <button onClick={() => navigate(`/student/courses/${e.offering_id}`)}
                    className="py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-xl transition-colors">
                    Details
                  </button>
                  <button onClick={() => navigate(`/student/attendance`)}
                    className="py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-xl transition-colors">
                    Attendance
                  </button>
                  <button onClick={() => navigate(`/student/assignments`)}
                    className="py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-xl transition-colors">
                    Assignments
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}