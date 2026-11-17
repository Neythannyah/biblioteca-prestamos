import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  BookOpen,
  Users,
  ArrowRightLeft,
  Undo2,
  AlertTriangle,
  BarChart3,
  Settings,
  PlusCircle,
  Library,
  X
} from 'lucide-react'

const GRUPOS_NAV = [
  {
    titulo: 'Principal',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/prestamos/nuevo', label: 'Nuevo Préstamo', icon: PlusCircle, badge: 'Rápido' }
    ]
  },
  {
    titulo: 'Operación & Catálogo',
    items: [
      { to: '/libros', label: 'Catálogo de Libros', icon: BookOpen },
      { to: '/usuarios', label: 'Gestión de Usuarios', icon: Users },
      { to: '/prestamos', label: 'Préstamos Activos', icon: ArrowRightLeft },
      { to: '/devoluciones', label: 'Devoluciones', icon: Undo2 }
    ]
  },
  {
    titulo: 'Control & Finanzas',
    items: [
      { to: '/multas', label: 'Multas y Sanciones', icon: AlertTriangle },
      { to: '/reportes', label: 'Reportes y Auditoría', icon: BarChart3 }
    ]
  },
  {
    titulo: 'Administración',
    items: [
      { to: '/configuracion', label: 'Configuración', icon: Settings }
    ]
  }
]

export function Sidebar({ abierto = false, onCerrar }) {
  return (
    <>
      {/* Backdrop para móvil */}
      {abierto && (
        <div
          className="fixed inset-0 z-40 bg-[#3B2F27]/30 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onCerrar}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-72 bg-card border-r border-border p-5 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          abierto ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full overflow-y-auto pr-1">
          {/* Logo y Encabezado de la App */}
          <div className="flex items-center justify-between pb-6 border-b border-border/60">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-subtle">
                <Library className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-foreground tracking-tight leading-tight">
                  BiblioPréstamo
                </h1>
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">
                  Sistema de Gestión
                </span>
              </div>
            </div>

            {/* Botón cerrar en móvil */}
            <button
              type="button"
              onClick={onCerrar}
              className="lg:hidden p-1.5 rounded-full text-muted-foreground hover:bg-muted transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Menú de navegación agrupado estilo Bento Card */}
          <nav className="mt-6 flex-1 space-y-6">
            {GRUPOS_NAV.map((grupo, idx) => (
              <div key={idx} className="bg-muted/40 p-2.5 rounded-2xl border border-border/40">
                <div className="px-2 pb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {grupo.titulo}
                </div>
                <div className="space-y-1">
                  {grupo.items.map((item) => {
                    const Icon = item.icon
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={onCerrar}
                        className={({ isActive }) =>
                          `flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 ${
                            isActive
                              ? 'bg-primary text-primary-foreground font-semibold shadow-subtle'
                              : 'text-foreground/80 hover:bg-card hover:text-foreground'
                          }`
                        }
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className="h-4 w-4 shrink-0" />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-semibold">
                            {item.badge}
                          </span>
                        )}
                      </NavLink>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Tarjeta inferior informativa */}
        <div className="pt-4 mt-auto border-t border-border/60">
          <div className="p-3 rounded-2xl bg-secondary/50 border border-border/40 flex items-center justify-between">
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Operador
              </span>
              <p className="text-xs font-semibold text-foreground truncate">Encargado de Biblioteca</p>
            </div>
            <div className="h-2 w-2 rounded-full bg-success"></div>
          </div>
        </div>
      </aside>
    </>
  )
}

