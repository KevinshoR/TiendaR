import { useEffect, useMemo, useState } from 'react'
import { Search, X, HandCoins, AlertCircle, CheckCircle2 } from 'lucide-react'
import api from '../../services/api'
import { useToast } from '../../components/Toast'
import Pagination from '../../components/Pagination'

/* ═══════════════════════════════════════════════════════════
   COBRANZA — las ventas a crédito (fiados) por cobrar.
   Muestra quién debe, cuánto y desde cuándo. Permite registrar
   ABONOS; cuando el saldo llega a 0, la venta pasa a 'pagada'.
═══════════════════════════════════════════════════════════ */

const COP = (v) => `$${Number(v || 0).toLocaleString('es-CO')}`
const fechaCorta = (iso) => (iso ? new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }) : '—')

const PAGE_SIZE = 5

/* Días de vencimiento: negativo = vencida */
function diasPara(dueDate) {
  if (!dueDate) return null
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
  const d = new Date(dueDate); d.setHours(0, 0, 0, 0)
  return Math.round((d - hoy) / (1000 * 60 * 60 * 24))
}

function BadgeVencimiento({ dueDate }) {
  const dias = diasPara(dueDate)
  if (dias === null) return <span className="text-xs text-ceniza">Sin fecha</span>
  if (dias < 0) return <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-[11px] font-bold text-red-700">Vencida hace {Math.abs(dias)}d</span>
  if (dias === 0) return <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-700">Vence hoy</span>
  if (dias <= 3) return <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-700">Vence en {dias}d</span>
  return <span className="rounded-full bg-esmeralda/12 px-2.5 py-0.5 text-[11px] font-bold text-esmeralda">Vence en {dias}d</span>
}

