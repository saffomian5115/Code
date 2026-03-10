// ═══════════════════════════════════════════════════════════════
//  AnnouncementsPage.jsx  (Student)  —  Neumorphic
//  → frontend/src/pages/student/AnnouncementsPage.jsx
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect } from 'react'
import {
  Bell, FileText, Pin, ChevronLeft, ChevronRight,
  Loader2, AlertTriangle, AlertCircle, Info, Minus,
  Hash, Calendar, ChevronDown, ChevronUp,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { studentAPI } from '../../api/student.api'
import { timeAgo, formatDate } from '../../utils/helpers'

/* ─── helpers ────────────────────────────────────────────────── */
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

/* ─── Priority config ────────────────────────────────────────── */
const PRIORITY_CFG = {
  urgent: { color: '#f87171', bg: 'rgba(248,113,113,0.12)', icon: AlertTriangle, label: 'Urgent', emoji: '🔴' },
  high:   { color: '#f97316', bg: 'rgba(249,115,22,0.12)',  icon: AlertCircle,   label: 'High',   emoji: '🟠' },
  normal: { color: '#5b8af0', bg: 'rgba(91,138,240,0.12)',  icon: Info,          label: 'Normal', emoji: '🔵' },
  low:    { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)',  icon: Minus,         label: 'Low',    emoji: '⚪' },
}
const pc = (p) => PRIORITY_CFG[p] || PRIORITY_CFG.normal

/* ─── Notice category config ─────────────────────────────────── */
const NOTICE_COLORS = ['#5b8af0', '#a78bfa', '#3ecf8e', '#f59e0b', '#f87171', '#38bdf8']
const nc = (i) => NOTICE_COLORS[i % NOTICE_COLORS.length]

/* ─── Skeleton ───────────────────────────────────────────────── */
function Skeleton() {
  return (
    <div style={{ ...neu({ padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }) }}>
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <div style={{ width: 38, height: 38, borderRadius: '0.75rem', background: 'var(--neu-surface-deep)', animation: 'pulse 1.5s infinite', flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <div style={{ height: 12, borderRadius: '0.4rem', background: 'var(--neu-surface-deep)', animation: 'pulse 1.5s infinite' }} />
          <div style={{ height: 10, borderRadius: '0.4rem', background: 'var(--neu-surface-deep)', width: '55%', animation: 'pulse 1.5s 0.1s infinite' }} />
        </div>
      </div>
      <div style={{ height: 10, borderRadius: '0.4rem', background: 'var(--neu-surface-deep)', animation: 'pulse 1.5s 0.2s infinite' }} />
    </div>
  )
}

/* ─── Announcement Card ──────────────────────────────────────── */
function AnnouncementCard({ item, idx, expanded, onToggle, pinned }) {
  const cfg = pc(item.priority)
  const PriorityIcon = cfg.icon

  return (
    <div style={{
      ...neu({ padding: '0' }),
      overflow: 'hidden',
      animation: `fadeUp 0.3s ease ${idx * 0.05}s both`,
      borderLeft: `3px solid ${cfg.color}`,
    }}>
      {/* Header */}
      <div
        style={{ padding: '1rem 1.2rem', display: 'flex', alignItems: 'flex-start', gap: '0.85rem', cursor: 'pointer' }}
        onClick={onToggle}
      >
        {/* Icon */}
        <div style={{
          ...neuInset({ width: 38, height: 38, borderRadius: '0.75rem', flexShrink: 0 }),
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: cfg.color,
        }}>
          <PriorityIcon size={16} />
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.2rem' }}>
            <p style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--neu-text-primary)' }}>
              {item.title}
            </p>
            {pinned && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.6rem', fontWeight: 800, padding: '0.15rem 0.45rem', borderRadius: '0.4rem', background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>
                <Pin size={9} /> Pinned
              </span>
            )}
            <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: '0.4rem', background: cfg.bg, color: cfg.color }}>
              {cfg.emoji} {cfg.label}
            </span>
          </div>
          <p style={{ fontSize: '0.7rem', color: 'var(--neu-text-ghost)' }}>
            {timeAgo ? timeAgo(item.created_at) : formatDate(item.created_at)}
          </p>
        </div>

        {/* Expand */}
        <div style={{
          width: 26, height: 26, borderRadius: '0.5rem', flexShrink: 0,
          background: 'var(--neu-surface-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '2px 2px 5px var(--neu-shadow-dark), -1px -1px 3px var(--neu-shadow-light)',
          color: 'var(--neu-text-muted)',
        }}>
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </div>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--neu-border)', padding: '1rem 1.2rem' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--neu-text-secondary)', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
            {item.content}
          </p>
          {item.attachment_url && (
            <a href={item.attachment_url} target="_blank" rel="noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.85rem',
                fontSize: '0.75rem', fontWeight: 700, color: '#5b8af0', textDecoration: 'none',
                padding: '0.4rem 0.85rem', borderRadius: '0.65rem',
                background: 'rgba(91,138,240,0.1)', border: '1px solid rgba(91,138,240,0.2)',
              }}>
              <FileText size={13} /> View Attachment
            </a>
          )}
          <p style={{ fontSize: '0.65rem', color: 'var(--neu-text-ghost)', marginTop: '0.75rem' }}>
            Posted: {formatDate(item.created_at)}
            {item.target_type && ` · Target: ${item.target_type}`}
          </p>
        </div>
      )}
    </div>
  )
}

