import { useEffect, useMemo, useState } from 'react'
import { PlusCircle, Search, X, PackagePlus, Trash2, Receipt, Package, User, Calendar, Tag } from 'lucide-react'
import api from '../../services/api'
import { useToast } from '../../components/Toast'
import SortSelect from '../../components/SortSelect'
import Pagination from '../../components/Pagination'
import RowActions from '../../components/RowActions'

const COP = (v) => `$${Number(v || 0).toLocaleString('es-CO')}`
const fecha = (iso) =>
  new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
const fecha10 = (iso) => (iso || '').slice(0, 10)
const PAGE_SIZE = 5

const ORDEN_OPCIONES = [
  { value: 'recent', label: 'Más reciente' },
  { value: 'oldest', label: 'Más antigua' },
  { value: 'total_desc', label: 'Total: mayor a menor' },
  { value: 'total_asc', label: 'Total: menor a mayor' },
]

function validarNumero(valor, { entero = false, min = 0.01 } = {}) {
  const s = String(valor ?? '').trim()
  if (s === '') return 'Este campo es requerido'
  if (/^0\d/.test(s)) return 'No puede empezar con cero'
  const n = Number(s)
  if (isNaN(n)) return 'Debe ser un número'
  if (n < 0) return 'No se permiten negativos'
  if (n < min) return `Debe ser mayor o igual a ${min}`
  if (entero && !Number.isInteger(n)) return 'Debe ser un número entero'
  return null
}

