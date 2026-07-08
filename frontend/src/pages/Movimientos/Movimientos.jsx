import { useEffect, useMemo, useState } from 'react'
import { Search, ArrowDownCircle, ArrowUpCircle, RefreshCw, Package, TrendingUp, TrendingDown, Eye, X, Calendar, User } from 'lucide-react'
import api from '../../services/api'
import { useToast } from '../../components/Toast'
import RowActions from '../../components/RowActions'
import Pagination from '../../components/Pagination'

/* ═══════════════════════════════════════════════════════════
   MOVIMIENTOS DE INVENTARIO — historial completo.
   Cada entrada (compra), salida (venta) o ajuste queda
   registrado. Es solo lectura — la data se genera sola desde
   Compras y Ventas.
═══════════════════════════════════════════════════════════ */

const COP = (v) => `$${Number(v || 0).toLocaleString('es-CO')}`

const fecha = (iso) =>
  new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

const PAGE_SIZE = 5

/* Estilo por tipo de movimiento (igual patrón de badges que Ventas) */
function BadgeTipo({ tipo }) {
  const configs = {
    entrada:  { label: 'Entrada', bg: 'bg-esmeralda/12', text: 'text-esmeralda', icon: ArrowDownCircle },
    venta:    { label: 'Venta',   bg: 'bg-tinta/10',     text: 'text-tinta',     icon: ArrowUpCircle },
    salida:   { label: 'Salida',  bg: 'bg-red-100',      text: 'text-red-700',   icon: ArrowUpCircle },
    ajuste:   { label: 'Ajuste',  bg: 'bg-amber-100',    text: 'text-amber-700', icon: RefreshCw },
  }
  const c = configs[tipo] || configs.ajuste
  const Icon = c.icon
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full ${c.bg} ${c.text} px-2.5 py-0.5 text-[11px] font-bold`}>
      <Icon size={11} /> {c.label}
    </span>
  )
}

/* La cantidad se muestra con signo según sea entrada/salida */
function CantidadMovimiento({ tipo, quantity }) {
  const esSuma = tipo === 'entrada' || (tipo === 'ajuste' && quantity > 0)
  const color = esSuma ? 'text-esmeralda' : 'text-red-600'
  const signo = esSuma ? '+' : '-'
  return (
    <span className={`font-mono font-bold ${color}`}>
      {signo}{Math.abs(quantity)}
    </span>
  )
}

export default function Movimientos() {
  const toast = useToast()
  const [movimientos, setMovimientos] = useState([])
  const [detalle, setDetalle] = useState(null)
  const [buscar, setBuscar] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState('todos')
  const [rango, setRango] = useState({ from: '', to: '' })
  const [page, setPage] = useState(1)

  useEffect(() => {
    api.get('/inventory-movements')
      .then(({ data }) => setMovimientos(data))
      .catch(() => toast.error('Error cargando movimientos'))
  }, [])

  const stats = useMemo(() => {
    const ahora = new Date()
    const inicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1)
    const delMes = movimientos.filter((m) => new Date(m.created_at) >= inicio)
    const entradas = delMes.filter((m) => m.type === 'entrada').reduce((n, m) => n + m.quantity, 0)
    const salidas = delMes.filter((m) => m.type === 'venta' || m.type === 'salida').reduce((n, m) => n + m.quantity, 0)
    return { entradas, salidas, total: movimientos.length }
  }, [movimientos])

  const filtrados = useMemo(() => {
    let arr = [...movimientos]
    const q = buscar.trim().toLowerCase()
    if (q) arr = arr.filter((m) =>
      (m.product_name || '').toLowerCase().includes(q) ||
      (m.reason || '').toLowerCase().includes(q)
    )
    if (tipoFiltro !== 'todos') arr = arr.filter((m) => m.type === tipoFiltro)
    if (rango.from) arr = arr.filter((m) => new Date(m.created_at) >= new Date(rango.from))
    if (rango.to) {
      const hasta = new Date(rango.to); hasta.setHours(23, 59, 59)
      arr = arr.filter((m) => new Date(m.created_at) <= hasta)
    }
    return arr
  }, [movimientos, buscar, tipoFiltro, rango])

  useEffect(() => { setPage(1) }, [buscar, tipoFiltro, rango])
  const totalPages = Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE))
  const visibles = filtrados.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-tinta">Movimientos de inventario</h1>
      <p className="mt-1 mb-6 text-sm text-ceniza">
        Historial de todo lo que entra y sale del inventario. Se genera automáticamente desde compras y ventas.
      </p>

      {/* KPIs */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-borde bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-ceniza">Entradas del mes</p>
            <span className="rounded-lg bg-esmeralda/10 p-2 text-esmeralda"><TrendingUp size={15} /></span>
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-tinta">
            <span className="text-esmeralda">+</span>{Math.abs(stats.entradas)}
          </p>
          <p className="text-xs text-ceniza">unidades ingresadas</p>
        </div>
        <div className="rounded-2xl border border-borde bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-ceniza">Salidas del mes</p>
            <span className="rounded-lg bg-red-100 p-2 text-red-600"><TrendingDown size={15} /></span>
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-tinta">
            <span className="text-red-600">-</span>{Math.abs(stats.salidas)}
          </p>
          <p className="text-xs text-ceniza">unidades vendidas/salidas</p>
        </div>
        <div className="rounded-2xl border border-borde bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-ceniza">Total registrado</p>
            <span className="rounded-lg bg-tinta/5 p-2 text-tinta"><Package size={15} /></span>
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-tinta">{stats.total}</p>
          <p className="text-xs text-ceniza">movimientos históricos</p>
        </div>
      </div>

      {/* Controles */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ceniza" />
          <input
            value={buscar}
            onChange={(e) => setBuscar(e.target.value)}
            placeholder="Buscar producto o razón..."
            className="w-full rounded-xl border border-borde bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-esmeralda"
          />
        </div>

        <div className="flex gap-1 rounded-xl border border-borde bg-white p-1">
          {[
            ['todos', 'Todos'],
            ['entrada', 'Entradas'],
            ['venta', 'Ventas'],
            ['salida', 'Salidas'],
            ['ajuste', 'Ajustes'],
          ].map(([k, label]) => (
            <button
              key={k}
              onClick={() => setTipoFiltro(k)}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                tipoFiltro === k ? 'bg-tinta text-white' : 'text-ceniza hover:text-tinta'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date" value={rango.from} onChange={(e) => setRango({ ...rango, from: e.target.value })}
            className="rounded-xl border border-borde bg-white px-3 py-2 text-sm outline-none focus:border-esmeralda"
          />
          <span className="text-xs text-ceniza">a</span>
          <input
            type="date" value={rango.to} onChange={(e) => setRango({ ...rango, to: e.target.value })}
            className="rounded-xl border border-borde bg-white px-3 py-2 text-sm outline-none focus:border-esmeralda"
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto overflow-y-hidden rounded-2xl border border-borde bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-borde text-left text-xs uppercase tracking-wide text-ceniza">
              <th className="px-5 py-3.5">Producto</th>
              <th className="px-5 py-3.5">Tipo</th>
              <th className="px-5 py-3.5">Razón</th>
              <th className="px-5 py-3.5">Usuario</th>
              <th className="px-5 py-3.5 text-right">Cantidad</th>
              <th className="px-5 py-3.5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-borde">
            {visibles.map((m) => (
              <tr key={m.id} className="hover:bg-humo/60">
                <td className="px-5 py-3">
                  <p className="break-words font-medium text-tinta">{m.product_name || 'Producto eliminado'}</p>
                  <p className="text-xs text-ceniza">{fecha(m.created_at)}</p>
                </td>
                <td className="px-5 py-3"><BadgeTipo tipo={m.type} /></td>
                <td className="px-5 py-3 text-sm text-ceniza">{m.reason || '—'}</td>
                <td className="px-5 py-3 text-sm text-ceniza">{m.user_name || '—'}</td>
                <td className="px-5 py-3 text-right text-lg">
                  <CantidadMovimiento tipo={m.type} quantity={m.quantity} />
                </td>
                <td className="ps-5 py-3">
                  <RowActions onVer={() => setDetalle(m)} />
                </td>
              </tr>
            ))}
            {visibles.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-ceniza">
                  {movimientos.length === 0
                    ? 'Aún no hay movimientos. Se registran solos cuando haces compras o ventas.'
                    : 'Sin resultados con esos filtros.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      {detalle && <ModalDetalleMovimiento movimiento={detalle} onClose={() => setDetalle(null)} />}
    </div>
  )
}
function ModalDetalleMovimiento({ movimiento, onClose }) {
  const esSuma = movimiento.type === 'entrada' || (movimiento.type === 'ajuste' && movimiento.quantity > 0)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white">
        <div className="flex items-center justify-between border-b border-borde bg-tinta px-7 py-5 text-white">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-esmeralda">Detalle del movimiento</p>
            <h2 className="mt-0.5 font-display text-lg font-bold">{movimiento.product_name || 'Producto eliminado'}</h2>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white"><X size={22} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-7">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-borde bg-humo/40 p-3">
              <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-ceniza">
                <Calendar size={11} /> Fecha
              </div>
              <p className="text-sm font-semibold text-tinta">{fecha(movimiento.created_at)}</p>
            </div>
            <div className="rounded-xl border border-borde bg-humo/40 p-3">
              <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-ceniza">
                <User size={11} /> Registrado por
              </div>
              <p className="text-sm font-semibold text-tinta">{movimiento.user_name || '—'}</p>
            </div>
            <div className="rounded-xl border border-borde bg-humo/40 p-3">
              <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-ceniza">
                <Package size={11} /> Tipo
              </div>
              <div className="mt-0.5"><BadgeTipo tipo={movimiento.type} /></div>
            </div>
            <div className="rounded-xl border border-borde bg-humo/40 p-3">
              <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-ceniza">
                Razón
              </div>
              <p className="text-sm font-semibold text-tinta capitalize">{movimiento.reason || '—'}</p>
            </div>
          </div>

          {movimiento.reason === 'compra' && movimiento.purchase_total && (
            <>
              <p className="mt-6 mb-2 text-xs font-bold uppercase tracking-wide text-ceniza">Origen</p>
              <div className="rounded-xl border border-borde bg-humo/40 p-4">
                <p className="font-semibold text-tinta">Vino de una compra</p>
                <p className="text-xs text-ceniza">{movimiento.purchase_supplier || 'Sin proveedor'}</p>
                <p className="text-xs text-ceniza">Compra por {COP(movimiento.purchase_total)}</p>
              </div>
            </>
          )}

          {movimiento.type === 'venta' && movimiento.sale_total && (
            <>
              <p className="mt-6 mb-2 text-xs font-bold uppercase tracking-wide text-ceniza">Origen</p>
              <div className="rounded-xl border border-borde bg-humo/40 p-4">
                <p className="font-semibold text-tinta">Vendido a</p>
                <p className="text-xs text-ceniza">{movimiento.sale_customer_name || movimiento.sale_customer_libre || 'Cliente ocasional'}</p>
                <p className="text-xs text-ceniza">
                  Venta por {COP(movimiento.sale_total)} ({movimiento.sale_type === 'credito' ? 'crédito' : 'contado'})
                </p>
              </div>
            </>
          )}

          {movimiento.reason === 'anulación de venta' && movimiento.sale_total && (
            <>
              <p className="mt-6 mb-2 text-xs font-bold uppercase tracking-wide text-ceniza">Origen</p>
              <div className="rounded-xl border border-borde bg-humo/40 p-4">
                <p className="font-semibold text-tinta">Devuelto por anulación</p>
                <p className="text-xs text-ceniza">{movimiento.sale_customer_name || movimiento.sale_customer_libre || 'Cliente ocasional'}</p>
                <p className="text-xs text-ceniza">Venta anulada por {COP(movimiento.sale_total)}</p>
              </div>
            </>
          )}

          <div className="mt-5 rounded-xl bg-humo p-5">
            <div className="flex items-baseline justify-between">
              <span className="font-display text-sm font-semibold text-tinta">CANTIDAD</span>
              <span className={`font-display text-2xl font-bold ${esSuma ? 'text-esmeralda' : 'text-red-600'}`}>
                {esSuma ? '+' : '-'}{Math.abs(movimiento.quantity)} und
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}