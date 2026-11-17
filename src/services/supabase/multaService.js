import { obtenerInstancia as getSupabase } from '../../patterns/singleton/supabaseClient.js'
import { authService } from './authService.js'
import { sujetoPrestamoGlobal } from '../../patterns/observer/EstadoUsuarioService.js'
import { formatoCLP } from '../../utils/formatters.js'

function aplanarMulta(m) {
  if (!m) return null
  const prestamo = m.prestamo || {}
  const libro = prestamo.libro || {}
  const usuario = prestamo.usuario || {}

  const anio = m.created_at ? m.created_at.substring(0, 4) : '2026'
  const codigo = `MLT-${anio}-${String(m.id).padStart(3, '0')}`

  return {
    id: String(m.id),
    codigo,
    prestamo_id: String(m.prestamo_id),
    usuario_id: prestamo.usuario_id ? String(prestamo.usuario_id) : '',
    usuario_nombre: usuario.nombre || '',
    usuario_rut: usuario.rut || '',
    libro_id: prestamo.libro_id ? String(prestamo.libro_id) : '',
    libro_titulo: libro.titulo || '',
    dias_atraso: m.dias_atraso || 0,
    monto: m.monto || 0,
    estado: m.pagada ? 'Pagada' : 'Pendiente',
    pagada: Boolean(m.pagada),
    fecha_generacion: m.created_at ? m.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
    fecha_pago: m.fecha_pago || null,
    comprobante_pago: m.pagada ? `REC-${anio}-${String(m.id).padStart(4, '0')}` : null
  }
}

const SELECT_MULTA_EXPANDIDA = `
  id,
  prestamo_id,
  dias_atraso,
  monto,
  pagada,
  fecha_pago,
  created_at,
  prestamo:prestamo_id (
    id,
    usuario_id,
    libro_id,
    usuario:usuario_id (id, rut, nombre, correo),
    libro:libro_id (id, codigo, titulo)
  )
`

export const multaService = {
  /**
   * Lista multas registradas con filtros
   */
  async listar(filtros = {}) {
    await authService.validarSesion()
    const supabase = getSupabase()

    let query = supabase
      .from('multa')
      .select(SELECT_MULTA_EXPANDIDA)
      .order('id', { ascending: false })

    if (filtros.estado && filtros.estado !== 'todos') {
      const esPagada = filtros.estado === 'Pagada'
      query = query.eq('pagada', esPagada)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Error al listar multas: ${error.message}`)
    }

    let multas = (data || []).map(aplanarMulta)

    if (filtros.busqueda?.trim()) {
      const q = filtros.busqueda.trim().toLowerCase()
      multas = multas.filter(m =>
        m.codigo.toLowerCase().includes(q) ||
        m.usuario_nombre.toLowerCase().includes(q) ||
        m.usuario_rut.toLowerCase().includes(q) ||
        m.libro_titulo.toLowerCase().includes(q)
      )
    }

    return multas
  },

  async obtenerPorUsuario(usuarioId) {
    const todas = await this.listar()
    return todas.filter(m => m.usuario_id === String(usuarioId))
  },

  async obtenerPorId(id) {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('multa')
      .select(SELECT_MULTA_EXPANDIDA)
      .eq('id', id)
      .single()

    if (error || !data) {
      throw new Error('Multa no encontrada.')
    }

    return aplanarMulta(data)
  },

  /**
   * Creación manual de multa (usado por tests o fallbacks)
   */
  async crearMulta(datos) {
    await authService.validarSesion()
    const supabase = getSupabase()

    const { data, error } = await supabase
      .from('multa')
      .insert({
        prestamo_id: parseInt(datos.prestamo_id, 10),
        dias_atraso: datos.dias_atraso || 0,
        monto: datos.monto || 0,
        pagada: false
      })
      .select(SELECT_MULTA_EXPANDIDA)
      .single()

    if (error) {
      throw new Error(`Error al crear multa: ${error.message}`)
    }

    return aplanarMulta(data)
  },

  /**
   * Acción "Registrar pago total" delegando a la función RPC (rpc_pagar_multa)
   */
  async registrarPagoTotal(multaId) {
    await authService.validarSesion()
    const supabase = getSupabase()

    const { data, error } = await supabase.rpc('rpc_pagar_multa', {
      p_multa_id: parseInt(multaId, 10)
    })

    if (error) {
      throw new Error(`Error al registrar pago de multa: ${error.message}`)
    }

    const multaActualizada = await this.obtenerPorId(multaId)

    sujetoPrestamoGlobal.notificar('MULTA_PAGADA', {
      multa: multaActualizada,
      usuarioId: multaActualizada.usuario_id
    })

    const nroRecibo = multaActualizada.comprobante_pago || `REC-2026-${String(multaId).padStart(4, '0')}`

    const comprobante = {
      numeroComprobante: nroRecibo,
      fechaEmision: new Date().toISOString(),
      multaCodigo: multaActualizada.codigo,
      usuarioNombre: multaActualizada.usuario_nombre,
      usuarioRut: multaActualizada.usuario_rut,
      libroTitulo: multaActualizada.libro_titulo,
      diasAtraso: multaActualizada.dias_atraso,
      montoPagado: multaActualizada.monto,
      montoPagadoFormato: formatoCLP(multaActualizada.monto),
      cajero: 'Encargado de Biblioteca'
    }

    return {
      multa: multaActualizada,
      comprobante
    }
  }
}
