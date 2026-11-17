import { describe, it, expect } from 'vitest'
import {
  esFinDeSemana,
  esFeriado,
  esDiaHabil,
  sumarDiasHabiles,
  contarDiasHabiles,
  FERIADOS_OFICIALES_CHILE
} from './calendario.js'
import {
  calcularFechaVencimiento,
  estaVencido,
  validarAptitudPrestamo,
  validarRenovacion,
  calcularNuevaFechaRenovacion
} from './prestamos.js'
import {
  calcularDiasAtraso,
  calcularMontoMulta,
  calcularLiquidacionPrestamo
} from './multas.js'
import { evaluarEstadoUsuario } from './usuarios.js'
import {
  validarRut,
  formatearRut,
  limpiarRut,
  calcularDigitoVerificador
} from './rut.js'

describe('Reglas de Dominio - Calendario y Días Hábiles en Chile', () => {
  it('detecta correctamente fines de semana', () => {
    // 2026-03-07 es Sábado, 2026-03-08 es Domingo, 2026-03-09 es Lunes
    expect(esFinDeSemana('2026-03-07')).toBe(true)
    expect(esFinDeSemana('2026-03-08')).toBe(true)
    expect(esFinDeSemana('2026-03-09')).toBe(false)
  })

  it('detecta feriados oficiales chilenos', () => {
    // 1 de Mayo y 18 de Septiembre son feriados irrenunciables en Chile
    expect(esFeriado('2026-05-01', FERIADOS_OFICIALES_CHILE)).toBe(true)
    expect(esFeriado('2026-09-18', FERIADOS_OFICIALES_CHILE)).toBe(true)
    // 2 de Mayo de 2026 no es feriado
    expect(esFeriado('2026-05-02', FERIADOS_OFICIALES_CHILE)).toBe(false)
  })

  it('valida día hábil excluyendo fines de semana y feriados', () => {
    // 2026-05-01 es Viernes pero es Día del Trabajo (Feriado) -> NO es día hábil
    expect(esDiaHabil('2026-05-01', FERIADOS_OFICIALES_CHILE)).toBe(false)
    // 2026-05-04 es Lunes y no es feriado -> SÍ es día hábil
    expect(esDiaHabil('2026-05-04', FERIADOS_OFICIALES_CHILE)).toBe(true)
  })

  it('suma días hábiles saltándose fines de semana y feriados', () => {
    // Semana sin feriados: Lunes 2026-03-09 + 5 días hábiles
    // Martes 10 (1), Miér 11 (2), Jue 12 (3), Vie 13 (4), Lun 16 (5)
    const fechaFin = sumarDiasHabiles('2026-03-09', 5, FERIADOS_OFICIALES_CHILE)
    expect(fechaFin).toBe('2026-03-16')

    // Con feriado: Si prestamos el Jueves 2026-04-30 por 1 día hábil
    // Viernes 2026-05-01 es feriado, Sáb/Dom fin de semana -> debe vencer el Lunes 2026-05-04
    const fechaConFeriado = sumarDiasHabiles('2026-04-30', 1, FERIADOS_OFICIALES_CHILE)
    expect(fechaConFeriado).toBe('2026-05-04')
  })

  it('cuenta correctamente los días hábiles entre dos fechas', () => {
    // Entre Viernes 2026-04-30 y Lunes 2026-05-04 hay 1 día hábil (el lunes 4, ya que el viernes 1 es feriado)
    const dias = contarDiasHabiles('2026-04-30', '2026-05-04', FERIADOS_OFICIALES_CHILE)
    expect(dias).toBe(1)
  })
})

describe('Reglas de Dominio - Préstamos y Plazos', () => {
  it('aplica 5 días hábiles a Estudiante y 10 días a Docente', () => {
    const fechaPrestamo = '2026-03-09' // Lunes
    const vtoEstudiante = calcularFechaVencimiento(fechaPrestamo, 'Estudiante', FERIADOS_OFICIALES_CHILE)
    const vtoDocente = calcularFechaVencimiento(fechaPrestamo, 'Docente', FERIADOS_OFICIALES_CHILE)

    // Estudiante: 5 días hábiles -> 2026-03-16
    expect(vtoEstudiante).toBe('2026-03-16')
    // Docente: 10 días hábiles -> Lun 2026-03-23
    expect(vtoDocente).toBe('2026-03-23')
  })

  it('valida aptitud del usuario para nuevo préstamo', () => {
    const usuarioOk = { id: 1, nombre: 'Juan Pérez', estado: 'Habilitado' }
    const usuarioBloqueado = { id: 2, nombre: 'Ana Gómez', estado: 'Bloqueado', motivo_bloqueo: 'Moroso' }

    // Usuario habilitado sin deudas
    expect(validarAptitudPrestamo(usuarioOk, [], []).apto).toBe(true)

    // Usuario bloqueado
    const resBloq = validarAptitudPrestamo(usuarioBloqueado, [], [])
    expect(resBloq.apto).toBe(false)
    expect(resBloq.motivo).toContain('Moroso')

    // Usuario con multas pendientes
    const resMulta = validarAptitudPrestamo(usuarioOk, [], [{ id: 1, monto: 3000, estado: 'Pendiente' }])
    expect(resMulta.apto).toBe(false)
    expect(resMulta.motivo).toContain('multa')

    // Usuario con préstamo vencido no devuelto
    const prestamoVencido = {
      id: 99,
      estado: 'Activo',
      fecha_vencimiento: '2026-03-01'
    }
    const resVencido = validarAptitudPrestamo(usuarioOk, [prestamoVencido], [], '2026-03-05')
    expect(resVencido.apto).toBe(false)
    expect(resVencido.motivo).toContain('fecha de entrega vencida')
  })

  it('gestiona la renovación única de préstamos', () => {
    const prestamo = {
      id: 1,
      estado: 'Activo',
      fecha_vencimiento: '2026-03-16',
      usuario_tipo: 'Estudiante',
      renovado: false
    }
    const usuario = { id: 1, estado: 'Habilitado' }

    // 1. Renovación permitida antes del vencimiento
    const res1 = validarRenovacion(prestamo, usuario, '2026-03-12')
    expect(res1.puede).toBe(true)

    // Nueva fecha calculada a partir de la fecha de vencimiento original (+5 días hábiles)
    const nuevaFecha = calcularNuevaFechaRenovacion(prestamo, FERIADOS_OFICIALES_CHILE)
    expect(nuevaFecha).toBe('2026-03-23')

    // 2. Rechazar si ya fue renovado previamente
    const prestamoYaRenovado = { ...prestamo, renovado: true }
    const res2 = validarRenovacion(prestamoYaRenovado, usuario, '2026-03-12')
    expect(res2.puede).toBe(false)
    expect(res2.motivo).toContain('única renovación')

    // 3. Rechazar si el préstamo ya está vencido
    const res3 = validarRenovacion(prestamo, usuario, '2026-03-20')
    expect(res3.puede).toBe(false)
    expect(res3.motivo).toContain('se encuentra vencido')

    // 4. Rechazar si el usuario está bloqueado
    const usuarioBloq = { id: 1, estado: 'Bloqueado' }
    const res4 = validarRenovacion(prestamo, usuarioBloq, '2026-03-12')
    expect(res4.puede).toBe(false)
    expect(res4.motivo).toContain('usuario bloqueado')
  })
})

