import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRightLeft,
  Search,
  Filter,
  RefreshCw,
  Undo2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  PlusCircle,
  FileCheck2
} from 'lucide-react'
import { prestamoService, usuarioService } from '../services/index.js'
import { Button } from '../components/ui/Button.jsx'
import { Input } from '../components/ui/Input.jsx'
import { Select } from '../components/ui/Select.jsx'
import { Badge } from '../components/ui/Badge.jsx'
import { Dialog, AlertDialog } from '../components/ui/Dialog.jsx'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TablePagination } from '../components/ui/Table.jsx'
import { EmptyState } from '../components/ui/EmptyState.jsx'
import { Skeleton } from '../components/ui/Skeleton.jsx'
import { useToast } from '../components/ui/Toast.jsx'
import { estaVencido } from '../domain/prestamos.js'
import { formatoFecha } from '../utils/formatters.js'

export function Prestamos() {
  const [prestamos, setPrestamos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('Activo') // Activo por defecto
  const [pagina, setPagina] = useState(1)
  const itemsPorPagina = 8

  // Modal Confirmar Renovación
  const [prestamoParaRenovar, setPrestamoParaRenovar] = useState(null)
  const [renovando, setRenovando] = useState(false)

  // Modal Ver Detalle Préstamo
  const [prestamoVer, setPrestamoVer] = useState(null)

  const toast = useToast()
  const navigate = useNavigate()

  const cargarPrestamos = async () => {
    try {
      setCargando(true)
      const res = await prestamoService.listar({
        busqueda,
        estado: filtroEstado
      })
      setPrestamos(res)
      setPagina(1)
    } catch (err) {
      toast.error('Error al listar préstamos', err.message)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarPrestamos()
  }, [busqueda, filtroEstado])

  const handleRenovarClick = (prestamo) => {
    setPrestamoParaRenovar(prestamo)
  }

  const confirmarRenovacion = async () => {
    if (!prestamoParaRenovar) return
    setRenovando(true)

    try {
      const res = await prestamoService.renovar(prestamoParaRenovar.id)
      toast.success(
        'Préstamo renovado exitosamente',
        `Nueva fecha límite de entrega: ${formatoFecha(res.fecha_vencimiento)}`
      )
      setPrestamoParaRenovar(null)
      cargarPrestamos()
    } catch (err) {
      toast.error('Rechazar renovación', err.message)
      setPrestamoParaRenovar(null)
    } finally {
      setRenovando(false)
    }
  }

  // Paginación
  const totalPaginas = Math.ceil(prestamos.length / itemsPorPagina)
  const prestamosPaginados = prestamos.slice(
    (pagina - 1) * itemsPorPagina,
    pagina * itemsPorPagina
  )

  const hoy = new Date()

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Gestión de Préstamos
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Control de ejemplares circulantes y renovaciones (RF5)
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => navigate('/prestamos/nuevo')}
          className="gap-2"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Nuevo Préstamo</span>
        </Button>
      </div>

      {/* Barra de Filtros */}
      <div className="p-4 rounded-3xl bg-card border border-border flex flex-col md:flex-row items-center justify-between gap-4 shadow-subtle">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por código, libro o lector..."
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
              <option value="Activo">Préstamos Activos</option>
              <option value="Vencidos">Préstamos Vencidos</option>
              <option value="Devuelto">Devueltos</option>
              <option value="todos">Todos los registros</option>
            </Select>
          </div>
        </div>
      </div>

      {/* Tabla de Préstamos */}
      {cargando ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : prestamos.length === 0 ? (
        <EmptyState
          icon={ArrowRightLeft}
          title="No se encontraron préstamos"
          description="No hay préstamos que coincidan con el estado o término de búsqueda aplicado."
          actionLabel="Ver todos los activos"
          onAction={() => {
            setBusqueda('')
            setFiltroEstado('Activo')
          }}
        />
      ) : (
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Libro</TableHead>
                <TableHead>Usuario / Tipo</TableHead>
                <TableHead>Fecha Préstamo</TableHead>
                <TableHead>Fecha Límite</TableHead>
                <TableHead>Renovación</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prestamosPaginados.map((p) => {
                const vencido = p.estado === 'Activo' && estaVencido(p, hoy)
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs font-semibold text-primary">
                      {p.codigo}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-foreground">{p.libro_titulo}</div>
                      <div className="text-[11px] font-mono text-muted-foreground">{p.libro_codigo}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-foreground">{p.usuario_nombre}</div>
                      <div className="text-[11px] text-muted-foreground">{p.usuario_rut} &bull; {p.usuario_tipo}</div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {formatoFecha(p.fecha_prestamo)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-semibold ${vencido ? 'text-destructive font-bold' : 'text-foreground'}`}>
                          {formatoFecha(p.fecha_vencimiento)}
                        </span>
                        {vencido && (
                          <Badge variant="destructive" className="text-[9px] px-1.5 py-0">
                            Vencido
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {p.renovado ? (
                        <Badge variant="warning" className="text-[10px]">
                          Renovado (1/1)
                        </Badge>
                      ) : (
                        <Badge variant="default" className="text-[10px]">
                          Disponible (0/1)
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {p.estado === 'Activo' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRenovarClick(p)}
                              disabled={p.renovado || vencido}
                              title={
                                p.renovado
                                  ? 'Ya utilizó su única renovación permitida'
                                  : vencido
                                  ? 'No es posible renovar un préstamo vencido'
                                  : 'Renovar por un plazo adicional'
                              }
                              className="text-xs h-8 px-3"
                            >
                              <RefreshCw className="h-3 w-3 mr-1" />
                              <span>Renovar</span>
                            </Button>

                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => navigate(`/devoluciones?prestamoId=${p.id}`)}
                              className="text-xs h-8 px-3"
                            >
                              <Undo2 className="h-3 w-3 mr-1" />
                              <span>Devolver</span>
                            </Button>
                          </>
                        )}
                        {p.estado === 'Devuelto' && (
                          <Badge variant="success" className="text-[10px]">
                            Devuelto
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          <TablePagination
            paginaActual={pagina}
            totalPaginas={totalPaginas}
            totalItems={prestamos.length}
            itemsPorPagina={itemsPorPagina}
            onCambiarPagina={setPagina}
          />
        </div>
      )}

      {/* AlertDialog de Confirmación de Renovación */}
      <AlertDialog
        open={Boolean(prestamoParaRenovar)}
        onClose={() => setPrestamoParaRenovar(null)}
        onConfirm={confirmarRenovacion}
        title="¿Confirmar renovación de préstamo?"
        description={
          prestamoParaRenovar
            ? `Se extenderá la fecha de vencimiento original de "${prestamoParaRenovar.libro_titulo}" por el plazo correspondiente (${prestamoParaRenovar.usuario_tipo === 'Docente' ? '10' : '5'} días hábiles adicionales). Recuerda que solo se permite UNA renovación.`
            : ''
        }
        confirmText="Renovar Préstamo"
        variant="primary"
        loading={renovando}
      />
    </div>
  )
}

