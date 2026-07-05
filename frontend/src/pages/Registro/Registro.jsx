import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

function Registro() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ storeName: '', name: '', email: '', password: '', phone: '' })
  const [ver, setVer] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(form)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Error al crear la cuenta')
    } finally {
      setLoading(false)
    }
  }

  const input =
    'w-full rounded-xl border border-borde bg-humo px-4 py-3 text-sm outline-none transition-colors focus:border-esmeralda'

  return (
    <main className="flex min-h-screen items-center justify-center bg-humo px-6 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-tinta font-display text-xl font-extrabold text-esmeralda">
            C
          </span>
          <h1 className="font-display text-2xl font-bold text-tinta">Registra tu tienda</h1>
          <p className="mt-1 text-sm text-ceniza">Empieza a organizar tu comercio hoy mismo</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-borde bg-white p-7 shadow-sm">
          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}
          <label className="mb-1 block text-sm font-medium text-tinta">Nombre de tu tienda</label>
          <input required className={`${input} mb-4`} placeholder="Ej: Tienda Don Pedro" value={form.storeName} onChange={set('storeName')} />

          <div className="mb-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-tinta">Tu nombre</label>
              <input required className={input} placeholder="Nombre completo" value={form.name} onChange={set('name')} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-tinta">Teléfono (opcional)</label>
              <input className={input} placeholder="300 123 4567" value={form.phone} onChange={set('phone')} />
            </div>
          </div>

          <label className="mb-1 block text-sm font-medium text-tinta">Correo electrónico</label>
          <input type="email" required className={`${input} mb-4`} placeholder="tucorreo@ejemplo.com" value={form.email} onChange={set('email')} />

          <label className="mb-1 block text-sm font-medium text-tinta">Contraseña</label>
          <div className="relative mb-2">
            <input
              type={ver ? 'text' : 'password'}
              required
              className={`${input} pr-11`}
              placeholder="Mínimo 8 caracteres"
              value={form.password}
              onChange={set('password')}
            />
            <button
              type="button"
              onClick={() => setVer((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-ceniza transition-colors hover:text-tinta"
              aria-label="Mostrar contraseña"
            >
              {ver ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
          <p className="mb-6 text-xs text-ceniza">
            Debe incluir mayúscula, minúscula, número y un carácter especial.
          </p>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-esmeralda py-3 text-sm font-black text-tinta transition-all hover:brightness-110 disabled:opacity-50"
          >
            {loading ? 'Creando tu tienda...' : 'Crear mi tienda gratis'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-ceniza">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-bold text-tinta underline underline-offset-2 hover:text-esmeralda">
            Inicia sesión
          </Link>
        </p>
      </div>
    </main>
  )
}

export default Registro
