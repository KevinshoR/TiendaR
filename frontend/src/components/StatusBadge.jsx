/*
 * Badge de estado único para todo el sistema: mismo fondo gris para todos los
 * estados, solo cambia el color (pastel) del texto según el estado.
 * Agrega aquí nuevos estados si el backend llega a introducirlos.
 */
const FONDO = '#6B7280'

const ESTADOS = {
  anulada: { label: 'Anulada', color: '#FFFFFF' },
  pendiente: { label: 'Pendiente', color: '#FDE68A' },
  pagada: { label: 'Pagada', color: '#A7F3D0' },
}

function StatusBadge({ status }) {
  const cfg = ESTADOS[status] || { label: status, color: '#E5E7EB' }
  return (
    <span
      className="inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold"
      style={{ backgroundColor: FONDO, color: cfg.color }}
    >
      {cfg.label}
    </span>
  )
}

export default StatusBadge
