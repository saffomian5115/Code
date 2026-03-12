// ═══════════════════════════════════════════════════════════════════════
//  FaceScannerWidget.jsx
//  Path: frontend/src/components/shared/FaceScannerWidget.jsx
//
//  FIX: apiCall / onSuccess / onFail ko refs mein store kiya taake
//       fd.onResults callback hamesha latest version use kare —
//       yahi woh stale closure bug tha jis ki wajah se 4 mein se
//       sirf 1 baar capture hota tha.
//
//  Ek hi reusable component — teeno jagah use hota hai:
//    1. Login page  → mode="login"   → 5 attempts, phir band
//    2. Gate kiosk  → mode="gate"    → hamesha chalta rahe, success card
//    3. Profile     → mode="enroll"  → jab tak enroll na ho, retry karta rahe
// ═══════════════════════════════════════════════════════════════════════

import { useEffect, useRef, useState, useCallback } from 'react'
import { FaceDetection } from '@mediapipe/face_detection'
import {
  ScanFace, X, Loader2, CheckCircle, AlertCircle,
  RefreshCw, UserCheck, ShieldOff,
} from 'lucide-react'

// ── Per-mode defaults ──────────────────────────────────────────────────
const MODE_CFG = {
  login: {
    maxAttempts:  5,
    retryDelay:   1500,
    scanCooldown: 2500,
    showCard:     false,
    cardDuration: 2200,
    accentColor:  '#5b8af0',
    layout:       'modal',
    theme:        'light',
    title:        'Face Login',
    subtitle:     'Apna chehra camera ke saamne rakho',
  },
  gate: {
    maxAttempts:  Infinity,
    retryDelay:   1000,
    scanCooldown: 3000,
    showCard:     true,
    cardDuration: 2200,
    accentColor:  '#22d3a5',
    layout:       'inline',
    theme:        'dark',
    title:        'Gate Scanner',
    subtitle:     'Live scanning mode active',
  },
  enroll: {
    maxAttempts:  Infinity,
    retryDelay:   1800,
    scanCooldown: 2500,
    showCard:     false,
    cardDuration: 2200,
    accentColor:  '#3ecf8e',
    layout:       'modal',
    theme:        'light',
    title:        'Face Enroll',
    subtitle:     'Chehra seedha rakho — auto detect hoga',
  },
}

