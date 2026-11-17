import React from 'react'

export function Table({ children, className = '' }) {
  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-border bg-card">
      <table className={`w-full caption-bottom text-sm text-left ${className}`}>
        {children}
      </table>
    </div>
  )
}

export function TableHeader({ children, className = '' }) {
  return (
    <thead className={`border-b border-border bg-muted/40 ${className}`}>
      {children}
    </thead>
  )
}

export function TableBody({ children, className = '' }) {
  return (
    <tbody className={`divide-y divide-border/60 ${className}`}>
      {children}
    </tbody>
  )
}

export function TableRow({ children, className = '', onClick, ...props }) {
  return (
    <tr
      onClick={onClick}
      className={`transition-colors hover:bg-muted/30 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      {...props}
    >
      {children}
    </tr>
  )
}

export function TableHead({ children, className = '', ...props }) {
  return (
    <th
      className={`h-11 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground align-middle ${className}`}
      {...props}
    >
      {children}
    </th>
  )
}

export function TableCell({ children, className = '', ...props }) {
  return (
    <td className={`p-4 align-middle text-sm text-foreground ${className}`} {...props}>
      {children}
    </td>
  )
}

export function TablePagination({
  paginaActual = 1,
  totalPaginas = 1,
  totalItems = 0,
  itemsPorPagina = 10,
  onCambiarPagina
}) {
  const inicio = totalItems === 0 ? 0 : (paginaActual - 1) * itemsPorPagina + 1
  const fin = Math.min(paginaActual * itemsPorPagina, totalItems)

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2 py-3 text-xs text-muted-foreground">
      <div>
        Mostrando <span className="font-medium text-foreground">{inicio}</span> a{' '}
        <span className="font-medium text-foreground">{fin}</span> de{' '}
        <span className="font-medium text-foreground">{totalItems}</span> registros
      </div>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={paginaActual <= 1}
          onClick={() => onCambiarPagina(paginaActual - 1)}
          className="rounded-full px-3 py-1.5 border border-border bg-card text-foreground hover:bg-muted disabled:opacity-40 transition-colors"
        >
          Anterior
        </button>
        <span className="px-2">
          Página {paginaActual} de {Math.max(1, totalPaginas)}
        </span>
        <button
          type="button"
          disabled={paginaActual >= totalPaginas}
          onClick={() => onCambiarPagina(paginaActual + 1)}
          className="rounded-full px-3 py-1.5 border border-border bg-card text-foreground hover:bg-muted disabled:opacity-40 transition-colors"
        >
          Siguiente
        </button>
      </div>
    </div>
  )
}

