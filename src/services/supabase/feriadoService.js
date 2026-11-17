import { obtenerInstancia as getSupabase } from '../../patterns/singleton/supabaseClient.js'
import { FERIADOS_OFICIALES_CHILE, normalizarFechaStr } from '../../domain/calendario.js'

let cacheFeriados = null

export const feriadoService = {
  /**
   * Obtiene la lista de feriados (síncrono si está en caché, o asíncrono desde la BD)
   */
  obtenerFeriados() {
    if (cacheFeriados && cacheFeriados.length > 0) {
      return cacheFeriados
    }
    // Carga asíncrona en segundo plano
    this.cargarFeriados().catch(() => {})
    return FERIADOS_OFICIALES_CHILE
  },

  async cargarFeriados() {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('feriado')
      .select('fecha, nombre')
      .order('fecha', { ascending: true })

    if (!error && data) {
      cacheFeriados = data.map(f => ({
        fecha: f.fecha,
        nombre: f.nombre,
        irrenunciable: f.nombre.includes('Irrenunciable')
      }))
      return cacheFeriados
    }
    return FERIADOS_OFICIALES_CHILE
  },

  async agregarFeriado(feriado) {
    if (!feriado.fecha) throw new Error('La fecha del feriado es obligatoria.')
    if (!feriado.nombre?.trim()) throw new Error('El nombre de la festividad es obligatorio.')

    const fechaNorm = normalizarFechaStr(feriado.fecha)
    const supabase = getSupabase()

    const { data, error } = await supabase
      .from('feriado')
      .insert({
        fecha: fechaNorm,
        nombre: feriado.nombre.trim()
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        throw new Error(`Ya existe un feriado registrado para la fecha ${fechaNorm}.`)
      }
      throw new Error(`Error al agregar feriado: ${error.message}`)
    }

    await this.cargarFeriados()
    return data
  },

  async eliminarFeriado(fecha) {
    const fechaNorm = normalizarFechaStr(fecha)
    const supabase = getSupabase()

    const { error } = await supabase
      .from('feriado')
      .delete()
      .eq('fecha', fechaNorm)

    if (error) {
      throw new Error(`Error al eliminar feriado: ${error.message}`)
    }

    await this.cargarFeriados()
    return true
  },

  async restablecerFeriadosOficiales() {
    const supabase = getSupabase()
    const inserts = FERIADOS_OFICIALES_CHILE.map(f => ({
      fecha: f.fecha,
      nombre: f.nombre
    }))

    await supabase.from('feriado').upsert(inserts, { onConflict: 'fecha' })
    await this.cargarFeriados()
    return FERIADOS_OFICIALES_CHILE
  }
}
