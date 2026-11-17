import { obtenerInstancia as getSupabase } from '../../patterns/singleton/supabaseClient.js'
import { authService } from './authService.js'
import { estaVencido } from '../../domain/prestamos.js'
import { sujetoPrestamoGlobal } from '../../patterns/observer/EstadoUsuarioService.js'
import { formatoCLP } from '../../utils/formatters.js'

function aplanarPrestamo(p) {
  if (!p) return null
  const libro = p.libro || {}
  const usuario = p.usuario || {}
  const esDevuelto = Boolean(p.fecha_devolucion)

  return {
    id: String(p.id),
    codigo: `PR-${p.fecha_prestamo ? p.fecha_prestamo.substring(0, 4) : '2026'}-${String(p.id).padStart(3, '0')}`,
    libro_id: String(p.libro_id),
    libro_codigo: libro.codigo || p.libro_codigo || '',
    libro_titulo: libro.titulo || p.libro_titulo || '',
    libro_autor: libro.autor || p.libro_autor || '',
    usuario_id: String(p.usuario_id),
    usuario_nombre: usuario.nombre || p.usuario_nombre || '',
    usuario_rut: usuario.rut || p.usuario_rut || '',
    usuario_tipo: usuario.tipo || p.usuario_tipo || 'Estudiante',
    fecha_prestamo: p.fecha_prestamo,
    fecha_vencimiento: p.fecha_vencimiento,
    fecha_devolucion: p.fecha_devolucion || null,
    renovado: Boolean(p.renovado),
    estado: esDevuelto ? 'Devuelto' : 'Activo',
    created_at: p.created_at
  }
}

const SELECT_PRESTAMO_EXPANDIDO = `
  id,
  libro_id,
  usuario_id,
  encargado_id,
  fecha_prestamo,
  fecha_vencimiento,
  fecha_devolucion,
  renovado,
  created_at,
  libro:libro_id (id, codigo, titulo, autor, editorial),
  usuario:usuario_id (id, rut, nombre, tipo, correo)
`

