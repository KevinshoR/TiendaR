import { Link } from 'react-router-dom'
import { Check, ArrowRight, Package, Receipt, HandCoins, BarChart3, Users, Smartphone } from 'lucide-react'

/* ═══════════════════════════════════════════════════════════
   Landing CatalogApp — estilo SaaS clásico (referencia Stockify):
   copy a la izquierda + mockup laptop y celular a la derecha,
   checklist con checks verdes, secciones limpias. Con la cinta.
   Paleta: humo #F7F7F5, tinta #161616, ceniza, borde, esmeralda.
═══════════════════════════════════════════════════════════ */

/* ── Mini gráfica SVG para los mockups ── */
function MiniChart({ w = 220, h = 70 }) {
  return (
    <svg viewBox="0 0 220 70" style={{ width: w, height: h }} className="block">
      <polyline
        points="0,55 30,48 60,52 90,38 120,42 150,26 180,30 220,14"
        fill="none" stroke="#00C896" strokeWidth="3" strokeLinecap="round"
      />
      <polygon
        points="0,55 30,48 60,52 90,38 120,42 150,26 180,30 220,14 220,70 0,70"
        fill="#00C896" opacity="0.08"
      />
    </svg>
  )
}

/* ── Mockup: laptop con el panel ── */
function LaptopMock() {
  return (
    <div className="relative">
      {/* pantalla */}
      <div className="rounded-t-xl border-[10px] border-tinta bg-white shadow-2xl shadow-tinta/15">
        <div className="flex h-[300px] overflow-hidden rounded-t-sm sm:h-[330px]">
          {/* sidebar */}
          <div className="hidden w-[88px] shrink-0 flex-col gap-2 bg-tinta p-3 sm:flex">
            <span className="mb-2 flex h-7 w-7 items-center justify-center rounded-lg bg-esmeralda text-[10px] font-black text-tinta">C</span>
            {['Panel', 'Vender', 'Stock', 'Ventas', 'Clientes'].map((m, i) => (
              <span key={m} className={`rounded-md px-2 py-1.5 text-[9px] font-semibold ${i === 0 ? 'bg-white/15 text-white' : 'text-white/45'}`}>
                {m}
              </span>
            ))}
          </div>
          {/* contenido */}
          <div className="flex-1 bg-humo p-4">
            <p className="text-[10px] font-bold text-tinta">Hola, Don Pedro 👋</p>
            <div className="mt-2.5 grid grid-cols-3 gap-2">
              {[['HOY', '$202.500'], ['MES', '$4.1M'], ['POR COBRAR', '$486.000']].map(([l, v]) => (
                <div key={l} className="rounded-lg border border-borde bg-white px-2 py-1.5">
                  <p className="text-[7px] font-bold tracking-wide text-ceniza">{l}</p>
                  <p className="text-[10px] font-bold text-tinta">{v}</p>
                </div>
              ))}
            </div>
            <div className="mt-2.5 rounded-lg border border-borde bg-white p-2.5">
              <p className="mb-1 text-[8px] font-bold text-ceniza">VENTAS · ÚLTIMOS 7 DÍAS</p>
              <MiniChart w="100%" h={64} />
            </div>
            <div className="mt-2.5 rounded-lg border border-borde bg-white p-2.5">
              <p className="text-[8px] font-bold text-ceniza">POR REPONER</p>
              {[['Aceite 1L', '3'], ['Panela x24', '2']].map(([n, s]) => (
                <div key={n} className="mt-1 flex items-center justify-between">
                  <span className="text-[9px] font-medium text-tinta">{n}</span>
                  <span className="rounded-full bg-amber-100 px-1.5 text-[8px] font-bold text-amber-700">{s} und</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* base del portátil */}
      <div className="mx-auto h-3.5 w-[112%] -translate-x-[5.5%] rounded-b-xl bg-tinta" />
      <div className="mx-auto h-1 w-16 rounded-b-md bg-tinta/80" />

      {/* ── celular Android flotante ── */}
      <div className="absolute -bottom-8 -right-3 w-[124px] sm:-right-8 sm:w-[140px]">
        <div className="rounded-[1.6rem] border-[7px] border-tinta bg-white shadow-2xl shadow-tinta/25">
          <div className="overflow-hidden rounded-[1rem] bg-humo">
            <div className="flex items-center justify-between bg-tinta px-2.5 py-1.5">
              <span className="text-[8px] font-bold text-white">CatalogApp</span>
              <span className="h-1.5 w-1.5 rounded-full bg-esmeralda" />
            </div>
            <div className="p-2">
              <div className="rounded-md border border-borde bg-white px-1.5 py-1">
                <p className="text-[6px] font-bold text-ceniza">VENTAS HOY</p>
                <p className="text-[10px] font-black text-tinta">$202.500</p>
              </div>
              <div className="mt-1.5 rounded-md border border-borde bg-white p-1.5">
                <MiniChart w="100%" h={36} />
              </div>
              <button className="mt-1.5 w-full rounded-md bg-esmeralda py-1 text-[7px] font-black text-tinta">
                + Registrar venta
              </button>
            </div>
          </div>
        </div>
        <p className="mt-2 text-center text-[9px] font-bold text-ceniza">📱 También en Android</p>
      </div>
    </div>
  )
}

export default function Landing() {
  const features = [
    { icon: Package, t: 'Control de stock en tiempo real', d: 'Cada venta descuenta el inventario sola. Sabes qué tienes sin contar cajas.' },
    { icon: HandCoins, t: 'Fiados con nombre y fecha', d: 'Quién te debe, cuánto y desde cuándo. La plata en la calle, clara.' },
    { icon: Receipt, t: 'Ventas en segundos', d: 'Contado o crédito, con IVA solo si tu negocio lo maneja.' },
    { icon: BarChart3, t: 'Reportes y estadísticas', d: 'Ventas del día, del mes, producto más vendido. El cierre se hace solo.' },
    { icon: Users, t: 'Multi-usuario con roles', d: 'El cajero vende, el contador solo consulta. Cada quien lo suyo.' },
    { icon: Smartphone, t: 'En Android, vía APK', d: 'Instala la app en tu celular y maneja la tienda desde el bolsillo.' },
  ]

  return (
    <main className="min-h-screen bg-humo font-sans text-tinta antialiased">
      <style>{`
        @keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        .marquee-track { animation: marquee 22s linear infinite; }
      `}</style>

      {/* ═══ Navbar ═══ */}
      <header className="sticky top-0 z-50 border-b border-borde bg-humo/90 backdrop-blur-md">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-esmeralda font-display text-base font-extrabold text-tinta">C</span>
            <span className="font-display text-lg font-bold">CatalogApp</span>
          </span>
          <div className="hidden items-center gap-8 text-sm font-medium text-ceniza md:flex">
            <a href="#caracteristicas" className="transition-colors hover:text-tinta">Características</a>
            <a href="#como-funciona" className="transition-colors hover:text-tinta">Cómo funciona</a>
            <a href="#android" className="transition-colors hover:text-tinta">Android</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="hidden text-sm font-semibold text-ceniza transition-colors hover:text-tinta sm:block">
              Entrar
            </Link>
            <Link to="/registro" className="rounded-full bg-esmeralda px-5 py-2.5 text-sm font-bold text-tinta transition-all hover:brightness-105 hover:shadow-md hover:shadow-esmeralda/25">
              Comenzar gratis
            </Link>
          </div>
        </nav>
      </header>

      {/* ═══ La cinta ═══ */}
      <div className="overflow-hidden border-b border-borde bg-tinta py-2.5">
        <div className="marquee-track flex w-max items-center gap-9 text-[13px] font-medium tracking-wide text-white/85">
          {Array(2).fill(0).map((_, i) => (
            <div key={i} className="flex items-center gap-9">
              <span>Inventario</span><span className="text-esmeralda">★</span>
              <span>Ventas</span><span className="text-esmeralda">★</span>
              <span>Fiados</span><span className="text-esmeralda">★</span>
              <span>Cierre de caja</span><span className="text-esmeralda">★</span>
              <span>Tu equipo</span><span className="text-esmeralda">★</span>
              <span>Android</span><span className="text-esmeralda">★</span>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ Hero: copy izquierda + mockups derecha ═══ */}
      <section className="mx-auto grid max-w-6xl items-center gap-14 px-6 pb-24 pt-16 lg:grid-cols-[1fr_1.05fr] lg:pt-20">
        <div>
          <h1 className="font-display text-4xl font-extrabold leading-[1.12] tracking-tight sm:text-5xl">
            Control de tu tienda simple, potente y{' '}
            <span className="text-esmeralda">sin cuaderno</span>
          </h1>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-ceniza">
            Administra tus productos, stock, ventas y fiados en un solo lugar. Evita quiebres de
            stock y nunca pierdas de vista quién te debe.
          </p>

          <ul className="mt-7 flex flex-col gap-3">
            {[
              'Control de stock en tiempo real',
              'Alertas de productos por acabarse',
              'Fiados con nombre y fecha de pago',
              'Manéjalo desde tu Android con la APK',
            ].map((t) => (
              <li key={t} className="flex items-center gap-3 text-[15px] font-medium">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-esmeralda/15 text-esmeralda">
                  <Check size={11} strokeWidth={4} />
                </span>
                {t}
              </li>
            ))}
          </ul>

          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              to="/registro"
              className="inline-flex items-center gap-2 rounded-full bg-esmeralda px-7 py-3.5 text-sm font-bold text-tinta transition-all hover:brightness-105 hover:shadow-lg hover:shadow-esmeralda/25"
            >
              Comenzar gratis
              <ArrowRight size={15} strokeWidth={3} />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center rounded-full border border-borde bg-white px-7 py-3.5 text-sm font-bold text-tinta transition-colors hover:border-tinta/25"
            >
              Ya tengo cuenta
            </Link>
          </div>
        </div>

        <div className="pb-10">
          <LaptopMock />
        </div>
      </section>

      {/* ═══ Franja de confianza ═══ */}
      <section className="border-y border-borde bg-white py-6">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-ceniza">
            Hecho para tiendas · ferreterías · misceláneas · papelerías · ropa
          </p>
        </div>
      </section>

      {/* ═══ Características ═══ */}
      <section id="caracteristicas" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-24">
        <h2 className="text-center font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
          Todo tu negocio, <span className="text-esmeralda">en orden</span>
        </h2>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, t, d }) => (
            <div key={t} className="rounded-2xl border border-borde bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-tinta/5">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-esmeralda/12 text-esmeralda">
                <Icon size={19} />
              </span>
              <h3 className="mt-4 font-display text-lg font-bold">{t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ceniza">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ Cómo funciona ═══ */}
      <section id="como-funciona" className="scroll-mt-24 border-y border-borde bg-white py-24">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            Empiezas en <span className="text-esmeralda">tres pasos</span>
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {[
              ['1', 'Registra tu tienda', 'Dos minutos: nombre del negocio, tu correo y listo. Sin tarjeta de crédito.'],
              ['2', 'Carga tus productos', 'Nombre, precio y cuántos tienes. Empieza con los que más rotan.'],
              ['3', 'Vende', 'Cada venta queda registrada, el stock baja solo y el fiado queda anotado.'],
            ].map(([n, t, d]) => (
              <div key={n} className="rounded-2xl bg-humo p-7">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-esmeralda font-display text-base font-extrabold text-tinta">{n}</span>
                <h3 className="mt-4 font-display text-lg font-bold">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ceniza">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Android / APK ═══ */}
      <section id="android" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-24">
        <div className="grid items-center gap-10 rounded-3xl bg-tinta p-10 sm:p-14 lg:grid-cols-[1fr_auto]">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-esmeralda">📱 Para llevar</p>
            <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Tu tienda también vive
              <br />
              en tu <span className="text-esmeralda">Android</span>
            </h2>
            <p className="mt-4 max-w-md leading-relaxed text-white/60">
              Instala la aplicación en tu celular por medio de la APK y maneja ventas, inventario y
              fiados desde el bolsillo — en el mostrador o desde la casa.
            </p>
            <Link
              to="/registro"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-esmeralda px-7 py-3.5 text-sm font-bold text-tinta transition-all hover:brightness-105"
            >
              Crear mi tienda
              <ArrowRight size={15} strokeWidth={3} />
            </Link>
          </div>
          {/* mini celular decorativo */}
          <div className="mx-auto w-[150px]">
            <div className="rounded-[1.8rem] border-[7px] border-white/15 bg-white">
              <div className="overflow-hidden rounded-[1.2rem] bg-humo">
                <div className="flex items-center justify-between bg-tinta px-3 py-2">
                  <span className="text-[9px] font-bold text-white">CatalogApp</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-esmeralda" />
                </div>
                <div className="p-2.5">
                  <div className="rounded-lg border border-borde bg-white px-2 py-1.5">
                    <p className="text-[7px] font-bold text-ceniza">VENTAS HOY</p>
                    <p className="text-xs font-black text-tinta">$202.500</p>
                  </div>
                  <div className="mt-2 rounded-lg border border-borde bg-white p-2">
                    <MiniChart w="100%" h={42} />
                  </div>
                  <button className="mt-2 w-full rounded-lg bg-esmeralda py-1.5 text-[8px] font-black text-tinta">
                    + Registrar venta
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CTA final ═══ */}
      <section className="border-t border-borde bg-white py-24 text-center">
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            Hoy puede ser el último día que
            <br />
            cuadres caja <span className="text-esmeralda">a mano</span>
          </h2>
          <Link
            to="/registro"
            className="mt-9 inline-flex items-center gap-2 rounded-full bg-esmeralda px-8 py-4 text-sm font-bold text-tinta transition-all hover:brightness-105 hover:shadow-lg hover:shadow-esmeralda/25"
          >
            Comenzar gratis
            <ArrowRight size={15} strokeWidth={3} />
          </Link>
          <p className="mt-5 text-xs text-ceniza">Sin tarjeta de crédito · En pesos · En español</p>
        </div>
      </section>

      {/* ═══ Footer ═══ */}
      <footer className="border-t border-borde py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 text-xs text-ceniza sm:flex-row">
          <span>CatalogApp — parte de la suite JTool Enterprise</span>
          <span>Hecho en Medellín, Colombia</span>
        </div>
      </footer>
    </main>
  )
}