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
   */
  async login(usuario, clave) {
    if (!usuario?.trim() || !clave) {
      throw new Error('Mostrar error de acceso: Debes ingresar usuario y contraseña.')
    }

    const supabase = getSupabase()
    let email = usuario.trim().toLowerCase()

    // Si el usuario ingresó 'admin' o 'encargado', resolver al correo configurado en Supabase
    if (!email.includes('@')) {
      if (email === 'admin' || email === 'encargado') {
        email = 'admin@mail.cl'
      } else {
        email = `${email}@mail.cl`
      }
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: clave
    })

    if (error || !data?.session) {
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
