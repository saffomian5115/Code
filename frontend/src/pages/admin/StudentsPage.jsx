import { useState, useEffect, useCallback } from 'react'
import {
  Plus, Search, X, Eye, Edit2, Trash2,
  Loader2, User, Mail, Phone, MapPin, Hash,
  CheckCircle, XCircle, ChevronLeft, ChevronRight,
  KeyRound, Copy, Check
} from 'lucide-react'
import toast from 'react-hot-toast'
import { adminAPI } from '../../api/admin.api'

// ── Helpers ────────────────────────────────────────
const inputCls = "w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all bg-white"
const Field = ({ label, required, children }) => (
  <div>
    <label className="block text-slate-500 text-xs font-medium mb-1.5">
      {label}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
    {children}
  </div>
)

// ── Modal — View Student ───────────────────────────
function ViewModal({ studentId, onClose }) {
  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminAPI.getStudent(studentId)
      .then(r => setStudent(r.data.data))
      .catch(() => toast.error('Failed to load student'))
      .finally(() => setLoading(false))
  }, [studentId])

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h3 className="font-display font-bold text-lg text-slate-800">Student Detail</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="animate-spin text-blue-600 w-6 h-6" />
          </div>
        ) : student ? (
          <div className="p-6 space-y-4 overflow-y-auto">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-700 font-bold text-xl">
                {student.profile?.full_name?.[0] || '?'}
              </div>
              <div>
                <p className="font-bold text-slate-800 text-lg">{student.profile?.full_name}</p>
                <p className="text-slate-400 text-sm font-mono">{student.roll_number}</p>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${student.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                  {student.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Mail,  label: 'Email',    value: student.email },
                { icon: Phone, label: 'Phone',    value: student.profile?.phone },
                { icon: User,  label: 'Gender',   value: student.profile?.gender },
                { icon: MapPin,label: 'City',     value: student.profile?.city },
                { icon: Hash,  label: 'CNIC',     value: student.profile?.cnic },
                { icon: User,  label: 'Father',   value: student.profile?.father_name },
                { icon: Phone, label: 'Guardian', value: student.profile?.guardian_phone },
                { icon: MapPin,label: 'Address',  value: student.profile?.current_address },
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
          <div className="p-6 text-center text-slate-400">Student not found</div>
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

// ── Modal — Create / Edit Student ──────────────────
function StudentModal({ student, onClose, onSuccess }) {
  const isEdit = !!student
  const [form, setForm] = useState({
    email: student?.email || '',
    full_name: student?.full_name || '',
    father_name: student?.father_name || '',
    gender: student?.gender || 'male',
    phone: student?.phone || '',
    city: student?.city || '',
    current_address: student?.current_address || '',
    guardian_phone: student?.guardian_phone || '',
    cnic: student?.cnic || '',
  })
  const [loading, setLoading] = useState(false)
  const [tempPassword, setTempPassword] = useState(null)
  const [copied, setCopied] = useState(false)

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async () => {
    if (!form.full_name.trim()) { toast.error('Full name required'); return }
    if (!isEdit && !form.email.trim()) { toast.error('Email required'); return }

    setLoading(true)
    try {
      if (isEdit) {
        await adminAPI.updateStudent(student.user_id, {
          full_name: form.full_name,
          father_name: form.father_name,
          gender: form.gender,
          phone: form.phone,
          city: form.city,
          current_address: form.current_address,
          guardian_phone: form.guardian_phone,
        })
        toast.success('Student updated!')
        onSuccess()
        onClose()
      } else {
        const res = await adminAPI.createStudent({
          email: form.email,
          full_name: form.full_name,
          father_name: form.father_name || undefined,
          gender: form.gender || undefined,
          phone: form.phone || undefined,
          city: form.city || undefined,
          current_address: form.current_address || undefined,
          guardian_phone: form.guardian_phone || undefined,
          cnic: form.cnic || undefined,
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

  // Success screen — show temp password
  if (tempPassword) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="text-emerald-600 w-8 h-8" />
          </div>
          <h3 className="font-display font-bold text-xl text-slate-800 mb-1">Student Created!</h3>
          <p className="text-slate-400 text-sm mb-6">Share these credentials with the student</p>

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

          <button onClick={onClose} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors">
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
            {isEdit ? 'Edit Student' : 'Add New Student'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4">
          {!isEdit && (
            <Field label="Email" required>
              <input className={inputCls} type="email" value={form.email}
                onChange={e => set('email', e.target.value)} placeholder="student@bzu.edu.pk" />
            </Field>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Field label="Full Name" required>
              <input className={inputCls} value={form.full_name}
                onChange={e => set('full_name', e.target.value)} placeholder="Ali Hassan" />
            </Field>
            <Field label="Father's Name">
              <input className={inputCls} value={form.father_name}
                onChange={e => set('father_name', e.target.value)} placeholder="Muhammad Hassan" />
            </Field>
            <Field label="Gender">
              <select className={inputCls} value={form.gender} onChange={e => set('gender', e.target.value)}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </Field>
            <Field label="Phone">
              <input className={inputCls} value={form.phone}
                onChange={e => set('phone', e.target.value)} placeholder="03001234567" />
            </Field>
            <Field label="City">
              <input className={inputCls} value={form.city}
                onChange={e => set('city', e.target.value)} placeholder="Multan" />
            </Field>
            <Field label="Guardian Phone">
              <input className={inputCls} value={form.guardian_phone}
                onChange={e => set('guardian_phone', e.target.value)} placeholder="03009876543" />
            </Field>
            {!isEdit && (
              <Field label="CNIC">
                <input className={inputCls} value={form.cnic}
                  onChange={e => set('cnic', e.target.value)} placeholder="3620112345671" />
              </Field>
            )}
            <Field label="Address">
              <input className={inputCls} value={form.current_address}
                onChange={e => set('current_address', e.target.value)} placeholder="House #, Street, City" />
            </Field>
          </div>

          {!isEdit && (
            <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700">
              💡 Roll number auto-generate hoga (BZU-2025-XXXX). Password bhi system generate karega.
            </div>
          )}
        </div>

        <div className="p-6 pt-0 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium rounded-xl transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
            {loading && <Loader2 size={15} className="animate-spin" />}
            {isEdit ? 'Save Changes' : 'Create Student'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Confirm Delete Modal ───────────────────────────
function DeleteModal({ student, onClose, onConfirm, loading }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center">
        <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Trash2 className="text-red-600 w-6 h-6" />
        </div>
        <h3 className="font-display font-bold text-lg text-slate-800 mb-1">Delete Student?</h3>
        <p className="text-slate-400 text-sm mb-2">
          <span className="font-semibold text-slate-600">{student?.full_name}</span> ko permanently delete karna chahte hain?
        </p>
        <p className="text-xs text-red-500 mb-6">Yeh action undo nahi ho sakta.</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium rounded-xl transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
            {loading && <Loader2 size={14} className="animate-spin" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Students Page ─────────────────────────────
export default function StudentsPage() {
  const [students, setStudents] = useState([])
  const [pagination, setPagination] = useState({ total: 0, page: 1, per_page: 10, total_pages: 1 })
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const [viewId, setViewId] = useState(null)
  const [editStudent, setEditStudent] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [togglingId, setTogglingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const fetchStudents = useCallback(async (page = 1, q = search) => {
    setLoading(true)
    try {
      const res = await adminAPI.getStudents(page, 10, q)
      setStudents(res.data.data.students)
      setPagination(res.data.data.pagination)
    } catch {
      toast.error('Failed to load students')
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => { fetchStudents() }, [])

  useEffect(() => {
    const t = setTimeout(() => fetchStudents(1, search), 400)
    return () => clearTimeout(t)
  }, [search])

  const handleToggle = async (student) => {
    setTogglingId(student.user_id)
    try {
      await adminAPI.toggleStudentStatus(student.user_id)
      toast.success(`Student ${student.is_active ? 'deactivated' : 'activated'}`)
      fetchStudents(pagination.page)
    } catch {
      toast.error('Status change failed')
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async () => {
    setDeletingId(deleteTarget.user_id)
    try {
      await adminAPI.deleteStudent(deleteTarget.user_id)
      toast.success('Student deleted')
      setDeleteTarget(null)
      fetchStudents(pagination.page)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-800">Students</h1>
          <p className="text-slate-400 text-sm mt-0.5">{pagination.total} total students</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow-sm"
        >
          <Plus size={18} /> Add Student
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search by name, email, roll no..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">#</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Student</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Roll No</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Contact</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-slate-200 rounded-lg w-24" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                    <User size={32} className="mx-auto mb-2 opacity-30" />
                    No students found
                  </td>
                </tr>
              ) : (
                students.map((s, idx) => (
                  <tr key={s.user_id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {(pagination.page - 1) * pagination.per_page + idx + 1}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                          {s.full_name?.[0] || '?'}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-700">{s.full_name}</p>
                          <p className="text-slate-400 text-xs">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{s.roll_number || '—'}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{s.phone || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${s.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {s.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {/* View */}
                        <button onClick={() => setViewId(s.user_id)}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors" title="View">
                          <Eye size={15} />
                        </button>
                        {/* Edit */}
                        <button onClick={() => setEditStudent(s)}
                          className="p-1.5 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition-colors" title="Edit">
                          <Edit2 size={15} />
                        </button>
                        {/* Toggle Status */}
                        <button onClick={() => handleToggle(s)} disabled={togglingId === s.user_id}
                          className={`p-1.5 rounded-lg transition-colors ${s.is_active ? 'hover:bg-red-50 text-slate-400 hover:text-red-500' : 'hover:bg-emerald-50 text-slate-400 hover:text-emerald-600'}`}
                          title={s.is_active ? 'Deactivate' : 'Activate'}>
                          {togglingId === s.user_id
                            ? <Loader2 size={15} className="animate-spin" />
                            : s.is_active ? <XCircle size={15} /> : <CheckCircle size={15} />}
                        </button>
                        {/* Delete */}
                        
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
              <button
                onClick={() => fetchStudents(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} className="text-slate-600" />
              </button>
              <span className="px-3 py-1 text-sm font-medium text-slate-700">
                {pagination.page} / {pagination.total_pages}
              </span>
              <button
                onClick={() => fetchStudents(pagination.page + 1)}
                disabled={pagination.page === pagination.total_pages}
                className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} className="text-slate-600" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {viewId && <ViewModal studentId={viewId} onClose={() => setViewId(null)} />}
      {showCreate && <StudentModal onClose={() => setShowCreate(false)} onSuccess={() => fetchStudents(1)} />}
      {editStudent && <StudentModal student={editStudent} onClose={() => setEditStudent(null)} onSuccess={() => fetchStudents(pagination.page)} />}
      {deleteTarget && (
        <DeleteModal
          student={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          loading={!!deletingId}
        />
      )}
    </div>
  )
}