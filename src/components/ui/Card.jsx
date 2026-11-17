import React from 'react'

export function Card({ children, className = '', ...props }) {
  return (
    <div
      className={`bg-card text-card-foreground rounded-3xl border border-border shadow-subtle overflow-hidden transition-all duration-200 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '', ...props }) {
  return (
    <div className={`p-6 pb-3 ${className}`} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className = '', ...props }) {
  return (
    <h3 className={`text-lg font-semibold tracking-tight text-foreground ${className}`} {...props}>
      {children}
    </h3>
  )
}

export function CardDescription({ children, className = '', ...props }) {
  return (
    <p className={`text-xs text-muted-foreground mt-1 ${className}`} {...props}>
      {children}
    </p>
  )
}

export function CardContent({ children, className = '', ...props }) {
  return (
    <div className={`p-6 pt-3 ${className}`} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({ children, className = '', ...props }) {
  return (
    <div className={`p-6 pt-0 flex items-center justify-between border-t border-border/50 mt-2 ${className}`} {...props}>
      {children}
    </div>
  )
}

