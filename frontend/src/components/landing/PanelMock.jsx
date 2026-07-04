import { COP } from '../../utils/format'

const VENTAS_DEMO = [
  { hora: '9:12', cliente: 'Doña Marta', total: 38500, tipo: 'Contado' },
  { hora: '9:47', cliente: 'Don Jairo', total: 152000, tipo: 'Fiado', fiado: true },
  { hora: '10:05', cliente: 'Mostrador', total: 12000, tipo: 'Contado' },
]

const KPIS_DEMO = [
  { l: 'HOY', v: COP(202500) },
  { l: 'POR COBRAR', v: COP(486000), alerta: true },
  { l: 'STOCK BAJO', v: '3', alerta: true },
]

/** Mockup visual del panel de CatalogApp, mostrado en el hero de la landing. */
export default function PanelMock() {
  return (
    <div
      className="w-full max-w-md rounded-2xl border border-borde bg-white shadow-2xl shadow-tinta/10"
      style={{ animation: 'floatY 5s ease-in-out infinite' }}
    >
      {/* Chrome */}
      <div className="flex items-center justify-between border-b border-borde px-4 py-3">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-borde" />
          <span className="h-2.5 w-2.5 rounded-full bg-borde" />
          <span className="h-2.5 w-2.5 rounded-full bg-esmeralda" />
        </div>
        <span className="font-mono text-[10px] text-ceniza">catalogapp · tu tienda</span>
      </div>

      <div className="p-5">
        {/* KPIs */}
        <div className="grid grid-cols-3 gap-2.5">
          {KPIS_DEMO.map((k) => (
            <div key={k.l} className="rounded-xl bg-humo px-3 py-2.5">
              <p className="text-[9px] font-bold tracking-wide text-ceniza">{k.l}</p>
              <p className={`mt-0.5 font-display text-sm font-bold ${k.alerta ? 'text-amber-600' : 'text-tinta'}`}>
                {k.v}
              </p>
            </div>
          ))}
        </div>

        {/* Ventas */}
        <p className="mt-4 mb-2 text-[10px] font-bold uppercase tracking-wide text-ceniza">
          Ventas de hoy
        </p>
        <div className="flex flex-col gap-2">
          {VENTAS_DEMO.map((v) => (
            <div key={v.hora} className="flex items-center gap-3 rounded-xl border border-borde px-3 py-2">
              <span className="font-mono text-[10px] text-ceniza">{v.hora}</span>
              <span className="flex-1 truncate text-xs font-semibold text-tinta">{v.cliente}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                  v.fiado ? 'bg-amber-100 text-amber-700' : 'bg-esmeralda/10 text-esmeralda'
                }`}
              >
                {v.tipo}
              </span>
              <span className="font-mono text-xs font-bold text-tinta">{COP(v.total)}</span>
            </div>
          ))}
        </div>

        <button className="mt-4 w-full rounded-xl bg-esmeralda py-2.5 text-xs font-black text-tinta">
          + Registrar venta
        </button>
      </div>
    </div>
  )
}