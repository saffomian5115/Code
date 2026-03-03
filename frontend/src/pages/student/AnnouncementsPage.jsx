import { useState, useEffect } from 'react'
import { studentAPI } from '../../api/student.api'
import { timeAgo, formatDate } from '../../utils/helpers'
import toast from 'react-hot-toast'
import { Bell, Pin, ChevronLeft, ChevronRight, Loader2, FileText } from 'lucide-react'

const PRIORITY_CFG = {
  urgent: { border: 'border-l-red-500',    badge: 'bg-red-100 text-red-700',    icon: '🔴' },
  high:   { border: 'border-l-orange-400', badge: 'bg-orange-100 text-orange-700', icon: '🟠' },
  normal: { border: 'border-l-blue-400',   badge: 'bg-blue-100 text-blue-700',  icon: '🔵' },
  low:    { border: 'border-l-slate-300',  badge: 'bg-slate-100 text-slate-500', icon: '⚪' },
}

export default function AnnouncementsPage() {
  const [tab, setTab] = useState('announcements')
  const [announcements, setAnnouncements] = useState([])
  const [notices, setNotices] = useState([])
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ total_pages: 1 })
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState(null)

  const fetchData = async (p = 1) => {
    setLoading(true)
    try {
      if (tab === 'announcements') {
        const res = await studentAPI.getAnnouncements(p)
        setAnnouncements(res.data.data?.announcements || [])
        setPagination(res.data.data?.pagination || { total_pages: 1 })
      } else {
        const res = await studentAPI.getNotices(p)
        setNotices(res.data.data?.notices || [])
        setPagination(res.data.data?.pagination || { total_pages: 1 })
      }
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }

  useEffect(() => { setPage(1); fetchData(1) }, [tab])
  useEffect(() => { fetchData(page) }, [page])

  const items = tab === 'announcements' ? announcements : notices
  const isPinned = (item) => item.pinned_until && new Date(item.pinned_until) >= new Date()

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="font-display font-bold text-2xl text-slate-800">Announcements & Notices</h1>
        <p className="text-slate-400 text-sm mt-0.5">Stay updated with latest information</p>
      </div>

      {/* Tab */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {[['announcements', 'Announcements', Bell], ['notices', 'Notice Board', FileText]].map(([key, label, Icon]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40"><Loader2 className="animate-spin text-blue-600 w-6 h-6" /></div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-center py-20">
          <Bell size={36} className="text-slate-300 mb-3" />
          <p className="font-semibold text-slate-500">No {tab} yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => {
            const cfg = PRIORITY_CFG[item.priority || 'normal']
            const isExp = expandedId === item.id
            return (
              <div key={item.id} className={`bg-white rounded-2xl border border-slate-200 border-l-4 ${cfg.border} overflow-hidden`}>
                <div className="p-5 cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setExpandedId(isExp ? null : item.id)}>
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm">{cfg.icon}</span>
                        <h3 className="font-display font-bold text-slate-800">{item.title}</h3>
                        {isPinned(item) && (
                          <span className="flex items-center gap-1 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                            <Pin size={9} /> Pinned
                          </span>
                        )}
                        {item.category && (
                          <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full capitalize">{item.category}</span>
                        )}
                      </div>
                      {!isExp && <p className="text-slate-500 text-sm line-clamp-1">{item.content}</p>}
                      <p className="text-xs text-slate-400 mt-1">{timeAgo(item.created_at || item.posted_at)}</p>
                    </div>
                  </div>
                </div>
                {isExp && (
                  <div className="px-5 pb-5 border-t border-slate-100 pt-4">
                    <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">{item.content}</p>
                    {item.expiry_date && (
                      <p className="text-xs text-slate-400 mt-3">Expires: {formatDate(item.expiry_date)}</p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination.total_pages > 1 && (
        <div className="flex items-center justify-end gap-1">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="p-2 hover:bg-slate-100 disabled:opacity-40 rounded-xl transition-colors">
            <ChevronLeft size={16} className="text-slate-600" />
          </button>
          {Array.from({ length: pagination.total_pages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              className={`w-8 h-8 rounded-xl text-sm font-medium transition-colors ${p === page ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>{p}</button>
          ))}
          <button onClick={() => setPage(p => Math.min(pagination.total_pages, p + 1))} disabled={page === pagination.total_pages}
            className="p-2 hover:bg-slate-100 disabled:opacity-40 rounded-xl transition-colors">
            <ChevronRight size={16} className="text-slate-600" />
          </button>
        </div>
      )}
    </div>
  )
}