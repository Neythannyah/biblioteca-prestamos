import {
  SEED_LIBROS,
  SEED_USUARIOS,
  SEED_PRESTAMOS,
  SEED_MULTAS,
  SEED_CONFIG
} from './initialData.js'
import { FERIADOS_OFICIALES_CHILE } from '../../domain/calendario.js'

const STORAGE_KEYS = {
  LIBROS: 'biblio_mock_libros_v1',
  USUARIOS: 'biblio_mock_usuarios_v1',
  PRESTAMOS: 'biblio_mock_prestamos_v1',
  MULTAS: 'biblio_mock_multas_v1',
  CONFIG: 'biblio_mock_config_v1',
  FERIADOS: 'biblio_mock_feriados_v1',
  AUTH: 'biblio_mock_auth_v1'
}

// Soporte para entornos Node.js / Vitest sin navegador
const memoryStore = {}
const safeStorage = typeof localStorage !== 'undefined' ? localStorage : {
  getItem: (k) => memoryStore[k] || null,
  setItem: (k, v) => { memoryStore[k] = String(v) },
  removeItem: (k) => { delete memoryStore[k] },
  clear: () => { Object.keys(memoryStore).forEach(k => delete memoryStore[k]) }
}

if (typeof globalThis !== 'undefined' && typeof globalThis.localStorage === 'undefined') {
  globalThis.localStorage = safeStorage
}

function leer(key, defecto) {
  try {
    const item = safeStorage.getItem(key)
    return item ? JSON.parse(item) : defecto
  } catch (err) {
    console.error(`Error leyendo de storage (${key}):`, err)
    return defecto
  }
}

function guardar(key, datos) {
  try {
    safeStorage.setItem(key, JSON.stringify(datos))
  } catch (err) {
    console.error(`Error guardando en storage (${key}):`, err)
  }
}

export function inicializarStorage(forzarReinicio = false) {
  if (forzarReinicio || !safeStorage.getItem(STORAGE_KEYS.LIBROS)) {
    guardar(STORAGE_KEYS.LIBROS, SEED_LIBROS)
    guardar(STORAGE_KEYS.USUARIOS, SEED_USUARIOS)
    guardar(STORAGE_KEYS.PRESTAMOS, SEED_PRESTAMOS)
    guardar(STORAGE_KEYS.MULTAS, SEED_MULTAS)
    guardar(STORAGE_KEYS.CONFIG, SEED_CONFIG)
    guardar(STORAGE_KEYS.FERIADOS, FERIADOS_OFICIALES_CHILE)
  }
}

export const dbStorage = {
  getLibros: () => leer(STORAGE_KEYS.LIBROS, SEED_LIBROS),
  setLibros: (data) => guardar(STORAGE_KEYS.LIBROS, data),

  getUsuarios: () => leer(STORAGE_KEYS.USUARIOS, SEED_USUARIOS),
  setUsuarios: (data) => guardar(STORAGE_KEYS.USUARIOS, data),

  getPrestamos: () => leer(STORAGE_KEYS.PRESTAMOS, SEED_PRESTAMOS),
  setPrestamos: (data) => guardar(STORAGE_KEYS.PRESTAMOS, data),

  getMultas: () => leer(STORAGE_KEYS.MULTAS, SEED_MULTAS),
  setMultas: (data) => guardar(STORAGE_KEYS.MULTAS, data),

  getConfig: () => leer(STORAGE_KEYS.CONFIG, SEED_CONFIG),
  setConfig: (data) => guardar(STORAGE_KEYS.CONFIG, data),

  getFeriados: () => leer(STORAGE_KEYS.FERIADOS, FERIADOS_OFICIALES_CHILE),
  setFeriados: (data) => guardar(STORAGE_KEYS.FERIADOS, data),

  getAuth: () => leer(STORAGE_KEYS.AUTH, null),
  setAuth: (data) => guardar(STORAGE_KEYS.AUTH, data),

  resetTodo: () => {
    safeStorage.removeItem(STORAGE_KEYS.LIBROS)
    safeStorage.removeItem(STORAGE_KEYS.USUARIOS)
    safeStorage.removeItem(STORAGE_KEYS.PRESTAMOS)
    safeStorage.removeItem(STORAGE_KEYS.MULTAS)
    safeStorage.removeItem(STORAGE_KEYS.CONFIG)
    safeStorage.removeItem(STORAGE_KEYS.FERIADOS)
    inicializarStorage(true)
  }
}
