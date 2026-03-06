// ═══════════════════════════════════════════════════════════════
//  useContextMenu.jsx  —  Shared right-click context menu
//  Place at: frontend/src/hooks/useContextMenu.jsx
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'

// ── Hook ──────────────────────────────────────────────────────
export function useContextMenu() {
  const [menu, setMenu] = useState(null) // { x, y, row }

  const open = useCallback((e, row) => {
    e.preventDefault()
    e.stopPropagation()
    // keep menu inside viewport
    const x = Math.min(e.clientX, window.innerWidth  - 200)
    const y = Math.min(e.clientY, window.innerHeight - 250)
    setMenu({ x, y, row })
  }, [])

  const close = useCallback(() => setMenu(null), [])

  useEffect(() => {
    if (!menu) return
    const handler = () => close()
    window.addEventListener('click',       handler)
    window.addEventListener('contextmenu', handler)
    window.addEventListener('keydown',     (e) => e.key === 'Escape' && close())
    return () => {
      window.removeEventListener('click',       handler)
      window.removeEventListener('contextmenu', handler)
    }
  }, [menu, close])

  return { menu, open, close }
}

// ── Context Menu UI ───────────────────────────────────────────
// items = [{ label, icon: Icon, onClick, danger?, disabled?, divider? }]
export function ContextMenu({ menu, items, close }) {
  const ref = useRef(null)

  if (!menu) return null

  return createPortal(
    <div
      ref={ref}
      onClick={e => e.stopPropagation()}
      style={{
        position:  'fixed',
        top:       menu.y,
        left:      menu.x,
        zIndex:    99999,
        minWidth:  '172px',
        background: 'var(--neu-surface)',
        boxShadow: [
          '8px 8px 24px var(--neu-shadow-dark)',
          '-4px -4px 12px var(--neu-shadow-light)',
          '0 0 0 1px var(--neu-border)',
        ].join(', '),
        borderRadius: '0.875rem',
        padding: '0.35rem',
        animation: 'neu-ctx-in 0.12s cubic-bezier(0.34,1.56,0.64,1) both',
      }}
    >
      <style>{`
        @keyframes neu-ctx-in {
          from { opacity: 0; transform: scale(0.92) translateY(-4px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);    }
        }
      `}</style>

      {items.map((item, i) => {
        if (item.divider) return (
          <div key={i} style={{ height: '1px', background: 'var(--neu-border)', margin: '0.3rem 0.4rem' }} />
        )

        const Icon = item.icon
        return (
          <button
            key={i}
            disabled={item.disabled}
            onClick={() => {
              if (!item.disabled) {
                item.onClick(menu.row)
                close()
              }
            }}
            style={{
              width:       '100%',
              display:     'flex',
              alignItems:  'center',
              gap:         '0.6rem',
              padding:     '0.55rem 0.75rem',
              borderRadius: '0.6rem',
              border:      'none',
              background:  'none',
              cursor:      item.disabled ? 'not-allowed' : 'pointer',
              color:       item.danger
                ? 'var(--neu-danger)'
                : item.disabled
                  ? 'var(--neu-text-ghost)'
                  : 'var(--neu-text-secondary)',
              fontSize:    '0.8rem',
              fontWeight:  600,
              fontFamily:  "'DM Sans', sans-serif",
              textAlign:   'left',
              opacity:     item.disabled ? 0.45 : 1,
              transition:  'background 0.12s, color 0.12s',
              whiteSpace:  'nowrap',
            }}
            onMouseEnter={e => {
              if (!item.disabled) {
                e.currentTarget.style.background = item.danger
                  ? 'rgba(242,107,107,0.1)'
                  : 'var(--neu-surface-deep)'
                e.currentTarget.style.color = item.danger
                  ? 'var(--neu-danger)'
                  : 'var(--neu-text-primary)'
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'none'
              e.currentTarget.style.color = item.danger
                ? 'var(--neu-danger)'
                : item.disabled
                  ? 'var(--neu-text-ghost)'
                  : 'var(--neu-text-secondary)'
            }}
          >
            {Icon && <Icon size={14} style={{ flexShrink: 0 }} />}
            {item.label}
          </button>
        )
      })}
    </div>,
    document.body
  )
}