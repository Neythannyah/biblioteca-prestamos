/**
 * Módulo de dominio para validación y formateo de RUT chileno (módulo 11).
 */

/**
 * Limpia el RUT dejando solo dígitos y letra K en mayúscula
 * @param {string} rut
 * @returns {string}
 */
export function limpiarRut(rut) {
  if (!rut || typeof rut !== 'string') return ''
  return rut.replace(/[^0-9kK]/g, '').toUpperCase()
}

/**
 * Calcula el dígito verificador esperado para un cuerpo de RUT
 * @param {string|number} cuerpo
 * @returns {string} '0'-'9' o 'K'
 */
export function calcularDigitoVerificador(cuerpo) {
  const str = String(cuerpo).replace(/\D/g, '')
  if (!str) return ''

  let suma = 0
  let multiplicador = 2

  for (let i = str.length - 1; i >= 0; i--) {
    suma += parseInt(str.charAt(i), 10) * multiplicador
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1
  }

  const resto = suma % 11
  const dv = 11 - resto

  if (dv === 11) return '0'
  if (dv === 10) return 'K'
  return String(dv)
}

/**
 * Valida si un RUT chileno es válido según formato y algoritmo módulo 11
 * @param {string} rut
 * @returns {boolean}
 */
export function validarRut(rut) {
  const limpio = limpiarRut(rut)
  if (limpio.length < 8 || limpio.length > 9) return false

  const cuerpo = limpio.slice(0, -1)
  const dv = limpio.slice(-1)

  // El cuerpo debe ser solo numérico
  if (!/^\d+$/.test(cuerpo)) return false

  const dvEsperado = calcularDigitoVerificador(cuerpo)
  return dv === dvEsperado
}

/**
 * Formatea un RUT a su representación visual chilena estándar (ej: 12.345.678-K)
 * @param {string} rut
 * @returns {string}
 */
export function formatearRut(rut) {
  const limpio = limpiarRut(rut)
  if (!limpio) return ''
  if (limpio.length === 1) return limpio

  const cuerpo = limpio.slice(0, -1)
  const dv = limpio.slice(-1)

  // Agregar puntos al cuerpo con regex
  const cuerpoFormateado = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${cuerpoFormateado}-${dv}`
}

