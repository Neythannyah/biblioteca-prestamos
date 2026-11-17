import { obtenerInstancia as getSupabase } from '../../patterns/singleton/supabaseClient.js'
import { authService } from './authService.js'
import { validarRut, formatearRut, limpiarRut } from '../../domain/rut.js'
import { UsuarioFactory } from '../../patterns/factory/UsuarioFactory.js'

function normalizarUsuario(u) {
  if (!u) return null
  return {
    ...u,
    id: String(u.id),
    plazo_dias: u.tipo === 'Docente' ? 10 : 5
  }
}

export const usuarioService = {
  /**
   * Lista usuarios con filtros opcionales
   */
  async listar(filtros = {}) {
    await authService.validarSesion()
    const supabase = getSupabase()

    let query = supabase
      .from('usuario')
      .select('id, rut, nombre, correo, tipo, estado, motivo_bloqueo, created_at')
      .order('id', { ascending: false })

    if (filtros.tipo && filtros.tipo !== 'todos') {
      query = query.eq('tipo', filtros.tipo)
    }

    if (filtros.estado && filtros.estado !== 'todos') {
      query = query.eq('estado', filtros.estado)
    }

    if (filtros.busqueda?.trim()) {
      const q = filtros.busqueda.trim()
      query = query.or(`nombre.ilike.%${q}%,correo.ilike.%${q}%,rut.ilike.%${q}%`)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Error al listar usuarios: ${error.message}`)
    }

    return (data || []).map(normalizarUsuario)
  },

  /**
   * Obtiene un usuario por ID
   */
  async obtenerPorId(id) {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('usuario')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      throw new Error('Usuario no encontrado.')
    }

    return normalizarUsuario(data)
  },

  /**
   * Obtiene un usuario por RUT
   */
  async obtenerPorRut(rut) {
    const supabase = getSupabase()
    const rutLimpio = limpiarRut(rut)
    const { data, error } = await supabase
      .from('usuario')
      .select('*')

    if (error || !data) return null
    const encontrado = data.find(u => limpiarRut(u.rut) === rutLimpio)
    return normalizarUsuario(encontrado)
  },

  /**
   * Crea un nuevo usuario utilizando el patrón FACTORY METHOD
   * (UsuarioFactory.fabricar) antes de persistir
   */
  async crear(datos) {
    await authService.validarSesion()
    const supabase = getSupabase()

    if (!datos.rut?.trim()) throw new Error('El RUT es obligatorio.')
    if (!datos.nombre?.trim()) throw new Error('El nombre completo es obligatorio.')
    if (!datos.correo?.trim()) throw new Error('El correo electrónico es obligatorio.')
    if (!['Estudiante', 'Docente'].includes(datos.tipo)) {
      throw new Error('El tipo de usuario debe ser "Estudiante" o "Docente".')
    }

    // 1. Validar formato y algoritmo de RUT chileno (Módulo 11)
    if (!validarRut(datos.rut)) {
      throw new Error('El RUT ingresado no es válido. Verifica el número y el dígito verificador.')
    }

    const rutFormateado = formatearRut(datos.rut)

    // 2. Creación estricta a través de la fábrica de usuarios (Factory Method)
    const usuarioInstancia = UsuarioFactory.fabricar(datos.tipo, {
      rut: rutFormateado,
      nombre: datos.nombre.trim(),
      correo: datos.correo.trim().toLowerCase(),
      carrera: datos.carrera,
      departamento: datos.departamento,
      estado: 'Habilitado',
      motivo_bloqueo: null
    })

    // 3. Persistir entidad creada por la fábrica en Supabase
    const { data, error } = await supabase
      .from('usuario')
      .insert({
        rut: usuarioInstancia.rut,
        nombre: usuarioInstancia.nombre,
        correo: usuarioInstancia.correo,
        tipo: usuarioInstancia.tipo,
        estado: usuarioInstancia.estado,
        motivo_bloqueo: usuarioInstancia.motivo_bloqueo
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505' || error.message?.includes('unique') || error.message?.includes('duplicate')) {
        throw new Error(`El RUT ${rutFormateado} ya se encuentra registrado en el sistema.`)
      }
      throw new Error(`Error al crear usuario: ${error.message}`)
    }

    return normalizarUsuario(data)
  },

  /**
   * Actualiza datos personales del usuario
   */
  async actualizar(id, datos) {
    await authService.validarSesion()
    const supabase = getSupabase()

    const payload = {}
    if (datos.nombre !== undefined) payload.nombre = datos.nombre.trim()
    if (datos.correo !== undefined) payload.correo = datos.correo.trim().toLowerCase()

    const { data, error } = await supabase
      .from('usuario')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Error al actualizar usuario: ${error.message}`)
    }

    return normalizarUsuario(data)
  },

  /**
   * Actualiza el estado y motivo de bloqueo del usuario
   */
  async actualizarEstado(id, nuevoEstado, motivo = null) {
    const supabase = getSupabase()
    await supabase
      .from('usuario')
      .update({
        estado: nuevoEstado,
        motivo_bloqueo: nuevoEstado === 'Bloqueado' ? motivo : null
      })
      .eq('id', id)
  }
}
