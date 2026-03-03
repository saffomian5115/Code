import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { teacherAPI } from '../../api/teacher.api'
import { formatDate, formatDateTime } from '../../utils/helpers'
import toast from 'react-hot-toast'
import {
  Plus, FileText, Eye, Award, Loader2, X,
  CheckCircle2, Clock, AlertTriangle, ChevronRight,
  Download, BookOpen, Users
} from 'lucide-react'

const STATUS_CFG = {
  submitted: { cls: 'bg-blue-100 text-blue-700',    label: 'Submitted' },
  graded:    { cls: 'bg-emerald-100 text-emerald-700', label: 'Graded' },
  late:      { cls: 'bg-orange-100 text-orange-700', label: 'Late' },
  missing:   { cls: 'bg-red-100 text-red-700',      label: 'Missing' },
}

// ── Create Assignment Modal ────────────────────────
function CreateAssignmentModal({ offeringId, onClose, onSuccess }) {
  const [form, setForm] = useState({
    title: '', description: '', total_marks: 10,
    due_date: '', instructions: '', file_required: true,
    allow_late: false, late_penalty_percent: 20,
  })
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async () => {
    // Basic validation
    if (!form.title.trim()) { toast.error('Title is required'); return }
    if (!form.due_date) { toast.error('Due date is required'); return }
    setLoading(true)
    try {
      const submissionData = {
        ...form,
        offering_id: parseInt(offeringId),
        total_marks: parseInt(form.total_marks)
      }
      await teacherAPI.createAssignment(offeringId, submissionData)
      toast.success('Assignment created successfully')
      onSuccess(); onClose()
    } catch (err) { 
      console.error("Assignment create error:", err)
      toast.error(err.response?.data?.message || 'Failed to create assignment') 
    }
    finally { setLoading(false) }
  }

  const inputCls = "w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-blue-400 transition-all"

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h3 className="font-display font-bold text-lg text-slate-800">Create Assignment</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl"><X size={18} className="text-slate-500" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="block text-xs text-slate-500 font-medium mb-1.5">Assignment Title *</label>
            <input className={inputCls} value={form.title} onChange={e => set('title', e.target.value)} placeholder="Assignment 1: Data Types" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 font-medium mb-1.5">Description</label>
            <textarea className={inputCls} rows={3} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Brief assignment description..." />
          </div>
          <div>
            <label className="block text-xs text-slate-500 font-medium mb-1.5">Instructions</label>
            <textarea className={inputCls} rows={3} value={form.instructions} onChange={e => set('instructions', e.target.value)} placeholder="Detailed instructions for students..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 font-medium mb-1.5">Total Marks</label>
              <input className={inputCls} type="number" min={1} value={form.total_marks} onChange={e => set('total_marks', parseInt(e.target.value))} />
            </div>
            <div>
              <label className="block text-xs text-slate-500 font-medium mb-1.5">Due Date *</label>
              <input className={inputCls} type="datetime-local" value={form.due_date} onChange={e => set('due_date', e.target.value)} />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.file_required} onChange={e => set('file_required', e.target.checked)} className="w-4 h-4 rounded text-blue-600" />
              <span className="text-sm text-slate-600">File upload required</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.allow_late} onChange={e => set('allow_late', e.target.checked)} className="w-4 h-4 rounded text-blue-600" />
              <span className="text-sm text-slate-600">Allow late submissions</span>
            </label>
          </div>
          {form.allow_late && (
            <div>
              <label className="block text-xs text-slate-500 font-medium mb-1.5">Late Penalty (%)</label>
              <input className={inputCls} type="number" min={0} max={100} value={form.late_penalty_percent} onChange={e => set('late_penalty_percent', parseInt(e.target.value))} />
            </div>
          )}
        </div>
        <div className="p-6 pt-0 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium rounded-xl transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
            {loading ? <><Loader2 size={16} className="animate-spin" /> Creating...</> : 'Create Assignment'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Grade Submission Modal ─────────────────────────
function GradeModal({ submission, totalMarks, onClose, onSuccess }) {
  const [form, setForm] = useState({
    obtained_marks: submission.obtained_marks || '',
    feedback: submission.feedback || '',
    status: 'graded',
  })
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const percentage = form.obtained_marks && totalMarks
    ? ((form.obtained_marks / totalMarks) * 100).toFixed(1)
    : null

  const handleSubmit = async () => {
    if (form.obtained_marks === '') { toast.error('Marks are required'); return }
    if (parseFloat(form.obtained_marks) > totalMarks) { toast.error(`Marks cannot exceed ${totalMarks}`); return }
    setLoading(true)
    try {
      await teacherAPI.gradeSubmission(submission.id, {
        obtained_marks: parseFloat(form.obtained_marks),
        feedback: form.feedback,
        status: form.status,
      })
      toast.success('Submission graded successfully')
      onSuccess(); onClose()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h3 className="font-display font-bold text-lg text-slate-800">Grade Submission</h3>
            <p className="text-slate-400 text-sm">{submission.full_name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl"><X size={18} className="text-slate-500" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-sm">
            <span className="text-slate-500">Submitted:</span>
            <span className="text-slate-700 font-medium">{formatDateTime(submission.submission_date)}</span>
          </div>
          {submission.plagiarism_percentage > 0 && (
            <div className={`p-3 rounded-xl flex items-center gap-2 ${submission.plagiarism_percentage > 30 ? 'bg-red-50 border border-red-200' : 'bg-orange-50 border border-orange-200'}`}>
              <AlertTriangle size={14} className={submission.plagiarism_percentage > 30 ? 'text-red-500' : 'text-orange-500'} />
              <span className="text-xs font-medium text-slate-700">Plagiarism: {submission.plagiarism_percentage}%</span>
            </div>
          )}
          <div>
            <label className="block text-xs text-slate-500 font-medium mb-1.5">Obtained Marks * (out of {totalMarks})</label>
            <input
              type="number" min={0} max={totalMarks} step={0.5}
              value={form.obtained_marks}
              onChange={e => set('obtained_marks', e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
              placeholder={`0 – ${totalMarks}`}
            />
            {percentage !== null && (
              <p className="text-xs text-slate-400 mt-1">= {percentage}%</p>
            )}
          </div>
          <div>
            <label className="block text-xs text-slate-500 font-medium mb-1.5">Feedback</label>
            <textarea
              rows={3} value={form.feedback} onChange={e => set('feedback', e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-blue-400"
              placeholder="Write feedback for the student..."
            />
          </div>
        </div>
        <div className="p-6 pt-0 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium rounded-xl transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
            {loading ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <><Award size={15} /> Save Grade</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Submissions Panel ──────────────────────────────
function SubmissionsPanel({ assignment, onClose, onRefresh }) {
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [gradeModal, setGradeModal] = useState(null)

  const loadSubmissions = useCallback(async () => {
    setLoading(true)
    try {
      const res = await teacherAPI.getAssignmentSubmissions(assignment.id)
      setSubmissions(res.data.data?.submissions || [])
    } catch { toast.error('Failed to load submissions') }
    finally { setLoading(false) }
  }, [assignment.id])

  useEffect(() => { loadSubmissions() }, [])

  const stats = {
    total: submissions.length,
    graded: submissions.filter(s => s.status === 'graded').length,
    pending: submissions.filter(s => s.status === 'submitted' || s.status === 'late').length,
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="font-display font-bold text-slate-800">{assignment.title} — Submissions</h3>
          <p className="text-slate-400 text-sm">
            {stats.graded}/{stats.total} graded · {stats.pending} pending
          </p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl"><X size={18} className="text-slate-500" /></button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              {['Student', 'Roll No', 'Submitted', 'Status', 'Marks', 'Plagiarism', 'Action'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="animate-pulse">{Array.from({length:7}).map((_,j) => (
                  <td key={j} className="px-4 py-3"><div className="h-4 bg-slate-100 rounded-lg" /></td>
                ))}</tr>
              ))
            ) : submissions.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-slate-400">No submissions yet</td></tr>
            ) : (
              submissions.map(s => {
                const sc = STATUS_CFG[s.status] || STATUS_CFG.submitted
                return (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-700">{s.full_name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">{s.roll_number}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{formatDateTime(s.submission_date)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${sc.cls}`}>{sc.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      {s.obtained_marks != null
                        ? <span className="font-semibold text-slate-700">{s.obtained_marks}/{assignment.total_marks}</span>
                        : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {s.plagiarism_percentage > 0
                        ? <span className={`text-xs font-bold ${s.plagiarism_percentage > 30 ? 'text-red-600' : 'text-orange-500'}`}>{s.plagiarism_percentage}%</span>
                        : <span className="text-slate-400 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => setGradeModal(s)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-xl text-xs font-semibold transition-colors">
                        <Award size={12} /> {s.status === 'graded' ? 'Update' : 'Grade'}
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
      {gradeModal && (
        <GradeModal
          submission={gradeModal}
          totalMarks={assignment.total_marks}
          onClose={() => setGradeModal(null)}
          onSuccess={() => { loadSubmissions(); onRefresh() }}
        />
      )}
    </div>
  )
}

// ── Main Page ──────────────────────────────────────
export default function AssignmentsPage() {
  const [searchParams] = useSearchParams()
  const [offerings, setOfferings] = useState([])
  const [selectedOffering, setSelectedOffering] = useState(searchParams.get('offering') || '')
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [viewSubmissions, setViewSubmissions] = useState(null)

  useEffect(() => {
    teacherAPI.getMyOfferings()
      .then(r => {
        const offs = r.data.data?.offerings || []
        setOfferings(offs)
        if (!selectedOffering && offs.length > 0) setSelectedOffering(String(offs[0].id))
      })
      .catch(() => toast.error('Failed to load offerings'))
  }, [])

  const fetchAssignments = useCallback(async () => {
    if (!selectedOffering) return
    setLoading(true)
    try {
      const res = await teacherAPI.getOfferingAssignments(selectedOffering)
      setAssignments(res.data.data?.assignments || [])
    } catch { toast.error('Failed to load assignments') }
    finally { setLoading(false) }
  }, [selectedOffering])

  useEffect(() => { fetchAssignments() }, [selectedOffering])

  const now = new Date()
  const upcoming = assignments.filter(a => new Date(a.due_date) > now)
  const overdue  = assignments.filter(a => new Date(a.due_date) <= now)

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-800">Assignments</h1>
          <p className="text-slate-400 text-sm mt-0.5">{assignments.length} assignments created</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={selectedOffering} onChange={e => setSelectedOffering(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-600 focus:outline-none focus:border-blue-400 bg-white min-w-[240px]">
            <option value="">-- Select Course --</option>
            {offerings.map(o => <option key={o.id} value={o.id}>{o.course_name} — Sec {o.section}</option>)}
          </select>
          <button onClick={() => setShowCreate(true)} disabled={!selectedOffering}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors">
            <Plus size={16} /> Create Assignment
          </button>
        </div>
      </div>

      {/* Submissions Panel (inline below header) */}
      {viewSubmissions && (
        <SubmissionsPanel
          assignment={viewSubmissions}
          onClose={() => setViewSubmissions(null)}
          onRefresh={fetchAssignments}
        />
      )}

      {/* Assignments List */}
      {!selectedOffering ? (
        <div className="bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-center py-20">
          <FileText size={40} className="text-slate-300 mb-3" />
          <p className="font-semibold text-slate-600">Select a course to view assignments</p>
        </div>
      ) : loading ? (
        <div className="space-y-3">{Array.from({length:3}).map((_,i)=>(
          <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse space-y-2">
            <div className="h-4 bg-slate-100 rounded-lg w-1/2" />
            <div className="h-3 bg-slate-100 rounded-lg w-full" />
          </div>
        ))}</div>
      ) : assignments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-center py-20">
          <FileText size={40} className="text-slate-300 mb-3" />
          <p className="font-semibold text-slate-600">No assignments yet</p>
          <p className="text-slate-400 text-sm mt-1">Create your first assignment for this course</p>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map(a => {
            const isPast = new Date(a.due_date) <= now
            const submissionCount = a.submission_count || 0
            const gradedCount = a.graded_count || 0
            return (
              <div key={a.id} className={`bg-white rounded-2xl border p-5 group hover:shadow-sm transition-shadow ${isPast ? 'border-slate-200' : 'border-slate-200 border-l-4 border-l-purple-400'}`}>
                <div className="flex items-start gap-4">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${isPast ? 'bg-slate-100' : 'bg-purple-100'}`}>
                    <FileText size={18} className={isPast ? 'text-slate-400' : 'text-purple-600'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-display font-bold text-slate-800">{a.title}</h3>
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg font-medium">{a.total_marks} marks</span>
                      {isPast
                        ? <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Closed</span>
                        : <span className="text-xs bg-purple-100 text-purple-700 font-semibold px-2 py-0.5 rounded-full">Active</span>}
                    </div>
                    {a.description && <p className="text-slate-500 text-sm line-clamp-1 mb-2">{a.description}</p>}
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock size={11} />
                        Due: {formatDateTime(a.due_date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users size={11} />
                        {submissionCount} submitted
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle2 size={11} className="text-emerald-400" />
                        {gradedCount} graded
                      </span>
                    </div>
                  </div>
                  <button onClick={() => setViewSubmissions(viewSubmissions?.id === a.id ? null : a)}
                    className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-purple-100 text-slate-600 hover:text-purple-600 rounded-xl text-xs font-semibold transition-colors flex-shrink-0">
                    <Eye size={13} /> Submissions
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showCreate && (
        <CreateAssignmentModal
          offeringId={selectedOffering}
          onClose={() => setShowCreate(false)}
          onSuccess={fetchAssignments}
        />
      )}
    </div>
  )
}
