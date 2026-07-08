import { useEffect, useMemo, useState } from 'react'
import { Plus, Search, Phone, FileText, Mail } from 'lucide-react'
import api from '../../services/api'
import { useToast } from '../../components/Toast'
import SortSelect from '../../components/SortSelect'
import Pagination from '../../components/Pagination'
import RowActions from '../../components/RowActions'
import DetailModal, { InfoCard } from '../../components/DetailModal'

const PAGE_SIZE = 5

const VACIO = { name: '', phone: '', email: '', document: '' }

const ORDEN_OPCIONES = [
  { value: 'recent', label: 'Más reciente' },
  { value: 'name_asc', label: 'Nombre A-Z' },
  { value: 'name_desc', label: 'Nombre Z-A' },
]

function Clientes() {
  const toast = useToast()
  const [clientes, setClientes] = useState([])
  const [modal, setModal] = useState(null)
  const [loading, setLoading] = useState(false)
  const [orden, setOrden] = useState('recent')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [detalle, setDetalle] = useState(null)

  async function cargar() {
    const { data } = await api.get('/customers')
    setClientes(data)
  }

  useEffect(() => { cargar().catch(() => toast.error('Error cargando clientes')) }, [])

  const clientesOrdenados = useMemo(() => {
    const arr = [...clientes]
    switch (orden) {
      case 'name_asc': return arr.sort((a, b) => a.name.localeCompare(b.name))
      case 'name_desc': return arr.sort((a, b) => b.name.localeCompare(a.name))
      default: return arr.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    }
  }, [clientes, orden])

  const clientesFiltrados = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return clientesOrdenados
    return clientesOrdenados.filter((c) => c.name?.toLowerCase().includes(q))
  }, [clientesOrdenados, search])

  useEffect(() => { setPage(1) }, [search])

  const totalPaginas = Math.max(1, Math.ceil(clientesFiltrados.length / PAGE_SIZE))
  const clientesPaginados = clientesFiltrados.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  async function guardar(e) {
    e.preventDefault()
    setLoading(true)
    try {
      if (modal.id) {
        await api.put(`/customers/${modal.id}`, modal)
        toast.success('Cliente actualizado')
      } else {
        await api.post('/customers', modal)
        toast.success('Cliente creado')
      }
      setModal(null)
      cargar()
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Error guardando')
    } finally {
      setLoading(false)
    }
  }

  const input = 'w-full rounded-xl border border-borde bg-humo px-4 py-2.5 text-sm outline-none focus:border-esmeralda'

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-tinta">Clientes</h1>
      </div>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative max-w-sm flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ceniza" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre..."
              className="w-full rounded-xl border border-borde bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-esmeralda"
            />
          </div>
          <SortSelect value={orden} onChange={setOrden} options={ORDEN_OPCIONES} />
        </div>
        <button onClick={() => setModal({ ...VACIO })} className="inline-flex items-center gap-2 rounded-xl bg-tinta px-5 py-2.5 text-sm font-bold text-white hover:opacity-90">
          <Plus size={15} /> Nuevo cliente
        </button>
      </div>

      <div className="overflow-x-auto overflow-y-hidden rounded-2xl border border-borde bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-borde text-left text-xs uppercase tracking-wide text-ceniza">
              <th className="px-5 py-3.5">Nombre</th>
              <th className="px-5 py-3.5">Teléfono</th>
              <th className="px-5 py-3.5">Documento</th>
              <th className="px-5 py-3.5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-borde">
            {clientesPaginados.map((c) => (
              <tr key={c.id} className="hover:bg-humo/60">
                <td className="break-words px-5 py-3 font-medium text-tinta">{c.name}</td>
                <td className="px-5 py-3 text-ceniza">{c.phone || '—'}</td>
                <td className="px-5 py-3 text-ceniza">{c.document || '—'}</td>
                <td className="px-5 py-3 text-right">
                  <RowActions onVer={() => setDetalle(c)} onEditar={() => setModal({ ...c })} />
                </td>
              </tr>
            ))}
            {clientesFiltrados.length === 0 && (
              <tr><td colSpan={4} className="px-5 py-10 text-center text-ceniza">Aún no tienes clientes. Los necesitas para las ventas a crédito.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={totalPaginas} onChange={setPage} />

      {/* Modal ver detalle */}
      {detalle && (
        <DetailModal kicker="Detalle de cliente" title={detalle.name} onClose={() => setDetalle(null)} maxWidth="max-w-lg">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <InfoCard icon={Phone} label="Teléfono" valor={detalle.phone || '—'} />
            <InfoCard icon={FileText} label="Documento" valor={detalle.document || '—'} />
            <InfoCard icon={Mail} label="Correo" valor={detalle.email || '—'} />
          </div>
        </DetailModal>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <form onSubmit={guardar} className="w-full max-w-md rounded-2xl bg-white p-7">
            <h2 className="mb-5 font-display text-lg font-bold text-tinta">{modal.id ? 'Editar cliente' : 'Nuevo cliente'}</h2>
            <div className="flex flex-col gap-3.5">
              <div>
                <label className="mb-1 block text-xs font-semibold text-ceniza">NOMBRE *</label>
                <input required className={input} value={modal.name} onChange={(e) => setModal({ ...modal, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-ceniza">TELÉFONO</label>
                  <input className={input} value={modal.phone || ''} onChange={(e) => setModal({ ...modal, phone: e.target.value })} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-ceniza">DOCUMENTO</label>
                  <input className={input} value={modal.document || ''} onChange={(e) => setModal({ ...modal, document: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-ceniza">CORREO</label>
                <input type="email" className={input} value={modal.email || ''} onChange={(e) => setModal({ ...modal, email: e.target.value })} />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setModal(null)} className="flex-1 rounded-xl border border-borde py-2.5 text-sm font-bold text-ceniza hover:text-tinta">Cancelar</button>
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

export default Clientes
