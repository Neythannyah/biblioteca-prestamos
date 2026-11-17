import React, { useState, useEffect } from 'react'
import {
  AlertTriangle,
  Search,
  Filter,
  DollarSign,
  CheckCircle2,
  Receipt,
  Download,
  Calendar,
  ShieldCheck,
  Clock,
  Printer
} from 'lucide-react'
import { multaService, prestamoService, configService, feriadoService } from '../services/index.js'
import { Button } from '../components/ui/Button.jsx'
import { Input } from '../components/ui/Input.jsx'
import { Select } from '../components/ui/Select.jsx'
import { Badge } from '../components/ui/Badge.jsx'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card.jsx'
import { Dialog, AlertDialog } from '../components/ui/Dialog.jsx'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TablePagination } from '../components/ui/Table.jsx'
import { EmptyState } from '../components/ui/EmptyState.jsx'
import { Skeleton } from '../components/ui/Skeleton.jsx'
import { useToast } from '../components/ui/Toast.jsx'
import { estaVencido } from '../domain/prestamos.js'
import { calcularLiquidacionPrestamo } from '../domain/multas.js'
import { formatoCLP, formatoFecha, formatoFechaHora } from '../utils/formatters.js'
import jsPDF from 'jspdf'

export function Multas() {
  const [multas, setMultas] = useState([])
  const [multasEstimadas, setMultasEstimadas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('Pendiente') // Pendiente por defecto
  const [pagina, setPagina] = useState(1)
  const itemsPorPagina = 8

  // Pago
  const [multaParaPagar, setMultaParaPagar] = useState(null)
  const [pagando, setPagando] = useState(false)
  const [comprobanteEmitido, setComprobanteEmitido] = useState(null)

  const toast = useToast()

  const cargarDatos = async () => {
    try {
      setCargando(true)
      const resMultas = await multaService.listar({
        busqueda,
        estado: filtroEstado === 'estimadas' ? 'todos' : filtroEstado
      })
      setMultas(resMultas)

      // Calcular multas estimadas acumuladas de préstamos vencidos no devueltos aún (en vivo)
      const activos = await prestamoService.listar({ estado: 'Activo' })
      const hoy = new Date()
      const feriados = feriadoService.obtenerFeriados()
      const config = configService.obtenerConfig()

      const estimadas = activos
        .filter(p => estaVencido(p, hoy))
        .map(p => {
          const liq = calcularLiquidacionPrestamo(p, hoy, feriados, config)
          return {
            ...p,
            dias_retraso: liq.diasAtraso,
            monto_acumulado: liq.monto
          }
        })
      setMultasEstimadas(estimadas)

      setPagina(1)
    } catch (err) {
      toast.error('Error al cargar multas', err.message)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [busqueda, filtroEstado])

  const handlePagarClick = (multa) => {
    setMultaParaPagar(multa)
  }

  const confirmarPagoTotal = async () => {
    if (!multaParaPagar) return
    setPagando(true)

    try {
      const res = await multaService.registrarPagoTotal(multaParaPagar.id)
      toast.success(
        'Pago Registrado Exitosamente',
        `Se emitió el comprobante ${res.comprobante.numeroComprobante} por ${res.comprobante.montoPagadoFormato}.`
      )
      setComprobanteEmitido(res.comprobante)
      setMultaParaPagar(null)
      cargarDatos()
    } catch (err) {
      toast.error('Error al registrar pago', err.message)
      setMultaParaPagar(null)
    } finally {
      setPagando(false)
    }
  }

  const descargarComprobantePDF = () => {
    if (!comprobanteEmitido) return

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a6'
    })

    const primaryRgb = [107, 79, 58]
    const textRgb = [59, 47, 39]

    doc.setFillColor(...primaryRgb)
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), 45, 'F')

    doc.setTextColor(250, 246, 239)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('RECIBO DE PAGO DE MULTA', 20, 28)

    doc.setTextColor(...textRgb)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(`Recibo N°: ${comprobanteEmitido.numeroComprobante}`, 20, 65)
    doc.text(`Fecha/Hora: ${formatoFechaHora(comprobanteEmitido.fechaEmision)}`, 20, 78)

    doc.setDrawColor(232, 223, 208)
    doc.line(20, 90, doc.internal.pageSize.getWidth() - 20, 90)

    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('DATOS DEL PAGADOR', 20, 108)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text(`Nombre: ${comprobanteEmitido.usuarioNombre}`, 20, 122)
    doc.text(`RUT: ${comprobanteEmitido.usuarioRut}`, 20, 134)

    doc.line(20, 146, doc.internal.pageSize.getWidth() - 20, 146)

    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('CONCEPTO DE SANCION', 20, 164)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text(`Multa Código: ${comprobanteEmitido.multaCodigo}`, 20, 178)
    doc.text(`Libro: ${comprobanteEmitido.libroTitulo}`, 20, 190)
    doc.text(`Días de atraso liquidados: ${comprobanteEmitido.diasAtraso} día(s) hábiles`, 20, 202)

    doc.setFillColor(240, 244, 232) // Soft success
    doc.roundedRect(20, 215, doc.internal.pageSize.getWidth() - 40, 50, 6, 6, 'F')

    doc.setTextColor(107, 127, 78) // oliva apagado
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text('TOTAL PAGADO (PAGO TOTAL):', 30, 233)
    doc.setFontSize(14)
    doc.text(`${comprobanteEmitido.montoPagadoFormato}`, 30, 252)

    doc.setTextColor(138, 123, 108)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text(`Atendido por: ${comprobanteEmitido.cajero}`, 20, 285)

    doc.save(`Recibo_${comprobanteEmitido.numeroComprobante}.pdf`)
  }

  // Cálculos de totales
  const totalMultasPendientes = multas
    .filter(m => m.estado === 'Pendiente')
    .reduce((acc, m) => acc + (m.monto || 0), 0)

  const totalMultasEstimadas = multasEstimadas
    .reduce((acc, p) => acc + p.monto_acumulado, 0)

  // Paginación
  const totalPaginas = Math.ceil(multas.length / itemsPorPagina)
  const multasPaginadas = multas.slice(
    (pagina - 1) * itemsPorPagina,
    pagina * itemsPorPagina
  )

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Multas y Sanciones
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Registro de cobros y recaudación por retraso de préstamos (RF6, RF7)
          </p>
        </div>
      </div>

      {/* Resumen Bento de Saldos */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-card border border-border">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Multas Registradas Pendientes
            </span>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </div>
          <div className="text-2xl font-extrabold text-foreground mt-1">
            {formatoCLP(totalMultasPendientes)}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {multas.filter(m => m.estado === 'Pendiente').length} multa(s) por cobrar
          </p>
        </Card>

        <Card className="p-4 bg-card border border-border">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Multas Estimadas en Vivo
            </span>
            <Clock className="h-4 w-4 text-destructive" />
          </div>
          <div className="text-2xl font-extrabold text-destructive mt-1">
            {formatoCLP(totalMultasEstimadas)}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            de {multasEstimadas.length} préstamo(s) aún no devueltos
          </p>
        </Card>

        <Card className="p-4 bg-primary text-primary-foreground border-transparent">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">
              Total Deuda Proyectada
            </span>
            <DollarSign className="h-4 w-4 text-secondary" />
          </div>
          <div className="text-2xl font-extrabold mt-1">
            {formatoCLP(totalMultasPendientes + totalMultasEstimadas)}
          </div>
          <p className="text-[11px] text-secondary/80 mt-0.5">
            monto global pendiente de regularización
          </p>
        </Card>
      </div>

      {/* Barra de Filtros */}
      <div className="p-4 rounded-3xl bg-card border border-border flex flex-col md:flex-row items-center justify-between gap-4 shadow-subtle">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por código, usuario o libro..."
            className="pl-9 h-10"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
            <Select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="h-10 text-xs w-44"
            >
              <option value="Pendiente">Multas Pendientes</option>
              <option value="Pagada">Multas Pagadas</option>
              <option value="todos">Todas las Registradas</option>
            </Select>
          </div>
        </div>
      </div>

      {/* Tabla de Multas Registradas */}
      {cargando ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : multas.length === 0 ? (
        <EmptyState
          icon={DollarSign}
          title="No hay multas registradas"
          description="No se encontraron registros de multas con el filtro actual."
          actionLabel="Ver todas"
          onAction={() => {
            setBusqueda('')
            setFiltroEstado('todos')
          }}
        />
      ) : (
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Lector / RUT</TableHead>
                <TableHead>Ejemplar</TableHead>
                <TableHead>Días Atraso</TableHead>
                <TableHead>Monto CLP</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {multasPaginadas.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-mono text-xs font-semibold text-primary">
                    {m.codigo}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-foreground">{m.usuario_nombre}</div>
                    <div className="text-[11px] text-muted-foreground">{m.usuario_rut}</div>
                  </TableCell>
                  <TableCell className="text-xs text-foreground max-w-xs truncate">
                    {m.libro_titulo}
                  </TableCell>
                  <TableCell className="text-xs">
                    <span className="font-medium">{m.dias_atraso}</span> día(s) hábiles
                  </TableCell>
                  <TableCell className="font-extrabold text-sm text-foreground">
                    {formatoCLP(m.monto)}
                  </TableCell>
                  <TableCell>
                    {m.estado === 'Pendiente' ? (
                      <Badge variant="destructive">Pendiente</Badge>
                    ) : (
                      <Badge variant="success">Pagada</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {m.estado === 'Pendiente' ? (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handlePagarClick(m)}
                        className="text-xs h-8 px-3 gap-1.5"
                      >
                        <Receipt className="h-3.5 w-3.5" />
                        <span>Registrar Pago Total</span>
                      </Button>
                    ) : (
                      <span className="text-[11px] text-muted-foreground font-mono">
                        {m.comprobante_pago || 'Pagado'}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <TablePagination
            paginaActual={pagina}
            totalPaginas={totalPaginas}
            totalItems={multas.length}
            itemsPorPagina={itemsPorPagina}
            onCambiarPagina={setPagina}
          />
        </div>
      )}

      {/* Sección Bento: Multas estimadas en vivo (préstamos vencidos aún no devueltos) */}
      {multasEstimadas.length > 0 && (
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-destructive" />
              Multas Estimadas Acumuladas en Vivo (Préstamos Vencidos No Devueltos)
            </CardTitle>
            <CardDescription>
              Cálculo dinámico en tiempo real según la fecha actual y días hábiles transcurridos.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código Préstamo</TableHead>
                    <TableHead>Lector</TableHead>
                    <TableHead>Libro</TableHead>
                    <TableHead>Fecha Límite</TableHead>
                    <TableHead>Retraso Hábil</TableHead>
                    <TableHead className="text-right">Multa Estimada</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {multasEstimadas.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-xs">{p.codigo}</TableCell>
                      <TableCell className="text-xs font-medium">{p.usuario_nombre}</TableCell>
                      <TableCell className="text-xs truncate max-w-xs">{p.libro_titulo}</TableCell>
                      <TableCell className="text-xs text-destructive font-semibold">
                        {formatoFecha(p.fecha_vencimiento)}
                      </TableCell>
                      <TableCell className="text-xs font-bold text-destructive">
                        +{p.dias_retraso} día(s)
                      </TableCell>
                      <TableCell className="text-right font-extrabold text-xs text-destructive">
                        {formatoCLP(p.monto_acumulado)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AlertDialog Registrar Pago Total */}
      <AlertDialog
        open={Boolean(multaParaPagar)}
        onClose={() => setMultaParaPagar(null)}
        onConfirm={confirmarPagoTotal}
        title="¿Registrar Pago Total de la Multa?"
        description={
          multaParaPagar
            ? `Se registrará el pago TOTAL de ${formatoCLP(multaParaPagar.monto)} para el usuario "${multaParaPagar.usuario_nombre}" por el libro "${multaParaPagar.libro_titulo}". Al pagarse, el sistema reevaluará y habilitará al usuario si no tiene otras deudas ni atrasos pendientes.`
            : ''
        }
        confirmText="Confirmar Pago Total"
        variant="primary"
        loading={pagando}
      />

      {/* Modal Comprobante de Pago Emitido */}
      <Dialog
        open={Boolean(comprobanteEmitido)}
        onClose={() => setComprobanteEmitido(null)}
        title="Recibo Oficial de Pago Emitido"
        description="El pago total ha sido procesado y el usuario regularizado en el sistema."
      >
        {comprobanteEmitido && (
          <div className="space-y-4 mt-2">
            <div className="p-4 rounded-3xl bg-secondary/40 border border-border space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <span className="font-mono font-bold text-primary text-sm">
                  {comprobanteEmitido.numeroComprobante}
                </span>
                <Badge variant="success">Pagado Total</Badge>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] uppercase text-muted-foreground font-bold block">
                    Pagador
                  </span>
                  <p className="font-medium">{comprobanteEmitido.usuarioNombre}</p>
                  <p className="text-[11px] text-muted-foreground">{comprobanteEmitido.usuarioRut}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-muted-foreground font-bold block">
                    Motivo Sanción
                  </span>
                  <p className="font-medium">{comprobanteEmitido.libroTitulo}</p>
                  <p className="text-[11px] text-muted-foreground">{comprobanteEmitido.diasAtraso} días hábiles</p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-card border border-border/60 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase text-muted-foreground font-bold block">
                    Monto Total Cancelado
                  </span>
                  <span className="text-xl font-extrabold text-foreground">
                    {comprobanteEmitido.montoPagadoFormato}
                  </span>
                </div>
                <div className="text-right text-[11px] text-muted-foreground">
                  Fecha: {formatoFechaHora(comprobanteEmitido.fechaEmision)}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-success/10 border border-success/30 text-success text-[11px] flex items-center gap-1.5 font-medium">
                <ShieldCheck className="h-4 w-4" />
                <span>Estado de usuario actualizado a Habilitado (si no posee otras deudas).</span>
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
                <span>Descargar Recibo PDF</span>
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setComprobanteEmitido(null)}
                className="w-full sm:w-auto"
              >
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  )
}

