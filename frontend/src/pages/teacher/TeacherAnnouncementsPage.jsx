// ═══════════════════════════════════════════════════════════════
//  TeacherAnnouncementsPage.jsx
//  → frontend/src/pages/teacher/TeacherAnnouncementsPage.jsx
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Plus, Bell, Edit2, Trash2, Loader2, X,
  ChevronLeft, ChevronRight, Pin, Megaphone,
  AlertTriangle, AlertCircle, Info, Minus, Hash,
} from 'lucide-react'
import { createPortal } from 'react-dom'
import toast from 'react-hot-toast'
import { teacherAPI } from '../../api/teacher.api'
import { useContextMenu, ContextMenu } from '../../hooks/useContextMenu'

/* ─── helpers ─────────────────────────────────────────────── */
const neu = (extra = {}) => ({
  background: 'var(--neu-surface)',
  boxShadow: 'var(--neu-raised)',
  border: '1px solid var(--neu-border)',
  borderRadius: '1.25rem',
  ...extra,
})
const neuInset = (extra = {}) => ({
  background: 'var(--neu-surface-deep)',
  boxShadow: 'inset 4px 4px 10px var(--neu-shadow-dark), inset -3px -3px 7px var(--neu-shadow-light)',
  border: '1px solid var(--neu-border)',
  borderRadius: '0.875rem',
  ...extra,
})
const iS = {
  width: '100%',
  ...neuInset({ borderRadius: '0.75rem', padding: '0.6rem 0.9rem' }),
  fontSize: '0.85rem',
  color: 'var(--neu-text-primary)',
  outline: 'none',
  fontFamily: "'DM Sans', sans-serif",
  boxSizing: 'border-box',
}
function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
      <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--neu-text-ghost)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>{label}</label>
      {children}
    </div>
  )
}

