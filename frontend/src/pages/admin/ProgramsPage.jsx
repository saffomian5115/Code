import { useState, useEffect } from 'react'
import { adminAPI } from '../../api/admin.api'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, GraduationCap, Loader2, X, Clock, Hash } from 'lucide-react'

function ProgramModal({ prog, departments, onClose, onSuccess }) {
  const isEdit = !!prog?.id
  const [form, setForm] = useState({
    name: prog?.name || '',
    code: prog?.code || '',
    department_id: prog?.department_id || '',
    duration_years: prog?.duration_years || 4,
    total_credit_hours: prog?.total_credit_hours || '',
    degree_type: prog?.degree_type || '',
  })
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async () => {
    if (!form.name || !form.code || !form.department_id) { toast.error('Name, code and department are required'); return }
    setLoading(true)
    try {
      if (isEdit) { await adminAPI.updateProgram(prog.id, form); toast.success('Program updated') }
      else { await adminAPI.createProgram(form); toast.success('Program created') }
      onSuccess(); onClose()
    } catch (err) { toast.error(err.response?.data?.message || 'Operation failed') }
    finally { setLoading(false) }
  }

  const inputCls = "w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
  const Field = ({ label, req, children }) => (
    <div>
      <label className="block text-slate-500 text-xs font-medium mb-1.5">{label}{req && <span className="text-red-500 ml-0.5">*</span>}</label>
      {children}
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h3 className="font-display font-bold text-lg text-slate-800">{isEdit ? 'Edit Program' : 'Add Program'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors"><X size={18} className="text-slate-500" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Program Name" req>
              <input className={inputCls} value={form.name} onChange={e => set('name', e.target.value)} placeholder="BS Information Technology" />
            </Field>
            <Field label="Code" req>
              <input className={inputCls} value={form.code} onChange={e => set('code', e.target.value.toUpperCase())} placeholder="BSIT" maxLength={15} />
            </Field>
          </div>
          <Field label="Department" req>
            <select className={inputCls} value={form.department_id} onChange={e => set('department_id', parseInt(e.target.value))}>
              <option value="">-- Select Department --</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name} ({d.code})</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Duration (Years)">
              <input className={inputCls} type="number" min={1} max={8} value={form.duration_years} onChange={e => set('duration_years', parseInt(e.target.value))} />
            </Field>
            <Field label="Credit Hours">
              <input className={inputCls} type="number" value={form.total_credit_hours} onChange={e => set('total_credit_hours', parseInt(e.target.value))} placeholder="136" />
            </Field>
            <Field label="Degree Type">
              <select className={inputCls} value={form.degree_type} onChange={e => set('degree_type', e.target.value)}>
                <option value="">Select</option>
                <option>BS</option><option>BE</option><option>MS</option><option>MBA</option>
                <option>BBA</option><option>Associate</option><option>PhD</option>
              </select>
            </Field>
          </div>
        </div>
        <div className="p-6 pt-0 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium rounded-xl transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
            {loading ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : isEdit ? 'Save Changes' : 'Create Program'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ProgramsPage() {
  const [programs, setPrograms] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [p, d] = await Promise.all([adminAPI.getPrograms(), adminAPI.getDepartments()])
      setPrograms(p.data.data?.programs || [])
      setDepartments(d.data.data?.departments || [])
    } catch { toast.error('Failed to load programs') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchAll() }, [])

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this program?')) return
    setDeletingId(id)
    try { await adminAPI.deleteProgram(id); toast.success('Program deleted'); fetchAll() }
    catch (err) { toast.error(err.response?.data?.message || 'Cannot delete') }
    finally { setDeletingId(null) }
  }

  const DEGREE_COLORS = {
    BS: 'bg-blue-100 text-blue-700', BE: 'bg-purple-100 text-purple-700',
    MS: 'bg-emerald-100 text-emerald-700', MBA: 'bg-orange-100 text-orange-700',
    BBA: 'bg-pink-100 text-pink-700', PhD: 'bg-red-100 text-red-700',
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-800">Programs</h1>
          <p className="text-slate-400 text-sm mt-0.5">{programs.length} academic programs</p>
        </div>
        <button onClick={() => setModal({})}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm">
          <Plus size={16} /> Add Program
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse space-y-3">
              <div className="h-5 bg-slate-100 rounded-lg w-2/3" />
              <div className="h-4 bg-slate-100 rounded-lg w-1/2" />
            </div>
          ))}
        </div>
      ) : programs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-center py-20">
          <GraduationCap size={40} className="text-slate-300 mb-3" />
          <p className="font-semibold text-slate-600">No programs yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {programs.map(p => (
            <div key={p.id} className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-md transition-shadow group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <GraduationCap size={18} className="text-emerald-600" />
                  </div>
                  {p.degree_type && (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${DEGREE_COLORS[p.degree_type] || 'bg-slate-100 text-slate-600'}`}>
                      {p.degree_type}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setModal(p)} className="p-1.5 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition-colors"><Pencil size={14} /></button>
                  <button onClick={() => handleDelete(p.id)} disabled={deletingId === p.id} className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors">
                    {deletingId === p.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  </button>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-display font-bold text-slate-800">{p.name}</h3>
                  <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-lg">{p.code}</span>
                </div>
                <p className="text-slate-400 text-sm">{p.department_name}</p>
                <div className="flex items-center gap-4 pt-3 mt-3 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Clock size={12} className="text-slate-400" />
                    <span>{p.duration_years || 4} years</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Hash size={12} className="text-slate-400" />
                    <span>{p.credit_hours || p.total_credit_hours || '—'} credit hrs</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span className="w-1 h-1 bg-slate-300 rounded-full" />
                    <span>{p.total_students || 0} students</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal !== null && (
        <ProgramModal
          prog={modal?.id ? modal : null}
          departments={departments}
          onClose={() => setModal(null)}
          onSuccess={fetchAll}
        />
      )}
    </div>
  )
}
