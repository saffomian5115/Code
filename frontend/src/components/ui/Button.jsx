import { Loader2 } from 'lucide-react'

const VARIANTS = {
  primary:   'bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-600/20',
  secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-700',
  danger:    'bg-red-500 hover:bg-red-600 text-white shadow-sm shadow-red-500/20',
  ghost:     'bg-transparent hover:bg-slate-100 text-slate-600',
  success:   'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm shadow-emerald-500/20',
  warning:   'bg-amber-500 hover:bg-amber-600 text-white',
  outline:   'border border-slate-300 hover:bg-slate-50 text-slate-700 bg-white',
}

const SIZES = {
  xs:  'px-2.5 py-1 text-xs gap-1',
  sm:  'px-3 py-1.5 text-sm gap-1.5',
  md:  'px-4 py-2 text-sm gap-2',
  lg:  'px-5 py-2.5 text-base gap-2',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  iconRight: IconRight,
  className = '',
  fullWidth = false,
  onClick,
  type = 'button',
  ...props
}) {
  const isDisabled = disabled || loading

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`
        inline-flex items-center justify-center font-medium rounded-xl
        transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500/30
        disabled:opacity-50 disabled:cursor-not-allowed
        ${VARIANTS[variant] || VARIANTS.primary}
        ${SIZES[size] || SIZES.md}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <Loader2 size={size === 'xs' ? 12 : size === 'sm' ? 14 : 16} className="animate-spin" />
      ) : (
        Icon && <Icon size={size === 'xs' ? 12 : size === 'sm' ? 14 : 16} />
      )}
      {children}
      {!loading && IconRight && (
        <IconRight size={size === 'xs' ? 12 : size === 'sm' ? 14 : 16} />
      )}
    </button>
  )
}
