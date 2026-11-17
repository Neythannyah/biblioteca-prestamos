import React from 'react'

export function Label({ children, className = '', required = false, ...props }) {
  return (
    <label
      className={`text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5 ${className}`}
      {...props}
    >
      {children}
      {required && <span className="text-destructive ml-1">*</span>}
    </label>
  )
}

