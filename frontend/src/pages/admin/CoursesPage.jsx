import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Plus, Search, X, Eye, Edit2, Trash2,
  Loader2, BookOpen, Hash, Clock,
  ChevronLeft, ChevronRight, Tag, Building2
} from 'lucide-react'
import toast from 'react-hot-toast'
import { adminAPI } from '../../api/admin.api'

// ── Helpers ───────────────────────────────────────
const inputCls = "w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all bg-white"
const Field = ({ label, req, children }) => (
  <div>
    <label className="block text-slate-500 text-xs font-medium mb-1.5">
      {label}{req && <span className="text-red-400 ml-0.5">*</span>}
    </label>
    {children}
  </div>
)

// ── View Modal ────────────────────────────────────
function ViewModal({ course, onClose }) {
  const rows = [
    { label: 'Course Code',    value: course.code },
    { label: 'Department',     value: course.department_name },
    { label: 'Program',        value: course.program_name },
    { label: 'Credit Hours',   value: course.credit_hours },
    { label: 'Lecture Hours',  value: course.lecture_hours },
    { label: 'Lab Hours',      value: course.lab_hours },
    { label: 'Semester Level', value: course.semester_level ? `Semester ${course.semester_level}` : '—' },
    { label: 'Type',           value: course.is_elective ? 'Elective' : 'Compulsory' },
    { label: 'Description',    value: course.description },
  ]

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h3 className="font-display font-bold text-lg text-slate-800">{course.name}</h3>
            <p className="text-slate-400 text-sm font-mono">{course.code}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-3">
          {rows.map(({ label, value }) => value ? (
            <div key={label} className="flex justify-between gap-4 py-2 border-b border-slate-50 last:border-0">
              <span className="text-xs font-medium text-slate-400 flex-shrink-0">{label}</span>
              <span className="text-sm text-slate-700 font-medium text-right">{value}</span>
            </div>
          ) : null)}
        </div>

        <div className="p-6 pt-0">
          <button onClick={onClose}
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium rounded-xl transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// ── CLO Modal ─────────────────────────────────────
function CLOModal({ course, onClose }) {
  const [clos, setClos] = useState([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ clo_number: '', description: '', bloom_level: 'understand' })

  useEffect(() => {
    adminAPI.getCourseCLOs(course.id)
      .then(r => setClos(r.data.data?.clos || []))
      .catch(() => toast.error('Failed to load CLOs'))
      .finally(() => setLoading(false))
  }, [course.id])

  const handleAdd = async () => {
    if (!form.clo_number || !form.description) { toast.error('CLO number and description required'); return }
    setAdding(true)
    try {
      const res = await adminAPI.createCLO(course.id, form)
      setClos(p => [...p, res.data.data])
      setForm({ clo_number: '', description: '', bloom_level: 'understand' })
      toast.success('CLO added')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add CLO')
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h3 className="font-display font-bold text-lg text-slate-800">Course Learning Outcomes</h3>
            <p className="text-slate-400 text-sm">{course.name} — {course.code}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin text-blue-600 w-5 h-5" /></div>
          ) : clos.length === 0 ? (
            <div className="text-center text-slate-400 py-8">No CLOs added yet</div>
          ) : (
            <div className="space-y-2">
              {clos.map((c, i) => (
                <div key={c.id || i} className="bg-slate-50 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-lg">CLO-{c.clo_number}</span>
                    <span className="text-xs text-slate-400 capitalize">{c.bloom_level}</span>
                  </div>
                  <p className="text-sm text-slate-700">{c.description}</p>
                </div>
              ))}
            </div>
          )}

          {/* Add CLO form */}
          <div className="border-t border-slate-100 pt-4 space-y-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Add New CLO</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">CLO Number</label>
                <input className={inputCls} value={form.clo_number}
                  onChange={e => setForm(p => ({ ...p, clo_number: e.target.value }))}
                  placeholder="1" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Bloom Level</label>
                <select className={inputCls} value={form.bloom_level}
                  onChange={e => setForm(p => ({ ...p, bloom_level: e.target.value }))}>
                  {['remember','understand','apply','analyze','evaluate','create'].map(l => (
                    <option key={l} value={l} className="capitalize">{l.charAt(0).toUpperCase()+l.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Description</label>
              <textarea className={inputCls} rows={2} value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Students will be able to..." />
            </div>
            <button onClick={handleAdd} disabled={adding}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
              {adding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Add CLO
            </button>
          </div>
        </div>

        <div className="p-6 pt-0">
          <button onClick={onClose}
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium rounded-xl transition-colors">
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Course Create/Edit Modal ──────────────────────
function CourseModal({ course, departments, programs, onClose, onSuccess }) {
  const isEdit = !!course?.id
  const [form, setForm] = useState({
    code:           course?.code           || '',
    name:           course?.name           || '',
    credit_hours:   course?.credit_hours   || 3,
    lecture_hours:  course?.lecture_hours  || 2,
    lab_hours:      course?.lab_hours      || 0,
    department_id:  course?.department_id  ? Number(course.department_id)  : '',
    program_id:     course?.program_id     ? Number(course.program_id)     : '',
    semester_level: course?.semester_level ? Number(course.semester_level) : '',
    description:    course?.description    || '',
    is_elective:    course?.is_elective    || false,
  })
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async () => {
    if (!form.code.trim() || !form.name.trim() || !form.department_id) {
      toast.error('Code, name and department required')
      return
    }
    setLoading(true)
    try {
      if (isEdit) {
        await adminAPI.updateCourse(course.id, form)
        toast.success('Course updated!')
      } else {
        await adminAPI.createCourse(form)
        toast.success('Course created!')
      }
      onSuccess()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h3 className="font-display font-bold text-lg text-slate-800">
            {isEdit ? 'Edit Course' : 'Add New Course'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Course Code" req>
              <input className={inputCls} value={form.code}
                onChange={e => set('code', e.target.value.toUpperCase())}
                placeholder="IT-301" autoFocus />
            </Field>
            <Field label="Course Name" req>
              <input className={inputCls} value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="Web Technologies" />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Field label="Credit Hours">
              <select className={inputCls} value={form.credit_hours} onChange={e => set('credit_hours', Number(e.target.value))}>
                {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </Field>
            <Field label="Lecture Hours">
              <select className={inputCls} value={form.lecture_hours} onChange={e => set('lecture_hours', Number(e.target.value))}>
                {[0,1,2,3,4].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </Field>
            <Field label="Lab Hours">
              <select className={inputCls} value={form.lab_hours} onChange={e => set('lab_hours', Number(e.target.value))}>
                {[0,1,2,3,4].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Department" req>
              <select className={inputCls} value={form.department_id} onChange={e => set('department_id', Number(e.target.value))}>
                <option value="">-- Select --</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </Field>
            <Field label="Program">
              <select className={inputCls} value={form.program_id} onChange={e => set('program_id', Number(e.target.value))}>
                <option value="">-- Select --</option>
                {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Semester Level">
            <select className={inputCls} value={form.semester_level} onChange={e => set('semester_level', Number(e.target.value))}>
              <option value="">-- Select --</option>
              {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>Semester {n}</option>)}
            </select>
          </Field>

          <Field label="Description">
            <textarea className={inputCls} rows={3} value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Course description and topics..." />
          </Field>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_elective}
              onChange={e => set('is_elective', e.target.checked)}
              className="w-4 h-4 rounded text-blue-600" />
            <span className="text-sm text-slate-600">This is an elective course</span>
          </label>
        </div>

        <div className="p-6 pt-0 flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium rounded-xl transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
            {loading
              ? <><Loader2 size={15} className="animate-spin" /> Saving...</>
              : isEdit ? 'Save Changes' : 'Create Course'
            }
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────
const PER_PAGE = 10

export default function CoursesPage() {
  const [courses, setCourses]       = useState([])
  const [departments, setDepartments] = useState([])
  const [programs, setPrograms]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [filterDept, setFilterDept] = useState('')
  const [page, setPage]             = useState(1)
  const [deletingId, setDeletingId] = useState(null)

  // Modals — all outside (defocus fix already handled by being module-level)
  const [viewCourse,  setViewCourse]  = useState(null)
  const [editCourse,  setEditCourse]  = useState(null)
  const [showCreate,  setShowCreate]  = useState(false)
  const [cloModal,    setCloModal]    = useState(null)

  const fetchCourses = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (filterDept) params.department_id = filterDept
      const res = await adminAPI.getCourses(params)
      setCourses(res.data.data?.courses || [])
      setPage(1)
    } catch {
      toast.error('Failed to load courses')
    } finally {
      setLoading(false)
    }
  }, [filterDept])

  useEffect(() => {
    fetchCourses()
    adminAPI.getDepartments().then(r => setDepartments(r.data.data?.departments || []))
    adminAPI.getPrograms().then(r => setPrograms(r.data.data?.programs || []))
  }, [])

  useEffect(() => { fetchCourses() }, [filterDept])

  // Client-side search + pagination
  const filtered = useMemo(() => {
    if (!search.trim()) return courses
    const q = search.toLowerCase()
    return courses.filter(c =>
      c.name?.toLowerCase().includes(q) ||
      c.code?.toLowerCase().includes(q) ||
      c.department_name?.toLowerCase().includes(q) ||
      c.program_name?.toLowerCase().includes(q)
    )
  }, [courses, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  // Reset page when search changes
  useEffect(() => { setPage(1) }, [search])

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this course?')) return
    setDeletingId(id)
    try {
      await adminAPI.deleteCourse(id)
      toast.success('Course deleted')
      fetchCourses()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot delete — may be in use')
    } finally {
      setDeletingId(null) }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-800">Courses</h1>
          <p className="text-slate-400 text-sm mt-0.5">{courses.length} courses total</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow-sm">
          <Plus size={18} /> Add Course
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search courses..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
          />
        </div>
        <select
          value={filterDept}
          onChange={e => setFilterDept(e.target.value)}
          className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:border-blue-400"
        >
          <option value="">All Departments</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">#</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Course</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Code</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Department</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Credits</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Sem</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {[...Array(8)].map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-slate-200 rounded-lg w-20" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    <BookOpen size={32} className="mx-auto mb-2 opacity-30" />
                    {search ? 'No courses match your search' : 'No courses found'}
                  </td>
                </tr>
              ) : (
                paginated.map((c, idx) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {(page - 1) * PER_PAGE + idx + 1}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <BookOpen size={13} className="text-blue-600" />
                        </div>
                        <span className="font-semibold text-slate-700 truncate max-w-48">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{c.code}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs max-w-32 truncate">{c.department_name || '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-lg">{c.credit_hours}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {c.semester_level ? `Sem ${c.semester_level}` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${c.is_elective ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>
                        {c.is_elective ? 'Elective' : 'Core'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {/* View */}
                        <button onClick={() => setViewCourse(c)}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors" title="View">
                          <Eye size={15} />
                        </button>
                        {/* CLOs */}
                        <button onClick={() => setCloModal(c)}
                          className="p-1.5 rounded-lg hover:bg-purple-50 text-slate-400 hover:text-purple-600 transition-colors" title="CLOs">
                          <Tag size={15} />
                        </button>
                        {/* Edit */}
                        <button onClick={() => setEditCourse(c)}
                          className="p-1.5 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition-colors" title="Edit">
                          <Edit2 size={15} />
                        </button>
                        {/* Delete */}
                        <button onClick={() => handleDelete(c.id)} disabled={deletingId === c.id}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors" title="Delete">
                          {deletingId === c.id
                            ? <Loader2 size={15} className="animate-spin" />
                            : <Trash2 size={15} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <p className="text-xs text-slate-400">
              Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex gap-1 items-center">
              <button onClick={() => setPage(p => p - 1)} disabled={page === 1}
                className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 transition-colors">
                <ChevronLeft size={16} className="text-slate-600" />
              </button>
              <span className="px-3 py-1 text-sm font-medium text-slate-700">
                {page} / {totalPages}
              </span>
              <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages}
                className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 transition-colors">
                <ChevronRight size={16} className="text-slate-600" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {viewCourse  && <ViewModal   course={viewCourse}  onClose={() => setViewCourse(null)} />}
      {showCreate  && <CourseModal departments={departments} programs={programs} onClose={() => setShowCreate(false)} onSuccess={fetchCourses} />}
      {editCourse  && <CourseModal course={editCourse} departments={departments} programs={programs} onClose={() => setEditCourse(null)} onSuccess={fetchCourses} />}
      {cloModal    && <CLOModal    course={cloModal}   onClose={() => setCloModal(null)} />}
    </div>
  )
}