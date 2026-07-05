import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Search, MessageCircle, Send, Store, Globe, Music2, Play } from 'lucide-react'
import api from '../../services/api'

/* ═══════════════════════════════════════════════════════════
   Tienda pública (/tienda/:slug) — catálogo de exhibición.
   Sin login. Muestra productos visibles y botón de pedido por
   WhatsApp. Mobile-first (la mayoría entra desde el celular).
═══════════════════════════════════════════════════════════ */

const COP = (v) => `$${Number(v || 0).toLocaleString('es-CO')}`

/* wa.me necesita el número sin + ni espacios */
function waLink(whatsapp, texto) {
  const num = String(whatsapp).replace(/\D/g, '')
  return `https://wa.me/${num}?text=${encodeURIComponent(texto)}`
}

/* Icono de TikTok (lucide no lo trae) */
function TikTok({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M16.6 5.82a4.28 4.28 0 0 1-1.05-2.82h-3.2v12.9a2.4 2.4 0 1 1-2.4-2.4c.2 0 .4.03.6.08V8.3a5.7 5.7 0 0 0-.6-.03A5.63 5.63 0 1 0 15.6 13.5V8.3a7.5 7.5 0 0 0 4.4 1.4V6.5a4.28 4.28 0 0 1-3.4-.68z" />
    </svg>
  )
}

function RedSocial({ href, children }) {
  if (!href) return null
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex h-11 w-11 items-center justify-center rounded-full border border-borde bg-white text-tinta transition-all hover:-translate-y-0.5 hover:border-esmeralda hover:text-esmeralda"
    >
      {children}
    </a>
  )
}

export default function TiendaPublica() {
  const { slug } = useParams()
  const [tienda, setTienda] = useState(null)
  const [productos, setProductos] = useState([])
  const [estado, setEstado] = useState('cargando') // cargando | ok | noexiste
  const [buscar, setBuscar] = useState('')

  useEffect(() => {
    Promise.all([
      api.get(`/public/store/${slug}`),
      api.get(`/public/store/${slug}/products`),
    ])
      .then(([s, p]) => {
        setTienda(s.data)
        setProductos(p.data)
        setEstado('ok')
      })
      .catch(() => setEstado('noexiste'))
  }, [slug])

  const filtrados = useMemo(() => {
    const q = buscar.trim().toLowerCase()
    if (!q) return productos
    return productos.filter((p) => p.name.toLowerCase().includes(q))
  }, [productos, buscar])

  if (estado === 'cargando') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-humo">
        <p className="text-sm text-ceniza">Cargando tienda...</p>
      </div>
    )
  }

  if (estado === 'noexiste') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-humo px-6 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-tinta text-esmeralda">
          <Store size={26} />
        </span>
        <h1 className="font-display text-2xl font-bold text-tinta">Tienda no encontrada</h1>
        <p className="text-sm text-ceniza">El enlace no corresponde a ninguna tienda activa.</p>
      </div>
    )
  }

  const inicial = tienda.name.charAt(0).toUpperCase()
  const hayWhatsapp = !!tienda.whatsapp

  return (
    <div className="min-h-screen bg-humo font-sans text-tinta antialiased">
      {/* ═══ Encabezado de la tienda ═══ */}
      <header className="border-b border-borde bg-white">
        <div className="mx-auto max-w-4xl px-6 py-10 text-center sm:py-14">
          {/* Espacio del logo (por ahora la inicial; el logo real viene en otra fase) */}
          <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-tinta font-display text-3xl font-extrabold text-esmeralda">
            {inicial}
          </span>
          <h1 className="mt-5 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            {tienda.name}
          </h1>
          {tienda.description_public && (
            <p className="mx-auto mt-3 max-w-md leading-relaxed text-ceniza">
              {tienda.description_public}
            </p>
          )}

          {/* Redes */}
          <div className="mt-6 flex justify-center gap-3">
            <RedSocial href={tienda.instagram_url}><Globe size={18} /></RedSocial>
            <RedSocial href={tienda.facebook_url}><Globe size={18} /></RedSocial>
            <RedSocial href={tienda.tiktok_url}><Music2 size={18} /></RedSocial>
            <RedSocial href={tienda.telegram_url}><Send size={18} /></RedSocial>
            <RedSocial href={tienda.youtube_url}><Play size={18} /></RedSocial>
          </div>
        </div>
      </header>

      {/* ═══ Buscador ═══ */}
      <div className="sticky top-0 z-20 border-b border-borde bg-humo/95 backdrop-blur-md">
        <div className="mx-auto max-w-4xl px-6 py-4">
          <div className="relative">
            <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-ceniza" />
            <input
              value={buscar}
              onChange={(e) => setBuscar(e.target.value)}
              placeholder="Buscar producto..."
              className="w-full rounded-full border border-borde bg-white py-3 pl-11 pr-4 text-sm outline-none transition-colors focus:border-esmeralda"
            />
          </div>
        </div>
      </div>

      {/* ═══ Grilla de productos ═══ */}
      <main className="mx-auto max-w-4xl px-6 py-8">
        {filtrados.length === 0 ? (
          <p className="py-16 text-center text-sm text-ceniza">
            {productos.length === 0 ? 'Esta tienda aún no tiene productos publicados.' : 'Sin resultados para tu búsqueda.'}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {filtrados.map((p) => {
              const agotado = p.stock <= 0
              return (
                <div key={p.id} className="flex flex-col overflow-hidden rounded-2xl border border-borde bg-white">
                  {/* Imagen */}
                  <div className="relative aspect-square bg-humo">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center font-display text-4xl font-extrabold text-borde">
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {agotado && (
                      <span className="absolute left-2 top-2 rounded-full bg-tinta/85 px-2.5 py-1 text-[10px] font-bold text-white">
                        Agotado
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex flex-1 flex-col p-3">
                    <h3 className="line-clamp-2 text-sm font-semibold leading-snug">{p.name}</h3>
                    <p className="mt-1 font-display text-base font-bold text-tinta">{COP(p.price)}</p>

                    {hayWhatsapp && !agotado && (
                      <a
                        href={waLink(
                          tienda.whatsapp,
                          `¡Hola! Me interesa ${p.name} (${COP(p.price)}) de ${tienda.name}`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-full bg-esmeralda py-2 text-xs font-bold text-tinta transition-all hover:brightness-105"
                      >
                        <MessageCircle size={13} />
                        Pedir
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* ═══ Botón flotante de WhatsApp ═══ */}
      {hayWhatsapp && (
        <a
          href={waLink(tienda.whatsapp, `¡Hola ${tienda.name}! Quisiera hacer un pedido.`)}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-5 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-esmeralda text-tinta shadow-lg shadow-esmeralda/30 transition-transform hover:scale-110"
          aria-label="Contactar por WhatsApp"
        >
          <MessageCircle size={24} />
        </a>
      )}

      {/* ═══ Footer ═══ */}
      <footer className="border-t border-borde py-6 text-center">
        <p className="text-xs text-ceniza">
          Catálogo hecho con <span className="font-semibold text-tinta">CatalogApp</span>
        </p>
      </footer>
    </div>
  )
}
