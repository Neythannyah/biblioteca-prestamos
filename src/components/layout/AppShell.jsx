import React, { useState, useEffect } from 'react'
import { Outlet, useLocation, Navigate } from 'react-router-dom'
import { Sidebar } from './Sidebar.jsx'
import { Topbar } from './Topbar.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { estadoUsuarioServiceGlobal } from '../../patterns/observer/EstadoUsuarioService.js'
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts.js'

export function AppShell() {
  const [sidebarMovilAbierta, setSidebarMovilAbierta] = useState(false)
  const { estaAutenticado, cargando } = useAuth()
  const location = useLocation()

  // Atajos de teclado globales (Alt + N: Nuevo Préstamo, Ctrl + K: Buscar, etc.)
  useKeyboardShortcuts()

  // Ejecutar verificación de vencimientos al cargar y al cambiar de pantalla (Observer pattern)
  useEffect(() => {
    try {
      estadoUsuarioServiceGlobal.verificarVencimientosGenerales()
    } catch (err) {
      console.warn('Error verificando vencimientos:', err)
    }
  }, [location.pathname])

  if (cargando) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
          <p className="text-xs font-medium text-muted-foreground">Cargando biblioteca...</p>
        </div>
      </div>
    )
  }

  if (!estaAutenticado) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return (
    <div className="min-h-screen bg-background flex text-foreground">
      {/* Sidebar persistente en desktop, drawer en móvil */}
      <Sidebar
        abierto={sidebarMovilAbierta}
        onCerrar={() => setSidebarMovilAbierta(false)}
      />

      {/* Contenido principal */}
      <div className="flex-1 lg:pl-72 flex flex-col min-w-0">
        <Topbar onAbrirMenuMovil={() => setSidebarMovilAbierta(true)} />
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto animate-in fade-in-50 duration-150">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

