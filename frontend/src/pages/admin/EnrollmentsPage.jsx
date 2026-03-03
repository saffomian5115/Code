import { useState, useEffect, useCallback } from 'react'
import { adminAPI } from '../../api/admin.api'
import { formatDate } from '../../utils/helpers'
import toast from 'react-hot-toast'
import {
  Search, Plus, CheckCircle2, XCircle, Award,
  Loader2, X, GraduationCap, BookOpen,
  ChevronLeft, ChevronRight, Filter
} from 'lucide-react'

const STATUS_CFG = {
  enrolled:  { cls: 'bg-blue-100 text-blue-700',    label: 'Enrolled' },
  completed: { cls: 'bg-emerald-100 text-emerald-700', label: 'Completed' },
  dropped:   { cls: 'bg-red-100 text-red-700',      label: 'Dropped' },
  failed:    { cls: 'bg-orange-100 text-orange-700', label: 'Failed' },
}

const GRADES = ['A+','A','A-','B+','B','B-','C+','C','C-','D+','D','F']
const GRADE_PTS = {'A+':4.0,'A':4.0,'A-':3.7,'B+':3.3,'B':3.0,'B-':2.7,'C+':2.3,'C':2.0,'C-':1.7,'D+':1.3,'D':1.0,'F':0.0}

