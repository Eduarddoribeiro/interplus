import {
  MessageCircle,
  UserCheck,
  UserX,
  GraduationCap,
  PhoneCall,
  XCircle,
  CalendarPlus,
  CalendarClock,
  ArchiveX,
} from "lucide-react";

import { getLostReasonLabel } from "../../../constants/lostReasons";
import { formatShortDate } from "../../../helpers/experimentalDates";

export function NoShowActions({
  contact,
  whatsappUrl,
  onReschedule,
  onScheduleFollowUp,
  onCloseOpportunity,
}) {
  if (contact.status === "lost") {
    return (
      <div className="w-full">
        <div className="flex items-center gap-2 text-sm font-semibold text-red-600">
          <UserX size={17} />
          Ausência registrada.
        </div>

        <div className="mt-4 rounded-lg border border-line bg-canvas p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <ArchiveX
              size={20}
              className="mt-0.5 shrink-0 text-muted"
            />

            <div>
              <p className="font-semibold text-ink">
                Contato encerrado
              </p>

              <p className="mt-1 text-sm text-muted">
                A família não vai seguir
                no acompanhamento.
              </p>

              {contact.lost_reason && (
                <p className="mt-2 text-sm text-neutral-600">
                  Motivo:{" "}
                  <strong>
                    {getLostReasonLabel(
                      contact.lost_reason
                    )}
                  </strong>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (
    contact.status === "follow_up" &&
    contact.follow_up_date
  ) {
    return (
      <div className="w-full">
        <div className="flex items-center gap-2 text-sm font-semibold text-red-600">
          <UserX size={17} />
          Ausência registrada.
        </div>

        <div className="mt-4 rounded-lg border border-line bg-white p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <CalendarClock
              size={20}
              className="mt-0.5 shrink-0 text-ink"
            />

            <div className="min-w-0 flex-1">
              <p className="font-semibold text-ink">
                Retorno programado
              </p>

              <p className="mt-1 text-sm text-ink">
                Próximo contato:{" "}
                <strong>
                  {formatShortDate(
                    contact.follow_up_date
                  )}
                </strong>
              </p>
            </div>
          </div>

          <NoShowActionButtons
            whatsappUrl={whatsappUrl}
            onReschedule={onReschedule}
            onScheduleFollowUp={
              onScheduleFollowUp
            }
            onCloseOpportunity={
              onCloseOpportunity
            }
            followUpExists
          />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 text-sm font-semibold text-red-600">
        <UserX size={17} />
        Ausência registrada.
      </div>

      <div className="mt-4 rounded-lg border border-line bg-white p-4 sm:p-5">
        <p className="font-semibold text-ink">
          Não deixe essa família
          sem resposta.
        </p>

        <p className="mt-1 text-sm text-muted">
          Entre em contato com a família
          e defina o próximo passo.
        </p>

        <NoShowActionButtons
          whatsappUrl={whatsappUrl}
          onReschedule={onReschedule}
          onScheduleFollowUp={
            onScheduleFollowUp
          }
          onCloseOpportunity={
            onCloseOpportunity
          }
        />
      </div>
    </div>
  );
}

function NoShowActionButtons({
  whatsappUrl,
  onReschedule,
  onScheduleFollowUp,
  onCloseOpportunity,
  followUpExists = false,
}) {
  return (
    <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      {whatsappUrl && (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2 rounded-lg border border-line bg-white px-4 py-3 text-sm font-semibold text-neutral-700 transition hover:bg-canvas"
        >
          <MessageCircle size={17} />
          {followUpExists
            ? "WhatsApp"
            : "Chamar no WhatsApp"}
        </a>
      )}

      

      <button
        type="button"
        onClick={onReschedule}
        className="flex items-center justify-center gap-2 rounded-lg bg-inter-red px-4 py-3 text-sm font-semibold text-white transition hover:bg-inter-red-dark"
      >
        <CalendarPlus size={17} />
        Reagendar experimental
      </button>

      <button
        type="button"
        onClick={onScheduleFollowUp}
        className="flex items-center justify-center gap-2 rounded-lg border border-line bg-white px-4 py-3 text-sm font-semibold text-ink transition hover:bg-white"
      >
        <CalendarClock size={17} />
        {followUpExists
          ? "Alterar retorno"
          : "Programar retorno"}
      </button>

      <button
        type="button"
        onClick={onCloseOpportunity}
        className="flex items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-3 text-sm font-semibold text-neutral-700 transition hover:bg-canvas"
      >
        <ArchiveX size={17} />
        Encerrar
      </button>
    </div>
  );
}

export function AttendedActions({
  commercialResult,
  contact,
  onOpenResult,
}) {
  if (
    commercialResult === "enrolled" ||
    contact.status === "enrolled"
  ) {
    return (
      <div className="flex items-center gap-2 text-sm font-semibold text-ok">
        <GraduationCap size={17} />
        Compareceu e matriculou.
      </div>
    );
  }

  if (
    commercialResult === "follow_up" ||
    contact.status === "follow_up"
  ) {
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink">
          <PhoneCall size={17} />
          Compareceu. Retorno agendado.
        </div>

        {contact.follow_up_date && (
          <p className="text-sm text-muted">
            Próximo contato:{" "}
            <strong>
              {formatShortDate(
                contact.follow_up_date
              )}
            </strong>
          </p>
        )}
      </div>
    );
  }

  if (
    commercialResult === "lost" ||
    contact.status === "lost"
  ) {
    return (
      <div className="flex items-center gap-2 text-sm font-semibold text-neutral-600">
        <XCircle size={17} />
        Compareceu e não vai seguir.
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 text-sm font-semibold text-ok">
        <UserCheck size={17} />
        Presença registrada.
      </div>

      <div className="mt-4 rounded-lg border border-line bg-canvas p-4 sm:p-5">
        <p className="font-semibold text-ink">
          Aguardando decisão da família
        </p>

        <p className="mt-1 text-sm text-muted">
          Quando houver uma definição,
          registre o resultado.
        </p>

        <button
          type="button"
          onClick={onOpenResult}
          className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
        >
          <GraduationCap size={17} />
          Registrar resultado
        </button>
      </div>
    </div>
  );
}