describe('Reglas de Dominio - Multas y Liquidación', () => {
  it('calcula $1.000 por cada día de atraso', () => {
    expect(calcularMontoMulta(0, 1000)).toBe(0)
    expect(calcularMontoMulta(1, 1000)).toBe(1000)
    expect(calcularMontoMulta(4, 1000)).toBe(4000)
    expect(calcularMontoMulta(3, 1500)).toBe(4500)
  })

  it('calcula días de atraso en modo días hábiles por defecto', () => {
    // Vencimiento Viernes 2026-03-13, devuelto Miércoles 2026-03-18
    // Días hábiles transcurridos: Lunes 16 (1), Martes 17 (2), Miércoles 18 (3) = 3 días hábiles
    const dias = calcularDiasAtraso('2026-03-13', '2026-03-18', FERIADOS_OFICIALES_CHILE, 'habiles')
    expect(dias).toBe(3)
  })

  it('calcula liquidación completa de un préstamo', () => {
    const prestamo = {
      id: 10,
      fecha_vencimiento: '2026-03-13',
      fecha_devolucion: '2026-03-18'
    }
    const liq = calcularLiquidacionPrestamo(prestamo, '2026-03-18', FERIADOS_OFICIALES_CHILE, {
      tarifaDiaria: 1000,
      modoConteo: 'habiles'
    })
    expect(liq.tieneAtraso).toBe(true)
    expect(liq.diasAtraso).toBe(3)
    expect(liq.monto).toBe(3000)
  })
})

describe('Reglas de Dominio - Bloqueo y Desbloqueo de Usuarios', () => {
  it('bloquea a usuario con préstamo vencido o multa pendiente', () => {
    const usuario = { id: 5, nombre: 'Carlos' }

    // Préstamo vencido
    const prestamosVencidos = [{ id: 1, estado: 'Activo', fecha_vencimiento: '2026-03-01' }]
    const eval1 = evaluarEstadoUsuario(usuario, prestamosVencidos, [], '2026-03-05')
    expect(eval1.estado).toBe('Bloqueado')
    expect(eval1.motivo_bloqueo).toContain('préstamo(s) activo(s) con fecha de entrega vencida')

    // Multa pendiente
    const multas = [{ id: 2, monto: 2000, estado: 'Pendiente' }]
    const eval2 = evaluarEstadoUsuario(usuario, [], multas, '2026-03-05')
    expect(eval2.estado).toBe('Bloqueado')
    expect(eval2.motivo_bloqueo).toContain('multa(s) pendiente(s)')

    // Sin deudas ni atrasos: Habilitado
    const multasPagadas = [{ id: 2, monto: 2000, estado: 'Pagada' }]
    const eval3 = evaluarEstadoUsuario(usuario, [], multasPagadas, '2026-03-05')
    expect(eval3.estado).toBe('Habilitado')
    expect(eval3.motivo_bloqueo).toBeNull()
  })
})

describe('Reglas de Dominio - Validación de RUT Chileno', () => {
  it('calcula el dígito verificador módulo 11', () => {
    expect(calcularDigitoVerificador('11111111')).toBe('1')
    expect(calcularDigitoVerificador('19876543')).toBe(calcularDigitoVerificador('19876543'))
  })

  it('valida RUTs reales chilenos', () => {
    // RUTs con formato y DV válidos
    expect(validarRut('11.111.111-1')).toBe(true)
    expect(validarRut('11111111-1')).toBe(true)
    expect(validarRut('111111111')).toBe(true) // sin guión pero con DV correcto
    // RUTs inválidos
    expect(validarRut('11.111.111-2')).toBe(false)
    expect(validarRut('12345')).toBe(false)
    expect(validarRut('abc')).toBe(false)
  })

  it('formatea RUT a estándar chileno (XX.XXX.XXX-X)', () => {
    expect(formatearRut('111111111')).toBe('11.111.111-1')
    expect(formatearRut('9876543k')).toBe('9.876.543-K')
  })
})

