import { useEffect, useMemo, useState } from 'react'
import { Plus, Search, Pencil, Trash2, X, Link2, Upload, ImageOff } from 'lucide-react'
import api from '../../services/api'
import { useToast } from '../../components/Toast'
import { useAuth } from '../../context/AuthContext'
import SortSelect from '../../components/SortSelect'

const COP = (v) => `$${Number(v || 0).toLocaleString('es-CO')}`
const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '')
const imagenUrl = (url) => (url?.startsWith('http') ? url : `${API_ORIGIN}${url}`)

const ORDEN_OPCIONES = [
  { value: 'recent', label: 'Más reciente' },
  { value: 'price_desc', label: 'Precio: mayor a menor' },
  { value: 'price_asc', label: 'Precio: menor a mayor' },
  { value: 'stock_desc', label: 'Stock: mayor a menor' },
  { value: 'stock_asc', label: 'Stock: menor a mayor' },
]

const VACIO = {
  name: '',
  sku: '',
  price: '',
  cost: '',
  stock: 0,
  min_stock: 0,
  apply_iva: true,
  iva_rate: '',
  image_url: '',
  show_in_catalog: true,
}

function Inventario() {
  const toast = useToast()
  const { store } = useAuth()
  const [productos, setProductos] = useState([])
  const [search, setSearch] = useState('')
  const [orden, setOrden] = useState('recent')
  const [modal, setModal] = useState(null) // null | {..form}
  const [modoImagen, setModoImagen] = useState('link') // 'link' | 'archivo'
  const [subiendo, setSubiendo] = useState(false)
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

  const productosOrdenados = useMemo(() => {
    const arr = [...productos]
    switch (orden) {
      case 'price_desc': return arr.sort((a, b) => Number(b.price) - Number(a.price))
      case 'price_asc': return arr.sort((a, b) => Number(a.price) - Number(b.price))
      case 'stock_desc': return arr.sort((a, b) => Number(b.stock) - Number(a.stock))
      case 'stock_asc': return arr.sort((a, b) => Number(a.stock) - Number(b.stock))
      default: return arr.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    }
  }, [productos, orden])

  function abrirModal(p) {
    setModal(p ? { ...p, iva_rate: p.iva_rate ?? '' } : { ...VACIO })
    setModoImagen('link')
  }

  async function guardar(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        ...modal,
        price: Number(modal.price),
        cost: Number(modal.cost || 0),
        stock: Number(modal.stock),
        min_stock: Number(modal.min_stock),
        iva_rate: modal.iva_rate === '' || modal.iva_rate === null || modal.iva_rate === undefined ? null : Number(modal.iva_rate),
        image_url: modal.image_url || null,
      }
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

  async function subirArchivo(e) {
    const file = e.target.files[0]
    if (!file) return
    setSubiendo(true)
    try {
      const formData = new FormData()
      formData.append('image', file)
      const { data } = await api.post('/products/upload', formData)
      setModal((m) => ({ ...m, image_url: data.url }))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error subiendo la imagen')
    } finally {
      setSubiendo(false)
      e.target.value = ''
    }
  }

  const input = 'w-full rounded-xl border border-borde bg-humo px-4 py-2.5 text-sm outline-none focus:border-esmeralda'
  const seccion = 'mb-4 text-xs font-bold uppercase tracking-wide text-ceniza'

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-bold text-tinta">Inventario</h1>
        <button
          onClick={() => abrirModal(null)}
          className="inline-flex items-center gap-2 rounded-xl bg-tinta px-5 py-2.5 text-sm font-bold text-white transition-all hover:opacity-90"
        >
          <Plus size={15} /> Nuevo producto
        </button>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ceniza" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o código..."
            className="w-full rounded-xl border border-borde bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-esmeralda"
          />
        </div>
        <SortSelect value={orden} onChange={setOrden} options={ORDEN_OPCIONES} />
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
            {productosOrdenados.map((p) => {
              const bajo = p.stock <= p.min_stock
              return (
                <tr key={p.id} className="hover:bg-humo/60">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {p.image_url ? (
                        <img
                          src={imagenUrl(p.image_url)}
                          alt={p.name}
                          className="h-9 w-9 shrink-0 rounded-lg border border-borde object-cover"
                        />
                      ) : (
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-borde text-xs font-bold text-ceniza">
                          {p.name?.charAt(0).toUpperCase()}
                        </span>
                      )}
                      <span className="font-medium text-tinta">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-ceniza">{p.sku || '—'}</td>
                  <td className="px-5 py-3 text-right font-semibold text-tinta">{COP(p.price)}</td>
                  <td className="px-5 py-3 text-center">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${bajo ? 'bg-amber-100 text-amber-700' : 'bg-esmeralda/10 text-esmeralda'}`}>
                      {p.stock}{bajo && ' ⚠'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => abrirModal(p)} className="mr-1 rounded-lg p-2 text-ceniza hover:bg-humo hover:text-tinta" title="Editar">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => eliminar(p)} className="rounded-lg p-2 text-ceniza hover:bg-red-50 hover:text-red-600" title="Eliminar">
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              )
            })}
            {productosOrdenados.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-ceniza">No hay productos. Crea el primero.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal crear/editar */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <form onSubmit={guardar} className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white">
            <div className="flex shrink-0 items-center justify-between border-b border-borde px-6 py-4">
              <h2 className="font-display text-lg font-bold text-tinta">{modal.id ? 'Editar producto' : 'Nuevo producto'}</h2>
              <button type="button" onClick={() => setModal(null)} className="rounded-lg p-1.5 text-ceniza hover:bg-humo hover:text-tinta">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              {/* Información básica */}
              <div className="mb-6">
                <p className={seccion}>Información básica</p>
                <div className="flex flex-col gap-3.5">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-ceniza">NOMBRE *</label>
                    <input required className={input} value={modal.name} onChange={(e) => setModal({ ...modal, name: e.target.value })} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-ceniza">CÓDIGO / SKU</label>
                    <input className={input} value={modal.sku || ''} onChange={(e) => setModal({ ...modal, sku: e.target.value })} />
                  </div>
                </div>
              </div>

              {/* Precio e inventario */}
              <div className="mb-6">
                <p className={seccion}>Precio e inventario</p>
                <div className="flex flex-col gap-3.5">
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
                </div>
              </div>

              {/* Imagen */}
              <div className="mb-6">
                <p className={seccion}>Imagen</p>
                <div className="flex items-start gap-4">
                  {modal.image_url ? (
                    <img src={imagenUrl(modal.image_url)} alt="Vista previa" className="h-16 w-16 shrink-0 rounded-xl border border-borde object-cover" />
                  ) : (
                    <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-dashed border-borde text-ceniza">
                      <ImageOff size={20} />
                    </span>
                  )}
                  <div className="flex-1">
                    <div className="mb-2 inline-flex rounded-lg border border-borde bg-humo p-1 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setModoImagen('link')}
                        className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-colors ${modoImagen === 'link' ? 'bg-white text-tinta shadow-sm' : 'text-ceniza'}`}
                      >
                        <Link2 size={13} /> Pegar enlace
                      </button>
                      <button
                        type="button"
                        onClick={() => setModoImagen('archivo')}
                        className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-colors ${modoImagen === 'archivo' ? 'bg-white text-tinta shadow-sm' : 'text-ceniza'}`}
                      >
                        <Upload size={13} /> Subir del dispositivo
                      </button>
                    </div>

                    {modoImagen === 'link' ? (
                      <input
                        className={input}
                        placeholder="https://ejemplo.com/imagen.jpg"
                        value={modal.image_url || ''}
                        onChange={(e) => setModal({ ...modal, image_url: e.target.value })}
                      />
                    ) : (
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        disabled={subiendo}
                        onChange={subirArchivo}
                        className="block w-full text-xs text-ceniza file:mr-3 file:rounded-lg file:border-0 file:bg-tinta file:px-3 file:py-2 file:text-xs file:font-bold file:text-white hover:file:opacity-90"
                      />
                    )}
                    {subiendo && <p className="mt-1.5 text-xs text-ceniza">Subiendo imagen...</p>}
                    {modal.image_url && (
                      <button
                        type="button"
                        onClick={() => setModal({ ...modal, image_url: '' })}
                        className="mt-2 text-xs font-bold text-red-600 hover:underline"
                      >
                        Quitar imagen
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Impuestos */}
              {store?.iva_enabled && (
                <div>
                  <p className={seccion}>Impuestos</p>
                  <label className="flex items-center gap-2.5 text-sm text-tinta">
                    <input type="checkbox" checked={modal.apply_iva} onChange={(e) => setModal({ ...modal, apply_iva: e.target.checked })} className="h-4 w-4 accent-esmeralda" />
                    Este producto lleva IVA
                  </label>
                  {modal.apply_iva && (
                    <div className="mt-3">
                      <label className="mb-1 block text-xs font-semibold text-ceniza">IVA DE ESTE PRODUCTO (%) — OPCIONAL</label>
                      <input
                        type="number"
                        min="0"
                        max="99"
                        step="0.5"
                        className={`${input} max-w-[10rem]`}
                        placeholder={`Por defecto: ${store.iva_rate}%`}
                        value={modal.iva_rate}
                        onChange={(e) => setModal({ ...modal, iva_rate: e.target.value })}
                      />
                      <p className="mt-1 text-xs text-ceniza">Déjalo vacío para usar la tarifa general de la tienda.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex shrink-0 gap-3 border-t border-borde px-6 py-4">
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
