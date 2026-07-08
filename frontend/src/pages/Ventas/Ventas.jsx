import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PlusCircle, Ban, CheckCircle2, Search, Calendar, CreditCard, User, Tag } from 'lucide-react'
import api from '../../services/api'
import { useToast } from '../../components/Toast'
import { useAuth } from '../../context/AuthContext'
import SortSelect from '../../components/SortSelect'
import StatusBadge from '../../components/StatusBadge'
import Pagination from '../../components/Pagination'
import RowActions from '../../components/RowActions'
import DetailModal, { InfoCard } from '../../components/DetailModal'

const PAGE_SIZE = 5

const COP = (v) => `$${Number(v || 0).toLocaleString('es-CO')}`
const fecha = (iso) => new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

const PAGO_LABEL = { efectivo: 'Efectivo', transferencia: 'Transferencia' }

const ORDEN_OPCIONES = [
  { value: 'recent', label: 'Más reciente' },
  { value: 'oldest', label: 'Más antigua' },
  { value: 'total_desc', label: 'Total: mayor a menor' },
  { value: 'total_asc', label: 'Total: menor a mayor' },
]

function Ventas() {
  const toast = useToast()
  const { user } = useAuth()
  const [ventas, setVentas] = useState([])
  const [filtros, setFiltros] = useState({ status: '', from: '', to: '' })
  const [orden, setOrden] = useState('recent')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [detalle, setDetalle] = useState(null)

  async function cargar() {
    const params = Object.fromEntries(Object.entries(filtros).filter(([, v]) => v))
    const { data } = await api.get('/sales', { params })
    setVentas(data)
  }

  useEffect(() => { cargar().catch(() => toast.error('Error cargando ventas')) }, [filtros])

  const ventasOrdenadas = useMemo(() => {
    const arr = [...ventas]
    switch (orden) {
      case 'oldest': return arr.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      case 'total_desc': return arr.sort((a, b) => Number(b.total) - Number(a.total))
      case 'total_asc': return arr.sort((a, b) => Number(a.total) - Number(b.total))
      default: return arr.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    }
  }, [ventas, orden])

  const ventasFiltradas = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return ventasOrdenadas
    return ventasOrdenadas.filter((v) => (v.customer_name || 'Mostrador').toLowerCase().includes(q))
  }, [ventasOrdenadas, search])

  useEffect(() => { setPage(1) }, [search, filtros])

  const totalPaginas = Math.max(1, Math.ceil(ventasFiltradas.length / PAGE_SIZE))
  const ventasPaginadas = ventasFiltradas.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  async function anular(v) {
    if (!confirm(`¿Anular la venta #${v.id} por ${COP(v.total)}? El stock se devuelve al inventario.`)) return
    try {
      await api.patch(`/sales/${v.id}/cancel`)
      toast.success('Venta anulada y stock devuelto')
      cargar()
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Error anulando')
    }
  }

  async function marcarPagada(v) {
    if (!confirm(`¿Marcar la venta #${v.id} como pagada por ${COP(v.total)}?`)) return
    try {
      await api.patch(`/sales/${v.id}/pay`)
      toast.success('Venta marcada como pagada')
      cargar()
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Error marcando como pagada')
    }
  }

  const input = 'rounded-xl border border-borde bg-white px-3 py-2 text-sm outline-none focus:border-esmeralda'

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-tinta">Ventas</h1>
      </div>

      {/* Controles */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative max-w-sm flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ceniza" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por cliente..."
              className="w-full rounded-xl border border-borde bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-esmeralda"
            />
          </div>
          <select value={filtros.status} onChange={(e) => setFiltros({ ...filtros, status: e.target.value })} className={input}>
            <option value="">Todos los estados</option>
            <option value="pagada">Pagadas</option>
            <option value="pendiente">Pendientes (fiado)</option>
            <option value="anulada">Anuladas</option>
          </select>
          <input type="date" value={filtros.from} onChange={(e) => setFiltros({ ...filtros, from: e.target.value })} className={input} />
          <span className="text-sm text-ceniza">a</span>
          <input type="date" value={filtros.to} onChange={(e) => setFiltros({ ...filtros, to: e.target.value })} className={input} />
          <SortSelect value={orden} onChange={setOrden} options={ORDEN_OPCIONES} />
        </div>
        {user?.role !== 'contador' && (
          <Link to="/ventas/nueva" className="inline-flex items-center gap-2 rounded-xl bg-esmeralda px-5 py-2.5 text-sm font-black text-tinta hover:brightness-110">
            <PlusCircle size={15} /> Nueva venta
          </Link>
        )}
      </div>

      <div className="overflow-x-auto overflow-y-hidden rounded-2xl border border-borde bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-borde text-left text-xs uppercase tracking-wide text-ceniza">
              <th className="px-5 py-3.5">Cliente</th>
              <th className="px-5 py-3.5">Tipo</th>
              <th className="px-5 py-3.5">Estado</th>
              <th className="px-5 py-3.5 text-right">Total</th>
              <th className="px-5 py-3.5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-borde">
            {ventasPaginadas.map((v) => (
              <tr key={v.id} className="hover:bg-humo/60">
                <td className="px-5 py-3">
                  <p className="break-words font-medium text-tinta">{v.customer_name || 'Mostrador'}</p>
                  <p className="text-xs text-ceniza">{fecha(v.created_at)}</p>
                </td>
                <td className="px-5 py-3 capitalize text-ceniza">{v.type}{v.type === 'credito' && v.due_date ? ` · vence ${new Date(v.due_date).toLocaleDateString('es-CO')}` : ''}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-1.5">
                    <StatusBadge status={v.status} />
                    {user?.role === 'owner' && v.status !== 'anulada' && (
                      <>
                        {v.status === 'pendiente' && (
                          <button onClick={() => marcarPagada(v)} className="rounded-lg p-1.5 text-ceniza hover:bg-esmeralda/10 hover:text-esmeralda" title="Marcar como pagada">
                            <CheckCircle2 size={14} />
                          </button>
                        )}
                        <button onClick={() => anular(v)} className="rounded-lg p-1.5 text-ceniza hover:bg-red-50 hover:text-red-600" title="Anular venta">
                          <Ban size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
                <td className="px-5 py-3 text-right font-bold text-tinta">{COP(v.total)}</td>
                <td className="px-5 py-3 text-right">
                  <RowActions onVer={() => setDetalle(v)} />
                </td>
              </tr>
            ))}
            {ventasFiltradas.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-ceniza">No hay ventas con esos filtros.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={totalPaginas} onChange={setPage} />

      {/* Modal ver detalle */}
      {detalle && (
        <DetailModal kicker={`Detalle de venta #${detalle.id}`} title={detalle.customer_name || 'Mostrador'} onClose={() => setDetalle(null)}>
          <div className="grid gap-3 sm:grid-cols-3">
            <InfoCard icon={Calendar} label="Fecha" valor={fecha(detalle.created_at)} />
            <InfoCard icon={Tag} label="Tipo" valor={detalle.type === 'credito' ? 'Crédito' : 'Contado'} />
            <InfoCard icon={CheckCircle2} label="Estado" valor={<StatusBadge status={detalle.status} />} />
            <InfoCard icon={CreditCard} label="Método de pago" valor={PAGO_LABEL[detalle.payment_method] || detalle.payment_method || '—'} />
            <InfoCard icon={User} label="Atendido por" valor={detalle.attended_by_name || '—'} />
            {detalle.type === 'credito' && detalle.due_date && (
              <InfoCard icon={Calendar} label="Vencimiento" valor={new Date(detalle.due_date).toLocaleDateString('es-CO')} />
            )}
          </div>

          <p className="mt-6 mb-2 text-xs font-bold uppercase tracking-wide text-ceniza">Productos vendidos</p>
          <div className="overflow-hidden rounded-xl border border-borde">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-borde bg-humo text-left text-[11px] uppercase text-ceniza">
                  <th className="px-4 py-2.5">Producto</th>
                  <th className="px-4 py-2.5 text-right">Cant.</th>
                  <th className="px-4 py-2.5 text-right">Precio</th>
                  <th className="px-4 py-2.5 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borde">
                {(detalle.items || []).map((it, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-2.5 font-medium text-tinta">{it.product_name}</td>
                    <td className="px-4 py-2.5 text-right text-ceniza">{it.quantity}</td>
                    <td className="px-4 py-2.5 text-right text-ceniza">{COP(it.unit_price)}</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-tinta">{COP(it.line_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 rounded-xl bg-humo p-5">
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-ceniza">Subtotal</span>
                <span className="font-medium text-tinta">{COP(detalle.subtotal)}</span>
              </div>
              {Number(detalle.iva_total) > 0 && (
                <div className="flex justify-between">
                  <span className="text-ceniza">IVA</span>
                  <span className="font-medium text-tinta">{COP(detalle.iva_total)}</span>
                </div>
              )}
              <div className="mt-2 flex items-baseline justify-between border-t border-borde pt-3">
                <span className="font-display text-sm font-semibold text-tinta">TOTAL</span>
                <span className="font-display text-2xl font-bold text-tinta">{COP(detalle.total)}</span>
              </div>
            </div>
          </div>
        </DetailModal>
      )}
    </div>
  )
}

export default Ventas
