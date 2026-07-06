import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  Search, ShoppingCart, SlidersHorizontal, X, Plus, Minus, Trash2,
  Store, Send, ArrowUpDown,
} from 'lucide-react'
import api from '../../services/api'

/* ═══════════════════════════════════════════════════════════
   Tienda pública (/tienda/:slug) — catálogo con carrito.
   Navbar con logo, buscador, sidebar de filtros (tallas + orden),
   carrito lateral que arma el pedido y lo envía por WhatsApp.
   Mobile-first.
═══════════════════════════════════════════════════════════ */

const COP = (v) => `$${Number(v || 0).toLocaleString('es-CO')}`

function waLink(whatsapp, texto) {
  const num = String(whatsapp).replace(/\D/g, '')
  return `https://wa.me/${num}?text=${encodeURIComponent(texto)}`
}

const parseSizes = (s) => (s ? s.split(',').map((x) => x.trim()).filter(Boolean) : [])

/* ── Iconos de marca como SVG propios (los de lucide se ven mal/faltan) ── */
const Ico = {
  instagram: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
      <rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  ),
  facebook: (p) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
      <path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.3v7A10 10 0 0 0 22 12z" />
    </svg>
  ),
  tiktok: (p) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
      <path d="M16.6 5.8a4.3 4.3 0 0 1-1-2.8h-3.2v12.9a2.4 2.4 0 1 1-2.4-2.4c.2 0 .4 0 .6.1V10a5.7 5.7 0 0 0-.6 0A5.6 5.6 0 1 0 15.6 15V9.7a7.5 7.5 0 0 0 4.4 1.4V7.9a4.3 4.3 0 0 1-3.4-2.1z" />
    </svg>
  ),
  telegram: (p) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
      <path d="M22 3 2 10.5l5.5 2L9 19l3-3.5 5 3.5L22 3z" />
    </svg>
  ),
  youtube: (p) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
      <path d="M23 12s0-3.4-.4-5a2.5 2.5 0 0 0-1.8-1.8C19 5 12 5 12 5s-7 0-8.8.4A2.5 2.5 0 0 0 1.4 7C1 8.6 1 12 1 12s0 3.4.4 5a2.5 2.5 0 0 0 1.8 1.8C5 19 12 19 12 19s7 0 8.8-.4a2.5 2.5 0 0 0 1.8-1.8c.4-1.6.4-5 .4-5zM10 15V9l5 3-5 3z" />
    </svg>
  ),
}

function RedSocial({ href, children }) {
  if (!href) return null
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="flex h-10 w-10 items-center justify-center rounded-full border border-borde bg-white text-tinta transition-all hover:-translate-y-0.5 hover:border-esmeralda hover:text-esmeralda">
      {children}
    </a>
  )
}

const ORDENES = {
  relevancia: 'Destacados',
  precio_asc: 'Precio: menor a mayor',
  precio_desc: 'Precio: mayor a menor',
  nombre: 'Nombre A-Z',
}

