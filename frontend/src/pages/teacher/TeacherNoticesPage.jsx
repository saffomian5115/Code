// ═══════════════════════════════════════════════════════════════
//  TeacherNoticesPage.jsx
//  frontend/src/pages/teacher/TeacherNoticesPage.jsx
//  Same cork-board UI as admin NoticesPage — view-only for teacher
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X, Loader2, FileText, Calendar, Eye } from 'lucide-react'
import { teacherAPI } from '../../api/teacher.api'
import toast from 'react-hot-toast'

/* ─── Category config ───────────────────────────────── */
const CAT = {
  Academic:       { bg:'#fef9c3', border:'#fbbf24', pin:'#e53e3e', label:'Academic',       icon:'📚' },
  Administrative: { bg:'#dbeafe', border:'#3b82f6', pin:'#1a56db', label:'Administrative', icon:'🏛'  },
  Financial:      { bg:'#dcfce7', border:'#22c55e', pin:'#166534', label:'Financial',      icon:'💰' },
  Event:          { bg:'#fce7f3', border:'#ec4899', pin:'#9d174d', label:'Event',          icon:'🎉' },
  General:        { bg:'#f3f4f6', border:'#9ca3af', pin:'#374151', label:'General',        icon:'📋' },
  Urgent:         { bg:'#fee2e2', border:'#ef4444', pin:'#991b1b', label:'Urgent',         icon:'🚨' },
}
const CAT_KEYS = Object.keys(CAT)
const getCat   = (c) => CAT[c] || CAT.General

/* ─── Audience config ───────────────────────────────── */
const AUD = {
  all:      { label:'🌐 Everyone',  color:'#5b8af0' },
  students: { label:'🎓 Students',  color:'#22c55e' },
  teachers: { label:'👨‍🏫 Teachers', color:'#f59e0b' },
  staff:    { label:'🏛 Staff',     color:'#a78bfa' },
}

function seededRand(seed) {
  let s = seed
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}
function noticeLayout(id) {
  const r = seededRand(id * 9973 + 1234)
  return { rot: (r() - 0.5) * 7 }
}

/* ─── Realistic SVG Push-Pin ────────────────────────── */
function PushPin({ color = '#e53e3e', size = 28 }) {
  const light = color + 'ee'
  const dark  = color
  return (
    <svg width={size} height={size * 1.6} viewBox="0 0 28 45" xmlns="http://www.w3.org/2000/svg"
      style={{ display:'block', filter:'drop-shadow(1px 2px 3px rgba(0,0,0,.55))' }}>
      <defs>
        <radialGradient id={`pg-${color.replace('#','')}`} cx="38%" cy="35%" r="65%">
          <stop offset="0%"   stopColor={light} />
          <stop offset="55%"  stopColor={dark}  />
          <stop offset="100%" stopColor="#00000088" />
        </radialGradient>
        <radialGradient id={`ps-${color.replace('#','')}`} cx="35%" cy="30%" r="40%">
          <stop offset="0%"   stopColor="rgba(255,255,255,.65)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)"   />
        </radialGradient>
        <linearGradient id="needle" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#c0c0c0" />
          <stop offset="40%"  stopColor="#e8e8e8" />
          <stop offset="100%" stopColor="#888" />
        </linearGradient>
      </defs>
      <ellipse cx="14" cy="13" rx="12" ry="11.5" fill="rgba(0,0,0,.25)" transform="translate(.5 1)" />
      <ellipse cx="14" cy="13" rx="12" ry="11.5" fill={`url(#pg-${color.replace('#','')})`} />
      <ellipse cx="14" cy="13" rx="12" ry="11.5" fill={`url(#ps-${color.replace('#','')})`} />
      <path d="M13.2 23 L14 44 L14.8 23 Z" fill="url(#needle)" stroke="rgba(0,0,0,.3)" strokeWidth=".3" />
      <circle cx="14" cy="13" r="2.5" fill="rgba(0,0,0,.22)" />
      <circle cx="13.2" cy="12.2" r="1" fill="rgba(255,255,255,.35)" />
    </svg>
  )
}

