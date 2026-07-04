import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Minus, Plus, Trash2, ShoppingCart } from 'lucide-react'
import api from '../../services/api'
import { useToast } from '../../components/Toast'
import { useAuth } from '../../context/AuthContext'

const COP = (v) => `$${Number(v || 0).toLocaleString('es-CO')}`

function NuevaVenta() {
  const toast = useToast()
  const navigate = useNavigate()
  const { store } = useAuth()

  const [productos, setProductos] = useState([])
  const [clientes, setClientes] = useState([])
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState([]) // {product, quantity}
  const [type, setType] = useState('contado')
  const [customerId, setCustomerId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get('/products').then(({ data }) => setProductos(data.filter((p) => p.active !== false)))
    api.get('/customers').then(({ data }) => setClientes(data)).catch(() => {})
  }, [])

  const filtrados = useMemo(() => {
    const q = search.toLowerCase()
    return productos.filter((p) => p.name.toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q))
  }, [productos, search])

  function enCarrito(id) {
    return cart.find((c) => c.product.id === id)
  }

  function agregar(p) {
    const item = enCarrito(p.id)
    const enUso = item?.quantity || 0
    if (enUso + 1 > p.stock) return toast.error(`Solo quedan ${p.stock} de ${p.name}`)
    if (item) {
      setCart(cart.map((c) => (c.product.id === p.id ? { ...c, quantity: c.quantity + 1 } : c)))
    } else {
      setCart([...cart, { product: p, quantity: 1 }])
    }
  }

  function cambiar(id, delta) {
    setCart(
      cart
        .map((c) => {
          if (c.product.id !== id) return c
          const q = c.quantity + delta
          if (q > c.product.stock) {
            toast.error(`Solo quedan ${c.product.stock} unidades`)
            return c
          }
          return { ...c, quantity: q }
        })
        .filter((c) => c.quantity > 0)
    )
  }

  /* IVA por ítem: solo si la tienda lo tiene activo y el producto lo aplica */
  const totales = useMemo(() => {
    let subtotal = 0
    let iva = 0
    for (const { product, quantity } of cart) {
      const base = Number(product.price) * quantity
      subtotal += base
      if (store?.iva_enabled && product.apply_iva) iva += base * (Number(store.iva_rate) / 100)
    }
    return { subtotal, iva, total: subtotal + iva }
  }, [cart, store])

  async function vender() {
    if (cart.length === 0) return toast.error('Agrega al menos un producto')
    if (type === 'credito' && (!customerId || !dueDate)) {
      return toast.error('Las ventas a crédito necesitan cliente y fecha de pago')
    }
    setLoading(true)
    try {
      await api.post('/sales', {
        type,
        customer_id: type === 'credito' ? Number(customerId) : customerId ? Number(customerId) : null,
        due_date: type === 'credito' ? dueDate : null,
        items: cart.map((c) => ({ product_id: c.product.id, quantity: c.quantity })),
      })
      toast.success('Venta registrada ✓')
      navigate('/ventas')
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Error registrando la venta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold text-tinta">Nueva venta</h1>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Productos */}
        <section>
          <div className="relative mb-4">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ceniza" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Busca un producto por nombre o código..."
              className="w-full rounded-xl border border-borde bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-esmeralda"
            />
          </div>
          <div className="grid max-h-[60vh] gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
            {filtrados.map((p) => {
              const agotado = p.stock <= 0
              return (
                <button
                  key={p.id}
                  disabled={agotado}
                  onClick={() => agregar(p)}
                  className={`rounded-xl border bg-white p-4 text-left transition-all ${
                    agotado ? 'cursor-not-allowed border-borde opacity-45' : 'border-borde hover:border-esmeralda hover:shadow-sm'
                  }`}
                >
                  <p className="truncate text-sm font-semibold text-tinta">{p.name}</p>
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="text-sm font-bold text-esmeralda">{COP(p.price)}</span>
                    <span className="text-xs text-ceniza">{agotado ? 'Agotado' : `Stock: ${p.stock}`}</span>
                  </div>
                </button>
              )
            })}
            {filtrados.length === 0 && <p className="col-span-full py-8 text-center text-sm text-ceniza">Sin resultados.</p>}
          </div>
        </section>

        {/* Carrito */}
        <section className="rounded-2xl border border-borde bg-white p-6 self-start">
          <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-tinta">
            <ShoppingCart size={18} /> Carrito
          </h2>

          {cart.length === 0 ? (
            <p className="py-6 text-center text-sm text-ceniza">Toca un producto para agregarlo.</p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {cart.map(({ product, quantity }) => (
                <div key={product.id} className="flex items-center gap-2 rounded-xl bg-humo px-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-tinta">{product.name}</p>
                    <p className="text-xs text-ceniza">{COP(product.price)} c/u</p>
                  </div>
                  <button onClick={() => cambiar(product.id, -1)} className="rounded-lg bg-white p-1.5 text-tinta hover:bg-borde"><Minus size={13} /></button>
                  <span className="w-6 text-center text-sm font-bold">{quantity}</span>
                  <button onClick={() => cambiar(product.id, 1)} className="rounded-lg bg-white p-1.5 text-tinta hover:bg-borde"><Plus size={13} /></button>
                  <button onClick={() => setCart(cart.filter((c) => c.product.id !== product.id))} className="ml-1 p-1 text-ceniza hover:text-red-600"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          )}

          {/* Tipo de venta */}
          <div className="mt-5 grid grid-cols-2 gap-2">
            {['contado', 'credito'].map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`rounded-xl border py-2.5 text-sm font-bold capitalize transition-colors ${
                  type === t ? 'border-tinta bg-tinta text-white' : 'border-borde text-ceniza hover:text-tinta'
                }`}
              >
                {t === 'credito' ? 'Crédito (fiado)' : 'Contado'}
              </button>
            ))}
          </div>

          {/* Cliente (obligatorio en crédito) */}
          <div className="mt-3 flex flex-col gap-3">
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full rounded-xl border border-borde bg-humo px-3 py-2.5 text-sm outline-none focus:border-esmeralda"
            >
              <option value="">{type === 'credito' ? 'Elige el cliente *' : 'Cliente (opcional)'}</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {type === 'credito' && (
              <div>
                <label className="mb-1 block text-xs font-semibold text-ceniza">FECHA LÍMITE DE PAGO *</label>
                <input
                  type="date"
                  value={dueDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full rounded-xl border border-borde bg-humo px-3 py-2.5 text-sm outline-none focus:border-esmeralda"
                />
              </div>
            )}
          </div>

          {/* Totales */}
          <div className="mt-5 border-t border-borde pt-4 text-sm">
            <div className="flex justify-between text-ceniza"><span>Subtotal</span><span>{COP(totales.subtotal)}</span></div>
            {store?.iva_enabled && (
              <div className="mt-1 flex justify-between text-ceniza"><span>IVA ({store.iva_rate}%)</span><span>{COP(totales.iva)}</span></div>
            )}
            <div className="mt-2 flex justify-between font-display text-lg font-bold text-tinta"><span>Total</span><span>{COP(totales.total)}</span></div>
          </div>

          <button
            onClick={vender}
            disabled={loading || cart.length === 0}
            className="mt-5 w-full rounded-xl bg-esmeralda py-3.5 text-sm font-black text-tinta transition-all hover:brightness-110 disabled:opacity-40"
          >
            {loading ? 'Registrando...' : `Registrar venta · ${COP(totales.total)}`}
          </button>
        </section>
      </div>
    </div>
  )
}

export default NuevaVenta
