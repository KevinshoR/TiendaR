import { Link } from 'react-router-dom'
import { Check, ArrowRight } from 'lucide-react'
import { useReveal } from '../../hooks/useReveal'
import PanelMock from './PanelMock'

const BULLETS = ['Sin tarjeta de crédito', 'En español', 'Precios en pesos']

export default function Hero() {
  const [heroRef] = useReveal(0.05)

  return (
    <section ref={heroRef} className="mx-auto max-w-6xl px-6 pb-20 pt-16 lg:pt-24">
      <div className="grid items-center gap-14 lg:grid-cols-[1.1fr_1fr]">
        <div style={{ animation: 'fadeUp .8s ease both' }}>
          <span className="inline-flex items-center gap-2 rounded-full border border-esmeralda/30 bg-esmeralda/10 px-4 py-1.5 text-xs font-bold text-tinta">
            <span className="h-1.5 w-1.5 rounded-full bg-esmeralda" />
            Para tiendas, ferreterías y comercios de barrio
          </span>

          <h1 className="mt-6 font-display text-[2.6rem] font-extrabold leading-[1.06] tracking-tight sm:text-6xl">
            Tu tienda completa.
            <br />
            Sin cuaderno.
            <br />
            <span className="text-esmeralda">Sin enredos.</span>
          </h1>

          <p className="mt-6 max-w-md text-lg leading-relaxed text-ceniza">
            Inventario, ventas, fiados y números claros en un solo lugar. Hecho para el comercio
            colombiano que lleva las cuentas a punta de memoria.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/registro"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-esmeralda px-7 py-4 text-sm font-black text-tinta transition-all hover:brightness-110 hover:shadow-lg hover:shadow-esmeralda/25"
            >
              Crear mi tienda gratis
              <ArrowRight size={16} strokeWidth={3} />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-xl border border-borde bg-white px-7 py-4 text-sm font-bold text-tinta transition-colors hover:border-tinta/30"
            >
              Ya tengo cuenta
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap gap-x-7 gap-y-2.5">
            {BULLETS.map((t) => (
              <span key={t} className="flex items-center gap-2 text-xs font-semibold text-ceniza">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-esmeralda/15 text-esmeralda">
                  <Check size={9} strokeWidth={4} />
                </span>
                {t}
              </span>
            ))}
          </div>
        </div>

        <div className="hidden justify-center lg:flex" style={{ animation: 'fadeUp .8s .2s ease both' }}>
          <PanelMock />
        </div>
      </div>
    </section>
  )
}