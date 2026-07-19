export default function ContactCard({ contact }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">

      <div className="flex items-start justify-between">

        <div>

          <h3 className="text-lg font-bold">
            {contact.child_name}
          </h3>

          <p className="text-sm text-neutral-500">
            Responsável: {contact.responsible_name}
          </p>

        </div>

        <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
          {contact.status}
        </span>

      </div>

      <div className="mt-5 grid gap-3 text-sm text-neutral-600 lg:grid-cols-2">

        <p>📱 {contact.phone}</p>

        <p>📍 {contact.source || '-'}</p>

        <p>🏠 {contact.neighborhood || '-'}</p>

        <p>
          ⚽ {contact.experimental_date
            ? `${contact.experimental_date} • ${contact.experimental_time ?? ''}`
            : 'Sem experimental'}
        </p>

      </div>

      <button
        className="mt-6 w-full rounded-xl border border-neutral-200 py-3 font-medium hover:bg-neutral-100"
      >
        Abrir Ficha
      </button>

    </div>
  )
}