/* ─── Notice Card ────────────────────────────────────────────── */
function NoticeCard({ item, idx, expanded, onToggle }) {
  const color = nc(idx)

  return (
    <div style={{
      ...neu({ padding: '0' }),
      overflow: 'hidden',
      animation: `fadeUp 0.3s ease ${idx * 0.05}s both`,
      borderLeft: `3px solid ${color}`,
    }}>
      <div
        style={{ padding: '1rem 1.2rem', display: 'flex', alignItems: 'flex-start', gap: '0.85rem', cursor: 'pointer' }}
        onClick={onToggle}
      >
        <div style={{
          ...neuInset({ width: 38, height: 38, borderRadius: '0.75rem', flexShrink: 0 }),
          display: 'flex', alignItems: 'center', justifyContent: 'center', color,
        }}>
          <FileText size={16} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.2rem' }}>
            <p style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--neu-text-primary)' }}>
              {item.title}
            </p>
            {item.category && (
              <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: '0.4rem', background: `${color}18`, color }}>
                {item.category}
              </span>
            )}
          </div>
          <p style={{ fontSize: '0.7rem', color: 'var(--neu-text-ghost)' }}>
            {timeAgo ? timeAgo(item.created_at) : formatDate(item.created_at)}
          </p>
        </div>

        <div style={{
          width: 26, height: 26, borderRadius: '0.5rem', flexShrink: 0,
          background: 'var(--neu-surface-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '2px 2px 5px var(--neu-shadow-dark), -1px -1px 3px var(--neu-shadow-light)',
          color: 'var(--neu-text-muted)',
        }}>
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </div>
      </div>

      {expanded && (
        <div style={{ borderTop: '1px solid var(--neu-border)', padding: '1rem 1.2rem' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--neu-text-secondary)', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
            {item.content}
          </p>
          {item.attachment_url && (
            <a href={item.attachment_url} target="_blank" rel="noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.85rem',
                fontSize: '0.75rem', fontWeight: 700, color, textDecoration: 'none',
                padding: '0.4rem 0.85rem', borderRadius: '0.65rem',
                background: `${color}15`, border: `1px solid ${color}30`,
              }}>
              <FileText size={13} /> View Attachment
            </a>
          )}
          <p style={{ fontSize: '0.65rem', color: 'var(--neu-text-ghost)', marginTop: '0.75rem' }}>
            Posted: {formatDate(item.created_at)}
          </p>
        </div>
      )}
    </div>
  )
}

/* ─── Pagination ─────────────────────────────────────────────── */
function Pagination({ page, totalPages, onPrev, onNext }) {
  if (totalPages <= 1) return null
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginTop: '1rem' }}>
      <button onClick={onPrev} disabled={page === 1}
        style={{
          width: 36, height: 36, borderRadius: '0.75rem', border: 'none', cursor: page === 1 ? 'not-allowed' : 'pointer',
          background: 'var(--neu-surface)', opacity: page === 1 ? 0.35 : 1,
          boxShadow: '4px 4px 10px var(--neu-shadow-dark), -2px -2px 6px var(--neu-shadow-light)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--neu-text-secondary)',
        }}>
        <ChevronLeft size={16} />
      </button>
      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--neu-text-secondary)' }}>
        {page} / {totalPages}
      </span>
      <button onClick={onNext} disabled={page === totalPages}
        style={{
          width: 36, height: 36, borderRadius: '0.75rem', border: 'none', cursor: page === totalPages ? 'not-allowed' : 'pointer',
          background: 'var(--neu-surface)', opacity: page === totalPages ? 0.35 : 1,
          boxShadow: '4px 4px 10px var(--neu-shadow-dark), -2px -2px 6px var(--neu-shadow-light)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--neu-text-secondary)',
        }}>
        <ChevronRight size={16} />
      </button>
    </div>
  )
}

