const STATUS_CONFIG = {
  new_contact: {
    label: "Novo contato",
    classes: "bg-yellow-100 text-yellow-700",
  },
  experimental_scheduled: {
    label: "Experimental agendada",
    classes: "bg-blue-100 text-blue-700",
  },
  experimental_completed: {
    label: "Experimental realizada",
    classes: "bg-purple-100 text-purple-700",
  },
  waiting_follow_up: {
    label: "Aguardando retorno",
    classes: "bg-orange-100 text-orange-700",
  },
  enrolled: {
    label: "Matriculado",
    classes: "bg-green-100 text-green-700",
  },
  lost: {
    label: "Perdido",
    classes: "bg-red-100 text-red-700",
  },
};

export default function ContactCard({ contact }) {
  const status =
    STATUS_CONFIG[contact.status] ?? {
      label: contact.status,
      classes: "bg-neutral-100 text-neutral-700",
    };

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:shadow-md">

      <div className="flex items-start justify-between">

        <div>
          <h3 className="text-xl font-bold text-neutral-900">
            {contact.child_name}
          </h3>

          <p className="mt-1 text-sm text-neutral-500">
            Responsável: {contact.responsible_name}
          </p>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${status.classes}`}
        >
          {status.label}
        </span>

      </div>

      <div className="mt-6 grid gap-3 text-sm text-neutral-600 md:grid-cols-2">

        <p>
          <span className="font-medium text-neutral-800">
            WhatsApp:
          </span>{" "}
          {contact.phone}
        </p>

        <p>
          <span className="font-medium text-neutral-800">
            Origem:
          </span>{" "}
          {contact.source || "-"}
        </p>

        <p>
          <span className="font-medium text-neutral-800">
            Bairro:
          </span>{" "}
          {contact.neighborhood || "-"}
        </p>

        <p>
          <span className="font-medium text-neutral-800">
            Experimental:
          </span>{" "}
          {contact.experimental_date
            ? `${contact.experimental_date}${
                contact.experimental_time
                  ? ` • ${contact.experimental_time}`
                  : ""
              }`
            : "Não agendada"}
        </p>

      </div>

      <button
        className="mt-6 w-full rounded-xl border border-neutral-200 py-3 font-medium transition hover:bg-neutral-100"
      >
        Abrir ficha →
      </button>

    </div>
  );
}