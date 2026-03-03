export default function Input({
  label,
  error,
  hint,
  icon: Icon,
  iconRight: IconRight,
  className = '',
  required = false,
  type = 'text',
  ...props
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-slate-700">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <Icon size={16} />
          </div>
        )}
        <input
          type={type}
          className={`
            w-full rounded-xl border text-sm text-slate-800 placeholder-slate-400
            bg-white transition-colors duration-150
            focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
            disabled:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400
            ${Icon ? 'pl-9' : 'pl-3.5'}
            ${IconRight ? 'pr-9' : 'pr-3.5'}
            py-2.5
            ${error
              ? 'border-red-400 focus:border-red-400 focus:ring-red-500/20'
              : 'border-slate-300'
            }
          `}
          {...props}
        />
        {IconRight && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
            <IconRight size={16} />
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  )
}


// ── Select Input ─────────────────────────────────────
export function Select({ label, error, hint, required, className = '', children, ...props }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-slate-700">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <select
        className={`
          w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-800
          bg-white transition-colors duration-150 cursor-pointer
          focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
          disabled:bg-slate-50 disabled:cursor-not-allowed
          ${error ? 'border-red-400' : 'border-slate-300'}
        `}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
      {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  )
}


// ── Textarea ─────────────────────────────────────────
export function Textarea({ label, error, hint, required, className = '', rows = 3, ...props }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-slate-700">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <textarea
        rows={rows}
        className={`
          w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-800
          placeholder-slate-400 bg-white resize-none transition-colors duration-150
          focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
          ${error ? 'border-red-400' : 'border-slate-300'}
        `}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  )
}
