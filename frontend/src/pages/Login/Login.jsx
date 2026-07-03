import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [ver, setVer] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-humo px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-tinta font-display text-xl font-extrabold text-esmeralda">
            C
          </span>
          <h1 className="font-display text-2xl font-bold text-tinta">CatalogApp</h1>
          <p className="mt-1 text-sm text-ceniza">Tu comercio, organizado</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-borde bg-white p-7 shadow-sm">
          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}
          <label className="mb-1 block text-sm font-medium text-tinta">Correo electrónico</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mb-4 w-full rounded-xl border border-borde bg-humo px-4 py-3 text-sm outline-none transition-colors focus:border-esmeralda"
            placeholder="tucorreo@ejemplo.com"
          />
          <label className="mb-1 block text-sm font-medium text-tinta">Contraseña</label>
          <div className="relative mb-6">
            <input
              type={ver ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-borde bg-humo px-4 py-3 pr-11 text-sm outline-none transition-colors focus:border-esmeralda"
              placeholder="Tu contraseña"
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
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-tinta py-3 text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-ceniza">
          ¿No tienes cuenta?{' '}
          <Link to="/registro" className="font-bold text-tinta underline underline-offset-2 hover:text-esmeralda">
            Registra tu tienda
          </Link>
        </p>
      </div>
    </main>
  )
}

export default Login
