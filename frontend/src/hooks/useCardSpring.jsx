// ═══════════════════════════════════════════════════════════════
//  useCardSpring.jsx
//  Place: frontend/src/hooks/useCardSpring.jsx
//
//  Fixes:
//  • Right-click stuck → resets on next click after contextmenu
//  • Reload consistent → springs reinit cleanly on count change
//  • No stale closures → all state in refs
// ═══════════════════════════════════════════════════════════════
import { useRef, useEffect, useCallback } from 'react'

const K = 280, D = 24, DT = 1 / 60
const mkA = (v = 0) => ({ v, vel: 0, t: v })

export function useCardSpring({
  count,
  cols     = 3,
  pushX    = 32,
  liftY    = -8,
  hovScale = 1.06,
  sibScale = 0.96,
}) {
  const containerRef = useRef(null)
  const rafRef       = useRef(null)
  const hovIdx       = useRef(null)
  const sp           = useRef([])

  /* ─ write current spring values to DOM ─ */
  const writeDOM = useCallback(() => {
    if (!containerRef.current) return
    containerRef.current.querySelectorAll('[data-cs]').forEach((node, i) => {
      const s = sp.current[i]
      if (!s) return
      node.style.transform =
        `translateX(${s.x.v.toFixed(2)}px) translateY(${s.y.v.toFixed(2)}px) scale(${s.sc.v.toFixed(4)})`
      node.style.zIndex = hovIdx.current === i ? '10' : '1'
    })
  }, [])

  /* ─ rAF loop ─ */
  const tick = useCallback(() => {
    let any = false
    sp.current.forEach(s => {
      ;['x', 'y', 'sc'].forEach(k => {
        const a = s[k]
        const f = -K * (a.v - a.t) - D * a.vel
        a.vel += f * DT; a.v += a.vel * DT
        if (Math.abs(a.v - a.t) > 2e-4 || Math.abs(a.vel) > 2e-4) any = true
        else { a.v = a.t; a.vel = 0 }
      })
    })
    writeDOM()
    rafRef.current = any ? requestAnimationFrame(tick) : null
  }, [writeDOM])

  const kick = useCallback(() => {
    if (!rafRef.current) rafRef.current = requestAnimationFrame(tick)
  }, [tick])

  /* ─ reset all to resting state ─ */
  const reset = useCallback((instant = false) => {
    hovIdx.current = null
    sp.current.forEach(s => {
      s.x.t = 0; s.y.t = 0; s.sc.t = 1
      if (instant) { s.x.v = 0; s.y.v = 0; s.sc.v = 1; s.x.vel = 0; s.y.vel = 0; s.sc.vel = 0 }
    })
    instant ? writeDOM() : kick()
  }, [kick, writeDOM])

  /* ─ reinit on count change + entry animation ─ */
  useEffect(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
    sp.current = Array.from({ length: count }, () => ({ x: mkA(0), y: mkA(0), sc: mkA(0) }))
    // staggered spring-in from scale 0
    sp.current.forEach((s, i) => {
      setTimeout(() => { s.sc.t = 1; kick() }, 40 + i * 55)
    })
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [count]) // eslint-disable-line

  /* ─ global stuck-prevention ─ */
  useEffect(() => {
    let pendingReset = false
    const onCtx   = () => { pendingReset = true }
    const onClick  = () => { if (pendingReset) { pendingReset = false; reset() } }
    const onBlur   = () => reset()
    const onVis    = () => { if (document.hidden) reset(true) }

    window.addEventListener('contextmenu',        onCtx,   true)
    window.addEventListener('click',              onClick, true)
    window.addEventListener('blur',               onBlur)
    document.addEventListener('visibilitychange', onVis)
    return () => {
      window.removeEventListener('contextmenu',       onCtx,   true)
      window.removeEventListener('click',             onClick, true)
      window.removeEventListener('blur',              onBlur)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [reset])

  /* ─ hover handlers ─ */
  const onEnter = useCallback((idx) => {
    hovIdx.current = idx
    sp.current.forEach((s, i) => {
      if (i === idx) { s.sc.t = hovScale; s.y.t = liftY; s.x.t = 0 }
      else {
        const col = i % cols, hCol = idx % cols
        s.x.t = col < hCol ? -pushX : col > hCol ? pushX : 0
        s.y.t = 0; s.sc.t = sibScale
      }
    })
    kick()
  }, [cols, pushX, liftY, hovScale, sibScale, kick])

  const onLeave = useCallback(() => {
    hovIdx.current = null
    sp.current.forEach(s => { s.x.t = 0; s.y.t = 0; s.sc.t = 1 })
    kick()
  }, [kick])

  return { containerRef, onEnter, onLeave, reset }
}