/* ─── configs ─────────────────────────────────────────────── */
const PRIORITY_CFG = {
  urgent: { label: 'Urgent', Icon: AlertTriangle, color: '#ef4444', bg: 'rgba(239,68,68,0.11)',  glow: 'rgba(239,68,68,0.3)',  emoji: '🔴' },
  high:   { label: 'High',   Icon: AlertCircle,  color: '#f97316', bg: 'rgba(249,115,22,0.11)', glow: 'rgba(249,115,22,0.3)', emoji: '🟠' },
  normal: { label: 'Normal', Icon: Info,          color: '#5b8af0', bg: 'rgba(91,138,240,0.11)', glow: 'rgba(91,138,240,0.3)', emoji: '🔵' },
  low:    { label: 'Low',    Icon: Minus,         color: '#94a3b8', bg: 'rgba(148,163,184,0.09)',glow: 'rgba(148,163,184,0.2)',emoji: '⚪' },
}
const TARGET_CFG = {
  all:      { label: 'All Users',     color: '#5b8af0', bg: 'rgba(91,138,240,0.1)' },
  students: { label: 'Students Only', color: '#3ecf8e', bg: 'rgba(62,207,142,0.1)' },
  teachers: { label: 'Teachers Only', color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
}
const FILTERS = [
  { val: '',       label: 'All',    Icon: Hash,          color: '#5b8af0', glow: 'rgba(91,138,240,0.3)'   },
  { val: 'urgent', label: 'Urgent', Icon: AlertTriangle, color: '#ef4444', glow: 'rgba(239,68,68,0.3)'    },
  { val: 'high',   label: 'High',   Icon: AlertCircle,  color: '#f97316', glow: 'rgba(249,115,22,0.3)'   },
  { val: 'normal', label: 'Normal', Icon: Info,          color: '#5b8af0', glow: 'rgba(91,138,240,0.3)'   },
  { val: 'low',    label: 'Low',    Icon: Minus,         color: '#94a3b8', glow: 'rgba(148,163,184,0.25)' },
]

/* ─── dock constants ──────────────────────────────────────── */
const BASE_SZ = 40
const MAX_SZ  = 58
const DIST    = 110
const RADIUS  = 12

function timeAgo(d) {
  if (!d) return '—'
  const s = Math.floor((Date.now() - new Date(d)) / 1000)
  if (s < 60)    return `${s}s ago`
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

/* ─── Portal tooltip ──────────────────────────────────────── */
function PortalTooltip({ label, anchorRef, visible }) {
  const [pos, setPos] = useState(null)
  useEffect(() => {
    if (!visible || !anchorRef.current) { setPos(null); return }
    const r = anchorRef.current.getBoundingClientRect()
    setPos({ top: r.bottom + 10, left: r.left + r.width / 2 })
  }, [visible])
  if (!visible || !pos) return null
  return createPortal(
    <div style={{ position: 'fixed', top: pos.top, left: pos.left, transform: 'translateX(-50%)', zIndex: 99999, pointerEvents: 'none', animation: 'fadeUp 0.12s ease both' }}>
      <div style={{ width: 0, height: 0, margin: '0 auto', borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderBottom: `6px solid var(--neu-border)` }} />
      <div style={{ background: 'var(--neu-surface)', border: '1px solid var(--neu-border)', boxShadow: 'var(--neu-raised-md)', borderRadius: '0.5rem', color: 'var(--neu-text-primary)', fontSize: '0.7rem', fontWeight: 600, padding: '0.25rem 0.65rem', whiteSpace: 'nowrap', fontFamily: "'DM Sans',sans-serif" }}>
        {label}
      </div>
    </div>,
    document.body
  )
}

/* ─── Single Dock Filter Button ───────────────────────────── */
function DockFilterItem({ tab, active, onClick, mouseX, count }) {
  const wrapRef = useRef(null)
  const [size, setSize]       = useState(BASE_SZ)
  const [showTip, setShowTip] = useState(false)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const rect   = el.getBoundingClientRect()
    const center = rect.left + rect.width / 2
    const dist   = Math.abs(mouseX - center)
    if (dist >= DIST) { setSize(BASE_SZ); return }
    const t     = 1 - dist / DIST
    const eased = t * t * (3 - 2 * t)     // smoothstep
    setSize(BASE_SZ + (MAX_SZ - BASE_SZ) * eased)
  }, [mouseX])

  const isActive = active === tab.val
  const r        = RADIUS + (size - BASE_SZ) * 0.25
  const iconSz   = Math.round(size * 0.42)

  return (
    <div ref={wrapRef}
      style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, overflow: 'visible' }}
      onMouseEnter={() => setShowTip(true)}
      onMouseLeave={() => setShowTip(false)}>

      <button onClick={onClick}
        style={{
          width: `${size}px`, height: `${size}px`,
          borderRadius: `${r}px`,
          border: `1px solid ${isActive ? tab.color + '40' : 'var(--neu-border)'}`,
          cursor: 'pointer', position: 'relative',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: isActive
            ? `linear-gradient(145deg, ${tab.color}28, ${tab.color}10)`
            : 'linear-gradient(145deg, var(--neu-surface), var(--neu-surface-deep))',
          boxShadow: isActive
            ? `5px 5px 12px var(--neu-shadow-dark), -3px -3px 8px var(--neu-shadow-light), 0 4px 16px ${tab.glow}, inset 0 1px 0 rgba(255,255,255,0.5)`
            : `5px 5px 12px var(--neu-shadow-dark), -3px -3px 8px var(--neu-shadow-light), inset 0 1px 0 rgba(255,255,255,0.6)`,
          color: isActive ? tab.color : 'var(--neu-text-muted)',
          transition: [
            'width 0.14s cubic-bezier(0.34,1.56,0.64,1)',
            'height 0.14s cubic-bezier(0.34,1.56,0.64,1)',
            'border-radius 0.14s ease',
            'box-shadow 0.2s ease',
            'background 0.2s ease',
            'color 0.2s ease',
          ].join(', '),
        }}>
        <tab.Icon size={iconSz} style={{ color: isActive ? tab.color : 'var(--neu-text-muted)', transition: 'color 0.2s', pointerEvents: 'none' }} />

        {/* Badge */}
        {count > 0 && (
          <span style={{
            position: 'absolute', top: -5, right: -5,
            minWidth: 17, height: 17, borderRadius: '999px', padding: '0 3px',
            background: isActive ? tab.color : 'var(--neu-surface)',
            color: isActive ? '#fff' : 'var(--neu-text-ghost)',
            fontSize: '0.56rem', fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: isActive ? `0 2px 8px ${tab.glow}` : '3px 3px 8px var(--neu-shadow-dark), -2px -2px 5px var(--neu-shadow-light)',
            border: '1px solid var(--neu-border)', pointerEvents: 'none',
            transition: 'all 0.2s',
          }}>
            {count}
          </span>
        )}
      </button>
    </div>
  )
}

