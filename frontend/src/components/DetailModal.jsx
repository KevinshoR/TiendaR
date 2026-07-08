import { X } from 'lucide-react'

export function Campo({ label, value }) {
  const mostrar = value === null || value === undefined || value === '' ? '—' : value
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ceniza">{label}</p>
      <p className="text-sm text-tinta">{mostrar}</p>
    </div>
  )
}

export function InfoCard({ icon: Icon, label, valor }) {
  return (
    <div className="min-w-0 rounded-xl border border-borde bg-humo/40 p-3">
      <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-ceniza">
        <Icon size={11} /> {label}
      </div>
      <p className="break-words text-sm font-semibold text-tinta">{valor}</p>
    </div>
  )
}

function DetailModal({ kicker, title, onClose, children, maxWidth = 'max-w-2xl' }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className={`flex max-h-[92vh] w-full ${maxWidth} flex-col overflow-hidden rounded-2xl bg-white`}>
        <div className="flex items-center justify-between border-b border-borde bg-tinta px-7 py-5 text-white">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-esmeralda">{kicker}</p>
            <h2 className="mt-0.5 font-display text-lg font-bold">{title}</h2>
          </div>
          <button type="button" onClick={onClose} className="text-white/60 hover:text-white">
            <X size={22} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-7">{children}</div>
      </div>
    </div>
  )
}

export default DetailModal
