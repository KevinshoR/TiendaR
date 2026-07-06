import { useEffect, useMemo, useState } from 'react'
import { Plus, Search, X, PackagePlus, Trash2 } from 'lucide-react'
import api from '../../services/api'
import { useToast } from '../../components/Toast'
import Pagination from '../../components/Pagination'
import RowActions from '../../components/RowActions'

/* ═══════════════════════════════════════════════════════════
   COMPRAS — abastecimiento al por mayor.
   Registrar una compra: suma stock, actualiza el costo del
   producto (último costo) y queda el histórico. IVA opcional
   (este es el ÚNICO módulo del sistema con IVA).
═══════════════════════════════════════════════════════════ */

const COP = (v) => `$${Number(v || 0).toLocaleString('es-CO')}`
const fecha = (iso) =>
  new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

const PAGE_SIZE = 5

/* ── Validación numérica en tiempo real (patrón global) ── */
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
  const [page, setPage] = useState(1)
  const [detalle, setDetalle] = useState(null)
  const [modal, setModal] = useState(false)

  function cargar() {
    api.get('/purchases').then(({ data }) => setCompras(data)).catch(() => toast.error('Error cargando compras'))
  }
  useEffect(() => { cargar() }, [])

  const filtradas = useMemo(() => {
    const q = buscar.trim().toLowerCase()
    if (!q) return compras
    return compras.filter((c) => (c.supplier || '').toLowerCase().includes(q))
  }, [compras, buscar])

  useEffect(() => { setPage(1) }, [buscar])

  const totalPages = Math.max(1, Math.ceil(filtradas.length / PAGE_SIZE))
  const visibles = filtradas.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div>
      {/* 1. Título */}
      <h1 className="font-display text-2xl font-bold text-tinta">Compras</h1>
      <p className="mt-1 mb-6 text-sm text-ceniza">
        Registra la mercancía que compras al por mayor: suma el stock y actualiza el costo automáticamente.
      </p>

      {/* 2. Controles */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ceniza" />
          <input
            value={buscar}
            onChange={(e) => setBuscar(e.target.value)}
            placeholder="Buscar por proveedor..."
            className="w-full rounded-xl border border-borde bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-esmeralda"
          />
        </div>
        <button
          onClick={() => setModal(true)}
          className="ml-auto inline-flex items-center gap-2 rounded-xl bg-tinta px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
        >
          <Plus size={15} /> Nueva compra
        </button>
      </div>

      {/* 3. Tabla */}
      <div className="overflow-x-auto overflow-y-hidden rounded-2xl border border-borde bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-borde text-left text-xs uppercase tracking-wide text-ceniza">
              <th className="px-5 py-3.5">Proveedor</th>
              <th className="px-5 py-3.5">Registrada por</th>
              <th className="px-5 py-3.5 text-center">Ítems</th>
              <th className="px-5 py-3.5 text-right">Total</th>
              <th className="px-5 py-3.5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-borde">
            {visibles.map((c) => (
              <tr key={c.id} className="hover:bg-humo/60">
                <td className="px-5 py-3">
                  <p className="break-words font-semibold text-tinta">{c.supplier || 'Sin proveedor'}</p>
                  <p className="text-xs text-ceniza">{fecha(c.created_at)}</p>
                </td>
                <td className="break-words px-5 py-3 text-ceniza">{c.user_name || '—'}</td>
                <td className="px-5 py-3 text-center text-ceniza">{c.items_count}</td>
                <td className="px-5 py-3 text-right font-bold text-tinta">{COP(c.total)}</td>
                <td className="px-5 py-3">
                  <RowActions onVer={() => setDetalle(c)} />
                </td>
              </tr>
            ))}
            {visibles.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-ceniza">
                  {compras.length === 0 ? 'Aún no has registrado compras.' : 'Sin resultados.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 4. Paginación */}
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      {/* Modal detalle */}
      {detalle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-7">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-tinta">Detalle de la compra</h2>
              <button onClick={() => setDetalle(null)} className="text-ceniza hover:text-tinta"><X size={20} /></button>
            </div>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div><dt className="text-ceniza">Proveedor</dt><dd className="font-medium text-tinta">{detalle.supplier || 'Sin proveedor'}</dd></div>
              <div><dt className="text-ceniza">Fecha</dt><dd className="font-medium text-tinta">{fecha(detalle.created_at)}</dd></div>
              <div><dt className="text-ceniza">Registrada por</dt><dd className="font-medium text-tinta">{detalle.user_name || '—'}</dd></div>
              <div><dt className="text-ceniza">IVA aplicado</dt><dd className="font-medium text-tinta">{Number(detalle.iva_rate) > 0 ? `${detalle.iva_rate}%` : 'Sin IVA'}</dd></div>
            </dl>
            <p className="mt-5 mb-2 text-xs font-bold uppercase tracking-wide text-ceniza">Productos comprados</p>
            <div className="overflow-hidden rounded-xl border border-borde">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-borde bg-humo text-left text-[11px] uppercase text-ceniza">
                    <th className="px-3 py-2">Producto</th>
                    <th className="px-3 py-2 text-center">Cant.</th>
                    <th className="px-3 py-2 text-right">Costo und.</th>
                    <th className="px-3 py-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-borde">
                  {(detalle.items || []).map((it, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2 font-medium text-tinta">{it.product_name}</td>
                      <td className="px-3 py-2 text-center text-ceniza">{it.quantity}</td>
                      <td className="px-3 py-2 text-right text-ceniza">{COP(it.unit_cost)}</td>
                      <td className="px-3 py-2 text-right font-semibold text-tinta">{COP(it.quantity * it.unit_cost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex justify-end gap-6 text-sm">
              <span className="text-ceniza">Subtotal: <strong className="text-tinta">{COP(detalle.subtotal)}</strong></span>
              {Number(detalle.iva_total) > 0 && (
                <span className="text-ceniza">IVA: <strong className="text-tinta">{COP(detalle.iva_total)}</strong></span>
              )}
              <span className="font-display text-base font-bold text-tinta">Total: {COP(detalle.total)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Modal nueva compra */}
      {modal && <ModalNuevaCompra onClose={() => setModal(false)} onSaved={() => { setModal(false); cargar() }} />}
    </div>
  )
}

/* ═══════════ Modal: registrar compra ═══════════ */
function ModalNuevaCompra({ onClose, onSaved }) {
  const toast = useToast()
  const [productos, setProductos] = useState([])
  const [buscarProd, setBuscarProd] = useState('')
  const [proveedor, setProveedor] = useState('')
  const [ivaRate, setIvaRate] = useState('') // opcional
  const [lineas, setLineas] = useState([]) // {product, quantity, unit_cost}
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

  /* Validaciones en tiempo real */
  const errores = lineas.map((l) => ({
    quantity: validarNumero(l.quantity, { entero: true, min: 1 }),
    unit_cost: validarNumero(l.unit_cost, { min: 1 }),
  }))
  const errIva = ivaRate === '' ? null : validarNumero(ivaRate, { min: 0 })
  const hayErrores = lineas.length === 0 || errIva !== null && ivaRate !== '' || errores.some((e) => e.quantity || e.unit_cost)

  const subtotal = lineas.reduce((n, l) => n + (Number(l.quantity) || 0) * (Number(l.unit_cost) || 0), 0)
  const iva = ivaRate !== '' && !errIva ? subtotal * (Number(ivaRate) / 100) : 0
  const total = subtotal + iva

  async function guardar() {
    if (hayErrores) return toast.error('Revisa los campos marcados en rojo')
    setGuardando(true)
    try {
      await api.post('/purchases', {
        supplier: proveedor.trim() || null,
        iva_rate: ivaRate === '' ? null : Number(ivaRate),
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
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col rounded-2xl bg-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-borde px-7 py-5">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold text-tinta">
            <PackagePlus size={19} /> Nueva compra
          </h2>
          <button onClick={onClose} className="text-ceniza hover:text-tinta"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-7 py-5">
          {/* Proveedor + IVA */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-ceniza">PROVEEDOR (OPCIONAL)</label>
              <input
                value={proveedor}
                onChange={(e) => setProveedor(e.target.value)}
                placeholder="Ej: Distribuidora El Hueco"
                className="w-full rounded-xl border border-borde bg-humo px-4 py-2.5 text-sm outline-none focus:border-esmeralda"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ceniza">IVA DE LA COMPRA % (OPCIONAL)</label>
              <InputNum
                value={ivaRate}
                onChange={(e) => setIvaRate(e.target.value)}
                error={ivaRate !== '' ? errIva : null}
                placeholder="Déjalo vacío si no aplica"
              />
            </div>
          </div>

          {/* Buscador de productos */}
          <div className="relative mt-5">
            <label className="mb-1 block text-xs font-semibold text-ceniza">AGREGAR PRODUCTOS</label>
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
                    <span className="font-medium text-tinta">{p.name}</span>
                    <span className="text-xs text-ceniza">{p.sku || ''} · stock {p.stock}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Líneas de compra */}
          {lineas.length > 0 && (
            <div className="mt-5 overflow-hidden rounded-xl border border-borde">
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
                        <InputNum
                          value={l.quantity}
                          onChange={(e) => setLinea(i, 'quantity', e.target.value)}
                          error={l.quantity !== '' ? errores[i].quantity : null}
                          placeholder="0"
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        <InputNum
                          value={l.unit_cost}
                          onChange={(e) => setLinea(i, 'unit_cost', e.target.value)}
                          error={l.unit_cost !== '' ? errores[i].unit_cost : null}
                          placeholder="$"
                        />
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
          )}
        </div>

        {/* Footer con totales */}
        <div className="border-t border-borde px-7 py-5">
          <div className="mb-4 flex flex-wrap justify-end gap-x-6 gap-y-1 text-sm">
            <span className="text-ceniza">Subtotal: <strong className="text-tinta">{COP(subtotal)}</strong></span>
            {iva > 0 && <span className="text-ceniza">IVA: <strong className="text-tinta">{COP(iva)}</strong></span>}
            <span className="font-display text-lg font-bold text-tinta">Total: {COP(total)}</span>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 rounded-xl border border-borde py-3 text-sm font-bold text-ceniza hover:text-tinta">
              Cancelar
            </button>
            <button
              onClick={guardar}
              disabled={guardando || hayErrores}
              className="flex-1 rounded-xl bg-esmeralda py-3 text-sm font-black text-tinta transition-all hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {guardando ? 'Guardando...' : 'Registrar compra'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
