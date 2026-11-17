/**
 * Módulo de dominio para gestión de calendario, feriados y días hábiles en Chile.
 */

// Lista oficial verificada de feriados en Chile para 2026 y 2027 (fuente oficial: Leyes de la República / feriados.cl)
export const FERIADOS_OFICIALES_CHILE = [
  // 2026
  { fecha: '2026-01-01', nombre: 'Año Nuevo', irrenunciable: true },
  { fecha: '2026-04-03', nombre: 'Viernes Santo', irrenunciable: false },
  { fecha: '2026-04-04', nombre: 'Sábado Santo', irrenunciable: false },
  { fecha: '2026-05-01', nombre: 'Día Nacional del Trabajo', irrenunciable: true },
  { fecha: '2026-05-21', nombre: 'Día de las Glorias Navales', irrenunciable: false },
  { fecha: '2026-06-21', nombre: 'Día Nacional de los Pueblos Indígenas', irrenunciable: false },
  { fecha: '2026-06-29', nombre: 'San Pedro y San Pablo', irrenunciable: false },
  { fecha: '2026-07-16', nombre: 'Día de la Virgen del Carmen', irrenunciable: false },
  { fecha: '2026-08-15', nombre: 'Asunción de la Virgen', irrenunciable: false },
  { fecha: '2026-09-18', nombre: 'Fiestas Patrias / Independencia Nacional', irrenunciable: true },
  { fecha: '2026-09-19', nombre: 'Día de las Glorias del Ejército', irrenunciable: true },
  { fecha: '2026-10-12', nombre: 'Encuentro de Dos Mundos', irrenunciable: false },
  { fecha: '2026-10-31', nombre: 'Día de las Iglesias Evangélicas y Protestantes', irrenunciable: false },
  { fecha: '2026-11-01', nombre: 'Día de Todos los Santos', irrenunciable: false },
  { fecha: '2026-12-08', nombre: 'Inmaculada Concepción', irrenunciable: false },
  { fecha: '2026-12-25', nombre: 'Navidad', irrenunciable: true },

  // 2027
  { fecha: '2027-01-01', nombre: 'Año Nuevo', irrenunciable: true },
  { fecha: '2027-03-26', nombre: 'Viernes Santo', irrenunciable: false },
  { fecha: '2027-03-27', nombre: 'Sábado Santo', irrenunciable: false },
  { fecha: '2027-05-01', nombre: 'Día Nacional del Trabajo', irrenunciable: true },
  { fecha: '2027-05-21', nombre: 'Día de las Glorias Navales', irrenunciable: false },
  { fecha: '2027-06-21', nombre: 'Día Nacional de los Pueblos Indígenas', irrenunciable: false },
  { fecha: '2027-06-28', nombre: 'San Pedro y San Pablo', irrenunciable: false },
  { fecha: '2027-07-16', nombre: 'Día de la Virgen del Carmen', irrenunciable: false },
  { fecha: '2027-08-15', nombre: 'Asunción de la Virgen', irrenunciable: false },
  { fecha: '2027-09-17', nombre: 'Feriado Adicional Fiestas Patrias', irrenunciable: false },
  { fecha: '2027-09-18', nombre: 'Independencia Nacional', irrenunciable: true },
  { fecha: '2027-09-19', nombre: 'Día de las Glorias del Ejército', irrenunciable: true },
  { fecha: '2027-10-11', nombre: 'Encuentro de Dos Mundos', irrenunciable: false },
  { fecha: '2027-10-31', nombre: 'Día de las Iglesias Evangélicas y Protestantes', irrenunciable: false },
  { fecha: '2027-11-01', nombre: 'Día de Todos los Santos', irrenunciable: false },
  { fecha: '2027-12-08', nombre: 'Inmaculada Concepción', irrenunciable: false },
  { fecha: '2027-12-25', nombre: 'Navidad', irrenunciable: true }
]

/**
 * Normaliza una fecha a string YYYY-MM-DD
 * @param {string|Date} fecha
 * @returns {string}
 */