function InputNum({ value, onChange, error, placeholder, className = '' }) {
  return (
    <div className={className}>
      <input
        type="number"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full rounded-xl border bg-humo px-3 py-2 text-sm outline-none transition-colors ${
          error ? 'border-red-500 focus:border-red-500' : 'border-borde focus:border-esmeralda'
        }`}
      />
      {error && <p className="mt-1 text-[11px] font-medium text-red-600">{error}</p>}
    </div>
  )
}

export default function Compras() {
  const toast = useToast()
  const [compras, setCompras] = useState([])
  const [buscar, setBuscar] = useState('')
  const [filtros, setFiltros] = useState({ from: '', to: '' })
  const [orden, setOrden] = useState('recent')
  const [page, setPage] = useState(1)
  const [detalle, setDetalle] = useState(null)
  const [modal, setModal] = useState(false)

  function cargar() {
    api.get('/purchases').then(({ data }) => setCompras(data)).catch(() => toast.error('Error cargando compras'))
  }
  useEffect(() => { cargar() }, [])

  const comprasOrdenadas = useMemo(() => {
    const arr = [...compras]
    switch (orden) {
      case 'oldest': return arr.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      case 'total_desc': return arr.sort((a, b) => Number(b.total) - Number(a.total))
      case 'total_asc': return arr.sort((a, b) => Number(a.total) - Number(b.total))
      default: return arr.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    }
  }, [compras, orden])

  const filtradas = useMemo(() => {
    const q = buscar.trim().toLowerCase()
    return comprasOrdenadas.filter((c) => {
      if (q && !(c.supplier || '').toLowerCase().includes(q)) return false
      if (filtros.from && fecha10(c.created_at) < filtros.from) return false
      if (filtros.to && fecha10(c.created_at) > filtros.to) return false
      return true
    })
  }, [comprasOrdenadas, buscar, filtros])

  useEffect(() => { setPage(1) }, [buscar, filtros])
  const totalPages = Math.max(1, Math.ceil(filtradas.length / PAGE_SIZE))
  const visibles = filtradas.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const input = 'rounded-xl border border-borde bg-white px-3 py-2 text-sm outline-none focus:border-esmeralda'

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-tinta">Compras</h1>
      <p className="mt-1 mb-6 text-sm text-ceniza">
        Registra la mercancía que compras al por mayor: suma el stock y actualiza el costo automáticamente.
      </p>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative max-w-sm flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ceniza" />
            <input
              value={buscar}
              onChange={(e) => setBuscar(e.target.value)}
              placeholder="Buscar por proveedor..."
              className="w-full rounded-xl border border-borde bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-esmeralda"
            />
          </div>
          <input type="date" value={filtros.from} onChange={(e) => setFiltros({ ...filtros, from: e.target.value })} className={input} />
          <span className="text-sm text-ceniza">a</span>
          <input type="date" value={filtros.to} onChange={(e) => setFiltros({ ...filtros, to: e.target.value })} className={input} />
          <SortSelect value={orden} onChange={setOrden} options={ORDEN_OPCIONES} />
        </div>
        <button
          onClick={() => setModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-esmeralda px-5 py-2.5 text-sm font-black text-tinta hover:brightness-110"
        >
          <PlusCircle size={15} /> Nueva compra
        </button>
      </div>

      <div className="overflow-x-auto overflow-y-hidden rounded-2xl border border-borde bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-borde text-left text-xs uppercase tracking-wide text-ceniza">
              <th className="px-5 py-3.5">Proveedor</th>
              <th className="px-5 py-3.5">Registro</th>
              <th className="px-5 py-3.5 text-right">Total</th>
              <th className="px-5 py-3.5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-borde">
            {visibles.map((c) => (
              <tr key={c.id} className="hover:bg-humo/60">
                <td className="px-5 py-3">
                  <p className="break-words font-medium text-tinta">{c.supplier || 'Sin proveedor'}</p>
                  <p className="text-xs text-ceniza">{fecha(c.created_at)}</p>
                </td>
                <td className="px-5 py-3">
                  <p className="text-sm text-tinta">{c.user_name || '—'}</p>
                  <p className="text-xs text-ceniza">{c.items_count} {c.items_count === 1 ? 'producto' : 'productos'}</p>
                </td>
                <td className="px-5 py-3 text-right font-bold text-tinta">{COP(c.total)}</td>
                <td className="px-5 py-3">
                  <RowActions onVer={() => setDetalle(c)} />
                </td>
              </tr>
            ))}
            {visibles.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-ceniza">
                  {compras.length === 0 ? 'Aún no has registrado compras.' : 'Sin resultados.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      {detalle && <ModalDetalleCompra compra={detalle} onClose={() => setDetalle(null)} />}
      {modal && <ModalNuevaCompra onClose={() => setModal(false)} onSaved={() => { setModal(false); cargar() }} />}
    </div>
  )
}

function InfoCard({ icon: Icon, label, valor }) {
  return (
    <div className="rounded-xl border border-borde bg-humo/40 p-3">
      <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-ceniza">
        <Icon size={11} /> {label}
      </div>
      <p className="text-sm font-semibold text-tinta">{valor}</p>
    </div>
  )
}

function ModalDetalleCompra({ compra, onClose }) {
  const hasDescuento = Number(compra.discount) > 0
  const hasIva = Number(compra.iva_total) > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white">
        <div className="flex items-center justify-between border-b border-borde bg-tinta px-7 py-5 text-white">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-esmeralda">Detalle de compra</p>
            <h2 className="mt-0.5 font-display text-lg font-bold">{compra.supplier || 'Sin proveedor'}</h2>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white">
            <X size={22} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-7">
          <div className="grid gap-3 sm:grid-cols-3">
            <InfoCard icon={Calendar} label="Fecha" valor={fecha(compra.created_at)} />
            <InfoCard icon={User} label="Registrada por" valor={compra.user_name || '—'} />
            <InfoCard icon={Package} label="Productos" valor={`${compra.items_count} ${compra.items_count === 1 ? 'ítem' : 'ítems'}`} />
          </div>

          <p className="mt-6 mb-2 text-xs font-bold uppercase tracking-wide text-ceniza">Productos comprados</p>
          <div className="overflow-hidden rounded-xl border border-borde">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-borde bg-humo text-left text-[11px] uppercase text-ceniza">
                  <th className="px-4 py-2.5">Producto</th>
                  <th className="px-4 py-2.5 text-center">Cant.</th>
                  <th className="px-4 py-2.5 text-right">Costo und.</th>
                  <th className="px-4 py-2.5 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borde">
                {(compra.items || []).map((it, i) => (
                  <tr key={i}>
                    <td className="px-4 py-2.5 font-medium text-tinta">{it.product_name}</td>
                    <td className="px-4 py-2.5 text-center text-ceniza">{it.quantity}</td>
                    <td className="px-4 py-2.5 text-right text-ceniza">{COP(it.unit_cost)}</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-tinta">{COP(it.quantity * it.unit_cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 rounded-xl bg-humo p-5">
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-ceniza">Subtotal</span>
                <span className="font-medium text-tinta">{COP(compra.subtotal)}</span>
              </div>
              {hasDescuento && (
                <div className="flex justify-between text-esmeralda">
                  <span className="flex items-center gap-1"><Tag size={13} /> Descuento aplicado</span>
                  <span className="font-medium">- {COP(compra.discount)}</span>
                </div>
              )}
              {hasIva && (
                <div className="flex justify-between">
                  <span className="text-ceniza">IVA ({compra.iva_rate}%)</span>
                  <span className="font-medium text-tinta">{COP(compra.iva_total)}</span>
                </div>
              )}
              <div className="mt-2 flex items-baseline justify-between border-t border-borde pt-3">
                <span className="font-display text-sm font-semibold text-tinta">TOTAL</span>
                <span className="font-display text-2xl font-bold text-tinta">{COP(compra.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ModalNuevaCompra({ onClose, onSaved }) {
  const toast = useToast()
  const [productos, setProductos] = useState([])
  const [buscarProd, setBuscarProd] = useState('')
  const [proveedor, setProveedor] = useState('')
  const [ivaRate, setIvaRate] = useState('')
  const [descuento, setDescuento] = useState('')
  const [lineas, setLineas] = useState([])
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    api.get('/products').then(({ data }) => setProductos(data.filter((p) => p.active !== false)))
  }, [])

  const sugerencias = useMemo(() => {
    const q = buscarProd.trim().toLowerCase()
    if (!q) return []
    return productos
      .filter((p) => !lineas.some((l) => l.product.id === p.id))
      .filter((p) => p.name.toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q))
      .slice(0, 5)
  }, [buscarProd, productos, lineas])

  function agregarLinea(p) {
    setLineas([...lineas, { product: p, quantity: '', unit_cost: p.cost > 0 ? String(p.cost) : '' }])
    setBuscarProd('')
  }

  function setLinea(idx, campo, valor) {
    setLineas(lineas.map((l, i) => (i === idx ? { ...l, [campo]: valor } : l)))
  }

  const errores = lineas.map((l) => ({
    quantity: validarNumero(l.quantity, { entero: true, min: 1 }),
    unit_cost: validarNumero(l.unit_cost, { min: 1 }),
  }))
  const errIva = ivaRate === '' ? null : validarNumero(ivaRate, { min: 0 })
  const errDesc = descuento === '' ? null : validarNumero(descuento, { min: 0 })

  const subtotal = lineas.reduce((n, l) => n + (Number(l.quantity) || 0) * (Number(l.unit_cost) || 0), 0)
  const descAplicado = descuento !== '' && !errDesc ? Math.min(Number(descuento), subtotal) : 0
  const baseIva = subtotal - descAplicado
  const iva = ivaRate !== '' && !errIva ? baseIva * (Number(ivaRate) / 100) : 0
  const total = baseIva + iva

  const excedeDescuento = descuento !== '' && !errDesc && Number(descuento) > subtotal
  const hayErrores =
    lineas.length === 0 ||
    (errIva !== null && ivaRate !== '') ||
    (errDesc !== null && descuento !== '') ||
    excedeDescuento ||
    errores.some((e) => e.quantity || e.unit_cost)

  async function guardar() {
    if (hayErrores) return toast.error('Revisa los campos marcados en rojo')
    setGuardando(true)
    try {
      await api.post('/purchases', {
        supplier: proveedor.trim() || null,
        iva_rate: ivaRate === '' ? null : Number(ivaRate),
        discount: descuento === '' ? null : Number(descuento),
        items: lineas.map((l) => ({
          product_id: l.product.id,
          quantity: Number(l.quantity),
          unit_cost: Number(l.unit_cost),
        })),
      })
      toast.success('Compra registrada: stock y costos actualizados')
      onSaved()
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Error registrando la compra')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="flex max-h-[95vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white">
        <div className="flex items-center justify-between border-b border-borde bg-tinta px-7 py-5 text-white">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-esmeralda">Nuevo registro</p>
            <h2 className="mt-0.5 flex items-center gap-2 font-display text-lg font-bold">
              <PackagePlus size={19} /> Registrar compra
            </h2>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white">
            <X size={22} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="border-b border-borde px-7 py-6">
            <p className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-ceniza">
              <Receipt size={13} /> Información de la compra
            </p>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ceniza">PROVEEDOR (opcional)</label>
              <input
                value={proveedor}
                onChange={(e) => setProveedor(e.target.value)}
                placeholder="Ej: Distribuidora El Hueco"
                className="w-full rounded-xl border border-borde bg-humo px-4 py-2.5 text-sm outline-none focus:border-esmeralda"
              />
            </div>
          </div>

          <div className="border-b border-borde px-7 py-6">
            <p className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-ceniza">
              <Package size={13} /> Productos
            </p>

            <div className="relative">
              <label className="mb-1 block text-xs font-semibold text-ceniza">AGREGAR PRODUCTO</label>
              <div className="relative">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ceniza" />
                <input
                  value={buscarProd}
                  onChange={(e) => setBuscarProd(e.target.value)}
                  placeholder="Busca por nombre o referencia..."
                  className="w-full rounded-xl border border-borde bg-humo py-2.5 pl-10 pr-4 text-sm outline-none focus:border-esmeralda"
                />
              </div>
              {sugerencias.length > 0 && (
                <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-borde bg-white shadow-lg">
                  {sugerencias.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => agregarLinea(p)}
                      className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-humo"
                    >
                      <div>
                        <p className="font-medium text-tinta">{p.name}</p>
                        <p className="text-[11px] text-ceniza">{p.sku || 'Sin SKU'}</p>
                      </div>
                      <span className="text-xs text-ceniza">Stock: {p.stock}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {lineas.length > 0 ? (
              <div className="mt-4 overflow-hidden rounded-xl border border-borde">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-borde bg-humo text-left text-[11px] uppercase text-ceniza">
                      <th className="px-3 py-2">Producto</th>
                      <th className="w-24 px-3 py-2">Cantidad</th>
                      <th className="w-32 px-3 py-2">Costo und.</th>
                      <th className="w-28 px-3 py-2 text-right">Subtotal</th>
                      <th className="w-10 px-2 py-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-borde">
                    {lineas.map((l, i) => (
                      <tr key={l.product.id} className="align-top">
                        <td className="px-3 py-2.5">
                          <p className="font-medium text-tinta">{l.product.name}</p>
                          <p className="text-[11px] text-ceniza">Stock actual: {l.product.stock}</p>
                        </td>
                        <td className="px-3 py-2.5">
                          <InputNum value={l.quantity} onChange={(e) => setLinea(i, 'quantity', e.target.value)}
                            error={l.quantity !== '' ? errores[i].quantity : null} placeholder="0" />
                        </td>
                        <td className="px-3 py-2.5">
                          <InputNum value={l.unit_cost} onChange={(e) => setLinea(i, 'unit_cost', e.target.value)}
                            error={l.unit_cost !== '' ? errores[i].unit_cost : null} placeholder="$" />
                        </td>
                        <td className="px-3 py-2.5 text-right font-semibold text-tinta">
                          {COP((Number(l.quantity) || 0) * (Number(l.unit_cost) || 0))}
                        </td>
                        <td className="px-2 py-2.5">
                          <button
                            onClick={() => setLineas(lineas.filter((_, x) => x !== i))}
                            className="rounded-lg p-1.5 text-ceniza hover:bg-red-50 hover:text-red-600"
                            title="Quitar"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="mt-4 rounded-xl border-2 border-dashed border-borde bg-humo/40 py-8 text-center">
                <Package size={22} className="mx-auto text-ceniza/40" />
                <p className="mt-2 text-sm text-ceniza">Aún no has agregado productos.</p>
              </div>
            )}
          </div>

          <div className="px-7 py-6">
            <p className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-ceniza">
              <Tag size={13} /> Ajustes (opcional)
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-ceniza">DESCUENTO ($)</label>
                <InputNum
                  value={descuento}
                  onChange={(e) => setDescuento(e.target.value)}
                  error={descuento !== '' ? (errDesc || (excedeDescuento ? `No puede superar ${COP(subtotal)}` : null)) : null}
                  placeholder="Se restará del subtotal"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-ceniza">IVA (%)</label>
                <InputNum
                  value={ivaRate}
                  onChange={(e) => setIvaRate(e.target.value)}
                  error={ivaRate !== '' ? errIva : null}
                  placeholder="Déjalo vacío si no aplica"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-borde bg-humo/40 px-7 py-5">
          <div className="mb-4 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-ceniza">Subtotal</span>
              <span className="font-medium text-tinta">{COP(subtotal)}</span>
            </div>
            {descAplicado > 0 && (
              <div className="flex justify-between text-esmeralda">
                <span>Descuento</span>
                <span className="font-medium">- {COP(descAplicado)}</span>
              </div>
            )}
            {iva > 0 && (
              <div className="flex justify-between">
                <span className="text-ceniza">IVA</span>
                <span className="font-medium text-tinta">{COP(iva)}</span>
              </div>
            )}
            <div className="flex items-baseline justify-between border-t border-borde pt-2">
              <span className="font-semibold text-tinta">Total</span>
              <span className="font-display text-xl font-bold text-tinta">{COP(total)}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 rounded-xl border border-borde bg-white py-3 text-sm font-bold text-ceniza hover:text-tinta">
              Cancelar
            </button>
            <button
              onClick={guardar}
              disabled={guardando || hayErrores}
              className="flex-1 rounded-xl bg-esmeralda py-3 text-sm font-black text-tinta transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {guardando ? 'Guardando...' : 'Registrar compra'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}