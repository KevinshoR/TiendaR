import { Store, Wrench, ShoppingBag } from 'lucide-react'
import { useReveal, revealClass } from '../../hooks/useReveal'

const SEGMENTOS = [
  { icon: Store, t: 'Tiendas y minimercados', d: 'Mucho producto, mucho fiado, cero tiempo para cuadernos.' },
  { icon: Wrench, t: 'Ferreterías', d: 'Cientos de referencias que necesitan stock exacto.' },
  { icon: ShoppingBag, t: 'Ropa y misceláneas', d: 'Catálogo cambiante, ventas rápidas de mostrador.' },
]

export default function ParaQuienSection() {
  const [paraRef, paraV] = useReveal()

  return (
    <section ref={paraRef} className="border-y border-borde bg-white py-16">
      <div className={`mx-auto max-w-6xl px-6 ${revealClass(paraV)}`}>
        <p className="text-center text-xs font-bold uppercase tracking-widest text-ceniza">
          Hecho para negocios como el tuyo
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {SEGMENTOS.map(({ icon: Icon, t, d }) => (
            <div key={t} className="rounded-2xl border border-borde bg-humo p-6 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-tinta text-esmeralda">
                <Icon size={20} />
              </span>
              <p className="mt-4 font-display text-base font-bold">{t}</p>
              <p className="mt-1.5 text-sm text-ceniza">{d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}