export default function TiendaPublica() {
  const { slug } = useParams()
  const [tienda, setTienda] = useState(null)
  const [productos, setProductos] = useState([])
  const [estado, setEstado] = useState('cargando')

  const [buscar, setBuscar] = useState('')
  const [orden, setOrden] = useState('relevancia')
  const [tallasSel, setTallasSel] = useState([])
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false)

  const [cart, setCart] = useState([]) // {id, name, price, size, qty}
  const [cartAbierto, setCartAbierto] = useState(false)

  useEffect(() => {
    Promise.all([
      api.get(`/public/store/${slug}`),
      api.get(`/public/store/${slug}/products`),
    ])
      .then(([s, p]) => { setTienda(s.data); setProductos(p.data); setEstado('ok') })
      .catch(() => setEstado('noexiste'))
  }, [slug])

  /* Todas las tallas presentes en el catálogo (para los filtros) */
  const tallasDisponibles = useMemo(() => {
    const set = new Set()
    productos.forEach((p) => parseSizes(p.sizes).forEach((t) => set.add(t)))
    return [...set]
  }, [productos])

  const filtrados = useMemo(() => {
    let arr = [...productos]
    const q = buscar.trim().toLowerCase()
    if (q) arr = arr.filter((p) => p.name.toLowerCase().includes(q))
    if (tallasSel.length) arr = arr.filter((p) => {
      const s = parseSizes(p.sizes)
      return tallasSel.some((t) => s.includes(t))
    })
    if (orden === 'precio_asc') arr.sort((a, b) => a.price - b.price)
    else if (orden === 'precio_desc') arr.sort((a, b) => b.price - a.price)
    else if (orden === 'nombre') arr.sort((a, b) => a.name.localeCompare(b.name))
    return arr
  }, [productos, buscar, tallasSel, orden])

  /* ── Carrito ── */
  const cartCount = cart.reduce((n, i) => n + i.qty, 0)
  const cartTotal = cart.reduce((n, i) => n + i.price * i.qty, 0)

  function agregar(prod, size = null) {
    setCart((prev) => {
      const key = `${prod.id}__${size || ''}`
      const found = prev.find((i) => `${i.id}__${i.size || ''}` === key)
      if (found) return prev.map((i) => (`${i.id}__${i.size || ''}` === key ? { ...i, qty: i.qty + 1 } : i))
      return [...prev, { id: prod.id, name: prod.name, price: prod.price, size, qty: 1 }]
    })
    setCartAbierto(true)
  }
  function cambiarQty(idx, delta) {
    setCart((prev) => prev
      .map((it, i) => (i === idx ? { ...it, qty: it.qty + delta } : it))
      .filter((it) => it.qty > 0))
  }

  function pedirPorWhatsapp() {
    const lineas = cart.map((i) =>
      `• ${i.qty}x ${i.name}${i.size ? ` (talla ${i.size})` : ''} — ${COP(i.price * i.qty)}`
    ).join('\n')
    const msg = `¡Hola ${tienda.name}! 🛒 Quiero hacer este pedido:\n\n${lineas}\n\n*Total: ${COP(cartTotal)}*`
    window.open(waLink(tienda.whatsapp, msg), '_blank')
  }

  if (estado === 'cargando')
    return <div className="flex min-h-screen items-center justify-center bg-humo"><p className="text-sm text-ceniza">Cargando tienda...</p></div>

  if (estado === 'noexiste')
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-humo px-6 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-tinta text-esmeralda"><Store size={26} /></span>
        <h1 className="font-display text-2xl font-bold text-tinta">Tienda no encontrada</h1>
        <p className="text-sm text-ceniza">El enlace no corresponde a ninguna tienda activa.</p>
      </div>
    )

  const inicial = tienda.name.charAt(0).toUpperCase()
  const hayWhatsapp = !!tienda.whatsapp

  return (
    <div className="min-h-screen bg-humo font-sans text-tinta antialiased">
      {/* ═══ NAVBAR ═══ */}
      <header className="sticky top-0 z-30 border-b border-borde bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
          {/* Logo arriba-izquierda (de prueba: inicial en cuadro) */}
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-tinta font-display text-lg font-extrabold text-esmeralda">
              {inicial}
            </span>
            <span className="hidden font-display text-base font-bold sm:block">{tienda.name}</span>
          </div>

          {/* Buscador */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ceniza" />
            <input
              value={buscar} onChange={(e) => setBuscar(e.target.value)}
              placeholder="Buscar producto..."
              className="w-full rounded-full border border-borde bg-humo py-2.5 pl-10 pr-4 text-sm outline-none transition-colors focus:border-esmeralda"
            />
          </div>

          {/* Filtros (móvil) */}
          <button onClick={() => setFiltrosAbiertos(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-borde bg-white text-tinta lg:hidden">
            <SlidersHorizontal size={17} />
          </button>

          {/* Carrito */}
          <button onClick={() => setCartAbierto(true)}
            className="relative flex h-10 items-center gap-2 rounded-full bg-tinta px-4 text-sm font-bold text-white transition-opacity hover:opacity-90">
            <ShoppingCart size={16} />
            <span className="hidden sm:block">Carrito</span>
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-esmeralda px-1 text-[11px] font-black text-tinta">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ═══ Encabezado de tienda ═══ */}
      <section className="border-b border-borde bg-white">
        <div className="mx-auto max-w-6xl px-6 py-8 text-center">
          {tienda.description_public && (
            <p className="mx-auto max-w-xl leading-relaxed text-ceniza">{tienda.description_public}</p>
          )}
          <div className="mt-5 flex justify-center gap-2.5">
            <RedSocial href={tienda.instagram_url}><Ico.instagram width={17} height={17} /></RedSocial>
            <RedSocial href={tienda.facebook_url}><Ico.facebook width={17} height={17} /></RedSocial>
            <RedSocial href={tienda.tiktok_url}><Ico.tiktok width={17} height={17} /></RedSocial>
            <RedSocial href={tienda.telegram_url}><Ico.telegram width={17} height={17} /></RedSocial>
            <RedSocial href={tienda.youtube_url}><Ico.youtube width={17} height={17} /></RedSocial>
          </div>
        </div>
      </section>

      {/* ═══ Cuerpo: sidebar filtros + grilla ═══ */}
      <div className="mx-auto flex max-w-6xl gap-8 px-6 py-8">
        {/* Sidebar filtros (escritorio) */}
        <aside className="hidden w-56 shrink-0 lg:block">
          <FiltrosPanel {...{ orden, setOrden, tallasDisponibles, tallasSel, setTallasSel }} />
        </aside>

        {/* Grilla */}
        <main className="flex-1">
          <div className="mb-5 flex items-center justify-between">
            <p className="text-sm text-ceniza">{filtrados.length} {filtrados.length === 1 ? 'producto' : 'productos'}</p>
          </div>

          {filtrados.length === 0 ? (
            <p className="py-16 text-center text-sm text-ceniza">
              {productos.length === 0 ? 'Esta tienda aún no tiene productos publicados.' : 'Sin resultados con esos filtros.'}
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {filtrados.map((p) => (
                <ProductoCard key={p.id} p={p} onAdd={agregar} hayWhatsapp={hayWhatsapp} />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* ═══ Footer ═══ */}
      <footer className="border-t border-borde py-6 text-center">
        <p className="text-xs text-ceniza">Catálogo hecho con <span className="font-semibold text-tinta">CatalogApp</span></p>
      </footer>

      {/* ═══ Drawer de filtros (móvil) ═══ */}
      {filtrosAbiertos && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setFiltrosAbiertos(false)} />
          <div className="absolute left-0 top-0 h-full w-72 overflow-y-auto bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Filtros</h2>
              <button onClick={() => setFiltrosAbiertos(false)}><X size={20} /></button>
            </div>
            <FiltrosPanel {...{ orden, setOrden, tallasDisponibles, tallasSel, setTallasSel }} />
          </div>
        </div>
      )}

      {/* ═══ Drawer del carrito ═══ */}
      {cartAbierto && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setCartAbierto(false)} />
          <div className="absolute right-0 top-0 flex h-full w-full max-w-sm flex-col bg-white">
            <div className="flex items-center justify-between border-b border-borde px-5 py-4">
              <h2 className="flex items-center gap-2 font-display text-lg font-bold">
                <ShoppingCart size={18} /> Tu pedido
              </h2>
              <button onClick={() => setCartAbierto(false)}><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {cart.length === 0 ? (
                <p className="py-16 text-center text-sm text-ceniza">Tu carrito está vacío.<br />Agrega productos para pedir.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {cart.map((it, idx) => (
                    <div key={idx} className="flex items-center gap-3 rounded-xl border border-borde p-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{it.name}</p>
                        {it.size && <p className="text-xs text-ceniza">Talla: {it.size}</p>}
                        <p className="text-sm font-bold text-tinta">{COP(it.price)}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => cambiarQty(idx, -1)} className="rounded-lg bg-humo p-1.5 hover:bg-borde"><Minus size={13} /></button>
                        <span className="w-5 text-center text-sm font-bold">{it.qty}</span>
                        <button onClick={() => cambiarQty(idx, 1)} className="rounded-lg bg-humo p-1.5 hover:bg-borde"><Plus size={13} /></button>
                      </div>
                      <button onClick={() => cambiarQty(idx, -it.qty)} className="text-ceniza hover:text-red-600"><Trash2 size={15} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t border-borde p-5">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm text-ceniza">Total</span>
                  <span className="font-display text-xl font-bold">{COP(cartTotal)}</span>
                </div>
                {hayWhatsapp ? (
                  <button onClick={pedirPorWhatsapp}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-esmeralda py-3.5 text-sm font-black text-tinta transition-all hover:brightness-105">
                    <Send size={15} /> Pedir por WhatsApp
                  </button>
                ) : (
                  <p className="text-center text-xs text-ceniza">Esta tienda no tiene WhatsApp configurado.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Panel de filtros reutilizable (sidebar y drawer) ── */
function FiltrosPanel({ orden, setOrden, tallasDisponibles, tallasSel, setTallasSel }) {
  function toggleTalla(t) {
    setTallasSel((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t])
  }
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-ceniza">
          <ArrowUpDown size={13} /> Ordenar por
        </p>
        <div className="flex flex-col gap-1">
          {Object.entries(ORDENES).map(([k, label]) => (
            <button key={k} onClick={() => setOrden(k)}
              className={`rounded-lg px-3 py-2 text-left text-sm transition-colors ${orden === k ? 'bg-tinta font-semibold text-white' : 'text-tinta hover:bg-humo'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {tallasDisponibles.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ceniza">Tallas</p>
          <div className="flex flex-wrap gap-2">
            {tallasDisponibles.map((t) => (
              <button key={t} onClick={() => toggleTalla(t)}
                className={`min-w-9 rounded-lg border px-2.5 py-1.5 text-sm font-semibold transition-colors ${
                  tallasSel.includes(t) ? 'border-esmeralda bg-esmeralda text-tinta' : 'border-borde bg-white text-tinta hover:border-tinta/40'
                }`}>
                {t}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Tarjeta de producto ── */
function ProductoCard({ p, onAdd, hayWhatsapp }) {
  const sizes = parseSizes(p.sizes)
  const agotado = p.stock <= 0
  const [sizeSel, setSizeSel] = useState(null)

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-borde bg-white transition-shadow hover:shadow-md">
      <div className="relative aspect-square bg-humo">
        {p.image_url ? (
          <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-display text-4xl font-extrabold text-borde">
            {p.name.charAt(0).toUpperCase()}
          </div>
        )}
        {agotado && (
          <span className="absolute left-2 top-2 rounded-full bg-tinta/85 px-2.5 py-1 text-[10px] font-bold text-white">Agotado</span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug">{p.name}</h3>
        <p className="mt-1 font-display text-base font-bold">{COP(p.price)}</p>

        {sizes.length > 0 && !agotado && (
          <div className="mt-2 flex flex-wrap gap-1">
            {sizes.map((t) => (
              <button key={t} onClick={() => setSizeSel(sizeSel === t ? null : t)}
                className={`min-w-7 rounded-md border px-1.5 py-0.5 text-xs font-semibold transition-colors ${
                  sizeSel === t ? 'border-esmeralda bg-esmeralda text-tinta' : 'border-borde text-ceniza hover:border-tinta/40'
                }`}>
                {t}
              </button>
            ))}
          </div>
        )}

        {hayWhatsapp && !agotado && (
          <button
            onClick={() => onAdd(p, sizeSel)}
            disabled={sizes.length > 0 && !sizeSel}
            className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-full bg-esmeralda py-2 text-xs font-bold text-tinta transition-all hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus size={13} />
            {sizes.length > 0 && !sizeSel ? 'Elige talla' : 'Agregar'}
          </button>
        )}
      </div>
    </div>
  )
}
