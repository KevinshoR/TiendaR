import { useEffect, useState } from 'react'
import api from '../../services/api'
import { useToast } from '../../components/Toast'
import { useAuth } from '../../context/AuthContext'

function Configuracion() {
  const toast = useToast()
  const { updateStore } = useAuth()
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get('/store').then(({ data }) => setForm(data)).catch(() => toast.error('Error cargando la configuración'))
  }, [])

  async function guardar(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await api.put('/store', {
        name: form.name,
        phone: form.phone,
        address: form.address,
        iva_enabled: form.iva_enabled,
        iva_rate: Number(form.iva_rate),
      })
      updateStore(data)
      toast.success('Configuración guardada')
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Error guardando')
    } finally {
      setLoading(false)
    }
  }

  if (!form) return <p className="text-ceniza">Cargando...</p>

  const input = 'w-full rounded-xl border border-borde bg-humo px-4 py-2.5 text-sm outline-none focus:border-esmeralda'

  return (
    <div className="max-w-xl">
      <h1 className="mb-6 font-display text-2xl font-bold text-tinta">Configuración de la tienda</h1>

      <form onSubmit={guardar} className="rounded-2xl border border-borde bg-white p-7">
        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-ceniza">NOMBRE DE LA TIENDA</label>
            <input required className={input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-ceniza">TELÉFONO</label>
              <input className={input} value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ceniza">DIRECCIÓN</label>
              <input className={input} value={form.address || ''} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
          </div>

          {/* IVA opcional */}
          <div className="rounded-xl border border-borde bg-humo p-4">
            <label className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-tinta">Manejar IVA en las ventas</p>
                <p className="mt-0.5 text-xs text-ceniza">Actívalo solo si tu negocio factura con IVA. Puedes excluir productos individualmente.</p>
              </div>
              <input
                type="checkbox"
                checked={form.iva_enabled}
                onChange={(e) => setForm({ ...form, iva_enabled: e.target.checked })}
                className="h-5 w-5 shrink-0 accent-esmeralda"
              />
            </label>
            {form.iva_enabled && (
              <div className="mt-3">
                <label className="mb-1 block text-xs font-semibold text-ceniza">TARIFA DE IVA (%)</label>
                <input
                  type="number"
                  min="0"
                  max="99"
                  step="0.5"
                  className="w-28 rounded-xl border border-borde bg-white px-4 py-2.5 text-sm outline-none focus:border-esmeralda"
                  value={form.iva_rate}
                  onChange={(e) => setForm({ ...form, iva_rate: e.target.value })}
                />
              </div>
            )}
          </div>

          <div className="rounded-xl bg-humo px-4 py-3 text-xs text-ceniza">
            Enlace de tu catálogo público (próximamente): <span className="font-mono text-tinta">/tienda/{form.slug}</span>
          </div>
        </div>

        <button type="submit" disabled={loading} className="mt-6 rounded-xl bg-tinta px-6 py-3 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50">
          {loading ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>
    </div>
  )
}

export default Configuracion