/* ─── Dock Filter Bar ─────────────────────────────────────── */
function DockFilterBar({ filter, setFilter, counts }) {
  const [mouseX, setMouseX] = useState(-9999)
  const onMove  = useCallback(e => setMouseX(e.clientX), [])
  const onLeave = useCallback(() => setMouseX(-9999), [])

  return (
    <div onMouseMove={onMove} onMouseLeave={onLeave}
      style={{ 
        ...neuInset({ borderRadius: '1.1rem', padding: '0.5rem 0.65rem' }), 
        display: 'flex', 
        alignItems: 'flex-end', 
        gap: '8px', 
        overflow: 'visible',
        width: 'fit-content', // This will maintain constant width
        minWidth: `${FILTERS.length * 48 + 16}px`, // Calculate minimum width based on number of items
      }}>
      {FILTERS.map(tab => (
        <div key={tab.val} style={{ 
          width: '48px', // Fixed width container for each item
          display: 'flex', 
          justifyContent: 'center',
          flexShrink: 0 
        }}>
          <DockFilterItem
            tab={tab}
            active={filter}
            onClick={() => setFilter(tab.val)}
            mouseX={mouseX}
            count={tab.val === '' ? counts._all : (counts[tab.val] || 0)}
          />
        </div>
      ))}
    </div>
  )
}
/* ─── Modal ───────────────────────────────────────────────── */
function Modal({ children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(8,12,20,0.7)', backdropFilter: 'blur(12px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ ...neu({ borderRadius: '1.5rem', overflow: 'hidden', boxShadow: '20px 20px 50px var(--neu-shadow-dark), -10px -10px 30px var(--neu-shadow-light)' }), width: '100%', maxWidth: 540, maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
    </div>
  )
}

function PillBtn({ active, onClick, color, glow, children }) {
  const [hov, setHov] = useState(false)
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.4rem',
        padding: '0.45rem 0.95rem', borderRadius: '0.75rem', border: 'none',
        fontFamily: "'DM Sans',sans-serif", fontSize: '0.78rem', fontWeight: active ? 800 : 600,
        cursor: 'pointer', transition: 'all 0.18s ease',
        background: active ? `linear-gradient(145deg,${color},${color}cc)` : 'var(--neu-surface-deep)',
        boxShadow: active
          ? `5px 5px 12px var(--neu-shadow-dark),-3px -3px 8px var(--neu-shadow-light),0 0 0 2px ${color}30,0 4px 14px ${glow}`
          : hov
          ? `4px 4px 10px var(--neu-shadow-dark),-2px -2px 6px var(--neu-shadow-light)`
          : `inset 3px 3px 7px var(--neu-shadow-dark),inset -2px -2px 5px var(--neu-shadow-light)`,
        color: active ? '#fff' : hov ? 'var(--neu-text-secondary)' : 'var(--neu-text-ghost)',
        transform: active ? 'scale(1.02)' : hov ? 'scale(1.01)' : 'scale(1)',
      }}>
      {children}
    </button>
  )
}

