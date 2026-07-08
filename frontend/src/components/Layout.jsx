import { useState, useEffect, useMemo } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  Layers,
  ShoppingBag,
  ShoppingCart,
  PlusCircle,
  Receipt,
  HandCoins,
  Users,
  User,
  UserCog,
  Wallet,
  TrendingDown,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Home,
  Boxes,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

/*
 * Layout con sidebar oscura (#161616 = tinta). Los módulos visibles
 * dependen del rol:
 *  - owner: todo
 *  - empleado: todo menos Empleados y Configuración
 *  - contador: solo Dashboard y Ventas (lectura)
 */

const MENU = [
  { type: 'item', to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['owner', 'empleado', 'contador'] },
  {
    type: 'group',
    label: 'Operaciones',
    icon: Package,
    children: [
      { to: '/inventario', label: 'Inventario', icon: Boxes, roles: ['owner', 'empleado', 'contador'] },
      { to: '/movimientos', label: 'Movimientos', icon: Layers, roles: ['owner', 'empleado', 'contador'] },
      { to: '/compras', label: 'Compras', icon: ShoppingBag, roles: ['owner', 'empleado'] },
    ],
  },
  {
    type: 'group',
    label: 'Ventas',
    icon: ShoppingCart,
    children: [
      { to: '/ventas/nueva', label: 'Nueva venta', icon: PlusCircle, roles: ['owner', 'empleado'] },
      { to: '/ventas', label: 'Ventas', icon: Receipt, roles: ['owner', 'empleado', 'contador'] },
      { to: '/cobranza', label: 'Cobranza', icon: HandCoins, roles: ['owner', 'empleado'] },
    ],
  },
  {
    type: 'group',
    label: 'Personas',
    icon: Users,
    children: [
      { to: '/clientes', label: 'Clientes', icon: User, roles: ['owner', 'empleado'] },
      { to: '/empleados', label: 'Empleados', icon: UserCog, roles: ['owner'] },
    ],
  },
  {
    type: 'group',
    label: 'Finanzas',
    icon: Wallet,
    children: [{ to: '/egresos', label: 'Egresos', icon: TrendingDown, roles: ['owner', 'contador'] }],
  },
]

const ROL_LABEL = { owner: 'Dueño', empleado: 'Empleado', contador: 'Contador' }

function Layout() {
  const { user, store, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [slug, setSlug] = useState(store?.slug || null)

  const [groupsOpen, setGroupsOpen] = useState(() => {
    const inicial = {}
    for (const entry of MENU) {
      if (entry.type === 'group') {
        inicial[entry.label] = entry.children.some((c) => c.to === location.pathname)
      }
    }
    return inicial
  })

  useEffect(() => {
    if (store?.slug) {
      setSlug(store.slug)
      return
    }
    api
      .get('/store')
      .then(({ data }) => {
        if (data?.slug) setSlug(data.slug)
      })
      .catch(() => {})
  }, [store?.slug])

  const visibleMenu = useMemo(() => {
    return MENU.reduce((acc, entry) => {
      if (entry.type === 'item') {
        if (entry.roles.includes(user?.role)) acc.push(entry)
        return acc
      }
      const children = entry.children.filter((c) => c.roles.includes(user?.role))
      if (children.length > 0) acc.push({ ...entry, children })
      return acc
    }, [])
  }, [user?.role])

  function toggleGroup(label) {
    setGroupsOpen((prev) => ({ ...prev, [label]: !prev[label] }))
  }

  function salir() {
    logout()
    navigate('/login')
  }

  function abrirTienda() {
    if (!slug) return
    window.open(`/tienda/${slug}`, '_blank', 'noopener,noreferrer')
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
        {visibleMenu.map((entry) => {
          if (entry.type === 'item') {
            const Icon = entry.icon
            return (
              <li key={entry.to}>
                <NavLink
                  to={entry.to}
                  end
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                      isActive ? 'bg-white/10 text-white' : 'text-white/55 hover:bg-white/5 hover:text-white'
                    }`
                  }
                >
                  <Icon size={17} />
                  {entry.label}
                </NavLink>
              </li>
            )
          }

          const GroupIcon = entry.icon
          const isOpenGroup = !!groupsOpen[entry.label]

          return (
            <li key={entry.label}>
              <button
                type="button"
                onClick={() => toggleGroup(entry.label)}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-white/55 transition-colors hover:bg-white/5 hover:text-white"
              >
                <GroupIcon size={17} />
                <span className="flex-1 text-left">{entry.label}</span>
                {isOpenGroup ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
              </button>
              <ul
                className={`flex flex-col gap-1 overflow-hidden transition-all duration-200 ${
                  isOpenGroup ? 'mt-1 max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                {entry.children.map((c) => {
                  const ChildIcon = c.icon
                  return (
                    <li key={c.to}>
                      <NavLink
                        to={c.to}
                        onClick={() => setOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center gap-3 rounded-xl py-2 pl-11 pr-4 text-[13px] font-medium transition-colors ${
                            isActive ? 'bg-white/10 text-white' : 'text-white/55 hover:bg-white/5 hover:text-white'
                          }`
                        }
                      >
                        <ChildIcon size={15} />
                        {c.label}
                      </NavLink>
                    </li>
                  )
                })}
              </ul>
            </li>
          )
        })}

        {slug && (
          <li className="mt-2 border-t border-white/10 pt-2">
            <button
              type="button"
              onClick={abrirTienda}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-white/55 transition-colors hover:bg-white/5 hover:text-white"
            >
              <ExternalLink size={17} />
              Tienda online
            </button>
          </li>
        )}
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
            onClick={() => navigate('/')}
            title="Volver al inicio"
            className="rounded-lg p-2 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
          >
            <Home size={16} />
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
