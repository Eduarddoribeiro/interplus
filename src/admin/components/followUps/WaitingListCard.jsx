// src/admin/components/followUps/WaitingListCard.jsx

import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardPenLine,
  HelpCircle,
  MessageCircle,
  XCircle,
} from "lucide-react";

import { FOLLOW_UP_ACTION } from "../../../constants/followUpActions";

import { INTEREST_QUALIFICATION } from "../../../constants/interestQualification";

import { PREFERRED_SHIFT_LABELS } from "../../../constants/preferredShift";

import {
  PREFERRED_DAY_SHORT_LABELS,
} from "../../../constants/preferredDays";

import { WAITING_REASON_CARD_LABELS } from "../../../constants/waitingListReasons";

import {
  createWhatsAppUrl,
  formatContactDateTime,
} from "../../../helpers/contactPresentation";

import { getWaitingListQualification } from "../../../helpers/waitingListRules";

/* =========================================================
 * COMPONENTE
 * =======================================================*/

export default function WaitingListCard({
  item,
  onAction,
  onDetails,
}) {
  const whatsappUrl = createWhatsAppUrl(item.phone);

  const qualification = getWaitingListQualification(item);

  const categoryName =
    qualification.category?.name || null;

  const preferredShiftLabel =
    qualification.preferredShift
      ? PREFERRED_SHIFT_LABELS[
          qualification.preferredShift
        ] || qualification.preferredShift
      : null;

  const preferredDays =
    Array.isArray(item.preferred_days)
      ? item.preferred_days
      : [];

  const preferredDaysLabel = preferredDays
    .map(
      (day) =>
        PREFERRED_DAY_SHORT_LABELS[day] || day,
    )
    .join("/");

  const waitingTimeLabel = getWaitingTimeLabel(
    item.waiting_list_at,
  );

  const waitingReasonLabel =
    getWaitingReasonLabel(
      item.waiting_list_reason,
    );

  /* =======================================================
   * RENDER
   * =====================================================*/

  return (
    <article
      className="
        rounded-2xl
        border
        border-neutral-200
        bg-white
        transition
        hover:border-neutral-300
        hover:shadow-sm
      "
    >
      <div className="p-4 sm:p-5">
        {/* =================================================
         * LINHA PRINCIPAL
         * =============================================== */}

        <div
          className="
            flex
            flex-col
            gap-4
            xl:flex-row
            xl:items-center
            xl:justify-between
          "
        >
          {/* INFORMAÇÕES */}

          <div className="min-w-0 flex-1">
            {/* NOME + QUALIFICAÇÃO */}

            <div
              className="
                flex
                flex-wrap
                items-center
                gap-2
              "
            >
              <h3
                className="
                  truncate
                  text-base
                  font-bold
                  text-neutral-900
                  sm:text-lg
                "
              >
                {item.child_name ||
                  "Criança não informada"}
              </h3>

              <QualificationBadge
                status={qualification.status}
              />
            </div>

            {/* RESUMO COMERCIAL */}

            <div
              className="
                mt-2
                flex
                flex-wrap
                items-center
                gap-x-2
                gap-y-1
                text-sm
                text-neutral-500
              "
            >
              {categoryName && (
                <StrongInfo>
                  {categoryName}
                </StrongInfo>
              )}

              {preferredShiftLabel && (
                <>
                  <Separator />

                  <span>
                    {preferredShiftLabel}
                  </span>
                </>
              )}

              {preferredDaysLabel && (
                <>
                  <Separator />

                  <span>
                    {preferredDaysLabel}
                  </span>
                </>
              )}

              {waitingTimeLabel && (
                <>
                  <Separator />

                  <span>{waitingTimeLabel}</span>
                </>
              )}
            </div>

            {/* RESPONSÁVEL + WHATSAPP */}

            <div
              className="
                mt-2
                flex
                flex-wrap
                items-center
                gap-x-2
                gap-y-1
                text-xs
                text-neutral-500
              "
            >
              {item.responsible_name && (
                <span>
                  {item.responsible_name}
                </span>
              )}

              {item.phone && (
                <>
                  {item.responsible_name && (
                    <Separator />
                  )}

                  <span>{item.phone}</span>
                </>
              )}

              {waitingReasonLabel && (
                <>
                  {(item.responsible_name ||
                    item.phone) && <Separator />}

                  <span
                    className="
                      truncate
                      text-purple-600
                    "
                  >
                    {waitingReasonLabel}
                  </span>
                </>
              )}
            </div>

            {/* ALERTA COMPACTO */}

            {(qualification.hasMissingFields ||
              !qualification.hasCategory) && (
              <div
                className="
                  mt-3
                  flex
                  flex-wrap
                  items-center
                  gap-2
                  text-xs
                  font-medium
                  text-amber-700
                "
              >
                <AlertTriangle
                  size={14}
                  className="shrink-0"
                />

                {!qualification.hasCategory
                  ? "Categoria precisa ser definida"
                  : `Falta: ${qualification.missingFields.join(
                      ", ",
                    )}`}
              </div>
            )}
          </div>

          {/* =================================================
           * AÇÕES
           * =============================================== */}

          <div
            className="
              flex
              shrink-0
              flex-wrap
              items-center
              gap-2
            "
          >
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                onClick={(event) =>
                  event.stopPropagation()
                }
                className="
                  inline-flex
                  h-10
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  border
                  border-neutral-200
                  bg-white
                  px-3
                  text-sm
                  font-semibold
                  text-neutral-700
                  transition
                  hover:bg-neutral-50
                "
              >
                <MessageCircle size={16} />

                <span className="hidden sm:inline">
                  WhatsApp
                </span>
              </a>
            )}

            <button
              type="button"
              onClick={() =>
                onAction(
                  item,
                  FOLLOW_UP_ACTION.QUALIFY,
                )
              }
              className="
                inline-flex
                h-10
                items-center
                justify-center
                gap-2
                rounded-xl
                border
                border-purple-200
                bg-white
                px-3
                text-sm
                font-semibold
                text-purple-700
                transition
                hover:bg-purple-50
              "
            >
              <ClipboardPenLine size={16} />

              <span className="hidden sm:inline">
                Qualificar
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                onAction(
                  item,
                  FOLLOW_UP_ACTION.SCHEDULE_EXPERIMENTAL,
                )
              }
              className="
                inline-flex
                h-10
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-purple-600
                px-3
                text-sm
                font-semibold
                text-white
                transition
                hover:bg-purple-700
              "
            >
              <CalendarDays size={16} />

              <span className="hidden sm:inline">
                Agendar
              </span>
            </button>

            {/* DETALHES */}

            {typeof onDetails === "function" && (
              <button
                type="button"
                onClick={() => onDetails(item)}
                className="
                  inline-flex
                  h-10
                  items-center
                  justify-center
                  gap-1
                  rounded-xl
                  border
                  border-neutral-200
                  px-3
                  text-sm
                  font-semibold
                  text-neutral-600
                  transition
                  hover:bg-neutral-50
                  hover:text-neutral-900
                "
              >
                <span className="hidden sm:inline">
                  Detalhes
                </span>

                <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

/* =========================================================
 * BADGE DE QUALIFICAÇÃO
 * =======================================================*/

function QualificationBadge({ status }) {
  if (
    status === INTEREST_QUALIFICATION.COMPLETE
  ) {
    return (
      <span
        className="
          inline-flex
          items-center
          gap-1
          rounded-full
          bg-green-50
          px-2
          py-1
          text-[11px]
          font-semibold
          text-green-700
        "
      >
        <CheckCircle2 size={12} />
        Qualificado
      </span>
    );
  }

  if (
    status ===
    INTEREST_QUALIFICATION.NEEDS_CONFIRMATION
  ) {
    return (
      <span
        className="
          inline-flex
          items-center
          gap-1
          rounded-full
          bg-blue-50
          px-2
          py-1
          text-[11px]
          font-semibold
          text-blue-700
        "
      >
        <HelpCircle size={12} />
        Confirmar
      </span>
    );
  }

  return (
    <span
      className="
        inline-flex
        items-center
        gap-1
        rounded-full
        bg-amber-50
        px-2
        py-1
        text-[11px]
        font-semibold
        text-amber-700
      "
    >
      <AlertTriangle size={12} />
      Incompleto
    </span>
  );
}

/* =========================================================
 * PEQUENOS COMPONENTES
 * =======================================================*/

function Separator() {
  return (
    <span
      aria-hidden="true"
      className="text-neutral-300"
    >
      •
    </span>
  );
}

function StrongInfo({ children }) {
  return (
    <span className="font-semibold text-purple-700">
      {children}
    </span>
  );
}

/* =========================================================
 * HELPERS
 * =======================================================*/

function getWaitingReasonLabel(reason) {
  if (!reason) {
    return null;
  }

  return (
    WAITING_REASON_CARD_LABELS?.[reason] ||
    reason
  );
}

function getWaitingTimeLabel(waitingListAt) {
  if (!waitingListAt) {
    return null;
  }

  const start = new Date(waitingListAt);

  if (Number.isNaN(start.getTime())) {
    return null;
  }

  const now = new Date();

  const milliseconds =
    now.getTime() - start.getTime();

  const days = Math.max(
    0,
    Math.floor(
      milliseconds / (1000 * 60 * 60 * 24),
    ),
  );

  if (days === 0) {
    return "Entrou hoje";
  }

  if (days === 1) {
    return "1 dia na lista";
  }

  return `${days} dias na lista`;
}