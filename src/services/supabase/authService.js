import { obtenerInstancia as getSupabase } from '../../patterns/singleton/supabaseClient.js'

const SESION_STORAGE_KEY = 'biblio_supabase_session'

function mapearUsuario(user, session) {
  if (!user) return null
  return {
    id: user.id,
    usuario: user.email?.split('@')[0] || 'encargado',
    nombre: user.user_metadata?.nombre || 'Encargado de Biblioteca',
    correo: user.email,
    rol: 'Encargado'
  }
}

export const authService = {
  /**
   * Inicia sesión del Encargado de Biblioteca contra Supabase Auth (RF1)
   * Acepta tanto el email oficial ('admin@mail.cl') como el nombre de usuario ('admin' o 'encargado').
   */
  async login(usuario, clave) {
    if (!usuario?.trim() || !clave) {
      throw new Error('Mostrar error de acceso: Debes ingresar usuario y contraseña.')
    }

    const supabase = getSupabase()
    const inputLimpio = usuario.trim().toLowerCase()
    let email = inputLimpio

    // Si el usuario ingresó un nombre de usuario sin arroba, resolver al email correspondiente
    if (!email.includes('@')) {
      if (email === 'admin' || email === 'encargado') {
        email = 'admin@mail.cl'
      } else {
        email = `${email}@mail.cl`
      }
    }

    let data, error
    try {
      const res = await supabase.auth.signInWithPassword({
        email,
        password: clave
      })
      data = res.data
      error = res.error
    } catch (errRed) {
      // Excepción en la petición de red (fetch / DNS / CORS / timeout)
      throw new Error('Error de conexión: No se pudo contactar al servidor de autenticación. Verifica tu conexión a internet o la disponibilidad del servicio.')
    }

    if (error) {
      const msg = (error.message || '').toLowerCase()
      const status = error.status

      // Detectar fallas de red o conexión reportadas por la respuesta
      const esFallaConexion =
        msg.includes('failed to fetch') ||
        msg.includes('network') ||
        msg.includes('connection') ||
        msg.includes('timeout') ||
        msg.includes('load failed') ||
        status === 0

      if (esFallaConexion) {
        throw new Error('Error de conexión: No se pudo contactar al servidor de autenticación. Verifica tu conexión a internet o la disponibilidad del servicio.')
      }

      // Credenciales inválidas
      if (
        msg.includes('invalid login credentials') ||
        msg.includes('invalid grant') ||
        msg.includes('email not confirmed') ||
        status === 400
      ) {
        throw new Error('Mostrar error de acceso: Credenciales inválidas. Verifica tu usuario y contraseña.')
      }

      // Error general
      throw new Error(`Mostrar error de acceso: ${error.message || 'Error al autenticar'}`)
    }

    if (!data?.session) {
      throw new Error('Mostrar error de acceso: Credenciales inválidas. Verifica tu usuario y contraseña.')
    }

    const sesion = {
      token: data.session.access_token,
      usuario: mapearUsuario(data.user, data.session),
      fechaInicio: new Date().toISOString()
    }

    supabase.setAuthToken(data.session.access_token)
    try {
      localStorage.setItem(SESION_STORAGE_KEY, JSON.stringify(sesion))
    } catch (e) {
      // Ignorar si localStorage está restringido
    }

    return sesion
  },

  /**
   * Cierra la sesión activa en Supabase Auth
   */
  async logout() {
    const supabase = getSupabase()
    try {
      await supabase.auth.signOut()
    } catch (e) {
      // Continuar con limpieza local incluso si la red falla
    }
    supabase.setAuthToken(null)
    try {
      localStorage.removeItem(SESION_STORAGE_KEY)
    } catch (e) {
      // Ignorar
    }
    return true
  },

  /**
   * Obtiene la sesión actual almacenada síncronamente
   */
  obtenerSesion() {
    try {
      const guardada = localStorage.getItem(SESION_STORAGE_KEY)
      if (guardada) {
        const sesion = JSON.parse(guardada)
        if (sesion?.token) {
          getSupabase().setAuthToken(sesion.token)
          return sesion
        }
      }
    } catch (e) {
      // Ignorar
    }
    return null
  },

  /**
   * Valida la sesión activa directamente contra Supabase
   */
  async validarSesion() {
    const supabase = getSupabase()
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error || !session) {
        this.logout()
        return { valida: false, sesion: null }
      }

      supabase.setAuthToken(session.access_token)
      const sesion = {
        token: session.access_token,
        usuario: mapearUsuario(session.user, session),
        fechaInicio: new Date().toISOString()
      }
      try {
        localStorage.setItem(SESION_STORAGE_KEY, JSON.stringify(sesion))
      } catch (e) {}

      return { valida: true, sesion }
    } catch (e) {
      return { valida: false, sesion: null }
    }
  }
}
