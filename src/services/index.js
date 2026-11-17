import { inicializarStorage } from './mock/storage.js'
import { authService as mockAuth } from './mock/authService.js'
import { libroService as mockLibro } from './mock/libroService.js'
import { usuarioService as mockUsuario } from './mock/usuarioService.js'
import { prestamoService as mockPrestamo } from './mock/prestamoService.js'
import { multaService as mockMulta } from './mock/multaService.js'
import { reporteService as mockReporte } from './mock/reporteService.js'
import { feriadoService as mockFeriado } from './mock/feriadoService.js'
import { configService as mockConfig } from './mock/configService.js'

import { authService as sbAuth } from './supabase/authService.js'
import { libroService as sbLibro } from './supabase/libroService.js'
import { usuarioService as sbUsuario } from './supabase/usuarioService.js'
import { prestamoService as sbPrestamo } from './supabase/prestamoService.js'
import { multaService as sbMulta } from './supabase/multaService.js'
import { reporteService as sbReporte } from './supabase/reporteService.js'
import { feriadoService as sbFeriado } from './supabase/feriadoService.js'
import { configService as sbConfig } from './supabase/configService.js'

import { estadoUsuarioServiceGlobal } from '../patterns/observer/EstadoUsuarioService.js'
import { obtenerInstancia as getSupabase } from '../patterns/singleton/supabaseClient.js'

const DATA_SOURCE = import.meta.env.VITE_DATA_SOURCE || 'mock'
const esSupabase = DATA_SOURCE === 'supabase'

if (!esSupabase) {
  // Inicializar almacenamiento mock en memoria / localStorage solo si es modo mock
  inicializarStorage()
}

// Servicios activos según VITE_DATA_SOURCE
export const authService = esSupabase ? sbAuth : mockAuth
export const libroService = esSupabase ? sbLibro : mockLibro
export const usuarioService = esSupabase ? sbUsuario : mockUsuario
export const prestamoService = esSupabase ? sbPrestamo : mockPrestamo
export const multaService = esSupabase ? sbMulta : mockMulta
export const reporteService = esSupabase ? sbReporte : mockReporte
export const feriadoService = esSupabase ? sbFeriado : mockFeriado
export const configService = esSupabase ? sbConfig : mockConfig

// Conectar el Observador (Patrón Observer) con los servicios activos
estadoUsuarioServiceGlobal.setServices({
  usuarioService,
  prestamoService,
  multaService,
  configService,
  feriadoService
})

// Ejecutar sincronización inicial de préstamos vencidos
if (esSupabase) {
  // En Supabase, llamamos al procedimiento almacenado del observador en BD
  try {
    getSupabase().rpc('actualizar_estados_por_vencimiento').then(() => { }).catch(() => { })
  } catch (e) {
    // diferir
  }
} else {
  try {
    estadoUsuarioServiceGlobal.verificarVencimientosGenerales()
  } catch (e) {
    console.warn('Verificación inicial de vencimientos diferida:', e)
  }
}

export default {
  authService,
  libroService,
  usuarioService,
  prestamoService,
  multaService,
  reporteService,
  feriadoService,
  configService
}