// ══════════════════════════════════════════════════════════════════════
//  SuccessCard — gate mode: matched user info card
// ══════════════════════════════════════════════════════════════════════
function SuccessCard({ data, accentColor, onDone, duration }) {
  useEffect(() => {
    const t = setTimeout(onDone, duration)
    return () => clearTimeout(t)
  }, [onDone, duration])

  const imgUrl = data?.profile_picture_url
    ? (data.profile_picture_url.startsWith('http')
        ? data.profile_picture_url
        : `http://127.0.0.1:8000${data.profile_picture_url}`)
    : null

  return (
    <div style={{
      position:'absolute', inset:0, zIndex:20,
      background:'rgba(0,0,0,0.82)', backdropFilter:'blur(4px)',
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      borderRadius:'inherit', gap:'0.45rem',
      animation:'fsw-fadeIn 0.25s ease both',
    }}>
      <div style={{
        width:78, height:78, borderRadius:'50%',
        border:`3px solid ${accentColor}`,
        boxShadow:`0 0 22px ${accentColor}50`,
        overflow:'hidden', background:'#1e293b',
        display:'flex', alignItems:'center', justifyContent:'center',
        animation:'fsw-pulse 1.5s ease-in-out infinite',
      }}>
        {imgUrl
          ? <img src={imgUrl} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          : <UserCheck size={30} color={accentColor} />
        }
      </div>
      <div style={{
        width:32, height:32, borderRadius:'50%', background:'#22d3a5',
        display:'flex', alignItems:'center', justifyContent:'center',
        animation:'fsw-checkPop 0.4s cubic-bezier(.36,.07,.19,.97)',
      }}>
        <CheckCircle size={17} color="#fff" />
      </div>
      {data?.full_name && (
        <p style={{ fontWeight:800, fontSize:'1.08rem', color:'#fff', margin:0, fontFamily:'Outfit,sans-serif' }}>
          {data.full_name}
        </p>
      )}
      {data?.roll_number && (
        <p style={{ fontSize:'0.76rem', color:'#94a3b8', margin:0 }}>{data.roll_number}</p>
      )}
      {data?.entry_direction && (
        <span style={{
          fontSize:'0.7rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em',
          padding:'0.2rem 0.65rem', borderRadius:'1rem',
          background: data.entry_direction === 'in' ? 'rgba(34,211,142,0.15)' : 'rgba(248,113,113,0.15)',
          color:       data.entry_direction === 'in' ? '#22d3a5' : '#f87171',
          border:`1px solid ${data.entry_direction === 'in' ? 'rgba(34,211,142,0.3)' : 'rgba(248,113,113,0.3)'}`,
        }}>
          {data.entry_direction === 'in' ? '↑ Entry' : '↓ Exit'}
        </span>
      )}
      {data?.duplicate && <span style={{ fontSize:'0.68rem', color:'#fbbf24' }}>⚠ Already marked today</span>}
      {data?.confidence !== undefined && (
        <p style={{ fontSize:'0.66rem', color:'#64748b', margin:0 }}>
          {(data.confidence * 100).toFixed(0)}% match · {data.processing_time_ms ?? '—'}ms
        </p>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════
//  FailOverlay
// ══════════════════════════════════════════════════════════════════════
function FailOverlay({ attempts, maxAttempts, mode }) {
  const remaining = maxAttempts === Infinity ? null : maxAttempts - attempts
  return (
    <div style={{
      position:'absolute', inset:0, zIndex:18,
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      pointerEvents:'none',
    }}>
      <div style={{
        background:'rgba(248,113,113,0.12)', border:'1px solid rgba(248,113,113,0.3)',
        borderRadius:'1rem', padding:'0.82rem 1.25rem', textAlign:'center',
        backdropFilter:'blur(8px)',
      }}>
        <AlertCircle size={20} color="#f87171" style={{ margin:'0 auto 0.32rem', display:'block' }} />
        <p style={{ color:'#f87171', fontWeight:700, fontSize:'0.8rem', margin:0 }}>
          Face recognize nahi hua
        </p>
        <p style={{ color:'#94a3b8', fontSize:'0.7rem', marginTop:'0.18rem', margin:'0.18rem 0 0' }}>
          {mode === 'login' && remaining !== null && remaining > 0
            ? `${remaining} attempt${remaining === 1 ? '' : 's'} baaki — retry ho raha hai…`
            : 'Dobara try ho raha hai…'
          }
        </p>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════
//  MaxAttemptsOverlay — login: 5/5 exhausted
// ══════════════════════════════════════════════════════════════════════
function MaxAttemptsOverlay({ onClose, onRetry, accentColor }) {
  return (
    <div style={{
      position:'absolute', inset:0, zIndex:25,
      background:'rgba(0,0,0,0.88)', backdropFilter:'blur(6px)',
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      gap:'0.7rem', borderRadius:'inherit',
    }}>
      <div style={{
        width:50, height:50, borderRadius:'50%',
        background:'rgba(248,113,113,0.15)', border:'2px solid rgba(248,113,113,0.4)',
        display:'flex', alignItems:'center', justifyContent:'center',
      }}>
        <ShieldOff size={24} color="#f87171" />
      </div>
      <p style={{ fontWeight:800, fontSize:'0.98rem', color:'#fff', margin:0, fontFamily:'Outfit,sans-serif', textAlign:'center' }}>
        5/5 Attempts Complete
      </p>
      <p style={{ fontSize:'0.76rem', color:'#94a3b8', margin:0, textAlign:'center', maxWidth:210 }}>
        Face login nahi ho saka۔ Password se login karo ya dobara try karo۔
      </p>
      <div style={{ display:'flex', gap:'0.55rem', marginTop:'0.15rem' }}>
        <button onClick={onRetry} style={{
          padding:'0.42rem 0.95rem', borderRadius:'0.7rem', cursor:'pointer',
          border:`1px solid ${accentColor}55`, background:`${accentColor}15`,
          color:accentColor, fontSize:'0.76rem', fontWeight:700,
          display:'flex', alignItems:'center', gap:'0.3rem',
        }}>
          <RefreshCw size={12} /> Dobara Try
        </button>
        {onClose && (
          <button onClick={onClose} style={{
            padding:'0.42rem 0.95rem', borderRadius:'0.7rem', cursor:'pointer',
            border:'1px solid rgba(255,255,255,0.12)', background:'rgba(255,255,255,0.06)',
            color:'#94a3b8', fontSize:'0.76rem', fontWeight:600,
          }}>
            Band Karo
          </button>
        )}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════
//  FaceScannerWidget — main export
// ══════════════════════════════════════════════════════════════════════
export default function FaceScannerWidget({
  mode,
  apiCall,
  onSuccess,
  onFail,
  onClose,
  title,
  subtitle,
  accentColor,
  showCard,
  cardDuration,
  scanCooldown,
  layout,
  theme,
}) {
  const cfg  = MODE_CFG[mode] ?? MODE_CFG.login
  const ACC  = accentColor  ?? cfg.accentColor
  const CARD = showCard     ?? cfg.showCard
  const CDUR = cardDuration ?? cfg.cardDuration
  const COOL = scanCooldown ?? cfg.scanCooldown
  const LAY  = layout       ?? cfg.layout
  const THM  = theme        ?? cfg.theme
  const TTL  = title        ?? cfg.title
  const SUB  = subtitle     ?? cfg.subtitle
  const MAX  = cfg.maxAttempts
  const RDLY = cfg.retryDelay

  // ── DOM Refs ─────────────────────────────────────────────────────────
  const videoRef      = useRef(null)
  const overlayRef    = useRef(null)
  const capCanvasRef  = useRef(null)
  const streamRef     = useRef(null)
  const detectorRef   = useRef(null)
  const loopRef       = useRef(null)

  // ── Mutable Refs (no re-render needed) ───────────────────────────────
  const processingRef = useRef(false)
  const lastScanRef   = useRef(0)
  const statusRef     = useRef('loading')
  const mountedRef    = useRef(true)
  const attemptsRef   = useRef(0)

  // ── FIX: Keep latest prop callbacks in refs ───────────────────────────
  // Yeh teen refs ki wajah se fd.onResults callback kabhi stale nahi hoga
  // chahe kitni baar bhi component re-render ho ya naya apiCall prop aaye
  const apiCallRef   = useRef(apiCall)
  const onSuccessRef = useRef(onSuccess)
  const onFailRef    = useRef(onFail)

  // Har render pe refs update karo (no stale closures)
  useEffect(() => { apiCallRef.current   = apiCall   }, [apiCall])
  useEffect(() => { onSuccessRef.current = onSuccess }, [onSuccess])
  useEffect(() => { onFailRef.current    = onFail    }, [onFail])

  // ── State ─────────────────────────────────────────────────────────────
  const [status,      setStatusState] = useState('loading')
  const [successData, setSuccessData] = useState(null)
  const [camError,    setCamError]    = useState(null)
  const [attempts,    setAttempts]    = useState(0)
  const [maxed,       setMaxed]       = useState(false)

  const setStatus = useCallback(s => {
    if (!mountedRef.current) return
    statusRef.current = s
    setStatusState(s)
  }, [])

  // ── Cleanup ───────────────────────────────────────────────────────────
  const stopAll = useCallback(() => {
    if (loopRef.current)  cancelAnimationFrame(loopRef.current)
    try { detectorRef.current?.close() } catch (_) {}
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
    loopRef.current     = null
    detectorRef.current = null
    streamRef.current   = null
  }, [])

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false; stopAll() }
  }, [stopAll])

  // ── Draw corner brackets ──────────────────────────────────────────────
  const drawOverlay = useCallback((faces, col) => {
    const cv = overlayRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    ctx.clearRect(0, 0, cv.width, cv.height)
    if (!faces || faces.length !== 1) return
    const b  = faces[0].boundingBox
    const x  = (1 - b.xCenter - b.width  / 2) * cv.width
    const y  = (b.yCenter     - b.height / 2) * cv.height
    const w  = b.width  * cv.width
    const h  = b.height * cv.height
    const cs = Math.min(w, h) * 0.2
    ctx.strokeStyle = col; ctx.lineWidth = 2.5
    ctx.shadowColor = col; ctx.shadowBlur = 14
    ctx.lineCap = 'round'; ctx.beginPath()
    ctx.moveTo(x + cs, y);         ctx.lineTo(x, y);         ctx.lineTo(x, y + cs)
    ctx.moveTo(x + w - cs, y);     ctx.lineTo(x + w, y);     ctx.lineTo(x + w, y + cs)
    ctx.moveTo(x, y + h - cs);     ctx.lineTo(x, y + h);     ctx.lineTo(x + cs, y + h)
    ctx.moveTo(x + w - cs, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y + h - cs)
    ctx.stroke()
  }, [])

  // ── Capture face crop ─────────────────────────────────────────────────
  const captureFace = useCallback((box) => {
    const video = videoRef.current
    const cap   = capCanvasRef.current
    if (!video || !cap) return null
    const vw = video.videoWidth || 640, vh = video.videoHeight || 480
    const pad = 0.28
    let px = (box.xCenter - box.width / 2  - pad * box.width)  * vw
    let py = (box.yCenter - box.height / 2 - pad * box.height) * vh
    let pw = (box.width  + 2 * pad * box.width)  * vw
    let ph = (box.height + 2 * pad * box.height) * vh
    px = Math.max(0, px); py = Math.max(0, py)
    pw = Math.min(pw, vw - px); ph = Math.min(ph, vh - py)
    cap.width = Math.round(pw); cap.height = Math.round(ph)
    cap.getContext('2d').drawImage(video, px, py, pw, ph, 0, 0, cap.width, cap.height)
    return cap.toDataURL('image/jpeg', 0.92)
  }, [])

  // ── On face detected → try scan ───────────────────────────────────────
  // FIX: apiCall, onSuccess, onFail direct use nahi karte — refs se lete hain
  // Isliye yeh function kabhi stale nahi hoga, dependencies mein sirf
  // stable values hain (refs, COOL, CARD, MAX, RDLY, captureFace, setStatus)
  const onFaceDetected = useCallback(async (box) => {
    if (processingRef.current)            return
    if (statusRef.current !== 'scanning') return
    const now = Date.now()
    if (now - lastScanRef.current < COOL) return

    const base64 = captureFace(box)
    if (!base64) return

    processingRef.current = true
    lastScanRef.current   = now
    setStatus('processing')

    try {
      // ← ref se latest apiCall lo, stale closure nahi hogi
      const res  = await apiCallRef.current(base64)
      const data = res?.data?.data

      const isSuccess = mode === 'enroll'
        ? (res?.data?.success !== false)
        : (data?.matched !== false && res?.data?.success !== false)

      if (isSuccess) {
        setSuccessData(data ?? res?.data)
        setStatus('success')
        if (!CARD) {
          // login / enroll — seedha callback
          onSuccessRef.current?.(data ?? res?.data)
        }
      } else {
        const n = attemptsRef.current + 1
        attemptsRef.current = n
        setAttempts(n)
        onFailRef.current?.()
        setStatus('fail')

        if (MAX !== Infinity && n >= MAX) {
          setMaxed(true)
        } else {
          setTimeout(() => { if (mountedRef.current) setStatus('scanning') }, RDLY)
        }
      }
    } catch {
      const n = attemptsRef.current + 1
      attemptsRef.current = n
      setAttempts(n)
      onFailRef.current?.()
      setStatus('fail')
      if (MAX !== Infinity && n >= MAX) {
        setMaxed(true)
      } else {
        setTimeout(() => { if (mountedRef.current) setStatus('scanning') }, RDLY)
      }
    } finally {
      processingRef.current = false
    }
  }, [mode, COOL, CARD, MAX, RDLY, captureFace, setStatus])
  //   ↑ apiCall, onSuccess, onFail yahan nahi hain — refs handle karte hain

  // ── Gate: success card done → reset + continue ───────────────────────
  const handleCardDone = useCallback(() => {
    onSuccessRef.current?.(successData)
    setSuccessData(null)
    setStatus('scanning')
  }, [successData, setStatus])

  // ── Boot MediaPipe ────────────────────────────────────────────────────
  const boot = useCallback(async () => {
    stopAll()
    setStatus('loading')
    setCamError(null)
    setMaxed(false)
    setSuccessData(null)
    attemptsRef.current   = 0
    setAttempts(0)
    processingRef.current = false
    lastScanRef.current   = 0

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false,
      })
      if (!mountedRef.current) { stream.getTracks().forEach(t => t.stop()); return }
      streamRef.current = stream

      const video = videoRef.current
      if (!video) return
      video.srcObject = stream
      await video.play()
      if (!mountedRef.current) return

      if (overlayRef.current) {
        overlayRef.current.width  = video.videoWidth  || 640
        overlayRef.current.height = video.videoHeight || 480
      }

      const fd = new FaceDetection({ locateFile: f => `/node_modules/@mediapipe/face_detection/${f}` })
      fd.setOptions({ model: 'short', minDetectionConfidence: 0.6 })

      // ── FIX: onResults mein onFaceDetected directly call karte hain ──
      // onFaceDetected ab stable hai (refs ki wajah se) isliye
      // fd.onResults ko dobara register karne ki zaroorat nahi
      fd.onResults(results => {
        if (!mountedRef.current) return
        const faces = results.detections ?? []
        const col = statusRef.current === 'fail' ? '#f87171' : ACC
        drawOverlay(faces, col)
        if (faces.length === 1) onFaceDetected(faces[0].boundingBox)
      })

      detectorRef.current = fd
      setStatus('scanning')

      const tick = async () => {
        if (!mountedRef.current) return
        if (video.readyState >= 2) { try { await fd.send({ image: video }) } catch (_) {} }
        loopRef.current = requestAnimationFrame(tick)
      }
      tick()

    } catch (err) {
      if (mountedRef.current) {
        setCamError(err.message || 'Camera access nahi mila')
        setStatus('fail')
      }
    }
  }, [ACC, drawOverlay, onFaceDetected, setStatus, stopAll])

  // ── Canvas resize sync ────────────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current, canvas = overlayRef.current
    if (!video || !canvas) return
    const sync = () => {
      canvas.width  = video.videoWidth  || 640
      canvas.height = video.videoHeight || 480
    }
    video.addEventListener('loadedmetadata', sync)
    return () => video.removeEventListener('loadedmetadata', sync)
  }, [])

  // ── Boot on mount ─────────────────────────────────────────────────────
  useEffect(() => {
    boot()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Theme vars ────────────────────────────────────────────────────────
  const isDark = THM === 'dark'
  const surf   = isDark ? '#161c26'               : '#ffffff'
  const border = isDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.09)'
  const txtPri = isDark ? '#e2e8f0'               : '#1e293b'
  const txtMut = isDark ? '#64748b'               : '#94a3b8'
  const shadow = isDark
    ? '10px 10px 26px rgba(0,0,0,.6), -3px -3px 10px rgba(255,255,255,.04)'
    : '8px 8px 20px rgba(0,0,0,.12), -4px -4px 10px rgba(255,255,255,.9)'

  // ── Status bar ────────────────────────────────────────────────────────
  const attemptStr  = MAX !== Infinity ? ` (${attempts}/${MAX})` : ''
  const statusLabel = {
    loading:    '⏳ Camera shuru ho rahi hai…',
    scanning:   `🎯 Scanning${attemptStr}…`,
    processing: '🔄 Verify ho raha hai…',
    success:    '✅ Pehchaan ho gayi!',
    fail:       maxed ? '🚫 Max attempts — retry karo' : '❌ Recognize nahi hua — retry ho raha hai…',
  }[status] ?? ''

  const statusColor = {
    loading:'#fbbf24', scanning:ACC, processing:'#a78bfa', success:'#22d3a5', fail:'#f87171',
  }[status] ?? txtMut

  // ── Ring ──────────────────────────────────────────────────────────────
  const ringBorder = status === 'success' ? '2.5px solid #22d3a5'
    : status === 'fail'     ? '2.5px solid #f87171'
    : status === 'scanning' ? `2.5px solid ${ACC}`
    : `1px solid ${border}`
  const ringGlow = status === 'success' ? '0 0 22px rgba(34,211,165,.3)'
    : status === 'fail'     ? '0 0 18px rgba(248,113,113,.22)'
    : status === 'scanning' ? `0 0 14px ${ACC}28`
    : 'none'

  // ── Inner card ────────────────────────────────────────────────────────
  const inner = (
    <div style={{
      background:surf, borderRadius:'1.5rem', overflow:'hidden',
      border:`1px solid ${border}`, boxShadow:shadow,
      width:'100%', maxWidth: LAY === 'inline' ? '100%' : 420,
      position:'relative', fontFamily:"'Outfit','DM Sans',sans-serif",
    }}>
      <style>{`
        @keyframes fsw-spin      { to { transform:rotate(360deg) } }
        @keyframes fsw-scan-line { 0%{ top:0 } 100%{ top:100% } }
        @keyframes fsw-ring-scan { 0%,100%{ transform:scale(1) } 50%{ transform:scale(1.012) } }
        @keyframes fsw-ring-fail { 0%{ box-shadow:0 0 0 0 rgba(248,113,113,.55) } 70%{ box-shadow:0 0 0 14px rgba(248,113,113,0) } 100%{ box-shadow:0 0 0 0 rgba(248,113,113,0) } }
        @keyframes fsw-fadeIn    { from{ opacity:0; transform:scale(.93) } to{ opacity:1; transform:scale(1) } }
        @keyframes fsw-checkPop  { 0%{ transform:scale(0) } 60%{ transform:scale(1.2) } 100%{ transform:scale(1) } }
        @keyframes fsw-pulse     { 0%,100%{ box-shadow:0 0 0 0 ${ACC}44 } 50%{ box-shadow:0 0 0 12px ${ACC}00 } }
      `}</style>

      {/* ── Header ── */}
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'0.9rem 1.15rem 0.8rem',
        borderBottom:`1px solid ${border}`,
        background: isDark ? '#1c2333' : surf,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.55rem' }}>
          <div style={{
            width:33, height:33, borderRadius:'0.65rem', background:`${ACC}18`,
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <ScanFace size={16} color={ACC} />
          </div>
          <div>
            <p style={{ fontWeight:700, fontSize:'0.84rem', color:txtPri, margin:0 }}>{TTL}</p>
            <p style={{ fontSize:'0.69rem', color:txtMut, margin:0 }}>{SUB}</p>
          </div>
        </div>
        {onClose && (
          <button onClick={() => { stopAll(); onClose() }} style={{
            background:'none', border:'none', cursor:'pointer',
            padding:'0.28rem', borderRadius:'0.45rem', color:txtMut,
            display:'flex', alignItems:'center',
          }}>
            <X size={16} />
          </button>
        )}
      </div>

      {/* ── Camera area ── */}
      <div style={{
        position:'relative', background:'#0a0e1a', aspectRatio:'4/3',
        border: ringBorder, boxShadow: ringGlow,
        transition:'border-color .3s, box-shadow .3s',
        animation: status === 'scanning' ? 'fsw-ring-scan 2s ease-in-out infinite'
          : status === 'fail' && !maxed   ? 'fsw-ring-fail 0.6s ease-out'
          : 'none',
      }}>
        <video ref={videoRef}
          style={{ width:'100%', height:'100%', objectFit:'cover', transform:'scaleX(-1)', display:'block' }}
          playsInline muted />

        <canvas ref={overlayRef}
          style={{ position:'absolute', inset:0, width:'100%', height:'100%', transform:'scaleX(-1)', pointerEvents:'none' }} />

        <canvas ref={capCanvasRef} style={{ display:'none' }} />

        {/* Scan line */}
        {status === 'scanning' && (
          <div style={{
            position:'absolute', left:0, right:0, height:2,
            background:`linear-gradient(90deg,transparent,${ACC},transparent)`,
            animation:'fsw-scan-line 2.2s linear infinite', opacity:.5, pointerEvents:'none',
          }} />
        )}

        {/* Loading */}
        {status === 'loading' && (
          <div style={{
            position:'absolute', inset:0, display:'flex', flexDirection:'column',
            alignItems:'center', justifyContent:'center', gap:'0.5rem',
            background:'rgba(0,0,0,0.65)', backdropFilter:'blur(4px)',
          }}>
            <Loader2 size={28} color={ACC} style={{ animation:'fsw-spin 1s linear infinite' }} />
            <p style={{ color:'#94a3b8', fontSize:'0.76rem', margin:0 }}>Camera load ho rahi hai…</p>
          </div>
        )}

        {/* Processing */}
        {status === 'processing' && (
          <div style={{
            position:'absolute', inset:0, display:'flex', flexDirection:'column',
            alignItems:'center', justifyContent:'center', gap:'0.5rem',
            background:'rgba(0,0,0,0.5)', backdropFilter:'blur(3px)', pointerEvents:'none',
          }}>
            <Loader2 size={26} color="#a78bfa" style={{ animation:'fsw-spin 0.7s linear infinite' }} />
            <p style={{ color:'#a78bfa', fontSize:'0.76rem', fontWeight:600, margin:0 }}>Verify ho raha hai…</p>
          </div>
        )}

        {/* Fail overlay */}
        {status === 'fail' && !maxed && (
          <FailOverlay attempts={attempts} maxAttempts={MAX} mode={mode} />
        )}

        {/* Max attempts — login only */}
        {maxed && (
          <MaxAttemptsOverlay
            accentColor={ACC}
            onRetry={boot}
            onClose={onClose ? () => { stopAll(); onClose() } : undefined}
          />
        )}

        {/* Success card — gate mode */}
        {status === 'success' && CARD && successData && (
          <SuccessCard
            data={successData}
            accentColor={ACC}
            onDone={handleCardDone}
            duration={CDUR}
          />
        )}

        {/* Camera error */}
        {camError && status === 'fail' && (
          <div style={{
            position:'absolute', bottom:'0.6rem', left:0, right:0,
            textAlign:'center', fontSize:'0.68rem', color:'#f87171',
          }}>
            {camError}
          </div>
        )}
      </div>

      {/* ── Status bar ── */}
      <div style={{
        padding:'0.6rem 1rem',
        display:'flex', alignItems:'center', justifyContent:'space-between',
        borderTop:`1px solid ${border}`,
        background: isDark ? '#1c2333' : surf,
      }}>
        <p style={{ fontSize:'0.72rem', color:statusColor, margin:0, fontWeight:600 }}>
          {statusLabel}
        </p>
        {/* Pulse dot */}
        {status === 'scanning' && (
          <div style={{
            width:8, height:8, borderRadius:'50%', background:ACC,
            animation:'fsw-pulse 1.4s ease-in-out infinite',
          }} />
        )}
      </div>
    </div>
  )

  // ── Layout: modal vs inline ───────────────────────────────────────────
  if (LAY === 'inline') return inner

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:999,
      background:'rgba(8,12,20,0.80)', backdropFilter:'blur(8px)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem',
    }}>
      {inner}
    </div>
  )
}