import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PlusCircle, Ban } from 'lucide-react'
import api from '../../services/api'
import { useToast } from '../../components/Toast'
import { useAuth } from '../../context/AuthContext'
import SortSelect from '../../components/SortSelect'

const COP = (v) => `$${Number(v || 0).toLocaleString('es-CO')}`
const fecha = (iso) => new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

const STATUS = {
  pagada: 'bg-esmeralda/15 text-esmeralda',
  pendiente: 'bg-amber-100 text-amber-700',
  anulada: 'bg-red-100 text-red-600',
}

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

  const input = 'rounded-xl border border-borde bg-white px-3 py-2 text-sm outline-none focus:border-esmeralda'

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-bold text-tinta">Ventas</h1>
        {user?.role !== 'contador' && (
          <Link to="/ventas/nueva" className="inline-flex items-center gap-2 rounded-xl bg-esmeralda px-5 py-2.5 text-sm font-black text-tinta hover:brightness-110">
            <PlusCircle size={15} /> Nueva venta
          </Link>
        )}
      </div>

      {/* Filtros */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
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

      <div className="overflow-x-auto rounded-2xl border border-borde bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-borde text-left text-xs uppercase tracking-wide text-ceniza">
              <th className="px-5 py-3.5">Fecha</th>
              <th className="px-5 py-3.5">Cliente</th>
              <th className="px-5 py-3.5">Tipo</th>
              <th className="px-5 py-3.5">Estado</th>
              <th className="px-5 py-3.5 text-right">Total</th>
              {user?.role === 'owner' && <th className="px-5 py-3.5 text-right">Acciones</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-borde">
            {ventasOrdenadas.map((v) => (
              <tr key={v.id} className="hover:bg-humo/60">
                <td className="px-5 py-3 text-ceniza">{fecha(v.created_at)}</td>
                <td className="px-5 py-3 font-medium text-tinta">{v.customer_name || 'Mostrador'}</td>
                <td className="px-5 py-3 capitalize text-ceniza">{v.type}{v.type === 'credito' && v.due_date ? ` · vence ${new Date(v.due_date).toLocaleDateString('es-CO')}` : ''}</td>
                <td className="px-5 py-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold capitalize ${STATUS[v.status]}`}>{v.status}</span>
                </td>
                <td className="px-5 py-3 text-right font-bold text-tinta">{COP(v.total)}</td>
                {user?.role === 'owner' && (
                  <td className="px-5 py-3 text-right">
                    {v.status !== 'anulada' && (
                      <button onClick={() => anular(v)} className="rounded-lg p-2 text-ceniza hover:bg-red-50 hover:text-red-600" title="Anular venta">
                        <Ban size={15} />
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
            {ventasOrdenadas.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-ceniza">No hay ventas con esos filtros.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Ventas
