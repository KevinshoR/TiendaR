import { ArrowUpDown, ChevronDown } from 'lucide-react'

/*
 * Selector de orden reutilizable: mismo look en Inventario, Ventas y Clientes.
 */
function SortSelect({ value, onChange, options }) {
  return (
    <div className="relative">
      <ArrowUpDown size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ceniza" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none rounded-xl border border-borde bg-white py-2.5 pl-9 pr-8 text-sm outline-none focus:border-esmeralda"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ceniza" />
    </div>
  )
}

export default SortSelect
