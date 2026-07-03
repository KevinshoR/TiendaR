import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp, CalendarDays, HandCoins, AlertTriangle, PlusCircle } from 'lucide-react'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'

const COP = (v) => `$${Number(v || 0).toLocaleString('es-CO')}`
const fecha = (iso) => new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

const STATUS = {
  pagada: 'bg-esmeralda/15 text-esmeralda',
  pendiente: 'bg-amber-100 text-amber-700',
  anulada: 'bg-red-100 text-red-600',
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
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold capitalize ${STATUS[v.status]}`}>{v.status}</span>
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
