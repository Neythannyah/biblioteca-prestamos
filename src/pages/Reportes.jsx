import React, { useState, useEffect } from 'react'
import {
  BarChart3,
  FileSpreadsheet,
  FileText,
  FileCode,
  Download,
  Calendar,
  BookOpen,
  AlertTriangle,
  UserX,
  Filter,
  CheckCircle2,
  Clock
} from 'lucide-react'
import { reporteService } from '../services/index.js'
import { ReporteExportAdapter } from '../patterns/adapter/ReporteExportAdapter.js'
import { Button } from '../components/ui/Button.jsx'
import { Input } from '../components/ui/Input.jsx'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card.jsx'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs.jsx'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TablePagination } from '../components/ui/Table.jsx'
import { Badge } from '../components/ui/Badge.jsx'
import { EmptyState } from '../components/ui/EmptyState.jsx'
import { Skeleton } from '../components/ui/Skeleton.jsx'
import { useToast } from '../components/ui/Toast.jsx'
import { formatoCLP, formatoFecha } from '../utils/formatters.js'

export function Reportes() {
  const [pestañaActiva, setPestañaActiva] = useState('prestados')
  const [cargando, setCargando] = useState(true)
  const [datos, setDatos] = useState([])
  const [exportando, setExportando] = useState(false)

  // Filtro de fechas para la 4ta pestaña
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')

  // Paginación
  const [pagina, setPagina] = useState(1)
  const itemsPorPagina = 8

  const toast = useToast()

  const cargarReporte = async () => {
    try {
      setCargando(true)
      let res = []

      if (pestañaActiva === 'prestados') {
        res = await reporteService.obtenerLibrosPrestados()
      } else if (pestañaActiva === 'retraso') {
        res = await reporteService.obtenerLibrosConRetraso()
      } else if (pestañaActiva === 'sancionados') {
        res = await reporteService.obtenerUsuariosSancionados()
      } else if (pestañaActiva === 'rango') {
        res = await reporteService.obtenerPrestamosPorRango(fechaInicio, fechaFin)
      }

      setDatos(res)
      setPagina(1)
    } catch (err) {
      toast.error('Error al generar reporte', err.message)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarReporte()
  }, [pestañaActiva, fechaInicio, fechaFin])

  // Configuración de columnas por reporte para ReporteExportAdapter
  const obtenerConfiguracionReporte = () => {
    switch (pestañaActiva) {
      case 'prestados':
        return {
          titulo: 'Reporte de Libros Actualmente Prestados',
          subtitulo: `Total de ejemplares en circulación: ${datos.length}`,
          nombreArchivo: 'reporte_libros_prestados',
          columnas: [
            { key: 'codigo', label: 'Código Préstamo' },
            { key: 'libro_codigo', label: 'Cód. Libro' },
            { key: 'libro_titulo', label: 'Título del Libro' },
            { key: 'usuario_nombre', label: 'Lector' },
            { key: 'usuario_rut', label: 'RUT' },
            { key: 'usuario_tipo', label: 'Tipo' },
            { key: 'fecha_prestamo', label: 'Fecha Préstamo', selector: (item) => formatoFecha(item.fecha_prestamo) },
            { key: 'fecha_vencimiento', label: 'Fecha Vencimiento', selector: (item) => formatoFecha(item.fecha_vencimiento) },
            { key: 'renovado', label: 'Renovado', selector: (item) => (item.renovado ? 'Sí' : 'No') }
          ]
        }

      case 'retraso':
        return {
          titulo: 'Reporte de Libros con Retraso (Vencidos no devueltos)',
          subtitulo: `Ejemplares fuera de plazo reglamentario: ${datos.length}`,
          nombreArchivo: 'reporte_libros_con_retraso',
          columnas: [
            { key: 'codigo', label: 'Código Préstamo' },
            { key: 'libro_titulo', label: 'Libro Atrasado' },
            { key: 'usuario_nombre', label: 'Lector Moroso' },
            { key: 'usuario_rut', label: 'RUT' },
            { key: 'fecha_vencimiento', label: 'Fecha Vencimiento', selector: (item) => formatoFecha(item.fecha_vencimiento) },
            { key: 'dias_retraso', label: 'Días Atraso Hábil', selector: (item) => `${item.dias_retraso} días` },
            { key: 'multa_acumulada_estimada', label: 'Multa Estimada CLP', selector: (item) => formatoCLP(item.multa_acumulada_estimada) }
          ]
        }

      case 'sancionados':
        return {
          titulo: 'Reporte de Usuarios Sancionados y Bloqueados',
          subtitulo: `Total de lectores con suspensión de préstamos: ${datos.length}`,
          nombreArchivo: 'reporte_usuarios_sancionados',
          columnas: [
            { key: 'rut', label: 'RUT' },
            { key: 'nombre', label: 'Nombre Completo' },
            { key: 'tipo', label: 'Tipo Lector' },
            { key: 'correo', label: 'Correo' },
            { key: 'motivo_bloqueo', label: 'Causa del Bloqueo' },
            { key: 'total_deuda_multas', label: 'Deuda Multas CLP', selector: (item) => formatoCLP(item.total_deuda_multas) },
            { key: 'prestamos_vencidos_conteo', label: 'Préstamos Vencidos Activos' }
          ]
        }

      case 'rango':
      default:
        return {
          titulo: 'Reporte de Préstamos por Rango de Fechas',
          subtitulo: `Filtro: ${fechaInicio ? formatoFecha(fechaInicio) : 'Inicio'} al ${fechaFin ? formatoFecha(fechaFin) : 'Fin'} | Registros: ${datos.length}`,
          nombreArchivo: 'reporte_prestamos_por_rango',
          columnas: [
            { key: 'codigo', label: 'Código' },
            { key: 'libro_titulo', label: 'Libro' },
            { key: 'usuario_nombre', label: 'Lector' },
            { key: 'fecha_prestamo', label: 'Fecha Préstamo', selector: (item) => formatoFecha(item.fecha_prestamo) },
            { key: 'fecha_vencimiento', label: 'Fecha Vencimiento', selector: (item) => formatoFecha(item.fecha_vencimiento) },
            { key: 'fecha_devolucion', label: 'Fecha Devolución', selector: (item) => (item.fecha_devolucion ? formatoFecha(item.fecha_devolucion) : 'Pendiente') },
            { key: 'estado', label: 'Estado' }
          ]
        }
    }
  }

  // Exportaciones mediante ReporteExportAdapter (Patrón Adapter)
  const ejecutarExportacion = (formato) => {
    if (!datos || datos.length === 0) {
      toast.warning('Sin registros', 'No hay datos en el reporte actual para exportar.')
      return
    }

    setExportando(true)
    try {
      const config = obtenerConfiguracionReporte()
      ReporteExportAdapter.exportar(datos, formato, config)
      toast.success(
        `Reporte Exportado (${formato.toUpperCase()})`,
        `El archivo ${config.nombreArchivo} ha sido generado exitosamente.`
      )
    } catch (err) {
      toast.error('Error al exportar reporte', err.message)
    } finally {
      setExportando(false)
    }
  }

  // Paginación
  const totalPaginas = Math.ceil(datos.length / itemsPorPagina)
  const datosPaginados = datos.slice(
    (pagina - 1) * itemsPorPagina,
    pagina * itemsPorPagina
  )

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Reportes y Auditoría
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Generación y exportación de informes en PDF, Excel y CSV (RF8)
          </p>
        </div>

        {/* Botones de Exportación mediante ReporteExportAdapter */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => ejecutarExportacion('pdf')}
            disabled={cargando || datos.length === 0 || exportando}
            className="gap-1.5 text-xs h-9"
          >
            <FileText className="h-4 w-4 text-primary" />
            <span>Exportar PDF</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => ejecutarExportacion('excel')}
            disabled={cargando || datos.length === 0 || exportando}
            className="gap-1.5 text-xs h-9"
          >
            <FileSpreadsheet className="h-4 w-4 text-success" />
            <span>Exportar Excel</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => ejecutarExportacion('csv')}
            disabled={cargando || datos.length === 0 || exportando}
            className="gap-1.5 text-xs h-9"
          >
            <FileCode className="h-4 w-4 text-warning" />
            <span>Exportar CSV</span>
          </Button>
        </div>
      </div>

      {/* Selector de Pestañas Bento */}
      <Tabs value={pestañaActiva} onValueChange={setPestañaActiva}>
        <div className="p-2 rounded-3xl bg-card border border-border shadow-subtle overflow-x-auto">
          <TabsList className="bg-transparent border-0 gap-2">
            <TabsTrigger value="prestados" className="text-xs py-2 px-4 gap-2">
              <BookOpen className="h-3.5 w-3.5" />
              <span>Libros Prestados</span>
            </TabsTrigger>
            <TabsTrigger value="retraso" className="text-xs py-2 px-4 gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
              <span>Libros con Retraso</span>
            </TabsTrigger>
            <TabsTrigger value="sancionados" className="text-xs py-2 px-4 gap-2">
              <UserX className="h-3.5 w-3.5 text-warning" />
              <span>Usuarios Sancionados</span>
            </TabsTrigger>
            <TabsTrigger value="rango" className="text-xs py-2 px-4 gap-2">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              <span>Préstamos por Fechas</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Filtros específicos si está en la pestaña de Rango de Fechas */}
        {pestañaActiva === 'rango' && (
          <div className="mt-4 p-4 rounded-3xl bg-card border border-border flex flex-col sm:flex-row items-center gap-4 text-xs shadow-subtle animate-in fade-in duration-150">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="font-semibold text-muted-foreground uppercase text-[10px]">Desde:</span>
              <Input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="h-9 w-40 text-xs"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="font-semibold text-muted-foreground uppercase text-[10px]">Hasta:</span>
              <Input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="h-9 w-40 text-xs"
              />
            </div>
            {(fechaInicio || fechaFin) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFechaInicio('')
                  setFechaFin('')
                }}
                className="text-xs"
              >
                Limpiar rango
              </Button>
            )}
          </div>
        )}

        {/* Resumen del Reporte */}
        <div className="mt-4 p-3.5 rounded-2xl bg-muted/50 border border-border/60 flex items-center justify-between text-xs">
          <div className="font-medium text-foreground">
            {obtenerConfiguracionReporte().titulo}
          </div>
          <div className="text-muted-foreground">
            Total filas: <strong className="text-foreground">{datos.length}</strong>
          </div>
        </div>

        {/* Tablas de Resultados según Pestaña */}
        <div className="mt-4">
          {cargando ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : datos.length === 0 ? (
            <EmptyState
              icon={BarChart3}
              title="Sin datos para este reporte"
              description="No se encontraron registros que coincidan con la vista seleccionada."
            />
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    {obtenerConfiguracionReporte().columnas.map((col, idx) => (
                      <TableHead key={idx}>{col.label}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {datosPaginados.map((item, rowIdx) => (
                    <TableRow key={rowIdx}>
                      {obtenerConfiguracionReporte().columnas.map((col, colIdx) => {
                        const val = typeof col.selector === 'function' ? col.selector(item) : item[col.key]
                        return (
                          <TableCell key={colIdx} className="text-xs">
                            {val !== undefined && val !== null ? String(val) : '-'}
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <TablePagination
                paginaActual={pagina}
                totalPaginas={totalPaginas}
                totalItems={datos.length}
                itemsPorPagina={itemsPorPagina}
                onCambiarPagina={setPagina}
              />
            </div>
          )}
        </div>
      </Tabs>
    </div>
  )
}

