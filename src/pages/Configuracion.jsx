import React, { useState, useEffect } from 'react'
import {
  Settings,
  Calendar,
  DollarSign,
  Clock,
  Plus,
  Trash2,
  RotateCcw,
  Save,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { configService, feriadoService } from '../services/index.js'
import { dbStorage } from '../services/mock/storage.js'
import { Button } from '../components/ui/Button.jsx'
import { Input } from '../components/ui/Input.jsx'
import { Label } from '../components/ui/Label.jsx'
import { Select } from '../components/ui/Select.jsx'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card.jsx'
import { Dialog, AlertDialog } from '../components/ui/Dialog.jsx'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table.jsx'
import { Badge } from '../components/ui/Badge.jsx'
import { useToast } from '../components/ui/Toast.jsx'
import { formatoFecha, formatoCLP } from '../utils/formatters.js'

export function Configuracion() {
  const [config, setConfig] = useState({
    tarifaDiaria: 1000,
    plazoEstudiante: 5,
    plazoDocente: 10,
    modoConteo: 'habiles'
  })
  const [feriados, setFeriados] = useState([])
  const [guardandoConfig, setGuardandoConfig] = useState(false)

  // Modal Agregar Feriado
  const [modalFeriado, setModalFeriado] = useState(false)
  const [nuevoFeriado, setNuevoFeriado] = useState({
    fecha: '',
    nombre: '',
    irrenunciable: false
  })
  const [errorFeriado, setErrorFeriado] = useState(null)

  // Confirmar Reinicio de Datos Semilla
  const [dialogoReset, setDialogoReset] = useState(false)

  const toast = useToast()

  const cargarConfiguracion = () => {
    const cfg = configService.obtenerConfig()
    const fer = feriadoService.obtenerFeriados()
    setConfig(cfg)
    setFeriados(fer)
  }

  useEffect(() => {
    cargarConfiguracion()
  }, [])

  const handleGuardarParametros = async (e) => {
    e.preventDefault()
    setGuardandoConfig(true)
    try {
      await configService.actualizarConfig(config)
      toast.success('Configuración guardada', 'Los parámetros del sistema han sido actualizados exitosamente.')
    } catch (err) {
      toast.error('Error al guardar configuración', err.message)
    } finally {
      setGuardandoConfig(false)
    }
  }

  const handleAgregarFeriado = async (e) => {
    e.preventDefault()
    setErrorFeriado(null)
    try {
      await feriadoService.agregarFeriado(nuevoFeriado)
      toast.success('Feriado agregado', `Se registró "${nuevoFeriado.nombre}" para el ${formatoFecha(nuevoFeriado.fecha)}.`)
      setModalFeriado(false)
      setNuevoFeriado({ fecha: '', nombre: '', irrenunciable: false })
      setFeriados(feriadoService.obtenerFeriados())
    } catch (err) {
      setErrorFeriado(err.message || 'Error al agregar feriado')
    }
  }

  const handleEliminarFeriado = async (fecha) => {
    try {
      await feriadoService.eliminarFeriado(fecha)
      toast.info('Feriado eliminado', `Se removió el feriado del ${formatoFecha(fecha)}.`)
      setFeriados(feriadoService.obtenerFeriados())
    } catch (err) {
      toast.error('Error al eliminar feriado', err.message)
    }
  }

  const handleRestablecerFeriadosOficiales = async () => {
    await feriadoService.restablecerFeriadosOficiales()
    setFeriados(feriadoService.obtenerFeriados())
    toast.success('Feriados restablecidos', 'Se restableció la lista oficial verificada 2026-2027.')
  }

  const handleReiniciarTodoElSistema = () => {
    dbStorage.resetTodo()
    toast.success('Sistema restablecido', 'Se recargaron todos los datos semilla iniciales de prueba.')
    setDialogoReset(false)
    cargarConfiguracion()
    setTimeout(() => {
      window.location.reload()
    }, 600)
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Configuración del Sistema
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Parámetros de préstamos, tarifas de multas y feriados oficiales
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setDialogoReset(true)}
          className="text-xs text-destructive hover:bg-destructive/10 border-destructive/30 gap-1.5"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Restablecer Datos Semilla</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Parámetros Operativos */}
        <div className="md:col-span-5 space-y-6">
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Settings className="h-4 w-4 text-primary" />
                Parámetros de Préstamos y Multas
              </CardTitle>
              <CardDescription>
                Reglas de negocio aplicables a todos los préstamos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGuardarParametros} className="space-y-4">
                <div>
                  <Label htmlFor="tarifaDiaria" required>
                    Tarifa de Multa por Día (CLP)
                  </Label>
                  <div className="relative">
                    <Input
                      id="tarifaDiaria"
                      type="number"
                      min="0"
                      step="100"
                      value={config.tarifaDiaria}
                      onChange={(e) => setConfig({ ...config, tarifaDiaria: e.target.value })}
                      required
                    />
                    <DollarSign className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-1 block">
                    Por defecto: $1.000 por día de atraso.
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="plazoEstudiante" required>
                      Plazo Estudiante
                    </Label>
                    <Input
                      id="plazoEstudiante"
                      type="number"
                      min="1"
                      value={config.plazoEstudiante}
                      onChange={(e) => setConfig({ ...config, plazoEstudiante: e.target.value })}
                      required
                    />
                    <span className="text-[10px] text-muted-foreground mt-1 block">
                      días hábiles (def: 5)
                    </span>
                  </div>

                  <div>
                    <Label htmlFor="plazoDocente" required>
                      Plazo Docente
                    </Label>
                    <Input
                      id="plazoDocente"
                      type="number"
                      min="1"
                      value={config.plazoDocente}
                      onChange={(e) => setConfig({ ...config, plazoDocente: e.target.value })}
                      required
                    />
                    <span className="text-[10px] text-muted-foreground mt-1 block">
                      días hábiles (def: 10)
                    </span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="modoConteo" required>
                    Modo de Conteo de Días de Atraso
                  </Label>
                  <Select
                    id="modoConteo"
                    value={config.modoConteo}
                    onChange={(e) => setConfig({ ...config, modoConteo: e.target.value })}
                  >
                    <option value="habiles">Días Hábiles (excluye fines de semana y feriados)</option>
                    <option value="calendario">Días Calendario (días corridos continuos)</option>
                  </Select>
                  <span className="text-[10px] text-muted-foreground mt-1 block">
                    Estándar oficial por defecto: días hábiles.
                  </span>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    loading={guardandoConfig}
                    className="w-full gap-2"
                  >
                    <Save className="h-4 w-4" />
                    <span>Guardar Parámetros</span>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Gestión de Feriados Chilenos */}
        <div className="md:col-span-7">
          <Card className="border-border">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Feriados Oficiales de Chile (2026-2027)
                </CardTitle>
                <CardDescription>
                  Días no hábiles considerados para los plazos y cálculos de morosidad
                </CardDescription>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setModalFeriado(true)}
                className="gap-1.5 text-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Agregar</span>
              </Button>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleRestablecerFeriadosOficiales}
                  className="text-[11px] font-semibold text-primary hover:underline"
                >
                  Restablecer Feriados Oficiales de Chile
                </button>
              </div>

              <div className="max-h-96 overflow-y-auto rounded-2xl border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Festividad</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feriados.map((f, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-mono text-xs font-semibold text-primary">
                          {formatoFecha(f.fecha)}
                        </TableCell>
                        <TableCell className="text-xs font-medium text-foreground">
                          {f.nombre}
                        </TableCell>
                        <TableCell>
                          {f.irrenunciable ? (
                            <Badge variant="warning" className="text-[9px] px-1.5 py-0">
                              Irrenunciable
                            </Badge>
                          ) : (
                            <Badge variant="default" className="text-[9px] px-1.5 py-0">
                              Feriado
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <button
                            type="button"
                            onClick={() => handleEliminarFeriado(f.fecha)}
                            title="Eliminar feriado"
                            className="p-1 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal Agregar Feriado */}
      <Dialog
        open={modalFeriado}
        onClose={() => setModalFeriado(false)}
        title="Agregar Nuevo Feriado"
        description="Registra una fecha inhábil para el cómputo de plazos y multas."
      >
        <form onSubmit={handleAgregarFeriado} className="space-y-4 mt-2">
          {errorFeriado && (
            <div className="p-3 rounded-2xl bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorFeriado}</span>
            </div>
          )}

          <div>
            <Label htmlFor="fechaFeriado" required>Fecha del Feriado</Label>
            <Input
              id="fechaFeriado"
              type="date"
              value={nuevoFeriado.fecha}
              onChange={(e) => setNuevoFeriado({ ...nuevoFeriado, fecha: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="nombreFeriado" required>Nombre de la Festividad</Label>
            <Input
              id="nombreFeriado"
              value={nuevoFeriado.nombre}
              onChange={(e) => setNuevoFeriado({ ...nuevoFeriado, nombre: e.target.value })}
              placeholder="Ej: Feriado Regional o Extraordinario"
              required
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="irrenunciable"
              checked={nuevoFeriado.irrenunciable}
              onChange={(e) => setNuevoFeriado({ ...nuevoFeriado, irrenunciable: e.target.checked })}
              className="rounded text-primary focus:ring-ring h-4 w-4"
            />
            <label htmlFor="irrenunciable" className="text-xs text-foreground cursor-pointer">
              Feriado irrenunciable
            </label>
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalFeriado(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
            >
              Agregar Feriado
            </Button>
          </div>
        </form>
      </Dialog>

      {/* AlertDialog Restablecer Datos Semilla */}
      <AlertDialog
        open={dialogoReset}
        onClose={() => setDialogoReset(false)}
        onConfirm={handleReiniciarTodoElSistema}
        title="¿Restablecer todos los datos del sistema?"
        description="Esta acción borrará cualquier modificación hecha en esta sesión y volverá a cargar exactamente los datos semilla iniciales (15 libros, 12 usuarios, 10 préstamos, 2 multas y feriados oficiales). Útil para reiniciar las pruebas."
        confirmText="Sí, restablecer datos"
        variant="destructive"
      />
    </div>
  )
}