export const prestamoService = {
  /**
   * Lista todos los préstamos con filtros
   */
  async listar(filtros = {}) {
    await authService.validarSesion()
    const supabase = getSupabase()

    let query = supabase
      .from('prestamo')
      .select(SELECT_PRESTAMO_EXPANDIDO)
      .order('id', { ascending: false })

    if (filtros.usuarioId) {
      query = query.eq('usuario_id', filtros.usuarioId)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Error al listar préstamos: ${error.message}`)
    }

    let prestamos = (data || []).map(aplanarPrestamo)
    const hoy = new Date()

    if (filtros.estado && filtros.estado !== 'todos') {
      if (filtros.estado === 'Vencidos') {
        prestamos = prestamos.filter(p => p.estado === 'Activo' && estaVencido(p, hoy))
      } else {
        prestamos = prestamos.filter(p => p.estado === filtros.estado)
      }
    }

    if (filtros.busqueda?.trim()) {
      const q = filtros.busqueda.trim().toLowerCase()
      prestamos = prestamos.filter(p =>
        p.codigo.toLowerCase().includes(q) ||
        p.libro_titulo.toLowerCase().includes(q) ||
        p.libro_codigo.toLowerCase().includes(q) ||
        p.usuario_nombre.toLowerCase().includes(q) ||
        p.usuario_rut.toLowerCase().includes(q)
      )
    }

    return prestamos
  },

  async obtenerActivos() {
    return this.listar({ estado: 'Activo' })
  },

  async obtenerPorUsuario(usuarioId) {
    return this.listar({ usuarioId })
  },

  async obtenerPorId(id) {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('prestamo')
      .select(SELECT_PRESTAMO_EXPANDIDO)
      .eq('id', id)
      .single()

    if (error || !data) {
      throw new Error('Préstamo no encontrado.')
    }

    return aplanarPrestamo(data)
  },

  /**
   * Crea un nuevo préstamo delegando estrictamente a la función RPC de la base de datos
   * (rpc_registrar_prestamo) para garantizar atomicidad y reglas de negocio.
   */
  async crear(datos) {
    await authService.validarSesion()
    const supabase = getSupabase()

    const { usuarioId, libroId } = datos

    if (!usuarioId) throw new Error('Debes seleccionar un usuario.')
    if (!libroId) throw new Error('Debes seleccionar un libro.')

    // Ejecutar RPC en base de datos
    const { data, error } = await supabase.rpc('rpc_registrar_prestamo', {
      p_usuario_id: parseInt(usuarioId, 10),
      p_libro_id: parseInt(libroId, 10)
    })

    if (error) {
      const msg = error.message || ''
      if (msg.includes('bloqueado') || error.code === '28000') {
        const err = new Error(`Acceso denegado (403): ${msg}`)
        err.status = 403
        err.motivo = msg
        throw err
      }
      if (msg.includes('no está disponible')) {
        throw new Error(msg)
      }
      throw new Error(`Error al registrar préstamo: ${msg}`)
    }

    // Obtener entidad completa con relaciones para la UI
    const nuevoPrestamo = await this.obtenerPorId(data.id || data)

    // Notificar al Sujeto (Patrón Observer)
    sujetoPrestamoGlobal.notificar('PRESTAMO_CREADO', { prestamo: nuevoPrestamo })

    const comprobante = {
      codigoPrestamo: nuevoPrestamo.codigo,
      fechaEmision: new Date().toISOString(),
      fechaPrestamo: nuevoPrestamo.fecha_prestamo,
      fechaVencimiento: nuevoPrestamo.fecha_vencimiento,
      libroTitulo: nuevoPrestamo.libro_titulo,
      libroCodigo: nuevoPrestamo.libro_codigo,
      libroAutor: nuevoPrestamo.libro_autor,
      usuarioNombre: nuevoPrestamo.usuario_nombre,
      usuarioRut: nuevoPrestamo.usuario_rut,
      usuarioTipo: nuevoPrestamo.usuario_tipo,
      plazoDiasHabiles: nuevoPrestamo.usuario_tipo === 'Docente' ? 10 : 5
    }

    return {
      prestamo: nuevoPrestamo,
      comprobante
    }
  },

  /**
   * Renovar préstamo delegando a la función RPC (rpc_renovar_prestamo)
   */
  async renovar(prestamoId) {
    await authService.validarSesion()
    const supabase = getSupabase()

    const { data, error } = await supabase.rpc('rpc_renovar_prestamo', {
      p_prestamo_id: parseInt(prestamoId, 10)
    })

    if (error) {
      throw new Error(`Rechazar renovación: ${error.message}`)
    }

    const prestamoActualizado = await this.obtenerPorId(prestamoId)

    sujetoPrestamoGlobal.notificar('PRESTAMO_ACTUALIZADO', {
      prestamo: prestamoActualizado,
      usuarioId: prestamoActualizado.usuario_id
    })

    return prestamoActualizado
  },

  /**
   * Registrar devolución delegando a la función RPC (rpc_registrar_devolucion)
   */
  async registrarDevolucion(prestamoId) {
    await authService.validarSesion()
    const supabase = getSupabase()

    const { data, error } = await supabase.rpc('rpc_registrar_devolucion', {
      p_prestamo_id: parseInt(prestamoId, 10)
    })

    if (error) {
      throw new Error(`Error al registrar devolución: ${error.message}`)
    }

    const resultado = data || {}
    const prestamoDevuelto = await this.obtenerPorId(prestamoId)

    const liquidacion = {
      tieneAtraso: Boolean(resultado.tiene_multa),
      diasAtraso: resultado.dias_atraso || 0,
      monto: resultado.monto_multa || 0,
      montoFormateado: formatoCLP(resultado.monto_multa || 0),
      multaId: resultado.multa_id ? String(resultado.multa_id) : null
    }

    if (liquidacion.tieneAtraso && liquidacion.monto > 0) {
      sujetoPrestamoGlobal.notificar('DEVOLUCION_CON_ATRASO', {
        prestamo: prestamoDevuelto,
        liquidacion
      })
    } else {
      sujetoPrestamoGlobal.notificar('PRESTAMO_ACTUALIZADO', {
        prestamo: prestamoDevuelto,
        usuarioId: prestamoDevuelto.usuario_id
      })
    }

    return {
      prestamo: prestamoDevuelto,
      liquidacion
    }
  }
}