export default function Cobranza() {
  const toast = useToast()
  const [deudas, setDeudas] = useState([])
  const [buscar, setBuscar] = useState('')
  const [filtro, setFiltro] = useState('todas') // todas | vencidas | aldia
  const [page, setPage] = useState(1)
  const [abonar, setAbonar] = useState(null)

  function cargar() {
    // Trae las ventas a crédito pendientes. Reusa GET /sales con filtro.
    api.get('/sales', { params: { status: 'pendiente' } })
      .then(({ data }) => setDeudas(data.filter((v) => v.type === 'credito')))
      .catch(() => toast.error('Error cargando la cartera'))
  }
  useEffect(() => { cargar() }, [])

  const totalPorCobrar = useMemo(
    () => deudas.reduce((n, v) => n + (Number(v.total) - Number(v.paid_amount || 0)), 0),
    [deudas]
  )
  const vencidas = useMemo(() => deudas.filter((v) => (diasPara(v.due_date) ?? 99) < 0), [deudas])

  const filtradas = useMemo(() => {
    let arr = [...deudas]
    const q = buscar.trim().toLowerCase()
    if (q) arr = arr.filter((v) => (v.customer_name || '').toLowerCase().includes(q))
    if (filtro === 'vencidas') arr = arr.filter((v) => (diasPara(v.due_date) ?? 99) < 0)
    if (filtro === 'aldia') arr = arr.filter((v) => (diasPara(v.due_date) ?? 99) >= 0)
    return arr
  }, [deudas, buscar, filtro])

  useEffect(() => { setPage(1) }, [buscar, filtro])

  const totalPages = Math.max(1, Math.ceil(filtradas.length / PAGE_SIZE))
  const visibles = filtradas.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-tinta">Cobranza</h1>
      <p className="mt-1 mb-6 text-sm text-ceniza">Las ventas a crédito que tus clientes aún deben. Registra abonos cuando te paguen.</p>

      {/* Resumen */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-borde bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-ceniza">Total por cobrar</p>
            <span className="rounded-lg bg-esmeralda/10 p-2 text-esmeralda"><HandCoins size={15} /></span>
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-tinta">{COP(totalPorCobrar)}</p>
        </div>
        <div className="rounded-2xl border border-borde bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-ceniza">Cuentas activas</p>
            <span className="rounded-lg bg-tinta/5 p-2 text-tinta"><CheckCircle2 size={15} /></span>
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-tinta">{deudas.length}</p>
        </div>
        <div className="rounded-2xl border border-borde bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-ceniza">Vencidas</p>
            <span className={`rounded-lg p-2 ${vencidas.length ? 'bg-red-100 text-red-600' : 'bg-tinta/5 text-ceniza'}`}><AlertCircle size={15} /></span>
          </div>
          <p className={`mt-2 font-display text-2xl font-bold ${vencidas.length ? 'text-red-600' : 'text-tinta'}`}>{vencidas.length}</p>
        </div>
      </div>

      {/* Controles */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ceniza" />
          <input
            value={buscar}
            onChange={(e) => setBuscar(e.target.value)}
            placeholder="Buscar por cliente..."
            className="w-full rounded-xl border border-borde bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-esmeralda"
          />
        </div>
        <div className="flex gap-1 rounded-xl border border-borde bg-white p-1">
          {[['todas', 'Todas'], ['vencidas', 'Vencidas'], ['aldia', 'Al día']].map(([k, label]) => (
            <button
              key={k}
              onClick={() => setFiltro(k)}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${filtro === k ? 'bg-tinta text-white' : 'text-ceniza hover:text-tinta'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto overflow-y-hidden rounded-2xl border border-borde bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-borde text-left text-xs uppercase tracking-wide text-ceniza">
              <th className="px-5 py-3.5">Cliente</th>
              <th className="px-5 py-3.5">Vencimiento</th>
              <th className="px-5 py-3.5 text-right">Total</th>
              <th className="px-5 py-3.5 text-right">Abonado</th>
              <th className="px-5 py-3.5 text-right">Debe</th>
              <th className="px-5 py-3.5 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-borde">
            {visibles.map((v) => {
              const debe = Number(v.total) - Number(v.paid_amount || 0)
              return (
                <tr key={v.id} className="hover:bg-humo/60">
                  <td className="px-5 py-3">
                    <p className="font-semibold text-tinta">{v.customer_name || 'Sin cliente'}</p>
                    <p className="text-xs text-ceniza">Fiado el {fechaCorta(v.created_at)}</p>
                  </td>
                  <td className="px-5 py-3"><BadgeVencimiento dueDate={v.due_date} /></td>
                  <td className="px-5 py-3 text-right text-ceniza">{COP(v.total)}</td>
                  <td className="px-5 py-3 text-right text-ceniza">{COP(v.paid_amount)}</td>
                  <td className="px-5 py-3 text-right font-bold text-tinta">{COP(debe)}</td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => setAbonar({ ...v, debe })}
                      className="rounded-lg bg-esmeralda px-3.5 py-1.5 text-xs font-bold text-tinta transition-all hover:brightness-105"
                    >
                      Abonar
                    </button>
                  </td>
                </tr>
              )
            })}
            {visibles.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-ceniza">
                {deudas.length === 0 ? '¡Nadie te debe! No hay ventas a crédito pendientes.' : 'Sin resultados con esos filtros.'}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      {abonar && (
        <ModalAbono
          venta={abonar}
          onClose={() => setAbonar(null)}
          onSaved={() => { setAbonar(null); cargar() }}
        />
      )}
    </div>
  )
}

/* ═══════════ Modal: registrar abono ═══════════ */
function ModalAbono({ venta, onClose, onSaved }) {
  const toast = useToast()
  const [monto, setMonto] = useState('')
  const [metodo, setMetodo] = useState('efectivo')
  const [guardando, setGuardando] = useState(false)

  const n = Number(monto)
  let error = null
  if (monto !== '') {
    if (/^0\d/.test(monto)) error = 'No puede empezar con cero'
    else if (isNaN(n) || n <= 0) error = 'Ingresa un monto válido'
    else if (n > venta.debe) error = `No puede superar lo que debe (${COP(venta.debe)})`
  }

  const saldar = () => setMonto(String(venta.debe))

  async function guardar() {
    if (monto === '' || error) return toast.error('Revisa el monto del abono')
    setGuardando(true)
    try {
      await api.post(`/sales/${venta.id}/payments`, { amount: n, method: metodo })
      const queda = venta.debe - n
      toast.success(queda <= 0 ? '¡Deuda saldada por completo! 🎉' : `Abono registrado. Queda debiendo ${COP(queda)}`)
      onSaved()
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Error registrando el abono')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-7">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-tinta">Registrar abono</h2>
          <button onClick={onClose} className="text-ceniza hover:text-tinta"><X size={20} /></button>
        </div>

        <div className="mb-5 rounded-xl bg-humo p-4">
          <p className="text-sm font-semibold text-tinta">{venta.customer_name || 'Sin cliente'}</p>
          <div className="mt-2 flex justify-between text-sm">
            <span className="text-ceniza">Debe actualmente:</span>
            <span className="font-display text-lg font-bold text-tinta">{COP(venta.debe)}</span>
          </div>
        </div>

        <label className="mb-1 block text-xs font-semibold text-ceniza">MONTO DEL ABONO</label>
        <div className="flex gap-2">
          <input
            type="number"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            placeholder="$"
            className={`flex-1 rounded-xl border bg-humo px-4 py-2.5 text-sm outline-none transition-colors ${error ? 'border-red-500' : 'border-borde focus:border-esmeralda'}`}
          />
          <button onClick={saldar} className="rounded-xl border border-borde px-4 text-xs font-bold text-tinta hover:bg-humo">
            Saldar todo
          </button>
        </div>
        {error && <p className="mt-1 text-[11px] font-medium text-red-600">{error}</p>}

        <label className="mb-1 mt-4 block text-xs font-semibold text-ceniza">MÉTODO</label>
        <div className="grid grid-cols-2 gap-2">
          {[['efectivo', 'Efectivo'], ['transferencia', 'Transferencia']].map(([k, label]) => (
            <button
              key={k}
              onClick={() => setMetodo(k)}
              className={`rounded-xl border py-2.5 text-sm font-bold transition-colors ${metodo === k ? 'border-tinta bg-tinta text-white' : 'border-borde text-ceniza hover:text-tinta'}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-6 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl border border-borde py-3 text-sm font-bold text-ceniza hover:text-tinta">
            Cancelar
          </button>
          <button
            onClick={guardar}
            disabled={guardando || monto === '' || !!error}
            className="flex-1 rounded-xl bg-esmeralda py-3 text-sm font-black text-tinta transition-all hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {guardando ? 'Guardando...' : 'Registrar abono'}
          </button>
        </div>
      </div>
    </div>
  )
}
