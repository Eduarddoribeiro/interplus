import { Search, Filter, Plus } from 'lucide-react'

export default function ContactFilters({ onNewContact }) {
  return (

    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

      <div className="relative flex-1">

        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
        />

        <input
          type="text"
          placeholder="Buscar criança, responsável ou WhatsApp..."
          className="w-full rounded-xl border border-neutral-200 bg-white py-3 pl-11 pr-4 focus:border-inter-red outline-none"
        />

      </div>

      <div className="flex gap-3">

        <button className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-5 py-3">
          <Filter size={18}/>
          Filtros
        </button>

        <button
          onClick={onNewContact}
          className="flex items-center gap-2 rounded-xl bg-inter-red px-5 py-3 text-white font-semibold"
        >
          <Plus size={18}/>
          Novo Contato
        </button>

      </div>

    </div>

  )
}