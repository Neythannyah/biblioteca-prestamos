import { dbStorage } from './storage.js'
import { authService } from './authService.js'

export const libroService = {
  /**
   * Lista libros con filtros de búsqueda y estado
   */
  async listar(filtros = {}) {
    await authService.validarSesion()
    await new Promise(r => setTimeout(r, 120))

    let libros = dbStorage.getLibros()

    if (filtros.busqueda) {
      const q = filtros.busqueda.trim().toLowerCase()
      libros = libros.filter(l =>
        l.titulo.toLowerCase().includes(q) ||
        l.autor.toLowerCase().includes(q) ||
        l.codigo.toLowerCase().includes(q) ||
        (l.editorial && l.editorial.toLowerCase().includes(q))
      )
    }

    if (filtros.estado && filtros.estado !== 'todos') {
      libros = libros.filter(l => l.estado === filtros.estado)
    }

    return libros
  },

  /**
   * Obtiene un libro por ID
   */
  async obtenerPorId(id) {
    const libros = dbStorage.getLibros()
    const libro = libros.find(l => l.id === id)
    if (!libro) throw new Error('Libro no encontrado.')
    return libro
  },

  /**
   * Crea un nuevo libro validando unicidad de código
   */
  async crear(datos) {
    await authService.validarSesion()
    await new Promise(r => setTimeout(r, 150))

    if (!datos.titulo?.trim()) throw new Error('El título del libro es obligatorio.')
    if (!datos.autor?.trim()) throw new Error('El autor del libro es obligatorio.')
    if (!datos.codigo?.trim()) throw new Error('El código único del libro es obligatorio.')

    const codigoNormalizado = datos.codigo.trim().toUpperCase()
    const libros = dbStorage.getLibros()

    // Validar unicidad de código
    const existeCodigo = libros.some(l => l.codigo.toUpperCase() === codigoNormalizado)
    if (existeCodigo) {
      throw new Error(`El código "${codigoNormalizado}" ya está registrado en otro libro. Debe ser único.`)
    }

    const nuevoLibro = {
      id: `lib_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      codigo: codigoNormalizado,
      titulo: datos.titulo.trim(),
      autor: datos.autor.trim(),
      editorial: (datos.editorial || '').trim(),
      anio: datos.anio ? parseInt(datos.anio, 10) : new Date().getFullYear(),
      estado: datos.estado === 'En reparación' ? 'En reparación' : 'Disponible'
    }

    libros.unshift(nuevoLibro)
    dbStorage.setLibros(libros)
    return nuevoLibro
  },

  /**
   * Actualiza los datos de un libro
   */
  async actualizar(id, datos) {
    await authService.validarSesion()
    await new Promise(r => setTimeout(r, 150))

    const libros = dbStorage.getLibros()
    const indice = libros.findIndex(l => l.id === id)
    if (indice === -1) throw new Error('Libro no encontrado para actualizar.')

    const actual = libros[indice]

    // Si intenta cambiar el código, validar unicidad
    if (datos.codigo && datos.codigo.trim().toUpperCase() !== actual.codigo.toUpperCase()) {
      const nuevoCodigo = datos.codigo.trim().toUpperCase()
      const existe = libros.some(l => l.id !== id && l.codigo.toUpperCase() === nuevoCodigo)
      if (existe) {
        throw new Error(`El código "${nuevoCodigo}" ya está en uso por otro libro.`)
      }
      actual.codigo = nuevoCodigo
    }

    if (datos.titulo) actual.titulo = datos.titulo.trim()
    if (datos.autor) actual.autor = datos.autor.trim()
    if (datos.editorial !== undefined) actual.editorial = (datos.editorial || '').trim()
    if (datos.anio !== undefined) actual.anio = parseInt(datos.anio, 10)

    // Estado: editable solo entre Disponible y En reparación si no está Prestado actualmente
    if (datos.estado) {
      if (actual.estado === 'Prestado' && datos.estado !== 'Prestado') {
        throw new Error('No se puede cambiar manualmente el estado de un libro prestado. Debe registrarse su devolución.')
      }
      if (datos.estado === 'Prestado' && actual.estado !== 'Prestado') {
        throw new Error('El estado "Prestado" solo puede ser asignado mediante el registro de un préstamo.')
      }
      if (['Disponible', 'En reparación'].includes(datos.estado)) {
        actual.estado = datos.estado
      }
    }

    libros[indice] = actual
    dbStorage.setLibros(libros)
    return actual
  },

  /**
   * Actualización interna del estado por el sistema de préstamos
   */
  _actualizarEstadoSistema(id, nuevoEstado) {
    const libros = dbStorage.getLibros()
    const l = libros.find(item => item.id === id)
    if (l) {
      l.estado = nuevoEstado
      dbStorage.setLibros(libros)
    }
  }
}

