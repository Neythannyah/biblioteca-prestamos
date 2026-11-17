/**
 * Utilidades de formateo para la interfaz en español (Chile)
 */

/**
 * Formatea un número como moneda chilena (CLP), ej: $1.000, $15.500
 * @param {number} valor
 * @returns {string}
 */
export function formatoCLP(valor) {
  if (valor === undefined || valor === null || isNaN(valor)) {
    return '$0'
  }
  const numero = Math.round(Number(valor))
  return `$${numero.toLocaleString('es-CL')}`
}

/**
 * Formatea una fecha string (YYYY-MM-DD) o Date a formato chileno dd/mm/aaaa
 * @param {string|Date} fecha
 * @returns {string}
 */
export function formatoFecha(fecha) {
  if (!fecha) return '-'
  if (typeof fecha === 'string') {
    const soloFecha = fecha.split('T')[0]
    const partes = soloFecha.split('-')
    if (partes.length === 3) {
      const [y, m, d] = partes
      return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`
    }
  }
  const d = new Date(fecha)
  if (isNaN(d.getTime())) return '-'
  const dia = String(d.getDate()).padStart(2, '0')
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const anio = d.getFullYear()
  return `${dia}/${mes}/${anio}`
}

/**
 * Formato de fecha y hora para comprobantes y auditoría
 * @param {string|Date} fecha
 * @returns {string}
 */
export function formatoFechaHora(fecha) {
  if (!fecha) return '-'
  const d = new Date(fecha)
  if (isNaN(d.getTime())) return '-'
  return d.toLocaleString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

