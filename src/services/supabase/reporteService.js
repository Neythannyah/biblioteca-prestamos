import { obtenerInstancia as getSupabase } from '../../patterns/singleton/supabaseClient.js'
import { authService } from './authService.js'
import { normalizarFechaStr } from '../../domain/calendario.js'

export const reporteService = {
  /**
   * Reporte 1: Libros actualmente prestados (consulta vista v_libros_prestados)
   */
  async obtenerLibrosPrestados() {
    await authService.validarSesion()
    const supabase = getSupabase()

    const { data, error } = await supabase
      .from('v_libros_prestados')
      .select('*')

    if (error) {
      throw new Error(`Error al obtener libros prestados: ${error.message}`)
    }

    return (data || []).map(r => ({
      id: String(r.prestamo_id),
      prestamo_id: String(r.prestamo_id),
      codigo: `PR-${r.fecha_prestamo ? r.fecha_prestamo.substring(0, 4) : '2026'}-${String(r.prestamo_id).padStart(3, '0')}`,
      libro_id: String(r.libro_id),
      libro_codigo: r.libro_codigo,
      libro_titulo: r.libro_titulo,
      libro_autor: r.libro_autor,
      usuario_id: String(r.usuario_id),
      usuario_nombre: r.usuario_nombre,
      usuario_rut: r.usuario_rut,
      usuario_tipo: r.usuario_tipo,
      fecha_prestamo: r.fecha_prestamo,
      fecha_vencimiento: r.fecha_vencimiento,
      renovado: Boolean(r.renovado),
      estado: 'Activo'
    }))
  },

  /**
   * Reporte 2: Libros con retraso (consulta vista v_libros_con_retraso)
   */
  async obtenerLibrosConRetraso() {
    await authService.validarSesion()
    const supabase = getSupabase()

    const { data, error } = await supabase
      .from('v_libros_con_retraso')
      .select('*')

    if (error) {
      throw new Error(`Error al obtener libros con retraso: ${error.message}`)
    }

    return (data || []).map(r => ({
      id: String(r.prestamo_id),
      prestamo_id: String(r.prestamo_id),
      codigo: `PR-${r.fecha_prestamo ? r.fecha_prestamo.substring(0, 4) : '2026'}-${String(r.prestamo_id).padStart(3, '0')}`,
      libro_codigo: r.libro_codigo,
      libro_titulo: r.libro_titulo,
      usuario_rut: r.usuario_rut,
      usuario_nombre: r.usuario_nombre,
      usuario_tipo: r.usuario_tipo,
      fecha_prestamo: r.fecha_prestamo,
      fecha_vencimiento: r.fecha_vencimiento,
      dias_retraso: r.dias_retraso,
      multa_acumulada_estimada: r.multa_acumulada_estimada,
      estado: 'Activo'
    }))
  },

  /**
   * Reporte 3: Usuarios sancionados / bloqueados (consulta vista v_usuarios_sancionados)
   */
  async obtenerUsuariosSancionados() {
    await authService.validarSesion()
    const supabase = getSupabase()

    const { data, error } = await supabase
      .from('v_usuarios_sancionados')
      .select('*')

    if (error) {
      throw new Error(`Error al obtener usuarios sancionados: ${error.message}`)
    }

    return (data || []).map(r => ({
      id: String(r.usuario_id),
      usuario_id: String(r.usuario_id),
      rut: r.rut,
      nombre: r.nombre,
      correo: r.correo,
      tipo: r.tipo,
      estado: r.estado,
      motivo_bloqueo: r.motivo_bloqueo,
      total_deuda_multas: r.total_deuda_multas,
      prestamos_vencidos_conteo: r.prestamos_vencidos_conteo
    }))
  },

  /**
   * Reporte 4: Préstamos por rango de fechas (llama a rpc_prestamos_por_rango)
   */
  async obtenerPrestamosPorRango(fechaInicio, fechaFin) {
    await authService.validarSesion()
    const supabase = getSupabase()

    const fIni = fechaInicio ? normalizarFechaStr(fechaInicio) : '1900-01-01'
    const fFin = fechaFin ? normalizarFechaStr(fechaFin) : '2100-12-31'

    const { data, error } = await supabase.rpc('rpc_prestamos_por_rango', {
      p_fecha_desde: fIni,
      p_fecha_hasta: fFin
    })

    if (error) {
      throw new Error(`Error al obtener préstamos por rango: ${error.message}`)
    }

    return (data || []).map(r => ({
      id: String(r.prestamo_id),
      codigo: `PR-${r.fecha_prestamo ? r.fecha_prestamo.substring(0, 4) : '2026'}-${String(r.prestamo_id).padStart(3, '0')}`,
      libro_id: String(r.libro_id),
      libro_codigo: r.libro_codigo,
      libro_titulo: r.libro_titulo,
      usuario_id: String(r.usuario_id),
      usuario_nombre: r.usuario_nombre,
      usuario_rut: r.usuario_rut,
      usuario_tipo: r.usuario_tipo,
      fecha_prestamo: r.fecha_prestamo,
      fecha_vencimiento: r.fecha_vencimiento,
      fecha_devolucion: r.fecha_devolucion,
      renovado: Boolean(r.renovado),
      estado: r.estado
    }))
  },

  /**
   * Estadísticas y KPIs consolidados para el Dashboard
   */
  async obtenerEstadisticasDashboard() {
    await authService.validarSesion()
    const supabase = getSupabase()

    // 1. Ejecutar el observer diario en la BD para sincronizar usuarios vencidos
    try {
      await supabase.rpc('actualizar_estados_por_vencimiento')
    } catch (e) {
      // Ignorar si ya fue ejecutado
    }

    // Consultas concurrentes
    const [librosRes, usuariosRes, prestadosRes, retrasadosRes, sancionadosRes, multasRes] = await Promise.all([
      supabase.from('libro').select('id', { count: 'exact', head: true }),
      supabase.from('usuario').select('id', { count: 'exact', head: true }),
      supabase.from('v_libros_prestados').select('*'),
      supabase.from('v_libros_con_retraso').select('*'),
      supabase.from('v_usuarios_sancionados').select('*'),
      supabase.from('multa').select('monto').eq('pagada', false)
    ])

    const librosPrestados = prestadosRes.data || []
    const prestamosVencidos = retrasadosRes.data || []
    const usuariosBloqueados = sancionadosRes.data || []
    const multasPendientes = multasRes.data || []

    const totalMultasRegistradas = multasPendientes.reduce((acc, m) => acc + (m.monto || 0), 0)
    const totalMultasEstimadasVencidos = prestamosVencidos.reduce((acc, p) => acc + (p.multa_acumulada_estimada || 0), 0)
    const totalDeudaGlobalCLP = totalMultasRegistradas + totalMultasEstimadasVencidos

    // Próximos vencimientos
    const proximosVencimientos = [...librosPrestados]
      .sort((a, b) => a.fecha_vencimiento.localeCompare(b.fecha_vencimiento))
      .slice(0, 6)
      .map(p => {
        const conRetraso = prestamosVencidos.find(r => r.prestamo_id === p.prestamo_id)
        return {
          id: String(p.prestamo_id),
          codigo: `PR-${p.fecha_prestamo ? p.fecha_prestamo.substring(0, 4) : '2026'}-${String(p.prestamo_id).padStart(3, '0')}`,
          libro_titulo: p.libro_titulo,
          libro_codigo: p.libro_codigo,
          usuario_nombre: p.usuario_nombre,
          fecha_vencimiento: p.fecha_vencimiento,
          esta_vencido: Boolean(conRetraso),
          multa_estimada: conRetraso ? conRetraso.multa_acumulada_estimada : 0,
          dias_retraso: conRetraso ? conRetraso.dias_retraso : 0
        }
      })

    // Gráfico de préstamos de los últimos 6 meses
    const mesesNombres = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    const hoy = new Date()
    const ultimosMeses = []

    const { data: todosPrestamos } = await supabase
      .from('prestamo')
      .select('fecha_prestamo, fecha_devolucion')

    const listaPrestamos = todosPrestamos || []

    for (let i = 5; i >= 0; i--) {
      const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1)
      const anio = d.getFullYear()
      const mesNum = d.getMonth() + 1
      const prefijo = `${anio}-${String(mesNum).padStart(2, '0')}`
      const etiqueta = `${mesesNombres[d.getMonth()]} ${anio}`

      const totalMes = listaPrestamos.filter(p => p.fecha_prestamo && p.fecha_prestamo.startsWith(prefijo)).length
      const devueltosMes = listaPrestamos.filter(p => p.fecha_devolucion && p.fecha_devolucion.startsWith(prefijo)).length

      ultimosMeses.push({
        mes: etiqueta,
        prestamos: totalMes,
        devoluciones: devueltosMes
      })
    }

    return {
      kpis: {
        librosPrestados: librosPrestados.length,
        prestamosVencidos: prestamosVencidos.length,
        usuariosBloqueados: usuariosBloqueados.length,
        multasPendientesCLP: totalMultasRegistradas,
        multasEstimadasVencidosCLP: totalMultasEstimadasVencidos,
        totalDeudaGeneralCLP: totalDeudaGlobalCLP,
        totalLibros: librosRes.count || 0,
        totalUsuarios: usuariosRes.count || 0
      },
      proximosVencimientos,
      graficoHistorico: ultimosMeses
    }
  }
}
