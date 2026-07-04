export default function Footer() {
  return (
    <footer className="border-t border-borde bg-white py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
        <span className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-tinta font-display text-xs font-extrabold text-esmeralda">
            C
          </span>
          <span className="text-sm font-bold">CatalogApp</span>
          <span className="text-xs text-ceniza">· parte de la suite JTool Enterprise</span>
        </span>
        <p className="text-xs text-ceniza">Hecho en Medellín, Colombia 🇨🇴</p>
      </div>
    </footer>
  )
}