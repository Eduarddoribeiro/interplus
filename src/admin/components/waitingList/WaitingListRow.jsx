import { CalendarPlus, MessageCircle, Pencil, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button, urgencyRail } from "../../ui";

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

  const wants = [
    category?.name ?? "Sem categoria",
    contact.location?.name ?? "qualquer local",
    contact.preferred_shift && contact.preferred_shift !== "any"
      ? PREFERRED_SHIFT_LABELS[contact.preferred_shift]?.toLowerCase()
      : null,
  ].filter(Boolean);

  const reason = contact.waiting_list_reason
    ? WAITING_REASON_CARD_LABELS[contact.waiting_list_reason] ?? contact.waiting_list_reason
    : null;

  const longWait = days !== null && days > 60;

  return (
    <div
      className={`grid gap-x-4 gap-y-2 border-b border-line px-4 py-3 last:border-b-0 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1.4fr)_9rem_auto] lg:items-center ${urgencyRail(longWait ? "attention" : undefined)}`}
    >
      {/* QUEM */}
      <button
        type="button"
        onClick={() => navigate(`/admin/contacts/${contact.id}`)}
        className="min-w-0 text-left"
      >
        <span className="block truncate font-semibold hover:underline">
          {contact.child_name || "Sem nome"}
        </span>

        <span className="block truncate text-sm text-muted">
          {contact.responsible_name || "Responsável não informado"}
        </span>
      </button>

      {/* O QUE QUER */}
      <p className="text-sm">
        {wants.join(", ")}
        {reason && <span className="block text-muted">{reason}</span>}
      </p>

      {/* HÁ QUANTO TEMPO */}
      <p className="text-sm">
        {days !== null && (
          <span className={longWait ? "text-attention-text" : "text-muted"}>
            {days === 0 ? "Entrou hoje" : `Espera há ${days} dia${days === 1 ? "" : "s"}`}
          </span>
        )}

        {contact.waiting_list_contacted_at && (
          <span className="block text-ok">
            Chamado em {formatShortDate(contact.waiting_list_contacted_at)}
          </span>
        )}
      </p>

      {/* AÇÕES */}
      <div className="flex flex-wrap items-center gap-2 lg:justify-end">
        {contact.phone && (
          <button
            type="button"
            onClick={() => onWhatsApp(contact)}
            aria-label={`WhatsApp de ${contact.responsible_name || contact.child_name || "contato"}`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line text-whatsapp hover:border-whatsapp"
          >
            <MessageCircle size={17} aria-hidden="true" />
          </button>
        )}

        {canSchedule && (
          <Button size="sm" onClick={() => onSchedule(contact)}>
            <CalendarPlus size={16} aria-hidden="true" />
            Agendar
          </Button>
        )}

        <Button
          size="sm"
          variant="quiet"
          onClick={() => onQualify(contact)}
          aria-label="Editar cadastro e preferências"
          title="Editar cadastro e preferências"
        >
          <Pencil size={16} aria-hidden="true" />
        </Button>

        <Button
          size="sm"
          variant="quiet"
          onClick={() => onClose(contact)}
          aria-label="Encerrar"
          title="Encerrar"
        >
          <XCircle size={16} aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
