import { describe, it, expect } from 'vitest'
import { obtenerInstancia } from './singleton/supabaseClient.js'
import { UsuarioFactory, EstudianteFactory, DocenteFactory } from './factory/UsuarioFactory.js'
import { SujetoPrestamo, EstadoUsuarioService } from './observer/EstadoUsuarioService.js'
import { ReporteExportAdapter } from './adapter/ReporteExportAdapter.js'

describe('Patrón Singleton: SupabaseClient', () => {
  it('garantiza una única instancia en toda la aplicación', () => {
    const inst1 = obtenerInstancia()
    const inst2 = obtenerInstancia()
    expect(inst1).toBe(inst2)
  })

  it('permite configurar y recuperar headers de autenticación Bearer', () => {
    const cliente = obtenerInstancia()
    cliente.setAuthToken('token-prueba-123')
    const headers = cliente.getHeaders()
    expect(headers.Authorization).toBe('Bearer token-prueba-123')
    expect(headers['Content-Type']).toBe('application/json')
  })
})

describe('Patrón Factory Method: UsuarioFactory', () => {
  it('crea un Estudiante con plazo de 5 días hábiles a través de la fábrica', () => {
    const estudiante = UsuarioFactory.fabricar('Estudiante', {
      rut: '11.111.111-1',
      nombre: 'Sofía Valenzuela',
      correo: 's.valenzuela@institucion.cl',
      carrera: 'Ingeniería Civil'
    })

    expect(estudiante.tipo).toBe('Estudiante')
    expect(estudiante.obtenerPlazoPrestamoDias()).toBe(5)
    expect(estudiante.carrera).toBe('Ingeniería Civil')
    expect(estudiante.estado).toBe('Habilitado')
  })

  it('crea un Docente con plazo de 10 días hábiles a través de la fábrica', () => {
    const docente = UsuarioFactory.fabricar('Docente', {
      rut: '12.345.678-5',
      nombre: 'Prof. Carlos Morales',
      correo: 'c.morales@institucion.cl',
      departamento: 'Ciencias de la Computación'
    })

    expect(docente.tipo).toBe('Docente')
    expect(docente.obtenerPlazoPrestamoDias()).toBe(10)
    expect(docente.departamento).toBe('Ciencias de la Computación')
  })
})

describe('Patrón Observer: SujetoPrestamo y EstadoUsuarioService', () => {
  it('notifica a los observadores suscritos ante eventos del sujeto', () => {
    const sujeto = new SujetoPrestamo()
    let eventoRecibido = null
    let datosRecibidos = null

    const observador = {
      actualizar: (evt, data) => {
        eventoRecibido = evt
        datosRecibidos = data
      }
    }

    sujeto.suscribir(observador)
    sujeto.notificar('EVENTO_PRUEBA', { test: true })

    expect(eventoRecibido).toBe('EVENTO_PRUEBA')
    expect(datosRecibidos.test).toBe(true)
  })

  it('procesa devolución con atraso generando multa y bloqueando usuario', () => {
    let usuarioActualizado = null
    let multaCreada = null

    const mockUsuarioService = {
      actualizarEstado: (id, estado, motivo) => {
        usuarioActualizado = { id, estado, motivo }
      }
    }

    const mockMultaService = {
      crearMulta: (datos) => {
        multaCreada = datos
        return datos
      }
    }

    const observador = new EstadoUsuarioService({
      usuarioService: mockUsuarioService,
      multaService: mockMultaService
    })

    observador.actualizar('DEVOLUCION_CON_ATRASO', {
      prestamo: {
        id: 'p1',
        usuario_id: 'u1',
        usuario_nombre: 'Pedro',
        usuario_rut: '11.111.111-1',
        libro_id: 'l1',
        libro_titulo: 'Libro A',
        fecha_devolucion: '2026-03-20'
      },
      liquidacion: {
        monto: 3000,
        diasAtraso: 3
      }
    })

    expect(multaCreada).not.toBeNull()
    expect(multaCreada.monto).toBe(3000)
    expect(usuarioActualizado).not.toBeNull()
    expect(usuarioActualizado.estado).toBe('Bloqueado')
    expect(usuarioActualizado.motivo).toContain('Multa pendiente')
  })
})

describe('Patrón Adapter: ReporteExportAdapter', () => {
  it('prepara adecuadamente las filas según configuración de columnas', () => {
    const datos = [
      { id: 1, nombre: 'Libro Uno', precio: 1000 },
      { id: 2, nombre: 'Libro Dos', precio: 2500 }
    ]

    const columnas = [
      { key: 'nombre', label: 'Título' },
      { key: 'precio', label: 'Valor', selector: (item) => `$${item.precio}` }
    ]

    const filas = ReporteExportAdapter.prepararFilas(datos, columnas)
    expect(filas).toHaveLength(2)
    expect(filas[0]['Título']).toBe('Libro Uno')
    expect(filas[0]['Valor']).toBe('$1000')
  })
})

