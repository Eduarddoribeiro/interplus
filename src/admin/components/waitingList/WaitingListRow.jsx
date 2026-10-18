import { CalendarPlus, MessageCircle, MoreHorizontal, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { PREFERRED_SHIFT_LABELS } from "../../../constants/preferredShift";
import { WAITING_REASON_CARD_LABELS } from "../../../constants/waitingListReasons";
import { getInterestCategory } from "../../../helpers/waitingListRules";
import { getWaitingDays } from "../../../helpers/waitingListBoard";

function formatShortDate(value) {
  if (!value) return "";

  return new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}

/*
 * Linha compacta da lista de interesse.
 */
export default function WaitingListRow({
  contact,
  canSchedule,
  onWhatsApp,
  onSchedule,
  onQualify,
  onClose,
}) {
  const navigate = useNavigate();

  const category = getInterestCategory(contact);
  const days = getWaitingDays(contact);

  return (
    <div className="flex flex-col gap-3 border-b border-neutral-100 px-4 py-3 last:border-b-0 lg:flex-row lg:items-center">
      {/* QUEM */}
      <button
        type="button"
        onClick={() => navigate(`/admin/contacts/${contact.id}`)}
        className="min-w-0 text-left lg:w-64"
      >
        <p className="truncate font-semibold text-neutral-900 hover:underline">
          {contact.child_name || "Sem nome"}
        </p>

        <p className="truncate text-xs text-neutral-500">
          {contact.responsible_name || "Responsável não informado"}
        </p>
      </button>

      {/* O QUE QUER */}
      <div className="flex flex-1 flex-wrap items-center gap-1.5 text-xs">
        <span className="rounded-md bg-red-50 px-2 py-1 font-semibold text-red-700">
          {category?.name ?? "Sem categoria"}
        </span>

        <span className="rounded-md bg-neutral-100 px-2 py-1 font-medium text-neutral-700">
          {contact.location?.name ?? "Qualquer local"}
        </span>

        {contact.preferred_shift && contact.preferred_shift !== "any" && (
          <span className="rounded-md bg-neutral-100 px-2 py-1 font-medium text-neutral-700">
            {PREFERRED_SHIFT_LABELS[contact.preferred_shift]}
          </span>
        )}

        {contact.waiting_list_reason && (
          <span className="rounded-md px-2 py-1 text-neutral-500">
            {WAITING_REASON_CARD_LABELS[contact.waiting_list_reason] ??
              contact.waiting_list_reason}
          </span>
        )}
      </div>

      {/* HÁ QUANTO TEMPO */}
      <div className="text-xs lg:w-36 lg:text-right">
        {days !== null && (
          <p
            className={`font-semibold ${
              days > 60 ? "text-amber-700" : "text-neutral-700"
            }`}
          >
            {days === 0 ? "Entrou hoje" : `Espera há ${days} dia${days === 1 ? "" : "s"}`}
          </p>
        )}

        {contact.waiting_list_contacted_at && (
          <p className="text-green-700">
            Chamado em {formatShortDate(contact.waiting_list_contacted_at)}
          </p>
        )}
      </div>

      {/* AÇÕES */}
      <div className="flex flex-wrap gap-2 lg:justify-end">
        {contact.phone && (
          <button
            type="button"
            onClick={() => onWhatsApp(contact)}
            className="flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs font-semibold text-green-800 hover:bg-green-100"
          >
            <MessageCircle size={15} />
            WhatsApp
          </button>
        )}

        {canSchedule && (
          <button
            type="button"
            onClick={() => onSchedule(contact)}
            className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700"
          >
            <CalendarPlus size={15} />
            Agendar
          </button>
        )}

        <button
          type="button"
          onClick={() => onQualify(contact)}
          title="Completar cadastro / preferências"
          className="flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
        >
          <MoreHorizontal size={15} />
          Editar
        </button>

        <button
          type="button"
          onClick={() => onClose(contact)}
          title="Encerrar"
          className="flex items-center rounded-lg border border-neutral-200 px-2.5 py-2 text-neutral-500 hover:bg-neutral-50"
        >
          <XCircle size={15} />
        </button>
      </div>
    </div>
  );
}
