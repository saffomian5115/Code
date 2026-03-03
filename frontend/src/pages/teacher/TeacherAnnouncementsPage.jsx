import { useState, useEffect } from 'react'
import { teacherAPI } from '../../api/teacher.api'
import { timeAgo } from '../../utils/helpers'
import toast from 'react-hot-toast'
import {
  Plus, Bell, Pencil, Trash2, Loader2, X,
  ChevronLeft, ChevronRight, Pin
} from 'lucide-react'

const PRIORITY_CFG = {
  urgent: { cls: 'bg-red-100 text-red-700',    border: 'border-l-red-500',    dot: 'bg-red-500'   },
  high:   { cls: 'bg-orange-100 text-orange-700', border: 'border-l-orange-400', dot: 'bg-orange-400' },
  normal: { cls: 'bg-blue-100 text-blue-700',   border: 'border-l-blue-400',  dot: 'bg-blue-400'  },
  low:    { cls: 'bg-slate-100 text-slate-600', border: 'border-l-slate-300', dot: 'bg-slate-300'  },
}

function AnnouncementModal({ ann, offerings, onClose, onSuccess }) {
  const isEdit = !!ann?.id
  const [form, setForm] = useState({
    title:           ann?.title || '',
    content:         ann?.content || '',
    priority:        ann?.priority || 'normal',
    target_audience: ann?.target_audience || 'all',
    pinned_until:    ann?.pinned_until || '',
  })
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async () => {
    if (!form.title || !form.content) { toast.error('Title and content required'); return }
    setLoading(true)
    try {
      if (isEdit) {
        await teacherAPI.updateAnnouncement(ann.id, form)
        toast.success('Announcement updated')
      } else {
        await teacherAPI.createAnnouncement(form)
        toast.success('Announcement published')
      }
      onSuccess(); onClose()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setLoading(false) }
  }

  const inputCls = "w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-blue-400 transition-all"

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h3 className="font-display font-bold text-lg text-slate-800">
            {isEdit ? 'Edit Announcement' : 'New Announcement'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl"><X size={18} className="text-slate-500" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="block text-xs text-slate-500 font-medium mb-1.5">Title *</label>
            <input className={inputCls} value={form.title} onChange={e => set('title', e.target.value)} placeholder="Assignment deadline reminder" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 font-medium mb-1.5">Content *</label>
            <textarea className={inputCls} rows={5} value={form.content} onChange={e => set('content', e.target.value)} placeholder="Write announcement details..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 font-medium mb-1.5">Priority</label>
              <select className={inputCls} value={form.priority} onChange={e => set('priority', e.target.value)}>
                <option value="urgent">🔴 Urgent</option>
                <option value="high">🟠 High</option>
                <option value="normal">🔵 Normal</option>
                <option value="low">⚪ Low</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 font-medium mb-1.5">Target Audience</label>
              <select className={inputCls} value={form.target_audience} onChange={e => set('target_audience', e.target.value)}>
                <option value="all">All</option>
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
            {loading ? <><Loader2 size={16} className="animate-spin" /> Publishing...</> : isEdit ? 'Save Changes' : 'Publish'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function TeacherAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([])
  const [pagination, setPagination] = useState({ total: 0, page: 1, per_page: 10, total_pages: 1 })
  const [loading, setLoading] = useState(true)
  const [filterPriority, setFilterPriority] = useState('')
  const [modal, setModal] = useState(null)   // null | {} | existing ann obj
  const [deletingId, setDeletingId] = useState(null)

  const fetchAnnouncements = async (page = 1) => {
    setLoading(true)
    try {
      const res = await teacherAPI.getAnnouncements(page, filterPriority || undefined)
      setAnnouncements(res.data.data?.announcements || [])
      setPagination(res.data.data?.pagination || { total: 0, page: 1, per_page: 10, total_pages: 1 })
    } catch { toast.error('Failed to load announcements') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchAnnouncements() }, [filterPriority])

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement?')) return
    setDeletingId(id)
    try {
      await teacherAPI.deleteAnnouncement(id)
      toast.success('Announcement deleted')
      fetchAnnouncements(pagination.page)
    } catch { toast.error('Failed to delete') }
    finally { setDeletingId(null) }
  }

  const isPinned = (ann) => ann.pinned_until && new Date(ann.pinned_until) >= new Date()

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-800">Announcements</h1>
          <p className="text-slate-400 text-sm mt-0.5">{pagination.total} announcements published</p>
        </div>
        <button onClick={() => setModal({})}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm">
          <Plus size={16} /> New Announcement
        </button>
      </div>

      {/* Priority Filter */}
      <div className="flex gap-2 flex-wrap">
        {[['', 'All'], ['urgent', '🔴 Urgent'], ['high', '🟠 High'], ['normal', '🔵 Normal'], ['low', '⚪ Low']].map(([val, label]) => (
          <button key={val} onClick={() => setFilterPriority(val)}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-colors ${filterPriority === val ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Announcements List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse space-y-2">
              <div className="h-4 bg-slate-100 rounded-lg w-2/3" />
              <div className="h-3 bg-slate-100 rounded-lg w-full" />
            </div>
          ))}
        </div>
      ) : announcements.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-center py-20">
          <Bell size={40} className="text-slate-300 mb-3" />
          <p className="font-semibold text-slate-600">No announcements yet</p>
          <p className="text-slate-400 text-sm mt-1">Publish your first announcement to students</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map(ann => {
            const cfg = PRIORITY_CFG[ann.priority] || PRIORITY_CFG.normal
            return (
              <div key={ann.id} className={`bg-white rounded-2xl border border-slate-200 border-l-4 ${cfg.border} p-5 group hover:shadow-sm transition-shadow`}>
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <h3 className="font-display font-bold text-slate-800">{ann.title}</h3>
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${cfg.cls}`}>{ann.priority}</span>
                      {isPinned(ann) && (
                        <span className="flex items-center gap-1 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
                          <Pin size={10} /> Pinned
                        </span>
                      )}
                      <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full capitalize">{ann.target_audience}</span>
                    </div>
                    <p className="text-slate-500 text-sm line-clamp-2 mb-2">{ann.content}</p>
                    <p className="text-xs text-slate-400">{timeAgo(ann.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button onClick={() => setModal(ann)}
                      className="p-2 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-xl transition-colors">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(ann.id)} disabled={deletingId === ann.id}
                      className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl transition-colors">
                      {deletingId === ann.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination.total_pages > 1 && (
        <div className="flex items-center justify-end gap-1">
          <button onClick={() => fetchAnnouncements(pagination.page - 1)} disabled={pagination.page === 1}
            className="p-2 hover:bg-slate-100 disabled:opacity-40 rounded-xl transition-colors">
            <ChevronLeft size={16} className="text-slate-600" />
          </button>
          {Array.from({ length: pagination.total_pages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => fetchAnnouncements(p)}
              className={`w-8 h-8 rounded-xl text-sm font-medium transition-colors ${p === pagination.page ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
              {p}
            </button>
          ))}
          <button onClick={() => fetchAnnouncements(pagination.page + 1)} disabled={pagination.page === pagination.total_pages}
            className="p-2 hover:bg-slate-100 disabled:opacity-40 rounded-xl transition-colors">
            <ChevronRight size={16} className="text-slate-600" />
          </button>
        </div>
      )}

      {modal !== null && (
        <AnnouncementModal
          ann={modal?.id ? modal : null}
          offerings={[]}
          onClose={() => setModal(null)}
          onSuccess={() => fetchAnnouncements(1)}
        />
      )}
    </div>
  )
}
