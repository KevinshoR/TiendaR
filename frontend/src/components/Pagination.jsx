import { ChevronLeft, ChevronRight } from 'lucide-react'

function paginasVisibles(actual, total) {
  const delta = 1
  const rango = []
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= actual - delta && i <= actual + delta)) {
      rango.push(i)
    }
  }
  const conPuntos = []
  let anterior
  for (const i of rango) {
    if (anterior !== undefined && i - anterior > 1) conPuntos.push('...')
    conPuntos.push(i)
    anterior = i
  }
  return conPuntos
}

function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null
  const paginas = paginasVisibles(page, totalPages)

  return (
    <div className="mt-4 flex items-center justify-center gap-1.5">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label="Página anterior"
        className="rounded-lg border border-borde p-2 text-tinta transition-colors hover:bg-humo disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
      >
        <ChevronLeft size={16} />
      </button>

      {paginas.map((p, idx) =>
        p === '...' ? (
          <span key={`dots-${idx}`} className="px-1.5 text-sm text-ceniza">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            className={`min-w-[2.25rem] rounded-lg px-2.5 py-2 text-sm font-bold transition-colors ${
              p === page ? 'bg-tinta text-white' : 'text-tinta hover:bg-humo'
            }`}
          >
            {p}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Página siguiente"
        className="rounded-lg border border-borde p-2 text-tinta transition-colors hover:bg-humo disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  )
}

export default Pagination
