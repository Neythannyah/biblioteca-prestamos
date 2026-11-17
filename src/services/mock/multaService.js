import { dbStorage } from './storage.js'
import { authService } from './authService.js'
import { sujetoPrestamoGlobal } from '../../patterns/observer/EstadoUsuarioService.js'
import { formatoCLP, formatoFecha } from '../../utils/formatters.js'

export const multaService = {
  /**
   * Lista multas registradas con filtros
   */
  async listar(filtros = {}) {
    await authService.validarSesion()
    await new Promise(r => setTimeout(r, 100))

    let multas = dbStorage.getMultas()

    if (filtros.estado && filtros.estado !== 'todos') {
      multas = multas.filter(m => m.estado === filtros.estado)
    }

    if (filtros.busqueda) {
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

  /**
   * Obtiene multas de un usuario en particular
   */
  obtenerPorUsuario(usuarioId) {
    const multas = dbStorage.getMultas()
    return multas.filter(m => m.usuario_id === usuarioId)
  },

  /**
   * Registra una nueva multa en el sistema
   */
  crearMulta(datos) {
    const multas = dbStorage.getMultas()
    const correlativo = multas.length + 1
    const anio = new Date().getFullYear()

    const nuevaMulta = {
      id: `multa_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      codigo: `MLT-${anio}-${String(correlativo).padStart(3, '0')}`,
      prestamo_id: datos.prestamo_id,
      usuario_id: datos.usuario_id,
      usuario_nombre: datos.usuario_nombre,
      usuario_rut: datos.usuario_rut,
      libro_id: datos.libro_id,
      libro_titulo: datos.libro_titulo,
      dias_atraso: datos.dias_atraso,
      monto: datos.monto,
      estado: 'Pendiente',
      fecha_generacion: datos.fecha_generacion || new Date().toISOString().split('T')[0],
      fecha_pago: null,
      comprobante_pago: null
    }

    multas.unshift(nuevaMulta)
    dbStorage.setMultas(multas)
    return nuevaMulta
  },

  /**
   * Acción "Registrar pago total" (solo pago total) (RF7)
   * Marca la multa pagada, registra fecha de pago, notifica al Observer para habilitar al usuario
   * si no tiene otras deudas ni atrasos, y emite comprobante de pago.
   */
  async registrarPagoTotal(multaId) {
    await authService.validarSesion()
    await new Promise(r => setTimeout(r, 150))

    const multas = dbStorage.getMultas()
    const idx = multas.findIndex(m => m.id === multaId)
    if (idx === -1) throw new Error('Multa no encontrada.')

    const multa = multas[idx]
    if (multa.estado === 'Pagada') {
      throw new Error('Esta multa ya se encuentra pagada.')
    }

    const anio = new Date().getFullYear()
    const nroRecibo = `REC-${anio}-${Math.floor(1000 + Math.random() * 9000)}`
    const ahoraStr = new Date().toISOString()

    multa.estado = 'Pagada'
    multa.fecha_pago = ahoraStr.split('T')[0]
    multa.comprobante_pago = nroRecibo
    multa.fecha_pago_completa = ahoraStr

    multas[idx] = multa
    dbStorage.setMultas(multas)

    // Notificar al Sujeto (Patrón Observer) para que sincronice el estado del usuario
    sujetoPrestamoGlobal.notificar('MULTA_PAGADA', {
      multa,
      usuarioId: multa.usuario_id
    })

    const comprobante = {
      numeroComprobante: nroRecibo,
      fechaEmision: ahoraStr,
      multaCodigo: multa.codigo,
      usuarioNombre: multa.usuario_nombre,
      usuarioRut: multa.usuario_rut,
      libroTitulo: multa.libro_titulo,
      diasAtraso: multa.dias_atraso,
      montoPagado: multa.monto,
      montoPagadoFormato: formatoCLP(multa.monto),
      cajero: 'Encargado de Biblioteca'
    }

    return {
      multa,
      comprobante
    }
  }
}

