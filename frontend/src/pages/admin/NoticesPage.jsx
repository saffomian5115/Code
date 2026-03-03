import { useState, useEffect } from 'react'
import { adminAPI } from '../../api/admin.api'
import { timeAgo } from '../../utils/helpers'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, FileText, Loader2, X, ChevronLeft, ChevronRight } from 'lucide-react'

const CATEGORIES = ['general', 'academic', 'exam', 'holiday', 'event', 'urgent']
const CAT_COLORS = {
  general:  'bg-slate-100 text-slate-600',
  academic: 'bg-blue-100 text-blue-700',
  exam:     'bg-purple-100 text-purple-700',
  holiday:  'bg-emerald-100 text-emerald-700',
  event:    'bg-orange-100 text-orange-700',
  urgent:   'bg-red-100 text-red-700',
}

function NoticeModal({ notice, onClose, onSuccess }) {
  const isEdit = !!notice?.id
  const [form, setForm] = useState({
    title: notice?.title || '', content: notice?.content || '',
    category: notice?.category || 'general',
    target_audience: notice?.target_audience || 'all',
    expiry_date: notice?.expiry_date || '',
  })
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async () => {
    if (!form.title || !form.content) { toast.error('Title and content required'); return }
    setLoading(true)
    try {
      if (isEdit) { await adminAPI.updateNotice(notice.id, form); toast.success('Notice updated') }
      else { await adminAPI.createNotice(form); toast.success('Notice published') }
      onSuccess(); onClose()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setLoading(false) }
  }

  const inputCls = "w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-blue-400 transition-all"

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h3 className="font-display font-bold text-lg text-slate-800">{isEdit ? 'Edit Notice' : 'Publish Notice'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl"><X size={18} className="text-slate-500" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="block text-xs text-slate-500 font-medium mb-1.5">Title *</label>
            <input className={inputCls} value={form.title} onChange={e => set('title', e.target.value)} placeholder="Notice title..." />
          </div>
          <div>
            <label className="block text-xs text-slate-500 font-medium mb-1.5">Content *</label>
            <textarea className={inputCls} rows={5} value={form.content} onChange={e => set('content', e.target.value)} placeholder="Notice details..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 font-medium mb-1.5">Category</label>
              <select className={inputCls} value={form.category} onChange={e => set('category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 font-medium mb-1.5">Target Audience</label>
              <select className={inputCls} value={form.target_audience} onChange={e => set('target_audience', e.target.value)}>
                <option value="all">All</option>
                <option value="students">Students</option>
                <option value="teachers">Teachers</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-500 font-medium mb-1.5">Expiry Date (optional)</label>
            <input className={inputCls} type="date" value={form.expiry_date} onChange={e => set('expiry_date', e.target.value)} />
          </div>
        </div>
        <div className="p-6 pt-0 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium rounded-xl transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
            {loading ? <><Loader2 size={16} className="animate-spin" /> Publishing...</> : isEdit ? 'Save Changes' : 'Publish Notice'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function NoticesPage() {
  const [notices, setNotices] = useState([])
  const [pagination, setPagination] = useState({ total: 0, page: 1, per_page: 10, total_pages: 1 })
  const [loading, setLoading] = useState(true)
  const [filterCat, setFilterCat] = useState('')
  const [modal, setModal] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const fetchNotices = async (page = 1) => {
    setLoading(true)
    try {
      const res = await adminAPI.getNotices(page, filterCat)
      setNotices(res.data.data?.notices || [])
      setPagination(res.data.data?.pagination || { total: 0, page: 1, per_page: 10, total_pages: 1 })
    } catch { toast.error('Failed to load notices') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchNotices() }, [filterCat])

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this notice?')) return
    setDeletingId(id)
    try { await adminAPI.deleteNotice(id); toast.success('Deleted'); fetchNotices() }
    catch { toast.error('Failed to delete') }
    finally { setDeletingId(null) }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-800">Notice Board</h1>
          <p className="text-slate-400 text-sm mt-0.5">{pagination.total} published notices</p>
        </div>
        <button onClick={() => setModal({})}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm">
          <Plus size={16} /> Publish Notice
        </button>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilterCat('')}
          className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-colors ${!filterCat ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
          All
        </button>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setFilterCat(c)}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-colors capitalize ${filterCat === c ? 'bg-slate-700 text-white' : `${CAT_COLORS[c]} hover:opacity-80`}`}>
            {c}
          </button>
        ))}
      </div>

      {/* Notices List */}
      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse space-y-2">
            <div className="h-4 bg-slate-100 rounded-lg w-2/3" />
            <div className="h-3 bg-slate-100 rounded-lg w-full" />
          </div>
        ))}</div>
      ) : notices.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-center py-20">
          <FileText size={40} className="text-slate-300 mb-3" />
          <p className="font-semibold text-slate-600">No notices yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notices.map(n => (
            <div key={n.id} className="bg-white rounded-2xl border border-slate-200 p-5 group hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FileText size={16} className="text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-display font-bold text-slate-800">{n.title}</h3>
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${CAT_COLORS[n.category] || CAT_COLORS.general}`}>
                        {n.category}
                      </span>
                      <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{n.target_audience}</span>
                    </div>
                    <p className="text-slate-500 text-sm line-clamp-2">{n.content}</p>
                    <p className="text-xs text-slate-400 mt-2">{timeAgo(n.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button onClick={() => setModal(n)} className="p-1.5 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition-colors"><Pencil size={14} /></button>
                  <button onClick={() => handleDelete(n.id)} disabled={deletingId === n.id}
                    className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors">
                    {deletingId === n.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.total_pages > 1 && (
        <div className="flex items-center justify-end gap-1">
          <button onClick={() => fetchNotices(pagination.page - 1)} disabled={pagination.page === 1}
            className="p-2 hover:bg-slate-100 disabled:opacity-40 rounded-lg transition-colors">
            <ChevronLeft size={16} className="text-slate-600" />
          </button>
          {Array.from({ length: pagination.total_pages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => fetchNotices(p)}
              className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${p === pagination.page ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
              {p}
            </button>
          ))}
          <button onClick={() => fetchNotices(pagination.page + 1)} disabled={pagination.page === pagination.total_pages}
            className="p-2 hover:bg-slate-100 disabled:opacity-40 rounded-lg transition-colors">
            <ChevronRight size={16} className="text-slate-600" />
          </button>
        </div>
      )}

      {modal !== null && <NoticeModal notice={modal?.id ? modal : null} onClose={() => setModal(null)} onSuccess={() => fetchNotices(1)} />}
    </div>
  )
}
