import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  Undo2,
  Search,
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  UserX,
  BookCheck,
  Calendar,
  ArrowRight
} from 'lucide-react'
import { prestamoService, configService, feriadoService } from '../services/index.js'
import { Button } from '../components/ui/Button.jsx'
import { Input } from '../components/ui/Input.jsx'
import { Label } from '../components/ui/Label.jsx'
import { Badge } from '../components/ui/Badge.jsx'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card.jsx'
import { Dialog } from '../components/ui/Dialog.jsx'
import { useToast } from '../components/ui/Toast.jsx'
import { calcularLiquidacionPrestamo } from '../domain/multas.js'
import { formatoCLP, formatoFecha } from '../utils/formatters.js'

export function Devoluciones() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const toast = useToast()

  const [prestamosActivos, setPrestamosActivos] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [prestamoSeleccionado, setPrestamoSeleccionado] = useState(null)
  const [fechaDevolucion, setFechaDevolucion] = useState(new Date().toISOString().split('T')[0])
  const [procesando, setProcesando] = useState(false)

  // Resultado de la devolución procesada
  const [resultadoModal, setResultadoModal] = useState(null)

  const prestamoIdParam = searchParams.get('prestamoId')

  const cargarActivos = async () => {
    try {
      const res = await prestamoService.listar({ estado: 'Activo' })
      setPrestamosActivos(res)

      if (prestamoIdParam) {
        const encontrado = res.find(p => p.id === prestamoIdParam)
        if (encontrado) setPrestamoSeleccionado(encontrado)
      }
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    cargarActivos()
  }, [prestamoIdParam])

  // Filtrado de préstamos activos
  const prestamosFiltrados = prestamosActivos.filter(p => {
    if (!busqueda) return true
    const q = busqueda.toLowerCase()
    return (
      p.codigo.toLowerCase().includes(q) ||
      p.libro_titulo.toLowerCase().includes(q) ||
      p.usuario_nombre.toLowerCase().includes(q) ||
      p.usuario_rut.toLowerCase().includes(q)
    )
  })

  // Cálculo en vivo de liquidación para el préstamo seleccionado según la fecha elegida
  const feriados = feriadoService.obtenerFeriados()
  const config = configService.obtenerConfig()
  const liquidacionEstimada = prestamoSeleccionado
    ? calcularLiquidacionPrestamo(prestamoSeleccionado, fechaDevolucion, feriados, config)
    : null

  const handleRegistrarDevolucion = async () => {
    if (!prestamoSeleccionado) return
    setProcesando(true)

    try {
      const res = await prestamoService.registrarDevolucion(
        prestamoSeleccionado.id,
        fechaDevolucion
      )

      setResultadoModal({
        prestamo: res.prestamo,
        liquidacion: res.liquidacion
      })

      if (res.liquidacion.tieneAtraso) {
        toast.warning(
          'Devolución con Atraso',
          `Se generó una multa de ${formatoCLP(res.liquidacion.monto)} por ${res.liquidacion.diasAtraso} días hábiles de retraso.`
        )
      } else {
        toast.success(
          'Devolución Exitosa',
          `El libro "${res.prestamo.libro_titulo}" se encuentra nuevamente disponible.`
        )
      }

      setPrestamoSeleccionado(null)
      cargarActivos()
    } catch (err) {
      toast.error('Error al registrar devolución', err.message)
    } finally {
      setProcesando(false)
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Registro de Devoluciones
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Recepción de ejemplares y cálculo de sanciones por atraso (RF9)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Selector de Préstamo Activo */}
        <Card className="md:col-span-7 flex flex-col justify-between">
          <div>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Undo2 className="h-4 w-4 text-primary" />
                1. Seleccionar Préstamo Activo
              </CardTitle>
              <CardDescription>
                Localiza el préstamo por nombre del usuario, libro o código
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar préstamo activo..."
                  className="pl-9 h-10 text-xs"
                />
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {prestamosFiltrados.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    No hay préstamos activos que coincidan con la búsqueda.
                  </div>
                ) : (
                  prestamosFiltrados.map((p) => {
                    const seleccionado = prestamoSeleccionado?.id === p.id
                    return (
                      <div
                        key={p.id}
                        onClick={() => setPrestamoSeleccionado(p)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                          seleccionado
                            ? 'border-primary bg-primary-light/60 shadow-subtle'
                            : 'border-border/60 hover:bg-muted/40'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <span className="font-semibold text-xs text-foreground block truncate">
                              {p.libro_titulo}
                            </span>
                            <span className="text-[11px] text-muted-foreground block truncate">
                              Lector: {p.usuario_nombre} ({p.usuario_rut})
                            </span>
                          </div>
                          <span className="font-mono text-[10px] text-primary font-bold shrink-0">
                            {p.codigo}
                          </span>
                        </div>
                        <div className="mt-2 pt-2 border-t border-border/40 flex items-center justify-between text-[11px]">
                          <span className="text-muted-foreground">
                            Prestado: {formatoFecha(p.fecha_prestamo)}
                          </span>
                          <span className="font-semibold text-foreground">
                            Límite: {formatoFecha(p.fecha_vencimiento)}
                          </span>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </CardContent>
          </div>
        </Card>

        {/* Liquidación y Confirmación */}
        <Card className="md:col-span-5 flex flex-col justify-between">
          <div>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                2. Liquidación y Retorno
              </CardTitle>
              <CardDescription>
                Verificación de plazos y cálculo de multa
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="fechaDevolucion" required>
                  Fecha de Devolución
                </Label>
                <Input
                  id="fechaDevolucion"
                  type="date"
                  value={fechaDevolucion}
                  onChange={(e) => setFechaDevolucion(e.target.value)}
                  className="h-10 text-xs"
                />
                <span className="text-[10px] text-muted-foreground mt-1 block">
                  Puedes modificar la fecha para simular entregas con atraso.
                </span>
              </div>

              {prestamoSeleccionado && liquidacionEstimada ? (
                <div className="p-4 rounded-3xl bg-muted/60 border border-border/60 space-y-3 text-xs">
                  <div className="border-b border-border/60 pb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                      Ejemplar a recibir
                    </span>
                    <p className="font-semibold text-foreground text-sm truncate">
                      {prestamoSeleccionado.libro_titulo}
                    </p>
                    <p className="text-muted-foreground text-[11px]">
                      Lector: {prestamoSeleccionado.usuario_nombre}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fecha Vencimiento:</span>
                      <span className="font-semibold">{formatoFecha(prestamoSeleccionado.fecha_vencimiento)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fecha Efectiva:</span>
                      <span className="font-semibold">{formatoFecha(fechaDevolucion)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Días de atraso ({config.modoConteo}):</span>
                      <span className={`font-bold ${liquidacionEstimada.diasAtraso > 0 ? 'text-destructive' : 'text-success'}`}>
                        {liquidacionEstimada.diasAtraso} día(s)
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                        Multa Aplicable
                      </span>
                      <span className={`text-base font-extrabold ${liquidacionEstimada.monto > 0 ? 'text-destructive' : 'text-success'}`}>
                        {formatoCLP(liquidacionEstimada.monto)}
                      </span>
                    </div>
                    <Badge variant={liquidacionEstimada.monto > 0 ? 'destructive' : 'success'}>
                      {liquidacionEstimada.monto > 0 ? 'Con Sanción' : 'A Tiempo'}
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-3xl border border-dashed border-border text-center text-xs text-muted-foreground">
                  Selecciona un préstamo activo del listado para calcular su liquidación.
                </div>
              )}
            </CardContent>
          </div>

          <div className="p-6 pt-0">
            <Button
              variant={liquidacionEstimada?.tieneAtraso ? 'destructive' : 'primary'}
              onClick={handleRegistrarDevolucion}
              disabled={!prestamoSeleccionado || procesando}
              loading={procesando}
              className="w-full h-11 text-sm font-semibold shadow-subtle"
            >
              <BookCheck className="h-4 w-4 mr-2" />
              <span>Registrar Devolución</span>
            </Button>
          </div>
        </Card>
      </div>

      {/* Modal Resultado de Devolución */}
      <Dialog
        open={Boolean(resultadoModal)}
        onClose={() => setResultadoModal(null)}
        title={resultadoModal?.liquidacion.tieneAtraso ? 'Devolución Registrada con Atraso' : 'Devolución Registrada a Tiempo'}
        description="El libro ha sido ingresado al inventario como Disponible."
      >
        {resultadoModal && (
          <div className="space-y-4 mt-2">
            <div className={`p-4 rounded-3xl border ${resultadoModal.liquidacion.tieneAtraso ? 'bg-destructive/10 border-destructive/30' : 'bg-success/10 border-success/30'} space-y-3 text-xs`}>
              <div className="flex items-center gap-2">
                {resultadoModal.liquidacion.tieneAtraso ? (
                  <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                )}
                <div>
                  <h4 className="text-sm font-bold text-foreground">
                    {resultadoModal.prestamo.libro_titulo}
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    Código Préstamo: {resultadoModal.prestamo.codigo}
                  </p>
                </div>
              </div>

              {resultadoModal.liquidacion.tieneAtraso ? (
                <div className="p-3 rounded-2xl bg-card border border-destructive/30 space-y-1.5">
                  <div className="flex justify-between font-semibold text-destructive">
                    <span>Multa Generada:</span>
                    <span>{formatoCLP(resultadoModal.liquidacion.monto)}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Días de atraso calculados: {resultadoModal.liquidacion.diasAtraso} día(s) hábiles.
                  </div>
                  <div className="pt-2 border-t border-border/40 text-[11px] text-destructive flex items-center gap-1.5 font-medium">
                    <UserX className="h-3.5 w-3.5" />
                    <span>El usuario ha sido Bloqueado hasta que pague la multa total.</span>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-card border border-success/30 text-success text-xs font-medium">
                  El préstamo fue entregado dentro del plazo reglamentario. No se registran multas ni sanciones.
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/60">
              {resultadoModal.liquidacion.tieneAtraso && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setResultadoModal(null)
                    navigate('/multas')
                  }}
                >
                  Ir al Módulo de Multas &rarr;
                </Button>
              )}
              <Button
                variant="primary"
                size="sm"
                onClick={() => setResultadoModal(null)}
              >
                Aceptar
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  )
}

