// ═══════════════════════════════════════════════════════════════
//  NoticesPage.jsx  —  frontend/src/pages/admin/NoticesPage.jsx
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect, useCallback } from 'react'
import { Plus, FileText, Loader2, X, ChevronLeft, ChevronRight, Eye, Edit2, Trash2, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'
import { adminAPI } from '../../api/admin.api'
import { timeAgo } from '../../utils/helpers'
import { useContextMenu, ContextMenu } from '../../hooks/useContextMenu'

/* ─── CSS ─────────────────────────────────────────── */
const CSS = `
  .ntc-card {
    position: relative;
    padding: 1rem 1.2rem;
    border-radius: 1rem;
    border: 1px solid var(--neu-border);
    background: var(--neu-surface);
    cursor: context-menu;
    user-select: none;
    transition: transform .22s ease, box-shadow .22s ease;
    box-shadow: 5px 5px 14px var(--neu-shadow-dark), -3px -3px 10px var(--neu-shadow-light);
  }
  .ntc-card:hover {
    transform: translateY(-3px);
    box-shadow: 8px 14px 28px var(--neu-shadow-dark), -4px -4px 14px var(--neu-shadow-light);
  }
  .ntc-hint { position: absolute; bottom: .6rem; right: .9rem; font-size: .58rem; color: var(--neu-text-ghost); opacity: .35; }
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

const CATEGORIES = ['general', 'academic', 'exam', 'holiday', 'event', 'urgent']
const CAT_CFG = {
  general:  { label: 'General',  c: 'var(--neu-text-secondary)', bg: 'var(--neu-surface-deep)', border: 'var(--neu-border)' },
  academic: { label: 'Academic', c: '#5b8af0', bg: 'rgba(91,138,240,.1)',  border: 'rgba(91,138,240,.25)'  },
  exam:     { label: 'Exam',     c: '#8b5cf6', bg: 'rgba(139,92,246,.1)',  border: 'rgba(139,92,246,.25)'  },
  holiday:  { label: 'Holiday',  c: '#22a06b', bg: 'rgba(34,160,107,.1)',  border: 'rgba(34,160,107,.25)'  },
  event:    { label: 'Event',    c: '#f97316', bg: 'rgba(249,115,22,.1)',   border: 'rgba(249,115,22,.25)'  },
  urgent:   { label: 'Urgent',   c: '#ef4444', bg: 'rgba(239,68,68,.1)',   border: 'rgba(239,68,68,.25)'   },
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
function ViewModal({ notice, onClose }) {
  const cc = CAT_CFG[notice.category] || CAT_CFG.general
  const isExpired = notice.expiry_date && new Date(notice.expiry_date) < new Date()

  return (
    <Modal maxW={500}>
      <div style={{ padding: '1.4rem 1.5rem', borderBottom: '1px solid var(--neu-border)', display: 'flex', gap: '.85rem', alignItems: 'flex-start' }}>
        <div style={{ width: 42, height: 42, borderRadius: '.85rem', background: cc.bg, border: `1px solid ${cc.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <FileText size={18} style={{ color: cc.c }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', lineHeight: 1.3 }}>{notice.title}</h2>
          <div style={{ display: 'flex', gap: '.35rem', marginTop: '.4rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '.62rem', fontWeight: 800, padding: '.15rem .5rem', background: cc.bg, color: cc.c, border: `1px solid ${cc.border}`, borderRadius: '.4rem' }}>{cc.label}</span>
            {notice.target_audience && <span style={{ fontSize: '.62rem', fontWeight: 700, padding: '.15rem .5rem', background: 'var(--neu-surface-deep)', color: 'var(--neu-text-muted)', border: '1px solid var(--neu-border)', borderRadius: '.4rem', textTransform: 'capitalize' }}>{notice.target_audience}</span>}
            {isExpired && <span style={{ fontSize: '.62rem', fontWeight: 700, padding: '.15rem .5rem', background: 'rgba(239,68,68,.1)', color: '#ef4444', borderRadius: '.4rem' }}>Expired</span>}
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neu-text-ghost)', padding: '.2rem', flexShrink: 0 }}><X size={18} /></button>
      </div>

      <div style={{ padding: '1.1rem 1.4rem', overflowY: 'auto', flex: 1 }}>
        <div style={{ background: 'var(--neu-surface-deep)', borderRadius: '1rem', padding: '1rem 1.1rem', boxShadow: 'inset 3px 3px 7px var(--neu-shadow-dark), inset -2px -2px 5px var(--neu-shadow-light)', fontSize: '.85rem', color: 'var(--neu-text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
          {notice.content}
        </div>
        <div style={{ marginTop: '.85rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem' }}>
          {[
            { label: 'Published',   value: notice.created_at ? new Date(notice.created_at).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }) : '—' },
            { label: 'Category',    value: cc.label },
            ...(notice.expiry_date ? [{ label: 'Expires',   value: new Date(notice.expiry_date).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }) }] : []),
            ...(notice.target_audience ? [{ label: 'Audience', value: notice.target_audience }] : []),
          ].map(r => (
            <div key={r.label} style={{ background: 'var(--neu-surface-deep)', borderRadius: '.75rem', padding: '.6rem .9rem', boxShadow: 'inset 2px 2px 5px var(--neu-shadow-dark), inset -1px -1px 4px var(--neu-shadow-light)' }}>
              <p style={{ fontSize: '.6rem', fontWeight: 700, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.15rem' }}>{r.label}</p>
              <p style={{ fontSize: '.82rem', color: 'var(--neu-text-primary)', fontWeight: 500, textTransform: 'capitalize' }}>{r.value}</p>
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

/* ─── Notice Modal (Create / Edit) ──────────────── */
function NoticeModal({ notice, onClose, onSuccess }) {
  const isEdit = !!notice?.id
  const [form, setForm] = useState({
    title:            notice?.title            || '',
    content:          notice?.content          || '',
    category:         notice?.category         || 'general',
    target_audience:  notice?.target_audience  || 'all',
    expiry_date:      notice?.expiry_date       || '',
  })
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const submit = async () => {
    if (!form.title.trim() || !form.content.trim()) { toast.error('Title and content required'); return }
    setLoading(true)
    try {
      if (isEdit) { await adminAPI.updateNotice(notice.id, form); toast.success('Notice updated')    }
      else        { await adminAPI.createNotice(form);            toast.success('Notice published')  }
      onSuccess(); onClose()
    } catch (e) { toast.error(e.response?.data?.message || 'Failed') }
    finally { setLoading(false) }
  }

  return (
    <Modal maxW={520}>
      <div style={{ padding: '1.4rem 1.5rem', borderBottom: '1px solid var(--neu-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem' }}>
          <div style={{ width: 34, height: 34, borderRadius: '.65rem', background: 'rgba(91,138,240,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FileText size={15} style={{ color: '#5b8af0' }} /></div>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif' }}>{isEdit ? 'Edit Notice' : 'Publish Notice'}</h2>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neu-text-ghost)' }}><X size={18} /></button>
      </div>

      <div style={{ padding: '1.2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '.85rem', overflowY: 'auto', flex: 1 }}>
        <F label="Title *">
          <input style={iS} value={form.title} onChange={e => set('title', e.target.value)} placeholder="Notice title…" autoFocus />
        </F>
        <F label="Content *">
          <textarea style={{ ...iS, resize: 'vertical', minHeight: 110, lineHeight: 1.6 }} value={form.content} onChange={e => set('content', e.target.value)} placeholder="Notice details…" />
        </F>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.8rem' }}>
          <F label="Category">
            <select style={iS} value={form.category} onChange={e => set('category', e.target.value)}>
              {CATEGORIES.map(c => <option key={c} value={c}>{CAT_CFG[c]?.label || c}</option>)}
            </select>
          </F>
          <F label="Audience">
            <select style={iS} value={form.target_audience} onChange={e => set('target_audience', e.target.value)}>
              <option value="all">All</option>
              <option value="students">Students</option>
              <option value="teachers">Teachers</option>
            </select>
          </F>
        </div>
        <F label="Expiry Date (optional)">
          <input style={iS} type="date" value={form.expiry_date} onChange={e => set('expiry_date', e.target.value)} />
        </F>
      </div>

      <div style={{ padding: '.9rem 1.5rem', borderTop: '1px solid var(--neu-border)', display: 'flex', gap: '.6rem' }}>
        <button onClick={onClose} style={{ ...iS, cursor: 'pointer', textAlign: 'center', fontWeight: 600, color: 'var(--neu-text-secondary)', flex: 1, padding: '.6rem' }}>Cancel</button>
        <button onClick={submit} disabled={loading} style={{ flex: 1, padding: '.6rem', borderRadius: '.75rem', border: 'none', background: 'linear-gradient(145deg,#5b8af0,#3a6bd4)', boxShadow: '0 4px 14px rgba(91,138,240,.35)', color: '#fff', fontWeight: 700, fontSize: '.85rem', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? .7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.4rem', fontFamily: "'DM Sans',sans-serif" }}>
          {loading && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}{isEdit ? 'Save Changes' : 'Publish'}
        </button>
      </div>
    </Modal>
  )
}

/* ─── Delete Confirm ─────────────────────────────── */
function DeleteModal({ notice, onClose, onConfirm, loading }) {
  return (
    <Modal maxW={380}>
      <div style={{ padding: '2rem 1.75rem', textAlign: 'center' }}>
        <div style={{ width: 52, height: 52, borderRadius: '1rem', background: 'rgba(239,68,68,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
          <Trash2 size={22} style={{ color: '#ef4444' }} />
        </div>
        <h3 style={{ fontSize: '.95rem', fontWeight: 700, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', marginBottom: '.4rem' }}>Delete Notice?</h3>
        <p style={{ fontSize: '.8rem', color: 'var(--neu-text-muted)', marginBottom: '1.5rem' }}>
          "<strong style={{ color: 'var(--neu-text-primary)' }}>{notice?.title}</strong>" permanently delete ho jayega.
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

/* ─── Notice Card ────────────────────────────────── */
function NoticeCard({ notice, onContextMenu }) {
  const cc = CAT_CFG[notice.category] || CAT_CFG.general
  const isExpired = notice.expiry_date && new Date(notice.expiry_date) < new Date()

  return (
    <div className="ntc-card" onContextMenu={onContextMenu} style={{ opacity: isExpired ? .6 : 1 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '.85rem' }}>
        {/* Icon */}
        <div style={{ width: 40, height: 40, borderRadius: '.8rem', background: cc.bg, border: `1px solid ${cc.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <FileText size={16} style={{ color: cc.c }} />
        </div>

        {/* Body */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexWrap: 'wrap', marginBottom: '.3rem' }}>
            <h3 style={{ fontSize: '.9rem', fontWeight: 700, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif' }}>{notice.title}</h3>
            <span style={{ fontSize: '.62rem', fontWeight: 800, padding: '.15rem .5rem', background: cc.bg, color: cc.c, border: `1px solid ${cc.border}`, borderRadius: '.4rem' }}>{cc.label}</span>
            {notice.target_audience && notice.target_audience !== 'all' && (
              <span style={{ fontSize: '.62rem', fontWeight: 700, padding: '.15rem .5rem', background: 'var(--neu-surface-deep)', color: 'var(--neu-text-ghost)', border: '1px solid var(--neu-border)', borderRadius: '.4rem', textTransform: 'capitalize' }}>{notice.target_audience}</span>
            )}
            {isExpired && <span style={{ fontSize: '.62rem', fontWeight: 700, padding: '.15rem .5rem', background: 'rgba(239,68,68,.08)', color: '#ef4444', borderRadius: '.4rem' }}>Expired</span>}
          </div>
          <p style={{ fontSize: '.8rem', color: 'var(--neu-text-muted)', lineHeight: 1.55, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{notice.content}</p>
          <div style={{ display: 'flex', gap: '.75rem', marginTop: '.4rem', alignItems: 'center' }}>
            <span style={{ fontSize: '.68rem', color: 'var(--neu-text-ghost)' }}>{timeAgo(notice.created_at)}</span>
            {notice.expiry_date && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '.2rem', fontSize: '.65rem', color: isExpired ? '#ef4444' : 'var(--neu-text-ghost)' }}>
                <Calendar size={10} />Expires {new Date(notice.expiry_date).toLocaleDateString('en-PK', { day: '2-digit', month: 'short' })}
              </span>
            )}
          </div>
        </div>
      </div>
      <span className="ntc-hint">⊞ right-click</span>
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════ */
export default function NoticesPage() {
  const [notices,      setNotices]      = useState([])
  const [pagination,   setPagination]   = useState({ total: 0, page: 1, per_page: 10, total_pages: 1 })
  const [loading,      setLoading]      = useState(true)
  const [filterCat,    setFilterCat]    = useState('')
  const [viewTarget,   setViewTarget]   = useState(null)
  const [editTarget,   setEditTarget]   = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting,     setDeleting]     = useState(false)
  const [showNew,      setShowNew]      = useState(false)

  const { menu, open: openMenu, close: closeMenu } = useContextMenu()

  const fetchNotices = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const res = await adminAPI.getNotices(page, filterCat)
      setNotices(res.data.data?.notices || [])
      setPagination(res.data.data?.pagination || { total: 0, page: 1, per_page: 10, total_pages: 1 })
    } catch { toast.error('Failed to load notices') }
    finally { setLoading(false) }
  }, [filterCat])

  useEffect(() => { fetchNotices() }, [filterCat])

  const handleDelete = async () => {
    setDeleting(true)
    try { await adminAPI.deleteNotice(deleteTarget.id); toast.success('Deleted'); setDeleteTarget(null); fetchNotices(pagination.page) }
    catch { toast.error('Failed to delete') }
    finally { setDeleting(false) }
  }

  const ctxItems = (n) => [
    { label: 'View Details', icon: Eye,   onClick: x => setViewTarget(x)  },
    { label: 'Edit',         icon: Edit2, onClick: x => setEditTarget(x)  },
    { divider: true },
    { label: 'Delete',       icon: Trash2, onClick: x => setDeleteTarget(x), danger: true },
  ]

  return (
    <>
      <style>{CSS}</style>
      <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.3rem', paddingBottom: '2rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', letterSpacing: '-.02em' }}>Notice Board</h1>
            <p style={{ fontSize: '.78rem', color: 'var(--neu-text-ghost)', marginTop: 2 }}>{pagination.total} published notices</p>
          </div>
          <button onClick={() => setShowNew(true)} style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.65rem 1.25rem', background: 'linear-gradient(145deg,#5b8af0,#3a6bd4)', boxShadow: '0 4px 16px rgba(91,138,240,.38), 6px 6px 14px var(--neu-shadow-dark), -3px -3px 8px var(--neu-shadow-light)', border: '1px solid rgba(255,255,255,.18)', borderRadius: '.9rem', color: '#fff', fontWeight: 700, fontSize: '.82rem', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>
            <Plus size={16} /> Publish Notice
          </button>
        </div>

        {/* Category filter pills */}
        <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
          {[{ key: '', label: 'All' }, ...CATEGORIES.map(c => ({ key: c, label: CAT_CFG[c]?.label || c }))].map(p => {
            const cc = p.key ? CAT_CFG[p.key] : null
            const active = filterCat === p.key
            return (
              <button key={p.key} onClick={() => setFilterCat(p.key)} style={{ padding: '.4rem .85rem', borderRadius: '.7rem', border: `1.5px solid ${active ? (cc?.c || 'var(--neu-text-secondary)') : 'var(--neu-border)'}`, background: active ? (cc?.bg || 'var(--neu-surface-deep)') : 'var(--neu-surface)', boxShadow: active ? `0 3px 10px ${cc?.c || 'var(--neu-text-ghost)'}30` : '4px 4px 10px var(--neu-shadow-dark), -2px -2px 6px var(--neu-shadow-light)', color: active ? (cc?.c || 'var(--neu-text-primary)') : 'var(--neu-text-secondary)', fontWeight: 700, fontSize: '.72rem', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", transition: 'all .18s ease' }}>
                {p.label}
              </button>
            )
          })}
        </div>

        {/* Cards */}
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} style={{ height: 90, background: 'var(--neu-surface)', borderRadius: '1rem', border: '1px solid var(--neu-border)', boxShadow: '5px 5px 14px var(--neu-shadow-dark)', animation: 'pulse 1.5s infinite' }} />)
        ) : notices.length === 0 ? (
          <div style={{ background: 'var(--neu-surface)', border: '1px solid var(--neu-border)', borderRadius: '1.25rem', padding: '5rem 2rem', textAlign: 'center', boxShadow: '6px 6px 16px var(--neu-shadow-dark)' }}>
            <FileText size={40} style={{ color: 'var(--neu-text-ghost)', margin: '0 auto 1rem', opacity: .18, display: 'block' }} />
            <p style={{ fontWeight: 600, color: 'var(--neu-text-secondary)' }}>No notices yet</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.7rem' }}>
            {notices.map(n => <NoticeCard key={n.id} notice={n} onContextMenu={e => openMenu(e, n)} />)}
          </div>
        )}

        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem' }}>
            <button onClick={() => fetchNotices(pagination.page - 1)} disabled={pagination.page === 1} style={{ width: 32, height: 32, borderRadius: '.6rem', background: 'var(--neu-surface)', border: '1px solid var(--neu-border)', boxShadow: '4px 4px 10px var(--neu-shadow-dark)', cursor: pagination.page === 1 ? 'not-allowed' : 'pointer', opacity: pagination.page === 1 ? .4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--neu-text-secondary)' }}>
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: pagination.total_pages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => fetchNotices(p)} style={{ width: 32, height: 32, borderRadius: '.6rem', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '.8rem', fontFamily: "'DM Sans',sans-serif", background: p === pagination.page ? 'linear-gradient(145deg,#5b8af0,#3a6bd4)' : 'var(--neu-surface)', color: p === pagination.page ? '#fff' : 'var(--neu-text-secondary)', boxShadow: p === pagination.page ? '0 3px 10px rgba(91,138,240,.35)' : '4px 4px 10px var(--neu-shadow-dark)' }}>
                {p}
              </button>
            ))}
            <button onClick={() => fetchNotices(pagination.page + 1)} disabled={pagination.page === pagination.total_pages} style={{ width: 32, height: 32, borderRadius: '.6rem', background: 'var(--neu-surface)', border: '1px solid var(--neu-border)', boxShadow: '4px 4px 10px var(--neu-shadow-dark)', cursor: pagination.page === pagination.total_pages ? 'not-allowed' : 'pointer', opacity: pagination.page === pagination.total_pages ? .4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--neu-text-secondary)' }}>
              <ChevronRight size={14} />
            </button>
          </div>
        )}

        {/* Context menu */}
        <ContextMenu menu={menu} close={closeMenu} items={menu ? ctxItems(menu.row) : []} />

        {/* Modals */}
        {viewTarget   && <ViewModal    notice={viewTarget}   onClose={() => setViewTarget(null)} />}
        {showNew      && <NoticeModal  notice={null}         onClose={() => setShowNew(false)}   onSuccess={() => fetchNotices(1)} />}
        {editTarget   && <NoticeModal  notice={editTarget}   onClose={() => setEditTarget(null)} onSuccess={() => fetchNotices(pagination.page)} />}
        {deleteTarget && <DeleteModal  notice={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} loading={deleting} />}
      </div>
    </>
  )
}