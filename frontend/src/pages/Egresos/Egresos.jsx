import { useEffect, useMemo, useState } from 'react'
import { Search, X, PlusCircle, TrendingDown, Calendar, User, Tag, Wallet, Receipt } from 'lucide-react'
import api from '../../services/api'
import { useToast } from '../../components/Toast'
import Pagination from '../../components/Pagination'
import RowActions from '../../components/RowActions'

/* ═══════════════════════════════════════════════════════════
   EGRESOS — todo lo que sale de plata del local.
   Arriendo, servicios, salarios sueltos, transporte, etc.
   Se agrupan por categoría para el resumen del mes.
═══════════════════════════════════════════════════════════ */

const COP = (v) => `$${Number(v || 0).toLocaleString('es-CO')}`
const fecha = (iso) =>
  new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
const fechaCorta = (iso) =>
  new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })

const PAGE_SIZE = 5

/* Categorías comunes en el comercio de barrio */
const CATEGORIAS = [
  'Arriendo',
  'Servicios públicos',
  'Salarios',
  'Transporte',
  'Papelería',
  'Aseo',
  'Publicidad',
  'Mantenimiento',
  'Impuestos',
  'Otro',
]

/* Validación de número (mismo patrón que Compras) */
function validarNumero(valor, { min = 0.01 } = {}) {
  const s = String(valor ?? '').trim()
  if (s === '') return 'Este campo es requerido'
  if (/^0\d/.test(s)) return 'No puede empezar con cero'
  const n = Number(s)
  if (isNaN(n)) return 'Debe ser un número'
  if (n < 0) return 'No se permiten negativos'
  if (n < min) return `Debe ser mayor o igual a ${min}`
  return null
}

