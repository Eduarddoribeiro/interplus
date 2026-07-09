import { Phone } from 'lucide-react'

export default function FollowUpCard({
  nome,
  observacao,
  data
}) {
  return (
    <div
      className="
        rounded-3xl
        border
        border-neutral-200
        bg-white
        p-6
      "
    >

      <div className="flex justify-between items-start">

        <div>

          <h3 className="font-semibold text-lg">
            {nome}
          </h3>

          <p className="text-sm text-neutral-500 mt-2">
            {observacao}
          </p>

        </div>

        <span className="text-xs text-neutral-400">
          {data}
        </span>

      </div>

      <button
        className="
          mt-6
          inline-flex
          items-center
          gap-2
          rounded-xl
          border
          border-neutral-200
          px-4
          py-2
          text-sm
          hover:border-inter-red
          hover:text-inter-red
          transition-colors
        "
      >
        <Phone size={15} />
        Abrir WhatsApp
      </button>

    </div>
  )
}