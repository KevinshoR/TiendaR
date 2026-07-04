import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useReveal, revealClass } from '../../hooks/useReveal'

export default function CTAFinalSection() {
  const [ctaRef, ctaV] = useReveal()

  return (
    <section ref={ctaRef} className="mx-auto max-w-4xl px-6 py-20 text-center">
      <div className={revealClass(ctaV)}>
        <h2 className="font-display text-3xl font-extrabold sm:text-4xl">
          El cuaderno se moja, se pierde
          <br />
          y no suma solo. <span className="text-esmeralda">Esto sí.</span>
        </h2>
        <p className="mx-auto mt-4 max-w-md text-ceniza">
          Crea tu tienda en dos minutos y registra tu primera venta hoy mismo.
        </p>
        <Link
          to="/registro"
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-esmeralda px-8 py-4 text-sm font-black text-tinta transition-all hover:brightness-110 hover:shadow-lg hover:shadow-esmeralda/25"
        >
          Crear mi tienda gratis
          <ArrowRight size={16} strokeWidth={3} />
        </Link>
      </div>
    </section>
  )
}