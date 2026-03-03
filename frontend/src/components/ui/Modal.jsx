import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

const SIZE_MAP = {
  sm:   'max-w-md',
  md:   'max-w-lg',
  lg:   'max-w-2xl',
  xl:   'max-w-4xl',
  full: 'max-w-6xl',
}

export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md',
  closeOnBackdrop = true,
}) {
  const overlayRef = useRef(null)

  // ESC key close
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (closeOnBackdrop && e.target === overlayRef.current) onClose?.()
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />

      {/* Modal box */}
      <div
        className={`
          relative w-full ${SIZE_MAP[size] || SIZE_MAP.md}
          bg-white rounded-2xl shadow-2xl shadow-slate-900/20
          flex flex-col max-h-[90vh]
          animate-in fade-in zoom-in-95 duration-200
        `}
        style={{ animation: 'modalIn 0.2s ease-out' }}
      >
        {/* Header */}
        {(title || onClose) && (
          <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-slate-100 flex-shrink-0">
            <div>
              {title && <h2 className="font-display font-bold text-lg text-slate-800">{title}</h2>}
              {subtitle && <p className="text-slate-400 text-sm mt-0.5">{subtitle}</p>}
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="ml-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors flex-shrink-0"
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 flex-shrink-0">
            {footer}
          </div>
        )}
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  )
}
