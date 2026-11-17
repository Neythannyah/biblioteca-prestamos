import React, { useState, useRef, useEffect } from 'react'

export function DropdownMenu({ trigger, children, align = 'right' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  return (
    <div className="relative inline-block text-left" ref={ref}>
      <div onClick={() => setOpen(!open)}>{trigger}</div>
      {open && (
        <div
          className={`absolute z-40 mt-2 min-w-[12rem] rounded-2xl bg-card border border-border p-1.5 shadow-popover animate-in fade-in-50 zoom-in-95 duration-100 ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {React.Children.map(children, child => {
            if (!React.isValidElement(child)) return child
            return React.cloneElement(child, {
              onClick: (e) => {
                if (child.props.onClick) child.props.onClick(e)
                setOpen(false)
              }
            })
          })}
        </div>
      )}
    </div>
  )
}

export function DropdownMenuItem({ children, onClick, className = '', destructive = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-xl transition-colors text-left ${
        destructive
          ? 'text-destructive hover:bg-destructive/10'
          : 'text-foreground hover:bg-muted'
      } ${className}`}
    >
      {children}
    </button>
  )
}

