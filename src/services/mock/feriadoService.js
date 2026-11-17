import { dbStorage } from './storage.js'
import { FERIADOS_OFICIALES_CHILE, normalizarFechaStr } from '../../domain/calendario.js'

export const feriadoService = {
  obtenerFeriados() {
    return dbStorage.getFeriados()
  },

  async agregarFeriado(feriado) {
    if (!feriado.fecha) throw new Error('La fecha del feriado es obligatoria.')
    if (!feriado.nombre?.trim()) throw new Error('El nombre de la festividad es obligatorio.')

    const fechaNorm = normalizarFechaStr(feriado.fecha)
    const feriados = dbStorage.getFeriados()

    if (feriados.some(f => normalizarFechaStr(f.fecha) === fechaNorm)) {
      throw new Error(`Ya existe un feriado registrado para la fecha ${fechaNorm}.`)
    }

    const nuevo = {
      fecha: fechaNorm,
      nombre: feriado.nombre.trim(),
      irrenunciable: Boolean(feriado.irrenunciable)
    }

    feriados.push(nuevo)
    feriados.sort((a, b) => a.fecha.localeCompare(b.fecha))
    dbStorage.setFeriados(feriados)
    return nuevo
  },

  async eliminarFeriado(fecha) {
    const fechaNorm = normalizarFechaStr(fecha)
    let feriados = dbStorage.getFeriados()
    feriados = feriados.filter(f => normalizarFechaStr(f.fecha) !== fechaNorm)
    dbStorage.setFeriados(feriados)
    return true
  },

  async restablecerFeriadosOficiales() {
    dbStorage.setFeriados(FERIADOS_OFICIALES_CHILE)
    return FERIADOS_OFICIALES_CHILE
  }
}

