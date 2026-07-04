import { useReveal, revealClass } from '../../hooks/useReveal'

const PASOS = [
  { n: '1', t: 'Registra tu tienda', d: 'Dos minutos: nombre del negocio, tu correo y listo. Sin tarjeta.' },
  { n: '2', t: 'Carga tus productos', d: 'Nombre, precio y cuántos tienes. Empieza con los que más rotan.' },
  { n: '3', t: 'Vende y deja el cuaderno', d: 'Cada venta queda registrada, el stock se descuenta solo y el fiado queda anotado.' },
]

export default function ComoFuncionaSection() {
  const [pasosRef, pasosV] = useReveal()

  return (
    <section ref={pasosRef} className="bg-tinta py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className={revealClass(pasosV)}>
          <h2 className="text-center font-display text-3xl font-extrabold text-white sm:text-4xl">
            Empiezas hoy, <span className="text-esmeralda">en serio</span>
          </h2>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {PASOS.map((p, i) => (
            <div
              key={p.n}
              className={`rounded-2xl border border-white/10 bg-white/5 p-7 ${revealClass(pasosV)}`}
              style={{ transitionDelay: `${i * 120}ms` }}
            >
              <span className="font-mono text-3xl font-black text-esmeralda/50">{p.n}</span>
              <h3 className="mt-3 font-display text-lg font-bold text-white">{p.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/55">{p.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}