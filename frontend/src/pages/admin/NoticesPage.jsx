// ═══════════════════════════════════════════════════════════════
//  NoticesPage.jsx  —  frontend/src/pages/admin/NoticesPage.jsx
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect,useRef,  useCallback } from 'react'
import { Plus, X, Edit2, Trash2, Loader2, Eye, FileText, Calendar } from 'lucide-react'
import { createPortal } from 'react-dom'
import AddButton from '../../components/ui/AddButton'
import toast from 'react-hot-toast'
import { adminAPI } from '../../api/admin.api'
import { useContextMenu, ContextMenu } from '../../hooks/useContextMenu'

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

/* ─── Seeded random ─────────────────────────────────── */
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
  // Real-looking thumbtack: circular head + tapered shaft
  const light = color + 'ee'
  const dark  = color
  return (
    <svg
      width={size} height={size * 1.6}
      viewBox="0 0 28 45"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display:'block', filter:'drop-shadow(1px 2px 3px rgba(0,0,0,.55))' }}
    >
      {/* Pin head — circular disc */}
      <defs>
        <radialGradient id={`pg-${color.replace('#','')}`} cx="38%" cy="35%" r="65%">
          <stop offset="0%"   stopColor={light} />
          <stop offset="55%"  stopColor={dark}  />
          <stop offset="100%" stopColor="#00000088" />
        </radialGradient>
        {/* Shine */}
        <radialGradient id={`ps-${color.replace('#','')}`} cx="35%" cy="30%" r="40%">
          <stop offset="0%"   stopColor="rgba(255,255,255,.65)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)"   />
        </radialGradient>
      </defs>

      {/* Outer ring / shadow */}
      <ellipse cx="14" cy="13" rx="12" ry="11.5"
        fill="rgba(0,0,0,.25)" transform="translate(.5 1)" />

      {/* Main head disc */}
      <ellipse cx="14" cy="13" rx="12" ry="11.5"
        fill={`url(#pg-${color.replace('#','')})`} />

      {/* Specular shine */}
      <ellipse cx="14" cy="13" rx="12" ry="11.5"
        fill={`url(#ps-${color.replace('#','')})`} />

      {/* Needle / shaft */}
      <path
        d="M13.2 23 L14 44 L14.8 23 Z"
        fill="url(#needle)"
        stroke="rgba(0,0,0,.3)" strokeWidth=".3"
      />
      <defs>
        <linearGradient id="needle" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#c0c0c0" />
          <stop offset="40%"  stopColor="#e8e8e8" />
          <stop offset="100%" stopColor="#888" />
        </linearGradient>
      </defs>

      {/* Center dimple */}
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
  @keyframes neu-slide-up { from{opacity:0;transform:translateY(20px) scale(.97)} to{opacity:1;transform:none} }
  @keyframes pulse        { 0%,100%{opacity:1} 50%{opacity:.5} }

  @keyframes tooltipFade {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

  /* ── Dock container ── */
  .cat-dock {
    display: flex;
    align-items: flex-end;
    gap: 6px;
    padding: 10px 16px 10px;
    background: var(--neu-surface);
    border-radius: 1.1rem;
    border: 1px solid var(--neu-border);
    box-shadow: 6px 6px 14px var(--neu-shadow-dark), -3px -3px 8px var(--neu-shadow-light);
    width: fit-content;
    position: relative;
  }

  /* ── Each dock item ── */
  .dock-item {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
    transition: transform .22s cubic-bezier(.34,1.56,.64,1);
  }

  /* Magnify on hover — neighbours also scale slightly (JS-free approximation) */
  .dock-item:hover {
    transform: translateY(-10px) scale(1.55);
    z-index: 10;
  }
  .dock-item:hover + .dock-item,
  .dock-item:has(+ .dock-item:hover) {
    transform: translateY(-5px) scale(1.25);
    z-index: 9;
  }

  .dock-icon {
    width: 40px; height: 40px;
    border-radius: .75rem;
    display: flex; align-items: center; justify-content: center;
    font-size: 1.3rem;
    transition: box-shadow .2s ease;
    box-shadow: 3px 3px 8px var(--neu-shadow-dark), -2px -2px 5px var(--neu-shadow-light);
    border: 1.5px solid transparent;
    position: relative;
  }
  .dock-item.active .dock-icon {
    box-shadow: 0 0 0 2px var(--active-color), 3px 3px 8px var(--neu-shadow-dark);
  }
  /* Active dot */
  .dock-item.active::after {
    content: '';
    position: absolute;
    bottom: -6px;
    left: 50%; transform: translateX(-50%);
    width: 5px; height: 5px;
    border-radius: 50%;
    background: var(--active-color);
    box-shadow: 0 0 6px var(--active-color);
  }

  /* Tooltip */
  .dock-tooltip {
    position: absolute;
    bottom: calc(100% + 14px);
    left: 50%; transform: translateX(-50%);
    background: rgba(15,15,20,.92);
    color: #fff;
    font-size: .68rem;
    font-weight: 700;
    font-family: 'DM Sans', sans-serif;
    padding: .3rem .65rem;
    border-radius: .5rem;
    white-space: nowrap;
    pointer-events: none;
    opacity: 0;
    transition: opacity .15s ease;
    z-index: 20;
    box-shadow: 0 4px 12px rgba(0,0,0,.4);
  }
  .dock-tooltip::after {
    content: '';
    position: absolute;
    top: 100%; left: 50%; transform: translateX(-50%);
    border: 5px solid transparent;
    border-top-color: rgba(15,15,20,.92);
  }
  .dock-item:hover .dock-tooltip { opacity: 1; }

  /* ── Cork board ── */
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

  /* ── Paper slip — NO bounce animation on pin ── */
  .paper-slip {
    position: relative;
    cursor: pointer;
    transform: rotate(var(--rot));
    animation: paperIn .4s cubic-bezier(.34,1.56,.64,1) both;
    filter: drop-shadow(3px 5px 8px rgba(0,0,0,.35));
    z-index: 1;
    transition: transform .25s cubic-bezier(.34,1.56,.64,1),
                filter .25s ease;
  }
  .paper-slip:hover {
    transform: rotate(0deg) scale(1.05) translateY(-4px);
    filter: drop-shadow(5px 10px 20px rgba(0,0,0,.45));
    z-index: 10;
  }
  /* pin stays perfectly still — no hover effect on pin itself */
  .pin-wrap {
    position: absolute;
    top: -14px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 3;
    pointer-events: none;
  }

  .paper-body {
    background: var(--paper-bg);
    border: 1.5px solid var(--paper-border);
    border-radius: 3px;
    padding: 22px 14px 14px;
    width: 155px;
    min-height: 130px;
    position: relative;
    overflow: hidden;
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
    background: rgba(255,255,200,.55);
    border: 1px solid rgba(200,180,100,.4);
  }

  /* ── Full paper overlay ── */
  .notice-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,.65);
    backdrop-filter: blur(6px);
    z-index: 999;
    display: flex; align-items: center; justify-content: center;
    padding: 1rem;
    animation: overlayIn .2s ease both;
  }
  .notice-full {
    background: var(--paper-bg, #fef9c3);
    border: 2px solid var(--paper-border, #fbbf24);
    border-radius: 4px;
    padding: 2.5rem 2rem 2rem;
    max-width: 520px; width: 100%;
    max-height: 85vh; overflow-y: auto;
    position: relative;
    box-shadow: 8px 16px 48px rgba(0,0,0,.55);
    animation: modalIn .3s cubic-bezier(.34,1.56,.64,1) both;
  }
  .notice-full-pin {
    position: absolute;
    top: -14px; left: 50%;
    transform: translateX(-50%);
    pointer-events: none;
  }
`

/* ─── Input style ───────────────────────────────────── */
const iS = {
  width:'100%', padding:'.5rem .75rem', borderRadius:'.75rem', border:'none',
  background:'var(--neu-surface-deep)',
  boxShadow:'inset 2px 2px 6px var(--neu-shadow-dark), inset -1px -1px 4px var(--neu-shadow-light)',
  color:'var(--neu-text-primary)', fontSize:'.84rem', outline:'none',
  fontFamily:"'DM Sans',sans-serif", boxSizing:'border-box',
}

/* ─── Modal shell ───────────────────────────────────── */
function Modal({ children, maxW=520 }) {
  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(8,12,20,.7)',backdropFilter:'blur(10px)',zIndex:50,display:'flex',alignItems:'center',justifyContent:'center',padding:'1rem' }}>
      <div style={{ width:'100%',maxWidth:maxW,background:'var(--neu-surface)',boxShadow:'14px 14px 36px var(--neu-shadow-dark),-6px -6px 20px var(--neu-shadow-light)',border:'1px solid var(--neu-border)',borderRadius:'1.5rem',maxHeight:'90vh',display:'flex',flexDirection:'column',overflow:'hidden',animation:'neu-slide-up .2s cubic-bezier(.34,1.56,.64,1) both' }}>
        {children}
      </div>
    </div>
  )
}
function F({ label, children }) {
  return (
    <div style={{ display:'flex',flexDirection:'column',gap:'.3rem' }}>
      <label style={{ fontSize:'.72rem',fontWeight:700,color:'var(--neu-text-secondary)',textTransform:'uppercase',letterSpacing:'.04em' }}>{label}</label>
      {children}
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   DOCK CATEGORY FILTER
   Sidebar-style horizontal dock with magnify + tooltip
═══════════════════════════════════════════════════ */

function CategoryDock({ active, onChange }) {
  const allItem = { key:'', icon:'🗂', label:'All Categories' }
  const items   = [
    allItem,
    ...CAT_KEYS.map(k => ({ key:k, icon:CAT[k].icon, label:CAT[k].label })),
  ]

  const [mouseX, setMouseX] = useState(-9999)
  const onMove = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setMouseX(e.clientX - rect.left)
  }, [])
  const onLeave = useCallback(() => setMouseX(-9999), [])

  return (
    <div 
      className="premium-dock"
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '10px 14px',
        background: 'var(--neu-surface)',
        borderRadius: '2rem',
        border: '1px solid var(--neu-border)',
        boxShadow: '6px 6px 14px var(--neu-shadow-dark), -3px -3px 8px var(--neu-shadow-light)',
        width: 'fit-content',
        position: 'relative',
      }}
    >
      {items.map(item => (
        <DockIcon
          key={item.key}
          item={item}
          active={active}
          onChange={onChange}
          mouseX={mouseX}
        />
      ))}
    </div>
  )
}

// Individual dock icon with magnification effect
function DockIcon({ item, active, onChange, mouseX }) {
  const ref = useRef(null)
  const BASE_SIZE = 40
  const MAX_SIZE = 56
  const DISTANCE = 80

  const [size, setSize] = useState(BASE_SIZE)
  const [showTooltip, setShowTooltip] = useState(false)

  // Magnification effect based on mouse position
  useEffect(() => {
    const el = ref.current
    if (!el || mouseX === -9999) {
      setSize(BASE_SIZE)
      return
    }
    
    const rect = el.getBoundingClientRect()
    const containerRect = el.parentElement?.getBoundingClientRect() || rect
    const itemCenter = rect.left - containerRect.left + rect.width / 2
    const dist = Math.abs(mouseX - itemCenter)
    
    if (dist >= DISTANCE) {
      setSize(BASE_SIZE)
      return
    }
    
    const t = 1 - dist / DISTANCE
    const eased = t * t * (3 - 2 * t) // smoothstep
    setSize(BASE_SIZE + (MAX_SIZE - BASE_SIZE) * eased)
  }, [mouseX])

  const isActive = active === item.key

  return (
    <div
      ref={ref}
      style={{
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
      }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <button
        onClick={() => onChange(item.key)}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: 'none',
          cursor: 'pointer',
          background: isActive
            ? 'linear-gradient(145deg, var(--neu-surface-deep), var(--neu-surface))'
            : 'linear-gradient(145deg, var(--neu-surface), var(--neu-surface-deep))',
          boxShadow: isActive
            ? `inset 3px 3px 7px var(--neu-shadow-dark), inset -2px -2px 5px var(--neu-shadow-light)`
            : `5px 5px 12px var(--neu-shadow-dark), -3px -3px 8px var(--neu-shadow-light), inset 0 1px 0 rgba(255,255,255,0.6)`,
          border: `1px solid var(--neu-border)`,
          color: isActive ? 'var(--neu-text-primary)' : 'var(--neu-text-muted)',
          transition: [
            'width 0.14s cubic-bezier(0.34,1.56,0.64,1)',
            'height 0.14s cubic-bezier(0.34,1.56,0.64,1)',
            'border-radius 0.14s ease',
            'box-shadow 0.2s ease',
            'background 0.2s ease',
            'color 0.2s ease',
          ].join(', '),
          fontFamily: "'DM Sans', sans-serif",
          fontSize: `${Math.round(size * 0.4)}px`,
          lineHeight: 1,
          padding: 0,
        }}
      >
        {item.icon}
      </button>

      {/* Premium tooltip - subtle & clean */}
      {showTooltip && createPortal(
        <div
          style={{
            position: 'fixed',
            top: ref.current?.getBoundingClientRect().top - 38,
            left: ref.current?.getBoundingClientRect().left + ref.current?.getBoundingClientRect().width / 2,
            transform: 'translateX(-50%)',
            zIndex: 99999,
            pointerEvents: 'none',
            animation: 'tooltipFade 0.15s ease both',
          }}
        >
          <div style={{
            background: 'var(--neu-surface)',
            boxShadow: '6px 6px 16px var(--neu-shadow-dark), -4px -4px 12px var(--neu-shadow-light), 0 0 0 1px var(--neu-border)',
            color: 'var(--neu-text-primary)',
            fontSize: '0.7rem',
            fontWeight: 500,
            padding: '0.4rem 0.8rem',
            borderRadius: '0.6rem',
            whiteSpace: 'nowrap',
            letterSpacing: '0.02em',
            fontFamily: "'DM Sans', sans-serif",
            position: 'relative',
          }}>
            {item.label}
            {/* Arrow */}
            <div style={{
              position: 'absolute',
              bottom: -4,
              left: '50%',
              transform: 'translateX(-50%) rotate(45deg)',
              width: '8px',
              height: '8px',
              background: 'var(--neu-surface)',
              borderRight: '1px solid var(--neu-border)',
              borderBottom: '1px solid var(--neu-border)',
              borderBottomRightRadius: '2px',
            }} />
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   FULL NOTICE OVERLAY  +  right-click inside it
═══════════════════════════════════════════════════ */
function NoticeFullView({ notice, onClose, onEdit, onDelete }) {
  const cat = getCat(notice.category)
  const aud = AUD[notice.target_audience] || AUD.all

  /* Internal context menu state for the open notice */
  const [ctxPos, setCtxPos] = useState(null)   // {x, y} | null

  const handleContextMenu = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const x = Math.min(e.clientX, window.innerWidth  - 180)
    const y = Math.min(e.clientY, window.innerHeight - 120)
    setCtxPos({ x, y })
  }

  /* Close ctx menu on any click */
  useEffect(() => {
    if (!ctxPos) return
    const close = () => setCtxPos(null)
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [ctxPos])

  return (
    <div className="notice-overlay" onClick={onClose}>
      <div
        className="notice-full"
        style={{ '--paper-bg': cat.bg, '--paper-border': cat.border }}
        onClick={e => e.stopPropagation()}
        onContextMenu={handleContextMenu}
      >
        {/* Realistic pin on top of open notice */}
        <div className="notice-full-pin">
          <PushPin color={cat.pin} size={32} />
        </div>

        {/* Close button */}
        <button onClick={onClose} style={{ position:'absolute',top:'.9rem',right:'.9rem',background:'none',border:'none',cursor:'pointer',color:'#666',opacity:.55,transition:'opacity .15s' }}
          onMouseEnter={e=>e.currentTarget.style.opacity='1'}
          onMouseLeave={e=>e.currentTarget.style.opacity='.55'}
        >
          <X size={18}/>
        </button>

        {/* Badges */}
        <div style={{ display:'flex',alignItems:'center',gap:'.5rem',marginBottom:'1rem',flexWrap:'wrap' }}>
          <span style={{ fontSize:'.72rem',fontWeight:800,padding:'.2rem .7rem',borderRadius:'99px',background:cat.border+'30',color:cat.border,border:`1px solid ${cat.border}60`,fontFamily:"'DM Sans',sans-serif" }}>
            {cat.icon} {cat.label}
          </span>
          <span style={{ fontSize:'.72rem',fontWeight:700,padding:'.2rem .65rem',borderRadius:'99px',background:aud.color+'18',color:aud.color,border:`1px solid ${aud.color}40` }}>
            {aud.label}
          </span>
        </div>

        {/* Title */}
        <h2 style={{ fontSize:'1.15rem',fontWeight:800,color:'#1a1a1a',fontFamily:"'Outfit',sans-serif",marginBottom:'.85rem',lineHeight:1.3 }}>
          {notice.title}
        </h2>

        {/* Ruled lines content */}
        <div style={{ background:`repeating-linear-gradient(transparent,transparent 27px,${cat.border}40 27px,${cat.border}40 28px)`,padding:'.5rem .25rem',borderRadius:'2px',marginBottom:'1rem' }}>
          <p style={{ fontSize:'.85rem',color:'#2a2a2a',lineHeight:'28px',whiteSpace:'pre-wrap',fontFamily:"'DM Sans',sans-serif" }}>
            {notice.content}
          </p>
        </div>

        {/* Meta footer */}
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
          <span style={{ fontSize:'.7rem',color:'#aaa',marginLeft:'auto' }}>Right-click for options</span>
        </div>

        {/* ── Inline context menu inside full view ── */}
        {ctxPos && createPortal(
          <div
            onClick={e=>e.stopPropagation()}
            style={{ position:'fixed',top:ctxPos.y,left:ctxPos.x,zIndex:99999,minWidth:160,background:'var(--neu-surface)',boxShadow:'8px 8px 24px var(--neu-shadow-dark),-4px -4px 12px var(--neu-shadow-light),0 0 0 1px var(--neu-border)',borderRadius:'.875rem',padding:'.35rem',animation:'neu-slide-up .12s cubic-bezier(.34,1.56,.64,1) both' }}
          >
            {[
              { label:'Edit',   icon:Edit2,  color:'var(--neu-text-secondary)', hoverBg:'var(--neu-surface-deep)', action:()=>{ setCtxPos(null); onClose(); onEdit(notice) } },
              null,
              { label:'Remove', icon:Trash2, color:'var(--neu-danger,#ef4444)',  hoverBg:'rgba(239,68,68,.1)',      action:()=>{ setCtxPos(null); onClose(); onDelete(notice) } },
            ].map((item,i) => item===null ? (
              <div key={i} style={{ height:1,background:'var(--neu-border)',margin:'.3rem .4rem' }}/>
            ) : (
              <button key={i}
                onClick={item.action}
                style={{ width:'100%',display:'flex',alignItems:'center',gap:'.6rem',padding:'.5rem .75rem',borderRadius:'.6rem',border:'none',background:'none',cursor:'pointer',color:item.color,fontSize:'.8rem',fontWeight:600,fontFamily:"'DM Sans',sans-serif",textAlign:'left',transition:'background .12s,color .12s' }}
                onMouseEnter={e=>{ e.currentTarget.style.background=item.hoverBg; e.currentTarget.style.color=item.color }}
                onMouseLeave={e=>{ e.currentTarget.style.background='none' }}
              >
                <item.icon size={14}/>{item.label}
              </button>
            ))}
          </div>,
          document.body
        )}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   PAPER SLIP
═══════════════════════════════════════════════════ */
function PaperSlip({ notice, onOpen, onContextMenu }) {
  const cat     = getCat(notice.category)
  const layout  = noticeLayout(notice.id)
  const hasTape = notice.id % 3 === 0

  const lines   = notice.title.split(' ')
  const preview = lines.slice(0,4).join(' ') + (lines.length>4?'…':'')

  return (
    <div
      className="paper-slip"
      style={{ '--rot':`${layout.rot}deg` }}
      onClick={()=>onOpen(notice)}
      onContextMenu={e=>onContextMenu(e,notice)}
      title="Click to read • Right-click to manage"
    >
      {/* Realistic SVG pin — static, no animation */}
      <div className="pin-wrap">
        <PushPin color={cat.pin} size={26}/>
      </div>

      {/* Paper body */}
      <div className={`paper-body${hasTape?' has-tape':''}`}
        style={{ '--paper-bg':cat.bg, '--paper-border':cat.border }}>

        {/* Category dot */}
        <div style={{ position:'absolute',top:'10px',right:'10px',width:8,height:8,borderRadius:'50%',background:cat.border,opacity:.7 }}/>

        {/* Ruled lines + title */}
        <div style={{ background:`repeating-linear-gradient(transparent,transparent 17px,${cat.border}35 17px,${cat.border}35 18px)`,padding:'.15rem 0' }}>
          <p style={{ fontSize:'.72rem',fontWeight:800,color:'#1a1a1a',lineHeight:'18px',fontFamily:"'Outfit',sans-serif",wordBreak:'break-word' }}>
            {preview}
          </p>
        </div>

        {/* Bottom strip */}
        <div style={{ marginTop:10,display:'flex',alignItems:'center',justifyContent:'space-between' }}>
          <span style={{ fontSize:'.58rem',color:'#888',fontFamily:"'DM Sans',sans-serif" }}>
            {new Date(notice.posted_at).toLocaleDateString('en-PK',{day:'2-digit',month:'short'})}
          </span>
          {notice.expiry_date && new Date(notice.expiry_date) < new Date() && (
            <span style={{ fontSize:'.55rem',color:'#ef4444',fontWeight:700 }}>EXPIRED</span>
          )}
          <span style={{ fontSize:'.58rem',color:cat.border,fontWeight:700,fontFamily:"'DM Sans',sans-serif",opacity:.8 }}>
            {AUD[notice.target_audience]?.label.split(' ')[0]||'🌐'}
          </span>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   NOTICE MODAL (Create / Edit)
═══════════════════════════════════════════════════ */
function NoticeModal({ notice, onClose, onSuccess }) {
  const isEdit = !!notice?.id
  const [form, setForm] = useState({
    title:           notice?.title           || '',
    content:         notice?.content         || '',
    category:        notice?.category        || 'General',
    target_audience: notice?.target_audience || 'all',
    expiry_date:     notice?.expiry_date ? String(notice.expiry_date).split('T')[0] : '',
    is_public:       notice?.is_public       ?? true,
  })
  const [loading, setLoading] = useState(false)
  const set = (k,v) => setForm(p=>({...p,[k]:v}))

  const submit = async () => {
    if (!form.title.trim()||!form.content.trim()) { toast.error('Title and content required'); return }
    setLoading(true)
    try {
      const payload = { ...form, expiry_date: form.expiry_date||null }
      if (isEdit) { await adminAPI.updateNotice(notice.id,payload); toast.success('Notice updated') }
      else        { await adminAPI.createNotice(payload);           toast.success('Notice published!') }
      onSuccess(); onClose()
    } catch(e) { toast.error(e.response?.data?.message||'Failed') }
    finally { setLoading(false) }
  }

  const cat = getCat(form.category)

  return (
    <Modal maxW={540}>
      <div style={{ padding:'1.4rem 1.5rem',borderBottom:'1px solid var(--neu-border)',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
        <div style={{ display:'flex',alignItems:'center',gap:'.65rem' }}>
          <div style={{ width:34,height:34,borderRadius:'.65rem',background:`${cat.border}22`,display:'flex',alignItems:'center',justifyContent:'center' }}>
            <FileText size={15} style={{ color:cat.border }}/>
          </div>
          <h2 style={{ fontSize:'1rem',fontWeight:700,color:'var(--neu-text-primary)',fontFamily:'Outfit,sans-serif' }}>
            {isEdit?'Edit Notice':'Publish Notice'}
          </h2>
        </div>
        <button onClick={onClose} style={{ background:'none',border:'none',cursor:'pointer',color:'var(--neu-text-ghost)' }}><X size={18}/></button>
      </div>

      <div style={{ padding:'1.2rem 1.5rem',display:'flex',flexDirection:'column',gap:'.85rem',overflowY:'auto',flex:1 }}>
        <F label="Title *">
          <input style={iS} value={form.title} onChange={e=>set('title',e.target.value)} placeholder="Notice title…" autoFocus/>
        </F>
        <F label="Content *">
          <textarea style={{ ...iS,resize:'vertical',minHeight:120,lineHeight:1.6 }} value={form.content} onChange={e=>set('content',e.target.value)} placeholder="Write notice content…"/>
        </F>
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'.8rem' }}>
          <F label="Category">
            <select style={iS} value={form.category} onChange={e=>set('category',e.target.value)}>
              {CAT_KEYS.map(k=><option key={k} value={k}>{CAT[k].icon} {CAT[k].label}</option>)}
            </select>
          </F>
          <F label="Audience">
            <select style={iS} value={form.target_audience} onChange={e=>set('target_audience',e.target.value)}>
              <option value="all">🌐 Everyone</option>
              <option value="students">🎓 Students Only</option>
              <option value="teachers">👨‍🏫 Teachers Only</option>
              <option value="staff">🏛 Staff Only</option>
            </select>
          </F>
        </div>
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'.8rem' }}>
          <F label="Expiry Date (optional)">
            <input style={iS} type="date" value={form.expiry_date} onChange={e=>set('expiry_date',e.target.value)}/>
          </F>
          <F label="Visibility">
            <select style={iS} value={form.is_public} onChange={e=>set('is_public',e.target.value==='true')}>
              <option value="true">👁 Public</option>
              <option value="false">🔒 Private</option>
            </select>
          </F>
        </div>
        {/* Live preview */}
        <div style={{ padding:'.75rem 1rem',borderRadius:'.75rem',background:cat.bg,border:`1.5px solid ${cat.border}` }}>
          <p style={{ fontSize:'.7rem',fontWeight:700,color:cat.border,textTransform:'uppercase',letterSpacing:'.06em',marginBottom:'.3rem' }}>Preview</p>
          <p style={{ fontSize:'.8rem',fontWeight:700,color:'#1a1a1a',fontFamily:"'Outfit',sans-serif" }}>{form.title||'Notice title…'}</p>
          <p style={{ fontSize:'.72rem',color:'#555',marginTop:'.2rem' }}>{AUD[form.target_audience]?.label} · {cat.icon} {cat.label}</p>
        </div>
      </div>

      <div style={{ padding:'.9rem 1.5rem',borderTop:'1px solid var(--neu-border)',display:'flex',gap:'.6rem' }}>
        <button onClick={onClose} style={{ ...iS,cursor:'pointer',textAlign:'center',fontWeight:600,color:'var(--neu-text-secondary)',flex:1,padding:'.6rem' }}>Cancel</button>
        <button onClick={submit} disabled={loading} style={{ flex:1,padding:'.6rem',borderRadius:'.75rem',border:'none',background:`linear-gradient(145deg,${cat.border},${cat.border}cc)`,color:'#fff',fontWeight:700,fontSize:'.85rem',cursor:loading?'not-allowed':'pointer',opacity:loading?.7:1,display:'flex',alignItems:'center',justifyContent:'center',gap:'.4rem',fontFamily:"'DM Sans',sans-serif",boxShadow:`0 4px 14px ${cat.border}50` }}>
          {loading&&<Loader2 size={14} style={{ animation:'spin 1s linear infinite' }}/>}
          {isEdit?'Save Changes':'Pin to Board'}
        </button>
      </div>
    </Modal>
  )
}

/* ─── Delete Modal ───────────────────────────────── */
function DeleteModal({ notice, onClose, onConfirm, loading }) {
  return (
    <Modal maxW={400}>
      <div style={{ padding:'1.75rem',textAlign:'center' }}>
        <div style={{ width:52,height:52,borderRadius:'1rem',background:'rgba(239,68,68,.1)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto .9rem' }}>
          <Trash2 size={22} style={{ color:'#ef4444' }}/>
        </div>
        <h3 style={{ fontSize:'1rem',fontWeight:700,color:'var(--neu-text-primary)',fontFamily:'Outfit,sans-serif',marginBottom:'.4rem' }}>Remove Notice?</h3>
        <p style={{ fontSize:'.82rem',color:'var(--neu-text-secondary)',marginBottom:'1.4rem' }}>"<strong>{notice.title}</strong>" board se hata di jaegi.</p>
        <div style={{ display:'flex',gap:'.6rem' }}>
          <button onClick={onClose} style={{ ...iS,cursor:'pointer',textAlign:'center',fontWeight:600,color:'var(--neu-text-secondary)',flex:1,padding:'.6rem' }}>Cancel</button>
          <button onClick={onConfirm} disabled={loading} style={{ flex:1,padding:'.6rem',borderRadius:'.75rem',border:'none',background:'linear-gradient(145deg,#ef4444,#dc2626)',color:'#fff',fontWeight:700,fontSize:'.85rem',cursor:loading?'not-allowed':'pointer',opacity:loading?.7:1,fontFamily:"'DM Sans',sans-serif" }}>
            {loading?'Removing…':'Remove'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

/* ═══════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════ */
export default function NoticesPage() {
  const [notices,      setNotices]      = useState([])
  const [loading,      setLoading]      = useState(true)
  const [filterCat,    setFilterCat]    = useState('')
  const [openNotice,   setOpenNotice]   = useState(null)
  const [editTarget,   setEditTarget]   = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting,     setDeleting]     = useState(false)
  const [showNew,      setShowNew]      = useState(false)
  const [total,        setTotal]        = useState(0)

  const { menu, open: openMenu, close: closeMenu } = useContextMenu()

  const fetchNotices = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await adminAPI.getNotices(1, filterCat)
      const list = res.data.data?.notices || []
      setNotices(list)
      setTotal(res.data.data?.pagination?.total || list.length)
    } catch { toast.error('Failed to load notices') }
    finally { setLoading(false) }
  }, [filterCat])

  useEffect(() => { fetchNotices() }, [fetchNotices])

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await adminAPI.deleteNotice(deleteTarget.id)
      toast.success('Notice removed')
      setDeleteTarget(null)
      fetchNotices()
    } catch { toast.error('Failed to delete') }
    finally { setDeleting(false) }
  }

  /* Board right-click items */
  const ctxItems = [
    { label:'View Details', icon:Eye,    onClick:(n)=>setOpenNotice(n)   },
    { label:'Edit',         icon:Edit2,  onClick:(n)=>setEditTarget(n)   },
    { divider:true },
    { label:'Remove',       icon:Trash2, onClick:(n)=>setDeleteTarget(n), danger:true },
  ]

  /* Rows for board */
  const COLS = 5
  const rows = []
  for (let i=0; i<notices.length; i+=COLS) rows.push(notices.slice(i,i+COLS))

  return (
    <>
      <style>{CSS}</style>
      <div style={{ maxWidth:960,margin:'0 auto',display:'flex',flexDirection:'column',gap:'1.4rem',paddingBottom:'2rem' }}>

        {/* Header */}
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between' }}>
          <div>
            <h1 style={{ fontSize:'1.45rem',fontWeight:800,color:'var(--neu-text-primary)',fontFamily:'Outfit,sans-serif',letterSpacing:'-.02em' }}>Notice Board</h1>
            <p style={{ fontSize:'.78rem',color:'var(--neu-text-ghost)',marginTop:2 }}>
              {total} notices 
            </p>
          </div>
          <AddButton onClick={()=>setShowNew(true)} />
        </div>

        {/* ── Dock filter ── */}
        <CategoryDock active={filterCat} onChange={setFilterCat} />

        {/* ── Cork Board ── */}
        <div className="corkboard" style={{ padding:'2.5rem 2rem 2rem' }}>
          <div className="corkboard-frame"/>
          {[{top:8,left:8},{top:8,right:8},{bottom:8,left:8},{bottom:8,right:8}].map((pos,i)=>(
            <div key={i} className="cork-screw" style={pos}/>
          ))}

          {loading ? (
            <div style={{ display:'flex',justifyContent:'center',alignItems:'center',minHeight:300 }}>
              <div style={{ textAlign:'center' }}>
                <Loader2 size={32} style={{ color:'#b8864a',animation:'spin 1s linear infinite',margin:'0 auto' }}/>
                <p style={{ color:'#8b6340',fontSize:'.82rem',marginTop:'.75rem',fontFamily:"'DM Sans',sans-serif" }}>Loading board…</p>
              </div>
            </div>
          ) : notices.length === 0 ? (
            <div style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:300,gap:'1rem' }}>
              <FileText size={48} style={{ color:'#b8864a',opacity:.35 }}/>
              <p style={{ color:'#8b6340',fontWeight:600,fontFamily:"'DM Sans',sans-serif",fontSize:'.9rem' }}>Board is empty</p>
              <button onClick={()=>setShowNew(true)} style={{ padding:'.5rem 1.25rem',borderRadius:'.8rem',border:'2px dashed #b8864a',background:'rgba(184,134,74,.12)',color:'#8b6340',fontWeight:700,fontSize:'.8rem',cursor:'pointer',fontFamily:"'DM Sans',sans-serif" }}>
                + Pin first notice
              </button>
            </div>
          ) : (
            <div style={{ display:'flex',flexDirection:'column',gap:'3rem' }}>
              {rows.map((row,ri)=>(
                <div key={ri} style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-around',flexWrap:'wrap' }}>
                  {row.map((notice,ci)=>{
                    const r  = seededRand(notice.id*7+ri*3+ci)
                    const mt = r()*28
                    return (
                      <div key={notice.id} style={{ marginTop:mt,padding:'0 8px' }}>
                        <PaperSlip
                          notice={notice}
                          onOpen={setOpenNotice}
                          onContextMenu={openMenu}
                        />
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Audience legend */}
        <div style={{ display:'flex',gap:'1rem',flexWrap:'wrap',alignItems:'center' }}>
          <span style={{ fontSize:'.7rem',color:'var(--neu-text-ghost)',fontWeight:600 }}>Audience:</span>
          {Object.entries(AUD).map(([k,v])=>(
            <span key={k} style={{ fontSize:'.7rem',fontWeight:700,color:v.color,display:'flex',alignItems:'center',gap:'.3rem' }}>{v.label}</span>
          ))}
        </div>

      </div>

      {/* Full notice view — passes edit/delete callbacks for in-notice right-click */}
      {openNotice && (
        <NoticeFullView
          notice={openNotice}
          onClose={()=>setOpenNotice(null)}
          onEdit={(n)=>setEditTarget(n)}
          onDelete={(n)=>setDeleteTarget(n)}
        />
      )}

      {/* Modals */}
      {showNew      && <NoticeModal notice={null}       onClose={()=>setShowNew(false)}   onSuccess={fetchNotices}/>}
      {editTarget   && <NoticeModal notice={editTarget} onClose={()=>setEditTarget(null)} onSuccess={fetchNotices}/>}
      {deleteTarget && <DeleteModal notice={deleteTarget} onClose={()=>setDeleteTarget(null)} onConfirm={handleDelete} loading={deleting}/>}

      {/* Board context menu */}
      <ContextMenu menu={menu} items={ctxItems} close={closeMenu}/>
    </>
  )
}