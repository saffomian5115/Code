// ═══════════════════════════════════════════════════════════════════════
//  GateAttendancePage.jsx — frontend/src/pages/admin/GateAttendancePage.jsx
//  Full kiosk redesign: dark neumorphic, direction toggle, session stats,
//  manual ID lookup, ambient scan ring, toast log (max 8)
// ═══════════════════════════════════════════════════════════════════════
import { useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  ScanFace, LogIn, LogOut, Maximize2, Minimize2,
  CheckCircle2, XCircle, Search, Shield, Camera,
  Users, Clock, RefreshCw, ArrowLeft, Wifi, WifiOff,
  AlertTriangle, UserCheck,
} from "lucide-react";
import { FaceDetection } from "@mediapipe/face_detection";
import { adminAPI } from "../../api/admin.api";

const BASE_URL        = "http://127.0.0.1:8000";
const SCAN_COOLDOWN   = 3000;   // ms between scans
const SUCCESS_SHOW_MS = 2200;   // overlay duration
const MAX_LOG         = 8;      // max sidebar log entries

/* ─── CSS ─────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=JetBrains+Mono:wght@400;700&display=swap');

  :root {
    --kg-bg:        #0d1117;
    --kg-surface:   #161c26;
    --kg-surface2:  #1c2333;
    --kg-border:    rgba(255,255,255,.07);
    --kg-shadow-d:  rgba(0,0,0,.55);
    --kg-shadow-l:  rgba(255,255,255,.04);
    --kg-text:      #e2e8f0;
    --kg-muted:     #64748b;
    --kg-ghost:     #334155;
    --kg-green:     #22d3a5;
    --kg-green2:    #15a87e;
    --kg-red:       #f87171;
    --kg-blue:      #60a5fa;
    --kg-amber:     #fbbf24;
  }

  .kg-root * { box-sizing: border-box; font-family: 'Outfit', sans-serif; }
  .kg-root { background: var(--kg-bg); color: var(--kg-text); }

  /* Neumorphic dark card */
  .neu-card {
    background: var(--kg-surface);
    border: 1px solid var(--kg-border);
    border-radius: 1.25rem;
    box-shadow: 8px 8px 20px var(--kg-shadow-d), -2px -2px 8px var(--kg-shadow-l);
  }

  /* Inset (pressed) card */
  .neu-inset {
    background: var(--kg-bg);
    border: 1px solid var(--kg-border);
    border-radius: .9rem;
    box-shadow: inset 4px 4px 10px var(--kg-shadow-d), inset -1px -1px 4px var(--kg-shadow-l);
  }

  /* Scan ring animation */
  @keyframes ring-pulse {
    0%   { transform: scale(1);   opacity: .7; }
    50%  { transform: scale(1.04); opacity: 1;  }
    100% { transform: scale(1);   opacity: .7; }
  }
  @keyframes ring-scan {
    0%   { box-shadow: 0 0 0 0 rgba(34,211,165,.5),  0 0 0 0 rgba(34,211,165,.3); }
    70%  { box-shadow: 0 0 0 14px rgba(34,211,165,0), 0 0 0 28px rgba(34,211,165,0); }
    100% { box-shadow: 0 0 0 0 rgba(34,211,165,0),   0 0 0 0 rgba(34,211,165,0); }
  }
  @keyframes ring-fail {
    0%   { box-shadow: 0 0 0 0 rgba(248,113,113,.6); }
    70%  { box-shadow: 0 0 0 20px rgba(248,113,113,0); }
    100% { box-shadow: 0 0 0 0 rgba(248,113,113,0); }
  }
  @keyframes success-pop {
    0%   { transform: scale(.85); opacity: 0; }
    60%  { transform: scale(1.04); }
    100% { transform: scale(1);   opacity: 1; }
  }
  @keyframes slide-up {
    from { transform: translateY(8px); opacity: 0; }
    to   { transform: translateY(0);   opacity: 1; }
  }
  @keyframes fade-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  .scan-ring-scanning {
    animation: ring-pulse 2s ease-in-out infinite, ring-scan 2s ease-out infinite;
    border: 2.5px solid var(--kg-green) !important;
  }
  .scan-ring-fail {
    animation: ring-fail 0.6s ease-out !important;
    border: 2.5px solid var(--kg-red) !important;
  }
  .scan-ring-success {
    border: 2.5px solid var(--kg-green) !important;
    box-shadow: 0 0 28px rgba(34,211,165,.4) !important;
  }
  .scan-ring-loading {
    border: 2.5px solid var(--kg-ghost) !important;
  }

  .dir-btn {
    display: flex; align-items: center; justify-content: center; gap: .5rem;
    padding: .6rem 1.2rem;
    border-radius: .75rem;
    border: 1.5px solid var(--kg-border);
    background: var(--kg-surface2);
    box-shadow: 4px 4px 10px var(--kg-shadow-d), -1px -1px 4px var(--kg-shadow-l);
    color: var(--kg-muted);
    font-size: .82rem; font-weight: 700; cursor: pointer;
    transition: all .18s ease;
    font-family: 'Outfit', sans-serif;
  }
  .dir-btn.active-in {
    background: rgba(34,211,165,.12);
    border-color: var(--kg-green);
    color: var(--kg-green);
    box-shadow: 0 0 16px rgba(34,211,165,.2), 4px 4px 10px var(--kg-shadow-d);
  }
  .dir-btn.active-out {
    background: rgba(248,113,113,.12);
    border-color: var(--kg-red);
    color: var(--kg-red);
    box-shadow: 0 0 16px rgba(248,113,113,.2), 4px 4px 10px var(--kg-shadow-d);
  }

  .log-entry {
    display: flex; align-items: center; gap: .6rem;
    padding: .55rem .7rem;
    border-radius: .7rem;
    border: 1px solid var(--kg-border);
    background: var(--kg-surface2);
    box-shadow: 3px 3px 8px var(--kg-shadow-d);
    animation: slide-up .25s ease both;
    transition: opacity .3s;
  }

  .stat-tile {
    display: flex; flex-direction: column; gap: .25rem;
    padding: .75rem 1rem;
    border-radius: .9rem;
    border: 1px solid var(--kg-border);
    background: var(--kg-surface2);
    box-shadow: 4px 4px 10px var(--kg-shadow-d), -1px -1px 4px var(--kg-shadow-l);
    flex: 1;
    min-width: 0;
  }

  .manual-input {
    background: var(--kg-bg);
    box-shadow: inset 3px 3px 8px var(--kg-shadow-d), inset -1px -1px 4px var(--kg-shadow-l);
    border: 1px solid var(--kg-border);
    border-radius: .75rem;
    padding: .55rem .9rem;
    color: var(--kg-text);
    font-size: .88rem;
    font-family: 'JetBrains Mono', monospace;
    outline: none;
    width: 100%;
    transition: border-color .15s;
  }
  .manual-input::placeholder { color: var(--kg-ghost); }
  .manual-input:focus { border-color: rgba(34,211,165,.4); }

  .action-btn {
    display: flex; align-items: center; justify-content: center; gap: .4rem;
    padding: .55rem .9rem;
    border-radius: .75rem;
    border: 1px solid var(--kg-border);
    background: var(--kg-surface2);
    box-shadow: 3px 3px 8px var(--kg-shadow-d), -1px -1px 4px var(--kg-shadow-l);
    color: var(--kg-muted);
    font-size: .78rem; font-weight: 700; cursor: pointer;
    transition: all .15s; font-family: 'Outfit', sans-serif;
    white-space: nowrap;
  }
  .action-btn:hover { color: var(--kg-text); border-color: rgba(255,255,255,.15); }
  .action-btn.green { background: rgba(34,211,165,.12); border-color: rgba(34,211,165,.3); color: var(--kg-green); }
  .action-btn.green:hover { background: rgba(34,211,165,.2); }

  .back-btn {
    display: flex; align-items: center; gap: .4rem;
    padding: .4rem .8rem; border-radius: .65rem;
    border: 1px solid var(--kg-border);
    background: var(--kg-surface2);
    box-shadow: 3px 3px 8px var(--kg-shadow-d);
    color: var(--kg-muted); font-size: .78rem; font-weight: 600;
    cursor: pointer; transition: all .15s; font-family: 'Outfit', sans-serif;
  }
  .back-btn:hover { color: var(--kg-text); }

  /* Live clock blink */
  @keyframes blink { 50% { opacity: .4; } }
  .clock-colon { animation: blink 1s step-end infinite; }

  /* Shimmer on loading */
  @keyframes shimmer {
    0%   { background-position: -200% 0; }
    100% { background-position:  200% 0; }
  }
  .shimmer {
    background: linear-gradient(90deg, var(--kg-surface2) 25%, var(--kg-surface) 50%, var(--kg-surface2) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }
`

/* ─── Live Clock Hook ────────────────────────────────── */
function useClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t) }, [])
  return now
}

/* ─── Success Overlay ────────────────────────────────── */
function SuccessOverlay({ data, dir, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, SUCCESS_SHOW_MS); return () => clearTimeout(t) }, [onDone])
  const isIn = dir === 'in'
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 30, background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(8px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.1rem', borderRadius: '1.1rem', animation: 'fade-in .2s ease both' }}>
      {/* Avatar */}
      <div style={{ animation: 'success-pop .4s cubic-bezier(.34,1.56,.64,1) both' }}>
        {data.profile_picture_url ? (
          <img src={`${BASE_URL}${data.profile_picture_url}`} alt={data.full_name}
            style={{ width: 110, height: 110, borderRadius: '50%', objectFit: 'cover', border: `4px solid ${isIn ? 'var(--kg-green)' : 'var(--kg-red)'}`, boxShadow: `0 0 40px ${isIn ? 'rgba(34,211,165,.45)' : 'rgba(248,113,113,.45)'}` }} />
        ) : (
          <div style={{ width: 110, height: 110, borderRadius: '50%', background: isIn ? 'rgba(34,211,165,.15)' : 'rgba(248,113,113,.15)', border: `4px solid ${isIn ? 'var(--kg-green)' : 'var(--kg-red)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', fontWeight: 900, color: isIn ? 'var(--kg-green)' : 'var(--kg-red)', boxShadow: `0 0 40px ${isIn ? 'rgba(34,211,165,.35)' : 'rgba(248,113,113,.35)'}` }}>
            {data.full_name?.[0]?.toUpperCase() || '?'}
          </div>
        )}
      </div>
      {/* Status icon */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', animation: 'slide-up .35s ease .15s both' }}>
        {isIn ? <LogIn size={22} color="var(--kg-green)" /> : <LogOut size={22} color="var(--kg-red)" />}
        <span style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', fontFamily: 'Outfit, sans-serif' }}>{data.full_name}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.25rem', animation: 'slide-up .35s ease .25s both' }}>
        {data.roll_number && <span style={{ fontSize: '.8rem', color: 'var(--kg-muted)', fontFamily: "'JetBrains Mono', monospace" }}>{data.roll_number}</span>}
        <span style={{ fontSize: '.88rem', fontWeight: 700, padding: '.25rem .8rem', borderRadius: '.5rem', background: isIn ? 'rgba(34,211,165,.15)' : 'rgba(248,113,113,.15)', color: isIn ? 'var(--kg-green)' : 'var(--kg-red)', border: `1px solid ${isIn ? 'rgba(34,211,165,.3)' : 'rgba(248,113,113,.3)'}` }}>
          {isIn ? '✓ Entry Recorded' : '✓ Exit Recorded'}
        </span>
        {data.duplicate && <span style={{ fontSize: '.72rem', color: 'var(--kg-amber)' }}>⚠ Already marked today</span>}
      </div>
    </div>
  )
}

