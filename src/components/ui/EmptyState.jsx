import React from 'react'
import { Inbox, BookOpen, AlertCircle } from 'lucide-react'
import { Button } from './Button.jsx'

export function EmptyState({
  icon: Icon = Inbox,
  title = 'No hay registros',
  description = 'No se encontraron elementos que coincidan con la búsqueda o filtro aplicado.',
  actionLabel,
  onAction,
  className = ''
}) {
  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center rounded-3xl border border-dashed border-border bg-card/60 ${className}`}>
      <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground mb-4">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="text-base font-semibold text-foreground tracking-tight">{title}</h3>
      <p className="text-xs text-muted-foreground max-w-sm mt-1.5 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <div className="mt-5">
          <Button variant="secondary" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  )
}

