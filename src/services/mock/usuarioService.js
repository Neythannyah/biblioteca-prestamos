import { dbStorage } from './storage.js'
import { authService } from './authService.js'
import { validarRut, formatearRut, limpiarRut } from '../../domain/rut.js'
import { UsuarioFactory } from '../../patterns/factory/UsuarioFactory.js'

export const usuarioService = {
  /**
   * Lista usuarios con filtros opcionales
   */
  async listar(filtros = {}) {
    await authService.validarSesion()
    await new Promise(r => setTimeout(r, 120))

    let usuarios = dbStorage.getUsuarios()

    if (filtros.busqueda) {
      const q = filtros.busqueda.trim().toLowerCase()
      const qLimpio = limpiarRut(q)
      usuarios = usuarios.filter(u =>
        u.nombre.toLowerCase().includes(q) ||
        u.correo.toLowerCase().includes(q) ||
        u.rut.toLowerCase().includes(q) ||
        (qLimpio && limpiarRut(u.rut).includes(qLimpio))
      )
    }

    if (filtros.tipo && filtros.tipo !== 'todos') {
      usuarios = usuarios.filter(u => u.tipo === filtros.tipo)
    }

    if (filtros.estado && filtros.estado !== 'todos') {
      usuarios = usuarios.filter(u => u.estado === filtros.estado)
    }

    return usuarios
  },

  /**
   * Obtiene un usuario por ID
   */
  async obtenerPorId(id) {
    const usuarios = dbStorage.getUsuarios()
    const usuario = usuarios.find(u => u.id === id)
    if (!usuario) throw new Error('Usuario no encontrado.')
    return usuario
  },

  /**
   * Obtiene un usuario por RUT
   */
  async obtenerPorRut(rut) {
    const limpio = limpiarRut(rut)
    const usuarios = dbStorage.getUsuarios()
    return usuarios.find(u => limpiarRut(u.rut) === limpio) || null
  },

  /**
   * Crea un nuevo usuario utilizando el patrón FACTORY METHOD
   * (UsuarioFactory.fabricar)
   */
  async crear(datos) {
    await authService.validarSesion()
    await new Promise(r => setTimeout(r, 150))

    if (!datos.rut?.trim()) throw new Error('El RUT es obligatorio.')
    if (!datos.nombre?.trim()) throw new Error('El nombre completo es obligatorio.')
    if (!datos.correo?.trim()) throw new Error('El correo electrónico es obligatorio.')
    if (!['Estudiante', 'Docente'].includes(datos.tipo)) {
      throw new Error('El tipo de usuario debe ser "Estudiante" o "Docente".')
    }

    // 1. Validar formato y algoritmo de RUT chileno (módulo 11)
    if (!validarRut(datos.rut)) {
      throw new Error('El RUT ingresado no es válido. Verifica el número y el dígito verificador.')
    }

    // 2. Validar unicidad de RUT
    const rutLimpio = limpiarRut(datos.rut)
    const usuarios = dbStorage.getUsuarios()
    const existe = usuarios.some(u => limpiarRut(u.rut) === rutLimpio)
    if (existe) {
      throw new Error(`El RUT ${formatearRut(datos.rut)} ya se encuentra registrado en el sistema.`)
    }

    // 3. Creación estricta a través de la fábrica de usuarios (Factory Method)
    const usuarioInstancia = UsuarioFactory.fabricar(datos.tipo, {
      rut: datos.rut,
      nombre: datos.nombre,
      correo: datos.correo,
      carrera: datos.carrera,
      departamento: datos.departamento,
      estado: 'Habilitado',
      motivo_bloqueo: null
    })

    // Persistir entidad creada por la fábrica
    const nuevoUsuario = {
      id: usuarioInstancia.id,
      rut: usuarioInstancia.rut,
      nombre: usuarioInstancia.nombre,
      correo: usuarioInstancia.correo,
      tipo: usuarioInstancia.tipo,
      estado: usuarioInstancia.estado,
      motivo_bloqueo: usuarioInstancia.motivo_bloqueo,
      plazo_dias: usuarioInstancia.obtenerPlazoPrestamoDias(),
      carrera: usuarioInstancia.carrera || null,
      departamento: usuarioInstancia.departamento || null
    }

    usuarios.unshift(nuevoUsuario)
    dbStorage.setUsuarios(usuarios)
    return nuevoUsuario
  },

  /**
   * Actualiza datos personales del usuario (nombre, correo)
   */
  async actualizar(id, datos) {
    await authService.validarSesion()
    await new Promise(r => setTimeout(r, 120))

    const usuarios = dbStorage.getUsuarios()
    const idx = usuarios.findIndex(u => u.id === id)
    if (idx === -1) throw new Error('Usuario no encontrado para actualizar.')

    const actual = usuarios[idx]
    if (datos.nombre) actual.nombre = datos.nombre.trim()
    if (datos.correo) actual.correo = datos.correo.trim().toLowerCase()
    if (datos.carrera !== undefined) actual.carrera = datos.carrera
    if (datos.departamento !== undefined) actual.departamento = datos.departamento

    usuarios[idx] = actual
    dbStorage.setUsuarios(usuarios)
    return actual
  },

  /**
   * Actualiza el estado y motivo de bloqueo del usuario (usado por el Observer)
   */
  actualizarEstado(id, nuevoEstado, motivo = null) {
    const usuarios = dbStorage.getUsuarios()
    const u = usuarios.find(item => item.id === id)
    if (u) {
      u.estado = nuevoEstado
      u.motivo_bloqueo = nuevoEstado === 'Bloqueado' ? motivo : null
      dbStorage.setUsuarios(usuarios)
    }
  }
}