/* ─── Fail Overlay ───────────────────────────────────── */
function FailOverlay({ onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 1000); return () => clearTimeout(t) }, [onDone])
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 30, borderRadius: '1.1rem', pointerEvents: 'none', border: '3px solid var(--kg-red)', animation: 'ring-fail .6s ease-out, fade-in .15s ease both', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(6px)', borderRadius: '.75rem', padding: '.5rem 1.2rem', display: 'flex', alignItems: 'center', gap: '.5rem' }}>
        <XCircle size={18} color="var(--kg-red)" />
        <span style={{ fontSize: '.85rem', fontWeight: 700, color: 'var(--kg-red)', fontFamily: 'Outfit, sans-serif' }}>Not Recognized</span>
      </div>
    </div>
  )
}

/* ─── Log Entry Card ─────────────────────────────────── */
function LogEntry({ entry }) {
  const isIn = entry.direction === 'in'
  return (
    <div className="log-entry">
      {/* Avatar */}
      {entry.profile_picture_url ? (
        <img src={`${BASE_URL}${entry.profile_picture_url}`} alt={entry.full_name}
          style={{ width: 36, height: 36, borderRadius: '.55rem', objectFit: 'cover', flexShrink: 0 }} />
      ) : (
        <div style={{ width: 36, height: 36, borderRadius: '.55rem', background: isIn ? 'rgba(34,211,165,.15)' : 'rgba(248,113,113,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '.85rem', color: isIn ? 'var(--kg-green)' : 'var(--kg-red)', flexShrink: 0 }}>
          {entry.full_name?.[0]?.toUpperCase() || '?'}
        </div>
      )}
      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '.82rem', fontWeight: 700, color: 'var(--kg-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.full_name}</p>
        <p style={{ fontSize: '.65rem', color: 'var(--kg-muted)', fontFamily: "'JetBrains Mono', monospace" }}>{entry.roll_number || '—'}</p>
      </div>
      {/* Dir + time */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '.15rem', flexShrink: 0 }}>
        <span style={{ fontSize: '.6rem', fontWeight: 800, padding: '.15rem .4rem', borderRadius: '.35rem', background: isIn ? 'rgba(34,211,165,.12)' : 'rgba(248,113,113,.12)', color: isIn ? 'var(--kg-green)' : 'var(--kg-red)', textTransform: 'uppercase', letterSpacing: '.04em' }}>
          {isIn ? 'IN' : 'OUT'}
        </span>
        <span style={{ fontSize: '.62rem', color: 'var(--kg-ghost)', fontFamily: "'JetBrains Mono', monospace" }}>{entry.time}</span>
      </div>
    </div>
  )
}

/* ─── Stat Tile ──────────────────────────────────────── */
function StatTile({ icon: Icon, label, value, color = 'var(--kg-text)' }) {
  return (
    <div className="stat-tile">
      <Icon size={14} style={{ color, opacity: .8 }} />
      <p style={{ fontSize: '1.4rem', fontWeight: 800, color, fontFamily: 'Outfit, sans-serif', lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: '.62rem', fontWeight: 600, color: 'var(--kg-muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>{label}</p>
    </div>
  )
}

/* ─── Manual Lookup ──────────────────────────────────── */
function ManualLookup({ gateId, cameraId, direction, onSuccess }) {
  const [query,   setQuery]   = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!query.trim()) return
    setLoading(true)
    try {
      const res  = await adminAPI.gateAttendanceManual?.({ roll_number: query.trim(), gate_id: gateId, camera_id: cameraId, entry_direction: direction })
      const data = res?.data?.data
      if (data?.matched) { onSuccess(data); setQuery('') }
      else alert('Student not found or not recognized')
    } catch { alert('Manual lookup failed') }
    finally { setLoading(false) }
  }

  return (
    <div style={{ display: 'flex', gap: '.5rem', padding: '.75rem', background: 'var(--kg-bg)', borderTop: '1px solid var(--kg-border)' }}>
      <Search size={13} style={{ position: 'absolute', top: '50%', left: 10, transform: 'translateY(-50%)', color: 'var(--kg-ghost)', pointerEvents: 'none' }} />
      <div style={{ flex: 1, position: 'relative' }}>
        <Search size={13} style={{ position: 'absolute', top: '50%', left: 10, transform: 'translateY(-50%)', color: 'var(--kg-ghost)' }} />
        <input className="manual-input" value={query} onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="Roll no or ID…" style={{ paddingLeft: '2rem' }} />
      </div>
      <button onClick={submit} disabled={loading} className="action-btn green" style={{ flexShrink: 0 }}>
        {loading ? <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <UserCheck size={13} />}
        {loading ? 'Looking…' : 'Mark'}
      </button>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════ */
export default function GateAttendancePage() {
  const [searchParams] = useSearchParams()
  const navigate       = useNavigate()
  const now            = useClock()

  // URL params
  const gateId   = parseInt(searchParams.get('gate_id')   || '1')
  const cameraId = parseInt(searchParams.get('camera_id') || '1')

  // State
  const [direction,    setDirection]    = useState(searchParams.get('direction') || 'in')
  const [status,       setStatusState]  = useState('loading')    // loading | scanning | success | fail
  const [successData,  setSuccessData]  = useState(null)
  const [camError,     setCamError]     = useState(null)
  const [log,          setLog]          = useState([])
  const [stats,        setStats]        = useState({ totalIn: 0, totalOut: 0, unique: 0 })
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [camOnline,    setCamOnline]    = useState(true)

  // Refs
  const videoRef      = useRef(null)
  const canvasRef     = useRef(null)
  const capCanvasRef  = useRef(null)
  const streamRef     = useRef(null)
  const detectorRef   = useRef(null)
  const loopRef       = useRef(null)
  const lastScanRef   = useRef(0)
  const processingRef = useRef(false)
  const statusRef     = useRef('loading')
  const dirRef        = useRef(direction)

  // Keep dirRef in sync
  useEffect(() => { dirRef.current = direction }, [direction])

  // Stable setStatus
  const setStatus = useCallback(s => { statusRef.current = s; setStatusState(s) }, [])

  // ── Keyboard shortcuts ─────────────────────────────
  useEffect(() => {
    const handler = e => {
      if (e.key === 'F11' || (e.key === 'f' && e.ctrlKey)) { e.preventDefault(); setIsFullscreen(f => !f) }
      if (e.key === 'Escape' && isFullscreen) setIsFullscreen(false)
      if (e.key === 'i' && !e.target.closest('input')) setDirection('in')
      if (e.key === 'o' && !e.target.closest('input')) setDirection('out')
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isFullscreen])

  // ── Draw corner brackets on canvas ────────────────
  const drawBox = useCallback((faces) => {
    const cv  = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    const W   = cv.width, H = cv.height
    ctx.clearRect(0, 0, W, H)
    if (faces.length !== 1) return

    const b  = faces[0].boundingBox
    const x  = (1 - b.xCenter - b.width / 2) * W
    const y  = (b.yCenter - b.height / 2) * H
    const w  = b.width * W, h = b.height * H
    const cs = Math.min(w, h) * 0.18

    const dir = dirRef.current
    const col = dir === 'in' ? '#22d3a5' : '#f87171'

    ctx.strokeStyle = col
    ctx.lineWidth   = 2.5
    ctx.shadowColor = col
    ctx.shadowBlur  = 12
    ctx.lineCap     = 'round'
    ctx.beginPath()
    // TL
    ctx.moveTo(x + cs, y);         ctx.lineTo(x, y);         ctx.lineTo(x, y + cs)
    // TR
    ctx.moveTo(x + w - cs, y);     ctx.lineTo(x + w, y);     ctx.lineTo(x + w, y + cs)
    // BL
    ctx.moveTo(x, y + h - cs);     ctx.lineTo(x, y + h);     ctx.lineTo(x + cs, y + h)
    // BR
    ctx.moveTo(x + w - cs, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y + h - cs)
    ctx.stroke()
  }, [])

  // ── Push to log ────────────────────────────────────
  const pushLog = useCallback((data, dir) => {
    const entry = {
      ...data,
      direction: dir,
      time: new Date().toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }),
      id: Date.now(),
    }
    setLog(prev => [entry, ...prev].slice(0, MAX_LOG))
  }, [])

  // ── Handle matched ─────────────────────────────────
  const handleMatched = useCallback((data, dir) => {
    setSuccessData(data)
    setStatus('success')
    if (!data.duplicate) {
      pushLog(data, dir)
      setStats(prev => ({
        totalIn:  dir === 'in'  ? prev.totalIn  + 1 : prev.totalIn,
        totalOut: dir === 'out' ? prev.totalOut + 1 : prev.totalOut,
        unique: prev.unique + 1,
      }))
    }
  }, [setStatus, pushLog])

  // ── Capture & send ─────────────────────────────────
  const tryCapture = useCallback(async (box) => {
    if (processingRef.current)           return
    if (statusRef.current !== 'scanning') return
    const ts = Date.now()
    if (ts - lastScanRef.current < SCAN_COOLDOWN) return

    const video = videoRef.current
    const cap   = capCanvasRef.current
    if (!video || !cap) return

    const vw = video.videoWidth  || 640
    const vh = video.videoHeight || 480
    const pad = 0.28

    let px = (box.xCenter - box.width / 2 - pad * box.width)  * vw
    let py = (box.yCenter - box.height / 2 - pad * box.height) * vh
    let pw = (box.width  + 2 * pad * box.width)  * vw
    let ph = (box.height + 2 * pad * box.height) * vh
    px = Math.max(0, px); py = Math.max(0, py)
    pw = Math.min(pw, vw - px); ph = Math.min(ph, vh - py)

    cap.width  = Math.round(pw)
    cap.height = Math.round(ph)
    cap.getContext('2d').drawImage(video, px, py, pw, ph, 0, 0, cap.width, cap.height)
    const base64 = cap.toDataURL('image/jpeg', 0.92)

    processingRef.current = true
    lastScanRef.current   = ts

    const dir = dirRef.current
    try {
      const res  = await adminAPI.gateAttendance({ image_base64: base64, gate_id: gateId, camera_id: cameraId, entry_direction: dir })
      const data = res.data?.data
      if (data?.matched) handleMatched(data, dir)
      else { setStatus('fail') }
    } catch {
      setStatus('fail')
      setCamOnline(false)
      setTimeout(() => setCamOnline(true), 5000)
    } finally {
      processingRef.current = false
    }
  }, [gateId, cameraId, setStatus, handleMatched])

  // ── Overlay done ───────────────────────────────────
  const handleOverlayDone = useCallback(() => {
    setStatus('scanning')
    setSuccessData(null)
  }, [setStatus])

  // ── MediaPipe boot ─────────────────────────────────
  useEffect(() => {
    let alive = true
    async function boot() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' }, audio: false })
        if (!alive) { stream.getTracks().forEach(t => t.stop()); return }
        streamRef.current = stream

        const video = videoRef.current
        if (!video) return
        video.srcObject = stream
        await video.play()
        if (!alive) return

        const fd = new FaceDetection({ locateFile: f => `/node_modules/@mediapipe/face_detection/${f}` })
        fd.setOptions({ model: 'short', minDetectionConfidence: 0.6 })
        fd.onResults(results => {
          if (!alive) return
          const faces = results.detections ?? []
          drawBox(faces)
          if (faces.length === 1) tryCapture(faces[0].boundingBox)
        })
        detectorRef.current = fd
        setStatus('scanning')

        const tick = async () => {
          if (!alive) return
          if (video.readyState === 4) await fd.send({ image: video }).catch(() => {})
          loopRef.current = requestAnimationFrame(tick)
        }
        tick()
      } catch (err) {
        if (alive) { setCamError(err.message); setStatus('scanning') }
      }
    }
    boot()
    return () => {
      alive = false
      if (loopRef.current) cancelAnimationFrame(loopRef.current)
      try { detectorRef.current?.close() } catch (_) {}
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
    }
  }, [drawBox, tryCapture, setStatus])

  // ── Canvas resize sync ─────────────────────────────
  useEffect(() => {
    const video  = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    const sync = () => { canvas.width = video.videoWidth || 640; canvas.height = video.videoHeight || 480 }
    video.addEventListener('loadedmetadata', sync)
    return () => video.removeEventListener('loadedmetadata', sync)
  }, [])

  // ── Clock strings ──────────────────────────────────
  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  const ss = String(now.getSeconds()).padStart(2, '0')
  const dateStr = now.toLocaleDateString('en-PK', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  // ── Scan ring class ────────────────────────────────
  const ringClass =
    status === 'scanning' ? 'scan-ring-scanning' :
    status === 'success'  ? 'scan-ring-success'  :
    status === 'fail'     ? 'scan-ring-fail'      :
    'scan-ring-loading'

  // ── Layout ─────────────────────────────────────────
  return (
    <>
      <style>{CSS}</style>
      <div className="kg-root" style={{ position: isFullscreen ? 'fixed' : 'relative', inset: isFullscreen ? 0 : 'auto', zIndex: isFullscreen ? 9999 : 'auto', minHeight: isFullscreen ? '100vh' : '100%', display: 'flex', flexDirection: 'column' }}>

        {/* ── TOP BAR ─────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '.7rem 1.2rem', borderBottom: '1px solid var(--kg-border)', background: 'var(--kg-surface)', flexShrink: 0, gap: '1rem', flexWrap: 'wrap' }}>

          {/* Left: back + title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
            <button className="back-btn" onClick={() => navigate('/admin/gates')}>
              <ArrowLeft size={13} />Back to Gates
            </button>
            <div style={{ width: 1, height: 22, background: 'var(--kg-border)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '.55rem' }}>
              <div style={{ width: 32, height: 32, borderRadius: '.65rem', background: 'rgba(34,211,165,.12)', border: '1px solid rgba(34,211,165,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ScanFace size={16} color="var(--kg-green)" />
              </div>
              <div>
                <p style={{ fontSize: '.88rem', fontWeight: 800, color: 'var(--kg-text)', fontFamily: 'Outfit, sans-serif', lineHeight: 1 }}>Gate AI Attendance</p>
                <p style={{ fontSize: '.62rem', color: 'var(--kg-muted)', marginTop: '.15rem' }}>Gate #{gateId} · Camera #{cameraId}</p>
              </div>
            </div>
          </div>

          {/* Center: live clock */}
          <div style={{ textAlign: 'center', flex: 1 }}>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '1.5rem', fontWeight: 700, color: 'var(--kg-text)', letterSpacing: '.04em', lineHeight: 1 }}>
              {hh}<span className="clock-colon">:</span>{mm}<span className="clock-colon">:</span><span style={{ color: 'var(--kg-muted)', fontSize: '1.1rem' }}>{ss}</span>
            </p>
            <p style={{ fontSize: '.62rem', color: 'var(--kg-muted)', marginTop: '.2rem' }}>{dateStr}</p>
          </div>

          {/* Right: direction toggle + connection + fullscreen */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
            {/* Direction toggle */}
            <button className={`dir-btn ${direction === 'in' ? 'active-in' : ''}`} onClick={() => setDirection('in')} title="Press I">
              <LogIn size={14} />Entry
            </button>
            <button className={`dir-btn ${direction === 'out' ? 'active-out' : ''}`} onClick={() => setDirection('out')} title="Press O">
              <LogOut size={14} />Exit
            </button>

            {/* Connection dot */}
            <div title={camOnline ? 'Connected' : 'Offline'} style={{ display: 'flex', alignItems: 'center', gap: '.3rem', padding: '.3rem .6rem', borderRadius: '.5rem', background: 'var(--kg-surface2)', border: '1px solid var(--kg-border)' }}>
              {camOnline ? <Wifi size={12} color="var(--kg-green)" /> : <WifiOff size={12} color="var(--kg-red)" />}
              <span style={{ fontSize: '.65rem', fontWeight: 700, color: camOnline ? 'var(--kg-green)' : 'var(--kg-red)' }}>{camOnline ? 'Live' : 'Offline'}</span>
            </div>

            {/* Fullscreen */}
            <button className="action-btn" onClick={() => setIsFullscreen(f => !f)} title="Ctrl+F / F11">
              {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          </div>
        </div>

        {/* ── BODY ────────────────────────────────── */}
        <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>

          {/* Camera Column */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.2rem', gap: '1rem' }}>

            {/* Scan Ring + Camera */}
            <div style={{ width: '100%', maxWidth: isFullscreen ? 820 : 660, position: 'relative' }}>
              {/* Ambient ring */}
              <div className={ringClass} style={{ borderRadius: '1.2rem', transition: 'border-color .3s, box-shadow .3s', overflow: 'hidden', aspectRatio: '4/3', position: 'relative', background: '#000' }}>
                <video ref={videoRef} playsInline muted autoPlay style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)', display: 'block' }} />
                <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', transform: 'scaleX(-1)', pointerEvents: 'none' }} />
                <canvas ref={capCanvasRef} style={{ display: 'none' }} />

                {/* Status bar */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(0,0,0,.85), transparent)', padding: '1.5rem 1.2rem .8rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                      background: status === 'scanning' ? 'var(--kg-green)' : status === 'success' ? 'var(--kg-green)' : status === 'fail' ? 'var(--kg-red)' : 'var(--kg-amber)',
                      boxShadow: status === 'scanning' ? '0 0 8px var(--kg-green)' : 'none',
                      animation: status === 'scanning' ? 'ring-pulse 1.5s ease-in-out infinite' : 'none',
                    }} />
                    <span style={{ fontSize: '.82rem', fontWeight: 600, color: '#fff' }}>
                      {status === 'loading'  && '⏳ Camera initializing…'}
                      {status === 'scanning' && `🎯 Scanning — ${direction === 'in' ? 'Entry' : 'Exit'} mode active`}
                      {status === 'success'  && '✓ Attendance recorded!'}
                      {status === 'fail'     && ''}
                    </span>
                  </div>
                </div>

                {/* Direction watermark */}
                <div style={{ position: 'absolute', top: '1rem', left: '1rem', padding: '.3rem .75rem', borderRadius: '.5rem', background: direction === 'in' ? 'rgba(34,211,165,.15)' : 'rgba(248,113,113,.15)', border: `1px solid ${direction === 'in' ? 'rgba(34,211,165,.3)' : 'rgba(248,113,113,.3)'}`, backdropFilter: 'blur(6px)' }}>
                  <span style={{ fontSize: '.72rem', fontWeight: 800, color: direction === 'in' ? 'var(--kg-green)' : 'var(--kg-red)', textTransform: 'uppercase', letterSpacing: '.06em', fontFamily: 'Outfit, sans-serif' }}>
                    {direction === 'in' ? '↑ ENTRY' : '↓ EXIT'}
                  </span>
                </div>

                {/* Overlays */}
                {status === 'success' && successData && <SuccessOverlay data={successData} dir={direction} onDone={handleOverlayDone} />}
                {status === 'fail'    && <FailOverlay onDone={handleOverlayDone} />}

                {/* Camera error */}
                {camError && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--kg-bg)', borderRadius: '1.1rem' }}>
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                      <AlertTriangle size={36} color="var(--kg-amber)" style={{ display: 'block', margin: '0 auto .8rem' }} />
                      <p style={{ fontWeight: 700, color: 'var(--kg-text)' }}>Camera Error</p>
                      <p style={{ fontSize: '.75rem', color: 'var(--kg-muted)', marginTop: '.4rem', maxWidth: 260, margin: '.4rem auto 0' }}>{camError}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Stat tiles */}
            <div style={{ display: 'flex', gap: '.75rem', width: '100%', maxWidth: isFullscreen ? 820 : 660 }}>
              <StatTile icon={LogIn}      label="Entries"    value={stats.totalIn}  color="var(--kg-green)" />
              <StatTile icon={LogOut}     label="Exits"      value={stats.totalOut} color="var(--kg-red)"   />
              <StatTile icon={Users}      label="Unique"     value={stats.unique}   color="var(--kg-blue)"  />
              <StatTile icon={Shield}     label="Gate"       value={`#${gateId}`}   color="var(--kg-muted)" />
              <StatTile icon={Camera}     label="Camera"     value={`#${cameraId}`} color="var(--kg-muted)" />
            </div>

            {/* Shortcut hints */}
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              {[
                { key: 'I', label: 'Entry mode'  },
                { key: 'O', label: 'Exit mode'   },
                { key: 'Ctrl+F', label: 'Fullscreen' },
              ].map(h => (
                <span key={h.key} style={{ fontSize: '.62rem', color: 'var(--kg-ghost)' }}>
                  <kbd style={{ background: 'var(--kg-surface2)', border: '1px solid var(--kg-border)', borderRadius: '.3rem', padding: '.1rem .35rem', fontFamily: "'JetBrains Mono', monospace", fontSize: '.6rem', color: 'var(--kg-muted)' }}>{h.key}</kbd>
                  {' '}{h.label}
                </span>
              ))}
            </div>
          </div>

          {/* ── Right Panel ─────────────────────── */}
          <div style={{ width: 290, borderLeft: '1px solid var(--kg-border)', display: 'flex', flexDirection: 'column', background: 'var(--kg-surface)', flexShrink: 0 }}>

            {/* Panel header */}
            <div style={{ padding: '.8rem 1rem', borderBottom: '1px solid var(--kg-border)', display: 'flex', alignItems: 'center', gap: '.5rem' }}>
              <Users size={14} color="var(--kg-muted)" />
              <span style={{ fontSize: '.82rem', fontWeight: 700, color: 'var(--kg-text)' }}>Recent Scans</span>
              {log.length > 0 && (
                <span style={{ marginLeft: 'auto', fontSize: '.65rem', fontWeight: 800, padding: '.15rem .5rem', borderRadius: '.4rem', background: 'rgba(34,211,165,.12)', color: 'var(--kg-green)', border: '1px solid rgba(34,211,165,.2)' }}>
                  {log.length}/{MAX_LOG}
                </span>
              )}
            </div>

            {/* Log list */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '.6rem', display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
              {log.length === 0 ? (
                <div style={{ textAlign: 'center', paddingTop: '4rem' }}>
                  <ScanFace size={28} style={{ color: 'var(--kg-ghost)', display: 'block', margin: '0 auto .75rem' }} />
                  <p style={{ fontSize: '.78rem', fontWeight: 600, color: 'var(--kg-muted)' }}>No scans yet</p>
                  <p style={{ fontSize: '.65rem', color: 'var(--kg-ghost)', marginTop: '.3rem' }}>Students will appear here</p>
                </div>
              ) : log.map(e => <LogEntry key={e.id} entry={e} />)}
            </div>

            {/* Manual Lookup */}
            <ManualLookup gateId={gateId} cameraId={cameraId} direction={direction} onSuccess={data => handleMatched(data, direction)} />

            {/* Clear log */}
            {log.length > 0 && (
              <button onClick={() => setLog([])} style={{ margin: '.5rem .75rem .75rem', padding: '.4rem', borderRadius: '.6rem', background: 'none', border: '1px solid var(--kg-border)', color: 'var(--kg-ghost)', fontSize: '.68rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', transition: 'color .15s' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--kg-muted)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--kg-ghost)'}>
                Clear log
              </button>
            )}
          </div>

        </div>
      </div>
    </>
  )
}