import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  Receipt,
  PlusCircle,
  Users,
  UserCog,
  Settings,
  LogOut,
  Menu,
  X,
  ShoppingBag,
  HandCoins,
  Boxes,
  TrendingDown,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

/*
 * Layout con sidebar oscura (#161616 = tinta). Los módulos visibles
 * dependen del rol:
 *  - owner: todo
 *  - empleado: todo menos Empleados y Configuración
 *  - contador: solo Dashboard y Ventas (lectura)
 */

const MODULOS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['owner', 'empleado', 'contador'], end: true },
  { to: '/cobranza', label: 'Cobranza', icon: HandCoins, roles: ['owner', 'empleado'] },
  { to: '/movimientos', label: 'Movimientos', icon: Boxes, roles: ['owner', 'contador'] },
  { to: '/egresos', label: 'Egresos', icon: TrendingDown, roles: ['owner', 'contador'] },
  { to: '/ventas/nueva', label: 'Nueva venta', icon: PlusCircle, roles: ['owner', 'empleado'], cta: true },
  { to: '/inventario', label: 'Inventario', icon: Package, roles: ['owner', 'empleado'] },
  { to: '/compras', label: 'Compras', icon: ShoppingBag, roles: ['owner', 'empleado'] },
  { to: '/ventas', label: 'Ventas', icon: Receipt, roles: ['owner', 'empleado', 'contador'] },
  { to: '/clientes', label: 'Clientes', icon: Users, roles: ['owner', 'empleado'] },
  { to: '/empleados', label: 'Empleados', icon: UserCog, roles: ['owner'] },
]

const ROL_LABEL = { owner: 'Dueño', empleado: 'Empleado', contador: 'Contador' }

function Layout() {
  const { user, store, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const visibles = MODULOS.filter((m) => m.roles.includes(user?.role))

  function salir() {
    logout()
    navigate('/login')
  }

  const nav = (
    <nav className="flex h-full flex-col">
      {/* Marca */}
      <div className="flex items-center gap-3 px-5 py-6">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-esmeralda font-display text-lg font-extrabold text-tinta">
          C
        </span>
        <div className="leading-tight">
          <p className="font-display text-base font-bold text-white">CatalogApp</p>
          <p className="max-w-[140px] truncate text-[11px] text-white/40">{store?.name}</p>
        </div>
      </div>

      {/* Módulos */}
      <ul className="flex flex-1 flex-col gap-1 px-3">
        {visibles.map((m) => {
          const Icon = m.icon
          return (
            <li key={m.to}>
              <NavLink
                to={m.to}
                end={m.end}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                    m.cta
                      ? 'bg-esmeralda font-bold text-tinta hover:brightness-110'
                      : isActive
                        ? 'bg-white/10 text-white'
                        : 'text-white/55 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                <Icon size={17} />
                {m.label}
              </NavLink>
            </li>
          )
        })}
      </ul>

      {/* Usuario */}
      <div className="border-t border-white/10 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-sm font-bold text-white">
            {user?.name?.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-semibold text-white">{user?.name}</p>
            <p className="text-[11px] text-white/40">{ROL_LABEL[user?.role] || user?.role}</p>
          </div>
          <button
            onClick={() => navigate('/configuracion')}
            title="Configuración"
            className="rounded-lg p-2 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
          >
            <Settings size={16} />
          </button>
          <button
            onClick={salir}
            title="Cerrar sesión"
            className="rounded-lg p-2 text-white/40 transition-colors hover:bg-red-500/15 hover:text-red-300"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </nav>
  )

  return (
    <div className="min-h-screen bg-humo">
      {/* Sidebar escritorio */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 bg-tinta lg:block">{nav}</aside>

      {/* Topbar móvil */}
      <header className="sticky top-0 z-40 flex items-center justify-between bg-tinta px-4 py-3 lg:hidden">
        <span className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-esmeralda font-display text-sm font-extrabold text-tinta">
            C
          </span>
          <span className="font-display text-sm font-bold text-white">CatalogApp</span>
        </span>
        <button onClick={() => setOpen((v) => !v)} className="p-1 text-white" aria-label="Menú">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-tinta">{nav}</aside>
        </div>
      )}

      {/* Contenido */}
      <main className="px-4 py-6 sm:px-8 lg:ml-60">
        <div className="mx-auto max-w-6xl">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default Layout
