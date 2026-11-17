import React from 'react'

export function Textarea({
  className = '',
  error = false,
  rows = 3,
  ...props
}) {
  return (
    <textarea
      rows={rows}
      className={`flex w-full rounded-2xl border ${error ? 'border-destructive ring-1 ring-destructive' : 'border-border'} bg-muted/60 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70 transition-all duration-150 focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    />
  )
}

