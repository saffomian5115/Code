import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { teacherAPI } from '../../api/teacher.api'
import { formatDate } from '../../utils/helpers'
import toast from 'react-hot-toast'
import {
  Plus, BarChart2, Eye, Loader2, X,
  Trophy, TrendingUp, Users, FileText
} from 'lucide-react'

const EXAM_TYPES = ['midterm', 'final', 'special']
const GRADE_SCALE = [
  { min: 90, grade: 'A+' }, { min: 85, grade: 'A'  }, { min: 80, grade: 'A-' },
  { min: 75, grade: 'B+' }, { min: 70, grade: 'B'  }, { min: 65, grade: 'B-' },
  { min: 60, grade: 'C+' }, { min: 55, grade: 'C'  }, { min: 50, grade: 'C-' },
  { min: 45, grade: 'D+' }, { min: 40, grade: 'D'  }, { min: 0,  grade: 'F'  },
]
const autoGrade = (obtained, total) => {
  if (!obtained || !total) return ''
  const pct = (obtained / total) * 100
  return GRADE_SCALE.find(g => pct >= g.min)?.grade || 'F'
}

// ── Create Exam Modal ──────────────────────────────
function CreateExamModal({ offeringId, onClose, onSuccess }) {
  const [form, setForm] = useState({
    exam_type: 'midterm', title: '',
    total_marks: 50, weightage_percent: 30,
    exam_date: '', start_time: '', end_time: '', room_number: '',
  })
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async () => {
    if (!form.title) { toast.error('Exam title required'); return }
    setLoading(true)
    try {
      await teacherAPI.createExam(offeringId, form)
      toast.success('Exam created successfully')
      onSuccess(); onClose()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setLoading(false) }
  }

  const inputCls = "w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-blue-400"

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h3 className="font-display font-bold text-lg text-slate-800">Create Exam</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl"><X size={18} className="text-slate-500" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 font-medium mb-1.5">Exam Type</label>
              <select className={inputCls} value={form.exam_type} onChange={e => set('exam_type', e.target.value)}>
                {EXAM_TYPES.map(t => <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 font-medium mb-1.5">Title *</label>
              <input className={inputCls} value={form.title} onChange={e => set('title', e.target.value)} placeholder="Midterm Exam 2025" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 font-medium mb-1.5">Total Marks</label>
              <input className={inputCls} type="number" value={form.total_marks} onChange={e => set('total_marks', parseInt(e.target.value))} />
            </div>
            <div>
              <label className="block text-xs text-slate-500 font-medium mb-1.5">Weightage (%)</label>
              <input className={inputCls} type="number" min={1} max={100} value={form.weightage_percent} onChange={e => set('weightage_percent', parseFloat(e.target.value))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 font-medium mb-1.5">Exam Date</label>
              <input className={inputCls} type="date" value={form.exam_date} onChange={e => set('exam_date', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-slate-500 font-medium mb-1.5">Room Number</label>
              <input className={inputCls} value={form.room_number} onChange={e => set('room_number', e.target.value)} placeholder="R-101" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 font-medium mb-1.5">Start Time</label>
              <input className={inputCls} type="time" value={form.start_time} onChange={e => set('start_time', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-slate-500 font-medium mb-1.5">End Time</label>
              <input className={inputCls} type="time" value={form.end_time} onChange={e => set('end_time', e.target.value)} />
            </div>
          </div>
        </div>
        <div className="p-6 pt-0 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium rounded-xl transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
            {loading ? <><Loader2 size={16} className="animate-spin" /> Creating...</> : 'Create Exam'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Enter Results Panel ────────────────────────────
function EnterResultsPanel({ exam, offeringId, onClose, onRefresh }) {
  const [students, setStudents] = useState([])
  const [results, setResults] = useState({}) // { student_id: {obtained_marks, remarks} }
  const [existingResults, setExistingResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [stuRes, resRes] = await Promise.all([
          teacherAPI.getOfferingStudents(offeringId),
          teacherAPI.getExamResults(exam.id),
        ])
        const studs = stuRes.data.data?.students || []
        setStudents(studs)
        const existing = resRes.data.data?.results || []
        setExistingResults(existing)
        // Pre-fill existing
        const init = {}
        studs.forEach(s => {
          const found = existing.find(r => r.student_id === s.student_id)
          init[s.student_id] = {
            obtained_marks: found ? found.obtained_marks : '',
            remarks: found ? (found.remarks || '') : '',
          }
        })
        setResults(init)
      } catch { toast.error('Failed to load data') }
      finally { setLoading(false) }
    }
    load()
  }, [exam.id, offeringId])

  const updateResult = (studentId, field, val) => {
    setResults(p => ({ ...p, [studentId]: { ...p[studentId], [field]: val } }))
  }

  const handleSave = async () => {
    const payload = students
      .filter(s => results[s.student_id]?.obtained_marks !== '')
      .map(s => ({
        student_id: s.student_id,
        obtained_marks: parseFloat(results[s.student_id].obtained_marks),
        remarks: results[s.student_id].remarks || null,
      }))

    if (payload.length === 0) { toast.error('Enter marks for at least 1 student'); return }

    // Validate
    for (const r of payload) {
      if (r.obtained_marks > exam.total_marks) {
        toast.error(`Marks cannot exceed ${exam.total_marks}`)
        return
      }
    }
    setSaving(true)
    try {
      await teacherAPI.enterExamResults(exam.id, { results: payload })
      toast.success(`Results saved for ${payload.length} students`)
      onRefresh(); onClose()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  // Stats
  const enteredMarks = students.map(s => parseFloat(results[s.student_id]?.obtained_marks)).filter(m => !isNaN(m))
  const avg = enteredMarks.length ? (enteredMarks.reduce((a, b) => a + b, 0) / enteredMarks.length).toFixed(1) : null
  const highest = enteredMarks.length ? Math.max(...enteredMarks) : null
  const lowest = enteredMarks.length ? Math.min(...enteredMarks) : null

  return (
    <div className="bg-white rounded-2xl border border-slate-200">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="font-display font-bold text-slate-800">{exam.title} — Enter Results</h3>
          <p className="text-slate-400 text-sm">Total marks: {exam.total_marks} · Weightage: {exam.weightage_percent}%</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl"><X size={18} className="text-slate-500" /></button>
      </div>

      {/* Live Stats */}
      {enteredMarks.length > 0 && (
        <div className="grid grid-cols-3 gap-4 p-5 border-b border-slate-100">
          {[
            { label: 'Average', val: avg, color: 'text-blue-600' },
            { label: 'Highest', val: highest, color: 'text-emerald-600' },
            { label: 'Lowest',  val: lowest,  color: 'text-red-500' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className={`text-xl font-display font-bold ${s.color}`}>{s.val}</p>
              <p className="text-xs text-slate-400">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-40"><Loader2 className="animate-spin text-blue-600 w-6 h-6" /></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                {['#', 'Student', 'Roll No', `Marks (/ ${exam.total_marks})`, 'Grade', 'Remarks'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {students.map((s, idx) => {
                const r = results[s.student_id] || {}
                const grade = autoGrade(r.obtained_marks, exam.total_marks)
                const gradeColor = grade === 'F' ? 'text-red-600' : grade?.startsWith('A') ? 'text-emerald-600' : 'text-slate-700'
                return (
                  <tr key={s.student_id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-2.5 text-slate-400 text-xs">{idx + 1}</td>
                    <td className="px-4 py-2.5 font-medium text-slate-700">{s.full_name}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-slate-400">{s.roll_number}</td>
                    <td className="px-4 py-2.5">
                      <input
                        type="number" min={0} max={exam.total_marks} step={0.5}
                        value={r.obtained_marks}
                        onChange={e => updateResult(s.student_id, 'obtained_marks', e.target.value)}
                        placeholder="—"
                        className="w-24 border border-slate-200 rounded-xl px-3 py-1.5 text-sm text-center font-semibold focus:outline-none focus:border-blue-400 transition-all"
                      />
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`font-bold text-sm ${gradeColor}`}>{grade || '—'}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <input
                        value={r.remarks || ''}
                        onChange={e => updateResult(s.student_id, 'remarks', e.target.value)}
                        placeholder="Optional..."
                        className="w-40 border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-blue-400 transition-all text-slate-600"
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="p-5 border-t border-slate-100 flex justify-end">
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm shadow-orange-500/20">
          {saving ? <><Loader2 size={15} className="animate-spin" /> Saving...</> : <><Trophy size={15} /> Save Results</>}
        </button>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────
export default function ResultsPage() {
  const [searchParams] = useSearchParams()
  const [offerings, setOfferings] = useState([])
  const [selectedOffering, setSelectedOffering] = useState(searchParams.get('offering') || '')
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [enterResults, setEnterResults] = useState(null)

  useEffect(() => {
    teacherAPI.getMyOfferings()
      .then(r => {
        const offs = r.data.data?.offerings || []
        setOfferings(offs)
        if (!selectedOffering && offs.length > 0) setSelectedOffering(String(offs[0].id))
      })
      .catch(() => toast.error('Failed to load offerings'))
  }, [])

  const fetchExams = useCallback(async () => {
    if (!selectedOffering) return
    setLoading(true)
    try {
      const res = await teacherAPI.getOfferingExams(selectedOffering)
      setExams(res.data.data?.exams || [])
    } catch { toast.error('Failed to load exams') }
    finally { setLoading(false) }
  }, [selectedOffering])

  useEffect(() => { fetchExams() }, [selectedOffering])

  const TYPE_CFG = {
    midterm: { cls: 'bg-blue-100 text-blue-700',   icon: '📋' },
    final:   { cls: 'bg-purple-100 text-purple-700', icon: '🏆' },
    special: { cls: 'bg-orange-100 text-orange-700', icon: '⭐' },
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-800">Results & Exams</h1>
          <p className="text-slate-400 text-sm mt-0.5">{exams.length} exams created</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={selectedOffering} onChange={e => setSelectedOffering(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-600 focus:outline-none focus:border-blue-400 bg-white min-w-[240px]">
            <option value="">-- Select Course --</option>
            {offerings.map(o => <option key={o.id} value={o.id}>{o.course_name} — Sec {o.section}</option>)}
          </select>
          <button onClick={() => setShowCreate(true)} disabled={!selectedOffering}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 disabled:opacity-40 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors">
            <Plus size={16} /> Create Exam
          </button>
        </div>
      </div>

      {/* Enter Results Panel */}
      {enterResults && (
        <EnterResultsPanel
          exam={enterResults}
          offeringId={selectedOffering}
          onClose={() => setEnterResults(null)}
          onRefresh={fetchExams}
        />
      )}

      {/* Exams List */}
      {!selectedOffering ? (
        <div className="bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-center py-20">
          <BarChart2 size={40} className="text-slate-300 mb-3" />
          <p className="font-semibold text-slate-600">Select a course to view exams</p>
        </div>
      ) : loading ? (
        <div className="space-y-3">{Array.from({length:3}).map((_,i)=>(
          <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse space-y-2">
            <div className="h-4 bg-slate-100 rounded-lg w-1/2" />
            <div className="h-3 bg-slate-100 rounded-lg w-1/3" />
          </div>
        ))}</div>
      ) : exams.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-center py-20">
          <FileText size={40} className="text-slate-300 mb-3" />
          <p className="font-semibold text-slate-600">No exams yet</p>
          <p className="text-slate-400 text-sm mt-1">Create a midterm or final exam to enter results</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {exams.map(e => {
            const cfg = TYPE_CFG[e.exam_type] || TYPE_CFG.special
            const resultsEntered = e.total_results || 0
            return (
              <div key={e.id} className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-sm transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="text-3xl flex-shrink-0">{cfg.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-display font-bold text-slate-800">{e.title}</h3>
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${cfg.cls}`}>{e.exam_type}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mb-3">
                      <span>{e.total_marks} marks</span>
                      <span>·</span>
                      <span>{e.weightage_percent}% weightage</span>
                      {e.exam_date && <><span>·</span><span>{formatDate(e.exam_date)}</span></>}
                      {e.room_number && <><span>·</span><span>Room {e.room_number}</span></>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${resultsEntered > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {resultsEntered > 0 ? `${resultsEntered} results entered` : 'No results yet'}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => setEnterResults(enterResults?.id === e.id ? null : e)}
                    className="flex items-center gap-2 px-3 py-2 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-xl text-xs font-semibold transition-colors flex-shrink-0">
                    <Trophy size={13} /> {resultsEntered > 0 ? 'Update' : 'Enter Results'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showCreate && (
        <CreateExamModal
          offeringId={selectedOffering}
          onClose={() => setShowCreate(false)}
          onSuccess={fetchExams}
        />
      )}
    </div>
  )
}
