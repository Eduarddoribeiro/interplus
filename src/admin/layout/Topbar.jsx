export default function Topbar() {
  return (
    <header className="h-20 bg-white border-b border-neutral-200 flex items-center justify-between px-8">
      <div>
        <h2 className="text-2xl font-bold text-neutral-900">
          Bom dia, Eduardo 👋
        </h2>

        <p className="text-sm text-neutral-500 mt-1">
          Hoje você possui 3 experimentais e 2 retornos pendentes.
        </p>
      </div>

      <div className="w-11 h-11 rounded-full bg-inter-red text-white flex items-center justify-center font-bold">
        E
      </div>
    </header>
  )
}