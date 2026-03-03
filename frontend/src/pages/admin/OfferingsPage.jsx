import { useState, useEffect, useCallback } from 'react'
import { adminAPI } from '../../api/admin.api'
import { formatTime } from '../../utils/helpers'
import toast from 'react-hot-toast'
import { Plus, Eye, Trash2, BookOpen, Loader2, X, Users, Calendar, ChevronLeft, ChevronRight, Search } from 'lucide-react'

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

function StudentsModal({ offeringId, offeringName, onClose }) {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    adminAPI.getOfferingStudents(offeringId)
      .then(r => setStudents(r.data.data?.students || []))
      .catch(() => toast.error('Failed to load students'))
      .finally(() => setLoading(false))
  }, [offeringId])
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h3 className="font-display font-bold text-lg text-slate-800">Enrolled Students</h3>
            <p className="text-slate-400 text-sm">{offeringName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl"><X size={18} className="text-slate-500" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? <div className="flex justify-center py-8"><Loader2 className="animate-spin text-blue-600" /></div>
            : students.length === 0 ? <p className="text-slate-400 text-center py-8">No students enrolled yet</p>
            : students.map(s => (
              <div key={s.student_id} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-700 text-xs font-bold flex-shrink-0">
                  {s.full_name?.[0] || '?'}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-700">{s.full_name}</p>
                  <p className="text-xs text-slate-400 font-mono">{s.roll_number}</p>
                </div>
                <div className="flex items-center gap-2">
                  {s.grade_letter && <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-lg">{s.grade_letter}</span>}
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.is_approved ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                    {s.is_approved ? 'Approved' : 'Pending'}
                  </span>
                </div>
              </div>
            ))
          }
        </div>
        <div className="p-6 pt-0">
          <button onClick={onClose} className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium rounded-xl transition-colors">Close</button>
        </div>
      </div>
    </div>
  )
}

