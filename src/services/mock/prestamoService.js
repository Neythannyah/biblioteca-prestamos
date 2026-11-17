import { dbStorage } from './storage.js'
import { authService } from './authService.js'
import { libroService } from './libroService.js'
import { usuarioService } from './usuarioService.js'
import { configService } from './configService.js'
import { feriadoService } from './feriadoService.js'
import {
  calcularFechaVencimiento,
  validarAptitudPrestamo,
  validarRenovacion,
  calcularNuevaFechaRenovacion,
  estaVencido
} from '../../domain/prestamos.js'
import { calcularLiquidacionPrestamo } from '../../domain/multas.js'
import { sujetoPrestamoGlobal } from '../../patterns/observer/EstadoUsuarioService.js'
import { normalizarFechaStr } from '../../domain/calendario.js'

export const prestamoService = {
  /**
   * Lista todos los préstamos con filtros
   */
  async listar(filtros = {}) {
    await authService.validarSesion()
    await new Promise(r => setTimeout(r, 100))

    let prestamos = dbStorage.getPrestamos()
    const hoy = new Date()

    if (filtros.estado && filtros.estado !== 'todos') {
      if (filtros.estado === 'Vencidos') {
        prestamos = prestamos.filter(p => p.estado === 'Activo' && estaVencido(p, hoy))
      } else {
        prestamos = prestamos.filter(p => p.estado === filtros.estado)
      }
    }

    if (filtros.usuarioId) {
      prestamos = prestamos.filter(p => p.usuario_id === filtros.usuarioId)
    }

    if (filtros.busqueda) {
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

  obtenerActivos() {
    const prestamos = dbStorage.getPrestamos()
    return prestamos.filter(p => p.estado === 'Activo')
  },

  obtenerPorUsuario(usuarioId) {
    const prestamos = dbStorage.getPrestamos()
    return prestamos.filter(p => p.usuario_id === usuarioId)
  },

  async obtenerPorId(id) {
    const prestamos = dbStorage.getPrestamos()
    const p = prestamos.find(item => item.id === id)
    if (!p) throw new Error('Préstamo no encontrado.')
    return p
  },

  /**
   * Crea un nuevo préstamo validando todas las reglas de negocio (RF4, RNF4)
   */
  async crear(datos) {
    await authService.validarSesion()
    await new Promise(r => setTimeout(r, 200))

    const { usuarioId, libroId, fechaPrestamo = normalizarFechaStr(new Date()) } = datos

    if (!usuarioId) throw new Error('Debes seleccionar un usuario.')
    if (!libroId) throw new Error('Debes seleccionar un libro.')

    // 1. Obtener datos de usuario y libro
    const usuario = await usuarioService.obtenerPorId(usuarioId)
    const libro = await libroService.obtenerPorId(libroId)

    // 2. Validar que el libro esté disponible
    if (libro.estado !== 'Disponible') {
      throw new Error(`El libro "${libro.titulo}" no está disponible para préstamo (Estado actual: ${libro.estado}).`)
    }

    // 3. Validar aptitud del usuario (reglas de bloqueo, multas y vencimientos)
    const prestamosUsuario = this.obtenerPorUsuario(usuarioId)
    const multas = dbStorage.getMultas().filter(m => m.usuario_id === usuarioId)
    const validacion = validarAptitudPrestamo(usuario, prestamosUsuario, multas, new Date())

    if (!validacion.apto) {
      // Error equivalente a 403 Usuario Bloqueado
      const err = new Error(`Acceso denegado (403): ${validacion.motivo}`)
      err.status = 403
      err.motivo = validacion.motivo
      throw err
    }

    // 4. Calcular fecha de vencimiento según tipo de usuario y días hábiles
    const feriados = feriadoService.obtenerFeriados()
    const config = configService.obtenerConfig()
    const plazos = {
      Estudiante: config.plazoEstudiante || 5,
      Docente: config.plazoDocente || 10
    }

    const fechaVencimiento = calcularFechaVencimiento(fechaPrestamo, usuario.tipo, feriados, plazos)

    // 5. Generar código y registro del préstamo
    const prestamos = dbStorage.getPrestamos()
    const anio = new Date().getFullYear()
    const correlativo = prestamos.length + 1
    const codigoPrestamo = `PR-${anio}-${String(correlativo).padStart(3, '0')}`

    const nuevoPrestamo = {
      id: `prest_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      codigo: codigoPrestamo,
      libro_id: libro.id,
      libro_codigo: libro.codigo,
      libro_titulo: libro.titulo,
      usuario_id: usuario.id,
      usuario_nombre: usuario.nombre,
      usuario_rut: usuario.rut,
      usuario_tipo: usuario.tipo,
      fecha_prestamo: normalizarFechaStr(fechaPrestamo),
      fecha_vencimiento: fechaVencimiento,
      fecha_devolucion: null,
      renovado: false,
      estado: 'Activo'
    }

    // 6. Marcar el libro como 'Prestado'
    libroService._actualizarEstadoSistema(libro.id, 'Prestado')

    prestamos.unshift(nuevoPrestamo)
    dbStorage.setPrestamos(prestamos)

    // Notificar al Sujeto (Patrón Observer)
    sujetoPrestamoGlobal.notificar('PRESTAMO_CREADO', { prestamo: nuevoPrestamo })

    const comprobante = {
      codigoPrestamo,
      fechaEmision: new Date().toISOString(),
      fechaPrestamo: nuevoPrestamo.fecha_prestamo,
      fechaVencimiento: nuevoPrestamo.fecha_vencimiento,
      libroTitulo: libro.titulo,
      libroCodigo: libro.codigo,
      libroAutor: libro.autor,
      usuarioNombre: usuario.nombre,
      usuarioRut: usuario.rut,
      usuarioTipo: usuario.tipo,
      plazoDiasHabiles: plazos[usuario.tipo]
    }

    return {
      prestamo: nuevoPrestamo,
      comprobante
    }
  },

  /**
   * Renovar préstamo (RF5)
   * - Solo una renovación por préstamo
   * - Extiende fecha de vencimiento original por el mismo plazo inicial
   * - Rechaza si ya fue renovado, si está vencido o si el usuario está bloqueado
   */
  async renovar(prestamoId) {
    await authService.validarSesion()
    await new Promise(r => setTimeout(r, 150))

    const prestamos = dbStorage.getPrestamos()
    const idx = prestamos.findIndex(p => p.id === prestamoId)
    if (idx === -1) throw new Error('Préstamo no encontrado.')

    const prestamo = prestamos[idx]
    const usuario = dbStorage.getUsuarios().find(u => u.id === prestamo.usuario_id)

    // Validar con la regla de dominio pura
    const validacion = validarRenovacion(prestamo, usuario, new Date())
    if (!validacion.puede) {
      throw new Error(`Rechazar renovación: ${validacion.motivo}`)
    }

    const feriados = feriadoService.obtenerFeriados()
    const config = configService.obtenerConfig()
    const plazos = {
      Estudiante: config.plazoEstudiante || 5,
      Docente: config.plazoDocente || 10
    }

    const nuevaFechaVencimiento = calcularNuevaFechaRenovacion(prestamo, feriados, plazos)

    prestamo.renovado = true
    prestamo.fecha_vencimiento_original = prestamo.fecha_vencimiento
    prestamo.fecha_vencimiento = nuevaFechaVencimiento
    prestamo.fecha_renovacion = normalizarFechaStr(new Date())

    prestamos[idx] = prestamo
    dbStorage.setPrestamos(prestamos)

    sujetoPrestamoGlobal.notificar('PRESTAMO_ACTUALIZADO', {
      prestamo,
      usuarioId: prestamo.usuario_id
    })

    return prestamo
  },

  /**
   * Registrar devolución (RF9)
   * - Si hay atraso, calcula multa ($1.000 x día), crea la multa, bloquea al usuario
   * - Si es a tiempo, marca el libro como Disponible
   */
  async registrarDevolucion(prestamoId, fechaDevolucion = normalizarFechaStr(new Date())) {
    await authService.validarSesion()
    await new Promise(r => setTimeout(r, 180))

    const prestamos = dbStorage.getPrestamos()
    const idx = prestamos.findIndex(p => p.id === prestamoId)
    if (idx === -1) throw new Error('Préstamo no encontrado.')

    const prestamo = prestamos[idx]
    if (prestamo.estado === 'Devuelto') {
      throw new Error('Este préstamo ya fue devuelto con anterioridad.')
    }

    const feriados = feriadoService.obtenerFeriados()
    const config = configService.obtenerConfig()

    // Calcular liquidación según fecha indicada de devolución (permite forzar fecha para pruebas)
    const fechaDevNorm = normalizarFechaStr(fechaDevolucion)
    prestamo.fecha_devolucion = fechaDevNorm

    const liquidacion = calcularLiquidacionPrestamo(
      prestamo,
      fechaDevNorm,
      feriados,
      config
    )

    prestamo.estado = 'Devuelto'
    prestamo.dias_atraso = liquidacion.diasAtraso
    prestamos[idx] = prestamo
    dbStorage.setPrestamos(prestamos)

    // 1. Marcar libro como 'Disponible'
    libroService._actualizarEstadoSistema(prestamo.libro_id, 'Disponible')

    // 2. Si hubo atraso, notificar al Sujeto (Patrón Observer) para generar multa y bloquear usuario
    if (liquidacion.tieneAtraso && liquidacion.monto > 0) {
      sujetoPrestamoGlobal.notificar('DEVOLUCION_CON_ATRASO', {
        prestamo,
        liquidacion
      })
    } else {
      sujetoPrestamoGlobal.notificar('PRESTAMO_ACTUALIZADO', {
        prestamo,
        usuarioId: prestamo.usuario_id
      })
    }

    return {
      prestamo,
      liquidacion
    }
  }
}

