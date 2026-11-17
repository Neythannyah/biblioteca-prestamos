import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import { ToastProvider } from './components/ui/Toast.jsx'
import { AppShell } from './components/layout/AppShell.jsx'
import { Login } from './pages/Login.jsx'
import { Dashboard } from './pages/Dashboard.jsx'
import { Libros } from './pages/Libros.jsx'
import { Usuarios } from './pages/Usuarios.jsx'
import { Prestamos } from './pages/Prestamos.jsx'
import { NuevoPrestamo } from './pages/NuevoPrestamo.jsx'
import { Devoluciones } from './pages/Devoluciones.jsx'
import { Multas } from './pages/Multas.jsx'
import { Reportes } from './pages/Reportes.jsx'
import { Configuracion } from './pages/Configuracion.jsx'

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Ruta pública */}
            <Route path="/login" element={<Login />} />

            {/* Rutas protegidas dentro de AppShell */}
            <Route path="/" element={<AppShell />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="libros" element={<Libros />} />
              <Route path="usuarios" element={<Usuarios />} />
              <Route path="prestamos" element={<Prestamos />} />
              <Route path="prestamos/nuevo" element={<NuevoPrestamo />} />
              <Route path="devoluciones" element={<Devoluciones />} />
              <Route path="multas" element={<Multas />} />
              <Route path="reportes" element={<Reportes />} />
              <Route path="configuracion" element={<Configuracion />} />
            </Route>

            {/* Redirección por defecto */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App

