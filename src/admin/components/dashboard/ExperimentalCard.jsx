import { Clock3, User } from 'lucide-react'

export default function ExperimentalCard({
  aluno,
  idade,
  horario,
  professor
}) {
  return (
    <div
      className="
        rounded-3xl
        border
        border-neutral-200
        bg-white
        p-6
        hover:shadow-lg
        transition-all
      "
    >

      <div className="flex items-center justify-between">

        <div>

          <h3 className="font-semibold text-lg text-neutral-900">
            {aluno}
          </h3>

          <p className="text-sm text-neutral-500">
            {idade} anos
          </p>

        </div>

        <span
          className="
            rounded-full
            bg-inter-red/10
            px-4
            py-1
            text-xs
            font-semibold
            text-inter-red
          "
        >
          Hoje
        </span>

      </div>

      <div className="mt-6 space-y-3">

        <div className="flex items-center gap-2 text-sm text-neutral-600">
          <Clock3 size={16} />
          {horario}
        </div>

        <div className="flex items-center gap-2 text-sm text-neutral-600">
          <User size={16} />
          Professor {professor}
        </div>

      </div>

      <button
        className="
          w-full
          mt-6
          rounded-xl
          bg-inter-red
          py-3
          font-semibold
          text-white
          hover:bg-[#a80e24]
          transition-colors
        "
      >
        Abrir Lead
      </button>

    </div>
  )
}