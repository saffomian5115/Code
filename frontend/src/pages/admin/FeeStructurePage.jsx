import { useState, useEffect, useMemo } from 'react'
import { adminAPI } from '../../api/admin.api'
import { formatCurrency } from '../../utils/helpers'
import toast from 'react-hot-toast'
import { Plus, Pencil, Loader2, X, DollarSign, Search, Trash2 } from 'lucide-react'

// ── outside parent — defocus fix ──────────────────
const inputCls = "w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all bg-white"
const Field = ({ label, req, children }) => (
  <div>
    <label className="block text-xs text-slate-500 font-medium mb-1.5">
      {label}{req && <span className="text-red-400 ml-0.5">*</span>}
    </label>
    {children}
  </div>
)

function FeeStructureModal({ structure, programs, onClose, onSuccess }) {
  const isEdit = !!structure?.id
  const [form, setForm] = useState({
    program_id:      structure?.program_id      || '',
    semester_number: structure?.semester_number || 1,
    tuition_fee:     structure?.tuition_fee     || 35000,
    admission_fee:   structure?.admission_fee   || 0,
    library_fee:     structure?.library_fee     || 1000,
    sports_fee:      structure?.sports_fee      || 500,
    other_fees:      structure?.other_fees      || [],
    valid_from:      structure?.valid_from      || new Date().toISOString().split('T')[0],
  })
  const [loading, setLoading] = useState(false)
  const [otherFee, setOtherFee] = useState({ name: '', amount: '' })
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const totalFee = parseFloat(form.tuition_fee || 0)
    + parseFloat(form.admission_fee || 0)
    + parseFloat(form.library_fee || 0)
    + parseFloat(form.sports_fee || 0)
    + (form.other_fees || []).reduce((sum, f) => sum + parseFloat(f.amount || 0), 0)

  const addOtherFee = () => {
    if (!otherFee.name || !otherFee.amount) return
    set('other_fees', [...(form.other_fees || []), { name: otherFee.name, amount: parseFloat(otherFee.amount) }])
    setOtherFee({ name: '', amount: '' })
  }
  const removeOtherFee = (i) => set('other_fees', form.other_fees.filter((_, idx) => idx !== i))

  const handleSubmit = async () => {
    if (!form.program_id) { toast.error('Program required'); return }
    if (!form.tuition_fee || form.tuition_fee <= 0) { toast.error('Tuition fee required'); return }
    setLoading(true)
    try {
      if (isEdit) {
        await adminAPI.updateFeeStructure(structure.id, form)
        toast.success('Fee structure updated!')
      } else {
        await adminAPI.createFeeStructure(form)
        toast.success('Fee structure created!')
      }
      onSuccess()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h3 className="font-display font-bold text-lg text-slate-800">
            {isEdit ? 'Edit Fee Structure' : 'Add Fee Structure'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Program" req>
              <select className={inputCls} value={form.program_id}
                onChange={e => set('program_id', Number(e.target.value))} disabled={isEdit}>
                <option value="">-- Select Program --</option>
                {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
            <Field label="Semester Number" req>
              <select className={inputCls} value={form.semester_number}
                onChange={e => set('semester_number', Number(e.target.value))} disabled={isEdit}>
                {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>Semester {n}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Tuition Fee (Rs.)" req>
              <input className={inputCls} type="number" value={form.tuition_fee}
                onChange={e => set('tuition_fee', parseFloat(e.target.value) || 0)} />
            </Field>
            <Field label="Admission Fee (Rs.)">
              <input className={inputCls} type="number" value={form.admission_fee}
                onChange={e => set('admission_fee', parseFloat(e.target.value) || 0)} />
            </Field>
            <Field label="Library Fee (Rs.)">
              <input className={inputCls} type="number" value={form.library_fee}
                onChange={e => set('library_fee', parseFloat(e.target.value) || 0)} />
            </Field>
            <Field label="Sports Fee (Rs.)">
              <input className={inputCls} type="number" value={form.sports_fee}
                onChange={e => set('sports_fee', parseFloat(e.target.value) || 0)} />
            </Field>
          </div>

          {/* Other Fees */}
          <div>
            <label className="block text-xs text-slate-500 font-medium mb-2">Other Fees (Optional)</label>
            {(form.other_fees || []).length > 0 && (
              <div className="space-y-2 mb-3">
                {form.other_fees.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl">
                    <span className="flex-1 text-sm text-slate-700">{f.name}</span>
                    <span className="text-sm font-medium text-slate-700">{formatCurrency(f.amount)}</span>
                    <button onClick={() => removeOtherFee(i)}
                      className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors">
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input value={otherFee.name} onChange={e => setOtherFee(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Lab Fee" className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400" />
              <input value={otherFee.amount} onChange={e => setOtherFee(p => ({ ...p, amount: e.target.value }))}
                type="number" placeholder="Amount"
                className="w-28 border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400" />
              <button onClick={addOtherFee}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors">
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* Total */}
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex justify-between items-center">
            <span className="text-emerald-700 font-semibold text-sm">Total per Semester</span>
            <span className="text-emerald-800 font-display font-bold text-xl">{formatCurrency(totalFee)}</span>
          </div>

          <Field label="Valid From" req>
            <input className={inputCls} type="date" value={form.valid_from}
              onChange={e => set('valid_from', e.target.value)} />
          </Field>
        </div>

        <div className="p-6 pt-0 flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium rounded-xl transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
            {loading ? <><Loader2 size={15} className="animate-spin" /> Saving...</> : isEdit ? 'Save Changes' : 'Create Structure'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────
export default function FeeStructurePage() {
  const [structures, setStructures] = useState([])
  const [programs, setPrograms]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [filterProgram, setFilterProgram] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [editStructure, setEditStructure] = useState(null)

  const fetchStructures = async () => {
    setLoading(true)
    try {
      const res = await adminAPI.getFeeStructures(filterProgram || undefined)
      // backend returns "structures" key
      setStructures(res.data.data?.structures || res.data.data?.fee_structures || [])
    } catch { toast.error('Failed to load fee structures') }
    finally { setLoading(false) }
  }

  useEffect(() => {
    fetchStructures()
    adminAPI.getPrograms().then(r => setPrograms(r.data.data?.programs || []))
  }, [])

  useEffect(() => { fetchStructures() }, [filterProgram])

  const grouped = useMemo(() => {
    const map = {}
    structures.forEach(s => {
      const key = s.program_name || 'Unknown'
      if (!map[key]) map[key] = []
      map[key].push(s)
    })
    return map
  }, [structures])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-800">Fee Structure</h1>
          <p className="text-slate-400 text-sm mt-0.5">Semester-wise fee per program</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm">
          <Plus size={16} /> Add Structure
        </button>
      </div>

      {/* Filter */}
      <select value={filterProgram} onChange={e => setFilterProgram(e.target.value)}
        className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-600 focus:outline-none bg-white min-w-52">
        <option value="">All Programs</option>
        {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="h-20 bg-white rounded-2xl border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : structures.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-center py-20">
          <DollarSign size={40} className="text-slate-300 mb-3" />
          <p className="font-semibold text-slate-600">No fee structures configured</p>
          <p className="text-slate-400 text-sm mt-1 mb-4">Add fee structure for each program and semester</p>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
            <Plus size={14} /> Add First Structure
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([programName, items]) => (
            <div key={programName} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
                <h3 className="font-semibold text-slate-700 text-sm">{programName}</h3>
                <p className="text-xs text-slate-400">{items.length} semesters configured</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {['Semester', 'Tuition', 'Admission', 'Library', 'Sports', 'Other', 'Total', 'Valid From', ''].map(h => (
                        <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {items.sort((a,b) => a.semester_number - b.semester_number).map(s => {
                      const otherTotal = (s.other_fees || []).reduce((sum, f) => sum + parseFloat(f.amount || 0), 0)
                      return (
                        <tr key={s.id} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-4 py-3">
                            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-lg">
                              Sem {s.semester_number}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-700 font-medium">{formatCurrency(s.tuition_fee)}</td>
                          <td className="px-4 py-3 text-slate-500">{s.admission_fee > 0 ? formatCurrency(s.admission_fee) : '—'}</td>
                          <td className="px-4 py-3 text-slate-500">{formatCurrency(s.library_fee)}</td>
                          <td className="px-4 py-3 text-slate-500">{formatCurrency(s.sports_fee)}</td>
                          <td className="px-4 py-3 text-slate-500">{otherTotal > 0 ? formatCurrency(otherTotal) : '—'}</td>
                          <td className="px-4 py-3 font-display font-bold text-slate-800">{formatCurrency(s.total_fee)}</td>
                          <td className="px-4 py-3 text-xs text-slate-400">{s.valid_from}</td>
                          <td className="px-4 py-3">
                            <button onClick={() => setEditStructure(s)}
                              className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition-all">
                              <Pencil size={14} />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate   && <FeeStructureModal programs={programs} onClose={() => setShowCreate(false)}       onSuccess={fetchStructures} />}
      {editStructure && <FeeStructureModal structure={editStructure} programs={programs} onClose={() => setEditStructure(null)} onSuccess={fetchStructures} />}
    </div>
  )
}