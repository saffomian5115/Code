// frontend/src/pages/student/AnnouncementsPage.jsx
import { useState, useEffect, useCallback } from 'react'
import {
  Bell, FileText, X, ChevronLeft, ChevronRight,
  Loader2, Pin, Calendar,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { studentAPI } from '../../api/student.api'

const CSS = `
  @keyframes spin { to { transform: rotate(360deg) } }
  @keyframes neu-slide-up { from{opacity:0;transform:translateY(20px) scale(.97)} to{opacity:1;transform:none} }

  .ann-card {
    position: relative;
    padding: 1rem 1.2rem;
    border-radius: 1rem;
    border: 1px solid var(--neu-border);
    background: var(--neu-surface);
    cursor: pointer;
    user-select: none;
    transition: all 0.25s ease;
    box-shadow: 5px 5px 14px var(--neu-shadow-dark), -3px -3px 10px var(--neu-shadow-light);
  }
  .ann-card:hover {
    transform: translateY(-2px);
    box-shadow: 8px 14px 28px var(--neu-shadow-dark), -4px -4px 14px var(--neu-shadow-light);
    border-color: rgba(91,138,240,0.3);
  }
  .ann-card::before {
    content: '';
    position: absolute;
    left: 0; top: 12px; bottom: 12px;
    width: 3px; border-radius: 99px;
  }
  .ann-urgent::before { background: #ef4444; }
  .ann-high::before   { background: #f97316; }
  .ann-normal::before { background: #5b8af0; }
  .ann-low::before    { background: #94a3b8; }
`

const PRI = {
  urgent: { label: '🔴 Urgent', bg: 'rgba(239,68,68,.1)', color: '#ef4444' },
  high:   { label: '🟠 High',   bg: 'rgba(249,115,22,.1)', color: '#f97316' },
  normal: { label: '🔵 Normal', bg: 'rgba(91,138,240,.1)', color: '#5b8af0' },
  low:    { label: '⚪ Low',    bg: 'rgba(148,163,184,.08)', color: '#94a3b8' },
}

const TARGET_OPTIONS = [
  { value: 'all',        label: '🌐 All Users'  },
  { value: 'department', label: '🏢 Department' },
  { value: 'program',    label: '🎓 Program'    },
  { value: 'course',     label: '📚 Course'     },
  { value: 'section',    label: '👥 Section'    },
]

function AnnViewModal({ ann, onClose }) {
  const pri = PRI[ann.priority] || PRI.normal
  const target = TARGET_OPTIONS.find(t => t.value === ann.target_type)
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(8,12,20,.7)', backdropFilter:'blur(10px)', zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
      <div style={{ width:'100%', maxWidth:520, background:'var(--neu-surface)', boxShadow:'14px 14px 36px var(--neu-shadow-dark), -6px -6px 20px var(--neu-shadow-light)', border:'1px solid var(--neu-border)', borderRadius:'1.5rem', maxHeight:'90vh', display:'flex', flexDirection:'column', overflow:'hidden', animation:'neu-slide-up .2s cubic-bezier(.34,1.56,.64,1) both' }}>
        <div style={{ padding:'1.4rem 1.5rem', borderBottom:'1px solid var(--neu-border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'.65rem' }}>
            <div style={{ width:34, height:34, borderRadius:'.65rem', background:pri.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Bell size={15} style={{ color:pri.color }} />
            </div>
            <h2 style={{ fontSize:'1rem', fontWeight:700, color:'var(--neu-text-primary)', fontFamily:'Outfit,sans-serif' }}>Announcement</h2>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--neu-text-ghost)' }}><X size={18}/></button>
        </div>
        <div style={{ padding:'1.2rem 1.5rem', display:'flex', flexDirection:'column', gap:'.85rem', overflowY:'auto' }}>
          <div>
            <p style={{ fontSize:'.7rem', fontWeight:700, color:'var(--neu-text-ghost)', textTransform:'uppercase', marginBottom:'.25rem' }}>Title</p>
            <p style={{ fontSize:'.95rem', fontWeight:700, color:'var(--neu-text-primary)' }}>{ann.title}</p>
          </div>
          <div>
            <p style={{ fontSize:'.7rem', fontWeight:700, color:'var(--neu-text-ghost)', textTransform:'uppercase', marginBottom:'.25rem' }}>Content</p>
            <p style={{ fontSize:'.84rem', color:'var(--neu-text-secondary)', lineHeight:1.6, whiteSpace:'pre-wrap' }}>{ann.content}</p>
          </div>
          <div style={{ display:'flex', gap:'.6rem', flexWrap:'wrap' }}>
            <span style={{ fontSize:'.72rem', fontWeight:700, padding:'.2rem .65rem', borderRadius:'.5rem', background:pri.bg, color:pri.color }}>{pri.label}</span>
            <span style={{ fontSize:'.72rem', fontWeight:700, padding:'.2rem .65rem', borderRadius:'.5rem', background:'rgba(91,138,240,.1)', color:'#5b8af0' }}>
              {target?.label || ann.target_type}
            </span>
            {ann.pinned_until && (
              <span style={{ fontSize:'.72rem', fontWeight:700, padding:'.2rem .65rem', borderRadius:'.5rem', background:'rgba(34,160,107,.1)', color:'#22a06b' }}>📌 Pinned until {ann.pinned_until}</span>
            )}
          </div>
          {ann.attachment_url && (
            <a href={ann.attachment_url} target="_blank" rel="noreferrer" style={{ fontSize:'.78rem', color:'#5b8af0', fontWeight:600, display:'inline-flex', alignItems:'center', gap:'.3rem' }}>
              <FileText size={13}/> View Attachment
            </a>
          )}
          <p style={{ fontSize:'.72rem', color:'var(--neu-text-ghost)', borderTop:'1px solid var(--neu-border)', paddingTop:'.75rem' }}>
            Posted: {new Date(ann.created_at).toLocaleDateString()}
          </p>
        </div>
        <div style={{ padding:'.9rem 1.5rem', borderTop:'1px solid var(--neu-border)' }}>
          <button onClick={onClose} style={{ width:'100%', padding:'.6rem', borderRadius:'.75rem', border:'none', cursor:'pointer', background:'var(--neu-surface-deep)', boxShadow:'inset 2px 2px 6px var(--neu-shadow-dark), inset -1px -1px 4px var(--neu-shadow-light)', color:'var(--neu-text-secondary)', fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:'.85rem' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

function AnnCard({ ann, onClick }) {
  const pri = PRI[ann.priority] || PRI.normal
  const isPinned = ann.pinned_until && new Date(ann.pinned_until) >= new Date()

  return (
    <div className={`ann-card ann-${ann.priority || 'normal'}`} onClick={() => onClick(ann)}>
      <div style={{ display:'flex', alignItems:'flex-start', gap:'1rem' }}>
        <div style={{ width:44, height:44, borderRadius:'1rem', background:pri.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <Bell size={20} style={{ color:pri.color }} />
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:'.6rem', flexWrap:'wrap', marginBottom:'.5rem' }}>
            <h3 style={{ fontSize:'.95rem', fontWeight:700, color:'var(--neu-text-primary)', margin:0 }}>{ann.title}</h3>
            {isPinned && <span style={{ fontSize:'.65rem', fontWeight:700, padding:'.2rem .6rem', borderRadius:'2rem', background:'rgba(245,158,11,.1)', color:'#f59e0b' }}>📌 Pinned</span>}
          </div>
          <p style={{ fontSize:'.8rem', color:'var(--neu-text-secondary)', lineHeight:1.5, marginBottom:'.6rem', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
            {ann.content}
          </p>
          <div style={{ display:'flex', alignItems:'center', gap:'.8rem', flexWrap:'wrap' }}>
            <span style={{ fontSize:'.68rem', color:'var(--neu-text-ghost)' }}>📅 {new Date(ann.created_at).toLocaleDateString()}</span>
          </div>
        </div>
        <div style={{ opacity:.4, flexShrink:0, alignSelf:'center' }}>
          <ChevronRight size={18} style={{ color:'var(--neu-text-secondary)' }} />
        </div>
      </div>
    </div>
  )
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([])
  const [pagination, setPagination] = useState({ page: 1, total_pages: 1, total: 0 })
  const [loading, setLoading] = useState(true)
  const [viewAnn, setViewAnn] = useState(null)

  const fetchAnn = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const res = await studentAPI.getAnnouncements(page)
      setAnnouncements(res.data.data?.announcements || [])
      setPagination(res.data.data?.pagination || { page: 1, total_pages: 1, total: 0 })
    } catch { toast.error('Failed to load announcements') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    fetchAnn(1)
  }, [])

  return (
    <>
      <style>{CSS}</style>
      <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.4rem', paddingBottom: '2rem' }}>
        
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.7rem', marginBottom: '.2rem' }}>
            <div style={{ width: 38, height: 38, borderRadius: '.875rem', background: 'var(--neu-surface-deep)', boxShadow: 'inset 3px 3px 7px var(--neu-shadow-dark), inset -2px -2px 5px var(--neu-shadow-light)', border: '1px solid var(--neu-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f97316' }}>
              <Bell size={17} />
            </div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', letterSpacing: '-.02em' }}>
              Announcements
            </h1>
          </div>
          <p style={{ fontSize: '.78rem', color: 'var(--neu-text-ghost)', marginLeft: '.2rem' }}>
            {loading ? '…' : `${pagination.total} announcements`}
          </p>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <Loader2 size={28} style={{ color: '#5b8af0', animation: 'spin 1s linear infinite' }} />
          </div>
        ) : announcements.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--neu-surface)', borderRadius: '1rem', border: '1px solid var(--neu-border)', boxShadow: '5px 5px 14px var(--neu-shadow-dark), -3px -3px 10px var(--neu-shadow-light)' }}>
            <Bell size={48} style={{ opacity: .2, marginBottom: '1rem', display: 'block', margin: '0 auto 1rem' }} />
            <p style={{ fontSize: '.9rem', color: 'var(--neu-text-ghost)', fontWeight: 500 }}>No announcements yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
            {announcements.map(ann => (
              <AnnCard key={ann.id} ann={ann} onClick={setViewAnn} />
            ))}
          </div>
        )}

        {pagination.total_pages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.75rem', marginTop: '.5rem' }}>
            <button onClick={() => fetchAnn(pagination.page - 1)} disabled={pagination.page === 1}
              style={{ width: 36, height: 36, borderRadius: '.75rem', border: '1px solid var(--neu-border)', cursor: pagination.page === 1 ? 'not-allowed' : 'pointer', background: 'var(--neu-surface)', opacity: pagination.page === 1 ? .5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--neu-text-secondary)', transition: 'all 0.2s' }}>
              <ChevronLeft size={18} />
            </button>
            <span style={{ fontSize: '.85rem', color: 'var(--neu-text-secondary)', fontWeight: 500 }}>
              Page {pagination.page} of {pagination.total_pages}
            </span>
            <button onClick={() => fetchAnn(pagination.page + 1)} disabled={pagination.page === pagination.total_pages}
              style={{ width: 36, height: 36, borderRadius: '.75rem', border: '1px solid var(--neu-border)', cursor: pagination.page === pagination.total_pages ? 'not-allowed' : 'pointer', background: 'var(--neu-surface)', opacity: pagination.page === pagination.total_pages ? .5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--neu-text-secondary)', transition: 'all 0.2s' }}>
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>

      {viewAnn && <AnnViewModal ann={viewAnn} onClose={() => setViewAnn(null)} />}
    </>
  )
}