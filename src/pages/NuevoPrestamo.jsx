import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  PlusCircle,
  Search,
  UserCheck,
  BookOpen,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Printer,
  Download,
  ArrowRight,
  ShieldAlert,
  RotateCcw
} from 'lucide-react'
import { usuarioService, libroService, prestamoService, configService, feriadoService } from '../services/index.js'
import { Button } from '../components/ui/Button.jsx'
import { Input } from '../components/ui/Input.jsx'
import { Label } from '../components/ui/Label.jsx'
import { Badge } from '../components/ui/Badge.jsx'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card.jsx'
import { Dialog } from '../components/ui/Dialog.jsx'
import { useToast } from '../components/ui/Toast.jsx'
import { calcularFechaVencimiento } from '../domain/prestamos.js'
import { formatoFecha, formatoFechaHora } from '../utils/formatters.js'
import jsPDF from 'jspdf'

export function NuevoPrestamo() {
  const navigate = useNavigate()
  const toast = useToast()

  // Paso 1: Usuario
  const [busquedaUsuario, setBusquedaUsuario] = useState('')
  const [usuariosDisponibles, setUsuariosDisponibles] = useState([])
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null)

  // Paso 2: Libro
  const [busquedaLibro, setBusquedaLibro] = useState('')
  const [librosDisponibles, setLibrosDisponibles] = useState([])
  const [libroSeleccionado, setLibroSeleccionado] = useState(null)

  // Paso 3: Confirmación
  const [fechaPrestamo, setFechaPrestamo] = useState(new Date().toISOString().split('T')[0])
  const [fechaVencimientoCalculada, setFechaVencimientoCalculada] = useState('')
  const [procesando, setProcesando] = useState(false)
  const [errorBloqueo403, setErrorBloqueo403] = useState(null)

  // Comprobante emitido
  const [comprobanteModal, setComprobanteModal] = useState(null)

  // Cargar usuarios al escribir
  useEffect(() => {
    async function buscarUsuarios() {
      try {
        const res = await usuarioService.listar({ busqueda: busquedaUsuario })
        setUsuariosDisponibles(res.slice(0, 6))
      } catch (err) {
        console.error(err)
      }
    }
    buscarUsuarios()
  }, [busquedaUsuario])

  // Cargar libros disponibles al escribir
  useEffect(() => {
    async function buscarLibros() {
      try {
        const res = await libroService.listar({
          busqueda: busquedaLibro,
          estado: 'Disponible'
        })
        setLibrosDisponibles(res.slice(0, 6))
      } catch (err) {
        console.error(err)
      }
    }
    buscarLibros()
  }, [busquedaLibro])

  // Recalcular fecha de vencimiento cuando cambia el usuario o la fecha de préstamo
  useEffect(() => {
    if (usuarioSeleccionado) {
      const feriados = feriadoService.obtenerFeriados()
      const config = configService.obtenerConfig()
      const plazos = {
        Estudiante: config.plazoEstudiante || 5,
        Docente: config.plazoDocente || 10
      }
      const vto = calcularFechaVencimiento(fechaPrestamo, usuarioSeleccionado.tipo, feriados, plazos)
      setFechaVencimientoCalculada(vto)
    } else {
      setFechaVencimientoCalculada('')
    }
  }, [usuarioSeleccionado, fechaPrestamo])

  // Clic 1: Seleccionar Usuario
  const seleccionarUsuario = (u) => {
    setErrorBloqueo403(null)
    setUsuarioSeleccionado(u)
    if (u.estado === 'Bloqueado') {
      setErrorBloqueo403(`Error 403 (Acceso Denegado): El usuario se encuentra bloqueado. Motivo: ${u.motivo_bloqueo || 'Sanciones o morosidad activa'}`)
    }
  }

  // Clic 2: Seleccionar Libro
  const seleccionarLibro = (l) => {
    setLibroSeleccionado(l)
  }

  // Clic 3: Confirmar Préstamo
  const handleConfirmarPrestamo = async () => {
    if (!usuarioSeleccionado || !libroSeleccionado) return

    setProcesando(true)
    setErrorBloqueo403(null)

    try {
      const res = await prestamoService.crear({
        usuarioId: usuarioSeleccionado.id,
        libroId: libroSeleccionado.id,
        fechaPrestamo
      })

      toast.success(
        'Préstamo emitido con éxito',
        `Código: ${res.prestamo.codigo} con vencimiento el ${formatoFecha(res.prestamo.fecha_vencimiento)}`
      )

      setComprobanteModal(res.comprobante)
    } catch (err) {
      // Captura y muestra clara del Error 403 usuario bloqueado o sin aptitud
      setErrorBloqueo403(err.message || 'No se pudo completar el préstamo.')
      toast.error('Préstamo Rechazado', err.message)
    } finally {
      setProcesando(false)
    }
  }

  const descargarComprobantePDF = () => {
    if (!comprobanteModal) return

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a6'
    })

    const primaryRgb = [107, 79, 58]
    const textRgb = [59, 47, 39]

    // Cabecera comprobante
    doc.setFillColor(...primaryRgb)
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), 45, 'F')

    doc.setTextColor(250, 246, 239)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('COMPROBANTE DE PRÉSTAMO', 20, 28)

    doc.setTextColor(...textRgb)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(`N°: ${comprobanteModal.codigoPrestamo}`, 20, 65)
    doc.text(`Emisión: ${formatoFechaHora(comprobanteModal.fechaEmision)}`, 20, 78)

    doc.setDrawColor(232, 223, 208)
    doc.line(20, 90, doc.internal.pageSize.getWidth() - 20, 90)

    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('DATOS DEL USUARIO', 20, 108)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text(`Nombre: ${comprobanteModal.usuarioNombre}`, 20, 122)
    doc.text(`RUT: ${comprobanteModal.usuarioRut} (${comprobanteModal.usuarioTipo})`, 20, 134)

    doc.line(20, 146, doc.internal.pageSize.getWidth() - 20, 146)

    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('DETALLE DEL LIBRO', 20, 164)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text(`Título: ${comprobanteModal.libroTitulo}`, 20, 178)
    doc.text(`Código: ${comprobanteModal.libroCodigo}`, 20, 190)

    doc.line(20, 202, doc.internal.pageSize.getWidth() - 20, 202)

    doc.setFillColor(242, 235, 221)
    doc.roundedRect(20, 215, doc.internal.pageSize.getWidth() - 40, 48, 6, 6, 'F')

    doc.setTextColor(...primaryRgb)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text('FECHA LÍMITE DE DEVOLUCIÓN:', 30, 233)
    doc.setFontSize(13)
    doc.text(`${formatoFecha(comprobanteModal.fechaVencimiento)}`, 30, 252)

    doc.setTextColor(138, 123, 108)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'italic')
    doc.text(
      'Plazo: ' + comprobanteModal.plazoDiasHabiles + ' días hábiles. La entrega tardía genera $1.000 por día hábil.',
      20,
      285,
      { maxWidth: doc.internal.pageSize.getWidth() - 40 }
    )

    doc.save(`Comprobante_${comprobanteModal.codigoPrestamo}.pdf`)
  }

  const reiniciarFlujo = () => {
    setUsuarioSeleccionado(null)
    setLibroSeleccionado(null)
    setErrorBloqueo403(null)
    setComprobanteModal(null)
    setBusquedaUsuario('')
    setBusquedaLibro('')
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Nuevo Préstamo de Libro
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Flujo ágil en un máximo de 3 clics (RF4, RNF4)
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={reiniciarFlujo} className="gap-1.5">
          <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
          <span>Limpiar Selección</span>
        </Button>
      </div>

      {/* Alerta de Error 403 / Bloqueo si aplica */}
      {errorBloqueo403 && (
        <div
          role="alert"
          className="p-4 rounded-3xl bg-destructive/10 border border-destructive/30 text-destructive flex items-start gap-3 shadow-subtle animate-in fade-in duration-150"
        >
          <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold">Operación Bloqueada (Error 403)</h4>
            <p className="text-xs leading-relaxed">{errorBloqueo403}</p>
          </div>
        </div>
      )}

      {/* Grid de Bento Cards para el Flujo de 3 Clics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* PASO 1: Clic 1 -> Seleccionar Usuario */}
        <Card className={`transition-all ${usuarioSeleccionado ? 'border-primary/60 bg-card' : 'border-border'}`}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                Clic 1
              </span>
              {usuarioSeleccionado && (
                <CheckCircle2 className="h-4 w-4 text-success" />
              )}
            </div>
            <CardTitle className="text-base mt-2">1. Seleccionar Usuario</CardTitle>
            <CardDescription>Busca por RUT, nombre o correo institucional.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="RUT o nombre..."
                value={busquedaUsuario}
                onChange={(e) => setBusquedaUsuario(e.target.value)}
                className="pl-8 h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {usuariosDisponibles.map((u) => {
                const seleccionado = usuarioSeleccionado?.id === u.id
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => seleccionarUsuario(u)}
                    className={`w-full text-left p-2.5 rounded-2xl border transition-all text-xs flex flex-col gap-0.5 ${
                      seleccionado
                        ? 'border-primary bg-primary-light/60 font-medium'
                        : 'border-border/60 hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground truncate">{u.nombre}</span>
                      {u.estado === 'Habilitado' ? (
                        <Badge variant="success" className="text-[9px] px-1.5 py-0">Habilitado</Badge>
                      ) : (
                        <Badge variant="destructive" className="text-[9px] px-1.5 py-0">Bloqueado</Badge>
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground flex justify-between">
                      <span>{u.rut}</span>
                      <span>{u.tipo} ({u.tipo === 'Docente' ? '10d' : '5d'})</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* PASO 2: Clic 2 -> Seleccionar Libro */}
        <Card className={`transition-all ${libroSeleccionado ? 'border-primary/60 bg-card' : 'border-border'}`}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                Clic 2
              </span>
              {libroSeleccionado && (
                <CheckCircle2 className="h-4 w-4 text-success" />
              )}
            </div>
            <CardTitle className="text-base mt-2">2. Seleccionar Libro</CardTitle>
            <CardDescription>Solo ejemplares con estado Disponible.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Título, autor o código..."
                value={busquedaLibro}
                onChange={(e) => setBusquedaLibro(e.target.value)}
                className="pl-8 h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {librosDisponibles.map((l) => {
                const seleccionado = libroSeleccionado?.id === l.id
                return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => seleccionarLibro(l)}
                    className={`w-full text-left p-2.5 rounded-2xl border transition-all text-xs flex flex-col gap-0.5 ${
                      seleccionado
                        ? 'border-primary bg-primary-light/60 font-medium'
                        : 'border-border/60 hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground truncate">{l.titulo}</span>
                      <span className="font-mono text-[10px] text-primary">{l.codigo}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {l.autor} ({l.anio})
                    </div>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* PASO 3: Clic 3 -> Confirmar Préstamo */}
        <Card className="border-border flex flex-col justify-between">
          <div>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                  Clic 3
                </span>
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <CardTitle className="text-base mt-2">3. Confirmar Préstamo</CardTitle>
              <CardDescription>Cálculo automático de plazo y fecha hábil.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 rounded-2xl bg-muted/50 border border-border/60 space-y-2 text-xs">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                    Usuario
                  </span>
                  <p className="font-semibold text-foreground truncate">
                    {usuarioSeleccionado ? `${usuarioSeleccionado.nombre} (${usuarioSeleccionado.tipo})` : 'Ninguno seleccionado'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                    Libro
                  </span>
                  <p className="font-semibold text-foreground truncate">
                    {libroSeleccionado ? `${libroSeleccionado.titulo} [${libroSeleccionado.codigo}]` : 'Ninguno seleccionado'}
                  </p>
                </div>
                <div className="pt-2 border-t border-border/40">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                    Fecha Vencimiento Estimada
                  </span>
                  <p className="text-sm font-bold text-primary mt-0.5">
                    {fechaVencimientoCalculada ? formatoFecha(fechaVencimientoCalculada) : 'Seleccione usuario'}
                  </p>
                  {usuarioSeleccionado && (
                    <span className="text-[10px] text-muted-foreground block mt-0.5">
                      {usuarioSeleccionado.tipo === 'Docente' ? '10 días hábiles sin feriados' : '5 días hábiles sin feriados'}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </div>

          <div className="p-6 pt-0">
            <Button
              variant="primary"
              onClick={handleConfirmarPrestamo}
              disabled={!usuarioSeleccionado || !libroSeleccionado || usuarioSeleccionado.estado === 'Bloqueado' || procesando}
              loading={procesando}
              className="w-full h-11 text-sm font-semibold shadow-subtle"
            >
              <CheckCircle2 className="h-4 w-4 mr-1.5" />
              <span>Confirmar Préstamo</span>
            </Button>
          </div>
        </Card>
      </div>

      {/* Modal Comprobante Emitido */}
      <Dialog
        open={Boolean(comprobanteModal)}
        onClose={() => {
          setComprobanteModal(null)
          reiniciarFlujo()
        }}
        title="Comprobante de Préstamo Emitido"
        description="El préstamo ha sido registrado satisfactoriamente en el sistema."
      >
        {comprobanteModal && (
          <div className="space-y-4 mt-2">
            <div className="p-4 rounded-3xl bg-secondary/40 border border-border space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <span className="font-mono font-bold text-primary text-sm">
                  {comprobanteModal.codigoPrestamo}
                </span>
                <Badge variant="success">Préstamo Activo</Badge>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] uppercase text-muted-foreground font-bold block">
                    Lector
                  </span>
                  <p className="font-medium">{comprobanteModal.usuarioNombre}</p>
                  <p className="text-[11px] text-muted-foreground">{comprobanteModal.usuarioRut}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-muted-foreground font-bold block">
                    Ejemplar
                  </span>
                  <p className="font-medium">{comprobanteModal.libroTitulo}</p>
                  <p className="text-[11px] font-mono text-muted-foreground">{comprobanteModal.libroCodigo}</p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-card border border-border/60 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase text-muted-foreground font-bold block">
                    Fecha Límite de Devolución
                  </span>
                  <span className="text-base font-bold text-primary">
                    {formatoFecha(comprobanteModal.fechaVencimiento)}
                  </span>
                </div>
                <div className="text-right text-[11px] text-muted-foreground">
                  Plazo: {comprobanteModal.plazoDiasHabiles} días hábiles
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-3 border-t border-border/60">
              <Button
                variant="outline"
                size="sm"
                onClick={descargarComprobantePDF}
                className="w-full sm:w-auto gap-1.5"
              >
                <Download className="h-4 w-4" />
                <span>Descargar PDF</span>
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setComprobanteModal(null)
                  reiniciarFlujo()
                }}
                className="w-full sm:w-auto"
              >
                Continuar
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  )
}

