import React, { useState, useEffect } from 'react'
import {
  Users,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  GraduationCap,
  Briefcase
} from 'lucide-react'
import { usuarioService, prestamoService, multaService } from '../services/index.js'
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
import { formatearRut, validarRut } from '../domain/rut.js'
import { formatoCLP, formatoFecha } from '../utils/formatters.js'

export function Usuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [pagina, setPagina] = useState(1)
  const itemsPorPagina = 8

  // Modales
  const [modalAbierto, setModalAbierto] = useState(false)
  const [modalVerAbierto, setModalVerAbierto] = useState(false)
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null)
  const [detalleUsuario, setDetalleUsuario] = useState({ prestamos: [], multas: [] })
  const [modoEdicion, setModoEdicion] = useState(false)

  // Formulario
  const [formData, setFormData] = useState({
    rut: '',
    nombre: '',
    correo: '',
    tipo: 'Estudiante',
    carrera: '',
    departamento: ''
  })
  const [formError, setFormError] = useState(null)
  const [guardando, setGuardando] = useState(false)

  const toast = useToast()

  const cargarUsuarios = async () => {
    try {
      setCargando(true)
      const res = await usuarioService.listar({
        busqueda,
        tipo: filtroTipo,
        estado: filtroEstado
      })
      setUsuarios(res)
      setPagina(1)
    } catch (err) {
      toast.error('Error al cargar usuarios', err.message)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarUsuarios()
  }, [busqueda, filtroTipo, filtroEstado])

  const abrirCrear = () => {
    setModoEdicion(false)
    setUsuarioSeleccionado(null)
    setFormData({
      rut: '',
      nombre: '',
      correo: '',
      tipo: 'Estudiante',
      carrera: '',
      departamento: ''
    })
    setFormError(null)
    setModalAbierto(true)
  }

  const abrirEditar = (usuario) => {
    setModoEdicion(true)
    setUsuarioSeleccionado(usuario)
    setFormData({
      rut: usuario.rut,
      nombre: usuario.nombre,
      correo: usuario.correo,
      tipo: usuario.tipo,
      carrera: usuario.carrera || '',
      departamento: usuario.departamento || ''
    })
    setFormError(null)
    setModalAbierto(true)
  }

  const abrirVer = async (usuario) => {
    setUsuarioSeleccionado(usuario)
    try {
      const p = prestamoService.obtenerPorUsuario(usuario.id)
      const m = multaService.obtenerPorUsuario(usuario.id)
      setDetalleUsuario({ prestamos: p, multas: m })
    } catch (err) {
      setDetalleUsuario({ prestamos: [], multas: [] })
    }
    setModalVerAbierto(true)
  }

  const handleRutChange = (e) => {
    const val = e.target.value
    // Formatear dinámicamente si es posible
    setFormData({ ...formData, rut: val })
  }

  const handleGuardar = async (e) => {
    e.preventDefault()
    setFormError(null)

    if (!validarRut(formData.rut)) {
      setFormError('El RUT ingresado no es válido según el algoritmo chileno (Módulo 11). Ejemplo: 12.345.678-K')
      return
    }

    setGuardando(true)
    try {
      if (modoEdicion && usuarioSeleccionado) {
        await usuarioService.actualizar(usuarioSeleccionado.id, formData)
        toast.success('Usuario actualizado', `Se actualizaron los datos de "${formData.nombre}".`)
      } else {
        await usuarioService.crear(formData)
        toast.success('Usuario creado', `Se registró exitosamente a "${formData.nombre}" vía UsuarioFactory.`)
      }
      setModalAbierto(false)
      cargarUsuarios()
    } catch (err) {
      setFormError(err.message || 'Error al procesar el usuario')
    } finally {
      setGuardando(false)
    }
  }

  // Paginación
  const totalPaginas = Math.ceil(usuarios.length / itemsPorPagina)
  const usuariosPaginados = usuarios.slice(
    (pagina - 1) * itemsPorPagina,
    pagina * itemsPorPagina
  )

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Gestión de Usuarios
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Registro y administración de estudiantes y docentes (RF3)
          </p>
        </div>
        <Button variant="primary" onClick={abrirCrear} className="gap-2">
          <Plus className="h-4 w-4" />
          <span>Registrar Usuario</span>
        </Button>
      </div>

      {/* Barra de Filtros */}
      <div className="p-4 rounded-3xl bg-card border border-border flex flex-col md:flex-row items-center justify-between gap-4 shadow-subtle">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, RUT o correo..."
            className="pl-9 h-10"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="h-10 text-xs w-36"
            >
              <option value="todos">Todos los tipos</option>
              <option value="Estudiante">Estudiantes (5d)</option>
              <option value="Docente">Docentes (10d)</option>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="h-10 text-xs w-36"
            >
              <option value="todos">Todos los estados</option>
              <option value="Habilitado">Habilitados</option>
              <option value="Bloqueado">Bloqueados</option>
            </Select>
          </div>
        </div>
      </div>

      {/* Tabla de Usuarios */}
      {cargando ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : usuarios.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No se encontraron usuarios"
          description={
            busqueda || filtroTipo !== 'todos' || filtroEstado !== 'todos'
              ? 'No hay registros que coincidan con los filtros aplicados.'
              : 'Aún no hay usuarios registrados en el sistema.'
          }
          actionLabel="Limpiar filtros"
          onAction={() => {
            setBusqueda('')
            setFiltroTipo('todos')
            setFiltroEstado('todos')
          }}
        />
      ) : (
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>RUT</TableHead>
                <TableHead>Nombre y Correo</TableHead>
                <TableHead>Tipo / Plazo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="hidden lg:table-cell">Motivo de Bloqueo</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usuariosPaginados.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-mono text-xs font-semibold text-primary">
                    {u.rut}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-foreground">{u.nombre}</div>
                    <div className="text-xs text-muted-foreground">{u.correo}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {u.tipo === 'Docente' ? (
                        <Briefcase className="h-3.5 w-3.5 text-primary" />
                      ) : (
                        <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                      <span className="text-xs font-medium">{u.tipo}</span>
                      <span className="text-[10px] text-muted-foreground">
                        ({u.tipo === 'Docente' ? '10d hábiles' : '5d hábiles'})
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {u.estado === 'Habilitado' ? (
                      <Badge variant="success">Habilitado</Badge>
                    ) : (
                      <Badge variant="destructive">Bloqueado</Badge>
                    )}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-xs text-muted-foreground max-w-xs truncate">
                    {u.motivo_bloqueo || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => abrirVer(u)}
                        title="Ver ficha de usuario"
                        className="h-8 w-8"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => abrirEditar(u)}
                        title="Editar usuario"
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
            totalItems={usuarios.length}
            itemsPorPagina={itemsPorPagina}
            onCambiarPagina={setPagina}
          />
        </div>
      )}

      {/* Modal Crear / Editar Usuario */}
      <Dialog
        open={modalAbierto}
        onClose={() => setModalAbierto(false)}
        title={modoEdicion ? 'Editar Usuario' : 'Registrar Usuario (UsuarioFactory)'}
        description={
          modoEdicion
            ? 'Actualiza los datos personales del usuario. El estado es de solo lectura y lo calcula el sistema.'
            : 'Crea una nueva entidad de Estudiante o Docente mediante la fábrica abstracta.'
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
              <Label htmlFor="rut" required>RUT Chileno</Label>
              <Input
                id="rut"
                value={formData.rut}
                onChange={handleRutChange}
                placeholder="12.345.678-5"
                disabled={modoEdicion}
                required
              />
              <span className="text-[10px] text-muted-foreground mt-1 block">
                Formato con puntos y guión
              </span>
            </div>

            <div>
              <Label htmlFor="tipo" required>Tipo de Usuario</Label>
              <Select
                id="tipo"
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                disabled={modoEdicion}
              >
                <option value="Estudiante">Estudiante (Plazo: 5 días hábiles)</option>
                <option value="Docente">Docente (Plazo: 10 días hábiles)</option>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="nombre" required>Nombre Completo</Label>
            <Input
              id="nombre"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Ej: Sofía Valenzuela Morales"
              required
            />
          </div>

          <div>
            <Label htmlFor="correo" required>Correo Institucional</Label>
            <Input
              id="correo"
              type="email"
              value={formData.correo}
              onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
              placeholder="s.valenzuela@institucion.cl"
              required
            />
          </div>

          {formData.tipo === 'Estudiante' ? (
            <div>
              <Label htmlFor="carrera">Carrera / Programa</Label>
              <Input
                id="carrera"
                value={formData.carrera}
                onChange={(e) => setFormData({ ...formData, carrera: e.target.value })}
                placeholder="Ej: Ingeniería Civil en Informática"
              />
            </div>
          ) : (
            <div>
              <Label htmlFor="departamento">Facultad / Departamento</Label>
              <Input
                id="departamento"
                value={formData.departamento}
                onChange={(e) => setFormData({ ...formData, departamento: e.target.value })}
                placeholder="Ej: Dpto. de Ciencias de la Computación"
              />
            </div>
          )}

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
              {modoEdicion ? 'Guardar Cambios' : 'Crear Usuario'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Modal Ver Ficha de Usuario */}
      <Dialog
        open={modalVerAbierto}
        onClose={() => setModalVerAbierto(false)}
        title="Ficha del Usuario"
        description="Estado, préstamos y sanciones registradas"
      >
        {usuarioSeleccionado && (
          <div className="space-y-4 mt-2">
            <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-bold text-primary">
                  {usuarioSeleccionado.rut}
                </span>
                {usuarioSeleccionado.estado === 'Habilitado' ? (
                  <Badge variant="success">Habilitado</Badge>
                ) : (
                  <Badge variant="destructive">Bloqueado</Badge>
                )}
              </div>
              <h4 className="text-base font-bold text-foreground">
                {usuarioSeleccionado.nombre}
              </h4>
              <p className="text-xs text-muted-foreground">
                {usuarioSeleccionado.correo} &bull; {usuarioSeleccionado.tipo}
              </p>
              {usuarioSeleccionado.estado === 'Bloqueado' && (
                <div className="mt-2 p-2.5 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-start gap-2">
                  <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">Motivo de sanción:</span>
                    <span>{usuarioSeleccionado.motivo_bloqueo}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Historial de Préstamos y Multas */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Préstamos Activos ({detalleUsuario.prestamos.filter(p => p.estado === 'Activo').length})
              </h5>
              {detalleUsuario.prestamos.filter(p => p.estado === 'Activo').length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No tiene préstamos activos actualmente.</p>
              ) : (
                <div className="space-y-2">
                  {detalleUsuario.prestamos.filter(p => p.estado === 'Activo').map(p => (
                    <div key={p.id} className="p-2.5 rounded-xl border border-border bg-card flex justify-between items-center text-xs">
                      <div>
                        <span className="font-semibold">{p.libro_titulo}</span>
                        <div className="text-[11px] text-muted-foreground">Vence: {formatoFecha(p.fecha_vencimiento)}</div>
                      </div>
                      <Badge variant={p.renovado ? 'warning' : 'default'} className="text-[10px]">
                        {p.renovado ? 'Renovado' : 'Original'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}

              <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground pt-2">
                Multas Registradas ({detalleUsuario.multas.length})
              </h5>
              {detalleUsuario.multas.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No registra multas en su historial.</p>
              ) : (
                <div className="space-y-2">
                  {detalleUsuario.multas.map(m => (
                    <div key={m.id} className="p-2.5 rounded-xl border border-border bg-card flex justify-between items-center text-xs">
                      <div>
                        <span className="font-semibold">{formatoCLP(m.monto)}</span>
                        <div className="text-[11px] text-muted-foreground">{m.libro_titulo} ({m.dias_atraso}d atraso)</div>
                      </div>
                      <Badge variant={m.estado === 'Pagada' ? 'success' : 'destructive'} className="text-[10px]">
                        {m.estado}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-border/60">
              <Button variant="secondary" onClick={() => setModalVerAbierto(false)}>
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  )
}

