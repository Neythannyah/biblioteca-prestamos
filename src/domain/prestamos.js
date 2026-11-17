import { sumarDiasHabiles, parsearFecha, normalizarFechaStr } from './calendario.js'

export const PLAZOS_POR_DEFECTO = {
  Estudiante: 5,
  Docente: 10,
}

/**
 * Calcula la fecha de vencimiento según el tipo de usuario y días hábiles.
 * @param {string|Date} fechaPrestamo
 * @param {'Estudiante'|'Docente'} tipoUsuario
 * @param {Array} feriados
 * @param {object} [plazosConfig]
 * @returns {string} Fecha de vencimiento YYYY-MM-DD
 */
export function calcularFechaVencimiento(
  fechaPrestamo,
  tipoUsuario,
  feriados = [],
  plazosConfig = PLAZOS_POR_DEFECTO
) {
  const dias = plazosConfig[tipoUsuario] ?? (tipoUsuario === 'Docente' ? 10 : 5)
  return sumarDiasHabiles(fechaPrestamo, dias, feriados)
}

/**
 * Verifica si un préstamo se encuentra vencido respecto a una fecha de referencia.
 * @param {object} prestamo
 * @param {string|Date} [fechaReferencia]
 * @returns {boolean}
 */
export function estaVencido(prestamo, fechaReferencia = new Date()) {
  if (!prestamo || !prestamo.fecha_vencimiento) return false
  // Si ya fue devuelto, no está vencido activo (su atraso se registra en la devolución)
  if (prestamo.estado === 'Devuelto') return false

  const fVenc = parsearFecha(prestamo.fecha_vencimiento)
  const fRef = parsearFecha(fechaReferencia)

  return fRef > fVenc
}

/**
 * Valida si un usuario es apto para solicitar un nuevo préstamo.
 * Regla: Usuario debe estar Habilitado, sin multas pendientes y sin préstamos activos vencidos.
 * @param {object} usuario
 * @param {Array} prestamosActivosUsuario
 * @param {Array} multasUsuario
 * @param {string|Date} [fechaReferencia]
 * @returns {{ apto: boolean, motivo?: string }}
 */
export function validarAptitudPrestamo(
  usuario,
  prestamosActivosUsuario = [],
  multasUsuario = [],
  fechaReferencia = new Date()
) {
  if (!usuario) {
    return { apto: false, motivo: 'Usuario no encontrado' }
  }

  // 1. Estado explícito del usuario
  if (usuario.estado === 'Bloqueado') {
    return {
      apto: false,
      motivo: usuario.motivo_bloqueo || 'El usuario se encuentra bloqueado en el sistema.'
    }
  }

  // 2. Multas pendientes
  const multasPendientes = multasUsuario.filter(m => m.estado === 'Pendiente')
  if (multasPendientes.length > 0) {
    const totalDeuda = multasPendientes.reduce((acc, m) => acc + (m.monto || 0), 0)
    return {
      apto: false,
      motivo: `El usuario tiene ${multasPendientes.length} multa(s) pendiente(s) por un total de $${totalDeuda.toLocaleString('es-CL')}.`
    }
  }

  // 3. Préstamos vencidos no devueltos
  const prestamosVencidos = prestamosActivosUsuario.filter(p =>
    p.estado === 'Activo' && estaVencido(p, fechaReferencia)
  )

  if (prestamosVencidos.length > 0) {
    return {
      apto: false,
      motivo: `El usuario tiene ${prestamosVencidos.length} préstamo(s) activo(s) con fecha de entrega vencida.`
    }
  }

  return { apto: true }
}

/**
 * Evalúa si un préstamo activo puede ser renovado.
 * Reglas:
 * - UNA sola renovación por préstamo (prestamo.renovado === false)
 * - NO debe estar vencido al momento de la renovación
 * - El usuario NO debe estar bloqueado
 * @param {object} prestamo
 * @param {object} usuario
 * @param {string|Date} [fechaReferencia]
 * @returns {{ puede: boolean, motivo?: string }}
 */
export function validarRenovacion(prestamo, usuario, fechaReferencia = new Date()) {
  if (!prestamo) {
    return { puede: false, motivo: 'Préstamo no válido.' }
  }

  if (prestamo.estado !== 'Activo') {
    return { puede: false, motivo: 'Solo se pueden renovar préstamos con estado Activo.' }
  }

  if (prestamo.renovado) {
    return { puede: false, motivo: 'El préstamo ya ha utilizado su única renovación permitida.' }
  }

  if (estaVencido(prestamo, fechaReferencia)) {
    return { puede: false, motivo: 'No es posible renovar un préstamo que ya se encuentra vencido.' }
  }

  if (usuario && usuario.estado === 'Bloqueado') {
    return { puede: false, motivo: 'No se puede renovar préstamos a un usuario bloqueado.' }
  }

  return { puede: true }
}

/**
 * Calcula la nueva fecha de vencimiento al renovar.
 * Extiende la fecha de vencimiento original por el mismo plazo inicial (5 o 10 días hábiles).
 * @param {object} prestamo
 * @param {Array} feriados
 * @param {object} [plazosConfig]
 * @returns {string} Nueva fecha de vencimiento YYYY-MM-DD
 */
export function calcularNuevaFechaRenovacion(
  prestamo,
  feriados = [],
  plazosConfig = PLAZOS_POR_DEFECTO
) {
  const tipo = prestamo.usuario_tipo || 'Estudiante'
  const dias = plazosConfig[tipo] ?? (tipo === 'Docente' ? 10 : 5)
  return sumarDiasHabiles(prestamo.fecha_vencimiento, dias, feriados)
}

