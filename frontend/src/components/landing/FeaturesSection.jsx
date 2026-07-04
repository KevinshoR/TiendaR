import { Package, HandCoins, Receipt, BarChart3, ShieldCheck, Smartphone } from 'lucide-react'
import { useReveal, revealClass } from '../../hooks/useReveal'

const FEATURES = [
  {
    icon: Package,
    titulo: 'Inventario sin cuaderno',
    desc: 'Cada producto con su stock real. Te avisa qué se está acabando antes de que un cliente pregunte y no haya.',
  },
  {
    icon: HandCoins,
    titulo: 'El fiado, por fin bajo control',
    desc: 'Ventas a crédito con cliente y fecha de pago. Sabes exactamente quién te debe, cuánto y desde cuándo.',
  },
  {
    icon: Receipt,
    titulo: 'Ventas en segundos',
    desc: 'Buscas el producto, armas el carrito y listo. Contado o fiado, con IVA solo si tu negocio lo maneja.',
  },
  {
    icon: BarChart3,
    titulo: 'Números claros',
    desc: 'Cuánto vendiste hoy, cuánto en el mes, cuánto hay en la calle. El cierre del día se hace solo.',
  },
  {
    icon: ShieldCheck,
    titulo: 'Tu equipo, con límites',
    desc: 'El cajero vende, el contador solo mira los números. Cada quien ve lo suyo y nada más.',
  },
  {
    icon: Smartphone,
    titulo: 'Desde donde estés',
    desc: 'Funciona en el computador del mostrador, en la tablet o en tu celular desde la casa.',
  },
]

export default function FeaturesSection() {
  const [featRef, featV] = useReveal()

  return (
    <section ref={featRef} className="mx-auto max-w-6xl px-6 py-20">
      <div className={revealClass(featV)}>
        <h2 className="text-center font-display text-3xl font-extrabold sm:text-4xl">
          Todo lo que hoy llevas en la cabeza,
          <br />
          <span className="text-esmeralda">aquí queda anotado solo</span>
        </h2>
      </div>
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ icon: Icon, titulo, desc }, i) => (
          <div
            key={titulo}
            className={`rounded-2xl border border-borde bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${revealClass(featV)}`}
            style={{ transitionDelay: `${i * 80}ms` }}
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-esmeralda/10 text-esmeralda">
              <Icon size={19} />
            </span>
            <h3 className="mt-4 font-display text-lg font-bold">{titulo}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ceniza">{desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}