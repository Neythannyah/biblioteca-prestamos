import { dbStorage } from './storage.js'
import { authService } from './authService.js'
import { estaVencido } from '../../domain/prestamos.js'
import { calcularLiquidacionPrestamo } from '../../domain/multas.js'
import { feriadoService } from './feriadoService.js'
import { configService } from './configService.js'
import { normalizarFechaStr } from '../../domain/calendario.js'

export const reporteService = {
  /**
   * Reporte 1: Libros actualmente prestados
   */
  async obtenerLibrosPrestados() {
    await authService.validarSesion()
    const prestamos = dbStorage.getPrestamos()
    return prestamos.filter(p => p.estado === 'Activo')
  },

  /**
   * Reporte 2: Libros con retraso (préstamos activos con fecha vencida)
   */
  async obtenerLibrosConRetraso() {
    await authService.validarSesion()
    const prestamos = dbStorage.getPrestamos()
    const feriados = feriadoService.obtenerFeriados()
    const config = configService.obtenerConfig()
    const hoy = new Date()

    const vencidos = prestamos
      .filter(p => p.estado === 'Activo' && estaVencido(p, hoy))
      .map(p => {
        const liq = calcularLiquidacionPrestamo(p, hoy, feriados, config)
        return {
          ...p,
          dias_retraso: liq.diasAtraso,
          multa_acumulada_estimada: liq.monto
        }
      })

    return vencidos
  },

  /**
   * Reporte 3: Usuarios sancionados / bloqueados
   */
  async obtenerUsuariosSancionados() {
    await authService.validarSesion()
    const usuarios = dbStorage.getUsuarios()
    const multas = dbStorage.getMultas()
    const prestamos = dbStorage.getPrestamos()
    const hoy = new Date()

    return usuarios
      .filter(u => u.estado === 'Bloqueado')
      .map(u => {
        const multasUsuario = multas.filter(m => m.usuario_id === u.id && m.estado === 'Pendiente')
        const deudaTotal = multasUsuario.reduce((acc, m) => acc + (m.monto || 0), 0)
        const prestamosVencidos = prestamos.filter(p => p.usuario_id === u.id && p.estado === 'Activo' && estaVencido(p, hoy))

        return {
          ...u,
          total_deuda_multas: deudaTotal,
          cantidad_multas_pendientes: multasUsuario.length,
          prestamos_vencidos_conteo: prestamosVencidos.length
        }
      })
  },

  /**
   * Reporte 4: Préstamos por rango de fechas
   */
  async obtenerPrestamosPorRango(fechaInicio, fechaFin) {
    await authService.validarSesion()
    const prestamos = dbStorage.getPrestamos()

    if (!fechaInicio && !fechaFin) return prestamos

    const fIni = fechaInicio ? normalizarFechaStr(fechaInicio) : '1900-01-01'
    const fFin = fechaFin ? normalizarFechaStr(fechaFin) : '2100-12-31'

    return prestamos.filter(p => {
      const fPrest = p.fecha_prestamo
      return fPrest >= fIni && fPrest <= fFin
    })
  },

  /**
   * Estadísticas y KPIs consolidados para el Dashboard
   */
  async obtenerEstadisticasDashboard() {
    await authService.validarSesion()
    const libros = dbStorage.getLibros()
    const usuarios = dbStorage.getUsuarios()
    const prestamos = dbStorage.getPrestamos()
    const multas = dbStorage.getMultas()
    const feriados = feriadoService.obtenerFeriados()
    const config = configService.obtenerConfig()
    const hoy = new Date()

    // 1. KPI: Libros prestados (activos)
    const librosPrestados = prestamos.filter(p => p.estado === 'Activo')

    // 2. KPI: Préstamos vencidos
    const prestamosVencidos = librosPrestados.filter(p => estaVencido(p, hoy))

    // 3. KPI: Usuarios bloqueados
    const usuariosBloqueados = usuarios.filter(u => u.estado === 'Bloqueado')

    // 4. KPI: Multas pendientes en CLP (registradas + estimadas acumuladas de vencidos activos)
    const multasRegistradasPendientes = multas.filter(m => m.estado === 'Pendiente')
    const totalMultasRegistradas = multasRegistradasPendientes.reduce((acc, m) => acc + (m.monto || 0), 0)

    let totalMultasEstimadasVencidos = 0
    prestamosVencidos.forEach(p => {
      const liq = calcularLiquidacionPrestamo(p, hoy, feriados, config)
      totalMultasEstimadasVencidos += liq.monto
    })

    const totalDeudaGlobalCLP = totalMultasRegistradas + totalMultasEstimadasVencidos

    // 5. Próximos vencimientos (ordenados por fecha de vencimiento más próxima)
    const proximosVencimientos = [...librosPrestados]
      .sort((a, b) => a.fecha_vencimiento.localeCompare(b.fecha_vencimiento))
      .slice(0, 6)
      .map(p => {
        const vencido = estaVencido(p, hoy)
        const liq = vencido ? calcularLiquidacionPrestamo(p, hoy, feriados, config) : null
        return {
          ...p,
          esta_vencido: vencido,
          multa_estimada: liq ? liq.monto : 0,
          dias_retraso: liq ? liq.diasAtraso : 0
        }
      })

    // 6. Gráfico de préstamos de los últimos 6 meses
    const mesesNombres = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    const ultimosMeses = []

    for (let i = 5; i >= 0; i--) {
      const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1)
      const anio = d.getFullYear()
      const mesNum = d.getMonth() + 1
      const prefijo = `${anio}-${String(mesNum).padStart(2, '0')}`
      const etiqueta = `${mesesNombres[d.getMonth()]} ${anio}`

      const totalMes = prestamos.filter(p => p.fecha_prestamo && p.fecha_prestamo.startsWith(prefijo)).length
      const devueltosMes = prestamos.filter(p => p.fecha_devolucion && p.fecha_devolucion.startsWith(prefijo)).length

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
        totalLibros: libros.length,
        totalUsuarios: usuarios.length
      },
      proximosVencimientos,
      graficoHistorico: ultimosMeses
    }
  }
}

