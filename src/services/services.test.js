import { describe, it, expect, beforeEach } from 'vitest'
import { authService } from './mock/authService.js'
import { libroService } from './mock/libroService.js'
import { usuarioService } from './mock/usuarioService.js'
import { prestamoService } from './mock/prestamoService.js'
import { multaService } from './mock/multaService.js'
import { reporteService } from './mock/reporteService.js'
import { ReporteExportAdapter } from '../patterns/adapter/ReporteExportAdapter.js'
import { inicializarStorage, dbStorage } from './mock/storage.js'
import { estadoUsuarioServiceGlobal } from '../patterns/observer/EstadoUsuarioService.js'

describe('Recorrido End-to-End: Ciclo de vida completo del Sistema de Biblioteca', () => {
  beforeEach(() => {
    // Reiniciar almacenamiento mock a estado limpio
    dbStorage.resetTodo()
    estadoUsuarioServiceGlobal.setServices({
      usuarioService,
      prestamoService,
      multaService
    })
  })

  it('1. LOGIN: Permite acceso a Encargado válido y rechaza credenciales erróneas (RF1)', async () => {
    // Intento con credenciales incorrectas
    await expect(authService.login('encargado', 'ClaveErronea123!')).rejects.toThrow('Mostrar error de acceso')

    // Intento exitoso
    const sesion = await authService.login('encargado', 'Biblioteca2026!')
    expect(sesion).toBeDefined()
    expect(sesion.token).toBeTruthy()
    expect(sesion.usuario.rol).toBe('Encargado')
  })

  it('2. CREAR LIBRO Y USUARIO: valida código único y algoritmo de RUT (RF2, RF3, Factory Method)', async () => {
    await authService.login('encargado', 'Biblioteca2026!')

    // Crear libro nuevo
    const libro = await libroService.crear({
      codigo: 'LIB-E2E-001',
      titulo: 'Estructuras de Datos y Algoritmos',
      autor: 'Alfred Aho',
      editorial: 'Addison-Wesley',
      anio: 1983
    })
    expect(libro.codigo).toBe('LIB-E2E-001')
    expect(libro.estado).toBe('Disponible')

    // Rechazar libro con código duplicado
    await expect(libroService.crear({
      codigo: 'LIB-E2E-001',
      titulo: 'Duplicado',
      autor: 'Autor X'
    })).rejects.toThrow(/ya está registrado/)

    // Crear usuario mediante Factory Method con RUT válido (Módulo 11)
    const usuario = await usuarioService.crear({
      rut: '19.234.567-7',
      nombre: 'Constanza Morales Silva',
      correo: 'c.morales@universidad.cl',
      tipo: 'Estudiante'
    })
    expect(usuario.tipo).toBe('Estudiante')
    expect(usuario.plazo_dias).toBe(5)
    expect(usuario.estado).toBe('Habilitado')

    // Rechazar usuario con RUT inválido
    await expect(usuarioService.crear({
      rut: '19.234.567-0', // DV incorrecto
      nombre: 'Falso',
      correo: 'f@u.cl',
      tipo: 'Estudiante'
    })).rejects.toThrow(/El RUT ingresado no es válido/)
  })

  it('3. FLUJO COMPLETO: Prestar -> Renovar -> Rechazo 2da Renovación -> Devolver con atraso -> Multa y Bloqueo -> Rechazo 403 -> Pago total -> Habilitación', async () => {
    await authService.login('encargado', 'Biblioteca2026!')

    // A) Crear libro y usuario
    const libro = await libroService.crear({
      codigo: 'LIB-TEST-999',
      titulo: 'Clean Architecture',
      autor: 'Robert C. Martin',
      editorial: 'Prentice Hall',
      anio: 2017
    })

    const usuario = await usuarioService.crear({
      rut: '14.567.890-0',
      nombre: 'Profesor Marcelo Ríos',
      correo: 'm.rios@universidad.cl',
      tipo: 'Docente'
    })

    // B) REGISTRAR PRÉSTAMO (RF4)
    const hoyStr = new Date().toISOString().split('T')[0]
    const { prestamo, comprobante } = await prestamoService.crear({
      usuarioId: usuario.id,
      libroId: libro.id,
      fechaPrestamo: hoyStr
    })

    expect(prestamo.estado).toBe('Activo')
    expect(prestamo.renovado).toBe(false)
    expect(comprobante.codigoPrestamo).toBe(prestamo.codigo)

    // El libro ahora debe estar 'Prestado'
    const libroConsultado = await libroService.obtenerPorId(libro.id)
    expect(libroConsultado.estado).toBe('Prestado')

    // C) RENOVAR PRÉSTAMO (RF5 - 1ra renovación exitosa)
    const prestamoRenovado = await prestamoService.renovar(prestamo.id)
    expect(prestamoRenovado.renovado).toBe(true)

    // D) INTENTO DE 2DA RENOVACIÓN (Debe ser rechazada)
    await expect(prestamoService.renovar(prestamo.id)).rejects.toThrow(/Rechazar renovación/)

    // E) DEVOLUCIÓN CON ATRASO (RF9)
    // Fecha de devolución 30 días en el futuro para simular entrega tardía fuera de plazo
    const fechaFuturaAtrasada = new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const resDevolucion = await prestamoService.registrarDevolucion(prestamo.id, fechaFuturaAtrasada)
    expect(resDevolucion.prestamo.estado).toBe('Devuelto')
    expect(resDevolucion.liquidacion.tieneAtraso).toBe(true)
    expect(resDevolucion.liquidacion.monto).toBeGreaterThan(0)

    // El libro debe volver a quedar 'Disponible'
    const libroDevuelto = await libroService.obtenerPorId(libro.id)
    expect(libroDevuelto.estado).toBe('Disponible')

    // F) VERIFICAR MULTA GENERADA Y BLOQUEO DE USUARIO (Patrón Observer)
    const multasUsuario = await multaService.obtenerPorUsuario(usuario.id)
    expect(multasUsuario.length).toBeGreaterThan(0)
    const multaPendiente = multasUsuario.find(m => m.estado === 'Pendiente')
    expect(multaPendiente).toBeDefined()

    const usuarioSancionado = await usuarioService.obtenerPorId(usuario.id)
    expect(usuarioSancionado.estado).toBe('Bloqueado')
    expect(usuarioSancionado.motivo_bloqueo).toBeTruthy()

    // G) INTENTO DE NUEVO PRÉSTAMO A USUARIO BLOQUEADO (Debe fallar con Error 403)
    const otroLibro = await libroService.crear({
      codigo: 'LIB-TEST-888',
      titulo: 'Domain Driven Design',
      autor: 'Eric Evans',
      editorial: 'Addison-Wesley',
      anio: 2003
    })

    await expect(prestamoService.crear({
      usuarioId: usuario.id,
      libroId: otroLibro.id,
      fechaPrestamo: '2026-04-16'
    })).rejects.toThrow(/403/)

    // H) REGISTRAR PAGO TOTAL DE LA MULTA (RF7)
    const resPago = await multaService.registrarPagoTotal(multaPendiente.id)
    expect(resPago.multa.estado).toBe('Pagada')
    expect(resPago.comprobante.numeroComprobante).toBeTruthy()
    await new Promise(r => setTimeout(r, 100))

    // I) VERIFICAR HABILITACIÓN DEL USUARIO TRAS EL PAGO TOTAL
    const usuarioHabilitado = await usuarioService.obtenerPorId(usuario.id)
    expect(usuarioHabilitado.estado).toBe('Habilitado')
    expect(usuarioHabilitado.motivo_bloqueo).toBeNull()

    // J) AHORA SÍ PUEDE VOLVER A SOLICITAR UN PRÉSTAMO
    const nuevoPrestamoExitoso = await prestamoService.crear({
      usuarioId: usuario.id,
      libroId: otroLibro.id,
      fechaPrestamo: '2026-04-16'
    })
    expect(nuevoPrestamoExitoso.prestamo.estado).toBe('Activo')
  })

  it('4. REPORTES Y ADAPTER: Generación y adaptación de filas para exportación (RF8, Adapter)', async () => {
    await authService.login('encargado', 'Biblioteca2026!')

    const prestados = await reporteService.obtenerLibrosPrestados()
    expect(Array.isArray(prestados)).toBe(true)

    const columnas = [
      { key: 'codigo', label: 'Código' },
      { key: 'libro_titulo', label: 'Título' },
      { key: 'usuario_nombre', label: 'Lector' }
    ]

    const filasAdaptadas = ReporteExportAdapter.prepararFilas(prestados, columnas)
    expect(Array.isArray(filasAdaptadas)).toBe(true)
    if (filasAdaptadas.length > 0) {
      expect(filasAdaptadas[0]).toHaveProperty('Código')
      expect(filasAdaptadas[0]).toHaveProperty('Título')
      expect(filasAdaptadas[0]).toHaveProperty('Lector')
    }
  })
})
