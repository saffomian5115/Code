import { useState, useEffect } from 'react'
import { studentAPI } from '../../api/student.api'
import { authStore } from '../../store/authStore'
import { formatDate } from '../../utils/helpers'
import toast from 'react-hot-toast'
import { BarChart2, Loader2, Award, TrendingUp } from 'lucide-react'

const GRADE_COLORS = {
  'A+': 'text-emerald-600 bg-emerald-100', 'A': 'text-emerald-600 bg-emerald-100',
  'A-': 'text-emerald-500 bg-emerald-50',  'B+': 'text-blue-600 bg-blue-100',
  'B':  'text-blue-500 bg-blue-50',        'B-': 'text-blue-400 bg-blue-50',
  'C+': 'text-yellow-600 bg-yellow-100',   'C':  'text-yellow-500 bg-yellow-50',
  'D':  'text-orange-600 bg-orange-100',   'F':  'text-red-600 bg-red-100',
}

export default function ResultsPage() {
  const user = authStore.getUser()
  const studentId = user?.user_id
  const [results, setResults] = useState([])
  const [enrollments, setEnrollments] = useState([])
  const [cgpa, setCgpa] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const enrRes = await studentAPI.getEnrollments()
        const enrData = enrRes.data.data
        setEnrollments(enrData?.enrollments || [])
        setCgpa(enrData?.cgpa)

        // Get exam results for current semester
        const activeSemesterId = enrData?.enrollments?.[0]?.semester_id
        if (studentId && activeSemesterId) {
          const res = await studentAPI.getMyResults(studentId, activeSemesterId)
          setResults(res.data.data?.results || [])
        }
      } catch { toast.error('Failed to load results') }
      finally { setLoading(false) }
    }
    fetchAll()
  }, [])

  // Group exam results by course
  const grouped = results.reduce((acc, r) => {
    const name = r.course_name || 'Unknown'
    if (!acc[name]) acc[name] = []
    acc[name].push(r)
    return acc
  }, {})

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-blue-600 w-6 h-6" /></div>

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="font-display font-bold text-2xl text-slate-800">Results</h1>
        <p className="text-slate-400 text-sm mt-0.5">Academic performance overview</p>
      </div>

      {/* CGPA Card */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-white/70 text-sm font-medium mb-1">Cumulative GPA</p>
          <p className="text-6xl font-display font-bold">{cgpa ? cgpa.toFixed(2) : '—'}</p>
          <p className="text-white/60 text-xs mt-2">{enrollments.length} courses enrolled · {enrollments.filter(e => e.grade_letter).length} graded</p>
        </div>
        <div className="flex items-center gap-2 bg-white/20 rounded-2xl px-5 py-4">
          <Award size={28} />
          <div>
            <p className="font-bold text-lg">{cgpa >= 3.5 ? 'Excellent' : cgpa >= 3.0 ? 'Very Good' : cgpa >= 2.5 ? 'Good' : cgpa >= 2.0 ? 'Satisfactory' : '—'}</p>
            <p className="text-white/70 text-xs">Academic Standing</p>
          </div>
        </div>
      </div>

      {/* Course Grades */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-display font-bold text-slate-800">Course Grades</h2>
        </div>
        <div className="divide-y divide-slate-50">
          {enrollments.map(e => (
            <div key={e.enrollment_id} className="flex items-center px-6 py-4 hover:bg-slate-50 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-700">{e.course_name}</p>
                <p className="text-xs text-slate-400">{e.course_code} · {e.credit_hours} credit hours</p>
              </div>
              <div className="flex items-center gap-3">
                {e.grade_letter ? (
                  <>
                    <span className={`font-bold px-2.5 py-1 rounded-xl text-sm ${GRADE_COLORS[e.grade_letter] || 'text-slate-600 bg-slate-100'}`}>
                      {e.grade_letter}
                    </span>
                    <span className="text-slate-400 text-sm">{e.grade_points?.toFixed(2)} pts</span>
                  </>
                ) : (
                  <span className="text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-xl">In Progress</span>
                )}
              </div>
            </div>
          ))}
          {enrollments.length === 0 && (
            <div className="text-center py-12 text-slate-400">No enrollment data found</div>
          )}
        </div>
      </div>

      {/* Exam Results */}
      {results.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-display font-bold text-slate-800">Exam Results</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Course', 'Exam', 'Marks', 'Percentage', 'Grade', 'Weightage'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {results.map((r, i) => {
                  const pct = r.total_marks ? ((r.obtained_marks / r.total_marks) * 100).toFixed(1) : '—'
                  return (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3 font-medium text-slate-700">{r.course_name}</td>
                      <td className="px-5 py-3 capitalize text-slate-600">{r.exam_type}</td>
                      <td className="px-5 py-3 font-semibold text-slate-700">{r.obtained_marks}/{r.total_marks}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${parseFloat(pct) >= 70 ? 'bg-emerald-400' : parseFloat(pct) >= 50 ? 'bg-orange-400' : 'bg-red-500'}`}
                              style={{ width: `${Math.min(pct, 100)}%` }} />
                          </div>
                          <span className="text-xs font-bold text-slate-600">{pct}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${GRADE_COLORS[r.grade] || 'bg-slate-100 text-slate-600'}`}>{r.grade || '—'}</span>
                      </td>
                      <td className="px-5 py-3 text-slate-400">{r.weightage}%</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}