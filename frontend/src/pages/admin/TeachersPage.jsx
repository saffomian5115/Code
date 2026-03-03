import { useState, useEffect, useCallback } from 'react'
import {
  Plus, Search, X, Eye, Edit2, Loader2,
  User, Mail, Phone, Hash, Briefcase,
  CheckCircle, XCircle, ChevronLeft, ChevronRight,
  GraduationCap, Calendar, Copy, Check
} from 'lucide-react'
import toast from 'react-hot-toast'
import { adminAPI } from '../../api/admin.api'

const inputCls = "w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-50 transition-all bg-white"
const Field = ({ label, required, children }) => (
  <div>
    <label className="block text-slate-500 text-xs font-medium mb-1.5">
      {label}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
    {children}
  </div>
)

// ── View Modal ─────────────────────────────────────
function ViewModal({ teacherId, onClose }) {
  const [teacher, setTeacher] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminAPI.getTeacher(teacherId)
      .then(r => setTeacher(r.data.data))
      .catch(() => toast.error('Failed to load teacher'))
      .finally(() => setLoading(false))
  }, [teacherId])

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h3 className="font-display font-bold text-lg text-slate-800">Teacher Detail</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="animate-spin text-purple-600 w-6 h-6" />
          </div>
        ) : teacher ? (
          <div className="p-6 space-y-4 overflow-y-auto">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-700 font-bold text-xl">
                {teacher.full_name?.[0] || '?'}
              </div>
              <div>
                <p className="font-bold text-slate-800 text-lg">{teacher.full_name}</p>
                <p className="text-slate-400 text-sm">{teacher.designation || '—'}</p>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${teacher.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                  {teacher.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Mail,         label: 'Email',          value: teacher.email },
                { icon: Hash,         label: 'Employee ID',    value: teacher.employee_id },
                { icon: Phone,        label: 'Phone',          value: teacher.phone },
                { icon: Hash,         label: 'CNIC',           value: teacher.cnic },
                { icon: GraduationCap,label: 'Qualification',  value: teacher.qualification },
                { icon: Briefcase,    label: 'Specialization', value: teacher.specialization },
                { icon: Calendar,     label: 'Joining Date',   value: teacher.joining_date },
              ].map(({ icon: Icon, label, value }) => value ? (
                <div key={label} className="bg-slate-50 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon size={12} className="text-slate-400" />
                    <p className="text-slate-400 text-xs">{label}</p>
                  </div>
                  <p className="text-slate-700 text-sm font-medium truncate">{value}</p>
                </div>
              ) : null)}
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-slate-400">Teacher not found</div>
        )}

        <div className="p-6 pt-0">
          <button onClick={onClose} className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium rounded-xl transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Create / Edit Modal ────────────────────────────
