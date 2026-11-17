import { createClient } from '@supabase/supabase-js'

/**
 * Patrón Singleton: SupabaseClient
 * Garantiza una única instancia del cliente de Supabase (@supabase/supabase-js)
 * en toda la aplicación, inicializada con las variables de entorno VITE_SUPABASE_URL
 * y VITE_SUPABASE_ANON_KEY.
 */
class SupabaseClientSingleton {
  constructor() {
    if (SupabaseClientSingleton.instancia) {
      return SupabaseClientSingleton.instancia
    }

    const url = import.meta.env.VITE_SUPABASE_URL || 'https://rkscphlceqfncvuzejxu.supabase.co'
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder'

    this.url = url
    this.anonKey = anonKey
    this.token = null

    this.client = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })

    SupabaseClientSingleton.instancia = this
  }

  setAuthToken(token) {
    this.token = token
  }

  getHeaders() {
    return {
      'apikey': this.anonKey,
      'Authorization': `Bearer ${this.token || this.anonKey}`,
      'Content-Type': 'application/json'
    }
  }

  get auth() {
    return this.client.auth
  }

  from(table) {
    return this.client.from(table)
  }

  rpc(fn, args) {
    return this.client.rpc(fn, args)
  }
}

let instanciaUnica = null

/**
 * Obtiene la única instancia compartida del cliente
 * @returns {SupabaseClientSingleton}
 */
export function obtenerInstancia() {
  if (!instanciaUnica) {
    instanciaUnica = new SupabaseClientSingleton()
  }
  return instanciaUnica
}

export const getSupabase = () => obtenerInstancia()

export default obtenerInstancia
