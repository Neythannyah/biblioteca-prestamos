import React, { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback(({ title, description, variant = 'info', duration = 4000 }) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`
    const nuevoToast = { id, title, description, variant }

    setToasts(prev => [...prev, nuevoToast])

    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
      }, duration)
    }

    return id
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const toast = {
    success: (title, description) => addToast({ title, description, variant: 'success' }),
    error: (title, description) => addToast({ title, description, variant: 'destructive', duration: 5500 }),
    warning: (title, description) => addToast({ title, description, variant: 'warning' }),
    info: (title, description) => addToast({ title, description, variant: 'info' }),
    dismiss: removeToast
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none p-2">
        {toasts.map(t => (
          <div
            key={t.id}
            role="alert"
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border shadow-popover bg-card transition-all duration-200 animate-in slide-in-from-bottom-3 ${
              t.variant === 'destructive'
                ? 'border-destructive/40 text-destructive-foreground'
                : t.variant === 'success'
                ? 'border-success/40'
                : t.variant === 'warning'
                ? 'border-warning/40'
                : 'border-border'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {t.variant === 'success' && <CheckCircle2 className="h-5 w-5 text-success" />}
              {t.variant === 'destructive' && <AlertCircle className="h-5 w-5 text-destructive" />}
              {t.variant === 'warning' && <AlertTriangle className="h-5 w-5 text-warning" />}
              {t.variant === 'info' && <Info className="h-5 w-5 text-primary" />}
            </div>
            <div className="flex-1 min-w-0">
              {t.title && <h5 className="text-sm font-semibold text-foreground">{t.title}</h5>}
              {t.description && <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{t.description}</p>}
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="shrink-0 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast debe ser utilizado dentro de un ToastProvider')
  }
  return context
}

