import React, { useEffect } from 'react'
import { X } from 'lucide-react'

export function Dialog({
  open = false,
  onClose,
  title,
  description,
  children,
  maxWidth = 'max-w-lg',
  className = ''
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && open && onClose) {
        onClose()
      }
    }
    if (open) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#3B2F27]/30 backdrop-blur-sm transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div
        role="dialog"
        aria-modal="true"
        className={`relative w-full ${maxWidth} rounded-3xl bg-card border border-border p-6 shadow-popover z-10 animate-in fade-in zoom-in-95 duration-150 ${className}`}
      >
        <div className="flex items-start justify-between gap-4 pb-3">
          <div>
            {title && <h2 className="text-lg font-semibold text-foreground tracking-tight">{title}</h2>}
            {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Cerrar modal"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="mt-2">{children}</div>
      </div>
    </div>
  )
}

export function AlertDialog({
  open = false,
  onClose,
  onConfirm,
  title = '¿Confirmar acción?',
  description = 'Esta acción no se puede deshacer.',
  confirmText = 'Continuar',
  cancelText = 'Cancelar',
  variant = 'destructive',
  loading = false
}) {
  return (
    <Dialog open={open} onClose={onClose} title={title} description={description} maxWidth="max-w-md">
      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="rounded-full px-4 py-2 text-sm font-medium border border-border bg-card text-foreground hover:bg-muted transition-colors disabled:opacity-50"
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className={`rounded-full px-5 py-2 text-sm font-medium text-white transition-opacity disabled:opacity-50 ${
            variant === 'destructive' ? 'bg-destructive hover:opacity-90' : 'bg-primary hover:bg-primary-hover'
          }`}
        >
          {loading ? 'Procesando...' : confirmText}
        </button>
      </div>
    </Dialog>
  )
}

