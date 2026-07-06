import { Eye, Pencil, Trash2 } from 'lucide-react'
import Switch from './Switch'

function Tooltip({ label, children }) {
  return (
    <div className="group/tooltip relative flex items-center">
      {children}
      <div className="pointer-events-none absolute top-full left-1/2 z-20 mt-2 -translate-x-1/2 opacity-0 transition-opacity duration-150 group-hover/tooltip:opacity-100">
        <span className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-tinta" />
        <span className="block whitespace-nowrap rounded-lg bg-tinta px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-lg">
          {label}
        </span>
      </div>
    </div>
  )
}

function RowActions({ onVer, estado, onEditar, onEliminar }) {
  return (
    <div className="flex items-center justify-end gap-1">
      {onVer && (
        <Tooltip label="Ver detalle">
          <button
            type="button"
            onClick={onVer}
            className="rounded-lg p-2 text-ceniza transition-colors hover:bg-humo hover:text-tinta"
          >
            <Eye size={15} />
          </button>
        </Tooltip>
      )}
      {estado && (
        <Tooltip label={estado.checked ? 'Desactivar' : 'Activar'}>
          <Switch checked={estado.checked} onChange={estado.onChange} />
        </Tooltip>
      )}
      {onEditar && (
        <Tooltip label="Editar">
          <button
            type="button"
            onClick={onEditar}
            className="rounded-lg p-2 text-ceniza transition-colors hover:bg-humo hover:text-tinta"
          >
            <Pencil size={15} />
          </button>
        </Tooltip>
      )}
      {onEliminar && (
        <Tooltip label="Eliminar">
          <button
            type="button"
            onClick={onEliminar}
            className="rounded-lg p-2 text-ceniza transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 size={15} />
          </button>
        </Tooltip>
      )}
    </div>
  )
}

export default RowActions
