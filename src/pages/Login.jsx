import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Library, Lock, User, AlertCircle, ArrowRight, ShieldCheck, WifiOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Input } from '../components/ui/Input.jsx'
import { Label } from '../components/ui/Label.jsx'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card.jsx'

export function Login() {
  const [usuario, setUsuario] = useState('')
  const [clave, setClave] = useState('')
  const [error, setError] = useState(null)
  const [cargando, setCargando] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const esSupabase = (import.meta.env.VITE_DATA_SOURCE || 'mock') === 'supabase'
  const from = location.state?.from?.pathname || '/dashboard'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setCargando(true)

    try {
      await login(usuario, clave)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message || 'Mostrar error de acceso: Credenciales inválidas.')
    } finally {
      setCargando(false)
    }
  }

  const autocompletarDemo = () => {
    if (esSupabase) {
      setUsuario('admin@mail.cl')
    } else {
      setUsuario('encargado')
    }
    setClave('Biblioteca2026!')
    setError(null)
  }

  const esFallaConexion = error?.toLowerCase().includes('conexión') || error?.toLowerCase().includes('conexion')

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 sm:p-6">
      {/* Contenedor centralizado estilo Bento Card */}
      <div className="w-full max-w-md space-y-6">
        {/* Cabecera / Identidad */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 rounded-3xl bg-primary text-primary-foreground items-center justify-center shadow-subtle mb-1">
            <Library className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Sistema de Biblioteca
          </h1>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            Portal del Encargado de Biblioteca
          </p>
        </div>

        {/* Tarjeta de Inicio de Sesión */}
        <Card className="shadow-card border-border">
          <CardHeader className="pb-4">
            <CardTitle>Iniciar Sesión</CardTitle>
            <CardDescription>
              Ingresa tus credenciales autorizadas de operador de biblioteca.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div
                role="alert"
                className={`mb-5 p-3.5 rounded-2xl border flex items-start gap-2.5 text-xs font-medium animate-in fade-in duration-150 ${
                  esFallaConexion
                    ? 'bg-warning/10 border-warning/30 text-warning-foreground'
                    : 'bg-destructive/10 border-destructive/30 text-destructive'
                }`}
              >
                {esFallaConexion ? (
                  <WifiOff className="h-4 w-4 shrink-0 mt-0.5 text-warning" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-destructive" />
                )}
                <div className="leading-relaxed">{error}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="usuario" required>
                  {esSupabase ? 'Correo o Usuario' : 'Usuario'}
                </Label>
                <div className="relative">
                  <Input
                    id="usuario"
                    name="usuario"
                    type="text"
                    value={usuario}
                    onChange={(e) => setUsuario(e.target.value)}
                    placeholder={esSupabase ? 'admin@mail.cl o admin' : 'encargado'}
                    required
                    autoFocus
                  />
                  <User className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                </div>
              </div>

              <div>
                <Label htmlFor="clave" required>Contraseña</Label>
                <div className="relative">
                  <Input
                    id="clave"
                    name="clave"
                    type="password"
                    value={clave}
                    onChange={(e) => setClave(e.target.value)}
                    placeholder="••••••••••••"
                    required
                  />
                  <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full h-11"
                  loading={cargando}
                >
                  <span>Ingresar al Sistema</span>
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </form>

            {/* Acceso Rápido para Demostración (visible solo cuando NO sea supabase) */}
            {!esSupabase && (
              <div className="mt-6 pt-5 border-t border-border/60">
                <div className="p-3 rounded-2xl bg-muted/60 border border-border/40 text-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                      Cuenta de prueba
                    </span>
                    <button
                      type="button"
                      onClick={autocompletarDemo}
                      className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                    >
                      Rellenar datos
                    </button>
                  </div>
                  <div className="font-mono text-[11px] text-muted-foreground space-y-0.5">
                    <div>Usuario: <strong className="text-foreground">encargado</strong></div>
                    <div>Clave: <strong className="text-foreground">Biblioteca2026!</strong></div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