/* ─── CSS ───────────────────────────────────────────── */
const CSS = `
  @keyframes spin         { to { transform: rotate(360deg) } }
  @keyframes paperIn      { from{opacity:0;transform:scale(.85) rotate(var(--rot))} to{opacity:1;transform:scale(1) rotate(var(--rot))} }
  @keyframes modalIn      { from{opacity:0;transform:scale(.93) translateY(10px)} to{opacity:1;transform:none} }
  @keyframes overlayIn    { from{opacity:0} to{opacity:1} }
  @keyframes tooltipFade  { from{opacity:0;transform:translateX(-50%) translateY(6px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }

  .corkboard {
    background:
      radial-gradient(ellipse at 20% 30%, rgba(180,120,60,.18) 0%, transparent 60%),
      radial-gradient(ellipse at 80% 70%, rgba(140,90,40,.14) 0%, transparent 55%),
      repeating-linear-gradient(0deg,   transparent, transparent 3px, rgba(0,0,0,.015) 3px, rgba(0,0,0,.015) 4px),
      repeating-linear-gradient(90deg,  transparent, transparent 3px, rgba(0,0,0,.015) 3px, rgba(0,0,0,.015) 4px),
      linear-gradient(135deg, #c8956c 0%, #b8864a 30%, #c9975a 60%, #b07840 100%);
    border-radius: 1.25rem;
    border: 12px solid #7a5c3a;
    box-shadow:
      inset 0 2px 8px rgba(0,0,0,.35),
      inset 0 -2px 6px rgba(255,255,255,.08),
      0 8px 32px rgba(0,0,0,.35),
      0 2px 6px rgba(0,0,0,.2);
    position: relative;
    min-height: 520px;
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

/* ─── Category Dock ─────────────────────────────────── */
function DockIcon({ item, active, onChange, mouseX }) {
  const ref = useRef(null)
  const BASE_SIZE = 40, MAX_SIZE = 56, DISTANCE = 80
  const [size, setSize] = useState(BASE_SIZE)
  const [showTooltip, setShowTooltip] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || mouseX === -9999) { setSize(BASE_SIZE); return }
    const rect = el.getBoundingClientRect()
    const containerRect = el.parentElement?.getBoundingClientRect() || rect
    const itemCenter = rect.left - containerRect.left + rect.width / 2
    const dist = Math.abs(mouseX - itemCenter)
    if (dist >= DISTANCE) { setSize(BASE_SIZE); return }
    const t = 1 - dist / DISTANCE
    setSize(BASE_SIZE + (MAX_SIZE - BASE_SIZE) * t * t * (3 - 2 * t))
  }, [mouseX])

  const isActive = active === item.key

  return (
    <div ref={ref} style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}>
      <button onClick={() => onChange(item.key)}
        style={{ width: `${size}px`, height: `${size}px`, borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--neu-border)', cursor: 'pointer', background: isActive ? 'linear-gradient(145deg, var(--neu-surface-deep), var(--neu-surface))' : 'linear-gradient(145deg, var(--neu-surface), var(--neu-surface-deep))', boxShadow: isActive ? 'inset 3px 3px 7px var(--neu-shadow-dark), inset -2px -2px 5px var(--neu-shadow-light)' : '5px 5px 12px var(--neu-shadow-dark), -3px -3px 8px var(--neu-shadow-light), inset 0 1px 0 rgba(255,255,255,0.6)', transition: 'width .14s cubic-bezier(0.34,1.56,0.64,1), height .14s cubic-bezier(0.34,1.56,0.64,1), box-shadow .2s ease', fontSize: `${Math.round(size * 0.4)}px`, lineHeight: 1, padding: 0 }}>
        {item.icon}
      </button>
      {showTooltip && createPortal(
        <div style={{ position: 'fixed', top: (ref.current?.getBoundingClientRect().top || 0) - 38, left: (ref.current?.getBoundingClientRect().left || 0) + (ref.current?.getBoundingClientRect().width || 0) / 2, transform: 'translateX(-50%)', zIndex: 99999, pointerEvents: 'none', animation: 'tooltipFade 0.15s ease both' }}>
          <div style={{ background: 'var(--neu-surface)', boxShadow: '6px 6px 16px var(--neu-shadow-dark), -4px -4px 12px var(--neu-shadow-light), 0 0 0 1px var(--neu-border)', color: 'var(--neu-text-primary)', fontSize: '0.7rem', fontWeight: 500, padding: '0.4rem 0.8rem', borderRadius: '0.6rem', whiteSpace: 'nowrap', position: 'relative' }}>
            {item.label}
            <div style={{ position: 'absolute', bottom: -4, left: '50%', transform: 'translateX(-50%) rotate(45deg)', width: 8, height: 8, background: 'var(--neu-surface)', borderRight: '1px solid var(--neu-border)', borderBottom: '1px solid var(--neu-border)', borderBottomRightRadius: 2 }} />
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

function CategoryDock({ active, onChange }) {
  const allItem = { key: '', icon: '🗂', label: 'All Categories' }
  const items   = [allItem, ...CAT_KEYS.map(k => ({ key: k, icon: CAT[k].icon, label: CAT[k].label }))]
  const [mouseX, setMouseX] = useState(-9999)

  return (
    <div onMouseMove={e => setMouseX(e.clientX - e.currentTarget.getBoundingClientRect().left)} onMouseLeave={() => setMouseX(-9999)}
      style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 14px', background: 'var(--neu-surface)', borderRadius: '2rem', border: '1px solid var(--neu-border)', boxShadow: '6px 6px 14px var(--neu-shadow-dark), -3px -3px 8px var(--neu-shadow-light)', width: 'fit-content' }}>
      {items.map(item => <DockIcon key={item.key} item={item} active={active} onChange={onChange} mouseX={mouseX} />)}
    </div>
  )
}

/* ─── Full Notice View (read-only) ──────────────────── */
function NoticeFullView({ notice, onClose }) {
  const cat = getCat(notice.category)
  const aud = AUD[notice.target_audience] || AUD.all

  return (
    <div className="notice-overlay" onClick={onClose}>
      <div className="notice-full" style={{ '--paper-bg': cat.bg, '--paper-border': cat.border }} onClick={e => e.stopPropagation()}>
        <div className="notice-full-pin"><PushPin color={cat.pin} size={32} /></div>
        <button onClick={onClose} style={{ position:'absolute',top:'.9rem',right:'.9rem',background:'none',border:'none',cursor:'pointer',color:'#666',opacity:.55,transition:'opacity .15s' }}
          onMouseEnter={e=>e.currentTarget.style.opacity='1'} onMouseLeave={e=>e.currentTarget.style.opacity='.55'}>
          <X size={18}/>
        </button>
        <div style={{ display:'flex',alignItems:'center',gap:'.5rem',marginBottom:'1rem',flexWrap:'wrap' }}>
          <span style={{ fontSize:'.72rem',fontWeight:800,padding:'.2rem .7rem',borderRadius:'99px',background:cat.border+'30',color:cat.border,border:`1px solid ${cat.border}60`,fontFamily:"'DM Sans',sans-serif" }}>
            {cat.icon} {cat.label}
          </span>
          <span style={{ fontSize:'.72rem',fontWeight:700,padding:'.2rem .65rem',borderRadius:'99px',background:aud.color+'18',color:aud.color,border:`1px solid ${aud.color}40` }}>
            {aud.label}
          </span>
        </div>
        <h2 style={{ fontSize:'1.15rem',fontWeight:800,color:'#1a1a1a',fontFamily:"'Outfit',sans-serif",marginBottom:'.85rem',lineHeight:1.3 }}>{notice.title}</h2>
        <div style={{ background:`repeating-linear-gradient(transparent,transparent 27px,${cat.border}40 27px,${cat.border}40 28px)`,padding:'.5rem .25rem',borderRadius:'2px',marginBottom:'1rem' }}>
          <p style={{ fontSize:'.85rem',color:'#2a2a2a',lineHeight:'28px',whiteSpace:'pre-wrap',fontFamily:"'DM Sans',sans-serif" }}>{notice.content}</p>
        </div>
        <div style={{ display:'flex',gap:'1rem',flexWrap:'wrap',borderTop:`1px dashed ${cat.border}80`,paddingTop:'.75rem',marginTop:'.5rem' }}>
          <span style={{ fontSize:'.72rem',color:'#666',display:'flex',alignItems:'center',gap:'.3rem' }}>
            <Calendar size={12}/>{new Date(notice.posted_at).toLocaleDateString('en-PK',{day:'2-digit',month:'short',year:'numeric'})}
          </span>
          {notice.expiry_date && (
            <span style={{ fontSize:'.72rem',color:'#ef4444',display:'flex',alignItems:'center',gap:'.3rem' }}>
              <Calendar size={12}/>Expires: {new Date(notice.expiry_date).toLocaleDateString('en-PK',{day:'2-digit',month:'short'})}
            </span>
          )}
          <span style={{ fontSize:'.72rem',color:'#888',display:'flex',alignItems:'center',gap:'.3rem' }}>
            <Eye size={12}/>{notice.views} views
          </span>
        </div>
      </div>
    </div>
  )
}

/* ─── Paper Slip ─────────────────────────────────────── */
function PaperSlip({ notice, onOpen }) {
  const cat     = getCat(notice.category)
  const layout  = noticeLayout(notice.id)
  const hasTape = notice.id % 3 === 0
  const lines   = notice.title.split(' ')
  const preview = lines.slice(0,4).join(' ') + (lines.length > 4 ? '…' : '')

  return (
    <div className="paper-slip" style={{ '--rot':`${layout.rot}deg` }} onClick={() => onOpen(notice)} title="Click to read">
      <div className="pin-wrap"><PushPin color={cat.pin} size={26} /></div>
      <div className={`paper-body${hasTape?' has-tape':''}`} style={{ '--paper-bg':cat.bg, '--paper-border':cat.border }}>
        <div style={{ position:'absolute',top:'10px',right:'10px',width:8,height:8,borderRadius:'50%',background:cat.border,opacity:.7 }}/>
        <div style={{ background:`repeating-linear-gradient(transparent,transparent 17px,${cat.border}35 17px,${cat.border}35 18px)`,padding:'.15rem 0' }}>
          <p style={{ fontSize:'.72rem',fontWeight:800,color:'#1a1a1a',lineHeight:'18px',fontFamily:"'Outfit',sans-serif",wordBreak:'break-word' }}>{preview}</p>
        </div>
        <div style={{ marginTop:10,display:'flex',alignItems:'center',justifyContent:'space-between' }}>
          <span style={{ fontSize:'.58rem',color:'#888',fontFamily:"'DM Sans',sans-serif" }}>
            {new Date(notice.posted_at).toLocaleDateString('en-PK',{day:'2-digit',month:'short'})}
          </span>
          {notice.expiry_date && new Date(notice.expiry_date) < new Date() && (
            <span style={{ fontSize:'.55rem',color:'#ef4444',fontWeight:700 }}>EXPIRED</span>
          )}
          <span style={{ fontSize:'.58rem',color:cat.border,fontWeight:700,fontFamily:"'DM Sans',sans-serif",opacity:.8 }}>
            {AUD[notice.target_audience]?.label.split(' ')[0] || '🌐'}
          </span>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════ */
export default function TeacherNoticesPage() {
  const [notices,    setNotices]    = useState([])
  const [loading,    setLoading]    = useState(true)
  const [filterCat,  setFilterCat]  = useState('')
  const [openNotice, setOpenNotice] = useState(null)
  const [total,      setTotal]      = useState(0)

  const fetchNotices = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await teacherAPI.getNotices(1, filterCat)
      const list = res.data.data?.notices || []
      setNotices(list)
      setTotal(res.data.data?.pagination?.total || list.length)
    } catch { toast.error('Failed to load notices') }
    finally { setLoading(false) }
  }, [filterCat])

  useEffect(() => { fetchNotices() }, [fetchNotices])

  const COLS = 5
  const rows = []
  for (let i = 0; i < notices.length; i += COLS) rows.push(notices.slice(i, i + COLS))

  return (
    <>
      <style>{CSS}</style>
      <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.4rem', paddingBottom: '2rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--neu-text-primary)', fontFamily: 'Outfit,sans-serif', letterSpacing: '-.02em' }}>Notice Board</h1>
            <p style={{ fontSize: '.78rem', color: 'var(--neu-text-ghost)', marginTop: 2 }}>{total} notices · click any slip to read</p>
          </div>
        </div>

        {/* Dock filter */}
        <CategoryDock active={filterCat} onChange={setFilterCat} />

        {/* Cork Board */}
        <div className="corkboard" style={{ padding: '2.5rem 2rem 2rem' }}>
          <div className="corkboard-frame" />
          {[{top:8,left:8},{top:8,right:8},{bottom:8,left:8},{bottom:8,right:8}].map((pos,i) => (
            <div key={i} className="cork-screw" style={pos} />
          ))}

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
              <div style={{ textAlign: 'center' }}>
                <Loader2 size={32} style={{ color: '#b8864a', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
                <p style={{ color: '#8b6340', fontSize: '.82rem', marginTop: '.75rem', fontFamily: "'DM Sans',sans-serif" }}>Loading board…</p>
              </div>
            </div>
          ) : notices.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: '1rem' }}>
              <FileText size={48} style={{ color: '#b8864a', opacity: .35 }} />
              <p style={{ color: '#8b6340', fontWeight: 600, fontFamily: "'DM Sans',sans-serif", fontSize: '.9rem' }}>Board is empty</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
              {rows.map((row, ri) => (
                <div key={ri} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-around', flexWrap: 'wrap' }}>
                  {row.map((notice, ci) => {
                    const r  = seededRand(notice.id * 7 + ri * 3 + ci)
                    const mt = r() * 28
                    return (
                      <div key={notice.id} style={{ marginTop: mt, padding: '0 8px' }}>
                        <PaperSlip notice={notice} onOpen={setOpenNotice} />
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Audience legend */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '.7rem', color: 'var(--neu-text-ghost)', fontWeight: 600 }}>Audience:</span>
          {Object.entries(AUD).map(([k, v]) => (
            <span key={k} style={{ fontSize: '.7rem', fontWeight: 700, color: v.color, display: 'flex', alignItems: 'center', gap: '.3rem' }}>{v.label}</span>
          ))}
        </div>
      </div>

      {openNotice && <NoticeFullView notice={openNotice} onClose={() => setOpenNotice(null)} />}
    </>
  )
}