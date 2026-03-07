// ═══════════════════════════════════════════════════════════════
//  AnnouncementsPage.jsx  —  frontend/src/pages/admin/AnnouncementsPage.jsx
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect, useCallback } from 'react'
import { Plus, Bell, Loader2, X, ChevronLeft, ChevronRight, Eye, Edit2, Trash2, Pin } from 'lucide-react'
import toast from 'react-hot-toast'
import { adminAPI } from '../../api/admin.api'
import { timeAgo } from '../../utils/helpers'
import { useContextMenu, ContextMenu } from '../../hooks/useContextMenu'

/* ─── CSS ─────────────────────────────────────────── */
const CSS = `
  .ann-card {
    position: relative;
    padding: 1rem 1.2rem;
    border-radius: 1rem;
    border: 1px solid var(--neu-border);
    background: var(--neu-surface);
    cursor: context-menu;
    user-select: none;
    transition: transform .22s ease, box-shadow .22s ease, border-color .18s ease;
    box-shadow: 5px 5px 14px var(--neu-shadow-dark), -3px -3px 10px var(--neu-shadow-light);
  }
  .ann-card:hover {
    transform: translateY(-3px);
    box-shadow: 8px 14px 28px var(--neu-shadow-dark), -4px -4px 14px var(--neu-shadow-light);
  }
  .ann-card::before {
    content: '';
    position: absolute;
    left: 0; top: 12px; bottom: 12px;
    width: 3px;
    border-radius: 99px;
  }
  .ann-urgent::before  { background: #ef4444; }
  .ann-high::before    { background: #f97316; }
  .ann-normal::before  { background: #5b8af0; }
  .ann-low::before     { background: var(--neu-border); }
  .ann-hint { position: absolute; bottom: .6rem; right: .9rem; font-size: .58rem; color: var(--neu-text-ghost); opacity: .35; }
`

/* ─── Shared ─────────────────────────────────────── */
const iS = {
  width: '100%', background: 'var(--neu-surface-deep)',
  boxShadow: 'inset 3px 3px 7px var(--neu-shadow-dark), inset -2px -2px 5px var(--neu-shadow-light)',
  border: '1px solid var(--neu-border)', borderRadius: '.75rem',
  padding: '.6rem .9rem', fontSize: '.85rem', color: 'var(--neu-text-primary)',
  outline: 'none', fontFamily: "'DM Sans',sans-serif",
}
const F = ({ label, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '.35rem' }}>
    <label style={{ fontSize: '.68rem', fontWeight: 700, color: 'var(--neu-text-ghost)', letterSpacing: '.06em', textTransform: 'uppercase' }}>{label}</label>
    {children}
  </div>
)

const PRIORITY_CFG = {
  urgent: { label: 'Urgent', c: '#ef4444', bg: 'rgba(239,68,68,.1)'  },
  high:   { label: 'High',   c: '#f97316', bg: 'rgba(249,115,22,.1)' },
  normal: { label: 'Normal', c: '#5b8af0', bg: 'rgba(91,138,240,.1)' },
  low:    { label: 'Low',    c: 'var(--neu-text-ghost)', bg: 'var(--neu-surface-deep)' },
}
const TARGET_CFG = {
  all:      { label: 'All Users',       c: '#5b8af0'  },
  students: { label: 'Students Only',   c: '#22a06b'  },
  teachers: { label: 'Teachers Only',   c: '#8b5cf6'  },
}

/* ─── Modal Shell ────────────────────────────────── */
function Modal({ children, maxW = 520 }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(8,12,20,.72)', backdropFilter: 'blur(10px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: maxW, background: 'var(--neu-surface)', boxShadow: '14px 14px 36px var(--neu-shadow-dark), -6px -6px 20px var(--neu-shadow-light)', border: '1px solid var(--neu-border)', borderRadius: '1.5rem', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'neu-slide-up .2s cubic-bezier(.34,1.56,.64,1) both' }}>
        {children}
      </div>
    </div>
  )
}