export default function Egresos() {
  const toast = useToast()
  const [egresos, setEgresos] = useState([])
  const [buscar, setBuscar] = useState('')
  const [categoria, setCategoria] = useState('todas')
  const [rango, setRango] = useState({ from: '', to: '' })
  const [orden, setOrden] = useState('recientes')
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState(false)
  const [detalle, setDetalle] = useState(null)
  const [editando, setEditando] = useState(null)

  function cargar() {
    api.get('/expenses').then(({ data }) => setEgresos(data)).catch(() => toast.error('Error cargando egresos'))
  }
  useEffect(() => { cargar() }, [])

  const totalMes = useMemo(() => {
    const now = new Date()
    return egresos
      .filter((e) => {
        const d = new Date(e.created_at)
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      })
      .reduce((n, e) => n + Number(e.amount), 0)
  }, [egresos])

  const topCategoriaMes = useMemo(() => {
    const now = new Date()
    const porCat = {}
    egresos
      .filter((e) => {
        const d = new Date(e.created_at)
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      })
      .forEach((e) => {
        const cat = e.category || 'Otro'
        porCat[cat] = (porCat[cat] || 0) + Number(e.amount)
      })
    const arr = Object.entries(porCat).sort((a, b) => b[1] - a[1])
    return arr[0] || null
  }, [egresos])

  const filtrados = useMemo(() => {
    let arr = [...egresos]
    const q = buscar.trim().toLowerCase()
    if (q) arr = arr.filter((e) =>
      (e.description || '').toLowerCase().includes(q) ||
      (e.category || '').toLowerCase().includes(q)
    )
    if (categoria !== 'todas') arr = arr.filter((e) => e.category === categoria)
    if (rango.from) arr = arr.filter((e) => new Date(e.created_at) >= new Date(rango.from))
    if (rango.to) {
      const hasta = new Date(rango.to); hasta.setHours(23, 59, 59)
      arr = arr.filter((e) => new Date(e.created_at) <= hasta)
    }
    if (orden === 'antiguos') arr.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    else if (orden === 'monto_desc') arr.sort((a, b) => Number(b.amount) - Number(a.amount))
    else if (orden === 'monto_asc') arr.sort((a, b) => Number(a.amount) - Number(b.amount))
    // por defecto ya viene DESC por created_at desde el backend
    return arr
  }, [egresos, buscar, categoria, rango, orden])

  useEffect(() => { setPage(1) }, [buscar, categoria, rango, orden])
  const totalPages = Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE))
  const visibles = filtrados.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  async function eliminar(e) {
    if (!confirm(`¿Eliminar el egreso de ${COP(e.amount)}?`)) return
    try {
      await api.delete(`/expenses/${e.id}`)
      toast.success('Egreso eliminado')
      cargar()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error eliminando')
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-tinta">Egresos</h1>
      <p className="mt-1 mb-6 text-sm text-ceniza">
        Todo lo que sale de plata del local: arriendo, servicios, salarios, transporte y demás.
      </p>

      {/* KPIs */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-borde bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-ceniza">Gasto del mes</p>
            <span className="rounded-lg bg-red-100 p-2 text-red-600"><TrendingDown size={15} /></span>
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-tinta">{COP(totalMes)}</p>
        </div>
        <div className="rounded-2xl border border-borde bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-ceniza">Categoría con más gasto</p>
            <span className="rounded-lg bg-tinta/5 p-2 text-tinta"><Tag size={15} /></span>
          </div>
          {topCategoriaMes ? (
            <>
              <p className="mt-2 font-display text-lg font-bold text-tinta">{topCategoriaMes[0]}</p>
              <p className="text-xs text-ceniza">{COP(topCategoriaMes[1])} este mes</p>
            </>
          ) : (
            <p className="mt-2 text-sm text-ceniza">Sin egresos este mes</p>
          )}
        </div>
      </div>

      {/* Controles */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative max-w-sm flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ceniza" />
            <input
              value={buscar}
              onChange={(e) => setBuscar(e.target.value)}
              placeholder="Buscar por descripción..."
              className="w-full rounded-xl border border-borde bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-esmeralda"
            />
          </div>

          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="rounded-xl border border-borde bg-white px-3 py-2.5 text-sm outline-none focus:border-esmeralda"
          >
            <option value="todas">Todas las categorías</option>
            {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>

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

          <select
            value={orden}
            onChange={(e) => setOrden(e.target.value)}
            className="rounded-xl border border-borde bg-white px-3 py-2.5 text-sm outline-none focus:border-esmeralda"
          >
            <option value="recientes">Más recientes</option>
            <option value="antiguos">Más antiguos</option>
            <option value="monto_desc">Monto: mayor a menor</option>
            <option value="monto_asc">Monto: menor a mayor</option>
          </select>
        </div>

        <button
          onClick={() => { setEditando(null); setModal(true) }}
          className="inline-flex items-center gap-2 rounded-xl bg-esmeralda px-5 py-2.5 text-sm font-black text-tinta transition-all hover:brightness-110"
        >
          <PlusCircle size={15} /> Nuevo egreso
        </button>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto overflow-y-hidden rounded-2xl border border-borde bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-borde text-left text-xs uppercase tracking-wide text-ceniza">
              <th className="px-5 py-3.5">Descripción</th>
              <th className="px-5 py-3.5">Registro</th>
              <th className="px-5 py-3.5 text-right">Monto</th>
              <th className="px-5 py-3.5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-borde">
            {visibles.map((e) => (
              <tr key={e.id} className="hover:bg-humo/60">
                <td className="px-5 py-3">
                  <p className="break-words font-medium text-tinta">{e.description || 'Sin descripción'}</p>
                  <span className="mt-0.5 inline-block rounded-full bg-tinta/5 px-2 py-0.5 text-[10px] font-semibold text-ceniza">
                    {e.category || 'Otro'}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <p className="text-sm text-tinta">{e.user_name || '—'}</p>
                  <p className="text-xs text-ceniza">{fecha(e.created_at)}</p>
                </td>
                <td className="px-5 py-3 text-right font-bold text-red-600">- {COP(e.amount)}</td>
                <td className="px-5 py-3">
                  <RowActions
                    onVer={() => setDetalle(e)}
                    onEditar={() => { setEditando(e); setModal(true) }}
                    onEliminar={() => eliminar(e)}
                  />
                </td>
              </tr>
            ))}
            {visibles.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-ceniza">
                  {egresos.length === 0 ? 'Aún no has registrado egresos.' : 'Sin resultados con esos filtros.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      {modal && (
        <ModalEgreso
          egreso={editando}
          onClose={() => { setModal(false); setEditando(null) }}
          onSaved={() => { setModal(false); setEditando(null); cargar() }}
        />
      )}
      {detalle && <ModalDetalleEgreso egreso={detalle} onClose={() => setDetalle(null)} />}
    </div>
  )
}

/* ═══════════ Modal detalle (mismo estilo que Cobranza/Compras) ═══════════ */
function ModalDetalleEgreso({ egreso, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white">
        <div className="flex items-center justify-between border-b border-borde bg-tinta px-7 py-5 text-white">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-esmeralda">Detalle del egreso</p>
            <h2 className="mt-0.5 font-display text-lg font-bold">{egreso.category || 'Otro'}</h2>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white"><X size={22} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-7">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-borde bg-humo/40 p-3">
              <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-ceniza">
                <Calendar size={11} /> Fecha
              </div>
              <p className="text-sm font-semibold text-tinta">{fecha(egreso.created_at)}</p>
            </div>
            <div className="rounded-xl border border-borde bg-humo/40 p-3">
              <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-ceniza">
                <User size={11} /> Registrado por
              </div>
              <p className="text-sm font-semibold text-tinta">{egreso.user_name || '—'}</p>
            </div>
          </div>

          <p className="mt-6 mb-2 text-xs font-bold uppercase tracking-wide text-ceniza">Descripción</p>
          <div className="rounded-xl border border-borde bg-humo/40 p-4 text-sm text-tinta">
            {egreso.description || <span className="italic text-ceniza">Sin descripción</span>}
          </div>

          <div className="mt-5 rounded-xl bg-humo p-5">
            <div className="flex items-baseline justify-between">
              <span className="font-display text-sm font-semibold text-tinta">MONTO</span>
              <span className="font-display text-2xl font-bold text-red-600">- {COP(egreso.amount)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══════════ Modal crear/editar ═══════════ */
function ModalEgreso({ egreso, onClose, onSaved }) {
  const toast = useToast()
  const [categoria, setCategoria] = useState(egreso?.category || 'Otro')
  const [descripcion, setDescripcion] = useState(egreso?.description || '')
  const [monto, setMonto] = useState(egreso ? String(egreso.amount) : '')
  const [guardando, setGuardando] = useState(false)

  const errorMonto = monto === '' ? null : validarNumero(monto, { min: 1 })
  const hayErrores = monto === '' || errorMonto !== null

  async function guardar() {
    if (hayErrores) return toast.error('Revisa los campos marcados en rojo')
    setGuardando(true)
    try {
      const payload = {
        category: categoria,
        description: descripcion.trim() || null,
        amount: Number(monto),
      }
      if (egreso) {
        await api.put(`/expenses/${egreso.id}`, payload)
        toast.success('Egreso actualizado')
      } else {
        await api.post('/expenses', payload)
        toast.success('Egreso registrado')
      }
      onSaved()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error guardando el egreso')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="flex max-h-[95vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white">
        <div className="flex items-center justify-between border-b border-borde bg-tinta px-7 py-5 text-white">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-esmeralda">
              {egreso ? 'Editar' : 'Nuevo registro'}
            </p>
            <h2 className="mt-0.5 flex items-center gap-2 font-display text-lg font-bold">
              <Wallet size={19} /> {egreso ? 'Editar egreso' : 'Registrar egreso'}
            </h2>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white"><X size={22} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-7">
          <div>
            <label className="mb-1 block text-xs font-semibold text-ceniza">CATEGORÍA</label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full rounded-xl border border-borde bg-humo px-4 py-2.5 text-sm outline-none focus:border-esmeralda"
            >
              {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="mt-4">
            <label className="mb-1 block text-xs font-semibold text-ceniza">
              DESCRIPCIÓN <span className="text-ceniza/60">(opcional)</span>
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={3}
              placeholder="Ej: Recibo de luz de marzo"
              className="w-full rounded-xl border border-borde bg-humo px-4 py-2.5 text-sm outline-none focus:border-esmeralda"
            />
          </div>

          <div className="mt-4">
            <label className="mb-1 block text-xs font-semibold text-ceniza">MONTO ($)</label>
            <input
              type="number"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              placeholder="0"
              className={`w-full rounded-xl border bg-humo px-4 py-2.5 text-sm outline-none transition-colors ${
                errorMonto ? 'border-red-500 focus:border-red-500' : 'border-borde focus:border-esmeralda'
              }`}
            />
            {errorMonto && <p className="mt-1 text-[11px] font-medium text-red-600">{errorMonto}</p>}
          </div>
        </div>

        <div className="border-t border-borde bg-humo/40 px-7 py-5">
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 rounded-xl border border-borde bg-white py-3 text-sm font-bold text-ceniza hover:text-tinta">
              Cancelar
            </button>
            <button
              onClick={guardar}
              disabled={guardando || hayErrores}
              className="flex-1 rounded-xl bg-esmeralda py-3 text-sm font-black text-tinta transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {guardando ? 'Guardando...' : (egreso ? 'Guardar cambios' : 'Registrar egreso')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
