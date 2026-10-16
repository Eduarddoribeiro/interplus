import {
  Clock3,
  User,
  MessageCircle,
  CalendarCheck,
} from "lucide-react";

function calculateAge(birthDate) {
  if (!birthDate) return null;

  const birth = new Date(`${birthDate}T00:00:00`);
  const today = new Date();

  let age = today.getFullYear() - birth.getFullYear();

  const monthDifference =
    today.getMonth() - birth.getMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 &&
      today.getDate() < birth.getDate())
  ) {
    age--;
  }

  return age;
}

function formatTime(time) {
  if (!time) return "Horário não informado";

  return time.slice(0, 5);
}

function getStatusInfo(status) {
  const statuses = {
    pending_confirmation: {
      label: "Aguardando confirmação",
      className:
        "bg-amber-50 text-amber-700 border-amber-200",
    },

    confirmed: {
      label: "Confirmado",
      className:
        "bg-blue-50 text-blue-700 border-blue-200",
    },

    attended: {
      label: "Compareceu",
      className:
        "bg-green-50 text-green-700 border-green-200",
    },

    no_show: {
      label: "Não compareceu",
      className:
        "bg-red-50 text-red-700 border-red-200",
    },
  };

  return (
    statuses[status] || {
      label: status || "Sem status",
      className:
        "bg-neutral-50 text-neutral-600 border-neutral-200",
    }
  );
}

export default function ExperimentalCard({
  child_name,
  birth_date,
  responsible_name,
  phone,
  status,
  experimental_time,
  category,
}) {
  const age = calculateAge(birth_date);
  const statusInfo = getStatusInfo(status);

  function openWhatsApp() {
    if (!phone) return;

    const cleanPhone = phone.replace(/\D/g, "");

    const phoneWithCountry =
      cleanPhone.startsWith("55")
        ? cleanPhone
        : `55${cleanPhone}`;

    window.open(
      `https://wa.me/${phoneWithCountry}`,
      "_blank"
    );
  }

  return (
    <div
      className="
        rounded-3xl
        border
        border-neutral-200
        bg-white
        p-6
        transition-all
        hover:shadow-lg
      "
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-neutral-900">
            {child_name}
          </h3>

          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-neutral-500">
            {category?.name && (
              <span className="font-medium text-neutral-700">
                {category.name}
              </span>
            )}

            {category?.name && age !== null && (
              <span>•</span>
            )}

            {age !== null && (
              <span>{age} anos</span>
            )}
          </div>
        </div>

        <span
          className={`
            rounded-full
            border
            px-3
            py-1
            text-xs
            font-semibold
            ${statusInfo.className}
          `}
        >
          {statusInfo.label}
        </span>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
            Horário
          </p>

          <div className="mt-1 flex items-center gap-2 text-sm font-semibold text-neutral-800">
            <Clock3 size={16} />
            {formatTime(experimental_time)}
          </div>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
            Responsável
          </p>

          <div className="mt-1 flex items-center gap-2 text-sm font-semibold text-neutral-800">
            <User size={16} />
            {responsible_name || "Não informado"}
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={openWhatsApp}
          disabled={!phone}
          className="
            flex
            items-center
            justify-center
            gap-2
            rounded-xl
            border
            border-neutral-200
            px-4
            py-3
            text-sm
            font-semibold
            transition-colors
            hover:bg-neutral-50
            disabled:cursor-not-allowed
            disabled:opacity-40
          "
        >
          <MessageCircle size={17} />
          WhatsApp
        </button>

        <button
          type="button"
          className="
            flex
            flex-1
            items-center
            justify-center
            gap-2
            rounded-xl
            bg-inter-red
            px-4
            py-3
            text-sm
            font-semibold
            text-white
            transition-colors
            hover:bg-[#a80e24]
          "
        >
          <CalendarCheck size={17} />
          Abrir contato
        </button>
      </div>
    </div>
  );
}