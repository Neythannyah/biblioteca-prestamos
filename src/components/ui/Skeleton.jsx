import React from 'react'

export function Skeleton({ className = '', ...props }) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-muted/80 ${className}`}
      {...props}
    />
  )
}

