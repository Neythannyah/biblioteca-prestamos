import { obtenerInstancia as getSupabase } from '../../patterns/singleton/supabaseClient.js'
import { authService } from './authService.js'

function normalizarLibro(l) {
  if (!l) return null
  return {
    ...l,
    id: String(l.id),
    estado: l.estado === 'En reparacion' ? 'En reparación' : l.estado
  }
}

export const libroService = {
  /**
   * Lista libros con filtros de búsqueda y estado
   */
  async listar(filtros = {}) {
    await authService.validarSesion()
    const supabase = getSupabase()

    let query = supabase
      .from('libro')
      .select('id, codigo, titulo, autor, editorial, anio, estado, created_at')
      .order('id', { ascending: false })

    if (filtros.estado && filtros.estado !== 'todos') {
      const estadoDb = filtros.estado === 'En reparación' ? 'En reparacion' : filtros.estado
      query = query.eq('estado', estadoDb)
    }

    if (filtros.busqueda?.trim()) {
      const q = filtros.busqueda.trim()
      query = query.or(`titulo.ilike.%${q}%,autor.ilike.%${q}%,codigo.ilike.%${q}%,editorial.ilike.%${q}%`)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Error al listar libros: ${error.message}`)
    }

    return (data || []).map(normalizarLibro)
  },

  /**
   * Obtiene un libro por ID
   */
  async obtenerPorId(id) {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('libro')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      throw new Error('Libro no encontrado.')
    }

    return normalizarLibro(data)
  },

  /**
   * Crea un nuevo libro validando unicidad de código
   */
  async crear(datos) {
    await authService.validarSesion()
    const supabase = getSupabase()

    if (!datos.titulo?.trim()) throw new Error('El título del libro es obligatorio.')
    if (!datos.autor?.trim()) throw new Error('El autor del libro es obligatorio.')
    if (!datos.codigo?.trim()) throw new Error('El código único del libro es obligatorio.')

    const codigoNormalizado = datos.codigo.trim().toUpperCase()
    const estadoDb = datos.estado === 'En reparación' ? 'En reparacion' : 'Disponible'

    const { data, error } = await supabase
      .from('libro')
      .insert({
        codigo: codigoNormalizado,
        titulo: datos.titulo.trim(),
        autor: datos.autor.trim(),
        editorial: (datos.editorial || '').trim(),
        anio: datos.anio ? parseInt(datos.anio, 10) : new Date().getFullYear(),
        estado: estadoDb
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505' || error.message?.includes('unique') || error.message?.includes('duplicate')) {
        throw new Error(`El código "${codigoNormalizado}" ya está registrado en otro libro. Debe ser único.`)
      }
      throw new Error(`Error al crear libro: ${error.message}`)
    }

    return normalizarLibro(data)
  },

  /**
   * Actualiza los datos de un libro
   */
  async actualizar(id, datos) {
    await authService.validarSesion()
    const supabase = getSupabase()

    const actual = await this.obtenerPorId(id)

    // Validaciones de negocio del estado
    if (datos.estado) {
      if (actual.estado === 'Prestado' && datos.estado !== 'Prestado') {
        throw new Error('No se puede cambiar manualmente el estado de un libro prestado. Debe registrarse su devolución.')
      }
      if (datos.estado === 'Prestado' && actual.estado !== 'Prestado') {
        throw new Error('El estado "Prestado" solo puede ser asignado mediante el registro de un préstamo.')
      }
    }

    const payload = {}
    if (datos.titulo !== undefined) payload.titulo = datos.titulo.trim()
    if (datos.autor !== undefined) payload.autor = datos.autor.trim()
    if (datos.editorial !== undefined) payload.editorial = datos.editorial.trim()
    if (datos.anio !== undefined) payload.anio = parseInt(datos.anio, 10)
    if (datos.codigo !== undefined) payload.codigo = datos.codigo.trim().toUpperCase()
    if (datos.estado !== undefined && ['Disponible', 'En reparación'].includes(datos.estado)) {
      payload.estado = datos.estado === 'En reparación' ? 'En reparacion' : datos.estado
    }

    const { data, error } = await supabase
      .from('libro')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === '23505' || error.message?.includes('unique') || error.message?.includes('duplicate')) {
        throw new Error(`El código "${payload.codigo || datos.codigo}" ya está en uso por otro libro.`)
      }
      throw new Error(`Error al actualizar libro: ${error.message}`)
    }

    return normalizarLibro(data)
  },

  /**
   * Actualización interna del estado (en caso de operaciones fuera de RPC)
   */
  async _actualizarEstadoSistema(id, nuevoEstado) {
    const supabase = getSupabase()
    const estadoDb = nuevoEstado === 'En reparación' ? 'En reparacion' : nuevoEstado
    await supabase.from('libro').update({ estado: estadoDb }).eq('id', id)
  }
}
