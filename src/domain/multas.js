import { contarDiasHabiles, contarDiasCalendario, parsearFecha, normalizarFechaStr } from './calendario.js'

export const CONFIG_MULTA_DEFECTO = {
  tarifaDiaria: 1000, // CLP
  modoConteo: 'habiles', // 'habiles' | 'calendario'
}

/**
 * Calcula la cantidad de días de atraso entre la fecha de vencimiento y la fecha efectiva de entrega o consulta.
 * @param {string|Date} fechaVencimiento
 * @param {string|Date} fechaEfectiva
 * @param {Array} feriados
 * @param {'habiles'|'calendario'} [modoConteo]
 * @returns {number} Días de atraso (0 si no está vencido)
 */
export function calcularDiasAtraso(
  fechaVencimiento,
  fechaEfectiva,
  feriados = [],
  modoConteo = 'habiles'
) {
  const fVenc = parsearFecha(fechaVencimiento)
  const fEfectiva = parsearFecha(fechaEfectiva)

  if (fEfectiva <= fVenc) return 0

  if (modoConteo === 'calendario') {
    return contarDiasCalendario(fVenc, fEfectiva)
  }

  // Por defecto hábiles: días hábiles transcurridos desde fechaVencimiento hasta fechaEfectiva
  return contarDiasHabiles(fVenc, fEfectiva, feriados)
}

/**
 * Calcula el monto de la multa en función de los días de atraso y la tarifa diaria.
 * @param {number} diasAtraso
 * @param {number} [tarifaDiaria]
 * @returns {number} Monto en CLP (mínimo 0)
 */
export function calcularMontoMulta(diasAtraso, tarifaDiaria = 1000) {
  if (diasAtraso <= 0) return 0
  return Math.round(diasAtraso * tarifaDiaria)
}

/**
 * Calcula la multa estimada o final para un préstamo en una fecha dada.
 * @param {object} prestamo
 * @param {string|Date} fechaReferencia
 * @param {Array} feriados
 * @param {object} [config] { tarifaDiaria, modoConteo }
 * @returns {{ diasAtraso: number, monto: number, tieneAtraso: boolean }}
 */
export function calcularLiquidacionPrestamo(
  prestamo,
  fechaReferencia = new Date(),
  feriados = [],
  config = CONFIG_MULTA_DEFECTO
) {
  if (!prestamo || !prestamo.fecha_vencimiento) {
    return { diasAtraso: 0, monto: 0, tieneAtraso: false }
  }

  const modo = config.modoConteo || 'habiles'
  const tarifa = config.tarifaDiaria ?? 1000

  const fechaComparacion = prestamo.fecha_devolucion
    ? prestamo.fecha_devolucion
    : fechaReferencia

  const diasAtraso = calcularDiasAtraso(prestamo.fecha_vencimiento, fechaComparacion, feriados, modo)
  const monto = calcularMontoMulta(diasAtraso, tarifa)

  return {
    diasAtraso,
    monto,
    tieneAtraso: diasAtraso > 0,
  }
}

