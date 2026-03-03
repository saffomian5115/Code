// ═══════════════════════════════════════════════════
// AnnouncementsPage.jsx
// ═══════════════════════════════════════════════════
import { useState, useEffect } from 'react'
import { adminAPI } from '../../api/admin.api'
import { timeAgo, formatDate } from '../../utils/helpers'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, Bell, Loader2, X, ChevronLeft, ChevronRight } from 'lucide-react'

const PRIORITIES = ['urgent', 'high', 'normal', 'low']
const PRIORITY_COLORS = {
  urgent: 'bg-red-100 text-red-700 border-red-200',
  high:   'bg-orange-100 text-orange-700 border-orange-200',
  normal: 'bg-blue-100 text-blue-700 border-blue-200',
  low:    'bg-slate-100 text-slate-600 border-slate-200',
}
const PRIORITY_LEFT = {
  urgent: 'border-l-red-500',
  high:   'border-l-orange-500',
  normal: 'border-l-blue-500',
  low:    'border-l-slate-300',
}

function AnnModal({ ann, onClose, onSuccess }) {
  const isEdit = !!ann?.id
  const [form, setForm] = useState({
    title: ann?.title || '', content: ann?.content || '',
    target_type: ann?.target_type || 'all', priority: ann?.priority || 'normal',
    pinned_until: ann?.pinned_until || '',
  })
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async () => {
    if (!form.title || !form.content) { toast.error('Title and content required'); return }
    setLoading(true)
    try {
      if (isEdit) { await adminAPI.updateAnnouncement(ann.id, form); toast.success('Announcement updated') }
      else { await adminAPI.createAnnouncement(form); toast.success('Announcement posted') }
      onSuccess(); onClose()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setLoading(false) }
  }

  const inputCls = "w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-blue-400 transition-all"

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h3 className="font-display font-bold text-lg text-slate-800">{isEdit ? 'Edit Announcement' : 'New Announcement'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl"><X size={18} className="text-slate-500" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="block text-xs text-slate-500 font-medium mb-1.5">Title *</label>
            <input className={inputCls} value={form.title} onChange={e => set('title', e.target.value)} placeholder="Announcement title..." />
          </div>
          <div>
            <label className="block text-xs text-slate-500 font-medium mb-1.5">Content *</label>
            <textarea className={inputCls} rows={5} value={form.content} onChange={e => set('content', e.target.value)} placeholder="Write your announcement here..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 font-medium mb-1.5">Priority</label>
              <select className={inputCls} value={form.priority} onChange={e => set('priority', e.target.value)}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 font-medium mb-1.5">Target</label>
              <select className={inputCls} value={form.target_type} onChange={e => set('target_type', e.target.value)}>
                <option value="all">All Users</option>
                <option value="students">Students Only</option>
                <option value="teachers">Teachers Only</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-500 font-medium mb-1.5">Pin Until (optional)</label>
            <input className={inputCls} type="date" value={form.pinned_until} onChange={e => set('pinned_until', e.target.value)} />
          </div>
        </div>
        <div className="p-6 pt-0 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium rounded-xl transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
            {loading ? <><Loader2 size={16} className="animate-spin" /> Posting...</> : isEdit ? 'Save Changes' : 'Post Announcement'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([])
  const [pagination, setPagination] = useState({ total: 0, page: 1, per_page: 10, total_pages: 1 })
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const fetchAnn = async (page = 1) => {
    setLoading(true)
    try {
      const res = await adminAPI.getAnnouncements(page, 10)
      setAnnouncements(res.data.data?.announcements || [])
      setPagination(res.data.data?.pagination || { total: 0, page: 1, per_page: 10, total_pages: 1 })
    } catch { toast.error('Failed to load announcements') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchAnn() }, [])

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement?')) return
    setDeletingId(id)
    try { await adminAPI.deleteAnnouncement(id); toast.success('Deleted'); fetchAnn(pagination.page) }
    catch { toast.error('Failed to delete') }
    finally { setDeletingId(null) }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-800">Announcements</h1>
          <p className="text-slate-400 text-sm mt-0.5">{pagination.total} total announcements</p>
        </div>
        <button onClick={() => setModal({})}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm">
          <Plus size={16} /> New Announcement
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse space-y-2">
            <div className="h-4 bg-slate-100 rounded-lg w-2/3" />
            <div className="h-3 bg-slate-100 rounded-lg w-full" />
          </div>
        ))}</div>
      ) : announcements.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-center py-20">
          <Bell size={40} className="text-slate-300 mb-3" />
          <p className="font-semibold text-slate-600">No announcements yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map(ann => (
            <div key={ann.id} className={`bg-white rounded-2xl border border-slate-200 border-l-4 ${PRIORITY_LEFT[ann.priority] || 'border-l-blue-500'} p-5 group hover:shadow-sm transition-shadow`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-display font-bold text-slate-800">{ann.title}</h3>
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${PRIORITY_COLORS[ann.priority] || PRIORITY_COLORS.normal}`}>
                      {ann.priority}
                    </span>
                    <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{ann.target_type}</span>
                  </div>
                  <p className="text-slate-500 text-sm line-clamp-2">{ann.content}</p>
                  <p className="text-xs text-slate-400 mt-2">{timeAgo(ann.created_at)} · {ann.created_by_name}</p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button onClick={() => setModal(ann)} className="p-1.5 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition-colors"><Pencil size={14} /></button>
                  <button onClick={() => handleDelete(ann.id)} disabled={deletingId === ann.id}
                    className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors">
                    {deletingId === ann.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
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
          <button onClick={() => fetchAnn(pagination.page - 1)} disabled={pagination.page === 1}
            className="p-2 hover:bg-slate-100 disabled:opacity-40 rounded-lg transition-colors">
            <ChevronLeft size={16} className="text-slate-600" />
          </button>
          {Array.from({ length: pagination.total_pages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => fetchAnn(p)}
              className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${p === pagination.page ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
              {p}
            </button>
          ))}
          <button onClick={() => fetchAnn(pagination.page + 1)} disabled={pagination.page === pagination.total_pages}
            className="p-2 hover:bg-slate-100 disabled:opacity-40 rounded-lg transition-colors">
            <ChevronRight size={16} className="text-slate-600" />
          </button>
        </div>
      )}

      {modal !== null && <AnnModal ann={modal?.id ? modal : null} onClose={() => setModal(null)} onSuccess={() => fetchAnn(1)} />}
    </div>
  )
}

export default AnnouncementsPage
