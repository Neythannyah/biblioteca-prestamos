import { estaVencido } from '../../domain/prestamos.js'
import { calcularLiquidacionPrestamo } from '../../domain/multas.js'
import { evaluarEstadoUsuario } from '../../domain/usuarios.js'
import { obtenerInstancia as getSupabase } from '../singleton/supabaseClient.js'

/**
 * Patrón Observer:
 * Sujeto: SujetoPrestamo (gestiona suscriptores y emite eventos: VENCIMIENTO_DETECTADO, DEVOLUCION_CON_ATRASO, MULTA_PAGADA, PRESTAMO_ACTUALIZADO)
 * Observador: EstadoUsuarioService (reacciona actualizando el estado del usuario y registrando multas correspondientes)
 */

export class SujetoPrestamo {
  constructor() {
    this.observadores = []
  }

  suscribir(observador) {
    if (!this.observadores.includes(observador)) {
      this.observadores.push(observador)
    }
    return () => this.desuscribir(observador)
  }

  desuscribir(observador) {
    this.observadores = this.observadores.filter(obs => obs !== observador)
  }

  notificar(evento, datos) {
    this.observadores.forEach(observador => {
      try {
        observador.actualizar(evento, datos)
      } catch (error) {
        console.error(`Error en observador al procesar evento "${evento}":`, error)
      }
    })
  }
}

// Instancia global del sujeto de eventos de préstamos
export const sujetoPrestamoGlobal = new SujetoPrestamo()

/**
 * Observador concreto que monitoriza el estado de los préstamos
 * y sincroniza el bloqueo/habilitación de usuarios y la generación de multas.
 */
export class EstadoUsuarioService {
  /**
   * @param {object} storageServices - referencias a usuarioService, prestamoService, multaService, configService, feriadoService
   */
  constructor(storageServices = {}) {
    this.services = storageServices
  }

  setServices(storageServices) {
    this.services = storageServices
  }

  /**
   * Método de notificación del patrón Observer
   * @param {'VENCIMIENTO_DETECTADO'|'DEVOLUCION_CON_ATRASO'|'MULTA_PAGADA'|'PRESTAMO_ACTUALIZADO'} evento
   * @param {object} datos
   */
  actualizar(evento, datos) {
    switch (evento) {
      case 'DEVOLUCION_CON_ATRASO':
        this.procesarDevolucionConAtraso(datos.prestamo, datos.liquidacion)
        break

      case 'VENCIMIENTO_DETECTADO':
        this.bloquearUsuarioPorVencimiento(datos.prestamo)
        break

      case 'MULTA_PAGADA':
      case 'PRESTAMO_ACTUALIZADO':
        this.sincronizarUsuario(datos.usuarioId)
        break

      default:
        break
    }
  }

  /**
   * Procesa una devolución con atraso generando la multa y bloqueando al usuario
   */
  procesarDevolucionConAtraso(prestamo, liquidacion) {
    if (!this.services.multaService || !this.services.usuarioService) return

    const { monto, diasAtraso } = liquidacion
    if (monto > 0) {
      // Registrar multa
      this.services.multaService.crearMulta({
        prestamo_id: prestamo.id,
        usuario_id: prestamo.usuario_id,
        usuario_nombre: prestamo.usuario_nombre,
        usuario_rut: prestamo.usuario_rut,
        libro_id: prestamo.libro_id,
        libro_titulo: prestamo.libro_titulo,
        dias_atraso: diasAtraso,
        monto: monto,
        estado: 'Pendiente',
        fecha_generacion: prestamo.fecha_devolucion || new Date().toISOString().split('T')[0]
      })

      // Bloquear usuario
      this.bloquearUsuario(
        prestamo.usuario_id,
        `Multa pendiente de $${monto.toLocaleString('es-CL')} por devolución tardía del libro "${prestamo.libro_titulo}" (${diasAtraso} días hábiles de atraso).`
      )
    }
  }

  /**
   * Bloquea a un usuario si un préstamo activo superó la fecha límite
   */
  bloquearUsuarioPorVencimiento(prestamo) {
    if (!this.services.usuarioService) return
    this.bloquearUsuario(
      prestamo.usuario_id,
      `Tiene préstamos activos con fecha de entrega vencida ("${prestamo.libro_titulo}").`
    )
  }

  bloquearUsuario(usuarioId, motivo) {
    if (!this.services.usuarioService) return
    this.services.usuarioService.actualizarEstado(usuarioId, 'Bloqueado', motivo)
  }

  habilitarUsuario(usuarioId) {
    if (!this.services.usuarioService) return
    this.services.usuarioService.actualizarEstado(usuarioId, 'Habilitado', null)
  }

  /**
   * Reevalúa completamente el estado de un usuario revisando todos sus préstamos y multas
   */
  async sincronizarUsuario(usuarioId) {
    if (!this.services.usuarioService || !this.services.prestamoService || !this.services.multaService) return

    if (import.meta.env.VITE_DATA_SOURCE === 'supabase') {
      try {
        getSupabase().rpc('recalcular_estado_usuario', { p_usuario_id: parseInt(usuarioId, 10) }).catch(() => {})
      } catch (e) {}
    }

    try {
      const usuario = await this.services.usuarioService.obtenerPorId(usuarioId)
      if (!usuario) return

      const prestamosUsuario = await this.services.prestamoService.obtenerPorUsuario(usuarioId)
      const multasUsuario = await this.services.multaService.obtenerPorUsuario(usuarioId)

      const evaluacion = evaluarEstadoUsuario(usuario, prestamosUsuario || [], multasUsuario || [], new Date())

      await this.services.usuarioService.actualizarEstado(
        usuarioId,
        evaluacion.estado,
        evaluacion.motivo_bloqueo
      )
    } catch (e) {}
  }

  /**
   * Verificación masiva de préstamos vencidos (se ejecuta al inicio de la app o cambio de ruta)
   */
  verificarVencimientosGenerales() {
    if (import.meta.env.VITE_DATA_SOURCE === 'supabase') {
      try {
        getSupabase().rpc('actualizar_estados_por_vencimiento').catch(() => {})
      } catch (e) {}
      return 0
    }

    if (!this.services.prestamoService || !this.services.feriadoService || !this.services.configService) return 0

    const prestamosActivos = this.services.prestamoService.obtenerActivos()
    if (!Array.isArray(prestamosActivos)) return 0

    const feriados = this.services.feriadoService.obtenerFeriados()
    const config = this.services.configService.obtenerConfig()
    const hoy = new Date()

    let vencidosEncontrados = 0

    prestamosActivos.forEach(p => {
      if (estaVencido(p, hoy)) {
        vencidosEncontrados++
        sujetoPrestamoGlobal.notificar('VENCIMIENTO_DETECTADO', {
          prestamo: p,
          fechaReferencia: hoy
        })
      }
    })

    return vencidosEncontrados
  }
}

export const estadoUsuarioServiceGlobal = new EstadoUsuarioService()
sujetoPrestamoGlobal.suscribir(estadoUsuarioServiceGlobal)
