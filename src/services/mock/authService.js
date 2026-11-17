import { dbStorage } from './storage.js'
import { obtenerInstancia as getSupabase } from '../../patterns/singleton/supabaseClient.js'

const ENCARGADO_VALIDO = {
  usuario: 'encargado',
  clave: 'Biblioteca2026!',
  nombre: 'Encargado de Biblioteca',
  correo: 'biblioteca@institucion.cl',
  rol: 'Encargado'
}

export const authService = {
  /**
   * Inicia sesión del Encargado de Biblioteca (RF1)
   * @param {string} usuario
   * @param {string} clave
   * @returns {Promise<{ sesion: object, token: string }>}
   */
  async login(usuario, clave) {
    await new Promise(r => setTimeout(r, 200)) // Simulación de latencia de red

    if (!usuario || !clave) {
      throw new Error('Mostrar error de acceso: Debes ingresar usuario y contraseña.')
    }

    const usr = usuario.trim().toLowerCase()

    if (usr !== ENCARGADO_VALIDO.usuario || clave !== ENCARGADO_VALIDO.clave) {
      throw new Error('Mostrar error de acceso: Credenciales inválidas. Verifica tu usuario y contraseña.')
    }

    const token = `mock-bearer-token-${Date.now()}`
    const sesion = {
      token,
      usuario: {
        id: 'usr_encargado_01',
        usuario: ENCARGADO_VALIDO.usuario,
        nombre: ENCARGADO_VALIDO.nombre,
        correo: ENCARGADO_VALIDO.correo,
        rol: ENCARGADO_VALIDO.rol
      },
      fechaInicio: new Date().toISOString()
    }

    dbStorage.setAuth(sesion)

    // Configurar el singleton de cliente con el token bearer simulado
    getSupabase().setAuthToken(token)

    return sesion
  },

  /**
   * Cierra la sesión activa
   */
  async logout() {
    await new Promise(r => setTimeout(r, 100))
    dbStorage.setAuth(null)
    getSupabase().setAuthToken(null)
    return true
  },

  /**
   * Obtiene la sesión actual almacenada
   */
  obtenerSesion() {
    const sesion = dbStorage.getAuth()
    if (sesion && sesion.token) {
      getSupabase().setAuthToken(sesion.token)
    }
    return sesion
  },

  /**
   * Valida la validez de la sesión actual (RF2 "Validar sesión")
   */
  async validarSesion() {
    const sesion = this.obtenerSesion()
    if (!sesion || !sesion.token) {
      return { valida: false, sesion: null }
    }
    return { valida: true, sesion }
  }
}

