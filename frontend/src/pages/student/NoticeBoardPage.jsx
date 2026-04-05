// frontend/src/pages/student/NoticeBoardPage.jsx
import { useState, useEffect, useCallback } from 'react'
import { FileText, X, Calendar, Eye, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { studentAPI } from '../../api/student.api'

const CSS = `
  @keyframes spin { to { transform: rotate(360deg) } }
  @keyframes paperIn { from{opacity:0;transform:scale(.85) rotate(var(--rot))} to{opacity:1;transform:scale(1) rotate(var(--rot))} }
  @keyframes modalIn { from{opacity:0;transform:scale(.93) translateY(10px)} to{opacity:1;transform:none} }
  @keyframes overlayIn { from{opacity:0} to{opacity:1} }

  .corkboard {
    background:
      radial-gradient(ellipse at 20% 30%, rgba(180,120,60,.18) 0%, transparent 60%),
      radial-gradient(ellipse at 80% 70%, rgba(140,90,40,.14) 0%, transparent 55%),
      repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,.015) 3px, rgba(0,0,0,.015) 4px),
      repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(0,0,0,.015) 3px, rgba(0,0,0,.015) 4px),
      linear-gradient(135deg, #c8956c 0%, #b8864a 30%, #c9975a 60%, #b07840 100%);
    border-radius: 1.25rem;
    border: 12px solid #7a5c3a;
    box-shadow:
      inset 0 2px 8px rgba(0,0,0,.35),
      inset 0 -2px 6px rgba(255,255,255,.08),
      0 8px 32px rgba(0,0,0,.35),
      0 2px 6px rgba(0,0,0,.2);
    position: relative;
    min-height: 480px;
  }
  .corkboard-frame {
    position: absolute; inset: -12px; border-radius: 1.4rem;
    background: linear-gradient(145deg, #8b6340, #6b4a28, #7d5535, #5c3d1e);
    box-shadow: 6px 6px 20px rgba(0,0,0,.5), -2px -2px 8px rgba(255,255,255,.07);
    z-index: -1;
  }
  .cork-screw {
    width: 14px; height: 14px; border-radius: 50%;
    background: radial-gradient(circle at 35% 35%, #c8a87a, #8b6340);
    box-shadow: inset 1px 1px 2px rgba(255,255,255,.3), 1px 1px 3px rgba(0,0,0,.4);
    position: absolute;
  }
  .paper-slip {
    position: relative;
    cursor: pointer;
    transform: rotate(var(--rot));
    animation: paperIn .4s cubic-bezier(.34,1.56,.64,1) both;
    filter: drop-shadow(3px 5px 8px rgba(0,0,0,.35));
    z-index: 1;
    transition: transform .25s cubic-bezier(.34,1.56,.64,1), filter .25s ease;
  }
  .paper-slip:hover {
    transform: rotate(0deg) scale(1.05) translateY(-4px);
    filter: drop-shadow(5px 10px 20px rgba(0,0,0,.45));
    z-index: 10;
  }
  .pin-wrap {
    position: absolute; top: -14px; left: 50%;
    transform: translateX(-50%);
    z-index: 3; pointer-events: none;
  }
  .paper-body {
    background: var(--paper-bg);
    border: 1.5px solid var(--paper-border);
    border-radius: 3px;
    padding: 22px 14px 14px;
    width: 155px; min-height: 130px;
    position: relative; overflow: hidden;
  }
  .paper-body::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; height: 3px;
    background: linear-gradient(to right, var(--paper-border), transparent, var(--paper-border));
    opacity: .4;
  }
  .paper-body.has-tape::after {
    content: '';
    position: absolute; top: 4px; left: 50%; transform: translateX(-50%);
    width: 48px; height: 14px; border-radius: 2px;
    background: rgba(255,255,200,.55); border: 1px solid rgba(200,180,100,.4);
  }
  .notice-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,.65); backdrop-filter: blur(6px);
    z-index: 999;
    display: flex; align-items: center; justify-content: center; padding: 1rem;
    animation: overlayIn .2s ease both;
  }
  .notice-full {
    background: var(--paper-bg, #fef9c3);
    border: 2px solid var(--paper-border, #fbbf24);
    border-radius: 4px;
    padding: 2.5rem 2rem 2rem;
    max-width: 520px; width: 100%; max-height: 85vh; overflow-y: auto;
    position: relative;
    box-shadow: 8px 16px 48px rgba(0,0,0,.55);
    animation: modalIn .3s cubic-bezier(.34,1.56,.64,1) both;
  }
  .notice-full-pin {
    position: absolute; top: -14px; left: 50%;
    transform: translateX(-50%); pointer-events: none;
  }
`

const CAT = {
  Academic:       { bg: '#fef9c3', border: '#fbbf24', pin: '#e53e3e', label: 'Academic', icon: '📚' },
  Administrative: { bg: '#dbeafe', border: '#3b82f6', pin: '#1a56db', label: 'Administrative', icon: '🏛' },
  Financial:      { bg: '#dcfce7', border: '#22c55e', pin: '#166534', label: 'Financial', icon: '💰' },
  Event:          { bg: '#fce7f3', border: '#ec4899', pin: '#9d174d', label: 'Event', icon: '🎉' },
  General:        { bg: '#f3f4f6', border: '#9ca3af', pin: '#374151', label: 'General', icon: '📋' },
  Urgent:         { bg: '#fee2e2', border: '#ef4444', pin: '#991b1b', label: 'Urgent', icon: '🚨' },
}
const CAT_KEYS = Object.keys(CAT)
const getCat = (c) => CAT[c] || CAT.General

function seededRand(seed) {
  let s = seed
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}

function noticeLayout(id) {
  const r = seededRand(id * 9973 + 1234)
  return { rot: (r() - 0.5) * 7 }
}

function PushPin({ color = '#e53e3e', size = 28 }) {
  const light = color + 'ee'
  const dark = color
  return (
    <svg width={size} height={size * 1.6} viewBox="0 0 28 45" xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', filter: 'drop-shadow(1px 2px 3px rgba(0,0,0,.55))' }}>
      <defs>
        <radialGradient id={`pg-${color.replace('#', '')}`} cx="38%" cy="35%" r="65%">
          <stop offset="0%" stopColor={light} />
          <stop offset="55%" stopColor={dark} />
          <stop offset="100%" stopColor="#00000088" />
        </radialGradient>
        <radialGradient id={`ps-${color.replace('#', '')}`} cx="35%" cy="30%" r="40%">
          <stop offset="0%" stopColor="rgba(255,255,255,.65)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
        <linearGradient id="needle" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#c0c0c0" />
          <stop offset="40%" stopColor="#e8e8e8" />
          <stop offset="100%" stopColor="#888" />
        </linearGradient>
      </defs>
      <ellipse cx="14" cy="13" rx="12" ry="11.5" fill="rgba(0,0,0,.25)" transform="translate(.5 1)" />
      <ellipse cx="14" cy="13" rx="12" ry="11.5" fill={`url(#pg-${color.replace('#', '')})`} />
      <ellipse cx="14" cy="13" rx="12" ry="11.5" fill={`url(#ps-${color.replace('#', '')})`} />
      <path d="M13.2 23 L14 44 L14.8 23 Z" fill="url(#needle)" stroke="rgba(0,0,0,.3)" strokeWidth=".3" />
      <circle cx="14" cy="13" r="2.5" fill="rgba(0,0,0,.22)" />
      <circle cx="13.2" cy="12.2" r="1" fill="rgba(255,255,255,.35)" />
    </svg>
  )
}

function NoticeFullView({ notice, onClose }) {
  const cat = getCat(notice.category)
  return (
    <div className="notice-overlay" onClick={onClose}>
      <div className="notice-full" style={{ '--paper-bg': cat.bg, '--paper-border': cat.border }} onClick={e => e.stopPropagation()}>
        <div className="notice-full-pin"><PushPin color={cat.pin} size={32} /></div>
        <button onClick={onClose} style={{ position: 'absolute', top: '.9rem', right: '.9rem', background: 'none', border: 'none', cursor: 'pointer', color: '#666', opacity: .55 }}>
          <X size={18} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '.72rem', fontWeight: 800, padding: '.2rem .7rem', borderRadius: '99px', background: cat.border + '30', color: cat.border, border: `1px solid ${cat.border}60` }}>
            {cat.icon} {cat.label}
          </span>
        </div>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1a1a1a', fontFamily: "'Outfit',sans-serif", marginBottom: '.85rem', lineHeight: 1.3 }}>{notice.title}</h2>
        <div style={{ background: `repeating-linear-gradient(transparent,transparent 27px,${cat.border}40 27px,${cat.border}40 28px)`, padding: '.5rem .25rem', borderRadius: '2px', marginBottom: '1rem' }}>
          <p style={{ fontSize: '.85rem', color: '#2a2a2a', lineHeight: '28px', whiteSpace: 'pre-wrap', fontFamily: "'DM Sans',sans-serif" }}>{notice.content}</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', borderTop: `1px dashed ${cat.border}80`, paddingTop: '.75rem' }}>
          <span style={{ fontSize: '.72rem', color: '#666', display: 'flex', alignItems: 'center', gap: '.3rem' }}>
            <Calendar size={12} />{new Date(notice.posted_at).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
          {notice.expiry_date && (
            <span style={{ fontSize: '.72rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '.3rem' }}>
              <Calendar size={12} />Expires: {new Date(notice.expiry_date).toLocaleDateString('en-PK', { day: '2-digit', month: 'short' })}
            </span>
          )}
          {notice.views !== undefined && (
            <span style={{ fontSize: '.72rem', color: '#888', display: 'flex', alignItems: 'center', gap: '.3rem' }}>
              <Eye size={12} />{notice.views} views
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function PaperSlip({ notice, onOpen }) {
  const cat = getCat(notice.category)
  const layout = noticeLayout(notice.id)
  const hasTape = notice.id % 3 === 0
  const lines = notice.title.split(' ')
  const preview = lines.slice(0, 4).join(' ') + (lines.length > 4 ? '…' : '')

  return (
    <div className="paper-slip" style={{ '--rot': `${layout.rot}deg` }} onClick={() => onOpen(notice)} title="Click to read">
      <div className="pin-wrap"><PushPin color={cat.pin} size={26} /></div>
      <div className={`paper-body${hasTape ? ' has-tape' : ''}`} style={{ '--paper-bg': cat.bg, '--paper-border': cat.border }}>
        <div style={{ position: 'absolute', top: '10px', right: '10px', width: 8, height: 8, borderRadius: '50%', background: cat.border, opacity: .7 }} />
        <div style={{ background: `repeating-linear-gradient(transparent,transparent 17px,${cat.border}35 17px,${cat.border}35 18px)`, padding: '.15rem 0' }}>
          <p style={{ fontSize: '.72rem', fontWeight: 800, color: '#1a1a1a', lineHeight: '18px', fontFamily: "'Outfit',sans-serif", wordBreak: 'break-word' }}>{preview}</p>
        </div>
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '.58rem', color: '#888', fontFamily: "'DM Sans',sans-serif" }}>
            {new Date(notice.posted_at).toLocaleDateString('en-PK', { day: '2-digit', month: 'short' })}
          </span>
          {notice.expiry_date && new Date(notice.expiry_date) < new Date() && (
            <span style={{ fontSize: '.55rem', color: '#ef4444', fontWeight: 700 }}>EXPIRED</span>
          )}
          <span style={{ fontSize: '.6rem', color: cat.border, fontWeight: 800, opacity: .8 }}>{cat.icon}</span>
        </div>
      </div>
    </div>
  )
}

export default function NoticeBoardPage() {
  const [notices, setNotices] = useState([])
  const [pagination, setPagination] = useState({ page: 1, total_pages: 1, total: 0 })
  const [loading, setLoading] = useState(true)
  const [viewNotice, setViewNotice] = useState(null)

  const fetchNotices = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const res = await studentAPI.getNotices(page)
      setNotices(res.data.data?.notices || [])
      setPagination(res.data.data?.pagination || { page: 1, total_pages: 1, total: 0 })
    } catch { toast.error('Failed to load notices') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    fetchNotices(1)
  }, [])

  const COLS = 5
  const rows = []
  for (let i = 0; i < notices.length; i += COLS)
    rows.push(notices.slice(i, i + COLS))

  return (
    <>
      <style>{CSS}</style>
      <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.4rem', paddingBottom: '2rem' }}>
        
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.7rem', marginBottom: '.2rem' }}>
            <div style={{ width: 38, height: 38, borderRadius: '.875rem', background: 'var(--neu-surface-deep)', boxShadow: 'inset 3px 3px 7px var(--neu-shadow-dark), inset -2px -2px 5px var(--neu-shadow-light)', border: '1px solid var(--neu-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b8864a' }}>
              <FileText size={17} />
            </div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', letterSpacing: '-.02em' }}>
              Notice Board
            </h1>
          </div>
          <p style={{ fontSize: '.78rem', color: 'var(--neu-text-ghost)', marginLeft: '.2rem' }}>
            {loading ? '…' : `${pagination.total} notices`}
          </p>
        </div>

        <div className="corkboard" style={{ padding: '2.5rem 2rem 2rem' }}>
          <div className="corkboard-frame" />
          {[{ top: 8, left: 8 }, { top: 8, right: 8 }, { bottom: 8, left: 8 }, { bottom: 8, right: 8 }].map((pos, i) => (
            <div key={i} className="cork-screw" style={pos} />
          ))}

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 280 }}>
              <div style={{ textAlign: 'center' }}>
                <Loader2 size={32} style={{ color: '#b8864a', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
                <p style={{ color: '#8b6340', fontSize: '.82rem', marginTop: '.75rem', fontFamily: "'DM Sans',sans-serif" }}>Loading board…</p>
              </div>
            </div>
          ) : notices.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 280, gap: '1rem' }}>
              <FileText size={48} style={{ color: '#b8864a', opacity: .35 }} />
              <p style={{ color: '#8b6340', fontWeight: 600, fontFamily: "'DM Sans',sans-serif", fontSize: '.9rem' }}>
                Board is empty
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
              {rows.map((row, ri) => (
                <div key={ri} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-around', flexWrap: 'wrap' }}>
                  {row.map((notice, ci) => {
                    const r = seededRand(notice.id * 7 + ri * 3 + ci)
                    const mt = r() * 28
                    return (
                      <div key={notice.id} style={{ marginTop: mt, padding: '0 8px' }}>
                        <PaperSlip notice={notice} onOpen={setViewNotice} />
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Category Legend - Only showing categories, no filter */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', paddingTop: '.5rem' }}>
          <span style={{ fontSize: '.7rem', color: 'var(--neu-text-ghost)', fontWeight: 600 }}>Categories:</span>
          {CAT_KEYS.map(k => (
            <span key={k} style={{ fontSize: '.7rem', fontWeight: 700, color: CAT[k].border, display: 'flex', alignItems: 'center', gap: '.3rem' }}>
              {CAT[k].icon} {CAT[k].label}
            </span>
          ))}
        </div>
      </div>

      {viewNotice && <NoticeFullView notice={viewNotice} onClose={() => setViewNotice(null)} />}
    </>
  )
}