import React, { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services/index.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [sesion, setSesion] = useState(() => authService.obtenerSesion())
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    async function verificar() {
      try {
        const res = await authService.validarSesion()
        if (res.valida) {
          setSesion(res.sesion)
        } else {
          setSesion(null)
        }
      } catch (err) {
        setSesion(null)
      } finally {
        setCargando(false)
      }
    }
    verificar()
  }, [])

  const login = async (usuario, clave) => {
    const res = await authService.login(usuario, clave)
    setSesion(res)
    return res
  }

  const logout = async () => {
    await authService.logout()
    setSesion(null)
  }

  return (
    <AuthContext.Provider value={{ sesion, estaAutenticado: Boolean(sesion?.token), cargando, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider')
  }
  return context
}

