// ═══════════════════════════════════════════════════════════════
//  TeacherAnnouncementsPage.jsx
//  frontend/src/pages/teacher/TeacherAnnouncementsPage.jsx
//  Same UI as admin AnnouncementsPage — teacher role only
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect, useCallback } from 'react'
import { Plus, Bell, Loader2, X, ChevronLeft, ChevronRight, Eye, Edit2, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import AddButton from '../../components/ui/AddButton'
import { teacherAPI } from '../../api/teacher.api'
import { useContextMenu, ContextMenu } from '../../hooks/useContextMenu'

/* ─── CSS ─────────────────────────────────────────── */
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
    transition: transform .22s ease, box-shadow .22s ease;
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
    width: 3px; border-radius: 99px;
  }
  .ann-urgent::before { background: #ef4444; }
  .ann-high::before   { background: #f97316; }
  .ann-normal::before { background: #5b8af0; }
  .ann-low::before    { background: #94a3b8; }
`

/* ─── Priority config ────────────────────────────── */
const PRI = {
  urgent: { label: '🔴 Urgent', bg: 'rgba(239,68,68,.12)',   color: '#ef4444' },
  high:   { label: '🟠 High',   bg: 'rgba(249,115,22,.12)', color: '#f97316' },
  normal: { label: '🔵 Normal', bg: 'rgba(91,138,240,.12)', color: '#5b8af0' },
  low:    { label: '⚪ Low',    bg: 'rgba(148,163,184,.1)', color: '#94a3b8' },
}

/* ─── Target options ─────────────────────────────── */
const TARGET_OPTIONS = [
  { value: 'all',        label: '🌐 All Users'  },
  { value: 'department', label: '🏢 Department' },
  { value: 'program',    label: '🎓 Program'    },
  { value: 'course',     label: '📚 Course'     },
  { value: 'section',    label: '👥 Section'    },
]

const iS = {
  width: '100%', padding: '.5rem .75rem', borderRadius: '.75rem', border: 'none',
  background: 'var(--neu-surface-deep)',
  boxShadow: 'inset 2px 2px 6px var(--neu-shadow-dark), inset -1px -1px 4px var(--neu-shadow-light)',
  color: 'var(--neu-text-primary)', fontSize: '.84rem', outline: 'none',
  fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box',
}

function Modal({ children, maxW = 520 }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(8,12,20,.7)', backdropFilter: 'blur(10px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: maxW, background: 'var(--neu-surface)', boxShadow: '14px 14px 36px var(--neu-shadow-dark), -6px -6px 20px var(--neu-shadow-light)', border: '1px solid var(--neu-border)', borderRadius: '1.5rem', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'neu-slide-up .2s cubic-bezier(.34,1.56,.64,1) both' }}>
        {children}
      </div>
    </div>
  )
}

function F({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '.3rem' }}>
      <label style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--neu-text-secondary)', textTransform: 'uppercase', letterSpacing: '.04em' }}>{label}</label>
      {children}
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   CREATE / EDIT MODAL
═══════════════════════════════════════════════════ */
function AnnouncementModal({ ann, onClose, onSuccess }) {
  const isEdit = !!ann?.id
  const [form, setForm] = useState({
    title:        ann?.title        || '',
    content:      ann?.content      || '',
    target_type:  ann?.target_type  || 'all',
    target_id:    ann?.target_id    || '',
    priority:     ann?.priority     || 'normal',
    pinned_until: ann?.pinned_until ? String(ann.pinned_until).split('T')[0] : '',
  })
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const submit = async () => {
    if (!form.title.trim() || !form.content.trim()) { toast.error('Title and content required'); return }
    setLoading(true)
    try {
      const payload = {
        title:        form.title.trim(),
        content:      form.content.trim(),
        target_type:  form.target_type,
        target_id:    form.target_type !== 'all' ? Number(form.target_id) || null : null,
        priority:     form.priority,
        pinned_until: form.pinned_until || null,
      }
      if (isEdit) {
        await teacherAPI.updateAnnouncement(ann.id, payload)
        toast.success('Announcement updated')
      } else {
        await teacherAPI.createAnnouncement(payload)
        toast.success('Announcement posted!')
      }
      onSuccess(); onClose()
    } catch (e) { toast.error(e.response?.data?.message || 'Failed') }
    finally { setLoading(false) }
  }

  return (
    <Modal maxW={520}>
      <div style={{ padding: '1.4rem 1.5rem', borderBottom: '1px solid var(--neu-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem' }}>
          <div style={{ width: 34, height: 34, borderRadius: '.65rem', background: 'rgba(91,138,240,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bell size={15} style={{ color: '#5b8af0' }} />
          </div>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif' }}>
            {isEdit ? 'Edit Announcement' : 'New Announcement'}
          </h2>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neu-text-ghost)' }}><X size={18} /></button>
      </div>

      <div style={{ padding: '1.2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '.85rem', overflowY: 'auto', flex: 1 }}>
        <F label="Title *">
          <input style={iS} value={form.title} onChange={e => set('title', e.target.value)} placeholder="Announcement title…" autoFocus />
        </F>
        <F label="Content *">
          <textarea style={{ ...iS, resize: 'vertical', minHeight: 110, lineHeight: 1.6 }}
            value={form.content} onChange={e => set('content', e.target.value)} placeholder="Write your announcement here…" />
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
          <F label="Target Audience">
            <select style={iS} value={form.target_type} onChange={e => set('target_type', e.target.value)}>
              {TARGET_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
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
          {loading && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
          {isEdit ? 'Save Changes' : 'Post Announcement'}
        </button>
      </div>
    </Modal>
  )
}

/* ═══════════════════════════════════════════════════
   VIEW MODAL
═══════════════════════════════════════════════════ */
function ViewModal({ ann, onClose }) {
  const pri    = PRI[ann.priority] || PRI.normal
  const target = TARGET_OPTIONS.find(t => t.value === ann.target_type)
  return (
    <Modal maxW={500}>
      <div style={{ padding: '1.4rem 1.5rem', borderBottom: '1px solid var(--neu-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem' }}>
          <div style={{ width: 34, height: 34, borderRadius: '.65rem', background: pri.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Bell size={15} style={{ color: pri.color }} /></div>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif' }}>Announcement Details</h2>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neu-text-ghost)' }}><X size={18} /></button>
      </div>
      <div style={{ padding: '1.2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '.85rem', overflowY: 'auto' }}>
        <div>
          <p style={{ fontSize: '.7rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', marginBottom: '.25rem' }}>Title</p>
          <p style={{ fontSize: '.95rem', fontWeight: 700, color: 'var(--neu-text-primary)' }}>{ann.title}</p>
        </div>
        <div>
          <p style={{ fontSize: '.7rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', marginBottom: '.25rem' }}>Content</p>
          <p style={{ fontSize: '.84rem', color: 'var(--neu-text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{ann.content}</p>
        </div>
        <div style={{ display: 'flex', gap: '.6rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '.72rem', fontWeight: 700, padding: '.2rem .65rem', borderRadius: '.5rem', background: pri.bg, color: pri.color }}>{pri.label}</span>
          <span style={{ fontSize: '.72rem', fontWeight: 700, padding: '.2rem .65rem', borderRadius: '.5rem', background: 'rgba(91,138,240,.1)', color: '#5b8af0' }}>
            {target?.label || ann.target_type}{ann.target_id ? ` (ID: ${ann.target_id})` : ''}
          </span>
          {ann.pinned_until && <span style={{ fontSize: '.72rem', fontWeight: 700, padding: '.2rem .65rem', borderRadius: '.5rem', background: 'rgba(34,160,107,.1)', color: '#22a06b' }}>📌 Pinned until {ann.pinned_until}</span>}
        </div>
        {ann.created_by_name && <p style={{ fontSize: '.75rem', color: 'var(--neu-text-ghost)' }}>Posted by: {ann.created_by_name} · {new Date(ann.created_at).toLocaleDateString()}</p>}
      </div>
      <div style={{ padding: '.9rem 1.5rem', borderTop: '1px solid var(--neu-border)' }}>
        <button onClick={onClose} style={{ ...iS, cursor: 'pointer', textAlign: 'center', fontWeight: 600, color: 'var(--neu-text-secondary)', padding: '.6rem' }}>Close</button>
      </div>
    </Modal>
  )
}

/* ═══════════════════════════════════════════════════
   DELETE MODAL
═══════════════════════════════════════════════════ */
function DeleteModal({ ann, onClose, onConfirm, deleting }) {
  return (
    <Modal maxW={400}>
      <div style={{ padding: '1.75rem', textAlign: 'center' }}>
        <div style={{ width: 52, height: 52, borderRadius: '1rem', background: 'rgba(239,68,68,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto .9rem' }}>
          <Trash2 size={22} style={{ color: '#ef4444' }} />
        </div>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', marginBottom: '.4rem' }}>Delete Announcement?</h3>
        <p style={{ fontSize: '.82rem', color: 'var(--neu-text-secondary)', marginBottom: '.3rem' }}>"<strong>{ann.title}</strong>" permanently delete ho jaegi.</p>
        <p style={{ fontSize: '.75rem', color: '#ef4444', marginBottom: '1.4rem' }}>Yeh action undo nahi ho sakti.</p>
        <div style={{ display: 'flex', gap: '.6rem' }}>
          <button onClick={onClose} style={{ ...iS, cursor: 'pointer', textAlign: 'center', fontWeight: 600, color: 'var(--neu-text-secondary)', flex: 1, padding: '.6rem' }}>Cancel</button>
          <button onClick={onConfirm} disabled={deleting} style={{ flex: 1, padding: '.6rem', borderRadius: '.75rem', border: 'none', background: 'linear-gradient(145deg,#ef4444,#dc2626)', color: '#fff', fontWeight: 700, fontSize: '.85rem', cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? .7 : 1, fontFamily: "'DM Sans',sans-serif" }}>
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

/* ═══════════════════════════════════════════════════
   ANN CARD
═══════════════════════════════════════════════════ */
function AnnCard({ ann, onClick }) {
  const pri    = PRI[ann.priority] || PRI.normal
  const target = TARGET_OPTIONS.find(t => t.value === ann.target_type)
  return (
    <div className={`ann-card ann-${ann.priority || 'normal'}`} onClick={e => onClick(e, ann)}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '.85rem' }}>
        <div style={{ width: 36, height: 36, borderRadius: '.75rem', background: pri.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Bell size={16} style={{ color: pri.color }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexWrap: 'wrap', marginBottom: '.2rem' }}>
            <p style={{ fontSize: '.88rem', fontWeight: 700, color: 'var(--neu-text-primary)' }}>{ann.title}</p>
            <span style={{ fontSize: '.65rem', fontWeight: 700, padding: '.15rem .5rem', borderRadius: '.4rem', background: pri.bg, color: pri.color }}>{pri.label}</span>
            <span style={{ fontSize: '.65rem', fontWeight: 700, padding: '.15rem .5rem', borderRadius: '.4rem', background: 'rgba(91,138,240,.1)', color: '#5b8af0' }}>
              {target?.label || ann.target_type}{ann.target_id ? ` #${ann.target_id}` : ''}
            </span>
            {ann.pinned_until && <span style={{ fontSize: '.65rem', padding: '.15rem .45rem', borderRadius: '.4rem', background: 'rgba(34,160,107,.1)', color: '#22a06b' }}>📌</span>}
          </div>
          <p style={{ fontSize: '.78rem', color: 'var(--neu-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 520 }}>{ann.content}</p>
          <p style={{ fontSize: '.68rem', color: 'var(--neu-text-ghost)', marginTop: '.2rem' }}>
            {new Date(ann.created_at).toLocaleDateString()}{ann.created_by_name ? ` · ${ann.created_by_name}` : ''}
          </p>
        </div>
        <span style={{ fontSize: '.6rem', color: 'var(--neu-text-ghost)', flexShrink: 0, opacity: .5 }}>⊞ right-click</span>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════ */
export default function TeacherAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([])
  const [pagination,    setPagination]    = useState({ total: 0, page: 1, per_page: 10, total_pages: 1 })
  const [loading,       setLoading]       = useState(true)
  const [editTarget,    setEditTarget]    = useState(null)
  const [viewTarget,    setViewTarget]    = useState(null)
  const [deleteTarget,  setDeleteTarget]  = useState(null)
  const [deleting,      setDeleting]      = useState(false)

  const { menu, open: openMenu, close: closeMenu } = useContextMenu()

  const fetchAnn = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const res = await teacherAPI.getAnnouncements(page)
      setAnnouncements(res.data.data?.announcements || [])
      setPagination(res.data.data?.pagination || { total: 0, page: 1, per_page: 10, total_pages: 1 })
    } catch { toast.error('Failed to load announcements') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchAnn() }, [fetchAnn])

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await teacherAPI.deleteAnnouncement(deleteTarget.id)
      toast.success('Deleted')
      setDeleteTarget(null)
      fetchAnn(pagination.page)
    } catch { toast.error('Failed to delete') }
    finally { setDeleting(false) }
  }

  const ctxItems = [
    { label: 'View Details', icon: Eye,    onClick: (a) => setViewTarget(a)   },
    { label: 'Edit',         icon: Edit2,  onClick: (a) => setEditTarget(a)   },
    { divider: true },
    { label: 'Delete',       icon: Trash2, onClick: (a) => setDeleteTarget(a), danger: true },
  ]

  return (
    <>
      <style>{CSS}</style>
      <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.3rem', paddingBottom: '2rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif' }}>Announcements</h1>
            <p style={{ fontSize: '.8rem', color: 'var(--neu-text-ghost)', marginTop: '.15rem' }}>
              {pagination.total} total · right-click any card to manage
            </p>
          </div>
          <AddButton onClick={() => setEditTarget({})} tooltip="Add Announcement" color="#5b8af0" />
        </div>

        {/* List */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <Loader2 size={24} style={{ color: '#5b8af0', animation: 'spin 1s linear infinite' }} />
          </div>
        ) : announcements.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--neu-text-ghost)' }}>
            <Bell size={36} style={{ opacity: .25, marginBottom: '.75rem' }} />
            <p style={{ fontSize: '.9rem' }}>No announcements yet. Click "+" to post one.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
            {announcements.map(ann => (
              <AnnCard key={ann.id} ann={ann} onClick={openMenu} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.75rem' }}>
            <button onClick={() => fetchAnn(pagination.page - 1)} disabled={pagination.page === 1}
              style={{ width: 34, height: 34, borderRadius: '.65rem', border: 'none', cursor: pagination.page === 1 ? 'not-allowed' : 'pointer', background: 'var(--neu-surface)', opacity: pagination.page === 1 ? .35 : 1, boxShadow: '4px 4px 10px var(--neu-shadow-dark), -2px -2px 6px var(--neu-shadow-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--neu-text-secondary)' }}>
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontSize: '.82rem', color: 'var(--neu-text-secondary)', fontWeight: 600 }}>
              Page {pagination.page} of {pagination.total_pages}
            </span>
            <button onClick={() => fetchAnn(pagination.page + 1)} disabled={pagination.page === pagination.total_pages}
              style={{ width: 34, height: 34, borderRadius: '.65rem', border: 'none', cursor: pagination.page === pagination.total_pages ? 'not-allowed' : 'pointer', background: 'var(--neu-surface)', opacity: pagination.page === pagination.total_pages ? .35 : 1, boxShadow: '4px 4px 10px var(--neu-shadow-dark), -2px -2px 6px var(--neu-shadow-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--neu-text-secondary)' }}>
              <ChevronRight size={16} />
            </button>
          </div>
        )}

      </div>

      {/* Modals */}
      {editTarget !== null && (
        <AnnouncementModal
          ann={editTarget?.id ? editTarget : null}
          onClose={() => setEditTarget(null)}
          onSuccess={() => fetchAnn(pagination.page)}
        />
      )}
      {viewTarget   !== null && <ViewModal   ann={viewTarget}   onClose={() => setViewTarget(null)}  />}
      {deleteTarget !== null && <DeleteModal ann={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} deleting={deleting} />}

      <ContextMenu menu={menu} items={ctxItems} close={closeMenu} />
    </>
  )
}