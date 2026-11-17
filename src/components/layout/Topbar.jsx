import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, LogOut, PlusCircle, Search, ShieldCheck, User } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import { DropdownMenu, DropdownMenuItem } from '../ui/DropdownMenu.jsx'
import { Button } from '../ui/Button.jsx'

export function Topbar({ onAbrirMenuMovil }) {
  const { sesion, logout } = useAuth()
  const navigate = useNavigate()

  const handleCerrarSesion = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-30 h-16 bg-background/80 backdrop-blur-md border-b border-border/80 px-4 sm:px-8 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {/* Botón hamburguesa móvil */}
        <button
          type="button"
          onClick={onAbrirMenuMovil}
          className="lg:hidden p-2 rounded-xl text-foreground hover:bg-muted transition-colors"
          aria-label="Abrir menú"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Buscador de acceso rápido */}
        <div className="relative hidden sm:block w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar libros o usuarios..."
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.target.value.trim()) {
                navigate(`/libros?q=${encodeURIComponent(e.target.value.trim())}`)
              }
            }}
            className="w-full h-9 pl-9 pr-4 rounded-full border border-border bg-card/80 text-xs text-foreground placeholder:text-muted-foreground/70 focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Atajo directo para nuevo préstamo */}
        <Button
          size="sm"
          variant="primary"
          onClick={() => navigate('/prestamos/nuevo')}
          className="hidden sm:inline-flex"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Nuevo Préstamo</span>
        </Button>

        {/* Menú del Encargado */}
        <DropdownMenu
          trigger={
            <button
              type="button"
              className="flex items-center gap-2 p-1.5 pl-3 rounded-full border border-border bg-card hover:bg-muted transition-colors text-xs font-medium text-foreground shadow-subtle"
            >
              <div className="flex items-center gap-1.5">
                <span className="hidden md:inline font-semibold">
                  {sesion?.usuario?.nombre || 'Encargado'}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted font-mono uppercase text-muted-foreground">
                  Admin
                </span>
              </div>
              <div className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs">
                E
              </div>
            </button>
          }
        >
          <div className="px-3 py-2 border-b border-border/60">
            <p className="text-xs font-semibold text-foreground">{sesion?.usuario?.nombre}</p>
            <p className="text-[11px] text-muted-foreground truncate">{sesion?.usuario?.correo}</p>
          </div>
          <DropdownMenuItem onClick={() => navigate('/configuracion')}>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            <span>Configuración del Sistema</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleCerrarSesion} destructive>
            <LogOut className="h-4 w-4" />
            <span>Cerrar Sesión</span>
          </DropdownMenuItem>
        </DropdownMenu>
      </div>
    </header>
  )
}

