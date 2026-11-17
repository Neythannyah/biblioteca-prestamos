import { formatearRut, limpiarRut } from '../../domain/rut.js'

/**
 * Patrón Factory Method: Creación de entidades de Usuario
 * Define la interfaz abstracta del creador y la estructura base de Usuario.
 */

export class UsuarioBase {
  constructor({ id, rut, nombre, correo, tipo, estado = 'Habilitado', motivo_bloqueo = null, creadoEn = new Date().toISOString() }) {
    this.id = id || `usr_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`
    this.rut = formatearRut(rut)
    this.rutLimpio = limpiarRut(rut)
    this.nombre = (nombre || '').trim()
    this.correo = (correo || '').trim().toLowerCase()
    this.tipo = tipo
    this.estado = estado
    this.motivo_bloqueo = motivo_bloqueo
    this.creadoEn = creadoEn
  }

  // Métodos polimórficos
  obtenerPlazoPrestamoDias() {
    throw new Error('Método abstracto debe ser implementado por la subclase')
  }

  obtenerDescripcionRol() {
    throw new Error('Método abstracto debe ser implementado por la subclase')
  }
}

export class Estudiante extends UsuarioBase {
  constructor(datos) {
    super({ ...datos, tipo: 'Estudiante' })
    this.carrera = datos.carrera || 'Carrera no especificada'
  }

  obtenerPlazoPrestamoDias() {
    return 5 // Plazo oficial para Estudiantes: 5 días hábiles
  }

  obtenerDescripcionRol() {
    return 'Estudiante regular de pregrado / postgrado'
  }
}

export class Docente extends UsuarioBase {
  constructor(datos) {
    super({ ...datos, tipo: 'Docente' })
    this.departamento = datos.departamento || 'Facultad / Departamento'
  }

  obtenerPlazoPrestamoDias() {
    return 10 // Plazo oficial para Docentes: 10 días hábiles
  }

  obtenerDescripcionRol() {
    return 'Docente / Investigador académico'
  }
}

/**
 * Creador Abstracto
 */
export class UsuarioFactory {
  /**
   * Método de fábrica abstracto
   * @param {object} datos
   * @returns {UsuarioBase}
   */
  crear(datos) {
    throw new Error('Método abstracto crear() debe ser implementado por las fábricas concretas')
  }

  /**
   * Punto de entrada estático para resolver la fábrica adecuada según el tipo
   * @param {'Estudiante'|'Docente'} tipo
   * @param {object} datos
   * @returns {UsuarioBase}
   */
  static fabricar(tipo, datos) {
    let fabrica
    if (tipo === 'Docente') {
      fabrica = new DocenteFactory()
    } else {
      fabrica = new EstudianteFactory()
    }
    return fabrica.crear(datos)
  }
}

/**
 * Fábrica Concreta para Estudiantes
 */
export class EstudianteFactory extends UsuarioFactory {
  crear(datos) {
    return new Estudiante(datos)
  }
}

/**
 * Fábrica Concreta para Docentes
 */
export class DocenteFactory extends UsuarioFactory {
  crear(datos) {
    return new Docente(datos)
  }
}