export function normalizarFechaStr(fecha) {
  if (!fecha) return ''
  if (typeof fecha === 'string') {
    return fecha.split('T')[0]
  }
  const y = fecha.getFullYear()
  const m = String(fecha.getMonth() + 1).padStart(2, '0')
  const d = String(fecha.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Parsea un string YYYY-MM-DD en Date local seguro (sin problemas de timezone UTC)
 * @param {string|Date} fecha
 * @returns {Date}
 */
export function parsearFecha(fecha) {
  if (fecha instanceof Date) {
    return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate())
  }
  const str = normalizarFechaStr(fecha)
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/**
 * Verifica si una fecha cae en fin de semana (Sábado = 6, Domingo = 0)
 * @param {string|Date} fecha
 * @returns {boolean}
 */
export function esFinDeSemana(fecha) {
  const d = parsearFecha(fecha)
  const diaSemana = d.getDay()
  return diaSemana === 0 || diaSemana === 6
}

/**
 * Verifica si una fecha corresponde a un feriado registrado
 * @param {string|Date} fecha
 * @param {Array<{fecha: string}>} [feriados]
 * @returns {boolean}
 */
export function esFeriado(fecha, feriados = FERIADOS_OFICIALES_CHILE) {
  const str = normalizarFechaStr(fecha)
  return feriados.some(f => normalizarFechaStr(f.fecha) === str)
}

/**
 * Verifica si una fecha es día hábil (Lunes a Viernes y NO feriado)
 * @param {string|Date} fecha
 * @param {Array<{fecha: string}>} [feriados]
 * @returns {boolean}
 */
export function esDiaHabil(fecha, feriados = FERIADOS_OFICIALES_CHILE) {
  if (esFinDeSemana(fecha)) return false
  if (esFeriado(fecha, feriados)) return false
  return true
}

/**
 * Suma N días hábiles a partir de una fecha dada.
 * Cada día sumado avanza al siguiente día hábil.
 * @param {string|Date} fechaInicio
 * @param {number} diasHabilesASumar
 * @param {Array<{fecha: string}>} [feriados]
 * @returns {string} Fecha de término en formato YYYY-MM-DD
 */
export function sumarDiasHabiles(fechaInicio, diasHabilesASumar, feriados = FERIADOS_OFICIALES_CHILE) {
  if (diasHabilesASumar <= 0) return normalizarFechaStr(fechaInicio)

  let actual = parsearFecha(fechaInicio)
  let sumados = 0

  while (sumados < diasHabilesASumar) {
    actual.setDate(actual.getDate() + 1)
    if (esDiaHabil(actual, feriados)) {
      sumados++
    }
  }

  return normalizarFechaStr(actual)
}

/**
 * Cuenta la cantidad de días hábiles transcurridos entre dos fechas (exclusivo inicio, inclusivo fin)
 * @param {string|Date} fechaInicio
 * @param {string|Date} fechaFin
 * @param {Array<{fecha: string}>} [feriados]
 * @returns {number}
 */
export function contarDiasHabiles(fechaInicio, fechaFin, feriados = FERIADOS_OFICIALES_CHILE) {
  const fInicio = parsearFecha(fechaInicio)
  const fFin = parsearFecha(fechaFin)

  if (fFin <= fInicio) return 0

  let actual = new Date(fInicio)
  let count = 0

  while (actual < fFin) {
    actual.setDate(actual.getDate() + 1)
    if (esDiaHabil(actual, feriados)) {
      count++
    }
  }

  return count
}

/**
 * Cuenta los días corridos/calendario entre dos fechas (exclusivo inicio, inclusivo fin)
 * @param {string|Date} fechaInicio
 * @param {string|Date} fechaFin
 * @returns {number}
 */
export function contarDiasCalendario(fechaInicio, fechaFin) {
  const fInicio = parsearFecha(fechaInicio)
  const fFin = parsearFecha(fechaFin)
  if (fFin <= fInicio) return 0
  const diffTime = fFin.getTime() - fInicio.getTime()
  return Math.round(diffTime / (1000 * 60 * 60 * 24))
}

