import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp, CalendarDays, HandCoins, AlertTriangle, PlusCircle, Trophy, CalendarCheck } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import StatusBadge from '../../components/StatusBadge'

const COP = (v) => `$${Number(v || 0).toLocaleString('es-CO')}`
const fecha = (iso) => new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
const diaCorto = (iso) => new Date(iso).toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric' })

/* Paleta fija para las gráficas: solo tokens del sistema, nunca colores por defecto de recharts */
const CHART = {
  tinta: '#161616',
  esmeralda: '#00C896',
  ceniza: '#6B6B6B',
  borde: '#E8E8E4',
}

const tooltipStyle = {
  contentStyle: { borderRadius: 12, border: `1px solid ${CHART.borde}`, fontSize: 12.5, boxShadow: '0 8px 24px rgba(22,22,22,0.08)' },
  labelStyle: { color: CHART.tinta, fontWeight: 700, marginBottom: 2 },
  itemStyle: { color: CHART.ceniza },
  cursor: { fill: CHART.borde, opacity: 0.4 },
}

function Dashboard() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get('/dashboard')
      .then(({ data }) => setData(data))
      .catch(() => setError('No pudimos cargar el dashboard'))
  }, [])

  const stats = [
    { label: 'Ventas de hoy', value: COP(data?.ventasHoy?.total), sub: `${data?.ventasHoy?.count ?? 0} ventas`, icon: TrendingUp },
    { label: 'Ventas del mes', value: COP(data?.ventasMes?.total), sub: `${data?.ventasMes?.count ?? 0} ventas`, icon: CalendarDays },
    { label: 'Por cobrar', value: COP(data?.porCobrar), sub: 'ventas a crédito', icon: HandCoins },
    { label: 'Stock bajo', value: data?.stockBajo?.length ?? 0, sub: 'productos por reponer', icon: AlertTriangle, alerta: (data?.stockBajo?.length ?? 0) > 0 },
  ]

  const ventas7Dias = (data?.ventasUltimos7Dias || []).map((v) => ({ label: diaCorto(v.fecha), total: v.total }))
  const topProductos = data?.topProductos || []

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-tinta">Hola, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="mt-1 text-sm text-ceniza">Así va tu negocio hoy.</p>
        </div>
        {user?.role !== 'contador' && (
          <Link
            to="/ventas/nueva"
            className="inline-flex items-center gap-2 rounded-xl bg-esmeralda px-5 py-3 text-sm font-black text-tinta transition-all hover:brightness-110"
          >
            <PlusCircle size={16} />
            Nueva venta
          </Link>
        )}
      </div>

      {error && <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <div key={s.label} className="rounded-2xl border border-borde bg-white p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-ceniza">{s.label}</p>
                <span className={`rounded-lg p-2 ${s.alerta ? 'bg-amber-100 text-amber-600' : 'bg-esmeralda/10 text-esmeralda'}`}>
                  <Icon size={15} />
                </span>
              </div>
              <p className="mt-3 font-display text-2xl font-bold text-tinta">{data ? s.value : '···'}</p>
              <p className="mt-0.5 text-xs text-ceniza">{s.sub}</p>
            </div>
          )
        })}
      </div>

      {/* Destacados del mes */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-4 rounded-2xl bg-tinta p-5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-esmeralda">
            <Trophy size={20} />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/50">Producto más vendido del mes</p>
            <p className="truncate font-display text-lg font-bold text-white">{data?.productoMasVendido?.name || 'Sin ventas aún'}</p>
            {data?.productoMasVendido && <p className="text-xs text-white/50">{data.productoMasVendido.cantidad} unidades vendidas</p>}
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-2xl border border-esmeralda/30 bg-esmeralda/10 p-5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-esmeralda">
            <CalendarCheck size={20} />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-tinta/60">Día con más ventas del mes</p>
            <p className="truncate font-display text-lg font-bold text-tinta">
              {data?.diaMasVentas ? new Date(data.diaMasVentas.fecha).toLocaleDateString('es-CO', { day: 'numeric', month: 'long' }) : 'Sin ventas aún'}
            </p>
            {data?.diaMasVentas && <p className="text-xs text-tinta/60">{COP(data.diaMasVentas.total)} en ventas</p>}
          </div>
        </div>
      </div>

      {/* Gráficas */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-borde bg-white p-6">
          <h2 className="mb-4 font-display text-lg font-bold text-tinta">Ventas de los últimos 7 días</h2>
          {ventas7Dias.some((v) => v.total > 0) ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={ventas7Dias} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={CHART.borde} />
                <XAxis dataKey="label" tick={{ fill: CHART.ceniza, fontSize: 12 }} axisLine={{ stroke: CHART.borde }} tickLine={false} />
                <YAxis tick={{ fill: CHART.ceniza, fontSize: 12 }} axisLine={false} tickLine={false} width={40} />
                <Tooltip {...tooltipStyle} formatter={(v) => [COP(v), 'Ventas']} />
                <Bar dataKey="total" fill={CHART.esmeralda} radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-16 text-center text-sm text-ceniza">{data ? 'Aún no hay ventas esta semana.' : 'Cargando...'}</p>
          )}
        </section>

        <section className="rounded-2xl border border-borde bg-white p-6">
          <h2 className="mb-4 font-display text-lg font-bold text-tinta">Top 5 productos del mes</h2>
          {topProductos.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topProductos} layout="vertical" margin={{ top: 4, right: 16, left: 4, bottom: 0 }}>
                <CartesianGrid horizontal={false} stroke={CHART.borde} />
                <XAxis type="number" tick={{ fill: CHART.ceniza, fontSize: 12 }} axisLine={{ stroke: CHART.borde }} tickLine={false} allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: CHART.tinta, fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={100}
                  tickFormatter={(v) => (v.length > 14 ? `${v.slice(0, 14)}…` : v)}
                />
                <Tooltip {...tooltipStyle} formatter={(v) => [v, 'Unidades']} />
                <Bar dataKey="cantidad" fill={CHART.tinta} radius={[0, 6, 6, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-16 text-center text-sm text-ceniza">{data ? 'Aún no hay productos vendidos este mes.' : 'Cargando...'}</p>
          )}
        </section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* Últimas ventas */}
        <section className="rounded-2xl border border-borde bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-tinta">Últimas ventas</h2>
            <Link to="/ventas" className="text-xs font-bold text-esmeralda hover:underline">Ver todas →</Link>
          </div>
          {data?.ultimasVentas?.length ? (
            <div className="divide-y divide-borde">
              {data.ultimasVentas.map((v) => (
                <div key={v.id} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-tinta">
                      {v.customer_name || 'Cliente de mostrador'}
                    </p>
                    <p className="text-xs text-ceniza">{fecha(v.created_at)} · {v.items_count} ítems · {v.user_name}</p>
                  </div>
                  <StatusBadge status={v.status} />
                  <span className="w-24 text-right text-sm font-bold text-tinta">{COP(v.total)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-ceniza">Aún no hay ventas registradas.</p>
          )}
        </section>

        {/* Stock bajo */}
        <section className="rounded-2xl border border-borde bg-white p-6">
          <h2 className="mb-4 font-display text-lg font-bold text-tinta">Por reponer</h2>
          {data?.stockBajo?.length ? (
            <div className="flex flex-col gap-2.5">
              {data.stockBajo.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5">
                  <p className="truncate text-sm font-medium text-tinta">{p.name}</p>
                  <span className="shrink-0 text-xs font-bold text-amber-700">{p.stock} / mín {p.min_stock}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-ceniza">Todo el inventario está sano ✓</p>
          )}
        </section>
      </div>
    </div>
  )
}

export default Dashboard
