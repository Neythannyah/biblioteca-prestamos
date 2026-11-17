import React from 'react'

export function Badge({
  children,
  variant = 'default',
  className = '',
  ...props
}) {
  const base = 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium tracking-tight transition-colors'

  const variants = {
    default: 'bg-secondary text-secondary-foreground border border-border/60',
    primary: 'bg-primary/10 text-primary border border-primary/20',
    success: 'bg-success/15 text-success border border-success/30 font-semibold',
    warning: 'bg-warning/15 text-warning border border-warning/30 font-semibold',
    destructive: 'bg-destructive/15 text-destructive border border-destructive/30 font-semibold',
    outline: 'border border-border text-foreground bg-transparent'
  }

  return (
    <span className={`${base} ${variants[variant] || variants.default} ${className}`} {...props}>
      {children}
    </span>
  )
}

