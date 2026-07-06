import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Minus, Plus, Trash2, ShoppingCart, ImageOff } from 'lucide-react'
import api from '../../services/api'
import { useToast } from '../../components/Toast'
import { useAuth } from '../../context/AuthContext'

const COP = (v) => `$${Number(v || 0).toLocaleString('es-CO')}`
const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '')
const imagenUrl = (url) => (url?.startsWith('http') ? url : `${API_ORIGIN}${url}`)

const METODOS_PAGO = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
]

function sanitizeCantidad(raw) {
  let v = raw.replace(/[^0-9]/g, '')
  if (v.length > 1) v = v.replace(/^0+/, '') || '0'
  return v
}

function CartRow({ item, onChange, onRemove }) {
  const { product, quantity } = item
  const [editValue, setEditValue] = useState(String(quantity))
  const [error, setError] = useState('')

  useEffect(() => {
    setEditValue(String(quantity))
    setError('')
  }, [quantity])

  function manejarCambio(e) {
    const digits = sanitizeCantidad(e.target.value)
    setEditValue(digits)

    if (digits === '') {
      setError('Ingresa una cantidad')
      return
    }
    const n = parseInt(digits, 10)
    if (n < 1) {
      setError('La cantidad mínima es 1')
      return
    }
    if (n > product.stock) {
      setError(`Máximo disponible: ${product.stock}`)
      return
    }
    setError('')
    onChange(n)
  }

  function manejarBlur() {
    if (editValue === '' || Number(editValue) < 1 || Number(editValue) > product.stock) {
      setEditValue(String(quantity))
      setError('')
    }
  }

  return (
    <div className="rounded-xl bg-humo px-3 py-2.5">
      <div className="flex items-center gap-2.5">
        {product.image_url ? (
          <img
            src={imagenUrl(product.image_url)}
            alt={product.name}
            className="h-9 w-9 shrink-0 rounded-lg border border-borde object-cover"
          />
        ) : (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-borde text-xs font-bold text-ceniza">
            {product.name?.charAt(0).toUpperCase()}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-tinta">{product.name}</p>
          <p className="text-xs text-ceniza">{COP(product.price)} c/u</p>
        </div>
        <button
          type="button"
          onClick={() => onChange(quantity - 1)}
          className="rounded-lg bg-white p-1.5 text-tinta transition-colors hover:bg-borde"
        >
          <Minus size={13} />
        </button>
        <input
          type="text"
          inputMode="numeric"
          value={editValue}
          onChange={manejarCambio}
          onBlur={manejarBlur}
          className={`w-11 rounded-lg border bg-white py-1.5 text-center text-sm font-bold text-tinta outline-none ${
            error ? 'border-red-400' : 'border-borde focus:border-esmeralda'
          }`}
        />
        <button
          type="button"
          onClick={() => onChange(quantity + 1)}
          disabled={quantity >= product.stock}
          className="rounded-lg bg-white p-1.5 text-tinta transition-colors hover:bg-borde disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus size={13} />
        </button>
        <button type="button" onClick={onRemove} className="ml-1 p-1 text-ceniza transition-colors hover:text-red-600">
          <Trash2 size={14} />
        </button>
      </div>
      {error && <p className="mt-1.5 pl-11 text-xs font-medium text-red-600">{error}</p>}
    </div>
  )
}

function NuevaVenta() {
  const toast = useToast()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [productos, setProductos] = useState([])
  const [clientes, setClientes] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState([]) // {product, quantity}
  const [type, setType] = useState('contado')
  const [customerId, setCustomerId] = useState('')
  const [customerNameLibre, setCustomerNameLibre] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('efectivo')
  const [attendedBy, setAttendedBy] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get('/products').then(({ data }) => setProductos(data.filter((p) => p.active !== false)))
    api.get('/customers').then(({ data }) => setClientes(data)).catch(() => {})
    api.get('/users').then(({ data }) => setUsuarios(data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (user?.id) setAttendedBy(String(user.id))
  }, [user])

  const personalDisponible = useMemo(
    () => usuarios.filter((u) => u.active && (u.role === 'owner' || u.role === 'empleado')),
    [usuarios]
  )

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

  function cambiarCantidad(id, nuevaCantidad) {
    setCart(
      cart
        .map((c) => {
          if (c.product.id !== id) return c
          if (nuevaCantidad > c.product.stock) {
            toast.error(`Solo quedan ${c.product.stock} unidades`)
            return c
          }
          return { ...c, quantity: nuevaCantidad }
        })
        .filter((c) => c.quantity > 0)
    )
  }

  const totales = useMemo(() => {
    let subtotal = 0
    for (const { product, quantity } of cart) {
      subtotal += Number(product.price) * quantity
    }
    return { subtotal, total: subtotal }
  }, [cart])

  async function vender() {
    if (cart.length === 0) return toast.error('Agrega al menos un producto')
    if (type === 'credito' && (!customerId || !dueDate)) {
      return toast.error('Las ventas a crédito necesitan cliente y fecha de pago')
    }
    if (!paymentMethod) return toast.error('Elige el método de pago')
    if (!attendedBy) return toast.error('Indica quién atendió la venta')

    setLoading(true)
    try {
      await api.post('/sales', {
        type,
        customer_id: type === 'credito' ? Number(customerId) : customerId ? Number(customerId) : null,
        customer_name_libre: type === 'contado' && !customerId ? customerNameLibre.trim() || null : null,
        due_date: type === 'credito' ? dueDate : null,
        items: cart.map((c) => ({ product_id: c.product.id, quantity: c.quantity })),
        payment_method: paymentMethod,
        attended_by: Number(attendedBy),
      })
      toast.success('Venta registrada correctamente')
      navigate('/ventas')
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Error registrando la venta')
    } finally {
      setLoading(false)
    }
  }

  const selectCls = 'w-full rounded-xl border border-borde bg-humo px-3 py-2.5 text-sm outline-none focus:border-esmeralda'
  const seccion = 'mb-2 text-xs font-bold uppercase tracking-wide text-ceniza'

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold text-tinta">Nueva venta</h1>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
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
          <div className="grid max-h-[65vh] gap-2.5 overflow-y-auto pr-1 sm:grid-cols-2">
            {filtrados.map((p) => {
              const agotado = p.stock <= 0
              return (
                <button
                  key={p.id}
                  type="button"
                  disabled={agotado}
                  onClick={() => agregar(p)}
                  className={`flex items-center gap-3 rounded-xl border bg-white p-3 text-left transition-all ${
                    agotado ? 'cursor-not-allowed border-borde opacity-45' : 'border-borde hover:border-esmeralda hover:shadow-sm'
                  }`}
                >
                  {p.image_url ? (
                    <img
                      src={imagenUrl(p.image_url)}
                      alt={p.name}
                      className="h-12 w-12 shrink-0 rounded-lg border border-borde object-cover"
                    />
                  ) : (
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-borde text-sm font-bold text-ceniza">
                      {p.name?.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-tinta">{p.name}</p>
                    <p className="truncate font-mono text-xs text-ceniza">{p.sku || '—'}</p>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-sm font-bold text-esmeralda">{COP(p.price)}</span>
                      <span className="text-xs text-ceniza">{agotado ? 'Agotado' : `Stock: ${p.stock}`}</span>
                    </div>
                  </div>
                </button>
              )
            })}
            {filtrados.length === 0 && <p className="col-span-full py-8 text-center text-sm text-ceniza">Sin resultados.</p>}
          </div>
        </section>

        {/* Carrito */}
        <section className="self-start rounded-2xl border border-borde bg-white p-6">
          <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-tinta">
            <ShoppingCart size={18} /> Carrito
          </h2>

          {cart.length === 0 ? (
            <p className="flex items-center justify-center gap-2 rounded-xl bg-humo py-8 text-center text-sm text-ceniza">
              <ImageOff size={16} /> Toca un producto para agregarlo.
            </p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {cart.map((item) => (
                <CartRow
                  key={item.product.id}
                  item={item}
                  onChange={(n) => cambiarCantidad(item.product.id, n)}
                  onRemove={() => setCart(cart.filter((c) => c.product.id !== item.product.id))}
                />
              ))}
            </div>
          )}

          {/* Tipo de venta */}
          <div className="mt-6">
            <p className={seccion}>Tipo de venta</p>
            <div className="grid grid-cols-2 gap-2">
              {['contado', 'credito'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`rounded-xl border py-2.5 text-sm font-bold capitalize transition-colors ${
                    type === t ? 'border-tinta bg-tinta text-white' : 'border-borde text-ceniza hover:text-tinta'
                  }`}
                >
                  {t === 'credito' ? 'Crédito (fiado)' : 'Contado'}
                </button>
              ))}
            </div>
          </div>

          {/* Cliente (obligatorio en crédito) */}
          <div className="mt-4 flex flex-col gap-3">
            <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className={selectCls}>
              <option value="">{type === 'credito' ? 'Elige el cliente *' : 'Cliente (opcional)'}</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {type === 'contado' && (
              <input
                value={customerNameLibre}
                onChange={(e) => setCustomerNameLibre(e.target.value)}
                disabled={!!customerId}
                placeholder="Cliente ocasional (opcional, si no está registrado)"
                className="w-full rounded-xl border border-borde bg-humo px-3 py-2.5 text-sm outline-none focus:border-esmeralda disabled:opacity-50"
              />
            )}
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

          {/* Pago y atención */}
          <div className="mt-5">
            <p className={seccion}>Pago y atención</p>
            <div className="flex flex-col gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-ceniza">MÉTODO DE PAGO *</label>
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className={selectCls}>
                  {METODOS_PAGO.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-ceniza">QUIÉN ATENDIÓ *</label>
                <select value={attendedBy} onChange={(e) => setAttendedBy(e.target.value)} className={selectCls}>
                  {personalDisponible.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Totales */}
          <div className="mt-5 border-t border-borde pt-4 text-sm">
            <div className="flex justify-between text-ceniza"><span>Subtotal</span><span>{COP(totales.subtotal)}</span></div>
            <div className="mt-2 flex justify-between font-display text-lg font-bold text-tinta"><span>Total</span><span>{COP(totales.total)}</span></div>
          </div>

          <button
            onClick={vender}
            disabled={loading || cart.length === 0}
            className="mt-5 w-full rounded-xl bg-esmeralda py-3.5 text-sm font-black text-tinta transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? 'Registrando...' : `Registrar venta · ${COP(totales.total)}`}
          </button>
        </section>
      </div>
    </div>
  )
}

export default NuevaVenta
