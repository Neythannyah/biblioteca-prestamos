import React, { useState, useEffect } from 'react'
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  AlertCircle,
  CheckCircle2,
  Bookmark
} from 'lucide-react'
import { libroService } from '../services/index.js'
import { Button } from '../components/ui/Button.jsx'
import { Input } from '../components/ui/Input.jsx'
import { Label } from '../components/ui/Label.jsx'
import { Select } from '../components/ui/Select.jsx'
import { Badge } from '../components/ui/Badge.jsx'
import { Dialog } from '../components/ui/Dialog.jsx'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TablePagination } from '../components/ui/Table.jsx'
import { EmptyState } from '../components/ui/EmptyState.jsx'
import { Skeleton } from '../components/ui/Skeleton.jsx'
import { useToast } from '../components/ui/Toast.jsx'

export function Libros() {
  const [libros, setLibros] = useState([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [pagina, setPagina] = useState(1)
  const itemsPorPagina = 8

  // Modales
  const [modalAbierto, setModalAbierto] = useState(false)
  const [modalVerAbierto, setModalVerAbierto] = useState(false)
  const [libroSeleccionado, setLibroSeleccionado] = useState(null)
  const [modoEdicion, setModoEdicion] = useState(false)

  // Formulario
  const [formData, setFormData] = useState({
    codigo: '',
    titulo: '',
    autor: '',
    editorial: '',
    anio: new Date().getFullYear(),
    estado: 'Disponible'
  })
  const [formError, setFormError] = useState(null)
  const [guardando, setGuardando] = useState(false)

  const toast = useToast()

  const cargarLibros = async () => {
    try {
      setCargando(true)
      const res = await libroService.listar({
        busqueda,
        estado: filtroEstado
      })
      setLibros(res)
      setPagina(1)
    } catch (err) {
      toast.error('Error al cargar libros', err.message)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarLibros()
  }, [busqueda, filtroEstado])

  const abrirCrear = () => {
    setModoEdicion(false)
    setLibroSeleccionado(null)
    setFormData({
      codigo: '',
      titulo: '',
      autor: '',
      editorial: '',
      anio: new Date().getFullYear(),
      estado: 'Disponible'
    })
    setFormError(null)
    setModalAbierto(true)
  }

  const abrirEditar = (libro) => {
    setModoEdicion(true)
    setLibroSeleccionado(libro)
    setFormData({
      codigo: libro.codigo,
      titulo: libro.titulo,
      autor: libro.autor,
      editorial: libro.editorial || '',
      anio: libro.anio || new Date().getFullYear(),
      estado: libro.estado
    })
    setFormError(null)
    setModalAbierto(true)
  }

  const abrirVer = (libro) => {
    setLibroSeleccionado(libro)
    setModalVerAbierto(true)
  }

  const handleGuardar = async (e) => {
    e.preventDefault()
    setFormError(null)
    setGuardando(true)

    try {
      if (modoEdicion && libroSeleccionado) {
        await libroService.actualizar(libroSeleccionado.id, formData)
        toast.success('Libro actualizado', `Se actualizaron los datos de "${formData.titulo}" exitosamente.`)
      } else {
        await libroService.crear(formData)
        toast.success('Libro registrado', `Se agregó "${formData.titulo}" al catálogo.`)
      }
      setModalAbierto(false)
      cargarLibros()
    } catch (err) {
      setFormError(err.message || 'Error al guardar el libro')
    } finally {
      setGuardando(false)
    }
  }

  // Paginación
  const totalPaginas = Math.ceil(libros.length / itemsPorPagina)
  const librosPaginados = libros.slice(
    (pagina - 1) * itemsPorPagina,
    pagina * itemsPorPagina
  )

  const renderBadgeEstado = (estado) => {
    switch (estado) {
      case 'Disponible':
        return <Badge variant="success">Disponible</Badge>
      case 'Prestado':
        return <Badge variant="warning">Prestado</Badge>
      case 'En reparación':
        return <Badge variant="destructive">En reparación</Badge>
      default:
        return <Badge variant="default">{estado}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Catálogo de Libros
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Consulta y administración del acervo bibliográfico (RF2)
          </p>
        </div>
        <Button variant="primary" onClick={abrirCrear} className="gap-2">
          <Plus className="h-4 w-4" />
          <span>Registrar Libro</span>
        </Button>
      </div>

      {/* Barra de Filtros */}
      <div className="p-4 rounded-3xl bg-card border border-border flex flex-col md:flex-row items-center justify-between gap-4 shadow-subtle">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por título, autor, editorial o código..."
            className="pl-9 h-10"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 w-full md:w-48">
            <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
            <Select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="h-10 text-xs"
            >
              <option value="todos">Todos los estados</option>
              <option value="Disponible">Disponible</option>
              <option value="Prestado">Prestado</option>
              <option value="En reparación">En reparación</option>
            </Select>
          </div>
        </div>
      </div>

      {/* Tabla de Libros */}
      {cargando ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : libros.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No se encontraron libros"
          description={
            busqueda || filtroEstado !== 'todos'
              ? 'No hay libros que coincidan con los criterios de búsqueda aplicados.'
              : 'Aún no hay libros registrados en el catálogo.'
          }
          actionLabel={busqueda || filtroEstado !== 'todos' ? 'Limpiar filtros' : 'Registrar primer libro'}
          onAction={() => {
            if (busqueda || filtroEstado !== 'todos') {
              setBusqueda('')
              setFiltroEstado('todos')
            } else {
              abrirCrear()
            }
          }}
        />
      ) : (
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Título y Autor</TableHead>
                <TableHead className="hidden md:table-cell">Editorial</TableHead>
                <TableHead className="hidden sm:table-cell">Año</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {librosPaginados.map((libro) => (
                <TableRow key={libro.id}>
                  <TableCell className="font-mono text-xs font-semibold text-primary">
                    {libro.codigo}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-foreground">{libro.titulo}</div>
                    <div className="text-xs text-muted-foreground">{libro.autor}</div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {libro.editorial || '-'}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {libro.anio || '-'}
                  </TableCell>
                  <TableCell>{renderBadgeEstado(libro.estado)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => abrirVer(libro)}
                        title="Ver detalles"
                        className="h-8 w-8"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => abrirEditar(libro)}
                        title="Editar libro"
                        className="h-8 w-8"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <TablePagination
            paginaActual={pagina}
            totalPaginas={totalPaginas}
            totalItems={libros.length}
            itemsPorPagina={itemsPorPagina}
            onCambiarPagina={setPagina}
          />
        </div>
      )}

      {/* Modal Crear / Editar Libro */}
      <Dialog
        open={modalAbierto}
        onClose={() => setModalAbierto(false)}
        title={modoEdicion ? 'Editar Información del Libro' : 'Registrar Nuevo Libro'}
        description={
          modoEdicion
            ? 'Modifica los datos del ejemplar. El estado "Prestado" solo lo gestiona el sistema.'
            : 'Ingresa los datos del nuevo libro. El código debe ser único en el sistema.'
        }
      >
        <form onSubmit={handleGuardar} className="space-y-4 mt-2">
          {formError && (
            <div className="p-3 rounded-2xl bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="codigo" required>Código Único</Label>
              <Input
                id="codigo"
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                placeholder="LIB-016"
                required
              />
            </div>

            <div>
              <Label htmlFor="anio" required>Año de Publicación</Label>
              <Input
                id="anio"
                type="number"
                min="1400"
                max={new Date().getFullYear() + 1}
                value={formData.anio}
                onChange={(e) => setFormData({ ...formData, anio: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="titulo" required>Título del Libro</Label>
            <Input
              id="titulo"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              placeholder="Ej: Patrones de Diseño"
              required
            />
          </div>

          <div>
            <Label htmlFor="autor" required>Autor(es)</Label>
            <Input
              id="autor"
              value={formData.autor}
              onChange={(e) => setFormData({ ...formData, autor: e.target.value })}
              placeholder="Ej: Erich Gamma et al."
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="editorial">Editorial</Label>
              <Input
                id="editorial"
                value={formData.editorial}
                onChange={(e) => setFormData({ ...formData, editorial: e.target.value })}
                placeholder="Ej: Addison-Wesley"
              />
            </div>

            <div>
              <Label htmlFor="estado">Estado</Label>
              {modoEdicion && libroSeleccionado?.estado === 'Prestado' ? (
                <div className="p-2.5 rounded-2xl bg-warning/10 border border-warning/30 text-xs text-warning font-medium">
                  Actualmente prestado (gestionado por sistema)
                </div>
              ) : (
                <Select
                  id="estado"
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                >
                  <option value="Disponible">Disponible</option>
                  <option value="En reparación">En reparación</option>
                </Select>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalAbierto(false)}
              disabled={guardando}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={guardando}
            >
              {modoEdicion ? 'Guardar Cambios' : 'Registrar Libro'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Modal Ver Detalles */}
      <Dialog
        open={modalVerAbierto}
        onClose={() => setModalVerAbierto(false)}
        title="Ficha del Libro"
        description="Detalle completo del ejemplar bibliográfico"
      >
        {libroSeleccionado && (
          <div className="space-y-4 mt-2">
            <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-bold text-primary">
                  {libroSeleccionado.codigo}
                </span>
                {renderBadgeEstado(libroSeleccionado.estado)}
              </div>
              <div>
                <h4 className="text-base font-bold text-foreground">
                  {libroSeleccionado.titulo}
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Por {libroSeleccionado.autor}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-2xl border border-border/60 bg-card">
                <span className="text-muted-foreground uppercase tracking-wider text-[10px] block font-semibold">
                  Editorial
                </span>
                <span className="font-medium text-foreground mt-0.5 block">
                  {libroSeleccionado.editorial || 'No especificada'}
                </span>
              </div>
              <div className="p-3 rounded-2xl border border-border/60 bg-card">
                <span className="text-muted-foreground uppercase tracking-wider text-[10px] block font-semibold">
                  Año de Publicación
                </span>
                <span className="font-medium text-foreground mt-0.5 block">
                  {libroSeleccionado.anio || 'No registrado'}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-border/60">
              <Button variant="secondary" onClick={() => setModalVerAbierto(false)}>
                Cerrar Ficha
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  )
}

