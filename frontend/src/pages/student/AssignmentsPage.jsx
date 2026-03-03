import { useState, useEffect, useCallback } from 'react'
import { studentAPI } from '../../api/student.api'
import { authStore } from '../../store/authStore'
import { formatDateTime } from '../../utils/helpers'
import toast from 'react-hot-toast'
import {
  FileText, Upload, CheckCircle2, Clock,
  AlertTriangle, Loader2, X, Eye
} from 'lucide-react'

function SubmitModal({ assignment, onClose, onSuccess }) {
  const [file, setFile] = useState(null)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (assignment.file_required && !file) { toast.error('Please attach a file'); return }
    setLoading(true)
    try {
      const formData = new FormData()
      if (file) formData.append('file', file)
      formData.append('notes', notes)
      await studentAPI.submitAssignment(assignment.id, formData)
      toast.success('Assignment submitted successfully!')
      onSuccess(); onClose()
    } catch (err) { toast.error(err.response?.data?.message || 'Submission failed') }
    finally { setLoading(false) }
  }

  const isLate = new Date(assignment.due_date) < new Date()

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h3 className="font-display font-bold text-lg text-slate-800">Submit Assignment</h3>
            <p className="text-slate-400 text-sm">{assignment.title}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4">
          {isLate && assignment.allow_late && (
            <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl p-3">
              <AlertTriangle size={14} className="text-orange-500" />
              <span className="text-xs text-orange-700 font-medium">Late submission — {assignment.late_penalty_percent}% penalty applies</span>
            </div>
          )}
          <div>
            <label className="block text-xs text-slate-500 font-medium mb-1.5">
              Attach File {assignment.file_required ? '*' : '(optional)'}
            </label>
            <div
              onClick={() => document.getElementById('file-input').click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${file ? 'border-emerald-400 bg-emerald-50' : 'border-slate-300 hover:border-blue-400'}`}
            >
              {file ? (
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle2 size={18} className="text-emerald-500" />
                  <span className="text-sm font-medium text-emerald-700">{file.name}</span>
                </div>
              ) : (
                <>
                  <Upload size={24} className="text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">Click to upload file</p>
                  <p className="text-xs text-slate-400 mt-1">PDF, DOC, ZIP supported</p>
                </>
              )}
              <input id="file-input" type="file" className="hidden" accept="image/*, .pdf, .docx, .zip" onChange={e => setFile(e.target.files[0])} />
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-500 font-medium mb-1.5">Notes (optional)</label>
            <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-blue-400"
              placeholder="Any notes for your teacher..." />
          </div>
        </div>
        <div className="p-6 pt-0 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium rounded-xl transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
            {loading ? <><Loader2 size={15} className="animate-spin" /> Submitting...</> : <><Upload size={15} /> Submit</>}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AssignmentsPage() {
  const [enrollments, setEnrollments] = useState([])
  const [selectedOffering, setSelectedOffering] = useState('')
  const [assignments, setAssignments] = useState([])
  const [submissions, setSubmissions] = useState({}) // {assignment_id: submission}
  const [loading, setLoading] = useState(true)
  const [submitModal, setSubmitModal] = useState(null)

  useEffect(() => {
    studentAPI.getEnrollments()
      .then(r => {
        const enr = r.data.data?.enrollments || []
        setEnrollments(enr)
        if (enr.length > 0) setSelectedOffering(String(enr[0].offering_id))
      })
      .catch(() => toast.error('Failed'))
      .finally(() => setLoading(false))
  }, [])

  const fetchAssignments = useCallback(async () => {
    if (!selectedOffering) return
    try {
      const res = await studentAPI.getOfferingAssignments(selectedOffering)
      const assgns = res.data.data?.assignments || []
      setAssignments(assgns)
      // Load my submission for each
      const submMap = {}
      await Promise.all(assgns.map(async a => {
        try {
          const sr = await studentAPI.getMySubmission(a.id)
          if (sr.data.data?.submission) submMap[a.id] = sr.data.data.submission
        } catch { /* no submission yet */ }
      }))
      setSubmissions(submMap)
    } catch { toast.error('Failed to load assignments') }
  }, [selectedOffering])

  useEffect(() => { fetchAssignments() }, [selectedOffering])

  const now = new Date()

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-800">Assignments</h1>
          <p className="text-slate-400 text-sm">{assignments.length} assignments</p>
        </div>
        <select value={selectedOffering} onChange={e => setSelectedOffering(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 bg-white min-w-[240px]">
          {enrollments.map(e => <option key={e.offering_id} value={e.offering_id}>{e.course_name}</option>)}
        </select>
      </div>

      {assignments.length === 0 && !loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-center py-20">
          <FileText size={40} className="text-slate-300 mb-3" />
          <p className="font-semibold text-slate-600">No assignments yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map(a => {
            const sub = submissions[a.id]
            const isPast = new Date(a.due_date) < now
            const isLate = isPast && !sub
            const canSubmit = !sub && (!isPast || a.allow_late)
            return (
              <div key={a.id} className={`bg-white rounded-2xl border p-5 hover:shadow-sm transition-shadow ${sub?.status === 'graded' ? 'border-emerald-200 border-l-4 border-l-emerald-500' : isPast && !sub ? 'border-red-200 border-l-4 border-l-red-400' : 'border-slate-200 border-l-4 border-l-blue-400'}`}>
                <div className="flex items-start gap-4">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${sub ? 'bg-emerald-100' : isLate ? 'bg-red-100' : 'bg-blue-100'}`}>
                    <FileText size={18} className={sub ? 'text-emerald-600' : isLate ? 'text-red-500' : 'text-blue-600'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-display font-bold text-slate-800">{a.title}</h3>
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg">{a.total_marks} marks</span>
                      {sub?.status === 'graded' && (
                        <span className="text-xs bg-emerald-100 text-emerald-700 font-semibold px-2.5 py-0.5 rounded-full">
                          ✓ Graded: {sub.obtained_marks}/{a.total_marks}
                        </span>
                      )}
                      {sub?.status === 'submitted' && <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-2.5 py-0.5 rounded-full">Submitted</span>}
                      {!sub && isPast && <span className="text-xs bg-red-100 text-red-600 font-semibold px-2.5 py-0.5 rounded-full">Missed</span>}
                    </div>
                    {a.description && <p className="text-slate-500 text-sm line-clamp-1 mb-1">{a.description}</p>}
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock size={11} />
                      Due: {formatDateTime(a.due_date)}
                      {isPast && !sub && <span className="text-red-500 font-medium ml-1">— Overdue</span>}
                    </p>
                    {sub?.feedback && (
                      <p className="text-xs text-emerald-600 mt-1 italic">Feedback: {sub.feedback}</p>
                    )}
                  </div>
                  {canSubmit && (
                    <button onClick={() => setSubmitModal(a)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-colors flex-shrink-0 ${isPast ? 'bg-orange-100 hover:bg-orange-200 text-orange-700' : 'bg-blue-100 hover:bg-blue-200 text-blue-700'}`}>
                      <Upload size={13} /> {isPast ? 'Late Submit' : 'Submit'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
      {submitModal && (
        <SubmitModal assignment={submitModal} onClose={() => setSubmitModal(null)} onSuccess={fetchAssignments} />
      )}
    </div>
  )
}