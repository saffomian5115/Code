import { useState, useEffect, useMemo } from 'react'
import {
  Plus, Search, X, Pencil, Trash2,
  Building2, BookOpen, Loader2
} from 'lucide-react'
import toast from 'react-hot-toast'
import { adminAPI } from '../../api/admin.api'

// ─────────────────────────────────────────────────────
// ── Modal — OUTSIDE parent component (defocus fix) ──
// ─────────────────────────────────────────────────────
const inputCls = "w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all bg-white"

const Field = ({ label, req, children }) => (
  <div>
    <label className="block text-slate-500 text-xs font-medium mb-1.5">
      {label}{req && <span className="text-red-400 ml-0.5">*</span>}
    </label>
    {children}
  </div>
)

function DeptModal({ dept, teachers, onClose, onSuccess }) {
  const isEdit = !!dept?.id
  const [form, setForm] = useState({
    name: dept?.name || '',
    code: dept?.code || '',
    description: dept?.description || '',
    head_of_department: dept?.head_of_department || '',
  })
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.code.trim()) {
      toast.error('Name and code are required')
      return
    }
    setLoading(true)
    try {
      if (isEdit) {
        await adminAPI.updateDepartment(dept.id, form)
        toast.success('Department updated!')
      } else {
        await adminAPI.createDepartment(form)
        toast.success('Department created!')
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
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h3 className="font-display font-bold text-lg text-slate-800">
            {isEdit ? 'Edit Department' : 'Add Department'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Department Name" req>
              <input
                className={inputCls}
                value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="Information Technology"
                autoFocus
              />
            </Field>
            <Field label="Code" req>
              <input
                className={inputCls}
                value={form.code}
                onChange={e => set('code', e.target.value.toUpperCase())}
                placeholder="IT"
                maxLength={10}
              />
            </Field>
          </div>

          <Field label="Description">
            <textarea
              className={inputCls}
              rows={3}
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Department description..."
            />
          </Field>

          <Field label="Head of Department">
            <select
              className={inputCls}
              value={form.head_of_department}
              onChange={e => set('head_of_department', e.target.value)}
            >
              <option value="">-- Select HOD --</option>
              {teachers.map(t => (
                <option key={t.user_id} value={t.user_id}>{t.full_name}</option>
              ))}
            </select>
          </Field>
        </div>

        <div className="p-6 pt-0 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {loading
              ? <><Loader2 size={15} className="animate-spin" /> Saving...</>
              : isEdit ? 'Save Changes' : 'Create'
            }
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────
// ── Main Page ────────────────────────────────────────
// ─────────────────────────────────────────────────────
export default function DepartmentsPage() {
  const [departments, setDepartments] = useState([])
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalDept, setModalDept] = useState(null)   // undefined = closed
  const [showModal, setShowModal] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [d, t] = await Promise.all([
        adminAPI.getDepartments(),
        adminAPI.getTeachers(1, 100)
      ])
      setDepartments(d.data.data?.departments || [])
      setTeachers(t.data.data?.teachers || [])
    } catch {
      toast.error('Failed to load departments')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  // Client-side search
  const filtered = useMemo(() => {
    if (!search.trim()) return departments
    const q = search.toLowerCase()
    return departments.filter(d =>
      d.name?.toLowerCase().includes(q) ||
      d.code?.toLowerCase().includes(q) ||
      d.description?.toLowerCase().includes(q) ||
      d.hod_name?.toLowerCase().includes(q)
    )
  }, [departments, search])

  const openCreate = () => {
    setModalDept(null)
    setShowModal(true)
  }

  const openEdit = (dept) => {
    setModalDept(dept)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setModalDept(null)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this department? This cannot be undone.')) return
    setDeletingId(id)
    try {
      await adminAPI.deleteDepartment(id)
      toast.success('Department deleted')
      fetchAll()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot delete — programs may be linked')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-800">Departments</h1>
          <p className="text-slate-400 text-sm mt-0.5">{departments.length} academic departments</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm"
        >
          <Plus size={16} /> Add Department
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search by name, code, HOD..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
        />
      </div>

      {/* Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse">
              <div className="h-5 bg-slate-100 rounded-lg mb-3 w-2/3" />
              <div className="h-4 bg-slate-100 rounded-lg mb-2 w-1/3" />
              <div className="h-4 bg-slate-100 rounded-lg w-full" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-center py-20">
          <Building2 size={40} className="text-slate-300 mb-3" />
          <p className="font-semibold text-slate-600">
            {search ? 'No departments match your search' : 'No departments yet'}
          </p>
          <p className="text-slate-400 text-sm mt-1">
            {search ? 'Try a different keyword' : 'Create your first department to get started'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(dept => (
            <div
              key={dept.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-md transition-shadow group"
            >
              {/* Top row */}
              <div className="flex items-start justify-between mb-4">
                <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Building2 size={20} className="text-blue-600" />
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(dept)}
                    className="p-1.5 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(dept.id)}
                    disabled={deletingId === dept.id}
                    className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                    title="Delete"
                  >
                    {deletingId === dept.id
                      ? <Loader2 size={14} className="animate-spin" />
                      : <Trash2 size={14} />
                    }
                  </button>
                </div>
              </div>

              {/* Info */}
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-display font-bold text-slate-800">{dept.name}</h3>
                <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-lg">
                  {dept.code}
                </span>
              </div>
              {dept.description && (
                <p className="text-slate-400 text-sm mb-3 line-clamp-2">{dept.description}</p>
              )}

              <div className="flex items-center gap-4 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <BookOpen size={12} className="text-slate-400" />
                  <span>{dept.total_programs || 0} programs</span>
                </div>
                {dept.hod_name && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 truncate">
                    <span className="w-1 h-1 bg-slate-300 rounded-full flex-shrink-0" />
                    <span className="truncate">HOD: {dept.hod_name}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <DeptModal
          dept={modalDept}
          teachers={teachers}
          onClose={closeModal}
          onSuccess={fetchAll}
        />
      )}
    </div>
  )
}