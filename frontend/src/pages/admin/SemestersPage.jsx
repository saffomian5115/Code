import { useState, useEffect } from 'react'
import {
  Plus, X, Calendar, CheckCircle2,
  Loader2, Edit2, Zap, Clock, ChevronRight
} from 'lucide-react'
import toast from 'react-hot-toast'
import { adminAPI } from '../../api/admin.api'

// ── helpers ───────────────────────────────────────
const inputCls = "w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all bg-white"

const Field = ({ label, req, children }) => (
  <div>
    <label className="block text-slate-500 text-xs font-medium mb-1.5">
      {label}{req && <span className="text-red-400 ml-0.5">*</span>}
    </label>
    {children}
  </div>
)

// toISODate — backend se "2025-01-15" format aata hai, input[date] ko same chahiye
const toDateInput = (val) => {
  if (!val) return ''
  return val.slice(0, 10)   // "2025-01-15T00:00:00" → "2025-01-15"
}

// ── Modal — outside parent (defocus fix) ─────────
function SemesterModal({ semester, onClose, onSuccess }) {
  const isEdit = !!semester?.id

  const [form, setForm] = useState({
    name:               semester?.name               || '',
    code:               semester?.code               || '',
    start_date:         toDateInput(semester?.start_date)         || '',
    end_date:           toDateInput(semester?.end_date)           || '',
    registration_start: toDateInput(semester?.registration_start) || '',
    registration_end:   toDateInput(semester?.registration_end)   || '',
  })
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.start_date || !form.end_date) {
      toast.error('Name, start date and end date required')
      return
    }
    if (form.end_date <= form.start_date) {
      toast.error('End date must be after start date')
      return
    }
    setLoading(true)
    try {
      if (isEdit) {
        await adminAPI.updateSemester(semester.id, {
          name:               form.name,
          code:               form.code || undefined,
          start_date:         form.start_date,
          end_date:           form.end_date,
          registration_start: form.registration_start || undefined,
          registration_end:   form.registration_end   || undefined,
        })
        toast.success('Semester updated!')
      } else {
        await adminAPI.createSemester({
          name:               form.name,
          code:               form.code || undefined,
          start_date:         form.start_date,
          end_date:           form.end_date,
          registration_start: form.registration_start || undefined,
          registration_end:   form.registration_end   || undefined,
        })
        toast.success('Semester created!')
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
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h3 className="font-display font-bold text-lg text-slate-800">
            {isEdit ? 'Edit Semester' : 'Add Semester'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Semester Name" req>
              <input className={inputCls} value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="Spring 2025" autoFocus />
            </Field>
            <Field label="Code">
              <input className={inputCls} value={form.code}
                onChange={e => set('code', e.target.value)}
                placeholder="SP-2025" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Start Date" req>
              <input className={inputCls} type="date" value={form.start_date}
                onChange={e => set('start_date', e.target.value)} />
            </Field>
            <Field label="End Date" req>
              <input className={inputCls} type="date" value={form.end_date}
                onChange={e => set('end_date', e.target.value)} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Registration Start">
              <input className={inputCls} type="date" value={form.registration_start}
                onChange={e => set('registration_start', e.target.value)} />
            </Field>
            <Field label="Registration End">
              <input className={inputCls} type="date" value={form.registration_end}
                onChange={e => set('registration_end', e.target.value)} />
            </Field>
          </div>

          <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700">
            💡 Active karne ke liye semester card pe <strong>"Set Active"</strong> button use karo
          </div>
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
              : isEdit ? 'Save Changes' : 'Create Semester'
            }
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────
export default function SemestersPage() {
  const [semesters, setSemesters] = useState([])
  const [loading, setLoading] = useState(true)
  const [activatingId, setActivatingId] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editSemester, setEditSemester] = useState(null)

  const fetchSemesters = async () => {
    setLoading(true)
    try {
      const res = await adminAPI.getSemesters()
      setSemesters(res.data.data?.semesters || [])
    } catch {
      toast.error('Failed to load semesters')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchSemesters() }, [])

  const openCreate = () => { setEditSemester(null); setShowModal(true) }
  const openEdit   = (sem) => { setEditSemester(sem); setShowModal(true) }
  const closeModal = () => { setShowModal(false); setEditSemester(null) }

  const handleActivate = async (sem) => {
    if (sem.is_active) {
      toast('Ye semester already active hai', { icon: 'ℹ️' })
      return
    }
    setActivatingId(sem.id)
    try {
      await adminAPI.activateSemester(sem.id)
      toast.success(`"${sem.name}" active ho gaya!`)
      fetchSemesters()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Activation failed')
    } finally {
      setActivatingId(null)
    }
  }

  const getStatusBadge = (sem) => {
    if (sem.is_active)
      return { label: 'Active', cls: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 }
    const now = new Date()
    if (sem.end_date && new Date(sem.end_date) < now)
      return { label: 'Completed', cls: 'bg-slate-100 text-slate-500', icon: Clock }
    if (sem.start_date && new Date(sem.start_date) > now)
      return { label: 'Upcoming', cls: 'bg-blue-100 text-blue-700', icon: ChevronRight }
    return { label: 'Inactive', cls: 'bg-orange-100 text-orange-700', icon: Clock }
  }

  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

  return (
    <div className="space-y-6 max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-800">Semesters</h1>
          <p className="text-slate-400 text-sm mt-0.5">{semesters.length} semesters configured</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm">
          <Plus size={16} /> Add Semester
        </button>
      </div>

      {/* Cards */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse flex gap-4">
              <div className="w-12 h-12 bg-slate-100 rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-100 rounded-lg w-1/3" />
                <div className="h-3 bg-slate-100 rounded-lg w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : semesters.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-center py-20">
          <Calendar size={40} className="text-slate-300 mb-3" />
          <p className="font-semibold text-slate-600">No semesters yet</p>
          <p className="text-slate-400 text-sm mt-1">Add your first semester to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {semesters.map(sem => {
            const status = getStatusBadge(sem)
            const StatusIcon = status.icon
            return (
              <div key={sem.id}
                className={`bg-white rounded-2xl border-2 p-5 transition-all ${sem.is_active ? 'border-emerald-300 shadow-sm shadow-emerald-100' : 'border-slate-200 hover:border-slate-300'}`}>
                <div className="flex items-start justify-between gap-4">
                  {/* Left */}
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${sem.is_active ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                      <Calendar size={22} className={sem.is_active ? 'text-emerald-600' : 'text-slate-400'} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-display font-bold text-slate-800 text-lg">{sem.name}</h3>
                        {sem.code && (
                          <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-lg">
                            {sem.code}
                          </span>
                        )}
                        <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full ${status.cls}`}>
                          <StatusIcon size={11} />
                          {status.label}
                        </span>
                      </div>

                      {/* Dates row */}
                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar size={11} className="text-slate-400" />
                          {fmt(sem.start_date)} → {fmt(sem.end_date)}
                        </span>
                        {sem.registration_start && (
                          <span className="flex items-center gap-1">
                            <Clock size={11} className="text-slate-400" />
                            Reg: {fmt(sem.registration_start)} → {fmt(sem.registration_end)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Set Active button */}
                    <button
                      onClick={() => handleActivate(sem)}
                      disabled={sem.is_active || activatingId === sem.id}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                        sem.is_active
                          ? 'bg-emerald-100 text-emerald-700 cursor-default'
                          : 'bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-700'
                      }`}
                    >
                      {activatingId === sem.id
                        ? <Loader2 size={13} className="animate-spin" />
                        : <Zap size={13} />
                      }
                      {sem.is_active ? 'Active' : 'Set Active'}
                    </button>

                    {/* Edit button */}
                    <button
                      onClick={() => openEdit(sem)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-xl text-xs font-semibold transition-colors"
                    >
                      <Edit2 size={13} /> Edit
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <SemesterModal
          semester={editSemester}
          onClose={closeModal}
          onSuccess={fetchSemesters}
        />
      )}
    </div>
  )
}