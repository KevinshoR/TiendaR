import { Link } from 'react-router-dom'

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-borde bg-humo/90 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <span className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-tinta font-display text-base font-extrabold text-esmeralda">
            C
          </span>
          <span className="font-display text-lg font-bold">CatalogApp</span>
        </span>
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="rounded-xl px-4 py-2.5 text-sm font-bold text-ceniza transition-colors hover:text-tinta"
          >
            Iniciar sesión
          </Link>
          <Link
            to="/registro"
            className="rounded-xl bg-tinta px-5 py-2.5 text-sm font-bold text-white transition-all hover:opacity-90"
          >
            Crear mi tienda
          </Link>
        </div>
      </nav>
    </header>
  )
}