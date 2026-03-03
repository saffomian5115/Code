import { useState, useEffect } from 'react'
import { studentAPI } from '../../api/student.api'
import { authStore } from '../../store/authStore'
import { formatDate, getAttendanceColor, getAttendanceBg } from '../../utils/helpers'
import toast from 'react-hot-toast'
import { ClipboardCheck, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react'

const STATUS_CFG = {
  present: { cls: 'bg-emerald-500 text-white', label: 'P' },
  absent:  { cls: 'bg-red-500 text-white',     label: 'A' },
  late:    { cls: 'bg-orange-400 text-white',  label: 'L' },
  excused: { cls: 'bg-blue-400 text-white',    label: 'E' },
}

export default function AttendancePage() {
  const user = authStore.getUser()
  const studentId = user?.user_id

  const [enrollments, setEnrollments] = useState([])
  const [selectedOffering, setSelectedOffering] = useState('')
  const [attendanceData, setAttendanceData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [attLoading, setAttLoading] = useState(false)

  useEffect(() => {
    studentAPI.getEnrollments()
      .then(r => {
        const enr = r.data.data?.enrollments || []
        setEnrollments(enr)
        if (enr.length > 0) setSelectedOffering(String(enr[0].offering_id))
      })
      .catch(() => toast.error('Failed to load courses'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedOffering || !studentId) return
    setAttLoading(true)
    studentAPI.getAttendance(studentId, selectedOffering)
      .then(r => setAttendanceData(r.data.data))
      .catch(() => toast.error('Failed to load attendance'))
      .finally(() => setAttLoading(false))
  }, [selectedOffering])

  const summary = attendanceData?.summary
  const records = attendanceData?.records || []
  const pct = summary?.percentage || 0
  const isShort = pct < 75

  // Calendar-style grouping
  const grouped = records.reduce((acc, r) => {
    const month = new Date(r.session_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    if (!acc[month]) acc[month] = []
    acc[month].push(r)
    return acc
  }, {})

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-800">Attendance</h1>
          <p className="text-slate-400 text-sm mt-0.5">Track your class attendance per course</p>
        </div>
        <select value={selectedOffering} onChange={e => setSelectedOffering(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-400 bg-white min-w-[240px]">
          {enrollments.map(e => (
            <option key={e.offering_id} value={e.offering_id}>{e.course_name} — Sec {e.section}</option>
          ))}
        </select>
      </div>

      {attLoading ? (
        <div className="flex items-center justify-center h-40"><Loader2 className="animate-spin text-emerald-500 w-6 h-6" /></div>
      ) : summary ? (
        <>
          {/* Summary Card */}
          <div className={`rounded-2xl p-6 border ${isShort ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {isShort
                    ? <AlertTriangle size={20} className="text-red-500" />
                    : <CheckCircle2 size={20} className="text-emerald-500" />}
                  <h3 className={`font-display font-bold text-lg ${isShort ? 'text-red-700' : 'text-emerald-700'}`}>
                    {isShort ? 'Attendance Shortage!' : 'Attendance OK'}
                  </h3>
                </div>
                {isShort && (
                  <p className="text-red-600 text-sm">You are below the 75% minimum requirement. You may be debarred from exams.</p>
                )}
              </div>
              {/* Circle */}
              <div className="relative w-24 h-24">
                <svg className="w-24 h-24 -rotate-90" viewBox="0 0 36 36">
                  <path d="M18 2.0845a15.9155 15.9155 0 0 1 0 31.831a15.9155 15.9155 0 0 1 0-31.831"
                    fill="none" stroke="#e2e8f0" strokeWidth="3" />
                  <path d="M18 2.0845a15.9155 15.9155 0 0 1 0 31.831a15.9155 15.9155 0 0 1 0-31.831"
                    fill="none" stroke={isShort ? '#ef4444' : '#10b981'} strokeWidth="3"
                    strokeDasharray={`${pct}, 100`} />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`font-display font-bold text-xl ${isShort ? 'text-red-600' : 'text-emerald-600'}`}>{pct.toFixed(0)}%</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4">
              {[
                { label: 'Total Classes', val: summary.total_classes },
                { label: 'Attended',      val: summary.attended_classes, color: 'text-emerald-600' },
                { label: 'Absent',        val: summary.total_classes - summary.attended_classes, color: 'text-red-500' },
              ].map(s => (
                <div key={s.label} className="bg-white/60 rounded-xl p-3 text-center">
                  <p className={`text-2xl font-display font-bold ${s.color || 'text-slate-700'}`}>{s.val}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Session History */}
          {Object.entries(grouped).map(([month, sessions]) => (
            <div key={month} className="bg-white rounded-2xl border border-slate-200">
              <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                <p className="font-semibold text-slate-700 text-sm">{month}</p>
                <span className="text-xs text-slate-400">{sessions.length} sessions</span>
              </div>
              <div className="divide-y divide-slate-50">
                {sessions.map((s, i) => {
                  const sc = STATUS_CFG[s.status] || STATUS_CFG.absent
                  return (
                    <div key={i} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 transition-colors">
                      <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${sc.cls}`}>
                        {sc.label}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">{s.topic || 'Lecture'}</p>
                        <p className="text-xs text-slate-400">{formatDate(s.session_date)} · {s.session_type}</p>
                      </div>
                      {s.remarks && <p className="text-xs text-slate-400 italic truncate max-w-[140px]">{s.remarks}</p>}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
          {records.length === 0 && (
            <div className="text-center py-10 text-slate-400">No attendance records yet</div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-center py-20">
          <ClipboardCheck size={40} className="text-slate-300 mb-3" />
          <p className="text-slate-600 font-semibold">Select a course to view attendance</p>
        </div>
      )}
    </div>
  )
}