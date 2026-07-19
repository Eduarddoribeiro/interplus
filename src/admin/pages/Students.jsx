import SectionTitle from '../components/SectionTitle'
import { Search, Plus, Filter } from 'lucide-react'

export default function Students() {
  return (
    <div className="space-y-8">

      <SectionTitle
        title="Alunos"
        description="Gerencie todos os alunos desde o primeiro contato até a matrícula."
      />

      {/* Toolbar */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        <div className="relative flex-1">

          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
          />

          <input
            type="text"
            placeholder="Buscar aluno, responsável ou WhatsApp..."
            className="w-full rounded-xl border border-neutral-200 bg-white py-3 pl-11 pr-4 outline-none transition focus:border-inter-red"
          />

        </div>

        <div className="flex gap-3">

          <button className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-5 py-3 font-medium hover:bg-neutral-100">

            <Filter size={18} />

            Filtros

          </button>

          <button className="flex items-center gap-2 rounded-xl bg-inter-red px-5 py-3 font-semibold text-white shadow-lg hover:opacity-90">

            <Plus size={18} />

            Novo Contato

          </button>

        </div>

      </div>

      {/* Students */}

      <div className="space-y-5">

        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">

          <div className="flex items-start justify-between">

            <div>

              <h3 className="text-lg font-bold">
                João Pedro
              </h3>

              <p className="text-sm text-neutral-500">
                8 anos
              </p>

            </div>

            <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">

              Experimental Agendada

            </span>

          </div>

          <div className="mt-5 grid gap-3 text-sm text-neutral-600 lg:grid-cols-2">

            <p>
              👤 Responsável: Carlos Silva
            </p>

            <p>
              📱 (51) 99999-9999
            </p>

            <p>
              📍 Origem: Instagram
            </p>

            <p>
              ⚽ Experimental: 23/07 • 19:00
            </p>

          </div>

          <button className="mt-6 w-full rounded-xl border border-neutral-200 py-3 font-medium transition hover:bg-neutral-100">

            Abrir Ficha

          </button>

        </div>

      </div>

    </div>
  )
}