/* ─── View Modal ─────────────────────────────────── */
function ViewModal({ ann, onClose }) {
  const pc = PRIORITY_CFG[ann.priority] || PRIORITY_CFG.normal
  const tc = TARGET_CFG[ann.target_type] || TARGET_CFG.all

  return (
    <Modal maxW={500}>
      <div style={{ padding: '1.4rem 1.5rem', borderBottom: '1px solid var(--neu-border)', display: 'flex', gap: '.85rem', alignItems: 'flex-start' }}>
        <div style={{ width: 42, height: 42, borderRadius: '.85rem', background: pc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Bell size={18} style={{ color: pc.c }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', lineHeight: 1.3 }}>{ann.title}</h2>
          <div style={{ display: 'flex', gap: '.35rem', marginTop: '.4rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '.63rem', fontWeight: 800, padding: '.15rem .5rem', background: pc.bg, color: pc.c, borderRadius: '.4rem' }}>{pc.label}</span>
            <span style={{ fontSize: '.63rem', fontWeight: 700, padding: '.15rem .5rem', background: 'var(--neu-surface-deep)', color: tc.c, border: '1px solid var(--neu-border)', borderRadius: '.4rem' }}>{tc.label}</span>
            {ann.pinned_until && <span style={{ fontSize: '.63rem', fontWeight: 700, padding: '.15rem .5rem', background: 'rgba(245,158,11,.1)', color: '#f59e0b', borderRadius: '.4rem' }}>📌 Pinned</span>}
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neu-text-ghost)', padding: '.2rem', flexShrink: 0 }}><X size={18} /></button>
      </div>

      <div style={{ padding: '1.1rem 1.4rem', overflowY: 'auto', flex: 1 }}>
        <div style={{ background: 'var(--neu-surface-deep)', borderRadius: '1rem', padding: '1rem 1.1rem', boxShadow: 'inset 3px 3px 7px var(--neu-shadow-dark), inset -2px -2px 5px var(--neu-shadow-light)', fontSize: '.85rem', color: 'var(--neu-text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
          {ann.content}
        </div>
        <div style={{ marginTop: '.85rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem' }}>
          {[
            { label: 'Published',  value: ann.created_at ? new Date(ann.created_at).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }) : '—' },
            { label: 'By',         value: ann.created_by_name || 'Admin' },
            ...(ann.pinned_until ? [{ label: 'Pinned Until', value: new Date(ann.pinned_until).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }) }] : []),
          ].map(r => (
            <div key={r.label} style={{ background: 'var(--neu-surface-deep)', borderRadius: '.75rem', padding: '.6rem .9rem', boxShadow: 'inset 2px 2px 5px var(--neu-shadow-dark), inset -1px -1px 4px var(--neu-shadow-light)' }}>
              <p style={{ fontSize: '.6rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.15rem' }}>{r.label}</p>
              <p style={{ fontSize: '.82rem', color: 'var(--neu-text-primary)', fontWeight: 500 }}>{r.value}</p>
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding: '.9rem 1.4rem', borderTop: '1px solid var(--neu-border)' }}>
        <button onClick={onClose} style={{ ...iS, cursor: 'pointer', textAlign: 'center', fontWeight: 600, color: 'var(--neu-text-secondary)', padding: '.6rem' }}>Close</button>
      </div>
    </Modal>
  )
}

/* ─── Ann Modal (Create / Edit) ──────────────────── */
function AnnModal({ ann, onClose, onSuccess }) {
  const isEdit = !!ann?.id
  const [form, setForm] = useState({
    title:       ann?.title       || '',
    content:     ann?.content     || '',
    target_type: ann?.target_type || 'all',
    priority:    ann?.priority    || 'normal',
    pinned_until: ann?.pinned_until || '',
  })
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const submit = async () => {
    if (!form.title.trim() || !form.content.trim()) { toast.error('Title and content required'); return }
    setLoading(true)
    try {
      if (isEdit) { await adminAPI.updateAnnouncement(ann.id, form); toast.success('Announcement updated') }
      else        { await adminAPI.createAnnouncement(form);         toast.success('Announcement posted')  }
      onSuccess(); onClose()
    } catch (e) { toast.error(e.response?.data?.message || 'Failed') }
    finally { setLoading(false) }
  }

  return (
    <Modal maxW={520}>
      <div style={{ padding: '1.4rem 1.5rem', borderBottom: '1px solid var(--neu-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem' }}>
          <div style={{ width: 34, height: 34, borderRadius: '.65rem', background: 'rgba(91,138,240,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Bell size={15} style={{ color: '#5b8af0' }} /></div>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif' }}>{isEdit ? 'Edit Announcement' : 'New Announcement'}</h2>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neu-text-ghost)' }}><X size={18} /></button>
      </div>

      <div style={{ padding: '1.2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '.85rem', overflowY: 'auto', flex: 1 }}>
        <F label="Title *">
          <input style={iS} value={form.title} onChange={e => set('title', e.target.value)} placeholder="Announcement title…" autoFocus />
        </F>
        <F label="Content *">
          <textarea style={{ ...iS, resize: 'vertical', minHeight: 120, lineHeight: 1.6 }} value={form.content} onChange={e => set('content', e.target.value)} placeholder="Write your announcement here…" />
        </F>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.8rem' }}>
          <F label="Priority">
            <select style={iS} value={form.priority} onChange={e => set('priority', e.target.value)}>
              <option value="urgent">🔴 Urgent</option>
              <option value="high">🟠 High</option>
              <option value="normal">🔵 Normal</option>
              <option value="low">⚪ Low</option>
            </select>
          </F>
          <F label="Target">
            <select style={iS} value={form.target_type} onChange={e => set('target_type', e.target.value)}>
              <option value="all">All Users</option>
              <option value="students">Students Only</option>
              <option value="teachers">Teachers Only</option>
            </select>
          </F>
        </div>
        <F label="Pin Until (optional)">
          <input style={iS} type="date" value={form.pinned_until} onChange={e => set('pinned_until', e.target.value)} />
        </F>
      </div>

      <div style={{ padding: '.9rem 1.5rem', borderTop: '1px solid var(--neu-border)', display: 'flex', gap: '.6rem' }}>
        <button onClick={onClose} style={{ ...iS, cursor: 'pointer', textAlign: 'center', fontWeight: 600, color: 'var(--neu-text-secondary)', flex: 1, padding: '.6rem' }}>Cancel</button>
        <button onClick={submit} disabled={loading} style={{ flex: 1, padding: '.6rem', borderRadius: '.75rem', border: 'none', background: 'linear-gradient(145deg,#5b8af0,#3a6bd4)', boxShadow: '0 4px 14px rgba(91,138,240,.35)', color: '#fff', fontWeight: 700, fontSize: '.85rem', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? .7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.4rem', fontFamily: "'DM Sans',sans-serif" }}>
          {loading && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}{isEdit ? 'Save Changes' : 'Post Announcement'}
        </button>
      </div>
    </Modal>
  )
}

/* ─── Delete Confirm ─────────────────────────────── */
function DeleteModal({ ann, onClose, onConfirm, loading }) {
  return (
    <Modal maxW={380}>
      <div style={{ padding: '2rem 1.75rem', textAlign: 'center' }}>
        <div style={{ width: 52, height: 52, borderRadius: '1rem', background: 'rgba(239,68,68,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
          <Trash2 size={22} style={{ color: '#ef4444' }} />
        </div>
        <h3 style={{ fontSize: '.95rem', fontWeight: 700, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', marginBottom: '.4rem' }}>Delete Announcement?</h3>
        <p style={{ fontSize: '.8rem', color: 'var(--neu-text-muted)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
          "<strong style={{ color: 'var(--neu-text-primary)' }}>{ann?.title}</strong>" permanently delete ho jayega.
        </p>
        <div style={{ display: 'flex', gap: '.6rem' }}>
          <button onClick={onClose} style={{ ...iS, cursor: 'pointer', textAlign: 'center', fontWeight: 600, color: 'var(--neu-text-secondary)', flex: 1, padding: '.6rem' }}>Cancel</button>
          <button onClick={onConfirm} disabled={loading} style={{ flex: 1, padding: '.6rem', borderRadius: '.75rem', border: 'none', background: 'linear-gradient(145deg,#f26b6b,#d94f4f)', boxShadow: '0 4px 14px rgba(242,107,107,.28)', color: '#fff', fontWeight: 700, fontSize: '.85rem', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? .7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.4rem', fontFamily: "'DM Sans',sans-serif" }}>
            {loading && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}Delete
          </button>
        </div>
      </div>
    </Modal>
  )
}

/* ─── Ann Card ───────────────────────────────────── */
function AnnCard({ ann, onContextMenu }) {
  const pc = PRIORITY_CFG[ann.priority] || PRIORITY_CFG.normal
  const tc = TARGET_CFG[ann.target_type] || TARGET_CFG.all
  const isPinned = ann.pinned_until && new Date(ann.pinned_until) > new Date()

  return (
    <div className={`ann-card ann-${ann.priority || 'normal'}`} onContextMenu={onContextMenu}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '.85rem' }}>
        {/* Icon */}
        <div style={{ width: 40, height: 40, borderRadius: '.8rem', background: pc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginLeft: '.3rem' }}>
          <Bell size={16} style={{ color: pc.c }} />
        </div>

        {/* Body */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexWrap: 'wrap', marginBottom: '.3rem' }}>
            <h3 style={{ fontSize: '.9rem', fontWeight: 700, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif' }}>{ann.title}</h3>
            {isPinned && <Pin size={12} style={{ color: '#f59e0b', flexShrink: 0 }} />}
            <span style={{ fontSize: '.62rem', fontWeight: 800, padding: '.15rem .5rem', background: pc.bg, color: pc.c, borderRadius: '.4rem' }}>{pc.label}</span>
            <span style={{ fontSize: '.62rem', fontWeight: 700, padding: '.15rem .5rem', background: 'var(--neu-surface-deep)', color: tc.c, border: '1px solid var(--neu-border)', borderRadius: '.4rem' }}>{tc.label}</span>
          </div>
          <p style={{ fontSize: '.8rem', color: 'var(--neu-text-muted)', lineHeight: 1.55, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{ann.content}</p>
          <p style={{ fontSize: '.68rem', color: 'var(--neu-text-ghost)', marginTop: '.4rem' }}>{timeAgo(ann.created_at)}{ann.created_by_name ? ` · ${ann.created_by_name}` : ''}</p>
        </div>
      </div>
      <span className="ann-hint">⊞ right-click</span>
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════ */
export function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([])
  const [pagination,    setPagination]    = useState({ total: 0, page: 1, per_page: 10, total_pages: 1 })
  const [loading,       setLoading]       = useState(true)
  const [editTarget,    setEditTarget]    = useState(null)   // null=closed | {}=new | {id,..}=edit
  const [viewTarget,    setViewTarget]    = useState(null)
  const [deleteTarget,  setDeleteTarget]  = useState(null)
  const [deleting,      setDeleting]      = useState(false)
  const [showNew,       setShowNew]       = useState(false)

  const { menu, open: openMenu, close: closeMenu } = useContextMenu()

  const fetchAnn = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const res = await adminAPI.getAnnouncements(page, 10)
      setAnnouncements(res.data.data?.announcements || [])
      setPagination(res.data.data?.pagination || { total: 0, page: 1, per_page: 10, total_pages: 1 })
    } catch { toast.error('Failed to load announcements') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchAnn() }, [])

  const handleDelete = async () => {
    setDeleting(true)
    try { await adminAPI.deleteAnnouncement(deleteTarget.id); toast.success('Deleted'); setDeleteTarget(null); fetchAnn(pagination.page) }
    catch { toast.error('Failed to delete') }
    finally { setDeleting(false) }
  }

  const ctxItems = (ann) => [
    { label: 'View Details', icon: Eye,   onClick: a => setViewTarget(a)  },
    { label: 'Edit',         icon: Edit2, onClick: a => setEditTarget(a)  },
    { divider: true },
    { label: 'Delete',       icon: Trash2, onClick: a => setDeleteTarget(a), danger: true },
  ]

  return (
    <>
      <style>{CSS}</style>
      <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.3rem', paddingBottom: '2rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', letterSpacing: '-.02em' }}>Announcements</h1>
            <p style={{ fontSize: '.78rem', color: 'var(--neu-text-ghost)', marginTop: 2 }}>{pagination.total} total announcements</p>
          </div>
          <button onClick={() => setShowNew(true)} style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.65rem 1.25rem', background: 'linear-gradient(145deg,#5b8af0,#3a6bd4)', boxShadow: '0 4px 16px rgba(91,138,240,.38), 6px 6px 14px var(--neu-shadow-dark), -3px -3px 8px var(--neu-shadow-light)', border: '1px solid rgba(255,255,255,.18)', borderRadius: '.9rem', color: '#fff', fontWeight: 700, fontSize: '.82rem', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>
            <Plus size={16} /> New Announcement
          </button>
        </div>

        {/* Cards */}
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} style={{ height: 90, background: 'var(--neu-surface)', borderRadius: '1rem', border: '1px solid var(--neu-border)', boxShadow: '5px 5px 14px var(--neu-shadow-dark)', animation: 'pulse 1.5s infinite' }} />)
        ) : announcements.length === 0 ? (
          <div style={{ background: 'var(--neu-surface)', border: '1px solid var(--neu-border)', borderRadius: '1.25rem', padding: '5rem 2rem', textAlign: 'center', boxShadow: '6px 6px 16px var(--neu-shadow-dark)' }}>
            <Bell size={40} style={{ color: 'var(--neu-text-ghost)', margin: '0 auto 1rem', opacity: .18, display: 'block' }} />
            <p style={{ fontWeight: 600, color: 'var(--neu-text-secondary)' }}>No announcements yet</p>
            <p style={{ fontSize: '.78rem', color: 'var(--neu-text-ghost)', marginTop: '.3rem' }}>Click "New Announcement" to post one</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.7rem' }}>
            {announcements.map(ann => (
              <AnnCard key={ann.id} ann={ann} onContextMenu={e => openMenu(e, ann)} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem' }}>
            <button onClick={() => fetchAnn(pagination.page - 1)} disabled={pagination.page === 1} style={{ width: 32, height: 32, borderRadius: '.6rem', background: 'var(--neu-surface)', border: '1px solid var(--neu-border)', boxShadow: '4px 4px 10px var(--neu-shadow-dark)', cursor: pagination.page === 1 ? 'not-allowed' : 'pointer', opacity: pagination.page === 1 ? .4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--neu-text-secondary)' }}>
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: pagination.total_pages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => fetchAnn(p)} style={{ width: 32, height: 32, borderRadius: '.6rem', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '.8rem', fontFamily: "'DM Sans',sans-serif", background: p === pagination.page ? 'linear-gradient(145deg,#5b8af0,#3a6bd4)' : 'var(--neu-surface)', color: p === pagination.page ? '#fff' : 'var(--neu-text-secondary)', boxShadow: p === pagination.page ? '0 3px 10px rgba(91,138,240,.35)' : '4px 4px 10px var(--neu-shadow-dark)' }}>
                {p}
              </button>
            ))}
            <button onClick={() => fetchAnn(pagination.page + 1)} disabled={pagination.page === pagination.total_pages} style={{ width: 32, height: 32, borderRadius: '.6rem', background: 'var(--neu-surface)', border: '1px solid var(--neu-border)', boxShadow: '4px 4px 10px var(--neu-shadow-dark)', cursor: pagination.page === pagination.total_pages ? 'not-allowed' : 'pointer', opacity: pagination.page === pagination.total_pages ? .4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--neu-text-secondary)' }}>
              <ChevronRight size={14} />
            </button>
          </div>
        )}

        {/* Context menu */}
        <ContextMenu menu={menu} close={closeMenu} items={menu ? ctxItems(menu.row) : []} />

        {/* Modals */}
        {viewTarget   && <ViewModal   ann={viewTarget}   onClose={() => setViewTarget(null)} />}
        {showNew      && <AnnModal    ann={null}         onClose={() => setShowNew(false)}    onSuccess={() => fetchAnn(1)} />}
        {editTarget   && <AnnModal    ann={editTarget}   onClose={() => setEditTarget(null)}  onSuccess={() => fetchAnn(pagination.page)} />}
        {deleteTarget && <DeleteModal ann={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} loading={deleting} />}
      </div>
    </>
  )
}

export default AnnouncementsPage