/* ─── Main Page ──────────────────────────────────────────────── */
export default function AnnouncementsPage() {
  const [tab, setTab]               = useState('announcements')
  const [announcements, setAnnouncements] = useState([])
  const [notices, setNotices]       = useState([])
  const [page, setPage]             = useState(1)
  const [pagination, setPagination] = useState({ total_pages: 1 })
  const [loading, setLoading]       = useState(true)
  const [expandedId, setExpandedId] = useState(null)

  const fetchData = async (p = 1) => {
    setLoading(true)
    setExpandedId(null)
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

  const items       = tab === 'announcements' ? announcements : notices
  const isPinned    = (item) => item.pinned_until && new Date(item.pinned_until) >= new Date()
  const pinnedItems = items.filter(isPinned)
  const normalItems = items.filter(i => !isPinned(i))

  const TABS = [
    { key: 'announcements', label: 'Announcements', Icon: Bell },
    { key: 'notices',       label: 'Notice Board',  Icon: FileText },
  ]

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', paddingBottom: '2rem' }}>
      <style>{`
        @keyframes spin   { to { transform: rotate(360deg) } }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
        @keyframes pulse  { 0%,100%{opacity:.5} 50%{opacity:1} }
      `}</style>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div style={{ ...neuInset({ width: 44, height: 44, borderRadius: '0.875rem' }), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f97316' }}>
          <Bell size={20} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit, sans-serif' }}>
            Announcements & Notices
          </h1>
          <p style={{ fontSize: '0.78rem', color: 'var(--neu-text-ghost)' }}>Stay updated with latest information</p>
        </div>
      </div>

      {/* ── Tab switcher ── */}
      <div style={{
        ...neu({ padding: '0.35rem', display: 'inline-flex', gap: '0.3rem', marginBottom: '1.25rem' }),
        borderRadius: '0.875rem',
      }}>
        {TABS.map(({ key, label, Icon }) => {
          const active = tab === key
          return (
            <button key={key} onClick={() => setTab(key)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.45rem',
                padding: '0.55rem 1.1rem', borderRadius: '0.65rem', border: 'none', cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '0.82rem',
                background: active ? 'var(--neu-surface)' : 'transparent',
                color: active ? 'var(--neu-text-primary)' : 'var(--neu-text-muted)',
                boxShadow: active ? '4px 4px 10px var(--neu-shadow-dark), -2px -2px 6px var(--neu-shadow-light)' : 'none',
                transition: 'all 0.18s',
              }}>
              <Icon size={14} />
              {label}
            </button>
          )
        })}
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[1, 2, 3, 4].map(i => <Skeleton key={i} />)}
        </div>
      ) : items.length === 0 ? (
        <div style={{ ...neu({ padding: '4rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }) }}>
          <div style={{ ...neuInset({ width: 56, height: 56, borderRadius: '1rem' }), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5b8af0' }}>
            {tab === 'announcements' ? <Bell size={24} /> : <FileText size={24} />}
          </div>
          <p style={{ fontWeight: 700, color: 'var(--neu-text-secondary)', fontSize: '0.95rem' }}>
            No {tab === 'announcements' ? 'announcements' : 'notices'} yet
          </p>
          <p style={{ fontSize: '0.78rem', color: 'var(--neu-text-ghost)' }}>Check back later for updates</p>
        </div>
      ) : (
        <>
          {/* Pinned section */}
          {pinnedItems.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.6rem' }}>
                <Pin size={13} style={{ color: '#f59e0b' }} />
                <p style={{ fontSize: '0.68rem', fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Pinned</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {pinnedItems.map((item, idx) =>
                  tab === 'announcements' ? (
                    <AnnouncementCard key={item.id} item={item} idx={idx} pinned expanded={expandedId === item.id} onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)} />
                  ) : (
                    <NoticeCard key={item.id} item={item} idx={idx} expanded={expandedId === item.id} onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)} />
                  )
                )}
              </div>
            </div>
          )}

          {/* Normal items */}
          {normalItems.length > 0 && (
            <div>
              {pinnedItems.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.6rem' }}>
                  <Hash size={13} style={{ color: 'var(--neu-text-ghost)' }} />
                  <p style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--neu-text-ghost)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>All</p>
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {normalItems.map((item, idx) =>
                  tab === 'announcements' ? (
                    <AnnouncementCard key={item.id} item={item} idx={idx} expanded={expandedId === item.id} onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)} />
                  ) : (
                    <NoticeCard key={item.id} item={item} idx={idx} expanded={expandedId === item.id} onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)} />
                  )
                )}
              </div>
            </div>
          )}

          <Pagination
            page={page}
            totalPages={pagination.total_pages}
            onPrev={() => setPage(p => p - 1)}
            onNext={() => setPage(p => p + 1)}
          />
        </>
      )}
    </div>
  )
}