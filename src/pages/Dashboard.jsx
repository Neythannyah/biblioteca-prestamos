import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BookOpen,
  AlertTriangle,
  UserX,
  DollarSign,
  PlusCircle,
  Calendar,
  Clock,
  ArrowRight,
  TrendingUp,
  RefreshCw
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend
} from 'recharts'
import { reporteService } from '../services/index.js'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Badge } from '../components/ui/Badge.jsx'
import { Skeleton } from '../components/ui/Skeleton.jsx'
import { formatoCLP, formatoFecha } from '../utils/formatters.js'

export function Dashboard() {
  const [datos, setDatos] = useState(null)
  const [cargando, setCargando] = useState(true)
  const navigate = useNavigate()

  const cargarDashboard = async () => {
    try {
      setCargando(true)
      const res = await reporteService.obtenerEstadisticasDashboard()
      setDatos(res)
    } catch (err) {
      console.error('Error al cargar datos del dashboard:', err)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarDashboard()
  }, [])

  if (cargando || !datos) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-80 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      </div>
    )
  }

  const { kpis, proximosVencimientos, graficoHistorico } = datos

  return (
    <div className="space-y-8">
      {/* Encabezado Principal y Atajo Bento */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Panel de Control
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Resumen operativo y estado general de la biblioteca
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={cargarDashboard}
            className="gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Actualizar</span>
          </Button>
          <Button
            variant="primary"
            onClick={() => navigate('/prestamos/nuevo')}
            className="shadow-subtle"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Nuevo Préstamo</span>
          </Button>
        </div>
      </div>

      {/* Banner / Atajo Rápido Bento de Préstamo */}
      <div className="p-6 rounded-3xl bg-primary text-primary-foreground flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-subtle relative overflow-hidden">
        <div className="space-y-1.5 max-w-xl z-10">
          <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">
            Flujo Express en 3 clics
          </span>
          <h2 className="text-xl font-bold tracking-tight">
            Registrar Préstamo de Libro
          </h2>
          <p className="text-xs text-secondary/90 leading-relaxed">
            Asigna ejemplares a estudiantes (5 días) y docentes (10 días) con validación automática de bloqueos, multas pendientes y fechas hábiles.
          </p>
        </div>
        <Button
          variant="secondary"
          size="lg"
          onClick={() => navigate('/prestamos/nuevo')}
          className="z-10 shrink-0 font-semibold"
        >
          <span>Iniciar Registro</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
        {/* Fondo decorativo sutil */}
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-primary-hover/50 rounded-full blur-2xl pointer-events-none"></div>
      </div>

      {/* Tarjetas KPI (Bento Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Libros Prestados */}
        <Card className="hover:border-primary/40 transition-colors">
          <CardContent className="p-5 flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                Libros Prestados
              </span>
              <div className="text-3xl font-extrabold tracking-tight text-foreground">
                {kpis.librosPrestados}
              </div>
              <p className="text-[11px] text-muted-foreground">
                de {kpis.totalLibros} ejemplares en catálogo
              </p>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-secondary text-primary flex items-center justify-center shrink-0">
              <BookOpen className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* KPI 2: Préstamos Vencidos */}
        <Card className="hover:border-destructive/40 transition-colors">
          <CardContent className="p-5 flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                Préstamos Vencidos
              </span>
              <div className={`text-3xl font-extrabold tracking-tight ${kpis.prestamosVencidos > 0 ? 'text-destructive' : 'text-foreground'}`}>
                {kpis.prestamosVencidos}
              </div>
              <p className="text-[11px] text-muted-foreground">
                requieren devolución urgente
              </p>
            </div>
            <div className={`h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 ${kpis.prestamosVencidos > 0 ? 'bg-destructive/15 text-destructive' : 'bg-muted text-muted-foreground'}`}>
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* KPI 3: Usuarios Bloqueados */}
        <Card className="hover:border-warning/40 transition-colors">
          <CardContent className="p-5 flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                Usuarios Bloqueados
              </span>
              <div className={`text-3xl font-extrabold tracking-tight ${kpis.usuariosBloqueados > 0 ? 'text-warning' : 'text-foreground'}`}>
                {kpis.usuariosBloqueados}
              </div>
              <p className="text-[11px] text-muted-foreground">
                por mora o multas pendientes
              </p>
            </div>
            <div className={`h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 ${kpis.usuariosBloqueados > 0 ? 'bg-warning/15 text-warning' : 'bg-muted text-muted-foreground'}`}>
              <UserX className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* KPI 4: Multas Pendientes en CLP */}
        <Card className="hover:border-primary/40 transition-colors">
          <CardContent className="p-5 flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                Multas Pendientes
              </span>
              <div className="text-2xl font-extrabold tracking-tight text-foreground">
                {formatoCLP(kpis.multasPendientesCLP)}
              </div>
              <p className="text-[11px] text-muted-foreground">
                {kpis.multasEstimadasVencidosCLP > 0 && (
                  <span>+ {formatoCLP(kpis.multasEstimadasVencidosCLP)} acum. en vivo</span>
                )}
                {kpis.multasEstimadasVencidosCLP === 0 && 'saldo pendiente a recaudar'}
              </p>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-secondary text-primary flex items-center justify-center shrink-0">
              <DollarSign className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico y Próximos Vencimientos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de Barras Tonal (Recharts) */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Historial de Préstamos (Últimos 6 Meses)
              </CardTitle>
              <CardDescription>
                Evolución de préstamos otorgados y libros devueltos
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={graficoHistorico} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8DFD0" />
                  <XAxis
                    dataKey="mes"
                    stroke="#8A7B6C"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#E8DFD0' }}
                  />
                  <YAxis
                    stroke="#8A7B6C"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: '#FFFDF9',
                      borderColor: '#E8DFD0',
                      borderRadius: '1rem',
                      boxShadow: '0 4px 20px -2px rgba(107, 79, 58, 0.1)',
                      fontSize: '12px'
                    }}
                    cursor={{ fill: '#F2EBDD', opacity: 0.5 }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    iconType="circle"
                    wrapperStyle={{ paddingBottom: '10px', fontSize: '11px' }}
                  />
                  <Bar
                    dataKey="prestamos"
                    name="Préstamos Emitidos"
                    fill="#6B4F3A"
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    dataKey="devoluciones"
                    name="Devoluciones"
                    fill="#B8862F"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Próximos Vencimientos */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3 flex items-center justify-between flex-row">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Próximos Vencimientos
              </CardTitle>
              <CardDescription>
                Seguimiento de fechas límite
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/prestamos')}
              className="text-xs"
            >
              Ver todos
            </Button>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto space-y-3 pt-0">
            {proximosVencimientos.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No hay préstamos activos pendientes de entrega.
              </div>
            ) : (
              proximosVencimientos.map((p) => (
                <div
                  key={p.id}
                  className={`p-3 rounded-2xl border transition-all ${
                    p.esta_vencido
                      ? 'border-destructive/40 bg-destructive/5'
                      : 'border-border/60 bg-muted/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {p.libro_titulo}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {p.usuario_nombre} ({p.usuario_tipo})
                      </p>
                    </div>
                    {p.esta_vencido ? (
                      <Badge variant="destructive" className="shrink-0 text-[10px]">
                        Vencido (+{p.dias_retraso}d)
                      </Badge>
                    ) : (
                      <Badge variant="default" className="shrink-0 text-[10px]">
                        {formatoFecha(p.fecha_vencimiento)}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-border/40 flex items-center justify-between text-[11px]">
                    <span className="font-mono text-muted-foreground">
                      {p.codigo}
                    </span>
                    <button
                      type="button"
                      onClick={() => navigate(`/devoluciones?prestamoId=${p.id}`)}
                      className="font-medium text-primary hover:underline"
                    >
                      Devolver &rarr;
                    </button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