/* ─── Announcement Form Modal ─────────────────────────────── */
function AnnouncementModal({ ann, onClose, onSuccess }) {
  const isEdit = !!ann?.id
  const [form, setForm] = useState({
    title: ann?.title || '', content: ann?.content || '',
    priority: ann?.priority || 'normal', target_audience: ann?.target_audience || 'all',
    pinned_until: ann?.pinned_until || '',
  })
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.content.trim()) { toast.error('Title and content required'); return }
    setLoading(true)
    try {
      if (isEdit) { await teacherAPI.updateAnnouncement(ann.id, form); toast.success('Updated!') }
      else        { await teacherAPI.createAnnouncement(form);         toast.success('Published!') }
      onSuccess(); onClose()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setLoading(false) }
  }

  return (
    <Modal>
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--neu-border)', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
        <div style={{ width: 38, height: 38, borderRadius: '0.875rem', ...neuInset({ borderRadius: '0.875rem' }), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5b8af0', flexShrink: 0 }}>
          <Megaphone size={17} />
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', lineHeight: 1.2 }}>
            {isEdit ? 'Edit Announcement' : 'New Announcement'}
          </h2>
          <p style={{ fontSize: '0.72rem', color: 'var(--neu-text-ghost)', marginTop: '0.1rem' }}>
            {isEdit ? 'Update details' : 'Broadcast to your students'}
          </p>
        </div>
        <button onClick={onClose} style={{ ...neuInset({ borderRadius: '0.65rem', padding: '0.4rem' }), border: 'none', cursor: 'pointer', color: 'var(--neu-text-ghost)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <X size={16} />
        </button>
      </div>

      <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Field label="Title *">
          <input style={iS} value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Assignment deadline reminder…" autoFocus />
        </Field>
        <Field label="Content *">
          <textarea style={{ ...iS, resize: 'vertical', minHeight: 110, lineHeight: 1.65 }} value={form.content} onChange={e => set('content', e.target.value)} placeholder="Write your announcement here…" />
        </Field>
        <Field label="Priority">
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {Object.entries(PRIORITY_CFG).map(([key, cfg]) => (
              <PillBtn key={key} active={form.priority === key} onClick={() => set('priority', key)} color={cfg.color} glow={cfg.glow}>
                <cfg.Icon size={12} /> {cfg.label}
              </PillBtn>
            ))}
          </div>
        </Field>
        <Field label="Target Audience">
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {Object.entries(TARGET_CFG).map(([key, cfg]) => (
              <PillBtn key={key} active={form.target_audience === key} onClick={() => set('target_audience', key)} color={cfg.color} glow={cfg.bg}>
                {cfg.label}
              </PillBtn>
            ))}
          </div>
        </Field>
        <Field label="Pin Until (optional)">
          <input style={iS} type="date" value={form.pinned_until} onChange={e => set('pinned_until', e.target.value)} />
        </Field>
      </div>

      <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--neu-border)', display: 'flex', gap: '0.75rem' }}>
        <button onClick={onClose}
          style={{ flex: 1, padding: '0.68rem', borderRadius: '0.875rem', border: 'none', ...neuInset({ borderRadius: '0.875rem', padding: '0.68rem' }), color: 'var(--neu-text-secondary)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>
          Cancel
        </button>
        <button onClick={handleSubmit} disabled={loading}
          style={{ flex: 2, padding: '0.68rem', borderRadius: '0.875rem', border: 'none', background: 'linear-gradient(145deg,#5b8af0,#3a6bd4)', boxShadow: '6px 6px 16px var(--neu-shadow-dark),-3px -3px 8px var(--neu-shadow-light),0 4px 18px rgba(91,138,240,0.38)', color: '#fff', fontWeight: 800, fontSize: '0.85rem', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontFamily: "'DM Sans',sans-serif", transition: 'transform 0.15s' }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)' }}
          onMouseLeave={e => e.currentTarget.style.transform = ''}>
          {loading && <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} />}
          {isEdit ? 'Save Changes' : '📢 Publish'}
        </button>
      </div>
    </Modal>
  )
}

/* ─── Announcement Card — right-click only, no hover buttons ─ */
function AnnCard({ ann, onCtx }) {
  const [hov, setHov] = useState(false)
  const cfg = PRIORITY_CFG[ann.priority] || PRIORITY_CFG.normal
  const tgt = TARGET_CFG[ann.target_audience] || TARGET_CFG.all
  const pinned = ann.pinned_until && new Date(ann.pinned_until) >= new Date()

  return (
    <div
      onContextMenu={e => onCtx(e, ann)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        ...neu({ padding: 0, overflow: 'hidden', position: 'relative', cursor: 'context-menu' }),
        transition: 'transform 0.2s, box-shadow 0.2s',
        transform: hov ? 'translateY(-2px)' : '',
        boxShadow: hov ? '12px 12px 28px var(--neu-shadow-dark), -8px -8px 18px var(--neu-shadow-light)' : 'var(--neu-raised)',
      }}>
      {/* Left accent */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: `linear-gradient(to bottom,${cfg.color},${cfg.color}88)`, borderRadius: '1.25rem 0 0 1.25rem' }} />

      <div style={{ padding: '1.1rem 1.1rem 1rem 1.4rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.55rem' }}>
          <div style={{ width: 36, height: 36, borderRadius: '0.75rem', background: cfg.bg, color: cfg.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1, boxShadow: 'inset 2px 2px 5px var(--neu-shadow-dark),inset -1px -1px 3px var(--neu-shadow-light)' }}>
            <cfg.Icon size={15} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.3rem' }}>
              {pinned && (
                <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '0.12rem 0.45rem', background: 'rgba(245,166,35,0.12)', color: '#f5a623', borderRadius: '0.35rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                  <Pin size={9} /> Pinned
                </span>
              )}
              <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.12rem 0.5rem', background: cfg.bg, color: cfg.color, borderRadius: '0.35rem' }}>
                {cfg.emoji} {cfg.label}
              </span>
              <span style={{ fontSize: '0.63rem', fontWeight: 600, padding: '0.12rem 0.45rem', background: tgt.bg, color: tgt.color, borderRadius: '0.35rem' }}>
                {tgt.label}
              </span>
            </div>
            <h3 style={{ fontSize: '0.93rem', fontWeight: 700, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', lineHeight: 1.3 }}>
              {ann.title}
            </h3>
          </div>
        </div>

        <p style={{ fontSize: '0.8rem', color: 'var(--neu-text-muted)', lineHeight: 1.6, marginLeft: '2.9rem', marginBottom: '0.5rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {ann.content}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '2.9rem' }}>
          {ann.created_by_name && (
            <span style={{ fontSize: '0.68rem', color: 'var(--neu-text-ghost)', fontWeight: 600 }}>by {ann.created_by_name}</span>
          )}
          <span style={{ fontSize: '0.65rem', color: 'var(--neu-text-ghost)', marginLeft: 'auto' }}>{timeAgo(ann.created_at)}</span>
        </div>
      </div>

      {/* Right-click hint */}
      <span style={{
        position: 'absolute', bottom: '0.45rem', right: '0.7rem',
        fontSize: '0.6rem', color: 'var(--neu-text-ghost)',
        opacity: hov ? 0.55 : 0.2, transition: 'opacity 0.2s',
        pointerEvents: 'none', userSelect: 'none',
      }}>
        right-click to edit
      </span>
    </div>
  )
}

/* ─── Main Page ───────────────────────────────────────────── */
export default function TeacherAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([])
  const [pagination, setPagination]       = useState({ total: 0, page: 1, per_page: 10, total_pages: 1 })
  const [loading, setLoading]             = useState(true)
  const [filter, setFilter]               = useState('')
  const [modal, setModal]                 = useState(null)
  const [deletingId, setDeletingId]       = useState(null)
  const { menu, open: openCtx, close: closeCtx } = useContextMenu()

  const fetchAnn = async (page = 1) => {
    setLoading(true)
    try {
      const res = await teacherAPI.getAnnouncements(page, filter || undefined)
      setAnnouncements(res.data.data?.announcements || [])
      setPagination(res.data.data?.pagination || { total: 0, page: 1, per_page: 10, total_pages: 1 })
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchAnn() }, [filter])

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement?')) return
    setDeletingId(id)
    try { await teacherAPI.deleteAnnouncement(id); toast.success('Deleted'); fetchAnn(pagination.page) }
    catch { toast.error('Failed to delete') }
    finally { setDeletingId(null) }
  }

  const counts = { _all: announcements.length }
  announcements.forEach(a => { counts[a.priority] = (counts[a.priority] || 0) + 1 })

  const ctxItems = ann => [
    { label: 'Edit',   icon: Edit2,  onClick: a => setModal(a) },
    { divider: true },
    { label: 'Delete', icon: Trash2, onClick: a => handleDelete(a.id), danger: true },
  ]

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: '2rem' }}>
      <style>{`
        @keyframes spin   { to { transform: rotate(360deg) } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:none } }
      `}</style>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.2rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: '0.875rem', ...neuInset({ borderRadius: '0.875rem' }), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5b8af0' }}>
              <Megaphone size={18} />
            </div>
            <h1 style={{ fontSize: '1.55rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif' }}>Announcements</h1>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--neu-text-ghost)', marginLeft: '0.2rem' }}>{pagination.total} total announcements</p>
        </div>
        <button onClick={() => setModal({})}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.68rem 1.3rem', borderRadius: '0.875rem', border: 'none', background: 'linear-gradient(145deg,#5b8af0,#3a6bd4)', boxShadow: '6px 6px 16px var(--neu-shadow-dark),-3px -3px 8px var(--neu-shadow-light),0 4px 18px rgba(91,138,240,0.38)', color: '#fff', fontSize: '0.82rem', fontWeight: 700, fontFamily: "'DM Sans',sans-serif", cursor: 'pointer', transition: 'transform 0.15s,box-shadow 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '8px 8px 22px var(--neu-shadow-dark),-4px -4px 12px var(--neu-shadow-light),0 8px 24px rgba(91,138,240,0.48)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '6px 6px 16px var(--neu-shadow-dark),-3px -3px 8px var(--neu-shadow-light),0 4px 18px rgba(91,138,240,0.38)' }}>
          <Plus size={15} /> New Announcement
        </button>
      </div>

      {/* ── Dock Filter Bar ── */}
      <div style={{ overflow: 'visible' }}>
        <DockFilterBar filter={filter} setFilter={setFilter} counts={counts} />
      </div>

      {/* ── Cards ── */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Loader2 size={30} style={{ color: '#5b8af0', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : announcements.length === 0 ? (
        <div style={{ ...neu({ padding: '4rem 2rem' }), display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ ...neuInset({ width: 60, height: 60, borderRadius: '1.1rem' }), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5b8af0' }}>
            <Bell size={26} />
          </div>
          <p style={{ fontWeight: 700, color: 'var(--neu-text-secondary)', fontSize: '0.95rem' }}>No announcements yet</p>
          <p style={{ fontSize: '0.8rem', color: 'var(--neu-text-ghost)' }}>
            {filter ? `No ${PRIORITY_CFG[filter]?.label} priority announcements` : 'Click "+ New Announcement" to get started'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {announcements.map(ann => <AnnCard key={ann.id} ann={ann} onCtx={openCtx} />)}
        </div>
      )}

      {/* ── Pagination ── */}
      {pagination.total_pages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem' }}>
          {[
            { icon: <ChevronLeft size={16} />, disabled: pagination.page <= 1,                     fn: () => fetchAnn(pagination.page - 1) },
            { icon: <ChevronRight size={16} />, disabled: pagination.page >= pagination.total_pages, fn: () => fetchAnn(pagination.page + 1) },
          ].map((btn, i) => (
            <button key={i} onClick={btn.fn} disabled={btn.disabled}
              style={{ width: 36, height: 36, borderRadius: '0.7rem', border: 'none', background: 'var(--neu-surface)', boxShadow: btn.disabled ? 'inset 3px 3px 7px var(--neu-shadow-dark),inset -2px -2px 5px var(--neu-shadow-light)' : 'var(--neu-raised)', color: btn.disabled ? 'var(--neu-text-ghost)' : 'var(--neu-text-secondary)', cursor: btn.disabled ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.12s' }}
              onMouseEnter={e => { if (!btn.disabled) e.currentTarget.style.transform = 'scale(1.08)' }}
              onMouseLeave={e => e.currentTarget.style.transform = ''}>
              {btn.icon}
            </button>
          ))}
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--neu-text-secondary)', padding: '0 0.3rem' }}>
            {pagination.page} / {pagination.total_pages}
          </span>
        </div>
      )}

      <ContextMenu menu={menu} close={closeCtx} items={menu ? ctxItems(menu.row) : []} />

      {modal !== null && (
        <AnnouncementModal
          ann={modal?.id ? modal : null}
          onClose={() => setModal(null)}
          onSuccess={() => fetchAnn(pagination.page)}
        />
      )}
    </div>
  )
}