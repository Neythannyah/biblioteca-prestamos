import React from 'react'

/**
 * Botón con estilo píldora y variantes inspiradas en shadcn/ui
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  type = 'button',
  onClick,
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-150 rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]'

  const variants = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary-hover shadow-subtle',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary-hover',
    outline: 'border border-border bg-card text-foreground hover:bg-muted shadow-subtle',
    ghost: 'text-foreground hover:bg-muted',
    destructive: 'bg-destructive text-destructive-foreground hover:opacity-90 shadow-subtle',
    success: 'bg-success text-success-foreground hover:opacity-90 shadow-subtle',
    link: 'text-primary underline-offset-4 hover:underline p-0 h-auto'
  }

  const sizes = {
    sm: 'text-xs px-3.5 py-1.5 h-8 gap-1.5',
    md: 'text-sm px-5 py-2.5 h-10 gap-2',
    lg: 'text-base px-6 py-3 h-12 gap-2.5',
    icon: 'h-10 w-10 p-0 rounded-full'
  }

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  )
}