// ── Enroll Student Modal ───────────────────────────
function EnrollModal({ students, offerings, onClose, onSuccess }) {
  const [form, setForm] = useState({ student_id: '', offering_id: '' })
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async () => {
    if (!form.student_id || !form.offering_id) { toast.error('Student and offering required'); return }
    setLoading(true)
    try {
      await adminAPI.enrollStudent({ student_id: parseInt(form.student_id), offering_id: parseInt(form.offering_id) })
      toast.success('Student enrolled successfully')
      onSuccess(); onClose()
    } catch (err) { toast.error(err.response?.data?.message || 'Enrollment failed') }
    finally { setLoading(false) }
  }

  const inputCls = "w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-blue-400 transition-all"

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h3 className="font-display font-bold text-lg text-slate-800">Enroll Student</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl"><X size={18} className="text-slate-500" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs text-slate-500 font-medium mb-1.5">Student *</label>
            <select className={inputCls} value={form.student_id} onChange={e => set('student_id', e.target.value)}>
              <option value="">-- Select Student --</option>
              {students.map(s => <option key={s.user_id} value={s.user_id}>{s.full_name} ({s.roll_number})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 font-medium mb-1.5">Course Offering *</label>
            <select className={inputCls} value={form.offering_id} onChange={e => set('offering_id', e.target.value)}>
              <option value="">-- Select Offering --</option>
              {offerings.map(o => (
                <option key={o.id} value={o.id}>
                  {o.course_name} — Sec {o.section} ({o.teacher_name})
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="p-6 pt-0 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium rounded-xl transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
            {loading ? <><Loader2 size={16} className="animate-spin" /> Enrolling...</> : 'Enroll Student'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Grade Modal ────────────────────────────────────
function GradeModal({ enrollment, onClose, onSuccess }) {
  const [form, setForm] = useState({ grade_letter: enrollment.grade_letter || 'A', grade_points: enrollment.grade_points || 4.0 })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setLoading(true)
    try {
      await adminAPI.gradeEnrollment(enrollment.id, form)
      toast.success('Grade entered successfully')
      onSuccess(); onClose()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to enter grade') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h3 className="font-display font-bold text-lg text-slate-800">Enter Grade</h3>
            <p className="text-slate-400 text-sm">{enrollment.student_name} — {enrollment.course_name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl"><X size={18} className="text-slate-500" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs text-slate-500 font-medium mb-1.5">Grade Letter</label>
            <select
              value={form.grade_letter}
              onChange={e => setForm({ grade_letter: e.target.value, grade_points: GRADE_PTS[e.target.value] || 0 })}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400">
              {GRADES.map(g => <option key={g} value={g}>{g} ({GRADE_PTS[g]})</option>)}
            </select>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <p className="text-sm text-slate-500">Grade Points: <span className="font-bold text-slate-800">{form.grade_points}</span></p>
          </div>
        </div>
        <div className="p-6 pt-0 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium rounded-xl transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
            {loading ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : 'Save Grade'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────
export default function EnrollmentsPage() {
  const [enrollments, setEnrollments] = useState([])
  const [students, setStudents] = useState([])
  const [offerings, setOfferings] = useState([])
  const [semesters, setSemesters] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterOffering, setFilterOffering] = useState('')
  const [activeSemesterId, setActiveSemesterId] = useState(null)
  const [showEnroll, setShowEnroll] = useState(false)
  const [gradeModal, setGradeModal] = useState(null)
  const [actionLoading, setActionLoading] = useState(null)

  useEffect(() => {
    // Load dropdowns
    adminAPI.getStudents(1, 200).then(r => setStudents(r.data.data?.students || []))
    adminAPI.getSemesters().then(r => {
      const sems = r.data.data?.semesters || []
      setSemesters(sems)
      const active = sems.find(s => s.is_active)
      if (active) {
        setActiveSemesterId(active.id)
        adminAPI.getOfferings({ semester_id: active.id }).then(r2 => setOfferings(r2.data.data?.offerings || []))
      }
    })
  }, [])

  const fetchEnrollments = useCallback(async () => {
    if (!filterOffering) return
    setLoading(true)
    try {
      const res = await adminAPI.getOfferingStudents(filterOffering)
      setEnrollments(res.data.data?.students || [])
    } catch { toast.error('Failed to load enrollments') }
    finally { setLoading(false) }
  }, [filterOffering])

  useEffect(() => { if (filterOffering) fetchEnrollments() }, [filterOffering])

  const handleApprove = async (enrollment) => {
    setActionLoading(enrollment.enrollment_id)
    try {
      await adminAPI.approveEnrollment(enrollment.enrollment_id, {})
      toast.success('Enrollment approved')
      fetchEnrollments()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to approve') }
    finally { setActionLoading(null) }
  }

  const handleDrop = async (enrollment) => {
    if (!window.confirm(`Drop ${enrollment.full_name} from this course?`)) return
    setActionLoading(enrollment.enrollment_id)
    try {
      await adminAPI.dropEnrollment(enrollment.enrollment_id, { reason: 'Admin drop' })
      toast.success('Enrollment dropped')
      fetchEnrollments()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to drop') }
    finally { setActionLoading(null) }
  }

  const filtered = enrollments.filter(e =>
    !search || e.full_name?.toLowerCase().includes(search.toLowerCase()) || e.roll_number?.toLowerCase().includes(search.toLowerCase())
  ).filter(e => !filterStatus || e.enrollment_status === filterStatus)

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-800">Enrollments</h1>
          <p className="text-slate-400 text-sm mt-0.5">Manage course enrollments and grades</p>
        </div>
        <button onClick={() => setShowEnroll(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm">
          <Plus size={16} /> Enroll Student
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={filterOffering}
          onChange={e => { setFilterOffering(e.target.value); setEnrollments([]) }}
          className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-600 focus:outline-none focus:border-blue-400 bg-white min-w-[260px]">
          <option value="">-- Select Course Offering --</option>
          {offerings.map(o => (
            <option key={o.id} value={o.id}>{o.course_name} — Sec {o.section} ({o.enrolled_count || 0} students)</option>
          ))}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-600 focus:outline-none bg-white">
          <option value="">All Status</option>
          {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search student..."
            className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 focus:outline-none focus:border-blue-400 w-52" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200">
        {!filterOffering ? (
          <div className="flex flex-col items-center justify-center py-20">
            <BookOpen size={40} className="text-slate-300 mb-3" />
            <p className="font-semibold text-slate-600">Select a course offering above</p>
            <p className="text-slate-400 text-sm mt-1">to view and manage enrollments</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Student', 'Roll No', 'Enrollment Date', 'Status', 'Approved', 'Grade', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">{Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-slate-100 rounded-lg" /></td>
                    ))}</tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-16 text-slate-400">No enrollments found</td></tr>
                ) : filtered.map(e => {
                  const sc = STATUS_CFG[e.enrollment_status] || STATUS_CFG.enrolled
                  return (
                    <tr key={e.enrollment_id || e.student_id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-700 text-xs font-bold flex-shrink-0">
                            {e.full_name?.[0] || '?'}
                          </div>
                          <p className="font-medium text-slate-700">{e.full_name}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-500 font-mono text-xs">{e.roll_number}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{formatDate(e.enrollment_date)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${sc.cls}`}>{sc.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        {e.is_approved
                          ? <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium"><CheckCircle2 size={13} /> Approved</span>
                          : <span className="flex items-center gap-1 text-xs text-orange-500 font-medium"><XCircle size={13} /> Pending</span>
                        }
                      </td>
                      <td className="px-4 py-3">
                        {e.grade_letter
                          ? <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-0.5 rounded-lg">{e.grade_letter}</span>
                          : <span className="text-slate-400 text-xs">Not graded</span>
                        }
                      </td>
                      <td className="px-4 py-3">
                        {actionLoading === e.enrollment_id ? (
                          <Loader2 size={16} className="animate-spin text-blue-600" />
                        ) : (
                          <div className="flex items-center gap-1">
                            {!e.is_approved && e.enrollment_status === 'enrolled' && (
                              <button onClick={() => handleApprove(e)}
                                className="p-1.5 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 rounded-lg transition-colors" title="Approve">
                                <CheckCircle2 size={14} />
                              </button>
                            )}
                            {e.enrollment_status === 'enrolled' && (
                              <>
                                <button onClick={() => setGradeModal({ ...e, course_name: offerings.find(o => String(o.id) === String(filterOffering))?.course_name })}
                                  className="p-1.5 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition-colors" title="Enter grade">
                                  <Award size={14} />
                                </button>
                                <button onClick={() => handleDrop(e)}
                                  className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors" title="Drop">
                                  <XCircle size={14} />
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showEnroll && (
        <EnrollModal students={students} offerings={offerings}
          onClose={() => setShowEnroll(false)} onSuccess={fetchEnrollments} />
      )}
      {gradeModal && (
        <GradeModal enrollment={gradeModal}
          onClose={() => setGradeModal(null)} onSuccess={fetchEnrollments} />
      )}
    </div>
  )
}
