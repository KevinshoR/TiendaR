import { useEffect, useState } from 'react'
import { Plus, Search, Pencil, Trash2 } from 'lucide-react'
import api from '../../services/api'
import { useToast } from '../../components/Toast'
import { useAuth } from '../../context/AuthContext'

const COP = (v) => `$${Number(v || 0).toLocaleString('es-CO')}`
const VACIO = { name: '', sku: '', price: '', cost: '', stock: 0, min_stock: 0, apply_iva: true, show_in_catalog: true }

function Inventario() {
  const toast = useToast()
  const { store } = useAuth()
  const [productos, setProductos] = useState([])
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null) // null | {..form}
  const [loading, setLoading] = useState(false)

  async function cargar(q = '') {
    const { data } = await api.get('/products', { params: q ? { search: q } : {} })
    setProductos(data)
  }

  useEffect(() => { cargar().catch(() => toast.error('Error cargando inventario')) }, [])

  useEffect(() => {
    const t = setTimeout(() => cargar(search).catch(() => {}), 350)
    return () => clearTimeout(t)
  }, [search])

  async function guardar(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = { ...modal, price: Number(modal.price), cost: Number(modal.cost || 0), stock: Number(modal.stock), min_stock: Number(modal.min_stock) }
      if (modal.id) {
        await api.put(`/products/${modal.id}`, payload)
        toast.success('Producto actualizado')
      } else {
        await api.post('/products', payload)
        toast.success('Producto creado')
      }
      setModal(null)
      cargar(search)
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Error guardando')
    } finally {
      setLoading(false)
    }
  }

  async function eliminar(p) {
    if (!confirm(`¿Eliminar "${p.name}" del inventario?`)) return
    try {
      await api.delete(`/products/${p.id}`)
      toast.success('Producto eliminado')
      cargar(search)
    } catch {
      toast.error('Error eliminando')
    }
  }

  const input = 'w-full rounded-xl border border-borde bg-humo px-4 py-2.5 text-sm outline-none focus:border-esmeralda'

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-bold text-tinta">Inventario</h1>
        <button
          onClick={() => setModal({ ...VACIO })}
          className="inline-flex items-center gap-2 rounded-xl bg-tinta px-5 py-2.5 text-sm font-bold text-white transition-all hover:opacity-90"
        >
          <Plus size={15} /> Nuevo producto
        </button>
      </div>

      <div className="relative mb-5 max-w-sm">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ceniza" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o código..."
          className="w-full rounded-xl border border-borde bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-esmeralda"
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-borde bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-borde text-left text-xs uppercase tracking-wide text-ceniza">
              <th className="px-5 py-3.5">Producto</th>
              <th className="px-5 py-3.5">Código</th>
              <th className="px-5 py-3.5 text-right">Precio</th>
              <th className="px-5 py-3.5 text-center">Stock</th>
              <th className="px-5 py-3.5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-borde">
            {productos.map((p) => {
              const bajo = p.stock <= p.min_stock
              return (
                <tr key={p.id} className="hover:bg-humo/60">
                  <td className="px-5 py-3 font-medium text-tinta">{p.name}</td>
                  <td className="px-5 py-3 font-mono text-xs text-ceniza">{p.sku || '—'}</td>
                  <td className="px-5 py-3 text-right font-semibold text-tinta">{COP(p.price)}</td>
                  <td className="px-5 py-3 text-center">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${bajo ? 'bg-amber-100 text-amber-700' : 'bg-esmeralda/10 text-esmeralda'}`}>
                      {p.stock}{bajo && ' ⚠'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => setModal({ ...p })} className="mr-1 rounded-lg p-2 text-ceniza hover:bg-humo hover:text-tinta" title="Editar">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => eliminar(p)} className="rounded-lg p-2 text-ceniza hover:bg-red-50 hover:text-red-600" title="Eliminar">
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              )
            })}
            {productos.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-ceniza">No hay productos. Crea el primero.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal crear/editar */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <form onSubmit={guardar} className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-7">
            <h2 className="mb-5 font-display text-lg font-bold text-tinta">{modal.id ? 'Editar producto' : 'Nuevo producto'}</h2>
            <div className="flex flex-col gap-3.5">
              <div>
                <label className="mb-1 block text-xs font-semibold text-ceniza">NOMBRE *</label>
                <input required className={input} value={modal.name} onChange={(e) => setModal({ ...modal, name: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-ceniza">CÓDIGO / SKU</label>
                <input className={input} value={modal.sku || ''} onChange={(e) => setModal({ ...modal, sku: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-ceniza">PRECIO DE VENTA *</label>
                  <input required type="number" min="0" className={input} value={modal.price} onChange={(e) => setModal({ ...modal, price: e.target.value })} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-ceniza">COSTO</label>
                  <input type="number" min="0" className={input} value={modal.cost || ''} onChange={(e) => setModal({ ...modal, cost: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-ceniza">STOCK</label>
                  <input type="number" className={input} value={modal.stock} onChange={(e) => setModal({ ...modal, stock: e.target.value })} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-ceniza">STOCK MÍNIMO</label>
                  <input type="number" min="0" className={input} value={modal.min_stock} onChange={(e) => setModal({ ...modal, min_stock: e.target.value })} />
                </div>
              </div>
              {store?.iva_enabled && (
                <label className="flex items-center gap-2.5 text-sm text-tinta">
                  <input type="checkbox" checked={modal.apply_iva} onChange={(e) => setModal({ ...modal, apply_iva: e.target.checked })} className="h-4 w-4 accent-esmeralda" />
                  Este producto lleva IVA ({store.iva_rate}%)
                </label>
              )}
            </div>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setModal(null)} className="flex-1 rounded-xl border border-borde py-2.5 text-sm font-bold text-ceniza hover:text-tinta">
                Cancelar
              </button>
              <button type="submit" disabled={loading} className="flex-1 rounded-xl bg-tinta py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50">
                {loading ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default Inventario
