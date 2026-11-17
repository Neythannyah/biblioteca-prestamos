import { obtenerInstancia as getSupabase } from '../../patterns/singleton/supabaseClient.js'

const CONFIG_DEFAULT = {
  tarifaDiaria: 1000,
  plazoEstudiante: 5,
  plazoDocente: 10,
  modoConteo: 'habiles'
}

let cacheConfig = null

export const configService = {
  obtenerConfig() {
    if (cacheConfig) return cacheConfig
    this.cargarConfig().catch(() => {})
    return CONFIG_DEFAULT
  },

  async cargarConfig() {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('configuracion')
      .select('clave, valor')

    if (!error && data) {
      const mapa = {}
      data.forEach(item => {
        mapa[item.clave] = item.valor
      })

      cacheConfig = {
        tarifaDiaria: mapa.tarifa_multa ? parseInt(mapa.tarifa_multa, 10) : CONFIG_DEFAULT.tarifaDiaria,
        plazoEstudiante: mapa.plazo_estudiante ? parseInt(mapa.plazo_estudiante, 10) : CONFIG_DEFAULT.plazoEstudiante,
        plazoDocente: mapa.plazo_docente ? parseInt(mapa.plazo_docente, 10) : CONFIG_DEFAULT.plazoDocente,
        modoConteo: mapa.multa_modo || CONFIG_DEFAULT.modoConteo
      }
      return cacheConfig
    }
    return CONFIG_DEFAULT
  },

  async actualizarConfig(nuevaConfig) {
    const supabase = getSupabase()
    const configActual = this.obtenerConfig()

    const fusionada = {
      ...configActual,
      ...nuevaConfig,
      tarifaDiaria: nuevaConfig.tarifaDiaria !== undefined ? Math.max(0, Number(nuevaConfig.tarifaDiaria)) : configActual.tarifaDiaria,
      plazoEstudiante: nuevaConfig.plazoEstudiante !== undefined ? Math.max(1, Number(nuevaConfig.plazoEstudiante)) : configActual.plazoEstudiante,
      plazoDocente: nuevaConfig.plazoDocente !== undefined ? Math.max(1, Number(nuevaConfig.plazoDocente)) : configActual.plazoDocente,
      modoConteo: nuevaConfig.modoConteo === 'calendario' ? 'calendario' : 'habiles'
    }

    const updates = [
      { clave: 'tarifa_multa', valor: String(fusionada.tarifaDiaria) },
      { clave: 'plazo_estudiante', valor: String(fusionada.plazoEstudiante) },
      { clave: 'plazo_docente', valor: String(fusionada.plazoDocente) },
      { clave: 'multa_modo', valor: fusionada.modoConteo }
    ]

    for (const item of updates) {
      await supabase.from('configuracion').upsert(item, { onConflict: 'clave' })
    }

    cacheConfig = fusionada
    return fusionada
  }
}
