// src/admin/components/followUps/WaitingListCard.jsx

import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  HelpCircle,
  MessageCircle,
  XCircle,
} from "lucide-react";

import ContactInfo from "../contacts/ContactInfo";

import {
  FOLLOW_UP_ACTION,
} from "../../../constants/followUpActions";

import {
  INTEREST_QUALIFICATION,
} from "../../../constants/interestQualification";

import {
  PREFERRED_SHIFT_LABELS,
} from "../../../constants/preferredShift";

import {
  WAITING_REASON_CARD_LABELS,
} from "../../../constants/waitingListReasons";

import {
  createWhatsAppUrl,
  formatContactDateTime,
} from "../../../helpers/contactPresentation";

import {
  getWaitingListQualification,
} from "../../../helpers/waitingListRules";

/* =========================================================
 * COMPONENTE
 * =======================================================*/

export default function WaitingListCard({
  item,
  onAction,
}) {
  const whatsappUrl =
    createWhatsAppUrl(item.phone);

  const waitingReasonLabel =
    getWaitingReasonLabel(
      item.waiting_list_reason,
    );

  const qualification =
    getWaitingListQualification(item);

  const categoryName =
    qualification.category?.name || null;

  const preferredShiftLabel =
    qualification.preferredShift
      ? PREFERRED_SHIFT_LABELS[
          qualification.preferredShift
        ] || qualification.preferredShift
      : null;

  return (
    <article
      className="
        overflow-hidden
        rounded-2xl
        border
        border-purple-200
        bg-white
        transition
        hover:shadow-md
      "
    >
      <div className="p-5 sm:p-6">
        {/* =================================================
         * CABEÇALHO
         * =============================================== */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {categoryName && (
                <span className="text-sm font-semibold text-purple-600">
                  {categoryName}
                </span>
              )}

              {preferredShiftLabel && (
                <>
                  {categoryName && (
                    <span className="text-neutral-300">
                      •
                    </span>
                  )}

                  <span className="text-sm font-semibold text-purple-600">
                    {preferredShiftLabel}
                  </span>
                </>
              )}

              {item.waiting_list_at && (
                <>
                  {(categoryName ||
                    preferredShiftLabel) && (
                    <span className="text-neutral-300">
                      •
                    </span>
                  )}

                  <span className="text-sm text-neutral-500">
                    Na lista desde{" "}
                    {formatContactDateTime(
                      item.waiting_list_at,
                    )}
                  </span>
                </>
              )}
            </div>

            <h3 className="mt-2 text-xl font-bold text-neutral-900">
              {item.child_name ||
                "Criança não informada"}
            </h3>

            <div className="mt-3 flex flex-wrap gap-2">
              <span className="w-fit rounded-full bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700">
                Lista de interesse
              </span>

              <QualificationBadge
                status={qualification.status}
              />
            </div>
          </div>
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
            label="Categoria de interesse"
            value={categoryName}
          />

          <ContactInfo
            label="Turno desejado"
            value={preferredShiftLabel}
          />

          <ContactInfo
            label="Origem"
            value={item.source}
          />
        </div>

        {/* =================================================
         * DADOS FALTANTES
         * =============================================== */}

        {qualification.hasMissingFields && (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex gap-3">
              <AlertTriangle
                size={19}
                className="mt-0.5 shrink-0 text-amber-700"
              />

              <div>
                <p className="text-sm font-semibold text-amber-900">
                  Cadastro incompleto
                </p>

                <p className="mt-1 text-sm leading-6 text-amber-800">
                  Falta completar:{" "}
                  {qualification.missingFields.join(
                    ", ",
                  )}
                  .
                </p>
              </div>
            </div>
          </div>
        )}

        {!qualification.hasCategory && (
          <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex gap-3">
              <AlertTriangle
                size={19}
                className="mt-0.5 shrink-0 text-amber-700"
              />

              <div>
                <p className="text-sm font-semibold text-amber-900">
                  Categoria não definida
                </p>

                <p className="mt-1 text-sm leading-6 text-amber-800">
                  Confirme qual categoria a
                  família procura antes de
                  qualificar este interesse.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* =================================================
         * MOTIVO DA LISTA
         * =============================================== */}

        <div className="mt-5 rounded-2xl border border-purple-100 bg-purple-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-purple-500">
            Interesse
          </p>

          <p className="mt-2 text-sm font-semibold text-purple-900">
            {waitingReasonLabel}
          </p>

          {item.waiting_list_notes && (
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-purple-800">
              {item.waiting_list_notes}
            </p>
          )}
        </div>

        {/* =================================================
         * OBSERVAÇÕES INTERNAS
         * =============================================== */}

        {item.internal_notes && (
          <div className="mt-5 rounded-2xl bg-neutral-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
              Histórico interno
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
            onClick={() =>
              onAction(
                item,
                FOLLOW_UP_ACTION.SCHEDULE_EXPERIMENTAL,
              )
            }
            className="
              flex
              items-center
              justify-center
              gap-2
              rounded-xl
              bg-purple-600
              px-4
              py-3
              text-sm
              font-semibold
              text-white
              transition
              hover:bg-purple-700
            "
          >
            <CalendarDays size={17} />
            Agendar experimental
          </button>

          <button
            type="button"
            onClick={() =>
              onAction(
                item,
                FOLLOW_UP_ACTION.CLOSE_WAITING_LIST,
              )
            }
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
            Encerrar interesse
          </button>
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
    status ===
    INTEREST_QUALIFICATION.COMPLETE
  ) {
    return (
      <span className="flex w-fit items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
        <CheckCircle2 size={14} />
        Cadastro qualificado
      </span>
    );
  }

  if (
    status ===
    INTEREST_QUALIFICATION.NEEDS_CONFIRMATION
  ) {
    return (
      <span className="flex w-fit items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
        <HelpCircle size={14} />
        Precisa confirmar
      </span>
    );
  }

  return (
    <span className="flex w-fit items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
      <AlertTriangle size={14} />
      Cadastro incompleto
    </span>
  );
}

/* =========================================================
 * HELPERS DE APRESENTAÇÃO
 * =======================================================*/

function getWaitingReasonLabel(reason) {
  if (!reason) {
    return "Interesse registrado";
  }

  return (
    WAITING_REASON_CARD_LABELS?.[reason] ||
    reason
  );
}