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

function DetailModal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white">
        <div className="flex shrink-0 items-center justify-between border-b border-borde px-6 py-4">
          <h2 className="font-display text-lg font-bold text-tinta">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-ceniza hover:bg-humo hover:text-tinta">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="flex flex-col gap-4">{children}</div>
        </div>
      </div>
    </div>
  )
}

export default DetailModal
