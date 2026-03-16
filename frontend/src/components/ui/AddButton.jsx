import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Plus } from 'lucide-react'

const BASE = 44, MAX = 58, RADIUS = 13, DIST = 100

export default function AddButton({ onClick, tooltip = 'Add', color = '#9b59b6', Icon = Plus }) {
  const wrapRef = useRef(null)
  const [size, setSize] = useState(BASE)
  const [showTip, setShowTip] = useState(false)
  const [tipPos, setTipPos] = useState(null)

  const onMove = (e) => {
    if (!wrapRef.current) return
    const rect = wrapRef.current.getBoundingClientRect()
    const center = rect.left + rect.width / 2
    const dist = Math.abs(e.clientX - center)
    if (dist >= DIST) { setSize(BASE); return }
    const t = 1 - dist / DIST
    const eased = t * t * (3 - 2 * t)
    setSize(BASE + (MAX - BASE) * eased)
  }

  useEffect(() => {
    if (!showTip || !wrapRef.current) { setTipPos(null); return }
    const r = wrapRef.current.getBoundingClientRect()
    setTipPos({ top: r.bottom + 10, left: r.left + r.width / 2 })
  }, [showTip])

  const radius = RADIUS + (size - BASE) * 0.25

  return (
    <div
      ref={wrapRef}
      onMouseMove={onMove}
      onMouseLeave={() => { setSize(BASE); setShowTip(false) }}
      onMouseEnter={() => setShowTip(true)}
      style={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}
    >
      <button
        onClick={onClick}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: `${radius}px`,
          background: 'linear-gradient(145deg, var(--neu-surface), var(--neu-surface-deep))',
          boxShadow: '5px 5px 12px var(--neu-shadow-dark), -3px -3px 8px var(--neu-shadow-light), inset 0 1px 0 rgba(255,255,255,0.6)',
          border: '1px solid var(--neu-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          color: color,
          transition: 'width 0.14s cubic-bezier(0.34,1.56,0.64,1), height 0.14s cubic-bezier(0.34,1.56,0.64,1), border-radius 0.14s ease',
        }}
      >
        <Icon size={Math.round(size * 0.42)} />
      </button>

      {showTip && tipPos && createPortal(
        <div style={{
          position: 'fixed', top: tipPos.top, left: tipPos.left,
          transform: 'translateX(-50%)', zIndex: 99999, pointerEvents: 'none',
        }}>
          <div style={{ width: 0, height: 0, margin: '0 auto', borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderBottom: `6px solid var(--neu-border)` }} />
          <div style={{
            background: 'var(--neu-surface)', border: '1px solid var(--neu-border)',
            boxShadow: '4px 4px 12px var(--neu-shadow-dark), -2px -2px 6px var(--neu-shadow-light)',
            color: 'var(--neu-text-primary)', fontSize: '0.71rem', fontWeight: 600,
            padding: '0.28rem 0.65rem', borderRadius: '0.5rem', whiteSpace: 'nowrap',
          }}>
            {tooltip}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}