function OfferingModal({ courses, teachers, semesters, onClose, onSuccess }) {
  const [form, setForm] = useState({
    course_id: '', teacher_id: '', semester_id: semesters?.[0]?.id || '',
    section: 'A', room_number: '', max_students: 40,
    schedule_json: [{ day: 'monday', start_time: '09:00', end_time: '10:30' }],
  })
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const addSchedule = () => setForm(p => ({ ...p, schedule_json: [...p.schedule_json, { day: 'tuesday', start_time: '09:00', end_time: '10:30' }] }))
  const removeSchedule = (i) => setForm(p => ({ ...p, schedule_json: p.schedule_json.filter((_, idx) => idx !== i) }))
  const updateSchedule = (i, k, v) => setForm(p => {
    const s = [...p.schedule_json]; s[i] = { ...s[i], [k]: v }; return { ...p, schedule_json: s }
  })

  const handleSubmit = async () => {
    if (!form.course_id || !form.teacher_id || !form.semester_id) { toast.error('Course, teacher and semester required'); return }
    setLoading(true)
    try {
      await adminAPI.createOffering(form); toast.success('Offering created successfully')
      onSuccess(); onClose()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create offering') }
    finally { setLoading(false) }
  }

  const inputCls = "w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-blue-400 transition-all"

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h3 className="font-display font-bold text-lg text-slate-800">Create Course Offering</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl"><X size={18} className="text-slate-500" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 font-medium mb-1.5">Course *</label>
              <select className={inputCls} value={form.course_id} onChange={e => set('course_id', parseInt(e.target.value))}>
                <option value="">-- Select Course --</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 font-medium mb-1.5">Semester *</label>
              <select className={inputCls} value={form.semester_id} onChange={e => set('semester_id', parseInt(e.target.value))}>
                {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-500 font-medium mb-1.5">Teacher *</label>
            <select className={inputCls} value={form.teacher_id} onChange={e => set('teacher_id', parseInt(e.target.value))}>
              <option value="">-- Select Teacher --</option>
              {teachers.map(t => <option key={t.user_id} value={t.user_id}>{t.full_name} — {t.designation || 'Lecturer'}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-slate-500 font-medium mb-1.5">Section</label>
              <select className={inputCls} value={form.section} onChange={e => set('section', e.target.value)}>
                {['A','B','C','D','E'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 font-medium mb-1.5">Room</label>
              <input className={inputCls} value={form.room_number} onChange={e => set('room_number', e.target.value)} placeholder="IT-101" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 font-medium mb-1.5">Max Students</label>
              <input className={inputCls} type="number" value={form.max_students} onChange={e => set('max_students', parseInt(e.target.value))} />
            </div>
          </div>
          {/* Schedule */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-slate-500 font-medium">Class Schedule</label>
              <button onClick={addSchedule} className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
                <Plus size={12} /> Add slot
              </button>
            </div>
            {form.schedule_json.map((slot, i) => (
              <div key={i} className="flex items-center gap-2 mb-2">
                <select value={slot.day} onChange={e => updateSchedule(i, 'day', e.target.value)}
                  className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none capitalize">
                  {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <input type="time" value={slot.start_time} onChange={e => updateSchedule(i, 'start_time', e.target.value)}
                  className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none" />
                <span className="text-slate-400 text-sm">→</span>
                <input type="time" value={slot.end_time} onChange={e => updateSchedule(i, 'end_time', e.target.value)}
                  className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none" />
                {form.schedule_json.length > 1 && (
                  <button onClick={() => removeSchedule(i)} className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg">
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="p-6 pt-0 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium rounded-xl transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
            {loading ? <><Loader2 size={16} className="animate-spin" /> Creating...</> : 'Create Offering'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function OfferingsPage() {
  const [offerings, setOfferings] = useState([])
  const [courses, setCourses] = useState([])
  const [teachers, setTeachers] = useState([])
  const [semesters, setSemesters] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterSemester, setFilterSemester] = useState('')
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [viewStudents, setViewStudents] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const fetchOfferings = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}; if (filterSemester) params.semester_id = filterSemester
      const res = await adminAPI.getOfferings(params)
      setOfferings(res.data.data?.offerings || [])
    } catch { toast.error('Failed to load offerings') }
    finally { setLoading(false) }
  }, [filterSemester])

  useEffect(() => {
    fetchOfferings()
    adminAPI.getCourses().then(r => setCourses(r.data.data?.courses || []))
    adminAPI.getTeachers(1, 100).then(r => setTeachers(r.data.data?.teachers || []))
    adminAPI.getSemesters().then(r => {
      const sems = r.data.data?.semesters || []
      setSemesters(sems)
      const active = sems.find(s => s.is_active)
      if (active) setFilterSemester(String(active.id))
    })
  }, [])

  useEffect(() => { fetchOfferings() }, [filterSemester])

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this offering?')) return
    setDeletingId(id)
    try { await adminAPI.deleteOffering(id); toast.success('Offering deleted'); fetchOfferings() }
    catch (err) { toast.error(err.response?.data?.message || 'Cannot delete') }
    finally { setDeletingId(null) }
  }

  const filtered = offerings.filter(o =>
    !search || o.course_name?.toLowerCase().includes(search.toLowerCase()) || o.course_code?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-800">Course Offerings</h1>
          <p className="text-slate-400 text-sm mt-0.5">{offerings.length} offerings this semester</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm">
          <Plus size={16} /> Create Offering
        </button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search courses..."
            className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 placeholder-slate-400 focus:outline-none focus:border-blue-400 w-64" />
        </div>
        <select value={filterSemester} onChange={e => setFilterSemester(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-600 focus:outline-none bg-white">
          <option value="">All Semesters</option>
          {semesters.map(s => <option key={s.id} value={s.id}>{s.name}{s.is_active ? ' (Active)' : ''}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                {['Course', 'Teacher', 'Section', 'Room', 'Schedule', 'Enrolled', 'Semester', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">{Array.from({ length: 8 }).map((_, j) => (
                  <td key={j} className="px-4 py-3"><div className="h-4 bg-slate-100 rounded-lg" /></td>
                ))}</tr>
              )) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-16 text-slate-400">No offerings found</td></tr>
              ) : filtered.map(o => (
                <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-700">{o.course_name}</p>
                    <p className="text-xs text-blue-600 font-mono">{o.course_code}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{o.teacher_name}</td>
                  <td className="px-4 py-3"><span className="bg-slate-100 text-slate-600 font-bold text-xs px-2 py-0.5 rounded-lg">{o.section}</span></td>
                  <td className="px-4 py-3 text-slate-500">{o.room_number || '—'}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {o.schedule?.slice(0, 2).map((s, i) => (
                      <span key={i} className="block capitalize">{s.day} {formatTime(s.start_time)}</span>
                    )) || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-700 font-medium">{o.enrolled_count || 0}</span>
                      <span className="text-slate-400">/ {o.max_students}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{o.semester_name}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setViewStudents(o)}
                        className="p-1.5 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition-colors" title="View students">
                        <Users size={14} />
                      </button>
                      <button onClick={() => handleDelete(o.id)} disabled={deletingId === o.id}
                        className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors">
                        {deletingId === o.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showCreate && (
        <OfferingModal courses={courses} teachers={teachers} semesters={semesters}
          onClose={() => setShowCreate(false)} onSuccess={fetchOfferings} />
      )}
      {viewStudents && (
        <StudentsModal offeringId={viewStudents.id} offeringName={`${viewStudents.course_name} — Sec ${viewStudents.section}`}
          onClose={() => setViewStudents(null)} />
      )}
    </div>
  )
}
