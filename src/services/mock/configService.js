import { dbStorage } from './storage.js'
import { SEED_CONFIG } from './initialData.js'

export const configService = {
  obtenerConfig() {
    return dbStorage.getConfig() || SEED_CONFIG
  },

  async actualizarConfig(nuevaConfig) {
    const configActual = this.obtenerConfig()
    const fusionada = {
      ...configActual,
      ...nuevaConfig,
      tarifaDiaria: nuevaConfig.tarifaDiaria !== undefined ? Math.max(0, Number(nuevaConfig.tarifaDiaria)) : configActual.tarifaDiaria,
      plazoEstudiante: nuevaConfig.plazoEstudiante !== undefined ? Math.max(1, Number(nuevaConfig.plazoEstudiante)) : configActual.plazoEstudiante,
      plazoDocente: nuevaConfig.plazoDocente !== undefined ? Math.max(1, Number(nuevaConfig.plazoDocente)) : configActual.plazoDocente,
      modoConteo: nuevaConfig.modoConteo === 'calendario' ? 'calendario' : 'habiles'
    }

    dbStorage.setConfig(fusionada)
    return fusionada
  }
}

