import { GraduationCap, MessageCircle, RotateCcw, XCircle } from "lucide-react";

import FollowUpProgress from "./FollowUpProgress";
import {
  createWhatsAppUrl,
  daysBetweenDates,
  formatContactDate,
} from "../../../helpers/contactPresentation";

import { getFollowUpState } from "../../../helpers/followUpRules";
import ContactInfo from "../contacts/ContactInfo";

/* =========================================================
 * COMPONENTE
 * =======================================================*/

export default function FollowUpCard({ item, today, onAction }) {
  const whatsappUrl = createWhatsAppUrl(item.phone);

  const followUpState = getFollowUpState(item);

  const isOverdue = Boolean(item.follow_up_date) && item.follow_up_date < today;

  const isToday = item.follow_up_date === today;

  const daysLate = isOverdue ? daysBetweenDates(item.follow_up_date, today) : 0;

  return (
    <article
      className={`
        overflow-hidden
        rounded-2xl
        border
        bg-white
        transition
        hover:shadow-md
        ${
          followUpState.limitReached
            ? "border-red-300"
            : isOverdue
              ? "border-red-200"
              : "border-neutral-200"
        }
      `}
    >
      <div className="p-5 sm:p-6">
        {/* =================================================
         * CABEÇALHO
         * =============================================== */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {item.category?.name && (
                <span className="text-sm font-semibold text-red-600">
                  {item.category.name}
                </span>
              )}

              {item.experimental_date && (
                <>
                  <span className="text-neutral-300">•</span>

                  <span className="text-sm text-neutral-500">
                    Experimental em {formatDate(item.experimental_date)}
                  </span>
                </>
              )}
            </div>

            <h3 className="mt-2 text-xl font-bold text-neutral-900">
              {item.child_name}
            </h3>
          </div>

          <FollowUpBadge
            isOverdue={isOverdue}
            isToday={isToday}
            daysLate={daysLate}
            date={item.follow_up_date}
            limitReached={followUpState.limitReached}
          />
        </div>

        {/* =================================================
         * DADOS DO CONTATO
         * =============================================== */}

        <div className="mt-6 grid gap-5 border-t border-neutral-100 pt-5 sm:grid-cols-2 lg:grid-cols-4">
         <ContactInfo
  label="Responsável"
  value={item.responsible_name}
/>

<ContactInfo
  label="WhatsApp"
  value={item.phone}
/>

<ContactInfo
  label="Retorno"
  value={formatContactDate(
    item.follow_up_date,
  )}
/>

<ContactInfo
  label="Origem"
  value={item.source}
/>
        </div>

        {/* =================================================
         * CICLO DE FOLLOW-UP
         * =============================================== */}

        <FollowUpProgress contact={item} />

        {/* =================================================
         * OBSERVAÇÕES
         * =============================================== */}

        {item.internal_notes && (
          <div className="mt-5 rounded-2xl bg-neutral-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
              Observação
            </p>

            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-neutral-700">
              {item.internal_notes}
            </p>
          </div>
        )}

        {/* =================================================
         * AÇÕES
         * =============================================== */}

        <div className="mt-6 flex flex-col gap-2 border-t border-neutral-100 pt-5 sm:flex-row sm:flex-wrap">
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
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
                text-neutral-700
                transition
                hover:bg-neutral-50
              "
            >
              <MessageCircle size={17} />
              WhatsApp
            </a>
          )}

          <button
            type="button"
            onClick={() => onAction(item, "enroll")}
            className="
              flex
              items-center
              justify-center
              gap-2
              rounded-xl
              bg-green-600
              px-4
              py-3
              text-sm
              font-semibold
              text-white
              transition
              hover:bg-green-700
            "
          >
            <GraduationCap size={17} />
            Matriculou
          </button>

          {followUpState.canReschedule && (
            <button
              type="button"
              onClick={() => onAction(item, "reschedule")}
              className="
                flex
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-neutral-900
                px-4
                py-3
                text-sm
                font-semibold
                text-white
                transition
                hover:bg-neutral-800
              "
            >
              <RotateCcw size={17} />
              Reagendar retorno
            </button>
          )}

          <button
            type="button"
            onClick={() => onAction(item, "lose")}
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
              text-neutral-700
              transition
              hover:bg-neutral-50
            "
          >
            <XCircle size={17} />

            {followUpState.limitReached
              ? "Encerrar oportunidade"
              : "Não converteu"}
          </button>
        </div>
      </div>
    </article>
  );
}

/* =========================================================
 * BADGE
 * =======================================================*/

function FollowUpBadge({ isOverdue, isToday, daysLate, date, limitReached }) {
  if (limitReached) {
    return (
      <span className="w-fit rounded-full bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700">
        Limite atingido
      </span>
    );
  }

  if (isOverdue) {
    return (
      <span className="w-fit rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700">
        {daysLate === 1 ? "Atrasado 1 dia" : `Atrasado ${daysLate} dias`}
      </span>
    );
  }

  if (isToday) {
    return (
      <span className="w-fit rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
        Retorno hoje
      </span>
    );
  }

  return (
    <span className="w-fit rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
      {formatDate(date)}
    </span>
  );
}

/* =========================================================
 * INFO
 * =======================================================*/

function Info({ label, value }) {
  if (!value) {
    return null;
  }

  return (
    <div className="min-w-0">
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-semibold text-neutral-900">
        {value}
      </p>
    </div>
  );
}

