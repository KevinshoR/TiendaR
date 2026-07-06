import { useEffect, useMemo, useState } from 'react'
import { Plus, Eye, EyeOff, Search } from 'lucide-react'
import api from '../../services/api'
import { useToast } from '../../components/Toast'
import Pagination from '../../components/Pagination'
import RowActions from '../../components/RowActions'
import DetailModal, { Campo } from '../../components/DetailModal'

const PAGE_SIZE = 5

const VACIO = { name: '', email: '', password: '', role: 'empleado' }
const ROL = {
  owner: { label: 'Dueño', cls: 'bg-tinta text-white' },
  empleado: { label: 'Empleado', cls: 'bg-esmeralda/15 text-esmeralda' },
  contador: { label: 'Contador', cls: 'bg-humo text-tinta border border-borde' },
}

function Empleados() {
  const toast = useToast()
  const [usuarios, setUsuarios] = useState([])
  const [modal, setModal] = useState(null)
  const [ver, setVer] = useState(false)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [detalle, setDetalle] = useState(null)

  async function cargar() {
    const { data } = await api.get('/users')
    setUsuarios(data)
  }

  useEffect(() => { cargar().catch(() => toast.error('Error cargando el equipo')) }, [])

  async function crear(e) {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/users', modal)
      toast.success(`${modal.role === 'contador' ? 'Contador' : 'Empleado'} creado`)
      setModal(null)
      cargar()
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Error creando')
    } finally {
      setLoading(false)
    }
  }

  const usuariosFiltrados = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return usuarios
    return usuarios.filter((u) => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q))
  }, [usuarios, search])

  useEffect(() => { setPage(1) }, [search])

  const totalPaginas = Math.max(1, Math.ceil(usuariosFiltrados.length / PAGE_SIZE))
  const usuariosPaginados = usuariosFiltrados.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  async function toggleActivo(u) {
    try {
      await api.patch(`/users/${u.id}`, { active: !u.active })
      toast.success(u.active ? 'Acceso desactivado' : 'Acceso reactivado')
      cargar()
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.error || 'No se pudo cambiar')
    }
  }

  const input = 'w-full rounded-xl border border-borde bg-humo px-4 py-2.5 text-sm outline-none focus:border-esmeralda'

  return (
    <div>
      <div className="mb-2">
        <h1 className="font-display text-2xl font-bold text-tinta">Tu equipo</h1>
      </div>
      <p className="mb-6 text-sm text-ceniza">
        Los <strong className="text-tinta">empleados</strong> pueden vender y manejar inventario. El{' '}
        <strong className="text-tinta">contador</strong> solo puede ver el dashboard y las ventas — no puede modificar nada.
      </p>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="relative max-w-sm flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ceniza" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o correo..."
            className="w-full rounded-xl border border-borde bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-esmeralda"
          />
        </div>
        <button onClick={() => { setModal({ ...VACIO }); setVer(false) }} className="inline-flex items-center gap-2 rounded-xl bg-tinta px-5 py-2.5 text-sm font-bold text-white hover:opacity-90">
          <Plus size={15} /> Agregar persona
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-borde bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-borde text-left text-xs uppercase tracking-wide text-ceniza">
              <th className="px-5 py-3.5">Nombre</th>
              <th className="px-5 py-3.5">Rol</th>
              <th className="px-5 py-3.5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-borde">
            {usuariosPaginados.map((u) => {
              const rol = ROL[u.role] || ROL.empleado
              return (
                <tr key={u.id} className="hover:bg-humo/60">
                  <td className="px-5 py-3">
                    <p className="font-medium text-tinta">{u.name}</p>
                    <p className="text-xs text-ceniza">{u.email}</p>
                  </td>
                  <td className="px-5 py-3"><span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${rol.cls}`}>{rol.label}</span></td>
                  <td className="px-5 py-3 text-right">
                    <RowActions
                      onVer={() => setDetalle(u)}
                      estado={u.role !== 'owner' ? { checked: !!u.active, onChange: () => toggleActivo(u) } : undefined}
                    />
                  </td>
                </tr>
              )
            })}
            {usuariosFiltrados.length === 0 && (
              <tr><td colSpan={3} className="px-5 py-10 text-center text-ceniza">Sin coincidencias.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={totalPaginas} onChange={setPage} />

      {/* Modal ver detalle */}
      {detalle && (
        <DetailModal title="Detalle del empleado" onClose={() => setDetalle(null)}>
          <Campo label="Nombre" value={detalle.name} />
          <Campo label="Correo" value={detalle.email} />
          <div className="grid grid-cols-2 gap-4">
            <Campo label="Rol" value={(ROL[detalle.role] || ROL.empleado).label} />
            <Campo label="Estado" value={detalle.active ? 'Activo' : 'Desactivado'} />
          </div>
        </DetailModal>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <form onSubmit={crear} className="w-full max-w-md rounded-2xl bg-white p-7">
            <h2 className="mb-5 font-display text-lg font-bold text-tinta">Agregar persona al equipo</h2>
            <div className="flex flex-col gap-3.5">
              <div>
                <label className="mb-1 block text-xs font-semibold text-ceniza">ROL</label>
                <div className="grid grid-cols-2 gap-2">
                  {['empleado', 'contador'].map((r) => (
                    <button
                      type="button"
                      key={r}
                      onClick={() => setModal({ ...modal, role: r })}
                      className={`rounded-xl border py-2.5 text-sm font-bold capitalize ${modal.role === r ? 'border-tinta bg-tinta text-white' : 'border-borde text-ceniza hover:text-tinta'}`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                {modal.role === 'contador' && (
                  <p className="mt-1.5 text-xs text-ceniza">El contador tendrá acceso de solo lectura a números y ventas.</p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-ceniza">NOMBRE *</label>
                <input required className={input} value={modal.name} onChange={(e) => setModal({ ...modal, name: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-ceniza">CORREO *</label>
                <input type="email" required className={input} value={modal.email} onChange={(e) => setModal({ ...modal, email: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-ceniza">CONTRASEÑA *</label>
                <div className="relative">
                  <input type={ver ? 'text' : 'password'} required className={`${input} pr-11`} value={modal.password} onChange={(e) => setModal({ ...modal, password: e.target.value })} />
                  <button type="button" onClick={() => setVer((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-ceniza hover:text-tinta">
                    {ver ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setModal(null)} className="flex-1 rounded-xl border border-borde py-2.5 text-sm font-bold text-ceniza hover:text-tinta">Cancelar</button>
              <button type="submit" disabled={loading} className="flex-1 rounded-xl bg-tinta py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50">
                {loading ? 'Creando...' : 'Crear acceso'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default Empleados
