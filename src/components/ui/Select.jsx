import React from 'react'

export function Select({
  children,
  className = '',
  error = false,
  ...props
}) {
  return (
    <div className="relative">
      <select
        className={`flex h-11 w-full appearance-none rounded-2xl border ${error ? 'border-destructive ring-1 ring-destructive' : 'border-border'} bg-muted/60 px-4 py-2 pr-10 text-sm text-foreground transition-all duration-150 focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer ${className}`}
        {...props}
      >
        {children}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-muted-foreground">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  )
}