function TeacherModal({ teacher, onClose, onSuccess }) {
  const isEdit = !!teacher
  const [form, setForm] = useState({
    email: teacher?.email || '',
    full_name: teacher?.full_name || '',
    employee_id: teacher?.employee_id || '',
    designation: teacher?.designation || '',
    qualification: teacher?.qualification || '',
    specialization: teacher?.specialization || '',
    phone: teacher?.phone || '',
    cnic: teacher?.cnic || '',
    joining_date: teacher?.joining_date || '',
  })
  const [loading, setLoading] = useState(false)
  const [tempPassword, setTempPassword] = useState(null)
  const [copied, setCopied] = useState(false)

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async () => {
    if (!form.full_name.trim()) { toast.error('Full name required'); return }
    if (!isEdit && !form.email.trim()) { toast.error('Email required'); return }
    if (!isEdit && !form.employee_id.trim()) { toast.error('Employee ID required'); return }

    setLoading(true)
    try {
      if (isEdit) {
        await adminAPI.updateTeacher(teacher.user_id, {
          full_name: form.full_name,
          designation: form.designation,
          qualification: form.qualification,
          specialization: form.specialization,
          phone: form.phone,
          address: form.address,
        })
        toast.success('Teacher updated!')
        onSuccess()
        onClose()
      } else {
        const res = await adminAPI.createTeacher({
          email: form.email,
          full_name: form.full_name,
          employee_id: form.employee_id,
          designation: form.designation || undefined,
          qualification: form.qualification || undefined,
          specialization: form.specialization || undefined,
          phone: form.phone || undefined,
          cnic: form.cnic || undefined,
          joining_date: form.joining_date || undefined,
        })
        setTempPassword(res.data.data.temp_password)
        onSuccess()
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed')
    } finally {
      setLoading(false)
    }
  }

  const copyPassword = () => {
    navigator.clipboard.writeText(tempPassword)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Success screen
  if (tempPassword) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="text-emerald-600 w-8 h-8" />
          </div>
          <h3 className="font-display font-bold text-xl text-slate-800 mb-1">Teacher Created!</h3>
          <p className="text-slate-400 text-sm mb-6">Share these credentials with the teacher</p>

          <div className="bg-slate-50 rounded-xl p-4 text-left mb-4">
            <p className="text-xs text-slate-400 mb-1">Temporary Password</p>
            <div className="flex items-center justify-between gap-2">
              <code className="font-mono font-bold text-slate-800 text-lg">{tempPassword}</code>
              <button onClick={copyPassword} className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
                {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} className="text-slate-500" />}
              </button>
            </div>
          </div>

          <p className="text-xs text-amber-600 bg-amber-50 rounded-lg p-3 mb-6">
            ⚠️ Ye password sirf ek bar dikhega. Copy kar lo!
          </p>

          <button onClick={onClose} className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition-colors">
            Done
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h3 className="font-display font-bold text-lg text-slate-800">
            {isEdit ? 'Edit Teacher' : 'Add New Teacher'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4">
          {!isEdit && (
            <Field label="Email" required>
              <input className={inputCls} type="email" value={form.email}
                onChange={e => set('email', e.target.value)} placeholder="teacher@bzu.edu.pk" />
            </Field>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Field label="Full Name" required>
              <input className={inputCls} value={form.full_name}
                onChange={e => set('full_name', e.target.value)} placeholder="Dr. Ahmad Khan" />
            </Field>

            {!isEdit && (
              <Field label="Employee ID" required>
                <input className={inputCls} value={form.employee_id}
                  onChange={e => set('employee_id', e.target.value)} placeholder="EMP-001" />
              </Field>
            )}

            <Field label="Designation">
              <input className={inputCls} value={form.designation}
                onChange={e => set('designation', e.target.value)} placeholder="Assistant Professor" />
            </Field>

            <Field label="Phone">
              <input className={inputCls} value={form.phone}
                onChange={e => set('phone', e.target.value)} placeholder="03001234567" />
            </Field>

            <Field label="Qualification">
              <input className={inputCls} value={form.qualification}
                onChange={e => set('qualification', e.target.value)} placeholder="PhD Computer Science" />
            </Field>

            <Field label="Specialization">
              <input className={inputCls} value={form.specialization}
                onChange={e => set('specialization', e.target.value)} placeholder="AI, Machine Learning" />
            </Field>

            {!isEdit && (
              <>
                <Field label="Joining Date">
                  <input className={inputCls} type="date" value={form.joining_date}
                    onChange={e => set('joining_date', e.target.value)} />
                </Field>
                <Field label="CNIC">
                  <input className={inputCls} value={form.cnic}
                    onChange={e => set('cnic', e.target.value)} placeholder="3610212345678" />
                </Field>
              </>
            )}
          </div>

          {!isEdit && (
            <div className="bg-purple-50 rounded-xl p-3 text-xs text-purple-700">
              💡 Default password hoga: <strong>teacher123</strong>
            </div>
          )}
        </div>

        <div className="p-6 pt-0 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium rounded-xl transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
            {loading && <Loader2 size={15} className="animate-spin" />}
            {isEdit ? 'Save Changes' : 'Create Teacher'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────
export default function TeachersPage() {
  const [teachers, setTeachers] = useState([])
  const [pagination, setPagination] = useState({ total: 0, page: 1, per_page: 20, total_pages: 1 })
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const [viewId, setViewId] = useState(null)
  const [editTeacher, setEditTeacher] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [togglingId, setTogglingId] = useState(null)

  const fetchTeachers = useCallback(async (page = 1, q = search) => {
    setLoading(true)
    try {
      const res = await adminAPI.getTeachers(page, 20, q)
      setTeachers(res.data.data.teachers || [])
      setPagination(res.data.data.pagination || { total: 0, page: 1, per_page: 20, total_pages: 1 })
    } catch {
      toast.error('Failed to load teachers')
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => { fetchTeachers() }, [])
  useEffect(() => {
    const t = setTimeout(() => fetchTeachers(1, search), 400)
    return () => clearTimeout(t)
  }, [search])

  const handleToggle = async (t) => {
    setTogglingId(t.user_id)
    try {
      await adminAPI.toggleTeacherStatus(t.user_id)
      toast.success(`Teacher ${t.is_active ? 'deactivated' : 'activated'}`)
      fetchTeachers(pagination.page)
    } catch {
      toast.error('Status change failed')
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-800">Teachers</h1>
          <p className="text-slate-400 text-sm mt-0.5">{pagination.total} faculty members</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-colors shadow-sm"
        >
          <Plus size={18} /> Add Teacher
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search by name, email, emp ID..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-50"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">#</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Teacher</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Emp ID</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Designation</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Phone</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-slate-200 rounded-lg w-24" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : teachers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    <User size={32} className="mx-auto mb-2 opacity-30" />
                    No teachers found
                  </td>
                </tr>
              ) : (
                teachers.map((t, idx) => (
                  <tr key={t.user_id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {(pagination.page - 1) * pagination.per_page + idx + 1}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-purple-700 font-bold text-sm flex-shrink-0">
                          {t.full_name?.[0] || '?'}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-700">{t.full_name}</p>
                          <p className="text-slate-400 text-xs">{t.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{t.employee_id || '—'}</td>
                    <td className="px-4 py-3 text-slate-500 text-sm">{t.designation || '—'}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{t.phone || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${t.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {t.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {/* View */}
                        <button onClick={() => setViewId(t.user_id)}
                          className="p-1.5 rounded-lg hover:bg-purple-50 text-slate-400 hover:text-purple-600 transition-colors" title="View">
                          <Eye size={15} />
                        </button>
                        {/* Edit */}
                        <button onClick={() => setEditTeacher(t)}
                          className="p-1.5 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition-colors" title="Edit">
                          <Edit2 size={15} />
                        </button>
                        {/* Toggle */}
                        <button onClick={() => handleToggle(t)} disabled={togglingId === t.user_id}
                          className={`p-1.5 rounded-lg transition-colors ${t.is_active ? 'hover:bg-red-50 text-slate-400 hover:text-red-500' : 'hover:bg-emerald-50 text-slate-400 hover:text-emerald-600'}`}
                          title={t.is_active ? 'Deactivate' : 'Activate'}>
                          {togglingId === t.user_id
                            ? <Loader2 size={15} className="animate-spin" />
                            : t.is_active ? <XCircle size={15} /> : <CheckCircle size={15} />}
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
        {pagination.total_pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <p className="text-xs text-slate-400">
              Showing {(pagination.page - 1) * pagination.per_page + 1}–{Math.min(pagination.page * pagination.per_page, pagination.total)} of {pagination.total}
            </p>
            <div className="flex gap-1">
              <button onClick={() => fetchTeachers(pagination.page - 1)} disabled={pagination.page === 1}
                className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 transition-colors">
                <ChevronLeft size={16} className="text-slate-600" />
              </button>
              <span className="px-3 py-1 text-sm font-medium text-slate-700">
                {pagination.page} / {pagination.total_pages}
              </span>
              <button onClick={() => fetchTeachers(pagination.page + 1)} disabled={pagination.page === pagination.total_pages}
                className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 transition-colors">
                <ChevronRight size={16} className="text-slate-600" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {viewId && <ViewModal teacherId={viewId} onClose={() => setViewId(null)} />}
      {showCreate && <TeacherModal onClose={() => setShowCreate(false)} onSuccess={() => fetchTeachers(1)} />}
      {editTeacher && <TeacherModal teacher={editTeacher} onClose={() => setEditTeacher(null)} onSuccess={() => fetchTeachers(pagination.page)} />}
    </div>
  )
}