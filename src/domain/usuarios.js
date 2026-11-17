import { estaVencido } from './prestamos.js'

/**
 * Evalúa el estado que debe tener un usuario dado el conjunto de sus préstamos y multas.
 * Regla:
 * - Usuario con multa pendiente O con préstamo activo vencido queda Bloqueado.
 * - Se habilita cuando paga el total de la multa y no tiene atrasos activos.
 * @param {object} usuario
 * @param {Array} prestamosUsuario
 * @param {Array} multasUsuario
 * @param {string|Date} [fechaReferencia]
 * @returns {{ estado: 'Habilitado'|'Bloqueado', motivo_bloqueo: string|null }}
 */
export function evaluarEstadoUsuario(
  usuario,
  prestamosUsuario = [],
  multasUsuario = [],
  fechaReferencia = new Date()
) {
  const multasPendientes = multasUsuario.filter(m => m.estado === 'Pendiente')
  const prestamosVencidos = prestamosUsuario.filter(p =>
    p.estado === 'Activo' && estaVencido(p, fechaReferencia)
  )

  const motivos = []

  if (prestamosVencidos.length > 0) {
    motivos.push(`Tiene ${prestamosVencidos.length} préstamo(s) activo(s) con fecha de entrega vencida`)
  }

  if (multasPendientes.length > 0) {
    const total = multasPendientes.reduce((acc, m) => acc + (m.monto || 0), 0)
    motivos.push(`Tiene ${multasPendientes.length} multa(s) pendiente(s) por un total de $${total.toLocaleString('es-CL')}`)
  }

  if (motivos.length > 0) {
    return {
      estado: 'Bloqueado',
      motivo_bloqueo: motivos.join('; ')
    }
  }

  return {
    estado: 'Habilitado',
    motivo_bloqueo: null
  }
}

